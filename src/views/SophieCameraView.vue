<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

import { useRouter } from 'vue-router'

import { API_BASE_URL } from '../utils/api.js'
import { generateId } from '../utils/id.js'
import { eventConfig } from '@/config/event.js'

import desertFooter from '@/assets/events/sophies-last-rodeo/desert-footer.png'
import flashOnButton from '@/assets/events/sophies-last-rodeo/flash-on.png'
import flashOffButton from '@/assets/events/sophies-last-rodeo/flash-off.png'
import shutterButton from '@/assets/events/sophies-last-rodeo/shutter-button.png'
import switchButton from '@/assets/events/sophies-last-rodeo/switch-camera-button.png'
import counterBadge from '@/assets/events/sophies-last-rodeo/counter-badge.png'

const router = useRouter()

const videoRef = ref(null)
const canvasRef = ref(null)

const shotsRemaining = ref(eventConfig.maxShots)
const loading = ref(true)
const uploading = ref(false)
const error = ref('')
const session = ref(null)
const captureFlash = ref(false)
const flashEnabled = ref(false)

const cameraStarting = ref(false)
const cameraReady = ref(false)
const cameraError = ref('')
const facingMode = ref('environment')

let cameraStream = null

const isDev = import.meta.env.DEV

const STORAGE_KEYS = {
  deviceToken: `disposable_camera_${eventConfig.slug}_device_token`,
  sessionId: `disposable_camera_${eventConfig.slug}_session_id`,
}

const isFrontCamera = computed(() => {
  return facingMode.value === 'user'
})

const isWestern = computed(() => eventConfig.theme === 'western')
const cameraCopy = computed(() => eventConfig.copy?.camera || {})
const themeStyle = computed(() => ({
  '--event-bg': eventConfig.palette?.background,
  '--event-surface': eventConfig.palette?.surface,
  '--event-ink': eventConfig.palette?.ink,
  '--event-muted': eventConfig.palette?.muted,
  '--event-accent': eventConfig.palette?.accent,
  '--event-accent-dark': eventConfig.palette?.accentDark,
  '--event-sand': eventConfig.palette?.sand,
  '--event-line': eventConfig.palette?.line,
  '--event-camera': eventConfig.palette?.camera,
}))

const previousShotNumber = computed(() => {
  return shotsRemaining.value < eventConfig.maxShots
    ? shotsRemaining.value + 1
    : null
})

const nextShotNumber = computed(() => {
  return shotsRemaining.value > 0
    ? shotsRemaining.value - 1
    : null
})

const remainingCounter = computed(() => {
  return String(Math.max(0, shotsRemaining.value)).padStart(2, '0')
})

function createThumbnailBlob(file, maxWidth = 400, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)

      try {
        const scale = Math.min(
          1,
          maxWidth / image.naturalWidth,
        )

        const width = Math.max(
          1,
          Math.round(image.naturalWidth * scale),
        )

        const height = Math.max(
          1,
          Math.round(image.naturalHeight * scale),
        )

        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')

        if (!context) {
          reject(new Error('No canvas context'))
          return
        }

        canvas.width = width
        canvas.height = height

        context.drawImage(
          image,
          0,
          0,
          width,
          height,
        )

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Thumbnail encode failed'))
            }
          },
          'image/jpeg',
          quality,
        )
      } catch (err) {
        reject(
          err instanceof Error
            ? err
            : new Error('Thumbnail failed'),
        )
      }
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Image load failed'))
    }

    image.src = objectUrl
  })
}

function canvasToBlob(canvas, quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Could not capture photograph'))
        }
      },
      'image/jpeg',
      quality,
    )
  })
}

async function parseJsonResponse(response) {
  const text = await response.text()

  let data

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    throw new Error(text || 'Invalid server response')
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      `Request failed with status ${response.status}`,
    )
  }

  return data
}

