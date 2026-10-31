<script setup>
import { useClassicEditorial } from './useClassicEditorial.js'
import { useCameraRoll } from '@/composables/useCameraRoll.js'

const { event, copy, vars, dateLabel, fill } = useClassicEditorial()
const {
  videoRef, canvasRef, remainingCounter, loading, uploading, error, captureFlash, flashEnabled,
  cameraStarting, cameraReady, cameraError, isFrontCamera, startCamera, switchCamera, toggleFlash, takePicture,
} = useCameraRoll()
</script>

<template>
  <main class="ce ce-camera" :style="vars">
    <div v-if="captureFlash" class="ce-camera__flash" aria-hidden="true"></div>

    <div v-if="uploading" class="ce-camera__saving" role="status" aria-live="polite">
      <div>
        <span class="ce-camera__spinner" aria-hidden="true"></span>
        <strong>{{ copy.savingTitle }}</strong>
        <p>{{ fill(copy.savingCopy) }}</p>
      </div>
    </div>

    <div class="ce-inner ce-camera__inner">
      <header class="ce-camera__head">
        <p class="ce-eyebrow">{{ event.title }} · {{ dateLabel }}</p>
        <h1 class="ce-heading">{{ copy.cameraHeading }}</h1>
        <p class="ce-body">{{ fill(copy.cameraIntro) }}</p>
      </header>

      <div class="ce-camera__viewfinder">
        <video ref="videoRef" :class="{ 'ce-camera__video--mirrored': isFrontCamera }" class="ce-camera__video" autoplay muted playsinline></video>
        <div v-if="loading || cameraStarting" class="ce-camera__message">Opening camera…</div>
        <div v-else-if="cameraError" class="ce-camera__message ce-camera__message--error">
          <p>{{ cameraError }}</p>
          <button type="button" @click="startCamera">Try again</button>
        </div>
        <div class="ce-camera__counter"><strong>{{ remainingCounter }}</strong><span>LEFT</span></div>
      </div>

      <div class="ce-camera__controls">
        <button type="button" class="ce-camera__control" :class="{ 'ce-camera__control--on': flashEnabled }" :aria-pressed="flashEnabled" @click="toggleFlash">
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 13.5h6L10 22l8-11.5h-6L13 2Z" /></svg></span>
          <small>{{ flashEnabled ? 'FLASH ON' : 'FLASH OFF' }}</small>
        </button>
        <button type="button" class="ce-camera__shutter" :disabled="!cameraReady || uploading" aria-label="Take photograph" @click="takePicture"><span></span></button>
        <button type="button" class="ce-camera__control" @click="switchCamera">
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5" /></svg></span>
          <small>FLIP</small>
        </button>
      </div>

      <p v-if="error" class="ce-error">{{ error }}</p>
      <p class="ce-camera__roll">{{ event.maxShots }} PHOTOS PER GUEST</p>
    </div>

    <canvas ref="canvasRef" class="ce-camera__canvas" aria-hidden="true"></canvas>
  </main>
</template>

<style>
.ce-camera {
  padding-inline: 14px;
  padding-top: max(22px, env(safe-area-inset-top));
}

.ce-camera__inner {
  max-width: 560px;
}

.ce-camera__head {
  margin-bottom: 16px;
}

.ce-camera__viewfinder {
  position: relative;
  width: min(100%, calc(52svh * 0.75));
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border-radius: 10px;
  background: #111;
  box-shadow: 0 14px 38px rgba(0, 0, 0, 0.13);
}

.ce-camera__video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ce-camera__video--mirrored {
  transform: scaleX(-1);
}

.ce-camera__counter {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  align-items: baseline;
  gap: 6px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.48);
  padding: 7px 11px;
  color: #fff;
  backdrop-filter: blur(8px);
}

.ce-camera__counter strong {
  font: 600 18px var(--ce-serif);
}

.ce-camera__counter span {
  font-size: 8px;
  letter-spacing: 0.17em;
}

.ce-camera__message {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 12px;
  background: #111;
  padding: 22px;
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
}

.ce-camera__message p {
  margin: 0;
}

.ce-camera__message button {
  justify-self: center;
  border: 1px solid #fff;
  background: #fff;
  padding: 10px 16px;
  color: #111;
  font: 600 11px var(--ce-sans);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.ce-camera__controls {
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 92px 1fr;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.ce-camera__control {
  display: grid;
  justify-items: center;
  gap: 5px;
  border: 0;
  background: transparent;
  color: var(--ce-ink);
  cursor: pointer;
}

.ce-camera__control > span {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border: 1px solid #c7c4bc;
  border-radius: 999px;
  background: #fff;
}

.ce-camera__control svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ce-camera__control small {
  font-size: 9px;
  letter-spacing: 0.13em;
}

.ce-camera__control--on > span {
  border-color: var(--ce-ink);
  background: var(--ce-ink);
  color: #fff;
}

.ce-camera__shutter {
  display: grid;
  width: 82px;
  height: 82px;
  margin: auto;
  place-items: center;
  border: 2px solid var(--ce-ink);
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  transition: transform 0.12s ease;
}

.ce-camera__shutter span {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background: var(--ce-ink);
}

.ce-camera__shutter:active:not(:disabled) {
  transform: scale(0.94);
}

.ce-camera__shutter:disabled {
  opacity: 0.35;
  cursor: default;
}

.ce-camera__roll {
  margin: 16px 0 0;
  font-size: 10px;
  letter-spacing: 0.22em;
}

.ce-camera__saving {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  background: rgba(247, 245, 239, 0.88);
  backdrop-filter: blur(8px);
}

.ce-camera__saving strong {
  display: block;
  font-family: var(--ce-serif);
  font-size: 24px;
  font-weight: 400;
}

.ce-camera__saving p {
  margin: 7px 0 0;
  color: var(--ce-muted);
  font-size: 12px;
}

.ce-camera__spinner {
  display: block;
  width: 32px;
  height: 32px;
  margin: 0 auto 14px;
  border: 2px solid #ccc;
  border-top-color: var(--ce-ink);
  border-radius: 50%;
  animation: ce-spin 0.7s linear infinite;
}

@keyframes ce-spin {
  to { transform: rotate(360deg); }
}

.ce-camera__flash {
  position: fixed;
  inset: 0;
  z-index: 1200;
  pointer-events: none;
  background: #fff;
  animation: ce-flash 760ms linear forwards;
}

@keyframes ce-flash {
  0%, 72% { opacity: 1; }
  100% { opacity: 0; }
}

.ce-camera__canvas {
  display: none;
}
</style>
