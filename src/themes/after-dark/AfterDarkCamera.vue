<script setup>
import { useAfterDark } from './useAfterDark.js'
import { useCameraRoll } from '@/composables/useCameraRoll.js'

const { event, copy, vars, dateLabel } = useAfterDark()
const {
  videoRef, canvasRef, remainingCounter, loading, uploading, error, captureFlash, flashEnabled,
  cameraStarting, cameraReady, cameraError, isFrontCamera, startCamera, switchCamera, toggleFlash, takePicture,
} = useCameraRoll()
</script>

<template>
  <main class="ad ad-camera" :style="vars">
    <!-- The live camera fills the screen, like the landing photo. -->
    <video ref="videoRef" class="ad-camera__video" :class="{ 'ad-camera__video--mirrored': isFrontCamera }" autoplay muted playsinline></video>
    <div class="ad-shade ad-camera__shade" aria-hidden="true"></div>

    <div v-if="captureFlash" class="ad-camera__flash" aria-hidden="true"></div>

    <div v-if="uploading" class="ad-camera__saving" role="status" aria-live="polite">
      <span class="ad-camera__spinner" aria-hidden="true"></span>
      <strong>{{ copy.savingTitle }}</strong>
      <p>{{ copy.savingCopy }}</p>
    </div>

    <div class="ad-inner">
      <header class="ad-camera__head">
        <p class="ad-mini-title">{{ event.title }}</p>
        <p class="ad-date ad-mini-date">{{ dateLabel }}</p>
      </header>

      <div v-if="loading || cameraStarting" class="ad-camera__message">Loading film…</div>
      <div v-else-if="cameraError" class="ad-camera__message">
        <p>{{ cameraError }}</p>
        <button type="button" class="ad-button ad-camera__retry" @click="startCamera">TRY AGAIN</button>
      </div>

      <div class="ad-camera__bottom">
        <p class="ad-camera__count"><strong>{{ remainingCounter }}</strong><span>shots left</span></p>

        <div class="ad-camera__controls">
          <button
            type="button"
            class="ad-camera__control"
            :class="{ 'ad-camera__control--on': flashEnabled }"
            :aria-pressed="flashEnabled"
            aria-label="Flash"
            @click="toggleFlash"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 13.5h6L10 22l8-11.5h-6L13 2Z" /></svg>
            <small>{{ flashEnabled ? 'ON' : 'OFF' }}</small>
          </button>

          <button type="button" class="ad-camera__shutter" :disabled="!cameraReady || uploading" aria-label="Take photo" @click="takePicture"><span></span></button>

          <button type="button" class="ad-camera__control" aria-label="Switch camera" @click="switchCamera">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5" /></svg>
            <small>FLIP</small>
          </button>
        </div>

        <p v-if="error" class="ad-error">{{ error }}</p>
        <p v-else class="ad-sub ad-camera__hint">{{ copy.cameraHint }}</p>
      </div>
    </div>

    <canvas ref="canvasRef" class="ad-camera__canvas" aria-hidden="true"></canvas>
  </main>
</template>

<style>
.ad-camera {
  padding-top: 22px;
}

.ad-camera__video {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #0b0b0b;
}

.ad-camera__video--mirrored {
  transform: scaleX(-1);
}

/* Lighter in the middle than the landing page, so the shot is clear. */
.ad-camera__shade {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 22%, rgba(0, 0, 0, 0) 62%, rgba(0, 0, 0, 0.85) 86%, #000 100%);
}

.ad-camera__head {
  width: 100%;
}

.ad-camera__message {
  display: grid;
  gap: 14px;
  margin: auto 0;
  padding: 20px;
  color: var(--ad-soft);
  font-size: 15px;
  line-height: 1.45;
}

.ad-camera__message p {
  margin: 0;
}

.ad-camera__retry {
  width: auto;
  justify-self: center;
  margin: 0;
  padding: 10px 22px;
}

.ad-camera__bottom {
  width: 100%;
  margin-top: auto;
}

.ad-camera__count {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin: 0;
}

.ad-camera__count strong {
  font-size: 44px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.03em;
  text-shadow: 0 0 18px color-mix(in srgb, var(--ad-glow) 70%, transparent);
}

.ad-camera__count span {
  color: var(--ad-soft);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.ad-camera__controls {
  display: flex;
  width: 100%;
  max-width: 320px;
  align-items: center;
  justify-content: space-between;
  margin: 16px auto 0;
}

.ad-camera__control {
  display: grid;
  width: 56px;
  height: 56px;
  place-content: center;
  gap: 2px;
  border: 1.5px solid rgba(255, 255, 255, 0.55);
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(4px);
}

.ad-camera__control svg {
  justify-self: center;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ad-camera__control small {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.ad-camera__control--on {
  border-color: var(--ad-glow);
  box-shadow: 0 0 16px color-mix(in srgb, var(--ad-glow) 60%, transparent);
  color: var(--ad-glow);
}

.ad-camera__shutter {
  display: grid;
  width: 84px;
  height: 84px;
  place-items: center;
  border: 2px solid var(--ad-glow);
  border-radius: 50%;
  background: transparent;
  box-shadow: 0 0 22px color-mix(in srgb, var(--ad-glow) 55%, transparent), inset 0 0 12px color-mix(in srgb, var(--ad-glow) 25%, transparent);
  cursor: pointer;
  transition: transform 0.12s ease;
}

.ad-camera__shutter span {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #fff;
}

.ad-camera__shutter:active:not(:disabled) {
  transform: scale(0.94);
}

.ad-camera__shutter:disabled {
  opacity: 0.45;
  cursor: default;
}

.ad-camera__hint {
  max-width: 300px;
  margin: 14px auto 0;
}

.ad-camera__flash {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: #fff;
  animation: ad-flash 0.76s ease-out forwards;
}

@keyframes ad-flash {
  0%, 45% { opacity: 1; }
  100% { opacity: 0; }
}

.ad-camera__saving {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
}

.ad-camera__saving strong {
  margin-top: 12px;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transform: scaleX(0.82);
}

.ad-camera__saving p {
  margin: 0;
  color: var(--ad-soft);
  font-size: 13px;
}

.ad-camera__spinner {
  width: 34px;
  height: 34px;
  border: 2px solid color-mix(in srgb, var(--ad-glow) 25%, transparent);
  border-top-color: var(--ad-glow);
  border-radius: 50%;
  box-shadow: 0 0 14px color-mix(in srgb, var(--ad-glow) 50%, transparent);
  animation: ad-spin 0.9s linear infinite;
}

@keyframes ad-spin {
  to { transform: rotate(360deg); }
}

.ad-camera__canvas {
  display: none;
}
</style>
