<script setup>
import { useSoftFilm } from './useSoftFilm.js'
import { useCameraRoll } from '@/composables/useCameraRoll.js'

const { event, copy, vars, dateLabel } = useSoftFilm()
const {
  videoRef,
  canvasRef,
  remainingCounter,
  loading,
  uploading,
  error,
  captureFlash,
  flashEnabled,
  cameraStarting,
  cameraReady,
  cameraError,
  isFrontCamera,
  startCamera,
  switchCamera,
  toggleFlash,
  takePicture,
} = useCameraRoll()
</script>

<template>
  <main class="sf sf-camera" :style="vars">
    <div v-if="captureFlash" class="sf-camera__flash" aria-hidden="true"></div>

    <div v-if="uploading" class="sf-camera__saving" role="status" aria-live="polite">
      <div class="sf-camera__saving-card">
        <span class="sf-camera__spinner" aria-hidden="true"></span>
        <strong>{{ copy.savingTitle }}</strong>
        <p>{{ copy.savingCopy }}</p>
      </div>
    </div>

    <div class="sf-inner">
      <header class="sf-camera__head">
        <p class="sf-date">{{ dateLabel }}</p>
        <h1 class="sf-camera__names">{{ event.title }}</h1>
      </header>

      <div class="sf-camera__body">
      <figure class="sf-print sf-camera__print">
        <i class="sf-tape"></i>
        <div class="sf-camera__frame">
          <video ref="videoRef" :class="{ 'sf-camera__video--mirrored': isFrontCamera }" class="sf-camera__video" autoplay muted playsinline></video>
          <div v-if="loading || cameraStarting" class="sf-camera__message">Loading film…</div>
          <div v-else-if="cameraError" class="sf-camera__message sf-camera__message--error">
            <p>{{ cameraError }}</p>
            <button type="button" class="sf-camera__retry" @click="startCamera">Try again</button>
          </div>
        </div>
        <figcaption class="sf-camera__caption">
          <span>{{ copy.cameraHeading }}</span>
          <b class="sf-stamp sf-camera__count"><em>{{ remainingCounter }}</em> left</b>
        </figcaption>
      </figure>

      <div class="sf-camera__controls">
        <button
          type="button"
          class="sf-camera__control"
          :class="{ 'sf-camera__control--on': flashEnabled }"
          :aria-pressed="flashEnabled"
          aria-label="Flash"
          @click="toggleFlash"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 13.5h6L10 22l8-11.5h-6L13 2Z" /></svg>
          <small>{{ flashEnabled ? 'ON' : 'OFF' }}</small>
        </button>

        <button
          type="button"
          class="sf-camera__shutter"
          :disabled="!cameraReady || uploading"
          aria-label="Take photo"
          @click="takePicture"
        ><span></span></button>

        <button type="button" class="sf-camera__control" aria-label="Switch camera" @click="switchCamera">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5" /></svg>
          <small>FLIP</small>
        </button>
      </div>

      <p v-if="error" class="sf-error">{{ error }}</p>
      <p v-else class="sf-copy sf-camera__intro">{{ copy.cameraIntro }}</p>
      </div>
    </div>

    <canvas ref="canvasRef" class="sf-camera__canvas" aria-hidden="true"></canvas>
  </main>
</template>

<style>
.sf-camera {
  padding-top: 20px;
}

.sf-camera__head {
  width: 100%;
}

/* Viewfinder, controls and note sit centred in the space left. */
.sf-camera__body {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  margin: auto 0;
}

.sf-camera__names {
  margin: 6px 0 0;
  font-family: var(--sf-serif);
  font-size: 26px;
  font-style: italic;
  font-weight: 500;
  line-height: 1.05;
}

/* The viewfinder is a print, slightly turned, with the live camera inside. */
.sf-camera__print {
  width: min(100%, calc(46svh * 0.75 + 20px), 360px);
  margin: 16px auto 0;
  padding: 10px 10px 44px;
  transform: rotate(-1.5deg);
}

