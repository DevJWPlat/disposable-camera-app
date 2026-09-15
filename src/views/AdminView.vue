<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/utils/api.js'
import { eventConfig } from '@/config/event.js'
import AdminGallery from '@/components/admin/AdminGallery.vue'
import logo from '@/assets/events/sophies-last-rodeo/sophie-logo.png'
import photoFrame from '@/assets/events/sophies-last-rodeo/polaroid-frame.png'
import cowboyHat from '@/assets/events/sophies-last-rodeo/cowboy-hat.png'
import horseshoe from '@/assets/events/sophies-last-rodeo/horseshoe.png'
import rope from '@/assets/events/sophies-last-rodeo/rope.png'
import sparkles from '@/assets/events/sophies-last-rodeo/sparkles.png'
import desertFooter from '@/assets/events/sophies-last-rodeo/desert-footer.png'
import loginButton from '@/assets/events/sophies-last-rodeo/login-button.png'
import mailIcon from '@/assets/events/sophies-last-rodeo/mail.png'
import lockIcon from '@/assets/events/sophies-last-rodeo/lock.png'
import eyeOpenIcon from '@/assets/events/sophies-last-rodeo/eye-open.png'
import eyeClosedIcon from '@/assets/events/sophies-last-rodeo/eye-closed.png'
import galleryLockedScreen from '@/assets/events/sophies-last-rodeo/gallery-locked-screen-final-v3.png'
import galleryUnlockedScreen from '@/assets/events/sophies-last-rodeo/gallery-unlocked-screen-v2.png'
import galleryLockedMobile from '@/assets/events/sophies-last-rodeo/gallery-locked-mobile-final.png'
import galleryUnlockedMobile from '@/assets/events/sophies-last-rodeo/gallery-unlocked-mobile-v2.png'
import galleryLockedButton from '@/assets/events/sophies-last-rodeo/gallery-locked-button.png'
import galleryUnlockedButton from '@/assets/events/sophies-last-rodeo/gallery-unlocked-button.png'
import noticeBoardDesktop from '@/assets/events/sophies-last-rodeo/admin-notice-board-desktop.png'
import noticeBoardMobile from '@/assets/events/sophies-last-rodeo/admin-notice-board-mobile.png'

const router = useRouter()

const heroImages = eventConfig.heroImages || []
const heroImage = heroImages.length
  ? heroImages[Math.floor(Math.random() * heroImages.length)]
  : eventConfig.heroImage

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
const stage = ref('unlock')
const animatedShotsTaken = ref(0)
let shotsAnimationFrame = 0

function openNoticeBoard() {
  stage.value = 'notice'
  animatedShotsTaken.value = 0

  if (shotsAnimationFrame) {
    cancelAnimationFrame(shotsAnimationFrame)
  }

  const target = Math.max(0, Number(stats.value?.photos ?? photos.value.length ?? 0))
  const duration = 900
  const startedAt = performance.now()

  const tick = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration)
    const eased = 1 - Math.pow(1 - progress, 3)
    animatedShotsTaken.value = Math.round(target * eased)

    if (progress < 1) {
      shotsAnimationFrame = requestAnimationFrame(tick)
    } else {
      animatedShotsTaken.value = target
      shotsAnimationFrame = 0
    }
  }

  shotsAnimationFrame = requestAnimationFrame(tick)
}


const galleryUnlockAt = new Date('2026-09-21T09:00:00+01:00')
const testingUnlockEnabled = true

const isGalleryUnlocked = computed(() => {
  return testingUnlockEnabled || Date.now() >= galleryUnlockAt.getTime()
})

const unlockDateLabel = 'Monday 21st September at 9:00am'

