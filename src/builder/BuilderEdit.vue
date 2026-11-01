<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiRequest } from '@/composables/api.js'
import { THEME_CHOICES, THEME_FIELDS, getPath, setPath, placeholderFor, isBespoke } from './themeFields.js'
import BdDateField from './BdDateField.vue'
import './builder.css'

const route = useRoute()
const router = useRouter()
const creating = computed(() => !route.params.slug)

const me = ref('')
const appDomain = ref('onlinedisposablecamera.co.uk')
const loading = ref(true)
const creatingBusy = ref(false)
const error = ref('')
const event = ref(null)
const previewKey = ref(0)
const slugTouched = ref(false)

const form = reactive({
  theme: 'classic-editorial',
  title: '',
  slug: '',
  eventDate: '',
  maxShots: 25,
  galleryUnlockLocal: '',
  storageDate: '',
  guestSharing: true,
  settings: {},
})

const invite = reactive({ email: '', link: '', busy: false, error: '', copied: false })
const organisers = ref([])
const uploads = reactive({})

// ---------- dates (this browser's local time, i.e. UK) ----------
const pad = (n) => String(n).padStart(2, '0')
function isoToLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const localInputToIso = (value) => (value ? new Date(value).toISOString() : null)
const isoToDate = (iso) => (iso ? isoToLocalInput(iso).slice(0, 10) : '')
const dateToStorageIso = (date) => (date ? new Date(`${date}T23:59:59`).toISOString() : null)
function addDays(date, days) {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function addMonths(date, months) {
  const d = new Date(`${date}T12:00:00`)
  d.setMonth(d.getMonth() + months)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// New events: reveal and storage follow the event date until changed by hand.
const unlockTouched = ref(false)
const storageTouched = ref(false)
watch(() => form.eventDate, (date) => {
  if (!creating.value || !date) return
  if (!unlockTouched.value) form.galleryUnlockLocal = `${addDays(date, 1)}T09:00`
  if (!storageTouched.value) form.storageDate = addMonths(date, 3)
})
function setUnlock(value) {
  unlockTouched.value = true
  form.galleryUnlockLocal = value
}
function setStorage(value) {
  storageTouched.value = true
  form.storageDate = value
}

const standardStorage = computed(() => (form.eventDate ? addMonths(form.eventDate, 3) : ''))
const storageWarning = computed(() => {
  if (!form.eventDate || !form.storageDate) return ''
  if (form.storageDate < form.eventDate) return 'This is before the event. Photos would be deleted before anyone sees them.'
  if (form.storageDate > standardStorage.value) return 'Longer than the standard three months. Extra storage is a paid add-on, so check it’s been agreed and paid for.'
  return ''
})
const unlockWarning = computed(() => {
  if (!form.eventDate || !form.galleryUnlockLocal) return ''
  if (form.galleryUnlockLocal.slice(0, 10) < form.eventDate) return 'This is before the event, so the organiser could see photos as they’re taken.'
  return ''
})

function slugify(text) {
  return text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '')
}
watch(() => form.title, (title) => {
  if (creating.value && !slugTouched.value) form.slug = slugify(title)
})

const fields = computed(() => THEME_FIELDS[form.theme] || [])
const bespoke = computed(() => Boolean(event.value) && isBespoke(event.value.theme))
const host = computed(() => event.value?.host || (form.slug ? `${form.slug}.${appDomain.value}` : ''))
const previewUrl = computed(() => (event.value ? `https://${host.value}/?preview=${previewKey.value}` : ''))

const fieldValue = (path) => getPath(form.settings, path) ?? ''
const setField = (path, value) => setPath(form.settings, path, value)
function photoUrl(path) {
  const name = getPath(form.settings, path)
  return name && event.value ? `https://${host.value}/api/event/image/${encodeURIComponent(name)}` : ''
}

function loadEvent(e) {
  event.value = e
  form.theme = e.theme
  form.title = e.title
  form.slug = e.slug
  form.eventDate = e.eventDate
  form.maxShots = e.maxShots
  form.galleryUnlockLocal = isoToLocalInput(e.galleryUnlockAt)
  form.storageDate = isoToDate(e.storageUntil)
  form.guestSharing = e.settings.guestSharing !== false
  form.settings = JSON.parse(JSON.stringify(e.settings || {}))
}

function payload() {
  return {
    ...(bespoke.value ? {} : { theme: form.theme }),
    title: form.title.trim(),
    slug: form.slug,
    eventDate: form.eventDate,
    maxShots: Number(form.maxShots),
    galleryUnlockAt: localInputToIso(form.galleryUnlockLocal),
    storageUntil: dateToStorageIso(form.storageDate),
    settings: { ...form.settings, guestSharing: form.guestSharing },
  }
}

// ---------- create (new events) ----------
async function createEvent() {
  creatingBusy.value = true
  error.value = ''
  try {
    const data = await apiRequest('/api/builder/events', { method: 'POST', body: JSON.stringify(payload()) })
    loadEvent(data.event)
    lastSaved = JSON.stringify(payload())
    saveState.value = 'saved'
    router.replace(`/events/${data.event.slug}`)
  } catch (err) {
    error.value = err.message
  } finally {
    creatingBusy.value = false
  }
}

// ---------- autosave (existing events) ----------
// Saves about a second after the last change. The form is not reloaded from
// the server afterwards, so typing is never interrupted.
const saveState = ref('idle') // idle | pending | saving | saved | error
let lastSaved = ''
let timer = null
let inFlight = null

async function saveNow() {
  if (creating.value || !event.value) return
  clearTimeout(timer)
  const body = JSON.stringify(payload())
  if (body === lastSaved) {
    if (saveState.value === 'pending') saveState.value = 'saved'
    return
  }
  if (inFlight) await inFlight
  saveState.value = 'saving'
  error.value = ''
  inFlight = apiRequest(`/api/builder/events/${event.value.slug}`, { method: 'PUT', body })
    .then((data) => {
      event.value = data.event
      lastSaved = body
      saveState.value = 'saved'
      previewKey.value++
    })
    .catch((err) => {
      saveState.value = 'error'
      error.value = err.message
    })
    .finally(() => {
      inFlight = null
    })
  await inFlight
}

watch(
  () => JSON.stringify(payload()),
  (body) => {
    if (creating.value || !event.value || body === lastSaved) return
    saveState.value = 'pending'
    clearTimeout(timer)
    timer = setTimeout(saveNow, 900)
  },
)

const statusText = computed(() => ({
  pending: 'Unsaved changes…',
  saving: 'Saving…',
  saved: 'All changes saved',
  error: error.value || 'Couldn’t save',
}[saveState.value] || ''))

// ---------- photos (resized in the browser, longest side 2000px) ----------
function resizeImage(file, maxSide = 2000, quality = 0.86) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not read that photo.'))), 'image/jpeg', quality)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that photo.'))
    }
    img.src = url
  })
}

