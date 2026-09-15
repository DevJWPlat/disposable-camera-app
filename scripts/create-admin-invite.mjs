import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)

const eventKey = args[0]
const rawEmail = args[1]
const modeArg = args.find((arg) => arg === '--local' || arg === '--remote')
const mode = modeArg || '--remote'

const deployments = {
  'sophies-last-rodeo': {
    config: 'wrangler.sophie.jsonc',
    database: 'sophies-last-rodeo-db',
  },
  'caz-and-dan': {
    config: 'wrangler.caz-and-dan.jsonc',
    database: 'caz-and-dan-db',
  },
}

if (!eventKey || !rawEmail || !deployments[eventKey]) {
  console.error(
    'Usage: npm run admin:invite -- <sophies-last-rodeo|caz-and-dan> <email> [--local|--remote]',
  )
  process.exit(1)
}

const email = rawEmail.trim().toLowerCase()
const deployment = deployments[eventKey]

const token = randomBytes(32).toString('base64url')
const tokenHash = createHash('sha256').update(token).digest('hex')

const now = new Date()
const expires = new Date(
  now.getTime() + 48 * 60 * 60 * 1000,
)

const escapeSql = (value) =>
  String(value).replaceAll("'", "''")

const sql = `
INSERT OR IGNORE INTO admin_users (
  id,
  event_id,
  email,
  status,
  created_at
)
SELECT
  '${randomUUID()}',
  id,
  '${escapeSql(email)}',
  'invited',
  '${now.toISOString()}'
FROM events
WHERE slug = '${escapeSql(eventKey)}';

INSERT INTO admin_invites (
  id,
  event_id,
  email,
  token_hash,
  expires_at,
  used_at,
  created_at
)
SELECT
  '${randomUUID()}',
  id,
  '${escapeSql(email)}',
  '${tokenHash}',
  '${expires.toISOString()}',
  NULL,
  '${now.toISOString()}'
FROM events
WHERE slug = '${escapeSql(eventKey)}';
`

execFileSync(
  'npx',
  [
    'wrangler',
    'd1',
    'execute',
    deployment.database,
    mode,
    '--config',
    deployment.config,
    '--command',
    sql,
  ],
  {
    stdio: 'inherit',
  },
)

console.log('')
console.log(
  `Admin invite created (${mode === '--local' ? 'local' : 'remote'}):`,
)

const setupPath =
  `/admin/setup?token=${encodeURIComponent(token)}`

console.log(`Setup path: ${setupPath}`)

if (mode === '--local') {
  console.log(
    `Open: http://localhost:8787${setupPath}`,
  )
} else {
  console.log(
    'Add this path to the deployed event URL before sending it to the admin.',
  )
}

console.log(`Email: ${email}`)
console.log(`Expires: ${expires.toISOString()}`)