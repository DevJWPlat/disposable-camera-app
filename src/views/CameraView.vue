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

const router = useRouter()

const videoRef = ref(null)
const canvasRef = ref(null)

const shotsRemaining = ref(eventConfig.maxShots)
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
  deviceToken: `disposable_camera_${eventConfig.slug}_device_token`,
  sessionId: `disposable_camera_${eventConfig.slug}_session_id`,
}

const isFrontCamera = computed(() => {
  return facingMode.value === 'user'
})

const isWestern = computed(() => eventConfig.theme === 'western')
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
        <p>Developing photograph</p>
        <span>Your shot is being safely stored</span>
      </div>
    </div>

    <section class="camera-shell">
      <div class="camera-topline" aria-hidden="true">
        <span>{{ isWestern ? '★ Sophie’s Last Rodeo ★' : eventConfig.title }}</span>
      </div>

      <header class="camera-header">
        <div class="camera-brand">
          <span>{{ eventConfig.shortTitle }}</span>
          <span>DISPOSABLE • ISO 400</span>
        </div>

        <p class="eyebrow">{{ isWestern ? 'One last wild night' : eventConfig.title }}</p>

        <h1>
          Point and
          <span>capture</span>
        </h1>

        <p class="welcome-copy">{{ eventConfig.cameraIntro }}</p>
      </header>

      <section class="camera-body">
        <div v-if="loading" class="camera-status">
          <div class="status-spinner" aria-hidden="true"></div>
          <p>Loading your film...</p>
        </div>

        <div v-else-if="error" class="camera-status camera-status--error">
          <p>{{ error }}</p>
          <button type="button" class="retry-button" @click="startSession">Try again</button>
        </div>

        <template v-else>
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

            <button
              v-if="cameraReady"
              type="button"
              class="switch-camera-button"
              :aria-label="isFrontCamera ? 'Switch to rear camera' : 'Switch to front camera'"
              @click="switchCamera"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 7h2l1.2-2h3.6L15 7h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
                <path d="M9.5 12.5a2.5 2.5 0 1 0 5 0" />
                <path d="m8 10 1.5-1.5L11 10" />
                <path d="m16 15-1.5 1.5L13 15" />
              </svg>
              <span>{{ isFrontCamera ? 'Rear' : 'Selfie' }}</span>
            </button>

            <div class="viewfinder-grain" aria-hidden="true"></div>
            <div class="viewfinder-corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div>

            <div v-if="cameraStarting" class="camera-loading">
              <div class="status-spinner" aria-hidden="true"></div>
              <p>Opening camera...</p>
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

          <div class="film-counter">
            <div>
              <span class="film-label">Exposures remaining</span>
              <small>{{ eventConfig.maxShots }} shot roll</small>
            </div>

            <div class="counter-window">
              <span v-if="previousShotNumber !== null" class="counter-number counter-number--previous" aria-hidden="true">{{ previousShotNumber }}</span>
              <span class="counter-number counter-number--current">{{ shotsRemaining }}</span>
              <span v-if="nextShotNumber !== null" class="counter-number counter-number--next" aria-hidden="true">{{ nextShotNumber }}</span>
            </div>
          </div>
        </template>
      </section>

      <footer class="camera-footer">
        <button
          type="button"
          class="shutter-ticket"
          aria-label="Take photograph"
          :disabled="!cameraReady || shotsRemaining <= 0 || loading || uploading || Boolean(error)"
          @click="takePicture"
        >
          <span class="ticket-film"><small>Next</small><strong>{{ shotsRemaining }}</strong></span>
          <span class="ticket-action"><span class="shutter-icon" aria-hidden="true"><i></i></span>Take photograph</span>
          <span class="ticket-mark" aria-hidden="true">{{ isWestern ? '★' : '•' }}</span>
        </button>

        <p class="footer-message">{{ isWestern ? 'Boots on. Camera up. Make it count.' : 'Point, shoot and enjoy the moment' }}</p>

        <button v-if="isDev" type="button" class="dev-skip-button" @click="skipToFinished">Dev: skip to finished screen</button>
      </footer>

      <canvas ref="canvasRef" class="capture-canvas" aria-hidden="true"></canvas>
    </section>
  </main>
</template>

