// Temporary organiser login for checking an event on the new app.
//
//   node scripts/test-admin.mjs <slug> add      prints a fresh password
//   node scripts/test-admin.mjs <slug> remove   deletes the login and its sessions
//
// Username for every event: odc-test@onlinedisposablecamera.co.uk

import { execFileSync } from 'node:child_process'
import { pbkdf2Sync, randomBytes, randomUUID } from 'node:crypto'

const DB = 'odc-events-db'
const USERNAME = 'odc-test@onlinedisposablecamera.co.uk'
const [slug, action] = process.argv.slice(2)

if (!/^[a-z0-9-]+$/.test(slug || '') || !['add', 'remove'].includes(action)) {
  console.error('Usage: node scripts/test-admin.mjs <slug> add|remove')
  process.exit(1)
}

const run = (sql) => execFileSync('npx', ['wrangler', 'd1', 'execute', DB, '--remote', '--json', '--command', sql], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
})

const eventId = `(SELECT id FROM events WHERE slug = '${slug}')`

if (action === 'remove') {
  run(`DELETE FROM admin_sessions WHERE admin_user_id IN (SELECT id FROM admin_users WHERE email = '${USERNAME}' AND event_id = ${eventId})`)
  run(`DELETE FROM admin_users WHERE email = '${USERNAME}' AND event_id = ${eventId}`)
  console.log(`Removed the test login for ${slug}.`)
} else {
  const found = JSON.parse(run(`SELECT id FROM events WHERE slug = '${slug}'`))[0].results
  if (!found.length) {
    console.error(`${slug} is not in ${DB}`)
    process.exit(1)
  }
  const password = randomBytes(9).toString('base64url')
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 32, 'sha256').toString('hex')
  const now = new Date().toISOString()
  run(`DELETE FROM admin_users WHERE email = '${USERNAME}' AND event_id = ${eventId}`)
  run(`INSERT INTO admin_users (id, event_id, email, password_hash, password_salt, password_iterations, status, created_at, activated_at)
       VALUES ('${randomUUID()}', ${eventId}, '${USERNAME}', '${hash}', '${salt}', 100000, 'active', '${now}', '${now}')`)
  console.log(`Test login for ${slug}`)
  console.log(`  username: ${USERNAME}`)
  console.log(`  password: ${password}`)
}
