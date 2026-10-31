<script setup>
import { computed } from 'vue'
import { useAfterDark } from './useAfterDark.js'
import { useGuestGallery } from '@/composables/useGuestGallery.js'
import AfterDarkGallery from './AfterDarkGallery.vue'
import './after-dark-organiser.css'

const { event, vars, dateLabel } = useAfterDark()
const { token, loading, error, photos } = useGuestGallery()
const zipBody = computed(() => ({ token: token.value }))
</script>

<template>
  <main class="ad ad-org" :style="vars">
    <div class="ad-inner ad-org__signed-in">
      <div class="ad-org__centre">
        <h1 class="ad-title ad-org__title">{{ event.title }}</h1>
        <p class="ad-date">{{ dateLabel }}</p>
        <h2 class="ad-rule">THE PHOTOS</h2>
        <p v-if="!loading && !error" class="ad-sub">{{ photos.length }} moments from your favourite people.</p>
      </div>

      <div class="ad-guest__body">
        <p v-if="loading" class="ad-loading">Loading…</p>
        <div v-else-if="error" class="ad-empty">
          <strong>Gallery unavailable</strong>
          <p class="ad-small">{{ error }}</p>
        </div>
        <AfterDarkGallery v-else :photos="photos" zip-path="/api/gallery/share/download-zip" :zip-body="zipBody" />
      </div>
    </div>
  </main>
</template>

<style>
.ad-guest__body {
  margin-top: 22px;
}
</style>