<style scoped lang="scss">
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
  height: 100svh;
  min-height: 100svh;
  overflow: hidden;
  background:
    linear-gradient(125deg, rgba(255,255,255,.025), transparent 38%),
    var(--event-camera);
  color: var(--event-surface);
}
.camera-page::before {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.2'/%3E%3C/svg%3E");
  content: '';
  opacity: .12;
  pointer-events: none;
}
.camera-shell {
  position: relative;
  display: flex;
  box-sizing: border-box;
  width: min(100%, 30rem);
  height: 100svh;
  margin: 0 auto;
  padding: max(.65rem, env(safe-area-inset-top)) 1rem max(.7rem, env(safe-area-inset-bottom));
  flex-direction: column;
  overflow: hidden;
}
.camera-topline {
  flex: none;
  margin: -.1rem -1rem .45rem;
  border-bottom: 1px solid color-mix(in srgb, var(--event-accent) 38%, transparent);
  padding: .35rem 1rem .45rem;
  color: var(--event-accent);
  font-family: Georgia, serif;
  font-size: .53rem;
  font-style: italic;
  letter-spacing: .12em;
  text-align: center;
  text-transform: uppercase;
}
.camera-header { flex: none; text-align: center; }
.camera-brand {
  display: flex;
  margin-bottom: .45rem;
  justify-content: space-between;
  color: color-mix(in srgb, var(--event-surface) 42%, transparent);
  font-size: .46rem;
  font-weight: 800;
  letter-spacing: .14em;
  text-transform: uppercase;
}
.eyebrow { margin: 0 0 .3rem; color: var(--event-accent); font-size: .55rem; font-weight: 900; letter-spacing: .2em; text-transform: uppercase; }
h1 { margin: 0; color: var(--event-surface); font-family: Georgia, 'Times New Roman', serif; font-size: clamp(1.8rem, 8vw, 2.45rem); font-weight: 400; line-height: .88; text-transform: uppercase; }
h1 span { display:block; margin-top:.15rem; color:var(--event-accent); font-size:.75em; font-style:italic; text-transform:none; }
.welcome-copy { max-width: 22rem; margin: .5rem auto 0; color: color-mix(in srgb, var(--event-surface) 58%, transparent); font-size: .66rem; line-height: 1.42; }
.camera-body { display:flex; min-height:0; padding:.55rem 0; flex:1 1 auto; align-items:center; justify-content:center; flex-direction:column; overflow:hidden; }
.camera-status { display:flex; align-items:center; flex-direction:column; text-align:center; }
.camera-status p { margin:.8rem 0 0; font-family:Georgia,serif; font-size:1rem; }
.camera-status--error { width:100%; border:1px solid color-mix(in srgb, var(--event-accent) 50%, transparent); background:rgba(0,0,0,.24); padding:1.5rem; }
.camera-status--error p { color:#ffb4ac; font-family:inherit; font-size:.78rem; }
.status-spinner,.upload-spinner { width:1.8rem; height:1.8rem; border:2px solid color-mix(in srgb, var(--event-accent) 22%, transparent); border-top-color:var(--event-accent); border-radius:50%; animation:spin 800ms linear infinite; }
.retry-button { margin-top:.8rem; border:1px solid var(--event-accent); background:transparent; padding:.6rem 1rem; color:var(--event-accent); cursor:pointer; font-size:.58rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
.viewfinder { position:relative; width:100%; min-height:0; flex:1 1 auto; overflow:hidden; border:2px solid var(--event-accent); background:#080706; box-shadow: inset 0 0 0 4px #0a0807, inset 0 0 0 5px color-mix(in srgb, var(--event-accent) 48%, transparent), 0 .75rem 1.8rem rgba(0,0,0,.35); }
.camera-video { display:block; width:100%; height:100%; min-height:0; object-fit:cover; filter:saturate(.86) contrast(1.04) brightness(.95); }
.camera-video--mirrored { transform:scaleX(-1); }
.switch-camera-button { position:absolute; z-index:8; top:.75rem; left:50%; transform:translateX(-50%); display:flex; min-width:4rem; height:2.15rem; padding:0 .65rem; align-items:center; justify-content:center; gap:.35rem; border:1px solid rgba(255,255,255,.68); border-radius:2rem; background:rgba(17,11,9,.6); backdrop-filter:blur(10px); color:white; cursor:pointer; font-size:.52rem; font-weight:800; text-transform:uppercase; }
.switch-camera-button svg { width:1rem; height:1rem; fill:none; stroke:currentColor; stroke-width:1.4; }
.viewfinder-grain { position:absolute; inset:0; opacity:.08; pointer-events:none; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.viewfinder-corners { position:absolute; inset:.8rem; pointer-events:none; }
.viewfinder-corners i { position:absolute; width:1.1rem; height:1.1rem; border-color:rgba(255,255,255,.72); border-style:solid; }
.viewfinder-corners i:nth-child(1){top:0;left:0;border-width:1px 0 0 1px}.viewfinder-corners i:nth-child(2){top:0;right:0;border-width:1px 1px 0 0}.viewfinder-corners i:nth-child(3){bottom:0;left:0;border-width:0 0 1px 1px}.viewfinder-corners i:nth-child(4){right:0;bottom:0;border-width:0 1px 1px 0}
.camera-loading,.camera-permission-error { position:absolute; inset:0; z-index:6; display:flex; align-items:center; justify-content:center; flex-direction:column; background:rgba(8,7,6,.88); padding:1.5rem; text-align:center; }
.camera-loading p,.camera-permission-error p { max-width:20rem; margin:.65rem 0 0; color:#eee5dc; font-size:.72rem; line-height:1.5; }
.frame-information { position:absolute; right:.8rem; bottom:.6rem; left:.8rem; display:flex; justify-content:space-between; color:rgba(255,255,255,.68); font-size:.46rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }
.film-counter { display:flex; width:100%; margin-top:.5rem; align-items:center; justify-content:space-between; gap:1rem; }
.film-counter > div:first-child { display:flex; flex-direction:column; }
.film-label { color:var(--event-accent); font-size:.55rem; font-weight:900; letter-spacing:.14em; text-transform:uppercase; }
.film-counter small { margin-top:.18rem; color:color-mix(in srgb, var(--event-surface) 42%, transparent); font-size:.5rem; }
.counter-window { display:flex; min-width:7.5rem; height:2.75rem; align-items:center; justify-content:center; overflow:hidden; border:1px solid color-mix(in srgb, var(--event-accent) 40%, transparent); background:rgba(0,0,0,.2); }
.counter-number { font-family:Georgia,serif; }
.counter-number--current { min-width:2.9rem; color:var(--event-surface); font-size:2rem; text-align:center; }
.counter-number--previous,.counter-number--next { width:2rem; color:color-mix(in srgb, var(--event-surface) 24%, transparent); font-size:.9rem; text-align:center; }
.camera-footer { flex:none; }
.shutter-ticket { display:grid; width:100%; min-height:3.55rem; grid-template-columns:3.7rem 1fr 3rem; align-items:stretch; border:1px solid var(--event-accent); background:var(--event-surface); color:var(--event-line); cursor:pointer; padding:0; box-shadow:.28rem .28rem 0 var(--event-accent-dark); }
.shutter-ticket:disabled { cursor:not-allowed; opacity:.45; box-shadow:none; }
.ticket-film,.ticket-mark { display:flex; align-items:center; justify-content:center; flex-direction:column; background:var(--event-accent); color:var(--event-line); }
.ticket-film { border-right:1px dashed color-mix(in srgb, var(--event-line) 40%, transparent); }
.ticket-film small { font-size:.45rem; font-weight:900; letter-spacing:.1em; text-transform:uppercase; }
.ticket-film strong { font-family:Georgia,serif; font-size:1.35rem; }
.ticket-action { display:flex; align-items:center; justify-content:center; gap:.55rem; font-size:.64rem; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
.ticket-mark { border-left:1px dashed color-mix(in srgb, var(--event-line) 40%, transparent); font-size:1.4rem; }
.shutter-icon { display:grid; width:1.7rem; height:1.7rem; place-items:center; border:1px solid var(--event-line); border-radius:50%; }
.shutter-icon i { width:.75rem; height:.75rem; border-radius:50%; background:var(--event-line); }
.footer-message { margin:.55rem 0 0; color:color-mix(in srgb, var(--event-surface) 45%, transparent); font-family:Georgia,serif; font-size:.58rem; font-style:italic; text-align:center; }
.dev-skip-button { display:block; margin:.35rem auto 0; border:0; background:transparent; color:color-mix(in srgb, var(--event-surface) 35%, transparent); cursor:pointer; font-size:.5rem; }
.capture-canvas { display:none; }
.capture-flash { position:fixed; z-index:200; inset:0; background:white; animation:flash 220ms ease-out forwards; pointer-events:none; }
.upload-overlay { position:fixed; z-index:150; inset:0; display:grid; place-items:center; background:rgba(14,9,8,.74); backdrop-filter:blur(8px); }
.upload-card { width:min(calc(100% - 2rem),20rem); border:1px solid var(--event-accent); background:var(--event-camera); padding:1.4rem; text-align:center; box-shadow:0 1.5rem 4rem rgba(0,0,0,.35); }
.upload-card .upload-spinner { margin:0 auto; }
.upload-card p { margin:.75rem 0 .15rem; color:var(--event-surface); font-family:Georgia,serif; font-size:1rem; }
.upload-card span { color:color-mix(in srgb, var(--event-surface) 50%, transparent); font-size:.62rem; }
@keyframes spin { to { transform:rotate(360deg); } }
@keyframes flash { 0%{opacity:1} 100%{opacity:0} }
@media (max-height:720px) {
  .camera-topline { margin-bottom:.25rem; }
  .welcome-copy { margin-top:.35rem; }
  .camera-body { padding:.35rem 0; }
  .shutter-ticket { min-height:3.25rem; }
}
</style>
