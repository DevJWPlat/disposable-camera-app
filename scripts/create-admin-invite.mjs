// Creates an organiser invite for an event in the single app's database.
//
//   npm run admin:invite -- <slug> <email> [--local]
//
// Prints the setup link to send to the organiser. Links last 48 hours.

import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const DB = 'odc-events-db'
const APP_DOMAIN = 'onlinedisposablecamera.co.uk'

const args = process.argv.slice(2)
const local = args.includes('--local')
const [slug, rawEmail] = args.filter((a) => !a.startsWith('--'))

if (!/^[a-z0-9-]+$/.test(slug || '') || !rawEmail) {
  console.error('Usage: npm run admin:invite -- <slug> <email> [--local]')
  process.exit(1)
}

const email = rawEmail.trim().toLowerCase()
const esc = (v) => String(v).replaceAll("'", "''")
const mode = local ? '--local' : '--remote'

function query(sql) {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', DB, mode, '--json', '--command', sql], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return JSON.parse(out)[0]?.results || []
}

const [event] = query(`SELECT id, title FROM events WHERE slug = '${esc(slug)}'`)
if (!event) {
  console.error(`No event called ${slug} in ${DB} (${local ? 'local' : 'remote'}).`)
  process.exit(1)
}

const token = randomBytes(32).toString('base64url')
const tokenHash = createHash('sha256').update(token).digest('hex')
const now = new Date()
const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000)

query(`INSERT OR IGNORE INTO admin_users (id, event_id, email, status, created_at)
       VALUES ('${randomUUID()}', ${event.id}, '${esc(email)}', 'invited', '${now.toISOString()}')`)
query(`INSERT INTO admin_invites (id, event_id, email, token_hash, expires_at, used_at, created_at)
       VALUES ('${randomUUID()}', ${event.id}, '${esc(email)}', '${tokenHash}', '${expires.toISOString()}', NULL, '${now.toISOString()}')`)

const [primary] = query(`SELECT hostname FROM event_domains WHERE event_id = ${event.id} ORDER BY is_primary DESC LIMIT 1`)
const host = local ? 'http://localhost:8787' : `https://${primary?.hostname || `${slug}.${APP_DOMAIN}`}`
const link = `${host}/admin/setup?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

console.log(`Invite for ${event.title} (${local ? 'local' : 'live'})`)
console.log(`  Email:   ${email}`)
console.log(`  Link:    ${link}`)
console.log(`  Expires: ${expires.toISOString()}`)
