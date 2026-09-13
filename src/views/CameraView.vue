<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

import { useRouter } from 'vue-router'

import leopardPattern from '@/assets/images/leopard-pattern.png'
import { API_BASE_URL } from '../utils/api.js'
import { generateId } from '../utils/id.js'
import leopard from '@/assets/images/leopard.png'

const router = useRouter()

const videoRef = ref(null)
const canvasRef = ref(null)

const shotsRemaining = ref(25)
const loading = ref(true)
const uploading = ref(false)
const error = ref('')
const session = ref(null)
const captureFlash = ref(false)

const cameraStarting = ref(false)
const cameraReady = ref(false)
const cameraError = ref('')
const facingMode = ref('environment')

let cameraStream = null

const isDev = import.meta.env.DEV

const STORAGE_KEYS = {
  deviceToken: 'paul_60_camera_device_token',
  sessionId: 'paul_60_camera_session_id',
  guestName: 'paul_60_guest_name',
}

const guestName = computed(() => {
  return localStorage.getItem(STORAGE_KEYS.guestName) || 'Guest'
})

const isFrontCamera = computed(() => {
  return facingMode.value === 'user'
})

const previousShotNumber = computed(() => {
  return shotsRemaining.value < 25
    ? shotsRemaining.value + 1
    : null
})

