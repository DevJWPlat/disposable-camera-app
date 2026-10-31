<script setup>
import { useAfterDark } from './useAfterDark.js'

const { event, copy, vars, dateLabel, heroUrl, fill } = useAfterDark()
</script>

<template>
  <main class="ad ad-finished" :style="vars">
    <img v-if="heroUrl" class="ad-photo ad-finished__photo" :src="heroUrl" alt="" />
    <div class="ad-shade ad-finished__shade" aria-hidden="true"></div>
    <svg class="ad-spark ad-finished__spark--a" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" /></svg>
    <svg class="ad-spark ad-finished__spark--b" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" /></svg>

    <div class="ad-inner">
      <p class="ad-mini-title">{{ event.title }}</p>
      <p class="ad-date ad-mini-date">{{ dateLabel }}</p>

      <div class="ad-finished__middle">
        <p class="ad-finished__count">{{ event.maxShots }}/{{ event.maxShots }}</p>
        <h1 class="ad-title ad-finished__title">{{ copy.finishedTitle }}</h1>
        <p class="ad-sub ad-finished__body">{{ fill(copy.finishedBody) }}</p>
      </div>

      <p class="ad-note">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h2.2l1.2-2h3.2l1.2 2H17a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Z" /><circle cx="12" cy="13.5" r="3.5" /></svg>
        <i></i>ROLL COMPLETE
      </p>
    </div>
  </main>
</template>

<style>
/* The night's photo, blurred and dimmed: the real ones stay a surprise. */
.ad-finished__photo {
  filter: blur(14px) brightness(0.55) saturate(1.2);
  transform: scale(1.1);
}

.ad-finished__shade {
  background: radial-gradient(120% 70% at 50% 45%, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.85) 75%);
}

.ad-finished__middle {
  margin: auto 0;
}

.ad-finished__count {
  margin: 0 0 6px;
  color: var(--ad-glow);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-shadow: 0 0 12px color-mix(in srgb, var(--ad-glow) 80%, transparent);
}

.ad-finished__title {
  font-size: clamp(54px, 18vw, 72px);
}

.ad-finished__body {
  max-width: 300px;
  margin: 14px auto 0;
  font-size: 14px;
}

.ad-finished__spark--a {
  top: 30%;
  right: 40px;
  width: 22px;
  height: 22px;
}

.ad-finished__spark--b {
  top: 60%;
  left: 36px;
  width: 14px;
  height: 14px;
  animation-delay: 1.4s;
}
</style>
