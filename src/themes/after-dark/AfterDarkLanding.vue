<script setup>
import { useAfterDark } from './useAfterDark.js'

const { event, copy, vars, dateLabel, heroUrl, fill } = useAfterDark()
</script>

<template>
  <main class="ad ad-landing" :style="vars">
    <img v-if="heroUrl" class="ad-photo" :src="heroUrl" alt="" />
    <div class="ad-shade" aria-hidden="true"></div>
    <svg class="ad-spark ad-landing__spark--a" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" /></svg>
    <svg class="ad-spark ad-landing__spark--b" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" /></svg>

    <div class="ad-inner">
      <h1 class="ad-title">{{ event.title }}</h1>
      <p class="ad-date">{{ dateLabel }}</p>

      <div class="ad-landing__bottom">
        <p class="ad-tag">{{ fill(copy.tagline) }}</p>
        <p class="ad-sub">{{ fill(copy.intro) }}</p>
        <RouterLink class="ad-button" to="/camera">{{ copy.cta }} <span aria-hidden="true">→</span></RouterLink>
        <p class="ad-note">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h2.2l1.2-2h3.2l1.2 2H17a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Z" /><circle cx="12" cy="13.5" r="3.5" /></svg>
          <i></i>{{ event.maxShots }} PHOTOS PER GUEST
        </p>
      </div>
    </div>
  </main>
</template>

<style>
.ad-landing__bottom {
  width: 100%;
  margin-top: auto;
  padding-top: 40px;
}

.ad-landing__spark--a {
  top: 23%;
  right: 34px;
  width: 26px;
  height: 26px;
}

.ad-landing__spark--b {
  top: 30%;
  left: 30px;
  width: 16px;
  height: 16px;
  animation-delay: 1.2s;
}
</style>
