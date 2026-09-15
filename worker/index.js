
function corsHeaders(request) {
  const origin = request.headers.get('Origin')
  return {
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  }
}

function json(request, data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
      ...extraHeaders,
    },
  })
}

function textResponse(request, text, status = 200, extraHeaders = {}) {
  return new Response(text, {
    status,
    headers: {
      ...corsHeaders(request),
      ...extraHeaders,
    },
  })
}

function parseCookies(request) {
  const header = request.headers.get('Cookie') || ''
  return Object.fromEntries(
    header.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
      const index = part.indexOf('=')
      return index === -1 ? [part, ''] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))]
    }),
  )
}

function cookieName(env) {
  return env.ADMIN_COOKIE_NAME || 'camera_admin_session'
}

function sessionCookie(env, token, maxAge = 60 * 60 * 24 * 7) {
  return `${cookieName(env)}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}

function clearSessionCookie(env) {
  return `${cookieName(env)}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256(value) {
  return bytesToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
}

async function hashPassword(password, saltHex = null, iterations = 120000) {
  const salt = saltHex
    ? Uint8Array.from(saltHex.match(/.{1,2}/g).map((value) => parseInt(value, 16)))
    : crypto.getRandomValues(new Uint8Array(16))

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    keyMaterial,
    256,
  )

  return {
    hash: bytesToHex(derived),
    salt: bytesToHex(salt),
    iterations,
  }
}

async function getEvent(env) {
  const slug = env.EVENT_SLUG
  if (!slug) return null
  return env.DB.prepare(
    `SELECT id, slug, couple_names, wedding_date, max_shots, is_active
     FROM events
     WHERE slug = ? AND is_active = 1
     LIMIT 1`,
  ).bind(slug).first()
}

async function requireAdmin(request, env) {
  const token = parseCookies(request)[cookieName(env)]
  if (!token) return null

  const tokenHash = await sha256(token)
  const now = new Date().toISOString()

  const session = await env.DB.prepare(
    `SELECT
       s.id AS session_id,
       s.event_id,
       s.admin_user_id,
       s.expires_at,
       u.email,
       u.status
     FROM admin_sessions s
     JOIN admin_users u ON u.id = s.admin_user_id
     WHERE s.token_hash = ?
       AND s.revoked_at IS NULL
       AND s.expires_at > ?
       AND u.status = 'active'
     LIMIT 1`,
  ).bind(tokenHash, now).first()

  if (!session) return null

  const event = await getEvent(env)
  if (!event || Number(event.id) !== Number(session.event_id)) return null

  await env.DB.prepare(
    `UPDATE admin_sessions SET last_used_at = ? WHERE id = ?`,
  ).bind(now, session.session_id).run()

  return {
    id: session.admin_user_id,
    email: session.email,
    eventId: session.event_id,
    sessionId: session.session_id,
  }
}

async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}


const ZIP_CRC_TABLE = (() => {
  const table = new Uint32Array(256)

  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }

  return table
})()

function zipCrc32Update(crc, bytes) {
  let value = crc >>> 0

  for (let i = 0; i < bytes.length; i += 1) {
    value = ZIP_CRC_TABLE[(value ^ bytes[i]) & 0xff] ^ (value >>> 8)
  }

  return value >>> 0
}

function zipDosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear())

  return {
    time:
      ((date.getHours() & 0x1f) << 11) |
      ((date.getMinutes() & 0x3f) << 5) |
      ((Math.floor(date.getSeconds() / 2)) & 0x1f),
    date:
      (((year - 1980) & 0x7f) << 9) |
      (((date.getMonth() + 1) & 0x0f) << 5) |
      (date.getDate() & 0x1f),
  }
}

function zipBytes(length, writer) {
  const bytes = new Uint8Array(length)
  const view = new DataView(bytes.buffer)
  writer(view)
  return bytes
}

function zipExtension(key) {
  const match = String(key || '').toLowerCase().match(/\.([a-z0-9]{1,5})$/)
  const extension = match?.[1] || 'jpg'
  return /^[a-z0-9]{1,5}$/.test(extension) ? extension : 'jpg'
}

