<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { eventConfig } from '@/config/event.js'
import { API_BASE_URL } from '@/utils/api.js'

import logo from '@/assets/events/sophies-last-rodeo/sophie-logo.png'
import photoFrame from '@/assets/events/sophies-last-rodeo/polaroid-frame.png'
import cowboyHat from '@/assets/events/sophies-last-rodeo/cowboy-hat.png'
import horseshoe from '@/assets/events/sophies-last-rodeo/horseshoe.png'
import rope from '@/assets/events/sophies-last-rodeo/rope.png'
import sparkles from '@/assets/events/sophies-last-rodeo/sparkles.png'
import desertFooter from '@/assets/events/sophies-last-rodeo/desert-footer.png'
import lastRideLogo from '@/assets/events/sophies-last-rodeo/last-ride-is-over.png'

const router = useRouter()
const isDev = import.meta.env.DEV

const previewLoading = ref(false)
const previewUnlocked = ref(false)
const previewUrl = ref('')
const previewError = ref('')

const STORAGE_KEYS = {
  deviceToken: `disposable_camera_${eventConfig.slug}_device_token`,
  sessionId: `disposable_camera_${eventConfig.slug}_session_id`,
}

function getSessionDetails() {
  return {
    sessionId: localStorage.getItem(STORAGE_KEYS.sessionId) || '',
    deviceToken: localStorage.getItem(STORAGE_KEYS.deviceToken) || '',
  }
}

