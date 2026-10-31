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

import flashOnButton from '@/assets/events/sophies-last-rodeo/flash-on.png'
import shutterButton from '@/assets/events/sophies-last-rodeo/shutter-button.png'
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
const hardwareTorchAvailable = ref(false)

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

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function getActiveVideoTrack() {
  return cameraStream?.getVideoTracks?.()[0] || null
}

function refreshTorchCapability() {
  hardwareTorchAvailable.value = false

  if (isFrontCamera.value) return

  const track = getActiveVideoTrack()
  if (!track) return

  try {
    const capabilities = track.getCapabilities?.()
    hardwareTorchAvailable.value = capabilities?.torch === true
  } catch {
    hardwareTorchAvailable.value = false
  }
}

async function setHardwareTorch(enabled) {
  if (isFrontCamera.value) return false

  const track = getActiveVideoTrack()
  if (!track || track.readyState !== 'live') return false

  try {
    const capabilities = track.getCapabilities?.()

    if (capabilities && capabilities.torch !== true) {
      hardwareTorchAvailable.value = false
      return false
    }

    await track.applyConstraints({
      advanced: [{ torch: enabled }],
    })

    hardwareTorchAvailable.value = true
    return true
  } catch (err) {
    if (enabled) {
      console.info('Hardware torch unavailable, using screen flash fallback.', err)
    }
    hardwareTorchAvailable.value = false
    return false
  }
}

function showScreenFlash(duration = 760) {
  captureFlash.value = true

  window.setTimeout(() => {
    captureFlash.value = false
  }, duration)
}


