// The camera engine every theme shares: guest session, live camera, flash,
// capture, thumbnail and upload. Ported from the Caz & Dan camera, which ran
// a real wedding. A theme view only supplies the template and styles.
//
//   const cam = useCameraRoll()
//   <video :ref="cam.videoRef" ...>  <canvas :ref="cam.canvasRef" ...>
//
// A shot only comes off the roll after the server confirms the upload.

import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/utils/api.js'
import { generateId } from '@/utils/id.js'
import { eventConfig } from '@/config/event.js'

function createThumbnailBlob(file, maxWidth = 400, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      try {
        const scale = Math.min(1, maxWidth / image.naturalWidth)
        const width = Math.max(1, Math.round(image.naturalWidth * scale))
        const height = Math.max(1, Math.round(image.naturalHeight * scale))
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) return reject(new Error('No canvas context'))
        canvas.width = width
        canvas.height = height
        context.drawImage(image, 0, 0, width, height)
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Thumbnail encode failed'))), 'image/jpeg', quality)
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Thumbnail failed'))
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
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not capture photograph'))), 'image/jpeg', quality)
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
  if (!response.ok) throw new Error(data?.error || `Request failed with status ${response.status}`)
  return data
}

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms))

export function useCameraRoll({ finishedPath = '/finished' } = {}) {
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

  // Same keys as the bespoke views, so a guest keeps their roll.
  const STORAGE_KEYS = {
    deviceToken: `disposable_camera_${eventConfig.slug}_device_token`,
    sessionId: `disposable_camera_${eventConfig.slug}_session_id`,
  }

  const isFrontCamera = computed(() => facingMode.value === 'user')
  const remainingCounter = computed(() => String(Math.max(0, shotsRemaining.value)).padStart(2, '0'))
  const shotsTaken = computed(() => Math.max(0, eventConfig.maxShots - shotsRemaining.value))

  function getDeviceToken() {
    let token = localStorage.getItem(STORAGE_KEYS.deviceToken)
    if (!token) {
      token = generateId()
      localStorage.setItem(STORAGE_KEYS.deviceToken, token)
    }
    return token
  }

  async function startSession() {
    loading.value = true
    error.value = ''
    try {
      const response = await fetch(`${API_BASE_URL}/api/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceToken: getDeviceToken() }),
      })
      const data = await parseJsonResponse(response)
      if (!data?.ok || !data?.session) throw new Error(data?.error || 'Failed to start session')
      session.value = data.session
      shotsRemaining.value = Number(data.session.shots_remaining || 0)
      localStorage.setItem(STORAGE_KEYS.sessionId, data.session.id)
      if (shotsRemaining.value <= 0) {
        router.push(finishedPath)
        return false
      }
      return true
    } catch (err) {
      error.value = err.message || 'Something went wrong'
      console.error('startSession failed:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const getActiveVideoTrack = () => cameraStream?.getVideoTracks?.()[0] || null

  function refreshTorchCapability() {
    hardwareTorchAvailable.value = false
    if (isFrontCamera.value) return
    const track = getActiveVideoTrack()
    if (!track) return
    try {
      hardwareTorchAvailable.value = track.getCapabilities?.()?.torch === true
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
      await track.applyConstraints({ advanced: [{ torch: enabled }] })
      hardwareTorchAvailable.value = true
      return true
    } catch (err) {
      if (enabled) console.info('Hardware torch unavailable, using screen flash fallback.', err)
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
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop())
    cameraStream = null
    cameraReady.value = false
    hardwareTorchAvailable.value = false
    if (videoRef.value) videoRef.value.srcObject = null
  }

  async function startCamera() {
    cameraStarting.value = true
    cameraReady.value = false
    cameraError.value = ''
    stopCamera()
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not support the in-site camera.')
      cameraStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: facingMode.value }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      await nextTick()
      if (!videoRef.value) throw new Error('Camera preview is unavailable.')
      videoRef.value.srcObject = cameraStream
      await videoRef.value.play()
      cameraReady.value = true
      refreshTorchCapability()
    } catch (err) {
      console.error('startCamera failed:', err)
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        cameraError.value = 'Camera access was denied. Allow camera permission in your browser settings, then try again.'
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        cameraError.value = 'No camera could be found on this device.'
      } else if (err?.name === 'NotReadableError') {
        cameraError.value = 'Your camera is being used by another app. Close it and try again.'
      } else {
        cameraError.value = err?.message || 'The camera could not be started.'
      }
    } finally {
      cameraStarting.value = false
    }
  }

  async function switchCamera() {
    if (cameraStarting.value || uploading.value) return
    facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
    await startCamera()
  }

  function toggleFlash() {
    flashEnabled.value = !flashEnabled.value
  }

  async function uploadFile(file) {
    if (!session.value?.id) throw new Error('No active session found')
    const formData = new FormData()
    formData.append('sessionId', session.value.id)
    formData.append('photo', file, file.name || 'photograph.jpg')
    try {
      formData.append('thumbnail', await createThumbnailBlob(file), 'thumbnail.jpg')
    } catch (err) {
      console.warn('Thumbnail generation skipped:', err)
    }
    const response = await fetch(`${API_BASE_URL}/api/photo/upload`, { method: 'POST', body: formData })
    const data = await parseJsonResponse(response)
    if (!data?.ok || !data?.session) throw new Error(data?.error || 'Upload failed')
    session.value = data.session
    shotsRemaining.value = Number(data.session.shots_remaining || 0)
    if ('vibrate' in navigator) navigator.vibrate(50)
    if (shotsRemaining.value <= 0) {
      stopCamera()
      router.push(finishedPath)
    }
  }

  async function takePicture() {
    if (!cameraReady.value || uploading.value || loading.value || shotsRemaining.value <= 0) return
    const video = videoRef.value
    const canvas = canvasRef.value
    if (!video || !canvas) {
      cameraError.value = 'The camera is not ready yet.'
      return
    }
    if (!video.videoWidth || !video.videoHeight) {
      cameraError.value = 'Wait for the camera to finish loading.'
      return
    }
    const context = canvas.getContext('2d')
    if (!context) {
      cameraError.value = 'The photograph could not be captured.'
      return
    }

    error.value = ''
    uploading.value = true
    let hardwareTorchUsed = false

    try {
      if (flashEnabled.value) {
        hardwareTorchUsed = await setHardwareTorch(true)
        if (hardwareTorchUsed) {
          // Let auto exposure react to the light before capturing.
          await sleep(520)
        } else {
          // Front camera or no torch: a longer screen flash lights the subject.
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
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        context.restore()
      } else {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
      }

      if (hardwareTorchUsed) {
        await sleep(120)
        await setHardwareTorch(false)
        hardwareTorchUsed = false
      }

      const photoBlob = await canvasToBlob(canvas)
      const photoFile = new File([photoBlob], `${eventConfig.slug}-${Date.now()}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
      await uploadFile(photoFile)
    } catch (err) {
      error.value = err.message || 'Photo upload failed'
      console.error('takePicture failed:', err)
    } finally {
      if (hardwareTorchUsed) await setHardwareTorch(false)
      uploading.value = false
    }
  }

  onMounted(async () => {
    if (await startSession()) await startCamera()
  })
  onBeforeUnmount(stopCamera)

  return {
    videoRef,
    canvasRef,
    shotsRemaining,
    shotsTaken,
    remainingCounter,
    loading,
    uploading,
    error,
    session,
    captureFlash,
    flashEnabled,
    hardwareTorchAvailable,
    cameraStarting,
    cameraReady,
    cameraError,
    isFrontCamera,
    startCamera,
    switchCamera,
    toggleFlash,
    takePicture,
  }
}
