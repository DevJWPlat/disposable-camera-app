// Values every Classic Editorial screen needs, worked out once from the event.
import { computed } from 'vue'
import { eventConfig } from '@/config/event.js'
import { fillCopy, imageUrl } from '@/composables/eventFormat.js'
import paperRip from './paper-rip.png'
import './classic-editorial.css'

// "2026-10-10" -> "10.10.26"
function compactDate(isoDate) {
  const m = String(isoDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}.${m[2]}.${m[1].slice(2)}` : ''
}

export function useClassicEditorial() {
  const settings = eventConfig.settings || {}
  const colours = settings.colours || {}

  const vars = computed(() => ({
    '--ce-paper': colours.paper,
    '--ce-ink': colours.ink,
    '--ce-muted': colours.muted,
  }))

  return {
    event: eventConfig,
    settings,
    copy: settings.copy || {},
    vars,
    dateLabel: settings.dateLabel || compactDate(eventConfig.eventDate),
    heroUrl: imageUrl(settings.heroPhoto),
    paperRip,
    fill: fillCopy,
  }
}
