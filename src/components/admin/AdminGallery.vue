<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { API_BASE_URL } from '@/utils/api.js'
import { eventConfig } from '@/config/event.js'

const props = defineProps({ photos: { type: Array, default: () => [] } })
const selectedIds = ref([])
const activeIndex = ref(null)
const sortOrder = ref('newest')
const error = ref('')
const selectionMode = ref(false)
const touchStartX = ref(null)
const downloading = ref(false)

const themeStyle = computed(() => ({
  '--event-accent': eventConfig.palette?.accent || '#d97188',
  '--event-line': eventConfig.palette?.line || '#432820',
  '--event-surface': eventConfig.palette?.surface || '#fff8ef',
}))

const sortedPhotos = computed(() => {
  const copy = [...props.photos]
  return copy.sort((a, b) => {
    const diff = new Date(b.uploaded_at) - new Date(a.uploaded_at)
    return sortOrder.value === 'newest' ? diff : -diff
  })
})

const activePhoto = computed(() =>
  activeIndex.value === null ? null : sortedPhotos.value[activeIndex.value] || null,
)

const allSelected = computed(
  () => sortedPhotos.value.length > 0 && selectedIds.value.length === sortedPhotos.value.length,
)

function isSelected(id) {
  return selectedIds.value.includes(id)
}

function toggle(id) {
  selectedIds.value = isSelected(id)
    ? selectedIds.value.filter((value) => value !== id)
    : [...selectedIds.value, id]
}

function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) selectedIds.value = []
}

function toggleAll() {
  selectedIds.value = allSelected.value ? [] : sortedPhotos.value.map((photo) => photo.id)
}

function handlePhotoClick(photo) {
  if (selectionMode.value) {
    toggle(photo.id)
    return
  }

  open(photo)
}

function open(photo) {
  activeIndex.value = sortedPhotos.value.findIndex((item) => item.id === photo.id)
}

function close() {
  activeIndex.value = null
}

function next() {
  if (activeIndex.value !== null && activeIndex.value < sortedPhotos.value.length - 1) {
    activeIndex.value += 1
  }
}

function prev() {
  if (activeIndex.value !== null && activeIndex.value > 0) {
    activeIndex.value -= 1
  }
}

function onKey(event) {
  if (!activePhoto.value) return
  if (event.key === 'Escape') close()
  if (event.key === 'ArrowRight') next()
  if (event.key === 'ArrowLeft') prev()
}

function onTouchStart(event) {
  touchStartX.value = event.changedTouches?.[0]?.clientX ?? null
}

function onTouchEnd(event) {
  if (touchStartX.value === null) return

  const endX = event.changedTouches?.[0]?.clientX
  if (typeof endX !== 'number') return

  const distance = endX - touchStartX.value
  touchStartX.value = null

  if (Math.abs(distance) < 45) return
  if (distance < 0) next()
  else prev()
}