const isLoggedIn = computed(() => Boolean(admin.value))
const themeStyle = computed(() => ({
  '--event-bg': eventConfig.palette?.background,
  '--event-surface': eventConfig.palette?.surface,
  '--event-ink': eventConfig.palette?.ink,
  '--event-muted': eventConfig.palette?.muted,
  '--event-accent': eventConfig.palette?.accent,
  '--event-accent-dark': eventConfig.palette?.accentDark,
  '--event-line': eventConfig.palette?.line,
  '--event-camera': eventConfig.palette?.camera,
}))

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.ok) {
    if (response.status === 401) admin.value = null
    throw new Error(data?.error || `Request failed (${response.status})`)
  }
  return data
}

async function restore() {
  try {
    const data = await api('/api/admin/me')
    admin.value = data.admin
    await refreshData()
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
    const data = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, password: password.value }),
    })
    admin.value = data.admin
    password.value = ''
    await refreshData()
  } catch (err) {
    error.value = err.message
  } finally {
    loggingIn.value = false
  }
}

async function logout() {
  try {
    await api('/api/admin/logout', { method: 'POST', body: JSON.stringify({}) })
  } catch {}
  admin.value = null
  stats.value = null
  photos.value = []
  stage.value = 'unlock'
}

async function refreshData() {
  if (!admin.value) return
  refreshing.value = true
  error.value = ''
  try {
    const [statsData, photoData] = await Promise.all([
      api('/api/admin/stats'),
      api('/api/admin/photos'),
    ])
    stats.value = statsData
    photos.value = photoData.photos || []
  } catch (err) {
    error.value = err.message
  } finally {
    refreshing.value = false
  }
}

onMounted(restore)

onBeforeUnmount(() => {
  if (shotsAnimationFrame) {
    cancelAnimationFrame(shotsAnimationFrame)
  }
})
</script>

