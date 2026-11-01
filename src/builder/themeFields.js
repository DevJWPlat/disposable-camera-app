// What the builder lets you set for each ready-made theme. Paths point into
// the event's settings (e.g. "photos.0.src"); placeholders come from the
// theme's own defaults.
import softFilm from '@/themes/soft-film/settings.js'
import afterDark from '@/themes/after-dark/settings.js'
import classicEditorial from '@/themes/classic-editorial/settings.js'

export const THEME_CHOICES = [
  { key: 'classic-editorial', label: 'Classic Editorial', bestFor: 'Weddings and anniversaries', swatch: ['#f7f5ef', '#111111'] },
  { key: 'soft-film', label: 'Soft Film', bestFor: 'Garden parties and birthdays', swatch: ['#f1e8da', '#b8562e'] },
  { key: 'after-dark', label: 'After Dark', bestFor: 'Hen dos and nights out', swatch: ['#050505', '#c9b2ff'] },
]

const DEFAULTS = { 'soft-film': softFilm.defaults, 'after-dark': afterDark.defaults, 'classic-editorial': classicEditorial.defaults }

export const THEME_FIELDS = {
  'classic-editorial': [
    { type: 'photo', path: 'heroPhoto', label: 'Square photo under the names', hint: 'Keep faces away from the bottom edge: torn paper covers it.' },
    { type: 'text', path: 'copy.welcome', label: 'Big welcome word' },
    { type: 'textarea', path: 'copy.intro', label: 'Line under the welcome' },
  ],
  'soft-film': [
    { type: 'photo', path: 'photos.0.src', label: 'Taped print (left)' },
    { type: 'text', path: 'photos.0.caption', label: 'Caption on the taped print' },
    { type: 'photo', path: 'photos.1.src', label: 'Second print (right)' },
    { type: 'text', path: 'photos.1.caption', label: 'Caption on the second print' },
    { type: 'text', path: 'copy.heading', label: 'Heading above the button' },
  ],
  'after-dark': [
    { type: 'photo', path: 'heroPhoto', label: 'Full-screen photo', hint: 'A flash photo of the group works best.' },
    { type: 'textarea', path: 'copy.tagline', label: 'Big line near the button' },
    { type: 'text', path: 'copy.intro', label: 'Small line under it' },
  ],
}

export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

export function setPath(obj, path, value) {
  const keys = path.split('.')
  let o = obj
  keys.slice(0, -1).forEach((k, i) => {
    const nextIsIndex = /^\d+$/.test(keys[i + 1])
    if (o[k] == null) o[k] = nextIsIndex ? [] : {}
    o = o[k]
  })
  const last = keys[keys.length - 1]
  if (value === '' || value == null) delete o[last]
  else o[last] = value
}

export function placeholderFor(theme, path) {
  const value = getPath(DEFAULTS[theme] || {}, path)
  return typeof value === 'string' ? value : ''
}

export function isBespoke(key) {
  return !THEME_CHOICES.some((t) => t.key === key)
}

export function themeLabel(key) {
  return THEME_CHOICES.find((t) => t.key === key)?.label || 'Bespoke design'
}
