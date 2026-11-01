// Admin builder API (step 5), served only at admin.<APP_DOMAIN>.
//
// Cloudflare Access sits in front of the admin address and emails the owner a
// sign-in code. Every request here is ALSO checked: the Access token must be
// validly signed by our Access team, meant for our Access application, unexpired,
// and for an email in OWNER_EMAILS. If any of ACCESS_TEAM_DOMAIN, ACCESS_AUD or
// OWNER_EMAILS is missing, the builder stays locked.

const RESERVED = new Set(['admin', 'www', 'api', 'app', 'mail', 'email', 'send', 'rsend', 'status', 'help', 'support', 'blog', 'static', 'assets', 'cdn', 'demo', 'test'])
const THEMES = new Set(['soft-film', 'after-dark', 'classic-editorial'])
const MAX_PHOTO_BYTES = 8 * 1024 * 1024
const INVITE_DAYS = 7

export function isReservedSlug(slug) {
  return RESERVED.has(slug)
}

// ---------- Access token check ----------

let certCache = { at: 0, keys: [] }

function b64urlToBytes(value) {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4)
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

function b64urlToJson(value) {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(value)))
}

async function accessKeys(env) {
  if (Date.now() - certCache.at < 60 * 60 * 1000 && certCache.keys.length) return certCache.keys
  const response = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`)
  if (!response.ok) throw new Error('Could not load Access keys')
  const data = await response.json()
  certCache = { at: Date.now(), keys: data.keys || [] }
  return certCache.keys
}

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return ''
}

export async function verifyOwner(request, env) {
  const team = String(env.ACCESS_TEAM_DOMAIN || '').trim()
  const aud = String(env.ACCESS_AUD || '').trim()
  const owners = String(env.OWNER_EMAILS || '').toLowerCase().split(',').map((e) => e.trim()).filter(Boolean)
  if (!team || !aud || !owners.length) return null

  const token = request.headers.get('Cf-Access-Jwt-Assertion') || readCookie(request, 'CF_Authorization')
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const header = b64urlToJson(parts[0])
    const payload = b64urlToJson(parts[1])
    if (header.alg !== 'RS256') return null

    const jwk = (await accessKeys(env)).find((k) => k.kid === header.kid)
    if (!jwk) return null
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`))
    if (!valid) return null

    const now = Math.floor(Date.now() / 1000)
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    if (!audiences.includes(aud)) return null
    if (!payload.exp || payload.exp < now) return null
    if (payload.iss !== `https://${team}`) return null
    const email = String(payload.email || '').toLowerCase()
    if (!owners.includes(email)) return null
    return { email }
  } catch {
    return null
  }
}

// ---------- Helpers ----------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

const fail = (error, status = 400) => json({ ok: false, error }, status)