function getDeviceToken() {
  let token = localStorage.getItem(
    STORAGE_KEYS.deviceToken,
  )

  if (!token) {
    token = generateId()

    localStorage.setItem(
      STORAGE_KEYS.deviceToken,
      token,
    )
  }

  return token
}

function storeSessionId(sessionId) {
  localStorage.setItem(
    STORAGE_KEYS.sessionId,
    sessionId,
  )
}

async function startSession() {
  loading.value = true
  error.value = ''

  try {
    const deviceToken = getDeviceToken()

    const response = await fetch(
      `${API_BASE_URL}/api/session/start`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceToken,
        }),
      },
    )

    const data = await parseJsonResponse(response)

    if (!data?.ok || !data?.session) {
      throw new Error(
        data?.error || 'Failed to start session',
      )
    }

    session.value = data.session

    shotsRemaining.value = Number(
      data.session.shots_remaining || 0,
    )

    storeSessionId(data.session.id)

    if (shotsRemaining.value <= 0) {
      router.push('/finished')
      return false
    }

    return true
  } catch (err) {
    error.value =
      err.message || 'Something went wrong'

    console.error('startSession failed:', err)

    return false
  } finally {
    loading.value = false
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream
      .getTracks()
      .forEach((track) => track.stop())
  }

  cameraStream = null
  cameraReady.value = false

  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

async function startCamera() {
  cameraStarting.value = true
  cameraReady.value = false
  cameraError.value = ''

  stopCamera()

  try {
    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      throw new Error(
        'This browser does not support the in-site camera.',
      )
    }

    cameraStream =
      await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: {
            ideal: facingMode.value,
          },
          width: {
            ideal: 1920,
          },
          height: {
            ideal: 1080,
          },
        },
      })

    await nextTick()

    if (!videoRef.value) {
      throw new Error('Camera preview is unavailable.')
    }

    videoRef.value.srcObject = cameraStream

    await videoRef.value.play()

    cameraReady.value = true
  } catch (err) {
    console.error('startCamera failed:', err)

    if (
      err?.name === 'NotAllowedError' ||
      err?.name === 'PermissionDeniedError'
    ) {
      cameraError.value =
        'Camera access was denied. Allow camera permission in your browser settings, then try again.'
    } else if (
      err?.name === 'NotFoundError' ||
      err?.name === 'DevicesNotFoundError'
    ) {
      cameraError.value =
        'No camera could be found on this device.'
    } else if (
      err?.name === 'NotReadableError'
    ) {
      cameraError.value =
        'Your camera is being used by another app. Close it and try again.'
    } else {
      cameraError.value =
        err?.message ||
        'The camera could not be started.'
    }
  } finally {
    cameraStarting.value = false
  }
}

async function switchCamera() {
  if (
    cameraStarting.value ||
    uploading.value
  ) {
    return
  }

  facingMode.value =
    facingMode.value === 'environment'
      ? 'user'
      : 'environment'

  await startCamera()
}

function toggleFlash() {
  flashEnabled.value = !flashEnabled.value
}

async function uploadFile(file) {
  if (!session.value?.id) {
    throw new Error('No active session found')
  }

  const formData = new FormData()

  formData.append(
    'sessionId',
    session.value.id,
  )

  formData.append(
    'photo',
    file,
    file.name || 'photograph.jpg',
  )

  try {
    const thumbnailBlob =
      await createThumbnailBlob(file)

    formData.append(
      'thumbnail',
      thumbnailBlob,
      'thumbnail.jpg',
    )
  } catch (err) {
    console.warn(
      'Thumbnail generation skipped:',
      err,
    )
  }

  const response = await fetch(
    `${API_BASE_URL}/api/photo/upload`,
    {
      method: 'POST',
      body: formData,
    },
  )

  const data = await parseJsonResponse(response)

  if (!data?.ok || !data?.session) {
    throw new Error(
      data?.error || 'Upload failed',
    )
  }

  session.value = data.session

  shotsRemaining.value = Number(
    data.session.shots_remaining || 0,
  )

  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }

  if (shotsRemaining.value <= 0) {
    stopCamera()
    router.push('/finished')
  }
}

