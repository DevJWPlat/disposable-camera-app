<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

import { useRouter } from 'vue-router'
import { API_BASE_URL } from '../utils/api.js'

import leopardPattern from '@/assets/images/leopard-pattern.png'
import leopard from '@/assets/images/leopard.png'
import leopardGold from '@/assets/images/leopard-gold.png'

import AdminGallery from '@/components/admin/AdminGallery.vue'

const router = useRouter()

const ADMIN_STORAGE_KEY = 'wedding_camera_admin_logged_in'

const loading = ref(true)
const loggingIn = ref(false)
const error = ref('')
const username = ref('')
const password = ref('')
const isLoggedIn = ref(false)
const showLogoutConfirm = ref(false)
const showPassword = ref(false)

const unlockAt = ref(null)
const unlockAtFormatted = ref('')
const remainingMs = ref(0)

const authStage = ref('login')
const stage = ref('stats')

const participants = ref(0)
const photosCount = ref(0)
const displayParticipants = ref(0)
const displayPhotosCount = ref(0)
const photos = ref([])

const refreshing = ref(false)

let autoRefreshInterval = null
let countdownInterval = null
let hasAnimatedStats = false

const countdownText = ref('')

const loginButtonDisabled = computed(() => {
  return (
    username.value.trim().length === 0 ||
    password.value.trim().length === 0 ||
    loggingIn.value
  )
})

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options)
  const text = await response.text()

  let data

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    throw new Error('The server returned an invalid response.')
  }

  if (!response.ok || !data?.ok) {
    throw new Error(
      data?.error ||
      `Request failed with status ${response.status}`,
    )
  }

  return data
}

function formatCountdown(diffMs) {
  if (diffMs <= 0) {
    return '0 days, 0 hours and 0 minutes'
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60))
  const days = Math.floor(totalMinutes / (60 * 24))

  const hours = Math.floor(
    (totalMinutes % (60 * 24)) / 60,
  )

  const minutes = totalMinutes % 60

  const dayLabel = days === 1 ? 'day' : 'days'
  const hourLabel = hours === 1 ? 'hour' : 'hours'
  const minuteLabel =
    minutes === 1 ? 'minute' : 'minutes'

  return `${days} ${dayLabel}, ${hours} ${hourLabel} and ${minutes} ${minuteLabel}`
}

async function updateCountdownText() {
  countdownText.value = formatCountdown(
    remainingMs.value,
  )

  if (
    remainingMs.value <= 0 &&
    authStage.value === 'locked'
  ) {
    authStage.value = 'app'
    stage.value = 'stats'

    stopCountdown()

    await loadAdminData()
  }
}

function startCountdown() {
  stopCountdown()
  updateCountdownText()

  countdownInterval = setInterval(async () => {
    remainingMs.value = Math.max(
      remainingMs.value - 30000,
      0,
    )

    await updateCountdownText()
  }, 30000)
}

function stopCountdown() {
  if (!countdownInterval) return

  clearInterval(countdownInterval)
  countdownInterval = null
}

async function fetchAdminStatus() {
  const data = await fetchJson(
    `${API_BASE_URL}/api/admin/status`,
  )

  unlockAt.value = data.unlockAt
  unlockAtFormatted.value = data.unlockAtFormatted
  remainingMs.value = Number(data.remainingMs || 0)
}

function animateValue(
  displayRef,
  target,
  duration = 800,
) {
  const start = 0
  const startTime = performance.now()

  function tick(now) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)

    displayRef.value = Math.round(
      start + (target - start) * eased,
    )

    if (progress < 1) {
      requestAnimationFrame(tick)
    }
  }

  requestAnimationFrame(tick)
}

async function fetchStats() {
  const data = await fetchJson(
    `${API_BASE_URL}/api/admin/stats`,
  )

  participants.value = Number(
    data.participants || 0,
  )

  photosCount.value = Number(
    data.photos || 0,
  )

  if (!hasAnimatedStats) {
    hasAnimatedStats = true

    animateValue(
      displayParticipants,
      participants.value,
    )

    animateValue(
      displayPhotosCount,
      photosCount.value,
    )

    return
  }

  displayParticipants.value = participants.value
  displayPhotosCount.value = photosCount.value
}

async function fetchPhotos() {
  const data = await fetchJson(
    `${API_BASE_URL}/api/admin/photos`,
  )

  photos.value = Array.isArray(data.photos)
    ? data.photos
    : []
}

async function loadAdminData() {
  await Promise.all([
    fetchStats(),
    fetchPhotos(),
  ])
}

