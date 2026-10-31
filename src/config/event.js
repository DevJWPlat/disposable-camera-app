import sophie from './events/sophies-last-rodeo.js'
import cazAndDan from './events/caz-and-dan.js'
import { themes, mergeSettings } from '@/themes/index.js'

// Bespoke designs with their own bundled config (copy, palette, images).
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
  settings: {},
}

function buildConfig() {
  if (runtime === null) return noEvent
  if (runtime === undefined) return bundled[fallbackKey] || sophie

  const common = {
    slug: runtime.slug,
    title: runtime.title,
    maxShots: Number(runtime.maxShots || 25),
    galleryUnlockAt: runtime.galleryUnlockAt || null,
    eventDate: runtime.eventDate,
  }

  // Ready-made theme: everything comes from theme defaults plus event settings.
  const theme = themes[runtime.theme]
  if (theme) {
    return {
      key: theme.key,
      themeMeta: theme,
      ...common,
      settings: mergeSettings(theme.defaults, runtime.settings || {}),
    }
  }

  // Bespoke design: bundled config, with the database winning where it has a value.
  const base = bundled[runtime.theme] || bundled[runtime.slug] || sophie
  return {
    ...base,
    ...common,
    title: runtime.title || base.title,
    maxShots: Number(runtime.maxShots || base.maxShots || 25),
    galleryUnlockAt: runtime.galleryUnlockAt || base.galleryUnlockAt,
    settings: runtime.settings || {},
  }
}

export const eventConfig = buildConfig()
export const availableEvents = bundled