<template>
  <main class="admin-page" :class="`theme--${eventConfig.theme}`" :style="themeStyle">
    <section class="shell" :class="{ 'shell--wide': isLoggedIn && (stage === 'unlock' || stage === 'notice' || stage === 'gallery') }" style="padding: 0;">
      <div v-if="loading" class="state">Loading admin…</div>

      <section v-else-if="!isLoggedIn" class="admin-login-poster">
        <div class="grain" aria-hidden="true"></div>

        <img class="sparkles" :src="sparkles" alt="" aria-hidden="true" />
        <img class="horseshoe" :src="horseshoe" alt="" aria-hidden="true" />
        <img class="rope" :src="rope" alt="" aria-hidden="true" />

        <button
          class="photo-stage"
          type="button"
          aria-label="Back to event homepage"
          @click="router.push('/')"
        >
          <div class="photo-window">
            <img
              v-if="heroImage"
              :src="heroImage"
              :alt="`${eventConfig.title} photo`"
              class="hero-photo"
            />

            <div v-else class="photo-placeholder">
              <span>{{ eventConfig.copy.landing.photoPlaceholder }}</span>
              <b>♡</b>
            </div>
          </div>

          <img class="photo-frame" :src="photoFrame" alt="" aria-hidden="true" />
          <img class="cowboy-hat" :src="cowboyHat" alt="" aria-hidden="true" />
        </button>

        <section class="logo-stage">
          <img class="event-logo" :src="logo" :alt="eventConfig.title" />
        </section>

        <form class="poster-login-form" @submit.prevent="login">
          <label for="admin-email">Email</label>
          <div class="poster-input">
            <span class="poster-input__icon" aria-hidden="true">
              <img :src="mailIcon" alt="" />
            </span>
            <input
              id="admin-email"
              v-model.trim="email"
              type="email"
              autocomplete="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <label for="admin-password">Password</label>
          <div class="poster-input">
            <span class="poster-input__icon" aria-hidden="true">
              <img :src="lockIcon" alt="" />
            </span>

            <input
              id="admin-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Enter your password"
              required
            />

            <button
              class="poster-input__visibility"
              type="button"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <img
                :src="showPassword ? eyeClosedIcon : eyeOpenIcon"
                alt=""
                aria-hidden="true"
              />
            </button>
          </div>

          <p v-if="error" class="poster-login-error">{{ error }}</p>

          <button
            class="poster-login-button"
            :disabled="loggingIn"
            type="submit"
            :aria-label="loggingIn ? 'Signing in' : 'Login'"
          >
            <img :src="loginButton" alt="" aria-hidden="true" />
            <span v-if="loggingIn" class="poster-login-loading">Signing in…</span>
          </button>
        </form>

        <section class="desert-stage">
          <img class="desert-art" :src="desertFooter" alt="" aria-hidden="true" />
          <div class="desert-shadow" aria-hidden="true"></div>

          <p class="bottom-note bottom-note--left">{{ eventConfig.copy.landing.sideNoteLeft }}</p>
          <p class="bottom-note bottom-note--right">{{ eventConfig.copy.landing.sideNoteRight }}</p>
          <p class="footer-label">{{ eventConfig.copy.landing.footer }}</p>
        </section>
      </section>

      <template v-else>
        <header v-if="stage !== 'unlock' && stage !== 'notice'" class="toolbar">
          <div>
            <small>{{ eventConfig.shortTitle }}</small>
            <strong>Admin</strong>
          </div>
          <div class="toolbar-actions">
            <button
              v-if="stage !== 'gallery'"
              type="button"
              :disabled="refreshing"
              @click="refreshData"
            >
              {{ refreshing ? 'Refreshing…' : 'Refresh' }}
            </button>
            <button type="button" @click="logout">Log out</button>
          </div>
        </header>

        <p v-if="error" class="error">{{ error }}</p>

        <section
          v-if="stage === 'unlock'"
          class="gallery-gate-shell"
          :class="{ 'gallery-gate-shell--unlocked': isGalleryUnlocked }"
        >
          <header class="gallery-gate-topbar">
            <div class="gallery-gate-brand">
              <small>Sophie’s</small>
              <strong>Last Rodeo ★</strong>
            </div>

            <div class="gallery-gate-topbar__actions">
              <button
                type="button"
                :disabled="refreshing"
                @click="refreshData"
              >
                {{ refreshing ? 'Refreshing…' : 'Refresh' }}
              </button>
              <button type="button" @click="logout">Log out</button>
            </div>
          </header>

          <div class="gallery-gate">
            <picture class="gallery-gate__picture">
              <source
                media="(max-width: 499px)"
                :srcset="isGalleryUnlocked ? galleryUnlockedMobile : galleryLockedMobile"
              />
              <img
                class="gallery-gate__screen"
                :src="isGalleryUnlocked ? galleryUnlockedScreen : galleryLockedScreen"
                :alt="isGalleryUnlocked ? 'The gallery is unlocked' : 'The gallery is locked'"
              />
            </picture>

            <button
              class="gallery-gate__continue"
              type="button"
              :disabled="!isGalleryUnlocked"
              :aria-label="isGalleryUnlocked ? 'Continue to photos' : 'Photos are locked until the gallery opens'"
              @click="openNoticeBoard"
            >
              <img
                :src="isGalleryUnlocked ? galleryUnlockedButton : galleryLockedButton"
                alt=""
                aria-hidden="true"
              />
            </button>
          </div>
        </section>

        <section v-else-if="stage === 'notice'" class="notice-board-shell">
          <header class="gallery-gate-topbar">
            <div class="gallery-gate-brand">
              <small>Sophie’s</small>
              <strong>Last Rodeo ★</strong>
            </div>

            <div class="gallery-gate-topbar__actions">
              <button
                type="button"
                :disabled="refreshing"
                @click="refreshData"
              >
                {{ refreshing ? 'Refreshing…' : 'Refresh' }}
              </button>
              <button type="button" @click="logout">Log out</button>
            </div>
          </header>

          <div class="notice-board">
            <picture class="notice-board__picture">
              <source media="(max-width: 499px)" :srcset="noticeBoardMobile" />
              <img
                class="notice-board__screen"
                :src="noticeBoardDesktop"
                alt="Sophie’s Last Rodeo notice board with wanted poster and shots taken"
              />
            </picture>

            <strong class="notice-board__count" aria-label="Photos taken">
              {{ animatedShotsTaken }}
            </strong>

            <button
              class="notice-board__continue"
              type="button"
              aria-label="Continue to gallery"
              @click="stage = 'gallery'"
            >
              <img :src="galleryUnlockedButton" alt="" aria-hidden="true" />
            </button>
          </div>
        </section>

        <section v-else-if="stage === 'dashboard'" class="dashboard">
          <p class="eyebrow">{{ eventConfig.title }}</p>
          <h1>Event dashboard</h1>
          <p class="dashboard-copy">A simple view of the camera activity and gallery.</p>

          <div class="stats-grid">
            <article>
              <span>Total photos</span>
              <strong>{{ stats?.photos ?? 0 }}</strong>
            </article>
            <article>
              <span>Shot allowance</span>
              <strong>{{ stats?.maxShots ?? eventConfig.maxShots }}</strong>
            </article>
            <article>
              <span>Active sessions</span>
              <strong>{{ stats?.sessions ?? 0 }}</strong>
            </article>
            <article>
              <span>Latest upload</span>
              <strong class="small-stat">{{ stats?.latestUpload || 'None yet' }}</strong>
            </article>
          </div>

          <button class="primary" type="button" :disabled="photos.length === 0" @click="stage = 'gallery'">
            View gallery
          </button>
        </section>

        <AdminGallery
          v-else
          :photos="photos"
          @back="stage = 'dashboard'"
          @refresh="refreshData"
        />
      </template>
    </section>
  </main>