async function refreshData() {
  if (refreshing.value) return

  refreshing.value = true
  error.value = ''

  try {
    await loadAdminData()
  } catch (err) {
    error.value =
      err.message ||
      'The gallery could not be refreshed.'
  } finally {
    refreshing.value = false
  }
}

async function restoreSession() {
  const storedLogin = localStorage.getItem(
    ADMIN_STORAGE_KEY,
  )

  isLoggedIn.value = storedLogin === 'true'

  await fetchAdminStatus()

  if (!isLoggedIn.value) {
    authStage.value = 'login'
    return
  }

  if (remainingMs.value > 0) {
    authStage.value = 'locked'
    startCountdown()
    return
  }

  authStage.value = 'app'
  stage.value = 'stats'

  await loadAdminData()
}

async function login() {
  if (loginButtonDisabled.value) return

  error.value = ''
  loggingIn.value = true

  try {
    await new Promise((resolve) => {
      setTimeout(resolve, 300)
    })

    if (
      username.value !== 'Dom P' ||
      password.value !== 'Bolton1233'
    ) {
      throw new Error(
        'Incorrect username or password',
      )
    }

    localStorage.setItem(
      ADMIN_STORAGE_KEY,
      'true',
    )

    isLoggedIn.value = true
    password.value = ''

    await fetchAdminStatus()

    if (remainingMs.value > 0) {
      authStage.value = 'locked'
      startCountdown()
      return
    }

    authStage.value = 'app'
    stage.value = 'stats'

    await loadAdminData()
  } catch (err) {
    error.value =
      err.message ||
      'Something went wrong while signing in.'
  } finally {
    loggingIn.value = false
  }
}

function promptLogout() {
  showLogoutConfirm.value = true
}

function cancelLogout() {
  showLogoutConfirm.value = false
}

function confirmLogout() {
  localStorage.removeItem(ADMIN_STORAGE_KEY)

  isLoggedIn.value = false
  showLogoutConfirm.value = false
  showPassword.value = false

  username.value = ''
  password.value = ''
  error.value = ''

  authStage.value = 'login'
  stage.value = 'stats'

  participants.value = 0
  photosCount.value = 0
  displayParticipants.value = 0
  displayPhotosCount.value = 0

  photos.value = []
  hasAnimatedStats = false

  stopCountdown()

  router.push('/')
}

function showGallery() {
  stage.value = 'gallery'
}

function showStats() {
  stage.value = 'stats'
}

onMounted(async () => {
  try {
    await restoreSession()

    autoRefreshInterval = setInterval(() => {
      if (authStage.value === 'app') {
        refreshData()
      }
    }, 15000)
  } catch (err) {
    error.value =
      err.message ||
      'Failed to load the admin view.'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  stopCountdown()

  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
    autoRefreshInterval = null
  }
})
</script>

