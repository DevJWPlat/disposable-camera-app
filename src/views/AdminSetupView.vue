<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '@/utils/api.js'
import { eventConfig } from '@/config/event.js'

import logo from '@/assets/events/sophies-last-rodeo/sophie-logo.png'
import photoFrame from '@/assets/events/sophies-last-rodeo/polaroid-frame.png'
import cowboyHat from '@/assets/events/sophies-last-rodeo/cowboy-hat.png'
import horseshoe from '@/assets/events/sophies-last-rodeo/horseshoe.png'
import rope from '@/assets/events/sophies-last-rodeo/rope.png'
import sparkles from '@/assets/events/sophies-last-rodeo/sparkles.png'
import desertFooter from '@/assets/events/sophies-last-rodeo/desert-footer.png'
import mailIcon from '@/assets/events/sophies-last-rodeo/mail.png'
import lockIcon from '@/assets/events/sophies-last-rodeo/lock.png'
import eyeOpenIcon from '@/assets/events/sophies-last-rodeo/eye-open.png'
import eyeClosedIcon from '@/assets/events/sophies-last-rodeo/eye-closed.png'

const route = useRoute()
const router = useRouter()
const token = computed(() => String(route.query.token || ''))

const heroImages = eventConfig.heroImages || []
const heroImage = heroImages.length
  ? heroImages[Math.floor(Math.random() * heroImages.length)]
  : eventConfig.heroImage

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const stage = ref('email')
const loading = ref(false)
const error = ref('')

async function request(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.ok) throw new Error(data?.error || 'Request failed')
  return data
}