async function takePicture() {
  if (
    !cameraReady.value ||
    uploading.value ||
    loading.value ||
    shotsRemaining.value <= 0
  ) {
    return
  }

  const video = videoRef.value
  const canvas = canvasRef.value

  if (!video || !canvas) {
    cameraError.value =
      'The camera is not ready yet.'
    return
  }

  if (
    !video.videoWidth ||
    !video.videoHeight
  ) {
    cameraError.value =
      'Wait for the camera to finish loading.'
    return
  }

  const context = canvas.getContext('2d')

  if (!context) {
    cameraError.value =
      'The photograph could not be captured.'
    return
  }

  error.value = ''
  uploading.value = true
  if (flashEnabled.value) {
    captureFlash.value = true

    window.setTimeout(() => {
      captureFlash.value = false
    }, 220)
  }

  try {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    if (isFrontCamera.value) {
      context.save()
      context.translate(canvas.width, 0)
      context.scale(-1, 1)

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height,
      )

      context.restore()
    } else {
      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height,
      )
    }

    const photoBlob =
      await canvasToBlob(canvas)

    const photoFile = new File(
      [photoBlob],
      `${eventConfig.slug}-${Date.now()}.jpg`,
      {
        type: 'image/jpeg',
        lastModified: Date.now(),
      },
    )

    await uploadFile(photoFile)
  } catch (err) {
    error.value =
      err.message || 'Photo upload failed'

    console.error('takePicture failed:', err)
  } finally {
    uploading.value = false
  }
}

function skipToFinished() {
  stopCamera()
  router.push('/finished')
}

onMounted(async () => {
  const sessionStarted = await startSession()

  if (sessionStarted) {
    await startCamera()
  }
})

onBeforeUnmount(() => {
  stopCamera()
})
</script>

