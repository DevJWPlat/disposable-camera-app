// Values every After Dark screen needs, worked out once from the event.
import { computed } from 'vue'
import { eventConfig } from '@/config/event.js'
import { fillCopy, imageUrl } from '@/composables/eventFormat.js'
import './after-dark.css'

// "2026-09-12" -> "12.09.26"
function compactDate(isoDate) {
  const m = String(isoDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}.${m[2]}.${m[1].slice(2)}` : ''
}

export function useAfterDark() {
  const settings = eventConfig.settings || {}
  const colours = settings.colours || {}

  const vars = computed(() => ({
    '--ad-glow': colours.glow,
    '--ad-pink': colours.pink,
  }))

  return {
    event: eventConfig,
    settings,
    copy: settings.copy || {},
    vars,
    dateLabel: settings.dateLabel || compactDate(eventConfig.eventDate),
    heroUrl: imageUrl(settings.heroPhoto),
    fill: fillCopy,
  }
}