<template>
    <main
    class="admin-page"
    :style="{
      '--leopard-background': `url(${leopardPattern})`,
    }"
  >
    <div class="admin-shell">
      <div class="leopard-header" aria-hidden="true"></div>
      <div
        v-if="loading"
        class="flex flex-1 items-center justify-center text-center text-xl font-semibold"
      >
        Loading admin view...
      </div>

      <div
        v-else-if="error && authStage !== 'login'"
        class="flex flex-1 items-center justify-center text-center text-lg font-semibold text-red-300"
      >
        {{ error }}
      </div>

      <div v-else class="flex flex-1 flex-col">
        <div v-if="authStage === 'login'" class="login-screen" >
            <header class="login-header">
              <div class="film-details">
                <span>PP 60</span>
                <span>PRIVATE ACCESS</span>
              </div>

              <p class="eyebrow">
                Paul’s disposable camera
              </p>

              <h1>
                Private
                <span>gallery</span>
              </h1>

              <p class="login-intro">
                Sign in to access Paul’s birthday photographs.
              </p>
            </header>

            <form
              class="login-film"
              @submit.prevent="login"
            >
              <div
                class="film-edge film-edge--left"
                aria-hidden="true"
              >
                <span>ADMIN</span>
                <span>ISO 400</span>
              </div>

              <div class="login-panel">
                <img
                  :src="leopardGold"
                  class="login-leopard"
                  alt=""
                  aria-hidden="true"
                />

                <p class="panel-label">
                  Authorised access only
                </p>

                <h2>Unlock the film</h2>

                <div class="login-fields">
                  <label for="admin-username">
                    Username
                  </label>

                  <input
                    id="admin-username"
                    v-model="username"
                    type="text"
                    name="username"
                    autocomplete="username"
                    placeholder="Enter username"
                  />

                  <label for="admin-password">
                    Password
                  </label>

                  <div class="password-field">
                    <input
                      id="admin-password"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      name="password"
                      autocomplete="current-password"
                      placeholder="Enter password"
                    />

                    <button
                      type="button"
                      class="password-toggle"
                      :aria-label="showPassword ? 'Hide password' : 'Show password'"
                      :aria-pressed="showPassword"
                      @click="showPassword = !showPassword"
                    >
                      <svg
                        v-if="!showPassword"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>

                      <svg
                        v-else
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.1 2.8" />
                        <path d="M6.2 6.2C3.8 7.8 2.5 12 2.5 12s3.5 6 9.5 6a9.4 9.4 0 0 0 3.2-.6" />
                        <path d="M9.9 9.9A3 3 0 0 0 14.1 14.1" />
                      </svg>
                    </button>
                  </div>
                </div>

                <p
                  v-if="error"
                  class="login-error"
                  role="alert"
                >
                  {{ error }}
                </p>
              </div>

              <div
                class="film-edge film-edge--right"
                aria-hidden="true"
              >
                <i v-for="index in 5" :key="index"></i>
              </div>
            </form>

            <button
              type="button"
              class="login-ticket"
              :disabled="loginButtonDisabled"
              @click="login"
            >
              <span class="ticket-stub">
                <small>Roll</small>
                <strong>60</strong>
              </span>

              <span class="ticket-action">
                {{ loggingIn ? 'Checking access...' : 'Enter the gallery' }}
              </span>

              <span class="ticket-mark" aria-hidden="true">
                <img :src="leopard" alt="" />
              </span>
            </button>

            <button
              type="button"
              class="back-home"
              @click="router.push('/')"
            >
              Back to camera
            </button>
          </div>

        <div v-else-if="authStage === 'locked'" class="flex flex-1 flex-col items-center justify-center text-center" >
          <h1 class="text-4xl font-bold leading-tight">
            The suspense must be killing you...
          </h1>

          <p class="mt-8 text-xl leading-relaxed text-[#d4d4d4]">
            You can access your photos in
          </p>

          <div class="mt-6 text-3xl font-bold leading-tight">
            {{ countdownText }}
          </div>

          <p class="mt-8 text-base text-[#d4d4d4]">
            Unlocks on {{ unlockAtFormatted }}
          </p>

          <button
            type="button"
            @click="promptLogout"
            class="mt-10 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
          >
            Log out
          </button>
        </div>

        <div
            v-else-if="authStage === 'app'"
            class="admin-app"
          >
            <div class="admin-toolbar">
              <button
                type="button"
                class="toolbar-button"
                @click="promptLogout"
              >
                Log out
              </button>

              <div class="toolbar-title">
                <span>PP 60</span>
                <strong>Admin</strong>
              </div>

              <button
                type="button"
                class="toolbar-button toolbar-button--icon"
                aria-label="Refresh dashboard"
                :disabled="refreshing"
                @click="refreshData"
              >
                <svg
                  viewBox="0 0 24 24"
                  :class="{ 'refresh-spinning': refreshing }"
                  aria-hidden="true"
                >
                  <path d="M20 7v5h-5" />
                  <path d="M4 17v-5h5" />
                  <path d="M6.1 9a7 7 0 0 1 11.5-2L20 9" />
                  <path d="M17.9 15a7 7 0 0 1-11.5 2L4 15" />
                </svg>
              </button>
            </div>

            <div
              v-if="stage === 'stats'"
              class="stats-screen"
            >
              <header class="stats-header">
                <p class="stats-eyebrow">
                  Paul’s private gallery
                </p>

                <h2>
                  Captured
                  <span>moments</span>
                </h2>

                <p>
                  Live totals from Paul’s birthday camera.
                </p>
              </header>

              <div class="stats-film">
                <div
                  class="film-edge film-edge--left"
                  aria-hidden="true"
                >
                  <span>LIVE</span>
                  <span>ISO 400</span>
                </div>

                <div class="stats-panel">
                  <article class="stat-card">
                    <p class="stat-label">
                      Photographers
                    </p>

                    <strong>
                      {{ displayParticipants }}
                    </strong>

                    <span>Participants</span>
                  </article>

                  <div
                    class="stat-divider"
                    aria-hidden="true"
                  >
                    <span></span>
                    <img :src="leopardGold" alt="" />
                    <span></span>
                  </div>

                  <article class="stat-card">
                    <p class="stat-label">
                      Exposures captured
                    </p>

                    <strong>
                      {{ displayPhotosCount }}
                    </strong>

                    <span>Photographs</span>
                  </article>
                </div>

                <div
                  class="film-edge film-edge--right"
                  aria-hidden="true"
                >
                  <i v-for="index in 5" :key="index"></i>
                </div>
              </div>

              <button
                type="button"
                class="gallery-ticket"
                :disabled="photos.length === 0"
                @click="showGallery"
              >
                <span class="gallery-stub">
                  <small>Roll</small>
                  <strong>{{ photos.length }}</strong>
                </span>

                <span class="gallery-action">
                  {{
                    photos.length === 0
                      ? 'No moments captured yet'
                      : 'See the moments'
                  }}
                </span>

                <span
                  class="gallery-mark"
                  aria-hidden="true"
                >
                  <img :src="leopard" alt="" />
                </span>
              </button>

              <p class="last-updated">
                Automatically refreshes every 15 seconds
              </p>
            </div>

            <AdminGallery
              v-else-if="stage === 'gallery'"
              :photos="photos"
              @back="showStats"
            />
          </div>
      </div>
    </div>

    <div
      v-if="showLogoutConfirm"
      class="logout-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
    >
      <div class="logout-dialog">
        <div
          class="logout-film-edge logout-film-edge--left"
          aria-hidden="true"
        >
          <span>ADMIN</span>
          <span>PP 60</span>
        </div>

        <div class="logout-content">
          <img
            :src="leopardGold"
            class="logout-leopard"
            alt=""
            aria-hidden="true"
          />

          <p class="logout-eyebrow">
            Private gallery
          </p>

          <h2 id="logout-title">
            Log out?
          </h2>

          <div
            class="logout-divider"
            aria-hidden="true"
          >
            <span></span>
            <i></i>
            <span></span>
          </div>

          <p class="logout-copy">
            You’ll need to enter the password again
            to access Paul’s gallery.
          </p>

          <button
            type="button"
            class="logout-ticket"
            @click="confirmLogout"
          >
            <span class="logout-ticket-stub">
              <small>Exit</small>
              <strong>60</strong>
            </span>

            <span class="logout-ticket-action">
              Yes, log out
            </span>

            <span
              class="logout-ticket-mark"
              aria-hidden="true"
            >
              <img :src="leopard" alt="" />
            </span>
          </button>

          <button
            type="button"
            class="cancel-logout"
            @click="cancelLogout"
          >
            Cancel and stay logged in
          </button>
        </div>

        <div
          class="logout-film-edge logout-film-edge--right"
          aria-hidden="true"
        >
          <i v-for="index in 4" :key="index"></i>
        </div>
      </div>
    </div>

  </main>