</template>

<style scoped>
.admin-page {
  --event-bg:#f1dfd1;
  --event-surface:#fff8ef;
  --event-ink:#2c1a16;
  --event-muted:#7b5e55;
  --event-accent:#c77f8c;
  --event-accent-dark:#8c4c58;
  --event-line:#432820;
  --event-camera:#211512;
  min-height:100svh;
  background:var(--event-camera);
  color:var(--event-surface);
}
.shell { width:min(100%,38rem); min-height:100svh; margin:0 auto; padding:max(1rem,env(safe-area-inset-top)) 1rem max(1rem,env(safe-area-inset-bottom)); }
.shell--wide { width:min(100%,86rem); max-width:none; }
.state { min-height:80svh; display:grid; place-items:center; color:rgba(255,255,255,.65); }
.login-card { position:relative; display:grid; gap:.7rem; width:min(100%,28rem); margin:9vh auto 0; border:1px solid color-mix(in srgb,var(--event-accent) 55%,transparent); background:color-mix(in srgb,var(--event-camera) 88%,black); padding:1.6rem; box-shadow:.4rem .4rem 0 color-mix(in srgb,var(--event-accent) 70%,transparent); }
.admin-badge { position:absolute; top:1rem; right:1rem; border:1px solid color-mix(in srgb,var(--event-accent) 50%,transparent); padding:.3rem .45rem; color:var(--event-accent); font-size:.5rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }
.eyebrow { margin:0; color:var(--event-accent); font-size:.62rem; font-weight:900; letter-spacing:.14em; text-transform:uppercase; }
h1 { margin:.35rem 0 0; font-family:Georgia,serif; font-size:2.35rem; font-weight:500; }
.login-copy,.dashboard-copy { margin:0 0 .35rem; color:rgba(255,255,255,.52); font-size:.72rem; line-height:1.5; }
label { font-size:.64rem; color:rgba(255,255,255,.62); font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
input { min-height:3rem; border:1px solid rgba(255,255,255,.2); background:rgba(0,0,0,.18); color:white; padding:0 .8rem; outline:none; }
input:focus { border-color:var(--event-accent); }
button { min-height:2.6rem; border:1px solid rgba(255,255,255,.22); background:transparent; color:var(--event-surface); padding:.5rem .75rem; cursor:pointer; }
button:disabled { cursor:not-allowed; opacity:.45; }
.login-card button,.primary { border:0; background:var(--event-accent); color:var(--event-line); font-weight:900; }
.error { color:#ffaaa1; }
.toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding-bottom:1rem; border-bottom:1px solid rgba(255,255,255,.1); }
.shell--wide > .toolbar { padding: .85rem clamp(1rem, 3vw, 2rem); }
.toolbar div:first-child { display:flex; flex-direction:column; }
.toolbar small { color:var(--event-accent); font-size:.58rem; text-transform:uppercase; }
.toolbar strong { margin-top:.1rem; font-family:Georgia,serif; font-size:1.25rem; }
.toolbar-actions { display:flex; gap:.5rem; }
.dashboard { padding-top:3rem; }
.stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; margin-top:1.4rem; }
.stats-grid article { min-height:8rem; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.035); padding:1rem; display:flex; flex-direction:column; justify-content:space-between; }
.stats-grid span { color:rgba(255,255,255,.48); font-size:.66rem; font-weight:800; letter-spacing:.07em; text-transform:uppercase; }
.stats-grid strong { color:var(--event-surface); font-family:Georgia,serif; font-size:2.5rem; font-weight:500; }
.small-stat { font-size:.82rem !important; line-height:1.35; }
.primary { width:100%; margin-top:1rem; min-height:3.3rem; text-transform:uppercase; letter-spacing:.08em; }