async function downloadSelected() {
  if (!selectedIds.value.length || downloading.value) return

  error.value = ''
  downloading.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/download-zip`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds.value }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Could not prepare download.')
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sophies-last-rodeo-photos.zip'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  } catch (err) {
    error.value = err?.message || 'Download failed.'
  } finally {
    downloading.value = false
  }
}

async function downloadOriginal(photo) {
  error.value = ''
  const response = await fetch(
    `${API_BASE_URL}/api/admin/image?id=${encodeURIComponent(photo.id)}&variant=original`,
    { credentials: 'include' },
  )

  if (!response.ok) {
    error.value = 'Download failed.'
    return
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${photo.id}.jpg`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <section class="gallery" :style="themeStyle">
    <div class="gallery-inner">
      <header class="gallery-header">
        <div class="gallery-heading">
          <p class="gallery-kicker">Sophie’s Last Rodeo</p>
          <h2>Gallery</h2>
          <p>{{ photos.length }} photographs</p>
        </div>

        <div class="gallery-actions">
          <button
            class="select-mode-button"
            :class="{ active: selectionMode }"
            type="button"
            @click="toggleSelectionMode"
          >
            {{ selectionMode ? 'Done selecting' : 'Select photos for download' }}
          </button>

        </div>
      </header>

      <div class="controls" :class="{ 'controls--selecting': selectionMode }">
        <select v-model="sortOrder" aria-label="Sort gallery">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>

        <div v-if="selectionMode" class="selection-controls">
          <strong>{{ selectedIds.length }} selected</strong>

          <button
            class="select-all-button"
            :class="{ active: allSelected }"
            type="button"
            @click="toggleAll"
          >
            {{ allSelected ? 'Clear all' : 'Select all' }}
          </button>

          <button
            class="download-selected-button"
            type="button"
            :disabled="selectedIds.length === 0 || downloading"
            @click="downloadSelected"
          >
            {{ downloading ? 'Preparing ZIP…' : `Download ${selectedIds.length || ''}`.trim() }}
          </button>

          <button
            v-if="selectedIds.length && !allSelected"
            class="clear-button"
            type="button"
            @click="selectedIds = []"
          >
            Clear
          </button>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="grid">
        <article
          v-for="photo in sortedPhotos"
          :key="photo.id"
          :class="{ selected: isSelected(photo.id), selecting: selectionMode }"
        >
          <button
            type="button"
            class="image-button"
            :aria-label="selectionMode ? (isSelected(photo.id) ? 'Deselect photo' : 'Select photo') : 'Open photo'"
            @click="handlePhotoClick(photo)"
          >
            <img
              :src="photo.thumbnailUrl || photo.imageUrl"
              alt=""
              loading="lazy"
            />

            <span
              v-if="selectionMode"
              class="selection-indicator"
              :class="{ active: isSelected(photo.id) }"
              aria-hidden="true"
            >
              {{ isSelected(photo.id) ? '✓' : '' }}
            </span>
          </button>
        </article>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="activePhoto"
        class="viewer"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <div class="viewer-bar">
          <button type="button" @click="close">Close</button>

          <span>{{ activeIndex + 1 }} / {{ sortedPhotos.length }}</span>

          <button type="button" @click="downloadOriginal(activePhoto)">
            Download
          </button>
        </div>

        <button
          type="button"
          class="arrow left"
          :disabled="activeIndex === 0"
          aria-label="Previous photo"
          @click="prev"
        >
          ‹
        </button>

        <img
          :key="activePhoto.id"
          class="viewer-photo"
          :src="activePhoto.imageUrl"
          alt=""
        />

        <button
          type="button"
          class="arrow right"
          :disabled="activeIndex === sortedPhotos.length - 1"
          aria-label="Next photo"
          @click="next"
        >
          ›
        </button>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.gallery {
  box-sizing: border-box;
  min-height: 100svh;
  padding: 32px 24px 64px;
  background: linear-gradient(180deg, rgba(255, 245, 242, 1) 0%, rgba(253, 198, 182, 1) 40%);
  color: #2a1e1c;
}

.gallery-inner {
  width: min(100%, 1320px);
  margin: 0 auto;
}

.gallery-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(67, 40, 32, .14);
}

.gallery-heading {
  display: grid;
  gap: 3px;
}

.gallery-heading h2,
.gallery-heading p {
  margin: 0;
}

.gallery-heading h2 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2rem, 4vw, 3.3rem);
  font-weight: 600;
  line-height: 1;
}

.gallery-heading > p:last-child {
  color: rgba(42, 30, 28, .58);
  font-size: .78rem;
}

.gallery-kicker {
  color: #d35372;
  font-size: .64rem;
  font-weight: 900;
  letter-spacing: .14em;
  text-transform: uppercase;
}

.gallery-actions,
.selection-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

button,
select {
  min-height: 42px;
  border: 1px solid rgba(67, 40, 32, .22);
  border-radius: 8px;
  background: rgba(255, 255, 255, .42);
  color: #2a1e1c;
  padding: 9px 14px;
  font: inherit;
  cursor: pointer;
  transition:
    border-color .16s ease,
    background .16s ease,
    color .16s ease,
    transform .16s ease,
    box-shadow .16s ease;
}

button:hover,
select:hover {
  border-color: rgba(211, 83, 114, .56);
}

button:focus-visible,
select:focus-visible {
  outline: 3px solid rgba(211, 83, 114, .24);
  outline-offset: 2px;
}

.select-mode-button {
  font-weight: 800;
}

.select-mode-button.active,
.select-all-button.active {
  border-color: #d35372;
  background: rgba(255, 255, 255, .75);
  color: #bf3558;
  box-shadow: 0 0 0 2px rgba(211, 83, 114, .12);
}

.download-selected-button {
  border-color: #d35372;
  background: #d94f73;
  color: #fff;
  font-weight: 850;
  box-shadow: 0 6px 16px rgba(211, 83, 114, .18);
}

.download-selected-button:hover:not(:disabled) {
  border-color: #bd3658;
  background: #c93f65;
  transform: translateY(-1px);
}

.download-selected-button:disabled {
  cursor: not-allowed;
  opacity: .42;
}

