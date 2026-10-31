// Organiser area shared by every theme: login, stats, photos and the guest
// gallery switch. Ported from the Caz & Dan admin.
import { computed, onMounted, ref } from 'vue'
import { apiRequest } from './api.js'
import { galleryIsOpen, longDate, longDateTime } from './eventFormat.js'
import { eventConfig } from '@/config/event.js'

export function useOrganiser() {
  const loading = ref(true)
  const loggingIn = ref(false)
  const refreshing = ref(false)
  const email = ref('')
  const password = ref('')
  const showPassword = ref(false)
  const error = ref('')
  const admin = ref(null)
  const stats = ref(null)
  const photos = ref([])
  const displayGuests = ref(0)
  const displayPhotos = ref(0)
  const share = ref({ enabled: false, shareUrl: null })
  const sharingSaving = ref(false)
  const copied = ref(false)

  const galleryOpen = computed(() => galleryIsOpen())
  const unlockLabel = computed(() => longDateTime(eventConfig.galleryUnlockAt))
  const storageLabel = computed(() => longDate(stats.value?.storageUntil))
  const guestSharingAvailable = computed(() => eventConfig.settings?.guestSharing === true)

  function animateCount(target, output) {
    const end = Math.max(0, Number(target) || 0)
    output.value = 0
    if (!end) return
    const started = performance.now()
    const tick = (now) => {
      const progress = Math.min(1, (now - started) / 650)
      output.value = Math.round(end * (1 - Math.pow(1 - progress, 3)))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  async function api(path, options) {
    try {
      return await apiRequest(path, options)
    } catch (err) {
      if (err.status === 401) admin.value = null
      throw err
    }
  }

  async function refresh() {
    if (!admin.value) return
    refreshing.value = true
    error.value = ''
    try {
      const requests = [api('/api/admin/stats'), galleryOpen.value ? api('/api/admin/photos') : Promise.resolve({ photos: [] })]
      if (guestSharingAvailable.value) requests.push(api('/api/admin/gallery-share'))
      const [s, p, sh] = await Promise.all(requests)
      stats.value = s
      photos.value = p.photos || []
      if (sh) share.value = { enabled: Boolean(sh.enabled), shareUrl: sh.shareUrl || null }
      animateCount(s.sessions, displayGuests)
      animateCount(s.photos, displayPhotos)
    } catch (err) {
      error.value = err.message
    } finally {
      refreshing.value = false
    }
  }

  async function restore() {
    try {
      const data = await api('/api/admin/me')
      admin.value = data.admin
      await refresh()
    } catch {
      admin.value = null
    } finally {
      loading.value = false
    }
  }

  async function login() {
    loggingIn.value = true
    error.value = ''
    try {
      const data = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ email: email.value, password: password.value }) })
      admin.value = data.admin
      password.value = ''
      await refresh()
    } catch (err) {
      error.value = err.status === 401 ? 'That email and password don’t match.' : err.message
    } finally {
      loggingIn.value = false
    }
  }

  async function logout() {
    try {
      await api('/api/admin/logout', { method: 'POST', body: '{}' })
    } catch {
      // Logged out locally either way.
    }
    admin.value = null
    stats.value = null
    photos.value = []
  }

  async function setGuestSharing(enabled) {
    if (!galleryOpen.value || sharingSaving.value) return
    sharingSaving.value = true
    copied.value = false
    error.value = ''
    try {
      const sh = await api('/api/admin/gallery-share', { method: 'POST', body: JSON.stringify({ enabled }) })
      share.value = { enabled: Boolean(sh.enabled), shareUrl: sh.shareUrl || null }
    } catch (err) {
      error.value = err.message
    } finally {
      sharingSaving.value = false
    }
  }

  async function copyShareLink() {
    if (!share.value.shareUrl) return
    try {
      await navigator.clipboard.writeText(share.value.shareUrl)
    } catch {
      const input = document.createElement('textarea')
      input.value = share.value.shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
    }
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1800)
  }

  onMounted(restore)

  return {
    loading, loggingIn, refreshing, email, password, showPassword, error, admin, stats, photos,
    displayGuests, displayPhotos, share, sharingSaving, copied, galleryOpen, unlockLabel, storageLabel,
    guestSharingAvailable, login, logout, refresh, setGuestSharing, copyShareLink,
  }
}