const nextShotNumber = computed(() => {
  return shotsRemaining.value > 0
    ? shotsRemaining.value - 1
    : null
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

    const storedGuestName = (
      localStorage.getItem(STORAGE_KEYS.guestName) || ''
    ).trim()

    if (!storedGuestName) {
      router.replace('/')
      return false
    }

    const response = await fetch(
      `${API_BASE_URL}/api/session/start`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceToken,
          guestName: storedGuestName,
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
  captureFlash.value = true

  window.setTimeout(() => {
    captureFlash.value = false
  }, 220)

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
      `paul-60-${Date.now()}.jpg`,
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
    :style="{
      '--leopard-background': `url(${leopardPattern})`,
    }"
  >
    <div
      v-if="captureFlash"
      class="capture-flash"
      aria-hidden="true"
    ></div>

    <div
      v-if="uploading"
      class="upload-overlay"
      role="status"
      aria-live="polite"
    >
      <div class="upload-card">
        <div
          class="upload-spinner"
          aria-hidden="true"
        ></div>

        <p>Developing photograph</p>
        <span>
          Your shot is being safely stored
        </span>
      </div>
    </div>

    <section class="camera-shell">
      <div
        class="leopard-header"
        aria-hidden="true"
      ></div>

      <header class="camera-header">
        <div class="camera-brand">
          <span>PP 60</span>
          <span>ISO 400</span>
        </div>

        <p class="eyebrow">
          Paul’s disposable camera
        </p>

        <h1>
          Point and
          <span>capture</span>
        </h1>

        <p class="welcome-copy">
          There are no previews and no retakes.
        </p>
      </header>

      <section class="camera-body">
        <div
          v-if="loading"
          class="camera-status"
        >
          <div
            class="status-spinner"
            aria-hidden="true"
          ></div>

          <p>Loading your film...</p>
        </div>

        <div
          v-else-if="error"
          class="camera-status camera-status--error"
        >
          <p>{{ error }}</p>

          <button
            type="button"
            class="retry-button"
            @click="startSession"
          >
            Try again
          </button>
        </div>

        <template v-else>
          <div class="viewfinder">
            <video
              ref="videoRef"
              class="camera-video"
              :class="{
                'camera-video--mirrored': isFrontCamera,
              }"
              autoplay
              muted
              playsinline
              :aria-label="
                isFrontCamera
                  ? 'Live front camera preview'
                  : 'Live rear camera preview'
              "
            ></video>
            <button
              v-if="cameraReady"
              type="button"
              class="switch-camera-button"
              :aria-label="
                isFrontCamera
                  ? 'Switch to rear camera'
                  : 'Switch to front camera'
              "
              @click="switchCamera"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M7 7h2l1.2-2h3.6L15 7h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
                />
                <path
                  d="M9.5 12.5a2.5 2.5 0 1 0 5 0"
                />
                <path d="m8 10 1.5-1.5L11 10" />
                <path d="m16 15-1.5 1.5L13 15" />
              </svg>

              <span class="switch-camera-label">
                {{ isFrontCamera ? 'Rear' : 'Selfie' }}
              </span>
            </button>

            <div
              class="viewfinder-grain"
              aria-hidden="true"
            ></div>

            <div
              class="viewfinder-corners"
              aria-hidden="true"
            >
              <i></i>
              <i></i>
              <i></i>
              <i></i>
            </div>

            <div
              v-if="cameraStarting"
              class="camera-loading"
            >
              <div
                class="status-spinner"
                aria-hidden="true"
              ></div>

              <p>Opening camera...</p>
            </div>

            <div
              v-else-if="cameraError"
              class="camera-permission-error"
            >
              <p>{{ cameraError }}</p>

              <button
                type="button"
                class="retry-button"
                @click="startCamera"
              >
                Try camera again
              </button>
            </div>

            <div class="frame-information">
              <span>PP 60</span>
              <span>NO PREVIEW</span>
            </div>
          </div>

          <div class="film-counter">
            <span class="film-label">
              Exposures remaining
            </span>

            <div class="counter-window">
              <span
                v-if="previousShotNumber !== null"
                class="
                  counter-number
                  counter-number--previous
                "
                aria-hidden="true"
              >
                {{ previousShotNumber }}
              </span>

              <span
                class="
                  counter-number
                  counter-number--current
                "
              >
                {{ shotsRemaining }}
              </span>

              <span
                v-if="nextShotNumber !== null"
                class="
                  counter-number
                  counter-number--next
                "
                aria-hidden="true"
              >
                {{ nextShotNumber }}
              </span>
            </div>

            <!-- <div class="counter-copy">
              <strong>Shots</strong>
              <span>Remaining</span>
            </div> -->
          </div>
        </template>
      </section>

      <footer class="camera-footer">
        <button
          type="button"
          class="shutter-ticket"
          aria-label="Take photograph"
          :disabled="
            !cameraReady ||
            shotsRemaining <= 0 ||
            loading ||
            uploading ||
            Boolean(error)
          "
          @click="takePicture"
        >
          <span class="ticket-film">
            <small>Next</small>
            <strong>{{ shotsRemaining }}</strong>
          </span>

          <span class="ticket-action">
            <span
              class="shutter-icon"
              aria-hidden="true"
            >
              <i></i>
            </span>

            Take photograph
          </span>

          <span
            class="ticket-mark"
            aria-hidden="true"
          >
            <img class="leopard-mark" :src="leopard" alt="Leopard" />
          </span>
        </button>

        <p class="footer-message">
          Point, shoot and enjoy the moment
        </p>

        <button
          v-if="isDev"
          type="button"
          class="dev-skip-button"
          @click="skipToFinished"
        >
          Dev: skip to finished screen
        </button>
      </footer>

      <canvas
        ref="canvasRef"
        class="capture-canvas"
        aria-hidden="true"
      ></canvas>
    </section>
  </main>
</template>

<style scoped lang="scss">
.camera-page {
  --black: #090907;
  --panel: #11110e;
  --cream: #eadfc9;
  --muted: #a99b84;
  --gold: #c7a15a;
  --dark-gold: #755728;

  position: relative;
  height: 100svh;
  min-height: 100svh;
  overflow: hidden;
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

.camera-page::before {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.2'/%3E%3C/svg%3E");
  content: '';
  opacity: 0.18;
  pointer-events: none;
}

.camera-shell {
  position: relative;
  isolation: isolate;
  display: flex;
  box-sizing: border-box;
  width: min(100%, 30rem);
  height: 100svh;
  min-height: 0;
  margin: 0 auto;
  padding:
    max(0.8rem, env(safe-area-inset-top))
    1.15rem
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
  height: 9rem;
  opacity: 0.6;
  background-image: var(--leopard-background);
  background-position: top center;
  background-repeat: no-repeat;
  background-size: cover;
  mask-image: linear-gradient(
    to bottom,
    black 0%,
    black 45%,
    transparent 100%
  );
  pointer-events: none;
}

.camera-header {
  position: relative;
  z-index: 1;
  flex: none;
  text-align: center;
}

.camera-brand {
  display: flex;
  margin-bottom: 0.55rem;
  justify-content: space-between;
  color: rgba(199, 161, 90, 0.64);
  font-size: 0.47rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.eyebrow {
  margin: 0 0 0.35rem;
  color: var(--gold);
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: var(--cream);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.8rem, 8vw, 2.5rem);
  font-weight: 400;
  line-height: 0.9;
  text-transform: uppercase;
}

h1 span {
  display: block;
  margin-top: 0.16rem;
  color: var(--gold);
  font-size: 0.74em;
}

.welcome-copy {
  max-width: 21rem;
  margin: 0.55rem auto 0;
  color: var(--muted);
  font-size: 0.67rem;
  line-height: 1.45;
}

.camera-body {
  display: flex;
  min-height: 0;
  padding: 0.55rem 0;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  overflow: hidden;
}

.camera-status {
  display: flex;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.camera-status p {
  margin: 0.8rem 0 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1rem;
}

.camera-status--error {
  width: 100%;
  border: 1px solid rgba(199, 161, 90, 0.45);
  background: rgba(0, 0, 0, 0.28);
  padding: 1.5rem;
}

.camera-status--error p {
  color: #e4a99f;
  font-family: inherit;
  font-size: 0.78rem;
}

.status-spinner,
.upload-spinner {
  width: 1.8rem;
  height: 1.8rem;
  border: 2px solid rgba(199, 161, 90, 0.25);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}

.retry-button {
  margin-top: 0.8rem;
  border: 1px solid var(--gold);
  background: transparent;
  padding: 0.6rem 1rem;
  color: var(--gold);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.viewfinder {
  position: relative;
  width: 100%;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
  border: 2px solid var(--gold);
  background: #060605;
  box-shadow:
    inset 0 0 0 4px #080806,
    inset 0 0 0 5px rgba(199, 161, 90, 0.55),
    0 0.75rem 1.8rem rgba(0, 0, 0, 0.38);
}

.camera-video {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  filter:
    saturate(0.82)
    contrast(1.04)
    brightness(0.94);
}

.camera-video--mirrored {
  transform: scaleX(-1);
}

.switch-camera-button {
  position: absolute;
  z-index: 8;
  top: 0.8rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  min-width: 3.8rem;
  height: 2.2rem;
  border: 1px solid rgba(234, 223, 201, 0.6);
  border-radius: 2rem;
  background: rgba(9, 9, 7, 0.72);
  padding: 0 0.7rem;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  color: var(--cream);
  backdrop-filter: blur(6px);
  cursor: pointer;
}

.switch-camera-button:active {
  transform: scale(0.96);
}

.switch-camera-button svg {
  width: 1rem;
  fill: none;
  stroke: var(--gold);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.switch-camera-button span {
  font-size: 0.48rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.viewfinder::after {
  position: absolute;
  z-index: 2;
  inset: 0;
  background:
    radial-gradient(
      ellipse at center,
      transparent 50%,
      rgba(0, 0, 0, 0.42) 100%
    ),
    linear-gradient(
      135deg,
      transparent 45%,
      rgba(199, 161, 90, 0.06) 50%,
      transparent 55%
    );
  content: '';
  pointer-events: none;
}

.viewfinder-grain {
  position: absolute;
  z-index: 3;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='.2'/%3E%3C/svg%3E");
  mix-blend-mode: soft-light;
  opacity: 0.14;
  pointer-events: none;
}

.viewfinder-corners {
  position: absolute;
  z-index: 4;
  inset: 1rem;
  pointer-events: none;
}

.viewfinder-corners i {
  position: absolute;
  width: 1.2rem;
  height: 1.2rem;
}

.viewfinder-corners i:nth-child(1) {
  top: 0;
  left: 0;
  border-top: 1px solid var(--gold);
  border-left: 1px solid var(--gold);
}

.viewfinder-corners i:nth-child(2) {
  top: 0;
  right: 0;
  border-top: 1px solid var(--gold);
  border-right: 1px solid var(--gold);
}

.viewfinder-corners i:nth-child(3) {
  right: 0;
  bottom: 0;
  border-right: 1px solid var(--gold);
  border-bottom: 1px solid var(--gold);
}

.viewfinder-corners i:nth-child(4) {
  bottom: 0;
  left: 0;
  border-bottom: 1px solid var(--gold);
  border-left: 1px solid var(--gold);
}

.camera-loading,
.camera-permission-error {
  position: absolute;
  z-index: 6;
  display: flex;
  inset: 0;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: rgba(8, 8, 6, 0.94);
  padding: 1.5rem;
  text-align: center;
}

.camera-loading p {
  margin: 0.7rem 0 0;
  color: var(--muted);
  font-size: 0.7rem;
}

.camera-permission-error p {
  max-width: 18rem;
  margin: 0;
  color: #d8c9ac;
  font-size: 0.72rem;
  line-height: 1.5;
}

.frame-information {
  position: absolute;
  z-index: 5;
  right: 0.8rem;
  bottom: 0.65rem;
  left: 0.8rem;
  display: flex;
  justify-content: space-between;
  color: var(--gold);
  font-size: 0.45rem;
  font-weight: 800;
  letter-spacing: 0.13em;
}

.film-counter {
  position: relative;
  display: flex;
  min-height: 5.8rem;
  margin-top: 0.7rem;
  align-items: center;
  justify-content: center;
  flex: none;
}

.film-label {
  position: absolute;
  top: 0;
  left: 50%;
  color: var(--gold);
  font-size: 0.48rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  transform: translateX(-50%);
  white-space: nowrap;
}

.counter-window {
  position: relative;
  width: 5rem;
  height: 5rem;
  overflow: hidden;
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.25) 16%,
    black 38%,
    black 62%,
    rgba(0, 0, 0, 0.25) 84%,
    transparent 100%
  );
}

.counter-number {
  position: absolute;
  left: 50%;
  color: var(--cream);
  font-family: Georgia, 'Times New Roman', serif;
  line-height: 1;
  transform: translateX(-50%);
}

.counter-number--current {
  z-index: 2;
  top: 50%;
  font-size: 3.8rem;
  transform: translate(-50%, -50%);
}

.counter-number--previous,
.counter-number--next {
  color: rgba(234, 223, 201, 0.25);
  font-size: 2.2rem;
}

.counter-number--previous {
  top: -1.2rem;
}

.counter-number--next {
  bottom: -1.2rem;
}

.counter-copy {
  display: flex;
  margin-left: 0.35rem;
  align-items: flex-start;
  flex-direction: column;
  color: var(--gold);
  font-size: 0.82rem;
  font-style: italic;
  font-weight: 900;
  line-height: 0.94;
  text-transform: uppercase;
  transform: translateY(0.45rem);
}

.counter-copy strong {
  font-size: 1.05rem;
}

.camera-footer {
  flex: none;
}

.shutter-ticket {
  display: grid;
  width: 100%;
  min-height: 4.35rem;
  padding: 0;
  grid-template-columns: 3.9rem minmax(0, 1fr) 2.8rem;
  align-items: stretch;
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
  box-shadow: 0 0.6rem 1.4rem rgba(0, 0, 0, 0.32);
  cursor: pointer;
  text-transform: uppercase;
}

.shutter-ticket:active:not(:disabled) {
  transform: translateY(1px);
}

.shutter-ticket:disabled {
  cursor: not-allowed;
  filter: grayscale(0.5);
  opacity: 0.55;
}

.ticket-film {
  position: relative;
  display: flex;
  border-right: 1px dashed rgba(23, 19, 12, 0.58);
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.ticket-film::before,
.ticket-film::after {
  position: absolute;
  right: -0.28rem;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--panel);
  content: '';
}

.ticket-film::before {
  top: -0.28rem;
}

.ticket-film::after {
  bottom: -0.28rem;
}

.ticket-film small {
  font-size: 0.42rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.ticket-film strong {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.65rem;
  font-weight: 400;
  line-height: 1;
}

.ticket-action {
  display: flex;
  margin: 0.62rem 0.5rem;
  border: 1px solid rgba(23, 19, 12, 0.52);
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  font-size: clamp(0.64rem, 3vw, 0.8rem);
  font-weight: 900;
  letter-spacing: 0.08em;
}

.shutter-icon {
  position: relative;
  display: grid;
  width: 1.4rem;
  height: 1.4rem;
  place-items: center;
  border: 1px solid #17130c;
  border-radius: 50%;
}

.shutter-icon::before {
  width: 0.7rem;
  height: 0.7rem;
  border: 1px solid #17130c;
  border-radius: 50%;
  content: '';
}

.shutter-icon i {
  position: absolute;
  top: -0.2rem;
  width: 0.5rem;
  height: 0.24rem;
  border: 1px solid #17130c;
  background: var(--gold);
}

.ticket-mark {
  display: grid;
  border-left: 1px solid rgba(23, 19, 12, 0.32);
  place-items: center;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1rem;
}

.leopard-mark {
  width: 75%;
}
.footer-message {
  margin: 0.55rem 0 0;
  color: var(--gold);
  font-size: 0.48rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-align: center;
  text-transform: uppercase;
}

.dev-skip-button {
  display: block;
  margin: 0.55rem auto 0;
  border: 0;
  background: transparent;
  padding: 0.25rem 0.7rem;
  color: #756b59;
  font-size: 0.5rem;
  letter-spacing: 0.09em;
  text-decoration: underline;
  text-underline-offset: 0.2rem;
  cursor: pointer;
  text-transform: uppercase;
}

.capture-canvas {
  position: fixed;
  top: -9999px;
  left: -9999px;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

.capture-flash {
  position: fixed;
  z-index: 100;
  inset: 0;
  background: white;
  pointer-events: none;
  animation: flash 220ms ease-out forwards;
}

.upload-overlay {
  position: fixed;
  z-index: 90;
  display: grid;
  inset: 0;
  padding: 1.5rem;
  place-items: center;
  background: rgba(4, 4, 4, 0.88);
  backdrop-filter: blur(5px);
}

.upload-card {
  width: min(100%, 19rem);
  border: 1px solid var(--gold);
  background:
    linear-gradient(
      135deg,
      rgba(199, 161, 90, 0.08),
      transparent
    ),
    #11110e;
  padding: 2rem 1.5rem;
  color: var(--cream);
  text-align: center;
  box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.5);
}

.upload-spinner {
  margin: 0 auto;
}

.upload-card p {
  margin: 1rem 0 0;
  color: var(--gold);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.25rem;
}

.upload-card span {
  display: block;
  margin-top: 0.4rem;
  color: var(--muted);
  font-size: 0.67rem;
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

@media (max-height: 740px) {
  .camera-shell {
    padding-top: 0.5rem;
  }

  .camera-brand {
    margin-bottom: 0.25rem;
  }

  .welcome-copy {
    margin-top: 0.35rem;
  }

  .camera-body {
    min-height: 13rem;
    padding: 0.45rem 0;
  }

  .viewfinder,
  .camera-video {
    min-height: 0;
  }

  .film-counter {
    min-height: 4.7rem;
    margin-top: 0.35rem;
  }

  .counter-window {
    height: 4.2rem;
  }

  .counter-number--current {
    font-size: 3.25rem;
  }

  .shutter-ticket {
    min-height: 3.9rem;
  }
}
</style>