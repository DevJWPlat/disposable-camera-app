// Values every Soft Film screen needs, worked out once from the event.
import { computed } from 'vue'
import { eventConfig } from '@/config/event.js'
import { dotDate, filmStamp, fillCopy, imageUrl } from '@/composables/eventFormat.js'
import './soft-film.css'

export function useSoftFilm() {
  const settings = eventConfig.settings || {}
  const colours = settings.colours || {}

  const vars = computed(() => ({
    '--sf-paper': colours.paper,
    '--sf-ink': colours.ink,
    '--sf-accent': colours.accent,
    '--sf-muted': colours.muted,
  }))

  return {
    event: eventConfig,
    settings,
    copy: settings.copy || {},
    vars,
    dateLabel: settings.dateLabel || dotDate(eventConfig.eventDate),
    stamp: settings.stamp || filmStamp(eventConfig.eventDate),
    photos: (settings.photos || []).map((p) => ({ ...p, url: imageUrl(p.src) })),
    fill: fillCopy,
  }
}