</template>

<style scoped lang="scss">
.admin-page {
  --black: #090907;
  --panel: #11110e;
  --cream: #eadfc9;
  --muted: #a99b84;
  --gold: #c7a15a;
  --dark-gold: #755728;

  position: relative;
  min-height: 100svh;
  background:
    linear-gradient(
      120deg,
      transparent 0 42%,
      rgba(255, 255, 255, 0.012) 50%,
      transparent 58%
    ),
    var(--panel);
  color: var(--cream);
}

.admin-page::before {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.2'/%3E%3C/svg%3E");
  content: '';
  opacity: 0.18;
  pointer-events: none;
}

.admin-shell {
  position: relative;
  isolation: isolate;
  display: flex;
  min-height: 100svh;
  width: min(100%, 30rem);
  margin: 0 auto;
  padding:
    max(1rem, env(safe-area-inset-top))
    1.2rem
    max(0.8rem, env(safe-area-inset-bottom));
  flex-direction: column;
  overflow: hidden;
}

.leopard-header {
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
  width: 100%;
  height: 11rem;
  opacity: 0.65;
  background-image: var(--leopard-background);
  background-position: top center;
  background-repeat: no-repeat;
  background-size: cover;
  mask-image: linear-gradient(
    to bottom,
    black 0%,
    black 48%,
    transparent 100%
  );
  pointer-events: none;
}

.login-screen {
  display: flex;
  min-height: calc(
    100svh -
    max(1rem, env(safe-area-inset-top)) -
    max(0.8rem, env(safe-area-inset-bottom))
  );
  flex-direction: column;
  justify-content: flex-start;
}

.login-header {
  text-align: center;
}