<template>
  <main
    class="camera-page"
    :class="`theme--${eventConfig.theme}`"
    :style="themeStyle"
  >
    <div v-if="captureFlash" class="capture-flash" aria-hidden="true"></div>

    <div v-if="uploading" class="upload-overlay" role="status" aria-live="polite">
      <div class="upload-card">
        <div class="upload-spinner" aria-hidden="true"></div>
        <p>{{ cameraCopy.developingTitle || 'Developing photograph' }}</p>
        <span>{{ cameraCopy.developingCopy || 'Your shot is being safely stored' }}</span>
      </div>
    </div>

    <section class="camera-shell">
      <div class="camera-topline" aria-hidden="true">
        <span>{{ cameraCopy.topline || (isWestern ? '★ Sophie’s Last Rodeo ★' : eventConfig.title) }}</span>
      </div>

      <header class="camera-header">
        <p class="eyebrow">{{ cameraCopy.eyebrow || (isWestern ? 'One last wild night' : eventConfig.title) }}</p>
      </header>

      <section class="camera-body">
        <div v-if="loading" class="camera-status">
          <div class="status-spinner" aria-hidden="true"></div>
          <p>{{ cameraCopy.loadingFilm || 'Loading your film...' }}</p>
        </div>

        <div v-else-if="error" class="camera-status camera-status--error">
          <p>{{ error }}</p>
          <button type="button" class="retry-button" @click="startSession">Try again</button>
        </div>

        <template v-else>
          <div class="viewfinder-card">
            <div class="viewfinder">
              <video
                ref="videoRef"
                class="camera-video"
                :class="{ 'camera-video--mirrored': isFrontCamera }"
                autoplay
                muted
                playsinline
                :aria-label="isFrontCamera ? 'Live front camera preview' : 'Live rear camera preview'"
              ></video>

              <div class="viewfinder-grain" aria-hidden="true"></div>
              <div class="viewfinder-corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div>

              <div class="viewfinder-toolbar">
                <button
                  type="button"
                  class="asset-control asset-control--flash"
                  :aria-pressed="flashEnabled"
                  :aria-label="flashEnabled ? 'Flash is on. Turn flash off' : 'Flash is off. Turn flash on'"
                  @click="toggleFlash"
                >
                  <img :src="flashEnabled ? flashOnButton : flashOffButton" alt="" aria-hidden="true" />
                </button>

                <button
                  v-if="cameraReady"
                  type="button"
                  class="asset-control asset-control--switch"
                  :aria-label="isFrontCamera ? 'Switch to rear camera' : 'Switch to front camera'"
                  @click="switchCamera"
                >
                  <img :src="switchButton" alt="" aria-hidden="true" />
                </button>
              </div>

              <div v-if="cameraStarting" class="camera-loading">
                <div class="status-spinner" aria-hidden="true"></div>
                <p>{{ cameraCopy.openingCamera || 'Opening camera...' }}</p>
              </div>

              <div v-else-if="cameraError" class="camera-permission-error">
                <p>{{ cameraError }}</p>
                <button type="button" class="retry-button" @click="startCamera">Try camera again</button>
              </div>

              <div class="frame-information">
                <span>{{ eventConfig.shortTitle }}</span>
                <span>NO PREVIEW</span>
              </div>
            </div>

            <button
              type="button"
              class="shutter-button"
              aria-label="Take photograph"
              :disabled="!cameraReady || shotsRemaining <= 0 || loading || uploading || Boolean(error)"
              @click="takePicture"
            >
              <img :src="shutterButton" alt="" aria-hidden="true" />
            </button>
          </div>

          <div class="desert-stage">
            <div class="desert-stage__gradient" aria-hidden="true"></div>
            <img class="desert-stage__art" :src="desertFooter" alt="" aria-hidden="true" />
            <div class="desert-stage__shadow" aria-hidden="true"></div>

            <div class="counter-stage">
              <img class="counter-stage__asset" :src="counterBadge" alt="" aria-hidden="true" />
              <div class="counter-stage__copy">
                <span class="counter-stage__eyebrow">{{ cameraCopy.exposuresLabel || 'Exposures remaining' }}</span>
                <div class="counter-stage__numbers">
                  <span v-if="previousShotNumber !== null" class="counter-number counter-number--previous" aria-hidden="true">{{ previousShotNumber }}</span>
                  <span class="counter-number counter-number--current">{{ remainingCounter }}</span>
                  <span v-if="nextShotNumber !== null" class="counter-number counter-number--next" aria-hidden="true">{{ nextShotNumber }}</span>
                </div>
                <small>{{ cameraCopy.rollLabel || `${eventConfig.maxShots} shot roll` }}</small>
              </div>
            </div>

            <p class="bottom-note bottom-note--left">HEN
ENERGY
ONLY</p>
            <p class="bottom-note bottom-note--right">TIL DEATH
DO US
PARTY</p>
            <p class="footer-label">{{ eventConfig.copy?.landing?.footer || 'A HEN-DO DISPOSABLE CAMERA' }}</p>
          </div>
        </template>
      </section>

      <footer v-if="isDev" class="camera-footer">
        <button type="button" class="dev-skip-button" @click="skipToFinished">Dev: skip to finished screen</button>
      </footer>

      <canvas ref="canvasRef" class="capture-canvas" aria-hidden="true"></canvas>
    </section>
  </main>
</template>

<style scoped>
.camera-page {
  --event-bg: #f1dfd1;
  --event-surface: #fff8ef;
  --event-ink: #2c1a16;
  --event-muted: #7b5e55;
  --event-accent: #c77f8c;
  --event-accent-dark: #8c4c58;
  --event-sand: #d7ad83;
  --event-line: #432820;
  --event-camera: #211512;

  position: relative;
  min-height: 100svh;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% -10%, rgba(216, 106, 134, .18), transparent 34rem),
    #151515;
  color: var(--event-surface);
}

