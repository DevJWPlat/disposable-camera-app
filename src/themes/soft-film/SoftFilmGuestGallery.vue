<script setup>
import { computed } from 'vue'
import { useSoftFilm } from './useSoftFilm.js'
import { useGuestGallery } from '@/composables/useGuestGallery.js'
import SoftFilmGallery from './SoftFilmGallery.vue'
import './soft-film-organiser.css'

const { event, vars, dateLabel } = useSoftFilm()
const { token, loading, error, photos } = useGuestGallery()
const zipBody = computed(() => ({ token: token.value }))
</script>

<template>
  <main class="sf sf-org" :style="vars">
    <div class="sf-inner sf-org__signed-in">
      <div class="sf-org__centre">
        <p class="sf-date">{{ dateLabel }}</p>
        <h1 class="sf-names">{{ event.title }}</h1>
        <h2 class="sf-rule">THE PHOTOS</h2>
        <p v-if="!loading && !error" class="sf-copy">{{ photos.length }} moments from your favourite people.</p>
      </div>

      <div class="sf-guest__body">
        <p v-if="loading" class="sf-loading">Loading…</p>
        <div v-else-if="error" class="sf-empty">
          <strong>Gallery unavailable</strong>
          <p class="sf-small">{{ error }}</p>
        </div>
        <SoftFilmGallery v-else :photos="photos" zip-path="/api/gallery/share/download-zip" :zip-body="zipBody" />
      </div>
    </div>
  </main>
</template>

<style>
.sf-guest__body {
  margin-top: 22px;
}
</style>
