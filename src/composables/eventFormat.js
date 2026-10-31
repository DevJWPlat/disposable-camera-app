// Small helpers every theme uses for dates, images and copy.
import { eventConfig } from '@/config/event.js'

const TZ = 'Europe/London'

function parts(isoDate) {
  const match = String(isoDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? { y: match[1], m: match[2], d: match[3] } : null
}

// "2027-08-12" -> "12 . 08 . 27"
export function dotDate(isoDate) {
  const p = parts(isoDate)
  return p ? `${p.d} . ${p.m} . ${p.y.slice(2)}` : ''
}

// "2027-08-12" -> "'27 8 12", like an old film date stamp
export function filmStamp(isoDate) {
  const p = parts(isoDate)
  return p ? `'${p.y.slice(2)} ${Number(p.m)} ${Number(p.d)}` : ''
}

// ISO timestamp -> "11 October 2026 at 9:00am" (UK time)
export function longDateTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const day = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' }).format(date)
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true })
    .format(date)
    .replace(/\s/g, '')
    .toLowerCase()
  return `${day} at ${time}`
}

// ISO date or timestamp -> "10 January 2027" (UK time)
export function longDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

// A photo uploaded for this event, or a full URL.
export function imageUrl(src) {
  if (!src) return ''
  if (/^(https?:)?\/\//.test(src) || src.startsWith('/') || src.startsWith('data:')) return src
  return `/api/event/image/${encodeURIComponent(src)}`
}

// Replaces {names} and {shots} in theme copy.
export function fillCopy(text) {
  return String(text || '')
    // Non-breaking spaces keep a name like "Olivia & James" on one line.
    .replaceAll('{names}', (eventConfig.title || '').replace(/ /g, '\u00a0'))
    .replaceAll('{shots}', String(eventConfig.maxShots || 25))
}

export function galleryIsOpen(now = Date.now()) {
  if (!eventConfig.galleryUnlockAt) return true
  const at = Date.parse(eventConfig.galleryUnlockAt)
  return Number.isNaN(at) || now >= at
}
