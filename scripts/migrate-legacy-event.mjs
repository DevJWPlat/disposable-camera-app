// One-off move of an old per-event deployment into the single app.
//
//   node scripts/migrate-legacy-event.mjs <slug>                 copy database rows (safe to re-run)
//   node scripts/migrate-legacy-event.mjs <slug> --photos <url>  copy photos (needs MIGRATION_SECRET)
//   node scripts/migrate-legacy-event.mjs <slug> --check         compare old and new
//
// The old database and bucket are only ever read.

import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const NEW_DB = 'odc-events-db'

export const LEGACY_EVENTS = {
  'caz-and-dan': {
    database: 'caz-and-dan-db',
    theme: 'caz-and-dan',
    eventDate: '2026-10-10',
    galleryUnlockAt: '2026-10-11T08:00:00.000Z',
    storageUntil: '2027-01-10T23:59:59.000Z',
    domains: ['caz-and-dan.onlinedisposablecamera.co.uk'],
  },
  'sophies-last-rodeo': {
    database: 'sophies-last-rodeo-db',
    theme: 'sophies-last-rodeo',
    eventDate: '2026-09-19',
    galleryUnlockAt: '2026-09-21T08:00:00.000Z',
    storageUntil: '2026-12-19T23:59:59.000Z',
    domains: ['sophies-last-rodeo.party', 'sophies-last-rodeo.onlinedisposablecamera.co.uk'],
  },
}

// Tables copied, in foreign-key order, with the columns the new schema has.
// admin_sessions and export_jobs are not copied: organisers log in again once.
export const TABLES = {
  sessions: ['id', 'event_id', 'device_token', 'guest_name', 'shots_taken', 'shots_remaining', 'status', 'preview_photo_id', 'created_at', 'updated_at'],
  photos: ['id', 'event_id', 'session_id', 'r2_key', 'thumbnail_r2_key', 'legacy_r2_key', 'legacy_thumbnail_r2_key', 'uploaded_at'],
  admin_users: ['id', 'event_id', 'email', 'password_hash', 'password_salt', 'password_iterations', 'status', 'created_at', 'activated_at', 'last_login_at'],
  admin_invites: ['id', 'event_id', 'email', 'token_hash', 'expires_at', 'used_at', 'created_at'],
  gallery_shares: ['event_id', 'token', 'enabled', 'created_at', 'updated_at'],
}

const KEY_COLUMN = { gallery_shares: 'event_id' }

export function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL'
  return `'${String(value).replaceAll("'", "''")}'`
}

// event-1/session-X/id.jpg       -> events/<id>/photos/session-X/id.jpg
// thumb/event-1/session-X/id.jpg -> events/<id>/thumbs/session-X/id.jpg
export function newPhotoKey(oldKey, newEventId) {
  if (!oldKey) return null
  const thumb = oldKey.match(/^thumb\/event-\d+\/(.+)$/)
  if (thumb) return `events/${newEventId}/thumbs/${thumb[1]}`
  const photo = oldKey.match(/^event-\d+\/(.+)$/)
  if (photo) return `events/${newEventId}/photos/${photo[1]}`
  throw new Error(`Unexpected photo key: ${oldKey}`)
}

export function eventSql(slug, legacyEvent, oldEvent) {
  const now = new Date().toISOString()
  const e = LEGACY_EVENTS[slug]
  const v = sqlValue
  return `INSERT INTO events (slug, title, event_date, max_shots, is_active, theme, settings_json, gallery_unlock_at, storage_until, legacy_source, created_at, updated_at)
VALUES (${v(slug)}, ${v(oldEvent.couple_names)}, ${v(e.eventDate)}, ${v(Number(oldEvent.max_shots))}, 1, ${v(e.theme)}, '{}', ${v(e.galleryUnlockAt)}, ${v(e.storageUntil)}, ${v(e.database)}, ${v(now)}, ${v(now)})
ON CONFLICT(slug) DO UPDATE SET title = excluded.title, max_shots = excluded.max_shots, theme = excluded.theme,
  gallery_unlock_at = excluded.gallery_unlock_at, storage_until = excluded.storage_until, legacy_source = excluded.legacy_source, updated_at = excluded.updated_at;`
}

