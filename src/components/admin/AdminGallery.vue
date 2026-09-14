<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { API_BASE_URL } from '@/utils/api.js'
import { eventConfig } from '@/config/event.js'

const props = defineProps({ photos: { type: Array, default: () => [] } })
const emit = defineEmits(['back', 'refresh'])
const selectedIds = ref([])
const activeIndex = ref(null)
const sortOrder = ref('newest')
const error = ref('')

const themeStyle = computed(() => ({
  '--event-accent': eventConfig.palette?.accent,
  '--event-line': eventConfig.palette?.line,
  '--event-surface': eventConfig.palette?.surface,
}))
const sortedPhotos = computed(() => {
  const copy = [...props.photos]
  return copy.sort((a,b) => {
    const diff = new Date(b.uploaded_at) - new Date(a.uploaded_at)
    return sortOrder.value === 'newest' ? diff : -diff
  })
})
const activePhoto = computed(() => activeIndex.value === null ? null : sortedPhotos.value[activeIndex.value] || null)

function isSelected(id) { return selectedIds.value.includes(id) }
function toggle(id) { selectedIds.value = isSelected(id) ? selectedIds.value.filter((value) => value !== id) : [...selectedIds.value,id] }
function open(photo) { activeIndex.value = sortedPhotos.value.findIndex((item) => item.id === photo.id) }
function close() { activeIndex.value = null }
function next() { if (activeIndex.value !== null && activeIndex.value < sortedPhotos.value.length - 1) activeIndex.value += 1 }
function prev() { if (activeIndex.value !== null && activeIndex.value > 0) activeIndex.value -= 1 }
function onKey(event) { if (!activePhoto.value) return; if (event.key === 'Escape') close(); if (event.key === 'ArrowRight') next(); if (event.key === 'ArrowLeft') prev() }
async function downloadOriginal(photo) {
  error.value = ''
  const response = await fetch(`${API_BASE_URL}/api/admin/image?id=${encodeURIComponent(photo.id)}&variant=original`, { credentials:'include' })
  if (!response.ok) { error.value = 'Download failed.'; return }
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
    <header>
      <button type="button" @click="emit('back')">← Dashboard</button>
      <div><h2>Gallery</h2><p>{{ photos.length }} photographs</p></div>
      <button type="button" @click="emit('refresh')">Refresh</button>
    </header>

    <div class="controls">
      <select v-model="sortOrder"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
      <span>{{ selectedIds.length }} selected</span>
      <button type="button" @click="selectedIds = []">Clear</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="grid">
      <article v-for="photo in sortedPhotos" :key="photo.id" :class="{ selected:isSelected(photo.id) }">
        <button type="button" class="image-button" @click="open(photo)"><img :src="photo.thumbnailUrl || photo.imageUrl" alt="" loading="lazy" /></button>
        <label><input type="checkbox" :checked="isSelected(photo.id)" @change="toggle(photo.id)" /> Select</label>
      </article>
    </div>

    <Teleport to="body">
      <div v-if="activePhoto" class="viewer">
        <div class="viewer-bar"><button type="button" @click="close">Close</button><span>{{ activeIndex + 1 }} / {{ sortedPhotos.length }}</span><button type="button" @click="downloadOriginal(activePhoto)">Download</button></div>
        <button type="button" class="arrow left" @click="prev">‹</button>
        <img :src="activePhoto.imageUrl" alt="" />
        <button type="button" class="arrow right" @click="next">›</button>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.gallery { padding:1rem 0 2rem; }
header,.controls { display:flex; align-items:center; justify-content:space-between; gap:.7rem; }
header { padding-bottom:1rem; border-bottom:1px solid rgba(255,255,255,.1); }
header h2,header p { margin:0; text-align:center; }
header h2 { font-family:Georgia,serif; font-size:1.5rem; font-weight:500; }
header p { margin-top:.15rem; color:rgba(255,255,255,.45); font-size:.58rem; }
button,select { min-height:2.5rem; border:1px solid rgba(255,255,255,.18); background:transparent; color:var(--event-surface,#fff); padding:.5rem .7rem; cursor:pointer; }
.controls { margin:1rem 0; color:rgba(255,255,255,.5); font-size:.64rem; }
.grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.65rem; }
article { position:relative; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.035); }
article.selected { outline:2px solid var(--event-accent,#c77f8c); outline-offset:2px; }
.image-button { display:block; width:100%; padding:0; border:0; aspect-ratio:3/4; }
.image-button img { width:100%; height:100%; object-fit:cover; }
article label { display:flex; gap:.4rem; padding:.55rem; color:rgba(255,255,255,.65); font-size:.68rem; }
.error { color:#ffaaa1; }
.viewer { position:fixed; z-index:100; inset:0; display:grid; place-items:center; background:rgba(0,0,0,.97); padding:max(4rem,env(safe-area-inset-top)) 3.5rem max(2rem,env(safe-area-inset-bottom)); }
.viewer img { max-width:100%; max-height:100%; object-fit:contain; }
.viewer-bar { position:absolute; top:max(.8rem,env(safe-area-inset-top)); left:1rem; right:1rem; display:flex; align-items:center; justify-content:space-between; color:white; }
.arrow { position:absolute; top:50%; font-size:2rem; }
.left { left:.5rem; } .right { right:.5rem; }
</style>