.sf-camera__frame {
  position: relative;
  overflow: hidden;
  aspect-ratio: 3 / 4;
  background: #1f1a16;
}

.sf-camera__video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sf-camera__video--mirrored {
  transform: scaleX(-1);
}

.sf-camera__message {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 12px;
  padding: 20px;
  color: #f1e8da;
  font-family: var(--sf-serif);
  font-size: 15px;
  font-style: italic;
  line-height: 1.4;
}

.sf-camera__message p {
  margin: 0;
}

.sf-camera__retry {
  justify-self: center;
  border: 1px solid currentColor;
  border-radius: 999px;
  background: none;
  padding: 8px 16px;
  color: inherit;
  font: 600 11px var(--sf-sans);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.sf-camera__caption {
  position: absolute;
  right: 14px;
  bottom: 11px;
  left: 14px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  color: var(--sf-muted);
  font-family: var(--sf-serif);
  font-size: 15px;
  font-style: italic;
}

.sf-camera__count {
  font-size: 12px;
  text-transform: uppercase;
}

.sf-camera__count em {
  font-size: 18px;
  font-style: normal;
}

.sf-camera__controls {
  display: flex;
  width: 100%;
  max-width: 320px;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
}

.sf-camera__control {
  display: grid;
  width: 56px;
  height: 56px;
  place-content: center;
  gap: 2px;
  border: 1.5px solid color-mix(in srgb, var(--sf-ink) 55%, transparent);
  border-radius: 50%;
  background: transparent;
  color: var(--sf-ink);
  cursor: pointer;
}

.sf-camera__control svg {
  justify-self: center;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sf-camera__control small {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.sf-camera__control--on {
  border-color: var(--sf-accent);
  background: var(--sf-accent);
  color: #fff7ef;
}

.sf-camera__shutter {
  display: grid;
  width: 84px;
  height: 84px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--sf-accent);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--sf-accent) 35%, transparent);
  cursor: pointer;
  transition: transform 0.12s ease;
}

.sf-camera__shutter span {
  width: 64px;
  height: 64px;
  border: 2px solid rgba(255, 247, 239, 0.85);
  border-radius: 50%;
}

.sf-camera__shutter:active:not(:disabled) {
  transform: scale(0.94);
}

.sf-camera__shutter:disabled {
  opacity: 0.5;
  cursor: default;
}

.sf-camera__intro {
  max-width: 300px;
  margin-top: 12px;
  font-size: 14px;
}

.sf-camera__flash {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: #fff;
  animation: sf-flash 0.76s ease-out forwards;
}

@keyframes sf-flash {
  0%, 45% { opacity: 1; }
  100% { opacity: 0; }
}

.sf-camera__saving {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, var(--sf-paper) 72%, transparent);
  backdrop-filter: blur(3px);
}

.sf-camera__saving-card {
  display: grid;
  justify-items: center;
  gap: 6px;
  min-width: 220px;
  background: var(--sf-print);
  padding: 22px 26px 24px;
  box-shadow: 0 10px 22px rgba(60, 40, 20, 0.2);
}

.sf-camera__saving-card strong {
  margin-top: 8px;
  font-family: var(--sf-serif);
  font-size: 20px;
  font-style: italic;
  font-weight: 500;
}

.sf-camera__saving-card p {
  margin: 0;
  color: var(--sf-muted);
  font-size: 13px;
}

.sf-camera__spinner {
  width: 26px;
  height: 26px;
  border: 2px solid color-mix(in srgb, var(--sf-accent) 25%, transparent);
  border-top-color: var(--sf-accent);
  border-radius: 50%;
  animation: sf-spin 0.9s linear infinite;
}

@keyframes sf-spin {
  to { transform: rotate(360deg); }
}

.sf-camera__canvas {
  display: none;
}
</style>
