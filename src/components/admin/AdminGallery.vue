<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

const props = defineProps({
  photos: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['back'])

const columns = ref(3)
const selectedGuest = ref('all')
const downloading = ref(false)
const error = ref('')
const selectedPhotos = ref([])
const activePhotoIndex = ref(null)
const touchStartX = ref(0)

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${columns.value}, minmax(0, 1fr))`,
}))

const guestNames = computed(() => {
  return [
    ...new Set(
      props.photos
        .map((photo) => photo.guest_name?.trim())
        .filter(Boolean),
    ),
  ].sort((first, second) => {
    return first.localeCompare(second)
  })
})

const filteredPhotos = computed(() => {
  if (selectedGuest.value === 'all') {
    return props.photos
  }

  return props.photos.filter((photo) => {
    return photo.guest_name === selectedGuest.value
  })
})

const activePhoto = computed(() => {
  if (activePhotoIndex.value === null) {
    return null
  }

  return (
    filteredPhotos.value[activePhotoIndex.value] ||
    null
  )
})

const canGoPrevPhoto = computed(() => {
  return (
    activePhotoIndex.value !== null &&
    activePhotoIndex.value > 0
  )
})

const canGoNextPhoto = computed(() => {
  return (
    activePhotoIndex.value !== null &&
    activePhotoIndex.value <
      filteredPhotos.value.length - 1
  )
})

watch(
  () => props.photos,
  (newPhotos) => {
    const availableIds = new Set(
      newPhotos.map((photo) => photo.id),
    )

    selectedPhotos.value =
      selectedPhotos.value.filter((id) => {
        return availableIds.has(id)
      })

    if (
      activePhotoIndex.value !== null &&
      activePhotoIndex.value >=
        filteredPhotos.value.length
    ) {
      activePhotoIndex.value = null
    }

    if (
      selectedGuest.value !== 'all' &&
      !guestNames.value.includes(
        selectedGuest.value,
      )
    ) {
      selectedGuest.value = 'all'
    }
  },
)

watch(selectedGuest, () => {
  activePhotoIndex.value = null
})

function getGuestPhotoCount(guestName) {
  return props.photos.filter((photo) => {
    return photo.guest_name === guestName
  }).length
}

function openPhoto(photo) {
  const index = filteredPhotos.value.findIndex(
    (item) => item.id === photo.id,
  )

  activePhotoIndex.value =
    index >= 0 ? index : null
}

function closePhoto() {
  activePhotoIndex.value = null
}

function goToNextPhoto() {
  if (canGoNextPhoto.value) {
    activePhotoIndex.value += 1
  }
}

function goToPrevPhoto() {
  if (canGoPrevPhoto.value) {
    activePhotoIndex.value -= 1
  }
}

function onPagerTouchStart(event) {
  touchStartX.value =
    event.touches[0]?.clientX ?? 0
}

function onPagerTouchEnd(event) {
  const endX =
    event.changedTouches[0]?.clientX ?? 0

  const deltaX =
    endX - touchStartX.value

  if (deltaX <= -50) {
    goToNextPhoto()
  } else if (deltaX >= 50) {
    goToPrevPhoto()
  }
}

function handlePagerKeydown(event) {
  if (!activePhoto.value) return

  if (event.key === 'Escape') {
    closePhoto()
  }

  if (event.key === 'ArrowRight') {
    goToNextPhoto()
  }

  if (event.key === 'ArrowLeft') {
    goToPrevPhoto()
  }
}

function isSelected(photoId) {
  return selectedPhotos.value.includes(photoId)
}

function togglePhotoSelection(photoId) {
  if (isSelected(photoId)) {
    selectedPhotos.value =
      selectedPhotos.value.filter((id) => {
        return id !== photoId
      })

    return
  }

  selectedPhotos.value = [
    ...selectedPhotos.value,
    photoId,
  ]
}

function getPhotoFilename(photo, index) {
  const uploaded = photo.uploaded_at
    ? new Date(photo.uploaded_at)
    : null

  const timestamp =
    uploaded &&
    !Number.isNaN(uploaded.getTime())
      ? uploaded
          .toISOString()
          .replace(/[:.]/g, '-')
      : `image-${index + 1}`

  return `paul-60-photo-${timestamp}.jpg`
}

async function downloadPhoto(photo, index) {
  const response = await fetch(photo.imageUrl)

  if (!response.ok) {
    throw new Error(
      `Failed to download photo ${index + 1}`,
    )
  }

  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)

  const link =
    document.createElement('a')

  link.href = blobUrl
  link.download = getPhotoFilename(
    photo,
    index,
  )

  document.body.appendChild(link)

  link.click()
  link.remove()

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl)
  }, 1000)
}

async function downloadPhotos(items) {
  if (
    items.length === 0 ||
    downloading.value
  ) {
    return
  }

  downloading.value = true
  error.value = ''

  try {
    for (
      let index = 0;
      index < items.length;
      index += 1
    ) {
      await downloadPhoto(
        items[index],
        index,
      )

      await new Promise((resolve) => {
        setTimeout(resolve, 200)
      })
    }
  } catch (err) {
    error.value =
      err.message ||
      'The photographs could not be downloaded.'
  } finally {
    downloading.value = false
  }
}

function downloadAll() {
  return downloadPhotos(
    filteredPhotos.value,
  )
}

function downloadSelected() {
  const selected = props.photos.filter(
    (photo) => {
      return isSelected(photo.id)
    },
  )

  return downloadPhotos(selected)
}

onMounted(() => {
  window.addEventListener(
    'keydown',
    handlePagerKeydown,
  )
})

onBeforeUnmount(() => {
  window.removeEventListener(
    'keydown',
    handlePagerKeydown,
  )
})
</script>

<template>
  <section class="gallery-screen">
    <header class="gallery-header">
      <button
        type="button"
        class="back-button"
        @click="emit('back')"
      >
        <span aria-hidden="true">‹</span>
        Dashboard
      </button>

      <p>Paul’s private gallery</p>

      <h2>
        Captured
        <span>moments</span>
      </h2>

      <small>
        {{ photos.length }}
        photographs developed
      </small>
    </header>

    <div class="gallery-controls">
      <label class="guest-filter">
        <span>Photographer</span>

        <div class="select-wrap">
          <select v-model="selectedGuest">
            <option value="all">
              All photographers
              ({{ photos.length }})
            </option>

            <option
              v-for="guestName in guestNames"
              :key="guestName"
              :value="guestName"
            >
              {{ guestName }}
              ({{ getGuestPhotoCount(guestName) }})
            </option>
          </select>

          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="m5 7 5 6 5-6" />
          </svg>
        </div>
      </label>

      <div class="column-control">
        <span>Frame size</span>

        <div
          class="column-options"
          aria-label="Gallery columns"
        >
          <button
            v-for="count in 4"
            :key="count"
            type="button"
            :class="{
              active: columns === count,
            }"
            :aria-label="`Show ${count} column${count === 1 ? '' : 's'}`"
            :aria-pressed="columns === count"
            @click="columns = count"
          >
            {{ count }}
          </button>
        </div>
      </div>

      <div class="download-actions">
        <button
          type="button"
          :disabled="
            filteredPhotos.length === 0 ||
            downloading
          "
          @click="downloadAll"
        >
          {{
            downloading
              ? 'Preparing…'
              : selectedGuest === 'all'
                ? 'Download all'
                : 'Download filtered'
          }}
        </button>

        <button
          type="button"
          :disabled="
            selectedPhotos.length === 0 ||
            downloading
          "
          @click="downloadSelected"
        >
          Selected
          ({{ selectedPhotos.length }})
        </button>
      </div>

      <p
        v-if="error"
        class="gallery-error"
        role="alert"
      >
        {{ error }}
      </p>
    </div>

    <div
      v-if="filteredPhotos.length === 0"
      class="empty-roll"
    >
      <strong>No photographs yet</strong>

      <p>
        {{
          photos.length === 0
            ? 'The gallery will fill as guests use their cameras.'
            : 'There are no photographs from this guest.'
        }}
      </p>
    </div>

    <div
      v-else
      class="photo-grid"
      :style="gridStyle"
    >
      <article
        v-for="(
          photo,
          index
        ) in filteredPhotos"
        :key="photo.id"
        class="photo-frame"
        :class="{
          selected: isSelected(photo.id),
        }"
      >
        <button
          type="button"
          class="photo-button"
          :aria-label="`Open photograph ${index + 1}`"
          @click="openPhoto(photo)"
        >
          <img
            :src="
              photo.thumbnailUrl ||
              photo.imageUrl
            "
            :alt="`Paul’s birthday photograph ${index + 1}`"
            loading="lazy"
          />
        </button>

        <label class="select-photo">
          <input
            type="checkbox"
            :checked="isSelected(photo.id)"
            @change="
              togglePhotoSelection(photo.id)
            "
          />

          <span aria-hidden="true">
            <svg viewBox="0 0 20 20">
              <path d="m4 10 4 4 8-9" />
            </svg>
          </span>

          <b class="sr-only">
            {{
              isSelected(photo.id)
                ? 'Remove from selection'
                : 'Select photograph'
            }}
          </b>
        </label>

        <span class="frame-number">
          {{
            String(index + 1).padStart(
              2,
              '0',
            )
          }}
        </span>

        <span class="guest-watermark">
          {{
            photo.guest_name ||
            'Unknown guest'
          }}
        </span>
      </article>
    </div>

    <Teleport to="body">
      <div
        v-if="activePhoto"
        class="photo-viewer"
        role="dialog"
        aria-modal="true"
        aria-label="Photograph viewer"
        @touchstart="onPagerTouchStart"
        @touchend="onPagerTouchEnd"
      >
        <div class="viewer-toolbar">
          <button
            type="button"
            class="viewer-select"
            :class="{
              selected: isSelected(
                activePhoto.id,
              ),
            }"
            @click="
              togglePhotoSelection(
                activePhoto.id,
              )
            "
          >
            {{
              isSelected(activePhoto.id)
                ? 'Selected'
                : 'Select'
            }}
          </button>

          <span>
            {{ activePhotoIndex + 1 }}
            /
            {{ filteredPhotos.length }}
          </span>

          <button
            type="button"
            class="viewer-close"
            aria-label="Close photograph"
            @click="closePhoto"
          >
            ×
          </button>
        </div>

        <div
          class="viewer-stage"
          @click.self="closePhoto"
        >
            <button
                v-if="canGoPrevPhoto"
                type="button"
                class="viewer-arrow viewer-arrow--left"
                aria-label="Previous photograph"
                @click.stop="goToPrevPhoto"
                >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m15 18-6-6 6-6" />
                </svg>
            </button>

          <div class="viewer-photo">
            <img
              :src="activePhoto.imageUrl"
              alt="Large birthday photograph"
            />

            <span class="viewer-guest-badge">
              <small>Photographed by</small>

              <strong>
                {{
                  activePhoto.guest_name ||
                  'Unknown guest'
                }}
              </strong>
            </span>
          </div>

          <button
            v-if="canGoNextPhoto"
            type="button"
            class="viewer-arrow viewer-arrow--right"
            aria-label="Next photograph"
            @click.stop="goToNextPhoto"
            >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 6 6 6-6 6" />
            </svg>
        </button>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped lang="scss">
.gallery-screen {
  display: flex;
  min-height: 0;
  padding: 1.2rem 0 2rem;
  flex: 1;
  flex-direction: column;
}

.gallery-header {
  text-align: center;

  > p {
    margin: 1.2rem 0 0.35rem;
    color: var(--gold);
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0;
    color: var(--cream);
    font-family:
      Georgia,
      'Times New Roman',
      serif;
    font-size: clamp(
      2.1rem,
      11vw,
      3.2rem
    );
    font-weight: 400;
    line-height: 0.88;
    text-transform: uppercase;

    span {
      display: block;
      color: var(--gold);
    }
  }

  small {
    display: block;
    margin-top: 0.7rem;
    color: var(--muted);
    font-size: 0.62rem;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }
}

.back-button {
  display: inline-flex;
  padding: 0.55rem 0.8rem;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid
    rgba(199, 161, 90, 0.55);
  border-radius: 0;
  background: rgba(0, 0, 0, 0.3);
  color: var(--gold);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;

  span {
    font-family: Georgia, serif;
    font-size: 1.2rem;
    line-height: 0;
  }
}

.gallery-controls {
  margin-top: 1.2rem;
  padding: 0.8rem;
  border: 1px solid
    rgba(199, 161, 90, 0.5);
  background: rgba(0, 0, 0, 0.28);
}

.guest-filter {
  display: block;
  margin-bottom: 0.8rem;

  > span {
    display: block;
    margin-bottom: 0.4rem;
    color: var(--muted);
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }
}

.select-wrap {
  position: relative;

  select {
    width: 100%;
    height: 2.8rem;
    appearance: none;
    border: 1px solid
      rgba(199, 161, 90, 0.55);
    border-radius: 0;
    outline: none;
    background: rgba(0, 0, 0, 0.36);
    padding: 0 2.8rem 0 0.9rem;
    color: var(--cream);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  select:focus {
    border-color: var(--gold);
    box-shadow:
      0 0 0 3px
      rgba(199, 161, 90, 0.12);
  }

  svg {
    position: absolute;
    top: 50%;
    right: 0.9rem;
    width: 1rem;
    fill: none;
    stroke: var(--gold);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
    pointer-events: none;
    transform: translateY(-50%);
  }
}

.column-control {
  display: flex;
  align-items: center;
  justify-content: space-between;

  > span {
    color: var(--muted);
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }
}

.column-options {
  display: flex;
  gap: 0.35rem;

  button {
    display: grid;
    width: 2rem;
    height: 2rem;
    padding: 0;
    place-items: center;
    border: 1px solid
      rgba(199, 161, 90, 0.38);
    border-radius: 0;
    background: transparent;
    color: var(--muted);
    font-size: 0.66rem;
    font-weight: 800;

    &.active {
      border-color: var(--gold);
      background: var(--gold);
      color: #141008;
    }
  }
}

.download-actions {
  display: grid;
  margin-top: 0.75rem;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;

  button {
    min-height: 2.6rem;
    padding: 0.4rem;
    border: 1px solid var(--gold);
    border-radius: 0;
    background: transparent;
    color: var(--gold);
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;

    &:first-child {
      background: var(--gold);
      color: #151108;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.35;
    }
  }
}

.gallery-error {
  margin: 0.7rem 0 0;
  color: #e7a497;
  font-size: 0.68rem;
  text-align: center;
}

.empty-roll {
  display: grid;
  min-height: 16rem;
  margin-top: 1rem;
  padding: 2rem;
  place-content: center;
  border: 1px solid
    rgba(199, 161, 90, 0.45);
  background:
    repeating-linear-gradient(
      125deg,
      #11110e 0 3px,
      #0d0d0b 3px 6px
    );
  text-align: center;

  strong {
    color: var(--cream);
    font-family: Georgia, serif;
    font-size: 1.5rem;
    font-weight: 400;
  }

  p {
    margin: 0.5rem 0 0;
    color: var(--muted);
    font-size: 0.75rem;
  }
}

.photo-grid {
  display: grid;
  margin-top: 0.8rem;
  gap: 0.45rem;
}

.photo-frame {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid
    rgba(199, 161, 90, 0.5);
  background: #080806;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;

  &.selected {
    border-color: var(--gold);
    box-shadow:
      inset 0 0 0 2px var(--gold);
  }
}

.photo-button {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: #090907;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.select-photo {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  cursor: pointer;

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }

  span {
    display: grid;
    width: 1.55rem;
    height: 1.55rem;
    place-items: center;
    border: 1px solid
      rgba(234, 223, 201, 0.8);
    background: rgba(0, 0, 0, 0.72);
    color: transparent;

    svg {
      width: 0.9rem;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2.4;
    }
  }

  input:checked + span {
    border-color: var(--gold);
    background: var(--gold);
    color: #141008;
  }
}

.frame-number {
  position: absolute;
  right: 0.35rem;
  bottom: 0.25rem;
  padding: 0.15rem 0.25rem;
  background: rgba(0, 0, 0, 0.7);
  color: var(--gold);
  font-size: 0.48rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.guest-watermark {
  position: absolute;
  left: 0.35rem;
  bottom: 0.25rem;
  max-width: calc(100% - 2.8rem);
  overflow: hidden;
  padding: 0.16rem 0.3rem;
  background: rgba(0, 0, 0, 0.72);
  color: var(--cream);
  font-size: 0.46rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-viewer {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(
      circle at 50% 45%,
      rgba(199, 161, 90, 0.12),
      transparent 45%
    ),
    rgba(5, 5, 4, 0.98);
  color: #eadfc9;
}

.viewer-toolbar {
  display: grid;
  padding:
    max(
      0.8rem,
      env(safe-area-inset-top)
    )
    1rem
    0.8rem;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  color: #a99b84;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.viewer-select,
.viewer-close,
.viewer-arrow {
  border: 1px solid
    rgba(199, 161, 90, 0.55);
  border-radius: 0;
  background: rgba(0, 0, 0, 0.48);
  color: #c7a15a;
}

.viewer-select {
  width: fit-content;
  padding: 0.5rem 0.7rem;
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;

  &.selected {
    background: #c7a15a;
    color: #141008;
  }
}

.viewer-close {
  width: 2.3rem;
  height: 2.3rem;
  padding: 0;
  justify-self: end;
  font-family: Georgia, serif;
  font-size: 1.6rem;
  line-height: 1;
}

.viewer-stage {
  position: relative;
  display: flex;
  min-height: 0;
  padding:
    0.5rem
    1rem
    max(
      1rem,
      env(safe-area-inset-bottom)
    );
  flex: 1;
  align-items: center;
  justify-content: center;
}

.viewer-photo {
  position: relative;
  display: flex;
  max-width: 100%;
  max-height: 100%;
  align-items: center;
  justify-content: center;

  img {
    display: block;
    max-width: 100%;
    max-height: calc(100svh - 6rem);
    border: 1px solid
      rgba(199, 161, 90, 0.5);
    object-fit: contain;
  }
}

.viewer-guest-badge {
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  display: flex;
  min-width: 8rem;
  max-width: calc(100% - 1.5rem);
  padding: 0.45rem 0.8rem;
  border: 1px solid
    rgba(199, 161, 90, 0.7);
  align-items: center;
  flex-direction: column;
  background: rgba(7, 7, 5, 0.84);
  box-shadow:
    0 0.5rem 1.5rem
    rgba(0, 0, 0, 0.45);
  color: #eadfc9;
  backdrop-filter: blur(5px);
  transform: translateX(-50%);

  small {
    color: #c7a15a;
    font-size: 0.42rem;
    font-weight: 800;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  strong {
    max-width: 14rem;
    margin-top: 0.15rem;
    overflow: hidden;
    font-family:
      Georgia,
      'Times New Roman',
      serif;
    font-size: 0.85rem;
    font-weight: 400;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.viewer-arrow {
  position: fixed;
  z-index: 2;
  top: 50%;
  display: flex;
  width: 2.8rem;
  height: 2.8rem;
  padding: 0;
  border: 1px solid rgba(199, 161, 90, 0.65);
  border-radius: 0;
  align-items: center;
  justify-content: center;
  background: rgba(7, 7, 5, 0.72);
  color: #c7a15a;
  backdrop-filter: blur(5px);
  transform: translateY(-50%);

  svg {
    display: block;
    width: 1.35rem;
    height: 1.35rem;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }

  &--left {
    left: max(1rem, env(safe-area-inset-left));
  }

  &--right {
    right: max(1rem, env(safe-area-inset-right));
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

@media (max-width: 370px) {
  .download-actions {
    grid-template-columns: 1fr;
  }
}
</style>