function streamPhotoZip(env, photos) {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      let written = 0
      const centralEntries = []

      const enqueue = (bytes) => {
        controller.enqueue(bytes)
        written += bytes.byteLength
      }

      try {
        for (let index = 0; index < photos.length; index += 1) {
          const photo = photos[index]
          const object = await env.PHOTOS.get(photo.r2_key)

          if (!object?.body) {
            throw new Error(`Photo ${photo.id} could not be read from storage`)
          }

          const extension = zipExtension(photo.r2_key)
          const filename = `photo-${String(index + 1).padStart(4, '0')}.${extension}`
          const nameBytes = encoder.encode(filename)
          const stamp = zipDosDateTime(photo.uploaded_at ? new Date(photo.uploaded_at) : new Date())
          const localOffset = written

          const localHeader = zipBytes(30 + nameBytes.length, (view) => {
            let offset = 0
            view.setUint32(offset, 0x04034b50, true); offset += 4
            view.setUint16(offset, 20, true); offset += 2
            view.setUint16(offset, 0x0008, true); offset += 2
            view.setUint16(offset, 0, true); offset += 2
            view.setUint16(offset, stamp.time, true); offset += 2
            view.setUint16(offset, stamp.date, true); offset += 2
            view.setUint32(offset, 0, true); offset += 4
            view.setUint32(offset, 0, true); offset += 4
            view.setUint32(offset, 0, true); offset += 4
            view.setUint16(offset, nameBytes.length, true); offset += 2
            view.setUint16(offset, 0, true); offset += 2
            new Uint8Array(view.buffer, offset, nameBytes.length).set(nameBytes)
          })

          enqueue(localHeader)

          const reader = object.body.getReader()
          let crc = 0xffffffff
          let size = 0

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            if (!value?.byteLength) continue

            crc = zipCrc32Update(crc, value)
            size += value.byteLength
            enqueue(value)
          }

          crc = (crc ^ 0xffffffff) >>> 0

          const descriptor = zipBytes(16, (view) => {
            view.setUint32(0, 0x08074b50, true)
            view.setUint32(4, crc, true)
            view.setUint32(8, size >>> 0, true)
            view.setUint32(12, size >>> 0, true)
          })
          enqueue(descriptor)

          centralEntries.push({
            nameBytes,
            crc,
            size: size >>> 0,
            offset: localOffset >>> 0,
            time: stamp.time,
            date: stamp.date,
          })
        }

        const centralStart = written

        for (const entry of centralEntries) {
          const centralHeader = zipBytes(46 + entry.nameBytes.length, (view) => {
            let offset = 0
            view.setUint32(offset, 0x02014b50, true); offset += 4
            view.setUint16(offset, 20, true); offset += 2
            view.setUint16(offset, 20, true); offset += 2
            view.setUint16(offset, 0x0008, true); offset += 2
            view.setUint16(offset, 0, true); offset += 2
            view.setUint16(offset, entry.time, true); offset += 2
            view.setUint16(offset, entry.date, true); offset += 2
            view.setUint32(offset, entry.crc, true); offset += 4
            view.setUint32(offset, entry.size, true); offset += 4
            view.setUint32(offset, entry.size, true); offset += 4
            view.setUint16(offset, entry.nameBytes.length, true); offset += 2
            view.setUint16(offset, 0, true); offset += 2
            view.setUint16(offset, 0, true); offset += 2
            view.setUint16(offset, 0, true); offset += 2
            view.setUint16(offset, 0, true); offset += 2
            view.setUint32(offset, 0, true); offset += 4
            view.setUint32(offset, entry.offset, true); offset += 4
            new Uint8Array(view.buffer, offset, entry.nameBytes.length).set(entry.nameBytes)
          })

          enqueue(centralHeader)
        }

        const centralSize = written - centralStart
        const count = centralEntries.length

        const end = zipBytes(22, (view) => {
          view.setUint32(0, 0x06054b50, true)
          view.setUint16(4, 0, true)
          view.setUint16(6, 0, true)
          view.setUint16(8, count, true)
          view.setUint16(10, count, true)
          view.setUint32(12, centralSize >>> 0, true)
          view.setUint32(16, centralStart >>> 0, true)
          view.setUint16(20, 0, true)
        })

        enqueue(end)
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) })
    }

    if (url.pathname === '/api/health' && request.method === 'GET') {
      const event = await getEvent(env)
      return json(request, {
        ok: true,
        event: event?.slug || null,
        hasDb: !!env.DB,
        hasPhotosBucket: !!env.PHOTOS,
      })
    }

    if (url.pathname === '/api/session/start' && request.method === 'POST') {
      try {
        const body = await readJson(request)
        const deviceToken = typeof body.deviceToken === 'string' ? body.deviceToken.trim() : ''

        if (!deviceToken || deviceToken.length > 100) {
          return json(request, { ok: false, error: 'Invalid device token' }, 400)
        }

        const event = await getEvent(env)
        if (!event) {
          return json(request, { ok: false, error: 'Event is not available' }, 404)
        }

        const existing = await env.DB.prepare(
          `SELECT id, event_id, device_token, shots_taken, shots_remaining, status, created_at, updated_at
           FROM sessions
           WHERE event_id = ? AND device_token = ?
           LIMIT 1`,
        ).bind(event.id, deviceToken).first()

        if (existing) return json(request, { ok: true, session: existing })

        const sessionId = crypto.randomUUID()
        const now = new Date().toISOString()
        const maxShots = Number(event.max_shots || 25)

        await env.DB.prepare(
          `INSERT INTO sessions (
             id, event_id, device_token, guest_name, shots_taken, shots_remaining,
             status, created_at, updated_at
           ) VALUES (?, ?, ?, NULL, 0, ?, 'active', ?, ?)`,
        ).bind(sessionId, event.id, deviceToken, maxShots, now, now).run()

        const session = await env.DB.prepare(
          `SELECT id, event_id, device_token, shots_taken, shots_remaining, status, created_at, updated_at
           FROM sessions WHERE id = ? LIMIT 1`,
        ).bind(sessionId).first()

        return json(request, { ok: true, session })
      } catch (error) {
        return json(request, { ok: false, error: error?.message || 'Could not start session' }, 500)
      }
    }

    if (url.pathname === '/api/photo/upload' && request.method === 'POST') {
      try {
        const formData = await request.formData()
        const sessionId = formData.get('sessionId')
        const file = formData.get('photo')
        const thumbnailFile = formData.get('thumbnail')

        if (typeof sessionId !== 'string' || !(file instanceof File)) {
          return json(request, { ok: false, error: 'Invalid upload' }, 400)
        }

        const event = await getEvent(env)
        if (!event) return json(request, { ok: false, error: 'Event is not available' }, 404)

        const session = await env.DB.prepare(
          `SELECT id, event_id, shots_taken, shots_remaining, status
           FROM sessions WHERE id = ? AND event_id = ? LIMIT 1`,
        ).bind(sessionId, event.id).first()

        if (!session) return json(request, { ok: false, error: 'Session not found' }, 404)
        if (session.shots_remaining <= 0 || session.status !== 'active') {
          return json(request, { ok: false, error: 'No shots remaining' }, 400)
        }

        const photoId = crypto.randomUUID()
        const now = new Date().toISOString()
        const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
        const r2Key = `event-${event.id}/session-${session.id}/${photoId}.${extension || 'jpg'}`

        await env.PHOTOS.put(r2Key, file.stream(), {
          httpMetadata: { contentType: file.type || 'image/jpeg' },
        })

        let thumbnailR2Key = null
        if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
          thumbnailR2Key = `thumb/event-${event.id}/session-${session.id}/${photoId}.jpg`
          await env.PHOTOS.put(thumbnailR2Key, thumbnailFile.stream(), {
            httpMetadata: { contentType: 'image/jpeg' },
          })
        }

        await env.DB.prepare(
          `INSERT INTO photos (id, event_id, session_id, r2_key, thumbnail_r2_key, uploaded_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).bind(photoId, event.id, session.id, r2Key, thumbnailR2Key, now).run()

        const nextTaken = Number(session.shots_taken) + 1
        const nextRemaining = Math.max(Number(session.shots_remaining) - 1, 0)
        const status = nextRemaining === 0 ? 'completed' : 'active'

        await env.DB.prepare(
          `UPDATE sessions
           SET shots_taken = ?, shots_remaining = ?, status = ?, updated_at = ?
           WHERE id = ? AND event_id = ?`,
        ).bind(nextTaken, nextRemaining, status, now, session.id, event.id).run()

        const updatedSession = await env.DB.prepare(
          `SELECT id, event_id, device_token, shots_taken, shots_remaining, status, created_at, updated_at
           FROM sessions WHERE id = ? LIMIT 1`,
        ).bind(session.id).first()

        return json(request, {
          ok: true,
          photo: { id: photoId },
          session: updatedSession,
        })
      } catch (error) {
        return json(request, { ok: false, error: error?.message || 'Upload failed' }, 500)
      }
    }


    if (url.pathname === '/api/session/secret-preview' && request.method === 'GET') {
      try {
        const sessionId = String(url.searchParams.get('sessionId') || '').trim()
        const deviceToken = String(url.searchParams.get('deviceToken') || '').trim()

        if (!sessionId || !deviceToken) {
          return json(request, { ok: false, error: 'Missing session details' }, 400)
        }

        const event = await getEvent(env)
        if (!event) return json(request, { ok: false, error: 'Event is not available' }, 404)

        const session = await env.DB.prepare(
          `SELECT id, event_id, device_token, shots_remaining, status, preview_photo_id
           FROM sessions
           WHERE id = ? AND event_id = ? AND device_token = ?
           LIMIT 1`,
        ).bind(sessionId, event.id, deviceToken).first()

        if (!session) return json(request, { ok: false, error: 'Session not found' }, 404)
        if (Number(session.shots_remaining) > 0) {
          return json(request, { ok: false, error: 'Finish your roll before unlocking a preview' }, 403)
        }

        return json(request, {
          ok: true,
          unlocked: Boolean(session.preview_photo_id),
          imageUrl: session.preview_photo_id
            ? `${url.origin}/api/session/secret-preview/image?sessionId=${encodeURIComponent(sessionId)}&deviceToken=${encodeURIComponent(deviceToken)}`
            : null,
        })
      } catch (error) {
        return json(request, { ok: false, error: error?.message || 'Could not check preview' }, 500)
      }
    }

    if (url.pathname === '/api/session/secret-preview' && request.method === 'POST') {
      try {
        const body = await readJson(request)
        const sessionId = String(body.sessionId || '').trim()
        const deviceToken = String(body.deviceToken || '').trim()

        if (!sessionId || !deviceToken) {
          return json(request, { ok: false, error: 'Missing session details' }, 400)
        }

        const event = await getEvent(env)
        if (!event) return json(request, { ok: false, error: 'Event is not available' }, 404)

        const session = await env.DB.prepare(
          `SELECT id, event_id, device_token, shots_remaining, status, preview_photo_id
           FROM sessions
           WHERE id = ? AND event_id = ? AND device_token = ?
           LIMIT 1`,
        ).bind(sessionId, event.id, deviceToken).first()

        if (!session) return json(request, { ok: false, error: 'Session not found' }, 404)
        if (Number(session.shots_remaining) > 0) {
          return json(request, { ok: false, error: 'Finish your roll before unlocking a preview' }, 403)
        }

        let previewPhotoId = session.preview_photo_id

        if (!previewPhotoId) {
          let photo = await env.DB.prepare(
            `SELECT id
             FROM photos
             WHERE event_id = ? AND session_id <> ?
             ORDER BY RANDOM()
             LIMIT 1`,
          ).bind(event.id, session.id).first()

          // If nobody else has uploaded yet, still give them one permanent preview
          // from the event rather than leaving the feature broken.
          if (!photo) {
            photo = await env.DB.prepare(
              `SELECT id
               FROM photos
               WHERE event_id = ?
               ORDER BY RANDOM()
               LIMIT 1`,
            ).bind(event.id).first()
          }

          if (!photo) {
            return json(request, {
              ok: false,
              error: 'No photographs are available to preview yet. Try again a little later.',
            }, 404)
          }

          const now = new Date().toISOString()
          await env.DB.prepare(
            `UPDATE sessions
             SET preview_photo_id = COALESCE(preview_photo_id, ?), updated_at = ?
             WHERE id = ? AND event_id = ?`,
          ).bind(photo.id, now, session.id, event.id).run()

          const updated = await env.DB.prepare(
            `SELECT preview_photo_id FROM sessions WHERE id = ? AND event_id = ? LIMIT 1`,
          ).bind(session.id, event.id).first()

          previewPhotoId = updated?.preview_photo_id || photo.id
        }

        return json(request, {
          ok: true,
          unlocked: true,
          imageUrl: `${url.origin}/api/session/secret-preview/image?sessionId=${encodeURIComponent(sessionId)}&deviceToken=${encodeURIComponent(deviceToken)}`,
        })
      } catch (error) {
        return json(request, { ok: false, error: error?.message || 'Could not unlock preview' }, 500)
      }
    }

    if (url.pathname === '/api/session/secret-preview/image' && request.method === 'GET') {
      try {
        const sessionId = String(url.searchParams.get('sessionId') || '').trim()
        const deviceToken = String(url.searchParams.get('deviceToken') || '').trim()

        if (!sessionId || !deviceToken) return textResponse(request, 'Image not found', 404)

        const event = await getEvent(env)
        if (!event) return textResponse(request, 'Image not found', 404)

        const photo = await env.DB.prepare(
          `SELECT p.r2_key
           FROM sessions s
           JOIN photos p ON p.id = s.preview_photo_id AND p.event_id = s.event_id
           WHERE s.id = ? AND s.event_id = ? AND s.device_token = ?
           LIMIT 1`,
        ).bind(sessionId, event.id, deviceToken).first()

        if (!photo?.r2_key) return textResponse(request, 'Image not found', 404)

        const object = await env.PHOTOS.get(photo.r2_key)
        if (!object) return textResponse(request, 'Image not found', 404)

        const headers = new Headers(corsHeaders(request))
        object.writeHttpMetadata(headers)
        headers.set('etag', object.httpEtag)
        headers.set('Cache-Control', 'private, no-store')

        return new Response(object.body, { headers })
      } catch {
        return textResponse(request, 'Image not found', 404)
      }
    }

    if (url.pathname === '/api/admin/setup/verify' && request.method === 'POST') {
      const body = await readJson(request)
      const email = String(body.email || '').trim().toLowerCase()
      const token = String(body.token || '')
      const event = await getEvent(env)
      if (!event || !email || !token) return json(request, { ok: false, error: 'Invalid setup request' }, 400)

      const tokenHash = await sha256(token)
      const invite = await env.DB.prepare(
        `SELECT id FROM admin_invites
         WHERE event_id = ? AND LOWER(email) = ? AND token_hash = ?
           AND used_at IS NULL AND expires_at > ?
         LIMIT 1`,
      ).bind(event.id, email, tokenHash, new Date().toISOString()).first()

      if (!invite) return json(request, { ok: false, error: 'This invite is invalid or has expired' }, 401)
      return json(request, { ok: true })
    }

    if (url.pathname === '/api/admin/setup/activate' && request.method === 'POST') {
      const body = await readJson(request)
      const email = String(body.email || '').trim().toLowerCase()
      const token = String(body.token || '')
      const password = String(body.password || '')
      const event = await getEvent(env)

      if (!event || !email || !token || password.length < 10) {
        return json(request, { ok: false, error: 'Invalid account setup details' }, 400)
      }

      const tokenHash = await sha256(token)
      const now = new Date().toISOString()

      const invite = await env.DB.prepare(
        `SELECT id FROM admin_invites
         WHERE event_id = ? AND LOWER(email) = ? AND token_hash = ?
           AND used_at IS NULL AND expires_at > ?
         LIMIT 1`,
      ).bind(event.id, email, tokenHash, now).first()

      if (!invite) return json(request, { ok: false, error: 'This invite is invalid or has expired' }, 401)

      const passwordData = await hashPassword(password)
      const user = await env.DB.prepare(
        `SELECT id FROM admin_users WHERE event_id = ? AND LOWER(email) = ? LIMIT 1`,
      ).bind(event.id, email).first()

      const userId = user?.id || crypto.randomUUID()

      if (user) {
        await env.DB.prepare(
          `UPDATE admin_users
           SET password_hash = ?, password_salt = ?, password_iterations = ?,
               status = 'active', activated_at = ?
           WHERE id = ?`,
        ).bind(passwordData.hash, passwordData.salt, passwordData.iterations, now, userId).run()
      } else {
        await env.DB.prepare(
          `INSERT INTO admin_users (
             id, event_id, email, password_hash, password_salt, password_iterations,
             status, created_at, activated_at
           ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        ).bind(
          userId, event.id, email, passwordData.hash, passwordData.salt,
          passwordData.iterations, now, now,
        ).run()
      }

      await env.DB.prepare(`UPDATE admin_invites SET used_at = ? WHERE id = ?`)
        .bind(now, invite.id).run()

      return json(request, { ok: true })
    }

    if (url.pathname === '/api/admin/login' && request.method === 'POST') {
      const body = await readJson(request)
      const email = String(body.email || '').trim().toLowerCase()
      const password = String(body.password || '')
      const event = await getEvent(env)

      if (!event || !email || !password) {
        return json(request, { ok: false, error: 'Invalid login details' }, 401)
      }

      const user = await env.DB.prepare(
        `SELECT id, email, password_hash, password_salt, password_iterations, status
         FROM admin_users
         WHERE event_id = ? AND LOWER(email) = ?
         LIMIT 1`,
      ).bind(event.id, email).first()

      if (!user || user.status !== 'active' || !user.password_hash) {
        return json(request, { ok: false, error: 'Invalid login details' }, 401)
      }

      const candidate = await hashPassword(password, user.password_salt, Number(user.password_iterations || 120000))
      if (candidate.hash !== user.password_hash) {
        return json(request, { ok: false, error: 'Invalid login details' }, 401)
      }

      const token = crypto.randomUUID() + crypto.randomUUID()
      const tokenHash = await sha256(token)
      const sessionId = crypto.randomUUID()
      const now = new Date()
      const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      await env.DB.prepare(
        `INSERT INTO admin_sessions (
           id, event_id, admin_user_id, token_hash, expires_at,
           created_at, last_used_at, revoked_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
      ).bind(
        sessionId, event.id, user.id, tokenHash, expires.toISOString(),
        now.toISOString(), now.toISOString(),
      ).run()

      await env.DB.prepare(`UPDATE admin_users SET last_login_at = ? WHERE id = ?`)
        .bind(now.toISOString(), user.id).run()

      return json(request, {
        ok: true,
        admin: { id: user.id, email: user.email },
      }, 200, { 'Set-Cookie': sessionCookie(env, token) })
    }

    if (url.pathname === '/api/admin/logout' && request.method === 'POST') {
      const token = parseCookies(request)[cookieName(env)]
      if (token) {
        const tokenHash = await sha256(token)
        await env.DB.prepare(
          `UPDATE admin_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL`,
        ).bind(new Date().toISOString(), tokenHash).run()
      }

      return json(request, { ok: true }, 200, { 'Set-Cookie': clearSessionCookie(env) })
    }

    if (url.pathname.startsWith('/api/admin/')) {
      const admin = await requireAdmin(request, env)
      if (!admin) {
        return json(request, { ok: false, error: 'Your admin session has expired' }, 401, {
          'Set-Cookie': clearSessionCookie(env),
        })
      }

      if (url.pathname === '/api/admin/me' && request.method === 'GET') {
        return json(request, { ok: true, admin: { id: admin.id, email: admin.email } })
      }

      if (url.pathname === '/api/admin/stats' && request.method === 'GET') {
        const event = await getEvent(env)
        const photoResult = await env.DB.prepare(
          `SELECT COUNT(*) AS count, MAX(uploaded_at) AS latest FROM photos WHERE event_id = ?`,
        ).bind(event.id).first()
        const sessionResult = await env.DB.prepare(
          `SELECT COUNT(*) AS count FROM sessions WHERE event_id = ?`,
        ).bind(event.id).first()

        return json(request, {
          ok: true,
          photos: Number(photoResult?.count || 0),
          sessions: Number(sessionResult?.count || 0),
          maxShots: Number(event.max_shots || 25),
          latestUpload: photoResult?.latest || null,
        })
      }

      if (url.pathname === '/api/admin/photos' && request.method === 'GET') {
        const results = await env.DB.prepare(
          `SELECT id, uploaded_at, thumbnail_r2_key
           FROM photos
           WHERE event_id = ?
           ORDER BY uploaded_at DESC`,
        ).bind(admin.eventId).all()

        const photos = (results.results || []).map((photo) => ({
          id: photo.id,
          uploaded_at: photo.uploaded_at,
          imageUrl: `${url.origin}/api/admin/image?id=${encodeURIComponent(photo.id)}&variant=original`,
          thumbnailUrl: photo.thumbnail_r2_key
            ? `${url.origin}/api/admin/image?id=${encodeURIComponent(photo.id)}&variant=thumbnail`
            : null,
        }))

        return json(request, { ok: true, photos })
      }

      if (url.pathname === '/api/admin/download-zip' && request.method === 'POST') {
        const body = await readJson(request)
        const rawIds = Array.isArray(body.ids) ? body.ids : []
        const ids = [...new Set(rawIds.map((id) => String(id || '').trim()).filter(Boolean))]

        if (!ids.length) {
          return json(request, { ok: false, error: 'Select at least one photo' }, 400)
        }

        if (ids.length > 5000) {
          return json(request, { ok: false, error: 'Too many photos selected for one download' }, 400)
        }

        const results = await env.DB.prepare(
          `SELECT id, r2_key, uploaded_at
           FROM photos
           WHERE event_id = ?
           ORDER BY uploaded_at DESC`,
        ).bind(admin.eventId).all()

        const byId = new Map((results.results || []).map((photo) => [String(photo.id), photo]))
        const photos = ids.map((id) => byId.get(id)).filter(Boolean)

        if (!photos.length) {
          return json(request, { ok: false, error: 'The selected photos could not be found' }, 404)
        }

        const headers = new Headers(corsHeaders(request))
        headers.set('Content-Type', 'application/zip')
        headers.set('Content-Disposition', 'attachment; filename="sophies-last-rodeo-photos.zip"')
        headers.set('Cache-Control', 'no-store')
        headers.set('X-Content-Type-Options', 'nosniff')

        return new Response(streamPhotoZip(env, photos), { headers })
      }

      if (url.pathname === '/api/admin/image' && request.method === 'GET') {
        const photoId = url.searchParams.get('id')
        const variant = url.searchParams.get('variant') === 'thumbnail' ? 'thumbnail' : 'original'

        const photo = await env.DB.prepare(
          `SELECT r2_key, thumbnail_r2_key
           FROM photos
           WHERE id = ? AND event_id = ?
           LIMIT 1`,
        ).bind(photoId, admin.eventId).first()

        if (!photo) return textResponse(request, 'Image not found', 404)

        const key = variant === 'thumbnail' ? photo.thumbnail_r2_key : photo.r2_key
        if (!key) return textResponse(request, 'Image not found', 404)

        const object = await env.PHOTOS.get(key)
        if (!object) return textResponse(request, 'Image not found', 404)

        const headers = new Headers(corsHeaders(request))
        object.writeHttpMetadata(headers)
        headers.set('etag', object.httpEtag)
        headers.set('Cache-Control', 'private, max-age=300')

        return new Response(object.body, { headers })
      }

      return json(request, { ok: false, error: 'Admin route not found' }, 404)
    }

    return env.ASSETS.fetch(request)
  },
}
