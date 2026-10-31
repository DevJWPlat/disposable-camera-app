// Ready-made themes. Each one is a set of views (wired up in the router)
// driven by settings stored per event. Bespoke designs (Caz & Dan, Sophie)
// keep their own config in src/config/events/ for now.
import softFilm from './soft-film/settings.js'
import afterDark from './after-dark/settings.js'

export const themes = {
  [softFilm.key]: softFilm,
  [afterDark.key]: afterDark,
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

// Event settings win over theme defaults. Arrays (like photos) are merged
// item by item, so an event can set just the photo files and keep the captions.
export function mergeSettings(defaults, overrides) {
  if (Array.isArray(defaults) && Array.isArray(overrides)) {
    const length = Math.max(defaults.length, overrides.length)
    return Array.from({ length }, (_, i) => mergeSettings(defaults[i], overrides[i]))
  }
  if (isPlainObject(defaults) && isPlainObject(overrides)) {
    const out = { ...defaults }
    for (const [key, value] of Object.entries(overrides)) {
      out[key] = key in defaults ? mergeSettings(defaults[key], value) : value
    }
    return out
  }
  return overrides === undefined || overrides === null || overrides === '' ? defaults : overrides
}
