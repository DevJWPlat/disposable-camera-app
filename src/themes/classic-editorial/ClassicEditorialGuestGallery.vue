<script setup>
import { computed } from 'vue'
import { useClassicEditorial } from './useClassicEditorial.js'
import { useGuestGallery } from '@/composables/useGuestGallery.js'
import ClassicEditorialGallery from './ClassicEditorialGallery.vue'
import './classic-editorial-organiser.css'

const { event, vars, dateLabel } = useClassicEditorial()
const { token, loading, error, photos } = useGuestGallery()
const zipBody = computed(() => ({ token: token.value }))
</script>

<template>
  <main class="ce ce-org" :style="vars">
    <div class="ce-inner ce-org__signed-in">
      <div class="ce-org__centre">
        <h1 class="ce-names ce-org__title">{{ event.title }}</h1>
        <p class="ce-date ce-org__date">{{ dateLabel }}</p>
        <h2 class="ce-org__rule">THE PHOTOS</h2>
        <p v-if="!loading && !error" class="ce-body">{{ photos.length }} moments from your favourite people.</p>
      </div>

      <div class="ce-guest__body">
        <p v-if="loading" class="ce-loading">Loading…</p>
        <div v-else-if="error" class="ce-empty">
          <strong>Gallery unavailable</strong>
          <p class="ce-small">{{ error }}</p>
        </div>
        <ClassicEditorialGallery v-else :photos="photos" zip-path="/api/gallery/share/download-zip" :zip-body="zipBody" />
      </div>
    </div>
  </main>
</template>

<style>
.ce-guest__body {
  margin-top: 22px;
}
</style>