async function verifyEmail() {
  error.value = ''
  loading.value = true
  try {
    await request('/api/admin/setup/verify', { email: email.value, token: token.value })
    stage.value = 'password'
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function activate() {
  error.value = ''
  if (password.value.length < 10) {
    error.value = 'Use at least 10 characters.'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    await request('/api/admin/setup/activate', {
      email: email.value,
      token: token.value,
      password: password.value,
    })
    router.replace('/admin?activated=1')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="setup-page">
    <section class="setup-poster">
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

      <section class="setup-copy">
        <p class="setup-kicker">Private admin</p>
        <h1>{{ stage === 'email' ? 'Set up your access' : 'Create your password' }}</h1>
        <p>
          {{ stage === 'email'
            ? 'Enter the email address your invite was sent to.'
            : 'Choose a password with at least 10 characters.' }}
        </p>
      </section>

      <form v-if="stage === 'email'" class="setup-form" @submit.prevent="verifyEmail">
        <label for="setup-email">Email</label>
        <div class="poster-input">
          <span class="poster-input__icon" aria-hidden="true">
            <img :src="mailIcon" alt="" />
          </span>
          <input
            id="setup-email"
            v-model.trim="email"
            type="email"
            autocomplete="email"
            placeholder="Enter your email"
            required
          />
        </div>

        <button class="setup-action" :disabled="loading || !token" type="submit">
          {{ loading ? 'Checking…' : 'Continue' }}
        </button>
      </form>

      <form v-else class="setup-form" @submit.prevent="activate">
        <label for="setup-password">Password</label>
        <div class="poster-input">
          <span class="poster-input__icon" aria-hidden="true">
            <img :src="lockIcon" alt="" />
          </span>
          <input
            id="setup-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="Create your password"
            required
          />
          <button
            class="poster-input__visibility"
            type="button"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            :aria-pressed="showPassword"
            @click="showPassword = !showPassword"
          >
            <img :src="showPassword ? eyeClosedIcon : eyeOpenIcon" alt="" aria-hidden="true" />
          </button>
        </div>

        <label for="setup-confirm-password">Confirm password</label>
        <div class="poster-input">
          <span class="poster-input__icon" aria-hidden="true">
            <img :src="lockIcon" alt="" />
          </span>
          <input
            id="setup-confirm-password"
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="Confirm your password"
            required
          />
          <button
            class="poster-input__visibility"
            type="button"
            :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
            :aria-pressed="showConfirmPassword"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <img :src="showConfirmPassword ? eyeClosedIcon : eyeOpenIcon" alt="" aria-hidden="true" />
          </button>
        </div>

        <button class="setup-action" :disabled="loading" type="submit">
          {{ loading ? 'Activating…' : 'Create password' }}
        </button>
      </form>

      <p v-if="!token" class="setup-error">This setup link is missing its token.</p>
      <p v-if="error" class="setup-error">{{ error }}</p>

      <section class="desert-stage">
        <img class="desert-art" :src="desertFooter" alt="" aria-hidden="true" />
        <div class="desert-shadow" aria-hidden="true"></div>
        <p class="bottom-note bottom-note--left">{{ eventConfig.copy.landing.sideNoteLeft }}</p>
        <p class="bottom-note bottom-note--right">{{ eventConfig.copy.landing.sideNoteRight }}</p>
        <p class="footer-label">{{ eventConfig.copy.landing.footer }}</p>
      </section>
    </section>
  </main>
</template>

<style scoped>
.setup-page {
  min-height: 100svh;
  overflow-x: hidden;
  background: radial-gradient(circle at 50% -10%, rgba(216,106,134,.18), transparent 34rem), #151515;
}

.setup-poster {
  position: relative;
  isolation: isolate;
  width: min(100%, 430px);
  min-height: 1160px;
  margin: 0 auto;
  overflow: hidden;
  background: linear-gradient(180deg, #fff8f2 0%, #f8ece5 43%, #f6d7d8 72%, #e99aaa 100%);
  color: #2a1e1c;
}

.grain {
  position: absolute;
  inset: 0;
  z-index: 30;
  pointer-events: none;
  opacity: .08;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.48'/%3E%3C/svg%3E");
}

.sparkles { position:absolute; z-index:2; top:-4%; left:50%; width:100%; transform:translateX(-50%); opacity:.72; }
.horseshoe { position:absolute; z-index:6; top:18%; left:-1.5%; width:17%; transform:rotate(-13deg); }
.rope { position:absolute; z-index:4; top:19%; right:0; width:20%; height:38%; object-fit:contain; object-position:top right; transform:rotate(-25deg); }

.photo-stage {
  position: relative;
  z-index: 7;
  display: block;
  width: 76%;
  aspect-ratio: 1/1;
  margin: 12px auto 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.photo-window { position:absolute; top:17.5%; left:16%; z-index:4; width:68%; height:66%; overflow:hidden; background:transparent; transform:rotate(-2.7deg); }
.hero-photo { width:100%; height:100%; object-fit:cover; }
.photo-placeholder { display:grid; width:100%; height:100%; place-content:center; justify-items:center; color:#e27f98; background:#211c1a; text-align:center; }
.photo-placeholder span { white-space:pre-line; }
.photo-placeholder b { font-size:2rem; font-weight:400; }
.photo-frame { position:absolute; inset:0; z-index:5; width:100%; height:100%; object-fit:contain; pointer-events:none; filter:drop-shadow(0 10px 14px rgba(76,37,31,.13)); }
.cowboy-hat { position:absolute; z-index:7; top:-13%; right:-12%; width:58%; height:auto; pointer-events:none; filter:drop-shadow(0 9px 8px rgba(76,37,31,.16)); }

.logo-stage { position:relative; z-index:10; width:94%; margin:-40px auto 0; }
.event-logo { display:block; width:100%; height:auto; }

.setup-copy { position:relative; z-index:12; width:82%; margin:-4px auto 14px; text-align:center; }
.setup-kicker { margin:0 0 5px; color:#c55370; font-size:10px; font-weight:900; letter-spacing:.18em; text-transform:uppercase; }
.setup-copy h1 { margin:0; color:#2a1e1c; font-family:Georgia,'Times New Roman',serif; font-size:29px; line-height:1.04; }
.setup-copy p:last-child { margin:8px 0 0; color:#7e625a; font-size:13px; line-height:1.45; }

.setup-form { position:relative; z-index:12; display:grid; width:78%; margin:0 auto; gap:8px; }
.setup-form label { margin:4px 0 0 2px; color:#6f4d42; font-family:Georgia,'Times New Roman',serif; font-size:12px; font-weight:900; letter-spacing:.16em; text-transform:uppercase; }
.poster-input { display:flex; min-height:56px; align-items:center; overflow:hidden; border:2px solid #8f4d59; border-radius:7px; background:linear-gradient(180deg,rgba(255,251,247,.98),rgba(253,239,230,.96)); box-shadow:0 0 0 2px rgba(216,167,91,.65), inset 0 1px 0 rgba(255,255,255,.75); }
.poster-input__icon { display:grid; width:56px; flex:0 0 56px; place-items:center; }
.poster-input__icon img { display:block; width:30px; height:30px; object-fit:contain; }
.poster-input input { width:100%; min-width:0; min-height:54px; border:0; outline:0; background:transparent; padding:0 10px 0 0; color:#3c2824; font-size:14px; }
.poster-input input::placeholder { color:#b58e85; }
.poster-input:focus-within { border-color:#d35372; box-shadow:0 0 0 2px #d8a75b,0 0 0 5px rgba(211,83,114,.12); }
.poster-input__visibility { display:grid; width:54px; height:54px; flex:0 0 54px; margin:0; padding:0; border:0; background:transparent; cursor:pointer; place-items:center; }
.poster-input__visibility img { display:block; width:29px; height:29px; object-fit:contain; }

.setup-action { min-height:58px; margin-top:9px; border:3px solid #2c1d19; border-radius:999px; background:#d95475; box-shadow:0 0 0 3px #d9aa5f, inset 0 0 0 2px rgba(255,255,255,.42); color:#fff8ef; cursor:pointer; font-family:Georgia,'Times New Roman',serif; font-size:17px; font-weight:900; letter-spacing:.13em; text-transform:uppercase; }
.setup-action:disabled { cursor:wait; opacity:.68; }
.setup-error { position:relative; z-index:12; width:78%; margin:10px auto 0; color:#9f3148; font-size:12px; font-weight:800; line-height:1.4; text-align:center; }

.desert-stage { position:absolute; z-index:5; right:0; bottom:0; left:0; height:25%; overflow:hidden; }
.desert-art { position:absolute; inset:auto 0 0; width:100%; height:130%; object-fit:cover; object-position:center 70%; transform:scale(1.35); transform-origin:center bottom; }
.desert-shadow { position:absolute; inset:auto 0 0; height:44%; background:linear-gradient(180deg,transparent,rgba(23,17,15,.96) 55%); }
.bottom-note { position:absolute; z-index:9; bottom:8%; width:19%; margin:0; white-space:pre-line; color:#ef829b; font-family:'Bradley Hand','Segoe Print','Comic Sans MS',cursive; font-size:9px; font-weight:800; line-height:.94; text-transform:uppercase; }
.bottom-note--left { left:4%; transform:rotate(-8deg); }
.bottom-note--right { right:4%; text-align:right; transform:rotate(7deg); }
.footer-label { position:absolute; right:0; bottom:9%; left:0; margin:0; color:#f9eadc; font-size:7px; font-weight:900; letter-spacing:.28em; text-align:center; text-transform:uppercase; }

@media (max-width:520px) { .setup-poster { width:100%; } }
</style>