.clear-button {
  background: rgba(255, 255, 255, .28);
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.controls select {
  min-width: 150px;
}

.selection-controls strong {
  min-width: 86px;
  color: #a73854;
  font-size: .78rem;
  text-align: right;
}

.error {
  margin: 0 0 18px;
  color: #9e203d;
  font-size: .78rem;
  font-weight: 700;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
}

article {
  position: relative;
  min-width: 0;
  aspect-ratio: 1 / 1;
  border: 3px solid transparent;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, .45);
  box-shadow: 0 10px 30px rgba(84, 39, 39, .08);
  transition:
    border-color .16s ease,
    transform .16s ease,
    box-shadow .16s ease;
}

article:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 34px rgba(84, 39, 39, .13);
}

article.selected {
  border-color: #e94e7b;
  box-shadow:
    0 0 0 3px rgba(233, 78, 123, .16),
    0 14px 34px rgba(84, 39, 39, .13);
}

.image-button {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 0;
  border: 0;
  border-radius: 9px;
  overflow: hidden;
  background: transparent;
}

.image-button:hover {
  border-color: transparent;
}

.image-button img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .22s ease;
}

article:not(.selecting):hover .image-button img {
  transform: scale(1.025);
}

.selection-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 2px solid rgba(255, 255, 255, .95);
  border-radius: 999px;
  background: rgba(42, 30, 28, .38);
  color: #fff;
  font-size: 1rem;
  font-weight: 900;
  box-shadow: 0 3px 12px rgba(42, 30, 28, .2);
}

.selection-indicator.active {
  border-color: #e94e7b;
  background: #e94e7b;
}

.viewer {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 72px;
  grid-template-rows: auto minmax(0, 1fr);
  align-items: center;
  background: rgba(26, 16, 15, .96);
  color: #fff;
  overscroll-behavior: contain;
  touch-action: pan-y;
}

.viewer-bar {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  min-height: 70px;
  padding: max(12px, env(safe-area-inset-top)) 20px 12px;
  background: rgba(21, 13, 12, .72);
  backdrop-filter: blur(16px);
}

.viewer-bar button {
  width: max-content;
  border-color: rgba(255, 255, 255, .2);
  background: rgba(255, 255, 255, .08);
  color: #fff;
}

.viewer-bar button:last-child {
  justify-self: end;
}

.viewer-bar span {
  font-size: .78rem;
  font-weight: 800;
  letter-spacing: .04em;
}

.viewer-photo {
  grid-column: 2;
  grid-row: 2;
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: calc(100svh - 100px);
  margin: auto;
  border-radius: 10px;
  object-fit: contain;
  animation: viewer-photo-in .18s ease;
  user-select: none;
  -webkit-user-drag: none;
}

@keyframes viewer-photo-in {
  from {
    transform: translateX(10px);
    opacity: .55;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.arrow {
  grid-row: 2;
  align-self: stretch;
  min-height: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #fff;
  font-size: 3rem;
}

.arrow.left {
  grid-column: 1;
}

.arrow.right {
  grid-column: 3;
}

.arrow:disabled {
  cursor: default;
  opacity: .18;
}

@media (max-width: 767px) {
  .gallery {
    padding: 22px 12px 40px;
  }

  .gallery-header {
    align-items: stretch;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 16px;
    padding-bottom: 16px;
  }

  .gallery-heading {
    text-align: center;
  }

  .gallery-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .controls {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .controls select {
    width: 100%;
  }

  .selection-controls {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
  }

  .selection-controls strong {
    align-self: center;
    min-width: 0;
    text-align: left;
  }

  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  article {
    border-width: 2px;
    border-radius: 9px;
  }

  .image-button {
    border-radius: 7px;
  }

  .viewer {
    grid-template-columns: 48px minmax(0, 1fr) 48px;
  }

  .viewer-bar {
    min-height: 62px;
    padding-right: 10px;
    padding-left: 10px;
  }

  .viewer-bar button {
    min-height: 38px;
    padding: 8px 10px;
    font-size: .72rem;
  }

  .viewer-photo {
    max-height: calc(100svh - 84px);
    border-radius: 7px;
  }

  .arrow {
    font-size: 2.4rem;
  }
}

@media (max-width: 420px) {
  .gallery-actions {
    grid-template-columns: 1fr;
  }

  .selection-controls {
    grid-template-columns: 1fr 1fr;
  }

  .selection-controls strong {
    grid-column: 1 / -1;
  }

  .download-selected-button {
    grid-column: 1 / -1;
  }
}
</style>