.gallery-gate-shell {
  width: 100%;
  min-height: calc(100svh - max(1rem, env(safe-area-inset-top)) - max(1rem, env(safe-area-inset-bottom)));
  background: #17110f;
}

.gallery-gate-topbar {
  display: flex;
  min-height: 4.25rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid rgba(255,255,255,.14);
  background: #211815;
  padding: .65rem clamp(.8rem, 3vw, 2rem);
}

.gallery-gate-brand {
  display: flex;
  flex-direction: column;
  line-height: .9;
  text-transform: uppercase;
}

.gallery-gate-brand small {
  color: #ef6888;
  font-size: .66rem;
  font-weight: 900;
  letter-spacing: .04em;
}

.gallery-gate-brand strong {
  margin-top: .18rem;
  color: #f7e9dc;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.15rem, 2vw, 1.7rem);
  font-weight: 900;
  letter-spacing: .02em;
}

.gallery-gate-topbar__actions {
  display: flex;
  gap: .45rem;
}

.gallery-gate-topbar__actions button {
  min-height: 2.45rem;
  border: 1px solid rgba(255,255,255,.45);
  background: transparent;
  color: #f7e9dc;
  padding: .45rem .8rem;
  cursor: pointer;
  transition: background .15s ease, transform .15s ease;
}

.gallery-gate-topbar__actions button:hover:not(:disabled) {
  background: rgba(255,255,255,.08);
  transform: translateY(-1px);
}

.gallery-gate {
  position: relative;
  width: 100%;
  height: auto;
  min-height: 0vh;
  overflow: hidden;
  background: #f3cbc6;
}

.gallery-gate__picture {
  display: block;
  width: 100%;
  height: 100%;
}

.gallery-gate__screen {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  user-select: none;
  pointer-events: none;
}

.gallery-gate__continue {
  position: absolute;
  z-index: 4;
  left: 50%;
  bottom: 0;
  width: min(29.5rem, 31vw);
  min-height: 0;
  transform: translateX(-50%);
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  transition: transform .16s ease, filter .16s ease;
}

.gallery-gate-shell--unlocked .gallery-gate__continue {
  bottom: 13.5%;
}

.gallery-gate__continue img {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 .45rem .7rem rgba(71,34,27,.24));
}

.gallery-gate__continue:hover:not(:disabled) {
  transform: translateX(-50%) translateY(-3px) scale(1.018);
  filter: brightness(1.05);
}

