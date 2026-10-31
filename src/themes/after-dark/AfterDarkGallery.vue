<script setup>
import { toRef } from 'vue'
import { usePhotoGallery } from '@/composables/usePhotoGallery.js'

// Shared by the organiser gallery and the guest gallery.
const props = defineProps({
  photos: { type: Array, default: () => [] },
  zipPath: { type: String, required: true },
  zipBody: { type: Object, default: () => ({}) },
})

const {
  selectedIds, activeIndex, sortOrder, selectionMode, downloading, error, sortedPhotos, activePhoto,
  allSelected, isSelected, toggleMode, toggleAll, clearSelection, clickPhoto, close, next, prev,
  touchStart, touchEnd, downloadSelected, downloadOne,
} = usePhotoGallery(toRef(props, 'photos'), { zipPath: props.zipPath, zipBody: toRef(props, 'zipBody') })
</script>

<template>
  <section class="ad-gallery">
    <div v-if="!sortedPhotos.length" class="ad-empty">
      <strong>No photos yet</strong>
      <p class="ad-small">They’ll appear here as soon as guests start taking them.</p>
    </div>

    <template v-else>
      <div class="ad-gallery__tools">
        <select v-model="sortOrder" class="ad-select" aria-label="Sort photos">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <button type="button" class="ad-pill" :class="{ 'ad-pill--on': selectionMode }" @click="toggleMode">
          {{ selectionMode ? 'Done' : 'Select to download' }}
        </button>
      </div>

      <div v-if="selectionMode" class="ad-selection">
        <span>{{ selectedIds.length }} selected</span>
        <div class="ad-selection__actions">
          <button type="button" @click="allSelected ? clearSelection() : toggleAll()">{{ allSelected ? 'Clear' : 'All' }}</button>
          <button type="button" class="ad-selection__download" :disabled="!selectedIds.length || downloading" @click="downloadSelected">
            {{ downloading ? 'Preparing…' : 'Download' }}
          </button>
        </div>
      </div>

      <p v-if="error" class="ad-error">{{ error }}</p>

      <div class="ad-grid">
        <button
          v-for="photo in sortedPhotos"
          :key="photo.id"
          type="button"
          class="ad-thumb"
          :class="{ 'ad-thumb--selected': isSelected(photo.id) }"
          :aria-label="selectionMode ? 'Select photo' : 'Open photo'"
          @click="clickPhoto(photo)"
        >
          <img :src="photo.thumbnailUrl || photo.imageUrl" alt="" loading="lazy" />
          <span v-if="selectionMode" class="ad-thumb__tick">{{ isSelected(photo.id) ? '✓' : '' }}</span>
        </button>
      </div>
    </template>

    <Teleport to="body">
      <div v-if="activePhoto" class="ad-viewer" role="dialog" aria-modal="true" @touchstart.passive="touchStart" @touchend.passive="touchEnd">
        <div class="ad-viewer__bar">
          <button type="button" @click="close">Close</button>
          <span>{{ activeIndex + 1 }} / {{ sortedPhotos.length }}</span>
          <button type="button" @click="downloadOne(activePhoto)">Download</button>
        </div>
        <div class="ad-viewer__stage">
          <img class="ad-viewer__photo" :src="activePhoto.imageUrl" alt="" />
          <button type="button" class="ad-viewer__arrow ad-viewer__arrow--prev" :disabled="activeIndex === 0" aria-label="Previous photo" @click="prev">‹</button>
          <button type="button" class="ad-viewer__arrow ad-viewer__arrow--next" :disabled="activeIndex === sortedPhotos.length - 1" aria-label="Next photo" @click="next">›</button>
        </div>
      </div>
    </Teleport>
  </section>
</template>
