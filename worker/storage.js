// Nightly storage job (step 4). Runs from the Cron Trigger in wrangler.jsonc.
//
// For every event with a storage_until date:
//   - 7 days before: emails the owner a heads-up (once).
//   - once it has passed: deletes the event's photos, thumbnails and design
//     photos from the bucket, removes its guest sessions and photo records,
//     closes the event (is_active = 0) and emails a summary.
//
// STORAGE_DELETION=on is needed to actually delete. Anything else (the
// default) only emails a report of what would be deleted.
//
// The old per-event buckets (caz-and-dan-photos, sophies-last-rodeo-photos)
// are never touched; they're backups to delete by hand.

const DAY = 24 * 60 * 60 * 1000
const REMINDER_DAYS = 7
const MAX_EVENTS_PER_RUN = 5

function ukDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

async function sendEmail(env, subject, text) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) {
    console.log(`[storage] email skipped (no RESEND_API_KEY or NOTIFY_EMAIL): ${subject}\n${text}`)
    return false
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.NOTIFY_FROM || 'Online Disposable Camera <hello@onlinedisposablecamera.co.uk>',
      to: [env.NOTIFY_EMAIL],
      subject,
      text,
    }),
  })
  if (!response.ok) {
    console.log(`[storage] email failed (${response.status}): ${await response.text()}`)
    return false
  }
  return true
}

// Lists every key under a prefix (R2 returns up to 1000 per page).
async function listKeys(bucket, prefix) {
  const keys = []
  let cursor
  do {
    const page = await bucket.list({ prefix, cursor, limit: 1000 })
    for (const object of page.objects) keys.push(object.key)
    cursor = page.truncated ? page.cursor : undefined
  } while (cursor)
  return keys
}

async function countEvent(env, event) {
  const photos = await env.DB.prepare(`SELECT COUNT(*) AS n FROM photos WHERE event_id = ?`).bind(event.id).first()
  const sessions = await env.DB.prepare(`SELECT COUNT(*) AS n FROM sessions WHERE event_id = ?`).bind(event.id).first()
  const keys = await listKeys(env.PHOTOS, `events/${event.id}/`)
  return { photos: Number(photos?.n || 0), sessions: Number(sessions?.n || 0), keys }
}

async function purgeEvent(env, event, keys) {
  for (let i = 0; i < keys.length; i += 1000) {
    await env.PHOTOS.delete(keys.slice(i, i + 1000))
  }
  const now = new Date().toISOString()
  await env.DB.batch([
    env.DB.prepare(`UPDATE sessions SET preview_photo_id = NULL WHERE event_id = ?`).bind(event.id),
    env.DB.prepare(`DELETE FROM photos WHERE event_id = ?`).bind(event.id),
    env.DB.prepare(`DELETE FROM sessions WHERE event_id = ?`).bind(event.id),
    env.DB.prepare(`DELETE FROM gallery_shares WHERE event_id = ?`).bind(event.id),
    env.DB.prepare(`UPDATE admin_sessions SET revoked_at = ? WHERE event_id = ? AND revoked_at IS NULL`).bind(now, event.id),
    env.DB.prepare(`UPDATE events SET is_active = 0, purged_at = ?, updated_at = ? WHERE id = ?`).bind(now, now, event.id),
  ])
}

export async function runStorageJob(env, now = new Date()) {
  const deleting = env.STORAGE_DELETION === 'on'
  const nowIso = now.toISOString()
  const log = []

  // Heads-up a week before.
  const soon = new Date(now.getTime() + REMINDER_DAYS * DAY).toISOString()
  const { results: upcoming = [] } = await env.DB.prepare(
    `SELECT id, slug, title, storage_until FROM events
     WHERE storage_until IS NOT NULL AND purged_at IS NULL AND storage_reminder_sent_at IS NULL
       AND storage_until > ? AND storage_until <= ?
     ORDER BY storage_until`,
  ).bind(nowIso, soon).all()

  for (const event of upcoming) {
    const { photos } = await countEvent(env, event)
    const sent = await sendEmail(
      env,
      `${event.title}: photos due for deletion on ${ukDate(event.storage_until)}`,
      `Hi Jonny,\n\n${event.title} (${event.slug}) has ${photos} photos, due for deletion on ${ukDate(event.storage_until)}.\n\n` +
        `If the organiser has asked for longer, update storage_until for this event before then.\n\n` +
        (deleting ? 'Deletion is switched on, so this will happen automatically.' : 'Deletion is in report-only mode, so nothing will be deleted yet.'),
    )
    if (sent) {
      await env.DB.prepare(`UPDATE events SET storage_reminder_sent_at = ? WHERE id = ?`).bind(nowIso, event.id).run()
    }
    log.push(`reminder ${event.slug}: ${photos} photos, ${sent ? 'emailed' : 'not emailed'}`)
  }

  // Past their storage date.
  const { results: due = [] } = await env.DB.prepare(
    `SELECT id, slug, title, storage_until FROM events
     WHERE storage_until IS NOT NULL AND purged_at IS NULL AND storage_until <= ?
     ORDER BY storage_until
     LIMIT ?`,
  ).bind(nowIso, MAX_EVENTS_PER_RUN).all()

  if (!due.length) {
    log.push('nothing due')
    return log
  }

  const lines = []
  for (const event of due) {
    const { photos, sessions, keys } = await countEvent(env, event)
    if (deleting) {
      await purgeEvent(env, event, keys)
      lines.push(`- ${event.title} (${event.slug}): deleted ${photos} photos, ${keys.length} files and ${sessions} guest records. The event's site is now closed.`)
    } else {
      lines.push(`- ${event.title} (${event.slug}): storage ended ${ukDate(event.storage_until)}. Would delete ${photos} photos, ${keys.length} files and ${sessions} guest records.`)
    }
  }

  await sendEmail(
    env,
    deleting ? `Storage clean-up: ${due.length} event${due.length === 1 ? '' : 's'} deleted` : `Storage report: ${due.length} event${due.length === 1 ? '' : 's'} past their storage date`,
    `Hi Jonny,\n\n${lines.join('\n')}\n\n` +
      (deleting
        ? 'Remember the old per-event buckets are not touched by this job. Delete those by hand once you no longer need them as backups.'
        : 'Report-only mode: nothing has been deleted. To switch deletion on, set STORAGE_DELETION to "on" in wrangler.jsonc and deploy.'),
  )
  log.push(...lines)
  return log
}