async function uploadPhoto(path, fileEvent) {
  const file = fileEvent.target.files?.[0]
  if (!file || !event.value) return
  uploads[path] = 'Uploading…'
  try {
    const blob = await resizeImage(file)
    const name = `${path.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${Date.now().toString(36)}.jpg`
    const response = await fetch(`/api/builder/events/${event.value.slug}/photo?name=${encodeURIComponent(name)}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'image/jpeg' },
      body: blob,
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Upload failed.')
    setField(path, data.name)
    uploads[path] = ''
    await saveNow()
  } catch (err) {
    uploads[path] = err.message
  } finally {
    fileEvent.target.value = ''
  }
}

// ---------- organisers ----------
async function loadOrganisers() {
  if (!event.value) return
  try {
    organisers.value = (await apiRequest(`/api/builder/events/${event.value.slug}/organisers`)).organisers
  } catch {
    organisers.value = []
  }
}

function organiserState(o) {
  if (o.state === 'active') return 'Set up and ready to log in'
  if (o.state === 'invited') return 'Invite sent, not set up yet'
  return 'Invite expired: create a new link'
}

async function createInvite() {
  invite.busy = true
  invite.error = ''
  invite.link = ''
  invite.copied = false
  try {
    const data = await apiRequest(`/api/builder/events/${event.value.slug}/invite`, { method: 'POST', body: JSON.stringify({ email: invite.email }) })
    invite.link = data.link
    await loadOrganisers()
  } catch (err) {
    invite.error = err.message
  } finally {
    invite.busy = false
  }
}

async function copyInvite() {
  try {
    await navigator.clipboard.writeText(invite.link)
    invite.copied = true
  } catch {
    invite.copied = false
  }
}

const inviteMail = computed(() => {
  if (!invite.link) return ''
  const subject = `Your organiser access for ${form.title}`
  const body = `Hi,\n\nHere's your private link to set up the organiser dashboard for ${form.title}:\n\n${invite.link}\n\nIt lasts 7 days. Open it, confirm your email and choose a password. After that, you can log in any time at https://${host.value}/admin to see how many guests have joined, open the gallery once it unlocks, download photos and share the gallery with guests.\n\nJonny\nOnline Disposable Camera`
  return `mailto:${encodeURIComponent(invite.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
})

onMounted(async () => {
  try {
    const who = await apiRequest('/api/builder/me')
    me.value = who.email
    appDomain.value = who.appDomain || appDomain.value
    if (!creating.value) {
      loadEvent((await apiRequest(`/api/builder/events/${route.params.slug}`)).event)
      lastSaved = JSON.stringify(payload())
      saveState.value = 'saved'
      loadOrganisers()
    }
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
        <h1 class="bd-h1">{{ creating ? 'New event' : form.title }}</h1>
        <RouterLink class="bd-btn bd-btn--ghost" to="/">All events</RouterLink>
      </div>

      <p v-if="loading" class="bd-msg">Loading…</p>

      <div v-else class="bd-edit">
        <form @submit.prevent="creating ? createEvent() : saveNow()">
          <section v-if="bespoke" class="bd-card bd-section">
            <h2>Bespoke design</h2>
            <p>This event has its own custom screens, so its theme and design are fixed. Everything else here can be changed.</p>
          </section>

          <section v-else class="bd-card bd-section">
            <h2>Theme</h2>
            <p>You can change this later.</p>
            <div class="bd-themes">
              <button
                v-for="t in THEME_CHOICES"
                :key="t.key"
                type="button"
                class="bd-theme"
                :class="{ 'bd-theme--on': form.theme === t.key }"
                @click="form.theme = t.key"
              >
                <span class="bd-theme__swatch"><i :style="{ background: t.swatch[0] }"></i><i :style="{ background: t.swatch[1] }"></i></span>
                <strong>{{ t.label }}</strong>
                <small>{{ t.bestFor }}</small>
              </button>
            </div>
          </section>

          <section class="bd-card bd-section">
            <h2>Details</h2>
            <p>What guests see, and when the gallery opens.</p>
            <div class="bd-grid">
              <label class="bd-field">
                <span>Event name</span>
                <input v-model="form.title" class="bd-input" maxlength="80" placeholder="Emma & Josh" required />
              </label>
              <label class="bd-field">
                <span>Address</span>
                <span class="bd-address">
                  <input v-model="form.slug" class="bd-input" :disabled="!creating" required @input="slugTouched = true" />
                  <span>.{{ appDomain }}</span>
                </span>
                <small v-if="creating">Can’t be changed after creating, because printed QR codes use it.</small>
                <small v-else>Addresses can’t change once created.</small>
              </label>
              <div class="bd-grid bd-grid--2">
                <div class="bd-field">
                  <span>Event date</span>
                  <BdDateField v-model="form.eventDate" />
                </div>
                <label class="bd-field">
                  <span>Photos per guest</span>
                  <input v-model.number="form.maxShots" class="bd-input" type="number" min="1" max="200" required />
                </label>
                <div class="bd-field">
                  <span>Gallery opens (UK time)</span>
                  <BdDateField :model-value="form.galleryUnlockLocal" with-time placeholder="Choose a date and time" @update:model-value="setUnlock" />
                  <small>When the organiser can see the photos.</small>
                  <p v-if="unlockWarning" class="bd-warn">{{ unlockWarning }}</p>
                </div>
                <div class="bd-field">
                  <span>Photos kept until</span>
                  <BdDateField :model-value="form.storageDate" @update:model-value="setStorage" />
                  <small>Three months after the event is standard.</small>
                  <p v-if="storageWarning" class="bd-warn">{{ storageWarning }}</p>
                </div>
              </div>
              <label class="bd-toggle">
                <span class="bd-field"><span>Guest gallery</span><small>Lets the organiser share a gallery link with guests once it opens.</small></span>
                <input v-model="form.guestSharing" type="checkbox" />
              </label>
            </div>
          </section>

          <section v-if="!bespoke" class="bd-card bd-section">
            <h2>Design</h2>
            <p v-if="!event">Create the event first, then add its photos here.</p>
            <div v-else class="bd-grid">
              <template v-for="field in fields" :key="field.path">
                <div v-if="field.type === 'photo'" class="bd-field">
                  <span>{{ field.label }}</span>
                  <div class="bd-photo">
                    <div class="bd-photo__thumb" :style="photoUrl(field.path) ? { backgroundImage: `url(${photoUrl(field.path)})` } : {}"></div>
                    <div class="bd-photo__actions">
                      <input type="file" accept="image/*" @change="uploadPhoto(field.path, $event)" />
                      <small v-if="uploads[field.path]">{{ uploads[field.path] }}</small>
                      <small v-else-if="field.hint">{{ field.hint }}</small>
                    </div>
                  </div>
                </div>
                <label v-else class="bd-field">
                  <span>{{ field.label }}</span>
                  <textarea
                    v-if="field.type === 'textarea'"
                    class="bd-textarea"
                    :value="fieldValue(field.path)"
                    :placeholder="placeholderFor(form.theme, field.path)"
                    @input="setField(field.path, $event.target.value)"
                  ></textarea>
                  <input
                    v-else
                    class="bd-input"
                    :value="fieldValue(field.path)"
                    :placeholder="placeholderFor(form.theme, field.path)"
                    @input="setField(field.path, $event.target.value)"
                  />
                </label>
              </template>
              <small>Leave a text box empty to use the theme’s wording, shown in grey.</small>
            </div>
          </section>

          <section v-if="event" class="bd-card bd-section">
            <h2>Organiser</h2>
            <p>The organiser is whoever booked the camera, such as the couple or the person planning the party. They get a private dashboard at <strong>{{ host }}/admin</strong> where they can see how many guests have joined, open the gallery once it unlocks, download photos and share the gallery with guests.</p>
            <ol class="bd-steps">
              <li>Enter the organiser’s email and create a setup link.</li>
              <li>Send them the link. “Open an email with the link” writes the message for you.</li>
              <li>They open it, confirm their email and choose a password. The link works once and lasts 7 days.</li>
              <li>From then on they log in at {{ host }}/admin with that email and password.</li>
            </ol>

            <ul v-if="organisers.length" class="bd-orgs">
              <li v-for="o in organisers" :key="o.email">
                <span>{{ o.email }}</span>
                <small>{{ organiserState(o) }}</small>
              </li>
            </ul>

            <div class="bd-row" style="flex-wrap: nowrap">
              <input v-model.trim="invite.email" class="bd-input" type="email" placeholder="organiser@example.com" />
              <button type="button" class="bd-btn" :disabled="invite.busy || !invite.email" @click="createInvite">{{ invite.busy ? 'Creating…' : 'Create setup link' }}</button>
            </div>
            <p v-if="invite.error" class="bd-msg bd-msg--error">{{ invite.error }}</p>
            <template v-if="invite.link">
              <div class="bd-link-box">
                <input class="bd-input" :value="invite.link" readonly />
                <button type="button" class="bd-btn bd-btn--ghost" @click="copyInvite">{{ invite.copied ? 'Copied' : 'Copy' }}</button>
              </div>
              <p class="bd-msg"><a :href="inviteMail">Open an email with the link</a></p>
            </template>
          </section>

          <div class="bd-savebar">
            <template v-if="creating">
              <span><span v-if="error" class="bd-msg bd-msg--error">{{ error }}</span></span>
              <button class="bd-btn" :disabled="creatingBusy">{{ creatingBusy ? 'Creating…' : 'Create event' }}</button>
            </template>
            <template v-else>
              <span class="bd-status" :class="`bd-status--${saveState}`">{{ statusText }}</span>
              <small class="bd-status">Changes save automatically</small>
            </template>
          </div>
        </form>

        <aside class="bd-preview">
          <div class="bd-phone">
            <iframe v-if="previewUrl" :key="previewKey" :src="previewUrl" title="Event preview"></iframe>
            <div v-else class="bd-phone__empty">The live page appears here once the event is created.</div>
          </div>
          <div v-if="event" class="bd-preview__links">
            <a class="bd-btn bd-btn--ghost" :href="`https://${host}`" target="_blank" rel="noopener">Open event</a>
            <a class="bd-btn bd-btn--ghost" :href="`https://${host}/admin`" target="_blank" rel="noopener">Organiser login</a>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>