function stopCamera() {
  if (cameraStream) {
    cameraStream
      .getTracks()
      .forEach((track) => track.stop())
  }

  cameraStream = null
  cameraReady.value = false
  hardwareTorchAvailable.value = false

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
    refreshTorchCapability()
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

  const nextRemaining = Number(
    data.session.shots_remaining || 0,
  )

  shotsRemaining.value = nextRemaining

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

  let hardwareTorchUsed = false

  try {
    if (flashEnabled.value) {
      hardwareTorchUsed = await setHardwareTorch(true)

      if (hardwareTorchUsed) {
        // Keep the physical light on long enough for auto exposure to react
        // before the frame is captured.
        await sleep(520)
      } else {
        // Front camera and browsers without torch support get a longer screen
        // flash so the display has time to illuminate the subject.
        showScreenFlash(760)
        await sleep(320)
      }
    }

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

    if (hardwareTorchUsed) {
      // Leave the LED on very briefly after capture so the illuminated frame
      // is not lost while the camera finishes exposure processing.
      await sleep(120)
      await setHardwareTorch(false)
      hardwareTorchUsed = false
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
    if (hardwareTorchUsed) {
      await setHardwareTorch(false)
    }

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
  <main class="caz-camera" :style="themeStyle">
    <div v-if="captureFlash" class="capture-flash" aria-hidden="true"></div>

    <div v-if="uploading" class="upload-overlay" role="status" aria-live="polite">
      <div class="upload-card"><span class="spinner"></span><strong>{{ cameraCopy.developingTitle }}</strong><p>{{ cameraCopy.developingCopy }}</p></div>
    </div>

    <header class="camera-heading">
      <p>{{ cameraCopy.eyebrow }}</p>
      <h1>{{ cameraCopy.heading }}</h1>
      <span>{{ cameraCopy.intro }}</span>
    </header>

    <section class="camera-card">
      <div class="viewfinder">
        <video ref="videoRef" :class="{ mirrored: isFrontCamera }" autoplay muted playsinline></video>

        <div v-if="loading || cameraStarting" class="camera-message">Opening camera…</div>
        <div v-else-if="cameraError" class="camera-message camera-message--error">
          <p>{{ cameraError }}</p><button type="button" @click="startCamera">Try again</button>
        </div>

        <div class="counter"><strong>{{ remainingCounter }}</strong><span>LEFT</span></div>
      </div>

      <div class="camera-controls">
        <button type="button" class="control" :class="{ active: flashEnabled }" @click="toggleFlash">
          <span>⚡</span><small>{{ flashEnabled ? 'FLASH ON' : 'FLASH OFF' }}</small>
        </button>

        <button type="button" class="shutter" :disabled="!cameraReady || uploading" aria-label="Take photograph" @click="takePicture"><span></span></button>

        <button type="button" class="control" @click="switchCamera">
          <span>↻</span><small>FLIP</small>
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p class="roll-note">{{ eventConfig.maxShots }} PHOTOS PER GUEST</p>
    </section>

    <canvas ref="canvasRef" class="capture-canvas" aria-hidden="true"></canvas>
  </main>
</template>

<style scoped>
.caz-camera{box-sizing:border-box;min-height:100svh;background:#f7f5ef;color:#111;padding:max(24px,env(safe-area-inset-top)) 18px max(22px,env(safe-area-inset-bottom));font-family:Montserrat,Arial,sans-serif}
.camera-heading{width:min(100%,560px);margin:0 auto 20px;text-align:center}.camera-heading p{margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.24em}.camera-heading h1{margin:0;font-family:Georgia,'Times New Roman',serif;font-size:42px;font-weight:400}.camera-heading span{display:block;max-width:420px;margin:10px auto 0;color:#6d6a65;font-size:13px;line-height:1.55}
.camera-card{width:min(100%,560px);margin:0 auto}.viewfinder{position:relative;aspect-ratio:3/4;overflow:hidden;border-radius:10px;background:#111;box-shadow:0 14px 38px rgba(0,0,0,.13)}.viewfinder video{display:block;width:100%;height:100%;object-fit:cover}.mirrored{transform:scaleX(-1)}
.counter{position:absolute;top:14px;right:14px;display:flex;align-items:baseline;gap:6px;border:1px solid rgba(255,255,255,.55);border-radius:999px;background:rgba(0,0,0,.48);padding:7px 11px;color:white;backdrop-filter:blur(8px)}.counter strong{font:600 18px Georgia,serif}.counter span{font-size:8px;letter-spacing:.17em}
.camera-message{position:absolute;inset:0;display:grid;place-content:center;text-align:center;background:#111;color:white;padding:22px}.camera-message button{margin-top:12px;border:1px solid white;background:white;color:#111;padding:10px 16px}.camera-message--error{color:#ffd8d8}
.camera-controls{display:grid;grid-template-columns:1fr 92px 1fr;align-items:center;gap:16px;margin-top:22px}.control{display:grid;justify-items:center;gap:5px;border:0;background:transparent;color:#111;cursor:pointer}.control>span{display:grid;width:48px;height:48px;place-items:center;border:1px solid #c7c4bc;border-radius:999px;background:#fff}.control small{font-size:9px;letter-spacing:.13em}.control.active>span{background:#111;color:#fff;border-color:#111}
.shutter{display:grid;width:82px;height:82px;margin:auto;place-items:center;border:2px solid #111;border-radius:999px;background:transparent;cursor:pointer}.shutter span{display:block;width:64px;height:64px;border-radius:999px;background:#111}.shutter:disabled{opacity:.35}
.roll-note{margin:18px 0 0;text-align:center;font-size:10px;letter-spacing:.22em}.error{margin:15px 0 0;color:#9a3030;text-align:center;font-size:12px}.capture-canvas{display:none}
.upload-overlay{position:fixed;z-index:1000;inset:0;display:grid;place-items:center;background:rgba(247,245,239,.88);backdrop-filter:blur(8px)}.upload-card{text-align:center}.upload-card strong{display:block;font-family:Georgia,serif;font-size:24px}.upload-card p{margin:7px 0 0;color:#6d6a65;font-size:12px}.spinner{display:block;width:32px;height:32px;margin:0 auto 14px;border:2px solid #ccc;border-top-color:#111;border-radius:50%;animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.capture-flash{position:fixed;z-index:1200;inset:0;pointer-events:none;background:#fff;animation:flash 760ms linear forwards}@keyframes flash{0%,72%{opacity:1}100%{opacity:0}}
@media(max-width:520px){.caz-camera{padding-inline:12px}.camera-heading{margin-bottom:14px}.camera-heading h1{font-size:34px}.viewfinder{border-radius:8px}.camera-controls{grid-template-columns:1fr 80px 1fr}.shutter{width:72px;height:72px}.shutter span{width:56px;height:56px}}
</style>
