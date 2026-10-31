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
  <section class="ce-gallery">
    <div v-if="!sortedPhotos.length" class="ce-empty">
      <strong>No photos yet</strong>
      <p class="ce-small">They’ll appear here as soon as guests start taking them.</p>
    </div>

    <template v-else>
      <div class="ce-gallery__tools">
        <select v-model="sortOrder" class="ce-select" aria-label="Sort photos">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <button type="button" class="ce-pill" :class="{ 'ce-pill--on': selectionMode }" @click="toggleMode">
          {{ selectionMode ? 'Done' : 'Select to download' }}
        </button>
      </div>

      <div v-if="selectionMode" class="ce-selection">
        <span>{{ selectedIds.length }} selected</span>
        <div class="ce-selection__actions">
          <button type="button" @click="allSelected ? clearSelection() : toggleAll()">{{ allSelected ? 'Clear' : 'All' }}</button>
          <button type="button" class="ce-selection__download" :disabled="!selectedIds.length || downloading" @click="downloadSelected">
            {{ downloading ? 'Preparing…' : 'Download' }}
          </button>
        </div>
      </div>

      <p v-if="error" class="ce-error">{{ error }}</p>

      <div class="ce-grid">
        <button
          v-for="photo in sortedPhotos"
          :key="photo.id"
          type="button"
          class="ce-thumb"
          :class="{ 'ce-thumb--selected': isSelected(photo.id) }"
          :aria-label="selectionMode ? 'Select photo' : 'Open photo'"
          @click="clickPhoto(photo)"
        >
          <img :src="photo.thumbnailUrl || photo.imageUrl" alt="" loading="lazy" />
          <span v-if="selectionMode" class="ce-thumb__tick">{{ isSelected(photo.id) ? '✓' : '' }}</span>
        </button>
      </div>
    </template>

    <Teleport to="body">
      <div v-if="activePhoto" class="ce-viewer" role="dialog" aria-modal="true" @touchstart.passive="touchStart" @touchend.passive="touchEnd">
        <div class="ce-viewer__bar">
          <button type="button" @click="close">Close</button>
          <span>{{ activeIndex + 1 }} / {{ sortedPhotos.length }}</span>
          <button type="button" @click="downloadOne(activePhoto)">Download</button>
        </div>
        <div class="ce-viewer__stage">
          <img class="ce-viewer__photo" :src="activePhoto.imageUrl" alt="" />
          <button type="button" class="ce-viewer__arrow ce-viewer__arrow--prev" :disabled="activeIndex === 0" aria-label="Previous photo" @click="prev">‹</button>
          <button type="button" class="ce-viewer__arrow ce-viewer__arrow--next" :disabled="activeIndex === sortedPhotos.length - 1" aria-label="Next photo" @click="next">›</button>
        </div>
      </div>
    </Teleport>
  </section>
</template>