.film-details {
  display: flex;
  margin-bottom: 0.9rem;
  justify-content: space-between;
  color: rgba(199, 161, 90, 0.65);
  font-size: 0.47rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.eyebrow {
  margin: 0 0 0.45rem;
  color: var(--gold);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}

.login-header h1 {
  margin: 0;
  color: var(--cream);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.4rem, 11vw, 3.4rem);
  font-weight: 400;
  line-height: 0.88;
  text-transform: uppercase;
}

.login-header h1 span {
  display: block;
  margin-top: 0.18rem;
  color: var(--gold);
  font-size: 0.76em;
}

.login-intro {
  max-width: 20rem;
  margin: 0.8rem auto 0;
  color: var(--muted);
  font-size: 0.7rem;
  line-height: 1.5;
}

.login-film {
  position: relative;
  display: grid;
  min-height: 18rem;
  margin-top: 1.25rem;
  grid-template-columns: 1.4rem minmax(0, 1fr) 1.4rem;
  overflow: hidden;
  border: 2px solid var(--gold);
  background: #080806;
  box-shadow:
    inset 0 0 0 4px #080806,
    inset 0 0 0 5px rgba(199, 161, 90, 0.55),
    0 0.8rem 2rem rgba(0, 0, 0, 0.4);
}

.film-edge {
  display: flex;
  align-items: center;
  justify-content: space-around;
  color: var(--gold);
  font-size: 0.46rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  writing-mode: vertical-rl;
}

.film-edge--left {
  border-right: 1px solid rgba(199, 161, 90, 0.5);
  transform: rotate(180deg);
}

.film-edge--right {
  border-left: 1px solid rgba(199, 161, 90, 0.5);
}

.film-edge i {
  width: 0.36rem;
  height: 0.55rem;
  border: 1px solid var(--gold);
}

.login-panel {
  display: flex;
  margin: 0.45rem;
  border: 1px solid rgba(199, 161, 90, 0.48);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background:
    radial-gradient(
      circle at 50% 42%,
      rgba(199, 161, 90, 0.1),
      transparent 34%
    ),
    repeating-linear-gradient(
      125deg,
      #11110e 0 3px,
      #0d0d0b 3px 6px
    );
  padding: 1.4rem 1rem;
  text-align: center;
}

.login-leopard {
  width: 2.8rem;
  height: 2.8rem;
  object-fit: contain;
}

