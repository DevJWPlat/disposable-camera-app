<script setup>
import { onMounted, ref } from 'vue'
import { apiRequest } from '@/composables/api.js'
import { longDate } from '@/composables/eventFormat.js'
import { themeLabel } from './themeFields.js'
import './builder.css'

const loading = ref(true)
const error = ref('')
const me = ref('')
const events = ref([])

function status(event) {
  if (event.purgedAt) return { label: 'Deleted', cls: 'bd-chip--closed' }
  if (!event.isActive) return { label: 'Closed', cls: 'bd-chip--closed' }
  return { label: 'Live', cls: 'bd-chip--live' }
}

onMounted(async () => {
  try {
    const [who, list] = await Promise.all([apiRequest('/api/builder/me'), apiRequest('/api/builder/events')])
    me.value = who.email
    events.value = list.events
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="bd">
    <header class="bd-top">
      <RouterLink class="bd-top__brand" to="/">Online Disposable Camera <span>· Builder</span></RouterLink>
      <span class="bd-top__who">{{ me }}</span>
    </header>

    <main class="bd-page">
      <div class="bd-row">
        <h1 class="bd-h1">Events</h1>
        <RouterLink class="bd-btn" to="/events/new">New event</RouterLink>
      </div>

      <p v-if="loading" class="bd-msg">Loading…</p>
      <p v-else-if="error" class="bd-msg bd-msg--error">{{ error }}</p>
      <p v-else-if="!events.length" class="bd-msg">No events yet.</p>

      <div v-else class="bd-list">
        <RouterLink v-for="event in events" :key="event.slug" class="bd-card bd-event" :to="`/events/${event.slug}`">
          <div>
            <div class="bd-event__title">
              {{ event.title }}
              <span class="bd-chip" :class="status(event).cls">{{ status(event).label }}</span>
            </div>
            <div class="bd-event__meta">{{ themeLabel(event.theme) }} · {{ longDate(event.eventDate) }} · {{ event.host }}</div>
          </div>
          <div class="bd-event__counts">
            <strong>{{ event.photos }}</strong> photos<br />
            <strong>{{ event.guests }}</strong> guests
          </div>
        </RouterLink>
      </div>
    </main>
  </div>
</template>