.camera-shell {
  position: relative;
  display: flex;
  box-sizing: border-box;
  width: min(100vw, calc(100svh * 0.4621));
  height: min(100svh, calc(100vw / 0.4621));
  max-width: 430px;
  max-height: 930px;
  margin: 0 auto;
  padding: max(.7rem, env(safe-area-inset-top)) .95rem 0;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 245, 242, 1) 0%, rgba(253, 198, 182, 1) 40%);
  color: var(--event-ink);
  isolation: isolate;
}

.camera-shell::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: .08;
  pointer-events: none;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.48'/%3E%3C/svg%3E");
  content: '';
}

.camera-topline,
.camera-header,
.camera-body,
.camera-footer {
  position: relative;
  z-index: 1;
}

.camera-topline {
  flex: none;
  margin-bottom: .3rem;
  color: #a1666e;
  font-size: .5rem;
  font-weight: 900;
  letter-spacing: .18em;
  text-align: center;
  text-transform: uppercase;
}

.camera-header {
  flex: none;
  text-align: center;
}

.eyebrow {
  margin: 0 0 .24rem;
  color: #d35372;
  font-size: .54rem;
  font-weight: 900;
  letter-spacing: .18em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #2a1e1c;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.75rem, 8vw, 2.2rem);
  font-weight: 700;
  line-height: .9;
  text-transform: uppercase;
}

h1 span {
  display: block;
  margin-top: .12rem;
  color: #d8607f;
  font-size: .8em;
  font-style: italic;
  text-transform: none;
}

.welcome-copy {
  max-width: 21rem;
  margin: .42rem auto 0;
  color: #4a3633;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: .67rem;
  line-height: 1.42;
}

.camera-body {
  display: flex;
  min-height: 0;
  padding-top: .5rem;
  flex: 1 1 auto;
  flex-direction: column;
}

.camera-status {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
}

.camera-status p {
  margin: .8rem 0 0;
  font-family: Georgia, serif;
  font-size: 1rem;
}

.camera-status--error {
  border: 1px solid rgba(141, 85, 95, .28);
  background: rgba(255, 248, 241, .55);
  padding: 1.5rem;
}

.camera-status--error p {
  color: #7c3546;
  font-family: inherit;
  font-size: .78rem;
}

.status-spinner,
.upload-spinner {
  width: 1.8rem;
  height: 1.8rem;
  border: 2px solid rgba(216, 96, 127, .18);
  border-top-color: #d8607f;
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}

.retry-button {
  margin-top: .8rem;
  border: 1px solid rgba(141, 85, 95, .4);
  border-radius: 999px;
  background: rgba(255, 245, 242, .92);
  padding: .68rem 1rem;
  color: #7d4e57;
  cursor: pointer;
  font-size: .58rem;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.viewfinder-card {
  position: relative;
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 2.1rem;
}

.viewfinder {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 16rem;
  overflow: hidden;
  border: 2px solid rgba(92, 54, 47, .78);
  background: #140f0e;
  box-shadow: 0 .8rem 1.8rem rgba(89, 43, 53, .15);
}

.camera-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(.92) contrast(1.02) brightness(.97);
}

.camera-video--mirrored {
  transform: scaleX(-1);
}