.gallery-gate__continue:active:not(:disabled) {
  transform: translateX(-50%) scale(.985);
}

.gallery-gate__continue:disabled {
  cursor: not-allowed;
  opacity: 1;
}

@media (max-width: 499px) {
  .shell--wide {
    width: 100%;
    min-height: 100svh;
    margin: 0;
    padding: 0;
  }

  .gallery-gate-shell {
    min-height: 100svh;
  }

  .gallery-gate-topbar {
    min-height: 4rem;
    padding-top: max(.6rem, env(safe-area-inset-top));
    padding-right: .7rem;
    padding-left: .7rem;
  }

  .gallery-gate-brand strong {
    font-size: 1.05rem;
  }

  .gallery-gate-topbar__actions button {
    min-height: 2.15rem;
    padding: .3rem .55rem;
    font-size: .68rem;
  }

  .gallery-gate {
    height: calc(100svh - 4rem);
    min-height: 0;
  }

  .gallery-gate__picture,
  .gallery-gate__screen {
    width: 100%;
    height: 100%;
  }

  .gallery-gate__screen {
    object-fit: cover;
    object-position: center center;
  }

  .gallery-gate__continue {
    bottom: max(1rem, calc(env(safe-area-inset-bottom) + 1rem));
    width: min(84vw, 22rem);
  }

  .gallery-gate-shell--unlocked .gallery-gate__continue {
    bottom: max(1rem, calc(env(safe-area-inset-bottom) + 1rem));
  }
}

@media (min-width: 500px) {
  .shell--wide {
    width: 100%;
    max-width: none;
    padding-right: 0;
    padding-left: 0;
  }
}


.notice-board-shell {
  width: 100%;
  min-height: 100svh;
  background: #17110f;
}

.notice-board {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #f3cbc6;
}

.notice-board__picture {
  display: block;
  width: 100%;
}

.notice-board__screen {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  pointer-events: none;
}

.notice-board__count {
  position: absolute;
  z-index: 3;
  top: 49.5%;
  left: 59.9%;
  transform: translate(-50%, -50%);
  color: #4d260f;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(5rem, 9vw, 10rem);
  font-weight: 900;
  line-height: .8;
  text-align: center;
  text-shadow:
    0 .05em 0 rgba(255, 244, 210, .65),
    0 .08em .04em rgba(79, 42, 18, .22);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 767px) {
  .notice-board__count {
    font-size: 50px;
    left: 57%;
  }
}

.notice-board__continue {
  position: absolute;
  z-index: 4;
  left: 50%;
  bottom: 3.2%;
  width: min(29.5rem, 31vw);
  min-height: 0;
  transform: translateX(-50%);
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  transition: transform .16s ease, filter .16s ease;
}

.notice-board__continue img {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 .45rem .7rem rgba(71,34,27,.24));
}

.notice-board__continue:hover {
  transform: translateX(-50%) translateY(-3px) scale(1.018);
  filter: brightness(1.05);
}

.notice-board__continue:active {
  transform: translateX(-50%) scale(.985);
}

@media (max-width: 499px) {
  .notice-board-shell {
    min-height: 100svh;
  }

  .notice-board {
    min-height: calc(100svh - 4rem);
  }

  .notice-board__picture,
  .notice-board__screen {
    width: 100%;
    height: 100vh;
  }

  .notice-board__count {
    top: 48.3%;
    left: 65.1%;
    font-size: 70px;
  }

  .notice-board__continue {
    bottom: max(1rem, calc(env(safe-area-inset-bottom) + 1rem));
    width: min(84vw, 22rem);
  }
}

.event-home-link {
  display: block;
  width: min(150px, 44vw);
  margin: 0 auto 14px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.event-home-link img {
  display: block;
  width: 100%;
  height: auto;
}

.event-home-link:hover img {
  transform: translateY(-1px);
}

.event-home-link:focus-visible {
  outline: 2px solid #d97188;
  outline-offset: 4px;
}


/* Logged-out admin mirrors the current Sophie homepage. */
.admin-page:has(.admin-login-poster) {
  min-height: 100svh;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 50% -10%, rgba(216, 106, 134, .18), transparent 34rem),
    #151515;
}

