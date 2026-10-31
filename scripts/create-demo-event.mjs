// Creates (or refreshes) a theme's demo event and uploads its sample photos.
//
//   node scripts/create-demo-event.mjs soft-film [--local]
//
// Demo events live at <slug>.onlinedisposablecamera.co.uk with the gallery
// already open, so every screen can be shown.

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const DB = 'odc-events-db'
const BUCKET = 'odc-event-photos'

const DEMOS = {
  'soft-film': {
    slug: 'soft-film-demo',
    title: 'Ellie’s 30th',
    eventDate: '2027-06-19',
    maxShots: 25,
    settings: {
      photos: [
        { src: 'party-1.jpg', caption: 'make a wish' },
        { src: 'party-2.jpg', caption: 'cheers!' },
      ],
      copy: { heading: 'GARDEN PARTY' },
      guestSharing: true,
    },
    files: ['party-1.jpg', 'party-2.jpg', 'party-3.jpg'],
  },
  'after-dark': {
    slug: 'after-dark-demo',
    title: 'Hannah’s Last Night Out',
    eventDate: '2027-05-15',
    maxShots: 25,
    settings: {
      heroPhoto: 'night-1.jpg',
      guestSharing: true,
    },
    files: ['night-1.jpg', 'night-2.jpg', 'night-3.jpg'],
  },
  'classic-editorial': {
    slug: 'classic-editorial-demo',
    title: 'Olivia & James',
    eventDate: '2027-08-14',
    maxShots: 25,
    settings: {
      heroPhoto: 'couple-1.jpg',
      guestSharing: true,
    },
    files: ['couple-1.jpg', 'couple-2.jpg'],
  },
}

const args = process.argv.slice(2)
const local = args.includes('--local')
const theme = args.find((a) => !a.startsWith('--'))
const demo = DEMOS[theme]
if (!demo) {
  console.error(`Usage: node scripts/create-demo-event.mjs <${Object.keys(DEMOS).join('|')}> [--local]`)
  process.exit(1)
}

const where = local ? '--local' : '--remote'
const esc = (v) => String(v).replaceAll("'", "''")
const wrangler = (a) => execFileSync('npx', ['wrangler', ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
const query = (sql) => JSON.parse(wrangler(['d1', 'execute', DB, where, '--json', '--command', sql]))[0]?.results || []

const now = new Date().toISOString()
query(`INSERT INTO events (slug, title, event_date, max_shots, is_active, theme, settings_json, gallery_unlock_at, storage_until, created_at, updated_at)
       VALUES ('${demo.slug}', '${esc(demo.title)}', '${demo.eventDate}', ${demo.maxShots}, 1, '${theme}', '${esc(JSON.stringify(demo.settings))}', '2026-01-01T00:00:00.000Z', '2099-12-31T23:59:59.000Z', '${now}', '${now}')
       ON CONFLICT(slug) DO UPDATE SET title = excluded.title, event_date = excluded.event_date, max_shots = excluded.max_shots,
         theme = excluded.theme, settings_json = excluded.settings_json, gallery_unlock_at = excluded.gallery_unlock_at, updated_at = excluded.updated_at`)
const [{ id }] = query(`SELECT id FROM events WHERE slug = '${demo.slug}'`)
const hostname = `${demo.slug}.onlinedisposablecamera.co.uk`
query(`INSERT OR IGNORE INTO event_domains (hostname, event_id, is_primary, created_at) VALUES ('${hostname}', ${id}, 1, '${now}')`)

for (const file of demo.files) {
  const path = `demo/${theme}/${file}`
  if (!existsSync(path)) throw new Error(`Missing ${path}`)
  wrangler(['r2', 'object', 'put', `${BUCKET}/events/${id}/theme/${file}`, '--file', path, '--content-type', 'image/jpeg', where])
  console.log(`  uploaded ${file}`)
}

console.log(`${demo.title} (${theme}) is event ${id}`)
console.log(local ? `  Local: http://localhost:8787/__dev/event/${demo.slug}` : `  Live:  https://${hostname}`)