.viewfinder-grain {
  position: absolute;
  inset: 0;
  opacity: .08;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.viewfinder-corners {
  position: absolute;
  inset: .8rem;
  pointer-events: none;
}

.viewfinder-corners i {
  position: absolute;
  width: 1.1rem;
  height: 1.1rem;
  border-color: rgba(255, 255, 255, .72);
  border-style: solid;
}

.viewfinder-corners i:nth-child(1) { top: 0; left: 0; border-width: 1px 0 0 1px; }
.viewfinder-corners i:nth-child(2) { top: 0; right: 0; border-width: 1px 1px 0 0; }
.viewfinder-corners i:nth-child(3) { right: 0; bottom: 0; border-width: 0 1px 1px 0; }
.viewfinder-corners i:nth-child(4) { bottom: 0; left: 0; border-width: 0 0 1px 1px; }

.viewfinder-toolbar {
  position: absolute;
  z-index: 8;
  top: .85rem;
  right: .85rem;
  left: .85rem;
  display: flex;
  justify-content: space-between;
  gap: .75rem;
}

.asset-control {
  display: inline-flex;
  width: 3.15rem;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: transform .18s ease, filter .18s ease, opacity .18s ease;
}

.asset-control:hover {
  transform: translateY(-2px) scale(1.02);
  filter: brightness(1.04);
}

.asset-control:active {
  transform: translateY(0) scale(.98);
}

.asset-control img {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 6px 12px rgba(49, 22, 32, .18));
}

.camera-loading,
.camera-permission-error {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: rgba(20, 13, 12, .78);
  padding: 1.5rem;
  text-align: center;
}

.camera-loading p,
.camera-permission-error p {
  max-width: 20rem;
  margin: .65rem 0 0;
  color: #f5ebe3;
  font-size: .72rem;
  line-height: 1.5;
}

.frame-information {
  position: absolute;
  right: 1.45rem;
  bottom: 1.2rem;
  left: 1.45rem;
  display: flex;
  justify-content: space-between;
  color: rgba(255,255,255,.74);
  font-size: .46rem;
  font-weight: 900;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.desert-stage {
  position: relative;
  min-height: 12rem;
  margin: .45rem -.95rem 0;
  overflow: visible;
}

.desert-stage__gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 245, 242, 1) 0%, rgba(253, 198, 182, 1) 40%);
}

.desert-stage__art {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
}

.desert-stage__shadow {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 52%;
  background: linear-gradient(180deg, transparent, rgba(27, 18, 17, .9) 70%);
}

.counter-stage {
  position: absolute;
  z-index: 3;
  top: 45px;
  left: 50%;
  width: min(20rem, 98%);
  transform: translateX(-50%);
}

.counter-stage__asset {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 6px 10px rgba(74, 39, 33, .12));
}

.counter-stage__copy {
  position: absolute;
  inset: 0;
  color: #fff8ef;
  text-align: center;
  text-shadow: 0 1px 0 rgba(42, 24, 22, .45), 0 2px 4px rgba(42, 24, 22, .18);
  pointer-events: none;
}

.counter-stage__eyebrow {
  position: absolute;
  top: 28%;
  right: 20%;
  left: 20%;
  color: #f4ca73;
  font-size: .48rem;
  font-weight: 900;
  letter-spacing: .15em;
  line-height: 1;
  text-transform: uppercase;
}

.counter-stage__numbers {
  position: absolute;
  top: 51%;
  left: 50%;
  display: grid;
  width: 48%;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  column-gap: 1.25rem;
  transform: translate(-50%, -50%);
}

.counter-stage small {
  display: none;
  position: absolute;
  right: 21%;
  bottom: 12%;
  left: 21%;
  color: #fff8ef;
  font-size: .46rem;
  font-weight: 900;
  letter-spacing: .14em;
  line-height: 1;
  text-transform: uppercase;
}

.counter-number {
  font-family: Georgia, 'Times New Roman', serif;
}

.counter-number--current {
  min-width: 4.35rem;
  color: #fff8ef;
  font-size: 2.5rem;
  font-weight: 800;
  line-height: .9;
  text-align: center;
}

.counter-number--previous,
.counter-number--next {
  width: auto;
  color: #f4ca73;
  opacity: .92;
  font-size: .88rem;
  font-weight: 800;
  text-align: center;
}

.counter-number--previous {
  justify-self: end;
  color: transparent;
  opacity: 0;
  pointer-events: none;
}

.counter-number--next {
  justify-self: start;
}