async function readBody(request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

function parseSettings(text) {
  try {
    const value = JSON.parse(text || '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

function isoOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && !Number.isNaN(Date.parse(value))
}

async function hashToken(token) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function eventHost(env, event) {
  const row = await env.DB.prepare(`SELECT hostname FROM event_domains WHERE event_id = ? ORDER BY is_primary DESC LIMIT 1`).bind(event.id).first()
  return row?.hostname || `${event.slug}.${env.APP_DOMAIN}`
}

async function eventSummary(env, event) {
  const counts = await env.DB.prepare(
    `SELECT (SELECT COUNT(*) FROM photos WHERE event_id = ?) AS photos,
            (SELECT COUNT(*) FROM sessions WHERE event_id = ?) AS guests,
            (SELECT COUNT(*) FROM admin_users WHERE event_id = ? AND status = 'active') AS organisers`,
  ).bind(event.id, event.id, event.id).first()
  return {
    slug: event.slug,
    title: event.title,
    theme: event.theme,
    eventDate: event.event_date,
    maxShots: Number(event.max_shots),
    isActive: Number(event.is_active) === 1,
    galleryUnlockAt: event.gallery_unlock_at,
    storageUntil: event.storage_until,
    purgedAt: event.purged_at || null,
    settings: parseSettings(event.settings_json),
    host: await eventHost(env, event),
    photos: Number(counts?.photos || 0),
    guests: Number(counts?.guests || 0),
    organisers: Number(counts?.organisers || 0),
  }
}

const EVENT_COLUMNS = `id, slug, title, event_date, max_shots, is_active, theme, settings_json, gallery_unlock_at, storage_until, purged_at`

async function findEvent(env, slug) {
  return env.DB.prepare(`SELECT ${EVENT_COLUMNS} FROM events WHERE slug = ? LIMIT 1`).bind(slug).first()
}

// Checks the editable fields. Returns { values } or { error }.
function validateFields(body, { creating }) {
  const values = {}
  if (creating || 'slug' in body) {
    const slug = String(body.slug || '').trim().toLowerCase()
    if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(slug)) return { error: 'The address must be 3 to 40 letters, numbers or dashes, starting and ending with a letter or number.' }
    if (RESERVED.has(slug)) return { error: `“${slug}” is reserved. Choose another address.` }
    values.slug = slug
  }
  if (creating || 'title' in body) {
    const title = String(body.title || '').trim()
    if (!title || title.length > 80) return { error: 'Give the event a name (up to 80 characters).' }
    values.title = title
  }
  if (creating || 'theme' in body) {
    if (!THEMES.has(body.theme)) return { error: 'Choose a theme.' }
    values.theme = body.theme
  }
  if (creating || 'eventDate' in body) {
    if (!validDate(body.eventDate)) return { error: 'Choose the event date.' }
    values.event_date = body.eventDate
  }
  if (creating || 'maxShots' in body) {
    const shots = Number(body.maxShots)
    if (!Number.isInteger(shots) || shots < 1 || shots > 200) return { error: 'Shots per guest must be between 1 and 200.' }
    values.max_shots = shots
  }
  if ('galleryUnlockAt' in body) {
    const v = isoOrNull(body.galleryUnlockAt)
    if (v === undefined) return { error: 'The gallery reveal time isn’t a valid date.' }
    values.gallery_unlock_at = v
  }
  if ('storageUntil' in body) {
    const v = isoOrNull(body.storageUntil)
    if (v === undefined) return { error: 'The storage end date isn’t valid.' }
    values.storage_until = v
  }
  if ('isActive' in body) values.is_active = body.isActive ? 1 : 0
  if ('settings' in body) {
    if (!body.settings || typeof body.settings !== 'object' || Array.isArray(body.settings)) return { error: 'Settings must be an object.' }
    const text = JSON.stringify(body.settings)
    if (text.length > 20000) return { error: 'Settings are too large.' }
    values.settings_json = text
  }
  return { values }
}

// Three months after the event, at the end of that day.
function defaultStorageUntil(eventDate) {
  const d = new Date(`${eventDate}T23:59:59.000Z`)
  d.setUTCMonth(d.getUTCMonth() + 3)
  return d.toISOString()
}

// ---------- Routes ----------

export async function handleBuilder(request, env, url) {
  const owner = await verifyOwner(request, env)
  if (!owner) return fail('Not signed in.', 403)

  const path = url.pathname.replace(/^\/api\/builder/, '')
  const method = request.method

  if (path === '/me' && method === 'GET') return json({ ok: true, email: owner.email, appDomain: env.APP_DOMAIN })

  if (path === '/events' && method === 'GET') {
    const { results = [] } = await env.DB.prepare(`SELECT ${EVENT_COLUMNS} FROM events ORDER BY event_date DESC, id DESC`).all()
    return json({ ok: true, events: await Promise.all(results.map((e) => eventSummary(env, e))) })
  }

  if (path === '/events' && method === 'POST') {
    const body = await readBody(request)
    const { values, error } = validateFields(body, { creating: true })
    if (error) return fail(error)
    if (await findEvent(env, values.slug)) return fail(`${values.slug}.${env.APP_DOMAIN} is already taken.`, 409)
    const now = new Date().toISOString()
    const storage = values.storage_until || defaultStorageUntil(values.event_date)
    await env.DB.prepare(
      `INSERT INTO events (slug, title, event_date, max_shots, is_active, theme, settings_json, gallery_unlock_at, storage_until, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
    ).bind(values.slug, values.title, values.event_date, values.max_shots, values.theme, values.settings_json || '{"guestSharing":true}', values.gallery_unlock_at ?? null, storage, now, now).run()
    return json({ ok: true, event: await eventSummary(env, await findEvent(env, values.slug)) }, 201)
  }

  const match = path.match(/^\/events\/([a-z0-9-]+)(\/[a-z-]+)?$/)
  if (!match) return fail('Not found.', 404)
  const event = await findEvent(env, match[1])
  if (!event) return fail('No event with that address.', 404)
  const action = match[2] || ''

  if (!action && method === 'GET') return json({ ok: true, event: await eventSummary(env, event) })

  if (!action && method === 'PUT') {
    const body = await readBody(request)
    delete body.slug // addresses never change once created: printed QR codes depend on them
    const { values, error } = validateFields(body, { creating: false })
    if (error) return fail(error)
    const columns = Object.keys(values)
    if (columns.length) {
      await env.DB.prepare(`UPDATE events SET ${columns.map((c) => `${c} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
        .bind(...columns.map((c) => values[c]), new Date().toISOString(), event.id).run()
    }
    return json({ ok: true, event: await eventSummary(env, await findEvent(env, event.slug)) })
  }

  // Design photo upload: raw image body, saved as events/<id>/theme/<name>.
  if (action === '/photo' && method === 'POST') {
    const name = String(url.searchParams.get('name') || '')
    if (!/^[a-z0-9][a-z0-9._-]{0,80}\.(jpg|jpeg|png|webp)$/i.test(name)) return fail('Invalid file name.')
    const type = (request.headers.get('Content-Type') || '').split(';')[0]
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return fail('Upload a JPEG, PNG or WebP image.')
    const bytes = await request.arrayBuffer()
    if (!bytes.byteLength) return fail('The file is empty.')
    if (bytes.byteLength > MAX_PHOTO_BYTES) return fail('That photo is over 8 MB.')
    await env.PHOTOS.put(`events/${event.id}/theme/${name}`, bytes, { httpMetadata: { contentType: type } })
    return json({ ok: true, name })
  }

  // Organiser invite: returns the setup link to send.
  if (action === '/invite' && method === 'POST') {
    const body = await readBody(request)
    const email = String(body.email || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email address.')
    const token = randomToken()
    const now = new Date()
    const expires = new Date(now.getTime() + INVITE_DAYS * 24 * 60 * 60 * 1000)
    await env.DB.batch([
      env.DB.prepare(`INSERT OR IGNORE INTO admin_users (id, event_id, email, status, created_at) VALUES (?, ?, ?, 'invited', ?)`)
        .bind(crypto.randomUUID(), event.id, email, now.toISOString()),
      env.DB.prepare(`INSERT INTO admin_invites (id, event_id, email, token_hash, expires_at, used_at, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?)`)
        .bind(crypto.randomUUID(), event.id, email, await hashToken(token), expires.toISOString(), now.toISOString()),
    ])
    const link = `https://${await eventHost(env, event)}/admin/setup?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
    return json({ ok: true, link, expiresAt: expires.toISOString() })
  }

  return fail('Not found.', 404)
}