.panel-label {
  margin: 0.65rem 0 0;
  color: var(--gold);
  font-size: 0.48rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.login-panel h2 {
  margin: 0.45rem 0 1rem;
  color: var(--cream);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.3rem;
  font-weight: 400;
}

.login-fields {
  display: grid;
  width: 100%;
  gap: 0.75rem;
}

.login-fields label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.login-fields input {
  width: 100%;
  height: 2.8rem;
  border: 1px solid rgba(199, 161, 90, 0.6);
  border-radius: 0;
  outline: none;
  background: rgba(0, 0, 0, 0.32);
  padding: 0 1rem;
  color: var(--cream);
  font-size: 0.78rem;
  text-align: left;
}

.login-fields input::placeholder {
  color: #776d5e;
}

.login-fields input:focus {
  border-color: #e1c47f;
  box-shadow: 0 0 0 3px rgba(199, 161, 90, 0.12);
}

.password-field {
  position: relative;
  width: 100%;
}

.password-field input {
  padding-right: 3.3rem;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 0.85rem;
  display: grid;
  width: 2rem;
  height: 2rem;
  border: 0;
  background: transparent;
  place-items: center;
  color: var(--gold);
  cursor: pointer;
  transform: translateY(-50%);
}

.password-toggle:focus-visible {
  outline: 1px solid var(--gold);
  outline-offset: 2px;
}

.password-toggle svg {
  width: 1.15rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.login-error {
  margin: 0.75rem 0 0;
  color: #e5a096;
  font-size: 0.65rem;
  line-height: 1.4;
}

.login-ticket {
  display: grid;
  width: 100%;
  min-height: 4.25rem;
  margin-top: 0.8rem;
  padding: 0;
  grid-template-columns: 3.8rem minmax(0, 1fr) 2.8rem;
  overflow: hidden;
  border-radius: 0;
  background:
    linear-gradient(
      100deg,
      rgba(255, 255, 255, 0.1),
      transparent 28% 72%,
      rgba(66, 37, 6, 0.15)
    ),
    var(--gold);
  color: #17130c;
  cursor: pointer;
  text-transform: uppercase;
}

.login-ticket:disabled {
  cursor: not-allowed;
  filter: grayscale(0.45);
  opacity: 0.55;
}

.ticket-stub,
.ticket-mark {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ticket-stub {
  position: relative;
  border-right: 1px dashed rgba(23, 19, 12, 0.58);
  flex-direction: column;
}

.ticket-stub::before,
.ticket-stub::after {
  position: absolute;
  right: -0.28rem;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--panel);
  content: '';
}

.ticket-stub::before {
  top: -0.28rem;
}

.ticket-stub::after {
  bottom: -0.28rem;
}

.ticket-stub small {
  font-size: 0.42rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.ticket-stub strong {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.55rem;
  font-weight: 400;
  line-height: 1;
}

.ticket-action {
  display: grid;
  margin: 0.6rem 0.5rem;
  border: 1px solid rgba(23, 19, 12, 0.52);
  place-items: center;
  font-size: clamp(0.64rem, 2.9vw, 0.8rem);
  font-weight: 900;
  letter-spacing: 0.08em;
}

.ticket-mark {
  border-left: 1px solid rgba(23, 19, 12, 0.32);
}

.ticket-mark img {
  width: 1.7rem;
}

.back-home {
  align-self: center;
  margin: 0.7rem auto 0;
  border: 0;
  background: transparent;
  padding: 0.3rem 0.7rem;
  color: #756b59;
  font-size: 0.52rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 0.2rem;
  text-transform: uppercase;
}

.download-btn {
  font-size: 12px;
}

.admin-app {
  display: flex;
  min-height: calc(
    100svh -
    max(1rem, env(safe-area-inset-top)) -
    max(0.8rem, env(safe-area-inset-bottom))
  );
  flex: 1;
  flex-direction: column;
}

.admin-toolbar {
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr) 5rem;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-button {
  min-height: 2.5rem;
  border: 1px solid rgba(199, 161, 90, 0.42);
  border-radius: 0;
  background: rgba(0, 0, 0, 0.25);
  padding: 0 0.75rem;
  color: var(--gold);
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  cursor: pointer;
  text-transform: uppercase;
}

.toolbar-button--icon {
  display: grid;
  width: 2.5rem;
  padding: 0;
  place-items: center;
  justify-self: end;
}

.toolbar-button:disabled {
  opacity: 0.45;
}

.toolbar-button svg {
  width: 1.15rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.toolbar-title {
  display: flex;
  align-items: center;
  flex-direction: column;
  color: var(--gold);
  line-height: 1;
  text-align: center;
  text-transform: uppercase;
}

.toolbar-title span {
  font-size: 0.42rem;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.toolbar-title strong {
  margin-top: 0.25rem;
  color: var(--cream);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.85rem;
  font-weight: 400;
  letter-spacing: 0.1em;
}

.refresh-spinning {
  animation: refresh-spin 700ms linear infinite;
}

.stats-screen {
  display: flex;
  padding: 1.2rem 0 0;
  flex: 1;
  flex-direction: column;
  justify-content: center;
}

.stats-header {
  text-align: center;
}

.stats-eyebrow {
  margin: 0;
  color: var(--gold);
  font-size: 0.52rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.stats-header h2 {
  margin: 0.45rem 0 0;
  color: var(--cream);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2rem, 9vw, 2.8rem);
  font-weight: 400;
  line-height: 0.9;
  text-transform: uppercase;
}

.stats-header h2 span {
  display: block;
  margin-top: 0.18rem;
  color: var(--gold);
  font-size: 0.72em;
}

.stats-header > p:last-child {
  margin: 0.65rem 0 0;
  color: var(--muted);
  font-size: 0.66rem;
}

.stats-film {
  position: relative;
  display: grid;
  min-height: 25rem;
  margin-top: 1rem;
  grid-template-columns: 1.4rem minmax(0, 1fr) 1.4rem;
  overflow: hidden;
  border: 2px solid var(--gold);
  background: #080806;
  box-shadow:
    inset 0 0 0 4px #080806,
    inset 0 0 0 5px rgba(199, 161, 90, 0.55),
    0 0.8rem 2rem rgba(0, 0, 0, 0.4);
}

.stats-panel {
  display: flex;
  margin: 0.45rem;
  border: 1px solid rgba(199, 161, 90, 0.48);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background:
    radial-gradient(
      circle at 50% 48%,
      rgba(199, 161, 90, 0.11),
      transparent 38%
    ),
    repeating-linear-gradient(
      125deg,
      #11110e 0 3px,
      #0d0d0b 3px 6px
    );
  padding: 1.25rem;
}

.stat-card {
  text-align: center;
}

.stat-label {
  margin: 0;
  color: var(--gold);
  font-size: 0.47rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.stat-card strong {
  display: block;
  margin-top: 0.35rem;
  color: var(--cream);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(4rem, 20vw, 6rem);
  font-weight: 400;
  line-height: 0.85;
}

.stat-card > span {
  display: block;
  margin-top: 0.55rem;
  color: var(--gold);
  font-size: 0.67rem;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.stat-divider {
  display: flex;
  width: 100%;
  margin: 1.25rem 0;
  align-items: center;
  gap: 0.7rem;
}

.stat-divider span {
  height: 1px;
  flex: 1;
  background: linear-gradient(
    to right,
    transparent,
    var(--dark-gold)
  );
}

.stat-divider span:last-child {
  background: linear-gradient(
    to left,
    transparent,
    var(--dark-gold)
  );
}

.stat-divider img {
  width: 1.8rem;
  height: 1.8rem;
  object-fit: contain;
}

.gallery-ticket {
  display: grid;
  width: 100%;
  min-height: 4.25rem;
  margin-top: 0.8rem;
  padding: 0;
  grid-template-columns: 3.8rem minmax(0, 1fr) 2.8rem;
  overflow: hidden;
  border-radius: 0;
  background:
    linear-gradient(
      100deg,
      rgba(255, 255, 255, 0.1),
      transparent 28% 72%,
      rgba(66, 37, 6, 0.15)
    ),
    var(--gold);
  color: #17130c;
  cursor: pointer;
  text-transform: uppercase;
}

.gallery-ticket:disabled {
  cursor: not-allowed;
  filter: grayscale(0.45);
  opacity: 0.55;
}

.gallery-stub,
.gallery-mark {
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-stub {
  position: relative;
  border-right: 1px dashed rgba(23, 19, 12, 0.58);
  flex-direction: column;
}

.gallery-stub::before,
.gallery-stub::after {
  position: absolute;
  right: -0.28rem;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--panel);
  content: '';
}

.gallery-stub::before {
  top: -0.28rem;
}

.gallery-stub::after {
  bottom: -0.28rem;
}

.gallery-stub small {
  font-size: 0.4rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.gallery-stub strong {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.45rem;
  font-weight: 400;
  line-height: 1;
}

.gallery-action {
  display: grid;
  margin: 0.6rem 0.5rem;
  border: 1px solid rgba(23, 19, 12, 0.52);
  place-items: center;
  font-size: clamp(0.6rem, 2.8vw, 0.76rem);
  font-weight: 900;
  letter-spacing: 0.07em;
}

.gallery-mark {
  border-left: 1px solid rgba(23, 19, 12, 0.32);
}

.gallery-mark img {
  width: 1.7rem;
}

.last-updated {
  margin: 0.55rem 0 0;
  color: #756b59;
  font-size: 0.46rem;
  letter-spacing: 0.09em;
  text-align: center;
  text-transform: uppercase;
}

@keyframes refresh-spin {
  to {
    transform: rotate(360deg);
  }
}

.logout-overlay {
  position: fixed;
  z-index: 50;
  display: grid;
  inset: 0;
  padding: 1.25rem;
  place-items: center;
  background: rgba(4, 4, 4, 0.88);
  backdrop-filter: blur(5px);
}

.logout-dialog {
  position: relative;
  display: grid;
  width: min(100%, 24rem);
  min-height: 24rem;
  grid-template-columns: 1.35rem minmax(0, 1fr) 1.35rem;
  overflow: hidden;
  border: 2px solid var(--gold);
  background: #080806;
  box-shadow:
    inset 0 0 0 4px #080806,
    inset 0 0 0 5px rgba(199, 161, 90, 0.55),
    0 2rem 5rem rgba(0, 0, 0, 0.65);
}

.logout-film-edge {
  display: flex;
  align-items: center;
  justify-content: space-around;
  color: var(--gold);
  font-size: 0.44rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  writing-mode: vertical-rl;
}

.logout-film-edge--left {
  border-right: 1px solid rgba(199, 161, 90, 0.5);
  transform: rotate(180deg);
}

.logout-film-edge--right {
  border-left: 1px solid rgba(199, 161, 90, 0.5);
}

.logout-film-edge i {
  width: 0.35rem;
  height: 0.54rem;
  border: 1px solid var(--gold);
}

.logout-content {
  display: flex;
  margin: 0.45rem;
  border: 1px solid rgba(199, 161, 90, 0.48);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background:
    radial-gradient(
      circle at 50% 42%,
      rgba(199, 161, 90, 0.11),
      transparent 35%
    ),
    repeating-linear-gradient(
      125deg,
      #11110e 0 3px,
      #0d0d0b 3px 6px
    );
  padding: 1.5rem 1rem;
  text-align: center;
}

.logout-leopard {
  width: 2.7rem;
  height: 2.7rem;
  object-fit: contain;
}

.logout-eyebrow {
  margin: 0.75rem 0 0;
  color: var(--gold);
  font-size: 0.48rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.logout-content h2 {
  margin: 0.45rem 0 0;
  color: var(--cream);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 2rem;
  font-weight: 400;
}

.logout-divider {
  display: flex;
  width: 100%;
  margin: 0.9rem 0;
  align-items: center;
  gap: 0.6rem;
}

.logout-divider span {
  height: 1px;
  flex: 1;
  background: linear-gradient(
    to right,
    transparent,
    var(--dark-gold)
  );
}

.logout-divider span:last-child {
  background: linear-gradient(
    to left,
    transparent,
    var(--dark-gold)
  );
}

.logout-divider i {
  width: 0.45rem;
  height: 0.45rem;
  border: 1px solid var(--gold);
  transform: rotate(45deg);
}

.logout-copy {
  max-width: 17rem;
  margin: 0;
  color: var(--muted);
  font-size: 0.7rem;
  line-height: 1.55;
}

.logout-ticket {
  display: grid;
  width: 100%;
  min-height: 4rem;
  margin-top: 1.25rem;
  padding: 0;
  grid-template-columns: 3.5rem minmax(0, 1fr) 2.6rem;
  overflow: hidden;
  border-radius: 0;
  background:
    linear-gradient(
      100deg,
      rgba(255, 255, 255, 0.1),
      transparent 28% 72%,
      rgba(66, 37, 6, 0.15)
    ),
    var(--gold);
  color: #17130c;
  cursor: pointer;
  text-transform: uppercase;
}

.logout-ticket-stub,
.logout-ticket-mark {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-ticket-stub {
  position: relative;
  border-right: 1px dashed rgba(23, 19, 12, 0.58);
  flex-direction: column;
}

.logout-ticket-stub::before,
.logout-ticket-stub::after {
  position: absolute;
  right: -0.27rem;
  width: 0.54rem;
  height: 0.54rem;
  border-radius: 50%;
  background: #11110e;
  content: '';
}

.logout-ticket-stub::before {
  top: -0.27rem;
}

.logout-ticket-stub::after {
  bottom: -0.27rem;
}

.logout-ticket-stub small {
  font-size: 0.4rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.logout-ticket-stub strong {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.4rem;
  font-weight: 400;
  line-height: 1;
}

.logout-ticket-action {
  display: grid;
  margin: 0.55rem 0.45rem;
  border: 1px solid rgba(23, 19, 12, 0.52);
  place-items: center;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.logout-ticket-mark {
  border-left: 1px solid rgba(23, 19, 12, 0.32);
}

.logout-ticket-mark img {
  width: 1.55rem;
}

.cancel-logout {
  margin-top: 0.9rem;
  border: 0;
  background: transparent;
  padding: 0.35rem 0.7rem;
  color: var(--muted);
  font-size: 0.52rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-decoration: underline;
  text-underline-offset: 0.22rem;
  cursor: pointer;
  text-transform: uppercase;
}

@media (max-height: 620px) {
  .logout-dialog {
    min-height: 20rem;
  }

  .logout-content {
    padding-block: 0.8rem;
  }

  .logout-leopard {
    width: 2rem;
    height: 2rem;
  }

  .logout-divider {
    margin: 0.55rem 0;
  }

  .logout-ticket {
    margin-top: 0.75rem;
  }
}

@media (max-height: 780px) {
  .stats-screen {
    justify-content: flex-start;
    padding-top: 0.7rem;
  }

  .stats-film {
    min-height: 18rem;
    margin-top: 0.7rem;
  }

  .stat-card strong {
    font-size: 3.5rem;
  }

  .stat-divider {
    margin: 0.75rem 0;
  }

  .gallery-ticket {
    min-height: 3.8rem;
  }
}

@media (max-height: 760px) {
  .login-screen {
    justify-content: flex-start;
  }

  .film-details {
    margin-bottom: 0.35rem;
  }

  .login-film {
    min-height: 14rem;
    margin-top: 0.75rem;
  }

  .login-panel {
    padding-block: 0.8rem;
  }

  .login-leopard {
    width: 2rem;
    height: 2rem;
  }

  .login-panel h2 {
    margin-bottom: 0.65rem;
  }
}
</style>