async function parseJsonResponse(response) {
  const text = await response.text()
  let data = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    throw new Error(text || 'Invalid server response')
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`)
  }

  return data
}

async function checkExistingPreview() {
  const { sessionId, deviceToken } = getSessionDetails()
  if (!sessionId || !deviceToken) return

  try {
    const params = new URLSearchParams({ sessionId, deviceToken })
    const response = await fetch(`${API_BASE_URL}/api/session/secret-preview?${params.toString()}`)
    const data = await parseJsonResponse(response)

    if (data?.unlocked && data?.imageUrl) {
      previewUnlocked.value = true
      previewUrl.value = data.imageUrl
    }
  } catch (error) {
    // The finished screen should still work if the preview status cannot be checked.
    console.warn('Could not restore secret preview:', error)
  }
}

async function unlockPreview() {
  if (previewLoading.value || previewUnlocked.value) return

  const { sessionId, deviceToken } = getSessionDetails()

  if (!sessionId || !deviceToken) {
    previewError.value = 'We could not find this camera session on this device.'
    return
  }

  previewLoading.value = true
  previewError.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/api/session/secret-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, deviceToken }),
    })

    const data = await parseJsonResponse(response)

    previewUnlocked.value = true
    previewUrl.value = data.imageUrl
  } catch (error) {
    previewError.value = error?.message || 'Could not unlock your preview just yet.'
  } finally {
    previewLoading.value = false
  }
}

function resetForTesting() {
  localStorage.removeItem(STORAGE_KEYS.deviceToken)
  localStorage.removeItem(STORAGE_KEYS.sessionId)
  router.replace('/camera')
}

onMounted(checkExistingPreview)
</script>

<template>
  <main class="finished-page">
    <section class="poster">
      <div class="grain" aria-hidden="true"></div>

      <img class="sparkles" :src="sparkles" alt="" aria-hidden="true" />


      <section class="finish-copy">
        <img
          class="finish-logo"
          :src="lastRideLogo"
          alt="The Last Ride Is Over"
        />
        <p class="finish-lead">But the memories are just getting started.</p>
        <p class="finish-body">You’ve used all 50 shots. Now put the camera down and get back to the party.</p>
      </section>

      <section class="preview-area" :class="{ 'preview-area--revealed': previewUnlocked }">
        <template v-if="previewUnlocked">
          <p class="preview-label">YOUR ONE SECRET PREVIEW</p>

          <div class="preview-polaroid">
            <div class="preview-window">
              <img :src="previewUrl" alt="Your one secret preview from Sophie’s Last Rodeo" />
            </div>
            <img class="preview-frame" :src="photoFrame" alt="" aria-hidden="true" />
          </div>

          <p class="preview-tease">That’s all you’re getting, cowgirl. See the rest Monday.</p>
        </template>

        <template v-else>
          <p class="preview-question">Can’t wait until Monday?</p>
          <p class="preview-copy">One little sneak peek. This button will pick one random photo from the entire roll, it's the only one you get.</p>

          <button class="preview-button" type="button" :disabled="previewLoading" @click="unlockPreview">
            <span>{{ previewLoading ? 'DEVELOPING…' : 'UNLOCK ONE SECRET PREVIEW' }}</span>
            <b aria-hidden="true">✦</b>
          </button>

          <p v-if="previewError" class="preview-error" role="alert">{{ previewError }}</p>
        </template>
      </section>

      <section class="desert-stage">
        <img class="desert-art" :src="desertFooter" alt="" aria-hidden="true" />
        <div class="desert-shadow" aria-hidden="true"></div>
        <p class="bottom-note bottom-note--left">HEN<br>ENERGY<br>ONLY</p>
        <p class="bottom-note bottom-note--right">TIL DEATH<br>DO US<br>PARTY</p>
        <p class="footer-label">A HEN-DO DISPOSABLE CAMERA</p>
      </section>

      <button v-if="isDev" class="dev-reset" type="button" @click="resetForTesting">
        Dev: start a new roll
      </button>
    </section>
  </main>
</template>

<style scoped>
.finished-page {
  display: grid;
  width: 100%;
  min-height: 100svh;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% -10%, rgba(216, 106, 134, .18), transparent 34rem),
    #151515;
}

.poster {
  position: relative;
  isolation: isolate;
  width: min(100vw, calc(100svh * .4621));
  height: min(100svh, calc(100vw / .4621));
  max-width: 430px;
  max-height: 930px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255,245,242,1) 0%, rgba(253,198,182,1) 42%);
  color: #2a1e1c;
}

.grain {
  position: absolute;
  inset: 0;
  z-index: 30;
  opacity: .08;
  pointer-events: none;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.48'/%3E%3C/svg%3E");
}

.sparkles {
  position: absolute;
  z-index: 1;
  top: -14%;
  left: 50%;
  width: 100%;
  transform: translate(-50%);
  opacity: 0.05;
  pointer-events: none;
}

.horseshoe {
  position: absolute;
  z-index: 2;
  top: 23%;
  left: -2.5%;
  width: 16%;
  transform: rotate(-13deg);
}

.rope {
  position: absolute;
  z-index: 2;
  top: 18%;
  right: -2%;
  width: 21%;
  height: 38%;
  object-fit: contain;
  object-position: top right;
  transform: rotate(-24deg);
}

.logo-stage {
  position: absolute;
  z-index: 6;
  top: 2.2%;
  left: 50%;
  width: 74%;
  transform: translateX(-50%);
}

.event-logo {
  display: block;
  width: 100%;
  height: auto;
}

.finish-copy {
  position: absolute;
  z-index: 8;
  top: 10%;
  right: 7%;
  left: 7%;
  text-align: center;
}

.finish-logo {
  display: block;
  width: 100%;
  max-width: 360px;
  height: auto;
  margin: 0 auto .45rem;
  filter: drop-shadow(0 5px 5px rgba(72, 40, 31, .08));
}

.finish-lead {
  margin: 0;
  color: #2a1e1c;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(.82rem, 3.6vw, 1.02rem);
  font-weight: 700;
}

.finish-body {
  max-width: 21rem;
  margin: .35rem auto 0;
  color: #654740;
  font-size: clamp(.56rem, 2.3vw, .68rem);
  line-height: 1.45;
}

.preview-area {
  position: absolute;
  z-index: 9;
  top: 55%;
  right: 7%;
  left: 7%;
  text-align: center;
}

.preview-question,
.preview-label {
  margin: 0;
  color: #2b1917;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(.92rem, 4vw, 1.14rem);
  font-weight: 800;
}

.preview-label {
  color: #b84e69;
  font-family: inherit;
  font-size: clamp(.48rem, 2vw, .62rem);
  letter-spacing: .15em;
  text-transform: uppercase;
}

.preview-copy,
.preview-tease {
  max-width: 19rem;
  margin: .36rem auto 0;
  color: #74554d;
  font-size: clamp(.5rem, 2.15vw, .63rem);
  line-height: 1.45;
}

.preview-button {
  position: relative;
  display: flex;
  width: min(100%, 18rem);
  min-height: 3.3rem;
  margin: .72rem auto 0;
  padding: .7rem 1.05rem;
  align-items: center;
  justify-content: center;
  gap: .7rem;
  border: 3px solid #2c1a16;
  border-radius: 999px;
  background: linear-gradient(180deg, #e66d88 0%, #cb4d6a 100%);
  box-shadow:
    0 0 0 3px #d7a95f,
    inset 0 0 0 2px rgba(255,255,255,.3),
    0 .5rem 1.1rem rgba(90,41,48,.15);
  color: #fff5e9;
  cursor: pointer;
  font-size: clamp(.52rem, 2.2vw, .66rem);
  font-weight: 900;
  letter-spacing: .11em;
  text-transform: uppercase;
  transition: transform .15s ease, filter .15s ease;
}

.preview-button:hover { transform: translateY(-2px); filter: brightness(1.03); }
.preview-button:active { transform: translateY(0) scale(.985); }
.preview-button:disabled { cursor: wait; opacity: .72; }
.preview-button b { color: #f0c16b; font-size: 1rem; }

.preview-error {
  margin: .55rem auto 0;
  color: #9b344d;
  font-size: .55rem;
  line-height: 1.4;
}

.preview-area--revealed {
  top: 40%;
}

.preview-polaroid {
  position: relative;
  width: min(74%, 20.5rem);
  aspect-ratio: 1 / 1;
  margin: .3rem auto 0;
  transform: rotate(-2deg);
}

.preview-window {
  position: absolute;
  z-index: 2;
  top: 10.5%;
  left: 14%;
  width: 70%;
  height: 70%;
  overflow: hidden;
  transform: rotate(-2.7deg);
  background: #201816;
}

.preview-window img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-frame {
  position: absolute;
  z-index: 3;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 .5rem .7rem rgba(76,37,31,.14));
}

.preview-hat {
  position: absolute;
  z-index: 4;
  top: -13%;
  right: -12%;
  width: 58%;
  pointer-events: none;
  filter: drop-shadow(0 .4rem .4rem rgba(76,37,31,.16));
}

.preview-tease {
  margin-top: 8px;
  color: #573d38;
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
}

.desert-stage {
  position: absolute;
  z-index: 4;
  right: 0;
  bottom: 0;
  left: 0;
  height: 25%;
  overflow: visible;
}

.desert-art {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 138%;
  object-fit: cover;
  object-position: center 70%;
  transform: scale(1.34);
  transform-origin: center bottom;
}

.desert-shadow {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 43%;
  background: linear-gradient(180deg, transparent, rgba(23,17,15,.96) 55%);
}

.bottom-note {
  position: absolute;
  z-index: 7;
  bottom: 7%;
  width: 19%;
  margin: 0;
  color: #ef829b;
  font-family: 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive;
  font-size: clamp(7px,2vw,9px);
  font-weight: 800;
  line-height: .94;
  text-transform: uppercase;
}

.bottom-note--left { left: 4%; transform: rotate(-8deg); }
.bottom-note--right { right: 4%; text-align: right; transform: rotate(7deg); }

.footer-label {
  position: absolute;
  z-index: 7;
  right: 0;
  bottom: 8%;
  left: 0;
  margin: 0;
  color: #f9eadc;
  font-size: clamp(5px,1.65vw,7px);
  font-weight: 900;
  letter-spacing: .28em;
  text-align: center;
  text-transform: uppercase;
}

.dev-reset {
  position: absolute;
  z-index: 40;
  right: .55rem;
  bottom: .25rem;
  border: 0;
  background: transparent;
  color: rgba(255,255,255,.36);
  cursor: pointer;
  font-size: .42rem;
}

@media (max-height: 760px) {
  .finish-copy { top: 27%; }
  .preview-area { top: 51%; }
  .preview-area--revealed { top: 45%; }
  .preview-polaroid { width: min(61%, 13.5rem); }
}

@media (min-width: 521px) {
  .poster { box-shadow: 0 28px 80px rgba(0,0,0,.4); }
}

@media (max-width: 520px) {
  .poster {
    width: 100vw;
    height: 100svh;
    max-width: none;
    max-height: none;
  }
}
</style>