.admin-page:has(.admin-login-poster) .shell {
  width: 100%;
  max-width: none;
  min-height: 100svh;
  margin: 0;
  padding: 0;
}

.admin-login-poster {
  position: relative;
  isolation: isolate;
  width: min(100vw, 430px);
  aspect-ratio: 430 / 1080;
  min-height: 1080px;
  margin: 0 auto;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 245, 242, 1) 0%, rgba(253, 198, 182, 1) 40%);
  color: #2a1e1c;
}

.admin-login-poster .grain {
  position: absolute;
  inset: 0;
  z-index: 30;
  pointer-events: none;
  opacity: .08;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.48'/%3E%3C/svg%3E");
}

.admin-login-poster .sparkles {
  position: absolute;
  z-index: 2;
  top: -8%;
  left: 50%;
  width: 100%;
  transform: translateX(-50%);
  opacity: .72;
  pointer-events: none;
}

.admin-login-poster .horseshoe {
  position: absolute;
  z-index: 6;
  top: 18%;
  left: -1.5%;
  width: 17%;
  transform: rotate(-13deg);
  filter: drop-shadow(0 5px 5px rgba(71,39,33,.12));
}

.admin-login-poster .rope {
  position: absolute;
  z-index: 4;
  top: 22%;
  right: 0;
  width: 20%;
  height: 38%;
  object-fit: contain;
  object-position: top right;
  transform: rotate(-25deg);
}

.admin-login-poster .photo-stage {
  position: absolute;
  z-index: 7;
  top: 5.2%;
  left: 50%;
  width: 76%;
  aspect-ratio: 1 / 1;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transform: translateX(-50%);
}

.admin-login-poster .photo-window {
  position: absolute;
  top: 7.5%;
  left: 16%;
  z-index: 4;
  width: 68%;
  height: 72%;
  overflow: hidden;
  background: transparent;
  transform: rotate(-2.7deg);
}

.admin-login-poster .hero-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
}

.admin-login-poster .photo-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-content: center;
  justify-items: center;
  gap: .45em;
  padding: 8%;
  color: #e27f98;
  font-family: "Snell Roundhand", "Brush Script MT", "Segoe Script", cursive;
  font-size: clamp(18px, 6.3vw, 30px);
  line-height: 1.12;
  text-align: center;
}

.admin-login-poster .photo-placeholder span {
  white-space: pre-line;
}

.admin-login-poster .photo-placeholder b {
  font-size: 1.55em;
  font-weight: 400;
}

.admin-login-poster .photo-frame {
  position: absolute;
  inset: 0;
  z-index: 5;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 10px 14px rgba(76,37,31,.13));
}

.admin-login-poster .cowboy-hat {
  position: absolute;
  z-index: 7;
  top: -19%;
  right: -7%;
  width: 58%;
  height: auto;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 9px 8px rgba(76,37,31,.16));
}

.admin-login-poster .logo-stage {
  position: absolute;
  z-index: 10;
  top: 32.8%;
  left: 50%;
  width: 92%;
  transform: translateX(-50%);
}

.admin-login-poster .event-logo {
  display: block;
  width: 100%;
  height: auto;
}

.poster-login-form {
  position: absolute;
  z-index: 12;
  top: 57%;
  left: 50%;
  display: grid;
  width: 78%;
  transform: translateX(-50%);
  gap: 8px;
}

.poster-login-form label {
  margin: 4px 0 0 2px;
  color: #6f4d42;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .16em;
  text-transform: uppercase;
}

