import sophie from './events/sophies-last-rodeo.js'
import cazAndDan from './events/caz-and-dan.js'

// Bundled theme configs (copy, palette, images), keyed by theme.
// These move into the database in step 2.
const bundled = {
  [sophie.key]: sophie,
  [cazAndDan.key]: cazAndDan,
}

// The Worker writes the event for this web address into index.html:
//   an object -> the event at this address
//   null      -> no event at this address
//   missing   -> no Worker in front (old per-event builds, or `vite` dev),
//                so fall back to VITE_EVENT as before.
const hasWindow = typeof window !== 'undefined'
const runtime = hasWindow && '__ODC_EVENT__' in window ? window.__ODC_EVENT__ : undefined

export const eventMissing = runtime === null

const fallbackKey = import.meta.env.VITE_EVENT || 'sophies-last-rodeo'

const noEvent = {
  key: 'none',
  slug: 'none',
  title: 'Online Disposable Camera',
  shortTitle: 'Online Disposable Camera',
  maxShots: 25,
  copy: { landing: {}, camera: {}, finished: {} },
  palette: {},
}

function buildConfig() {
  if (runtime === null) return noEvent
  if (runtime === undefined) return bundled[fallbackKey] || sophie

  const base = bundled[runtime.theme] || bundled[runtime.slug] || sophie
  return {
    ...base,
    // The database is the source of truth for these.
    slug: runtime.slug,
    title: runtime.title || base.title,
    maxShots: Number(runtime.maxShots || base.maxShots || 25),
    galleryUnlockAt: runtime.galleryUnlockAt || base.galleryUnlockAt,
    eventDate: runtime.eventDate,
    settings: runtime.settings || {},
  }
}

export const eventConfig = buildConfig()
export const availableEvents = bundled