.shutter-button {
  position: absolute;
  z-index: 12;
  bottom: -2.5rem;
  left: 50%;
  width: clamp(4.7rem, 22vw, 5.6rem);
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transform: translateX(-50%);
  transition: transform .18s ease, filter .18s ease, opacity .18s ease;
}

.shutter-button:hover {
  transform: translateX(-50%) translateY(-2px) scale(1.015);
  filter: brightness(1.03);
}

.shutter-button:active {
  transform: translateX(-50%) translateY(0) scale(.97);
}

.shutter-button:disabled {
  cursor: not-allowed;
  opacity: .55;
  filter: grayscale(.12);
}

.shutter-button img {
  display: block;
  width: 100%;
  height: auto;
  background: transparent;
  filter: drop-shadow(0 8px 12px rgba(74, 39, 33, .18));
}

.bottom-note {
  position: absolute;
  z-index: 4;
  bottom: .7rem;
  width: 19%;
  margin: 0;
  white-space: pre-line;
  color: #ef829b;
  font-family: 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive;
  font-size: clamp(7px, 2vw, 9px);
  font-weight: 800;
  line-height: .94;
  text-transform: uppercase;
}

.bottom-note--left {
  left: 4%;
  transform: rotate(-8deg);
}

.bottom-note--right {
  right: 4%;
  text-align: right;
  transform: rotate(7deg);
}

.footer-label {
  position: absolute;
  z-index: 4;
  right: 0;
  bottom: .92rem;
  left: 0;
  margin: 0;
  color: #f9eadc;
  font-size: clamp(5px, 1.65vw, 7px);
  font-weight: 900;
  letter-spacing: .28em;
  text-align: center;
  text-transform: uppercase;
}

.camera-footer {
  position: absolute;
  z-index: 20;
  right: 0;
  bottom: max(.25rem, env(safe-area-inset-bottom));
  left: 0;
  pointer-events: none;
}

.dev-skip-button {
  display: block;
  margin: 0 auto;
  pointer-events: auto;
  border: 0;
  background: transparent;
  color: color-mix(in srgb, var(--event-ink) 45%, white);
  cursor: pointer;
  font-size: .5rem;
}

.capture-canvas {
  display: none;
}

.capture-flash {
  position: fixed;
  z-index: 200;
  inset: 0;
  background: white;
  animation: flash 220ms ease-out forwards;
  pointer-events: none;
}

.upload-overlay {
  position: fixed;
  z-index: 150;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(14, 9, 8, .68);
  backdrop-filter: blur(8px);
}

.upload-card {
  width: min(calc(100% - 2rem), 20rem);
  border: 1px solid rgba(141, 85, 95, .35);
  border-radius: 1.25rem;
  background: rgba(255, 245, 242, .94);
  padding: 1.4rem;
  text-align: center;
  box-shadow: 0 1.5rem 4rem rgba(0,0,0,.28);
}

.upload-card .upload-spinner {
  margin: 0 auto;
}

.upload-card p {
  margin: .75rem 0 .15rem;
  color: #2a1e1c;
  font-family: Georgia, serif;
  font-size: 1rem;
}

.upload-card span {
  color: #7b5e55;
  font-size: .62rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes flash {
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

@media (min-width: 521px) {
  .camera-shell {
    box-shadow: 0 28px 80px rgba(0,0,0,.4);
  }
}

@media (max-width: 520px) {
  .camera-shell {
    width: 100vw;
    height: 100svh;
    max-width: none;
    max-height: none;
  }
}

@media (max-height: 780px) {
  .camera-topline {
    margin-bottom: .22rem;
  }

  .camera-brand {
    margin-bottom: .26rem;
  }

  .welcome-copy {
    margin-top: .32rem;
    font-size: .63rem;
  }

  .camera-body {
    padding-top: .38rem;
  }

  .viewfinder {
    min-height: 14.25rem;
  }

  .desert-stage {
    min-height: 10.8rem;
  }

  .shutter-button {
    bottom: -1.75rem;
    width: 4.65rem;
  }
}
</style>
