<script setup>
import { useSoftFilm } from './useSoftFilm.js'

const { event, copy, vars, dateLabel, stamp, fill } = useSoftFilm()
</script>

<template>
  <main class="sf sf-finished" :style="vars">
    <div class="sf-inner">
      <p class="sf-date">{{ dateLabel }}</p>
      <h1 class="sf-names sf-finished__title">{{ copy.finishedTitle }}</h1>

      <div class="sf-finished__middle">
        <!-- An undeveloped print: the photos stay a surprise until the gallery opens. -->
        <div class="sf-finished__stack" aria-hidden="true">
          <span class="sf-print sf-finished__back sf-finished__back--one"></span>
          <span class="sf-print sf-finished__back sf-finished__back--two"></span>
          <figure class="sf-print sf-finished__print">
            <i class="sf-tape"></i>
            <span class="sf-finished__undeveloped"></span>
            <b v-if="stamp" class="sf-stamp sf-finished__stamp">{{ stamp }}</b>
            <figcaption class="sf-print__caption sf-finished__caption">developing…</figcaption>
          </figure>
        </div>

        <h2 class="sf-rule">ROLL COMPLETE</h2>
        <p class="sf-copy">{{ fill(copy.finishedBody) }}</p>
      </div>

      <p class="sf-note sf-finished__note">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h2.2l1.2-2h3.2l1.2 2H17a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Z" /><circle cx="12" cy="13.5" r="3.5" /></svg>
        {{ event.maxShots }} OF {{ event.maxShots }} TAKEN
      </p>
    </div>
  </main>
</template>

<style>
.sf-finished__title {
  font-size: clamp(36px, 11vw, 46px);
}

.sf-finished__middle {
  width: 100%;
  margin: auto 0;
  padding-top: 20px;
}

.sf-finished__stack {
  position: relative;
  width: min(200px, 52vw);
  margin: 0 auto 28px;
  aspect-ratio: 178 / 257;
}

.sf-finished__back,
.sf-finished__print {
  position: absolute;
  inset: 0;
}

.sf-finished__back--one {
  transform: rotate(-8deg) translate(-14px, 6px);
  opacity: 0.85;
}

.sf-finished__back--two {
  transform: rotate(6deg) translate(14px, 2px);
  opacity: 0.92;
}

.sf-finished__print {
  transform: rotate(-1.5deg);
}

/* Dark, slowly warming frame, like an instant print still developing. */
.sf-finished__undeveloped {
  display: block;
  width: 100%;
  aspect-ratio: 160 / 214;
  background:
    radial-gradient(120% 90% at 30% 25%, rgba(184, 120, 70, 0.35), transparent 60%),
    linear-gradient(160deg, #3d342c, #1f1a16);
  animation: sf-develop 6s ease-in-out infinite alternate;
}

@keyframes sf-develop {
  from { filter: brightness(0.9) sepia(0.2); }
  to { filter: brightness(1.15) sepia(0.45); }
}

.sf-finished__stamp {
  position: absolute;
  right: 16px;
  bottom: 44px;
}

.sf-finished__caption {
  right: auto;
  left: 12px;
}

.sf-finished__note {
  padding-top: 22px;
}
</style>