// Builds idempotent upserts for one event's rows, remapped to the new event id.
export function importSql(slug, newEventId, oldEventId, rowsByTable) {
  const lines = ['PRAGMA defer_foreign_keys = on;']
  const now = new Date().toISOString()

  for (const domain of LEGACY_EVENTS[slug].domains) {
    lines.push(`INSERT INTO event_domains (hostname, event_id, is_primary, created_at) VALUES (${sqlValue(domain)}, ${newEventId}, ${domain === LEGACY_EVENTS[slug].domains[0] ? 1 : 0}, ${sqlValue(now)}) ON CONFLICT(hostname) DO UPDATE SET event_id = excluded.event_id, is_primary = excluded.is_primary;`)
  }

  for (const [table, columns] of Object.entries(TABLES)) {
    const key = KEY_COLUMN[table] || 'id'
    for (const raw of rowsByTable[table] || []) {
      if (Number(raw.event_id) !== Number(oldEventId)) continue
      const row = { ...raw, event_id: newEventId }
      if (table === 'photos') {
        row.legacy_r2_key = raw.r2_key
        row.legacy_thumbnail_r2_key = raw.thumbnail_r2_key || null
        row.r2_key = newPhotoKey(raw.r2_key, newEventId)
        row.thumbnail_r2_key = newPhotoKey(raw.thumbnail_r2_key, newEventId)
      }
      const updates = columns.filter((c) => c !== key).map((c) => `${c} = excluded.${c}`).join(', ')
      lines.push(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map((c) => sqlValue(row[c])).join(', ')}) ON CONFLICT(${key}) DO UPDATE SET ${updates};`)
    }
  }
  return lines.join('\n') + '\n'
}

function wrangler(args, { inherit = false } = {}) {
  return execFileSync('npx', ['wrangler', ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  })
}

function query(database, sql, { optional = false } = {}) {
  try {
    const out = wrangler(['d1', 'execute', database, '--remote', '--json', '--command', sql])
    return JSON.parse(out)[0]?.results || []
  } catch (error) {
    if (optional && /no such table/.test(String(error.stdout || error.message))) return []
    throw new Error(`Query failed on ${database}: ${sql}\n${error.stdout || error.message}`)
  }
}

async function copyDatabase(slug) {
  const e = LEGACY_EVENTS[slug]
  const [oldEvent] = query(e.database, `SELECT * FROM events WHERE slug = ${sqlValue(slug)}`)
  if (!oldEvent) throw new Error(`No ${slug} event in ${e.database}`)

  console.log(`Reading ${e.database}...`)
  const rows = {}
  for (const table of Object.keys(TABLES)) {
    rows[table] = query(e.database, `SELECT * FROM ${table}`, { optional: true })
    console.log(`  ${table}: ${rows[table].length}`)
  }

  const dir = mkdtempSync(join(tmpdir(), 'odc-migrate-'))
  const eventFile = join(dir, 'event.sql')
  writeFileSync(eventFile, eventSql(slug, e, oldEvent))
  console.log(`Writing the event into ${NEW_DB}...`)
  wrangler(['d1', 'execute', NEW_DB, '--remote', `--file=${eventFile}`], { inherit: true })

  const [{ id: newEventId }] = query(NEW_DB, `SELECT id FROM events WHERE slug = ${sqlValue(slug)}`)
  const file = join(dir, 'rows.sql')
  writeFileSync(file, importSql(slug, newEventId, oldEvent.id, rows))
  console.log(`Writing rows into ${NEW_DB} as event ${newEventId}...`)
  wrangler(['d1', 'execute', NEW_DB, '--remote', `--file=${file}`], { inherit: true })
  console.log('Done. Run with --check to compare.')
}

async function copyPhotos(slug, baseUrl) {
  const secret = process.env.MIGRATION_SECRET
  if (!secret) throw new Error('Set MIGRATION_SECRET first')
  let cursor = ''
  const total = { copied: 0, alreadyThere: 0, missingInOld: 0 }
  for (;;) {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/__migrate/copy-photos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, after: cursor }),
    })
    const data = await response.json().catch(() => ({ ok: false, error: `HTTP ${response.status}` }))
    if (!data.ok) throw new Error(data.error || 'Copy failed')
    for (const k of Object.keys(total)) total[k] += data[k] || 0
    process.stdout.write(`\r  copied ${total.copied}, already there ${total.alreadyThere}, missing in old bucket ${total.missingInOld}   `)
    if (!data.next) break
    cursor = data.next
  }
  console.log('\nDone.')
  if (total.missingInOld) console.log('Some photos were missing from the old bucket. Send me this output.')
}

function check(slug) {
  const e = LEGACY_EVENTS[slug]
  const summary = `COUNT(*) AS n`
  const oldEv = query(e.database, `SELECT id FROM events WHERE slug = ${sqlValue(slug)}`)[0]
  const newEv = query(NEW_DB, `SELECT id, title, theme, max_shots, gallery_unlock_at, storage_until FROM events WHERE slug = ${sqlValue(slug)}`)[0]
  if (!newEv) throw new Error(`${slug} is not in ${NEW_DB} yet`)
  console.log(`${slug}: old event ${oldEv.id} -> new event ${newEv.id} (${newEv.title}, theme ${newEv.theme}, ${newEv.max_shots} shots)`)
  let ok = true
  for (const table of Object.keys(TABLES)) {
    const a = query(e.database, `SELECT ${summary} FROM ${table} WHERE event_id = ${oldEv.id}`, { optional: true })[0]?.n || 0
    const b = query(NEW_DB, `SELECT ${summary} FROM ${table} WHERE event_id = ${newEv.id}`)[0]?.n || 0
    console.log(`  ${table.padEnd(15)} old ${String(a).padStart(4)}   new ${String(b).padStart(4)}   ${a === b ? 'OK' : 'DIFFERENT'}`)
    if (a !== b) ok = false
  }
  const shotsOld = query(e.database, `SELECT COALESCE(SUM(shots_taken),0) AS n FROM sessions WHERE event_id = ${oldEv.id}`)[0].n
  const shotsNew = query(NEW_DB, `SELECT COALESCE(SUM(shots_taken),0) AS n FROM sessions WHERE event_id = ${newEv.id}`)[0].n
  console.log(`  shots taken     old ${String(shotsOld).padStart(4)}   new ${String(shotsNew).padStart(4)}   ${shotsOld === shotsNew ? 'OK' : 'DIFFERENT'}`)
  const domains = query(NEW_DB, `SELECT hostname FROM event_domains WHERE event_id = ${newEv.id}`).map((d) => d.hostname)
  console.log(`  addresses       ${domains.join(', ')}`)
  console.log(ok && shotsOld === shotsNew ? 'ALL MATCH' : 'MISMATCH: send me this output')
}

async function main() {
  const [slug, flag, arg] = process.argv.slice(2)
  if (!LEGACY_EVENTS[slug]) {
    console.error(`Usage: node scripts/migrate-legacy-event.mjs <${Object.keys(LEGACY_EVENTS).join('|')}> [--photos <url> | --check]`)
    process.exit(1)
  }
  if (flag === '--check') return check(slug)
  if (flag === '--photos') {
    if (!arg) throw new Error('Give the new Worker address, e.g. https://odc-events.jonny-whittle.workers.dev')
    return copyPhotos(slug, arg)
  }
  return copyDatabase(slug)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exit(1) })
}