.poster-input {
  display: flex;
  min-height: 56px;
  align-items: center;
  overflow: hidden;
  border: 2px solid #8f4d59;
  border-radius: 7px;
  background:
    linear-gradient(180deg, rgba(255,251,247,.98), rgba(253,239,230,.96));
  box-shadow:
    0 0 0 2px rgba(216,167,91,.65),
    inset 0 1px 0 rgba(255,255,255,.75);
}

.poster-input__icon {
  display: grid;
  width: 56px;
  flex: 0 0 56px;
  place-items: center;
}

.poster-input__icon img {
  display: block;
  width: 30px;
  height: 30px;
  object-fit: contain;
}


.poster-input__visibility {
  display: grid;
  width: 56px;
  height: 54px;
  flex: 0 0 56px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  place-items: center;
}

.poster-input__visibility img {
  display: block;
  width: 31px;
  height: 31px;
  object-fit: contain;
  transition: transform .14s ease, opacity .14s ease;
}

.poster-input__visibility:hover img {
  transform: scale(1.06);
}

.poster-input__visibility:focus-visible {
  outline: 2px solid #d35372;
  outline-offset: -5px;
  border-radius: 6px;
}

.poster-input input {
  width: 100%;
  min-width: 0;
  min-height: 54px;
  border: 0;
  outline: 0;
  background: transparent;
  padding: 0 14px 0 0;
  color: #3c2824;
  font-size: 14px;
}

.poster-input input::placeholder {
  color: #b58e85;
}

.poster-input:focus-within {
  border-color: #d35372;
  box-shadow:
    0 0 0 2px #d8a75b,
    0 0 0 5px rgba(211,83,114,.12);
}

.poster-login-error {
  margin: 4px 0 -2px;
  color: #9f3148;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.35;
  text-align: center;
}

.poster-login-button {
  position: relative;
  display: block;
  width: 100%;
  margin: 8px auto 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  transition: transform .15s ease, filter .15s ease;
}

.poster-login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.025);
}

.poster-login-button:active:not(:disabled) {
  transform: translateY(0);
}

.poster-login-button:disabled {
  cursor: wait;
  opacity: .78;
}

.poster-login-button img {
  display: block;
  width: 100%;
  height: auto;
}

.poster-login-loading {
  position: absolute;
  inset: 0;
  display: grid;
  background: rgba(211,83,114,.82);
  color: #fff8ef;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: .12em;
  place-items: center;
  text-transform: uppercase;
}

.admin-login-poster .desert-stage {
  position: absolute;
  z-index: 5;
  right: 0;
  bottom: 0;
  left: 0;
  height: 25%;
}

.admin-login-poster .desert-art {
  position: absolute;
  inset: auto 0 0;
  width: 100%;
  height: 128%;
  object-fit: cover;
  object-position: center 70%;
  transform: scale(1.34);
  transform-origin: center bottom;
}

.admin-login-poster .desert-shadow {
  position: absolute;
  inset: auto 0 0;
  height: 43%;
  background: linear-gradient(180deg, transparent, rgba(23,17,15,.96) 55%);
}

.admin-login-poster .bottom-note {
  position: absolute;
  z-index: 9;
  bottom: 8%;
  width: 19%;
  margin: 0;
  white-space: pre-line;
  color: #ef829b;
  font-family: "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive;
  font-size: 9px;
  font-weight: 800;
  line-height: .94;
  text-transform: uppercase;
}

.admin-login-poster .bottom-note--left {
  left: 4%;
  transform: rotate(-8deg);
}

.admin-login-poster .bottom-note--right {
  right: 4%;
  text-align: right;
  transform: rotate(7deg);
}

.admin-login-poster .footer-label {
  position: absolute;
  right: 0;
  bottom: 9%;
  left: 0;
  margin: 0;
  color: #f9eadc;
  font-size: 7px;
  font-weight: 900;
  letter-spacing: .28em;
  text-align: center;
  text-transform: uppercase;
}

@media (max-width: 520px) {
  .admin-login-poster {
    width: 100vw;
    min-height: 0;
  }
}

</style>
