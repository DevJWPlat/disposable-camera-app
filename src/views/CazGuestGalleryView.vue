<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { API_BASE_URL } from '@/utils/api.js'

const route = useRoute()
const token = computed(() => String(route.params.token || ''))
const loading = ref(true)
const error = ref('')
const photos = ref([])
const activeIndex = ref(null)
const touchStartX = ref(null)
const sortOrder = ref('newest')
const selectionMode = ref(false)
const selectedIds = ref([])
const downloading = ref(false)

const sortedPhotos = computed(() => [...photos.value].sort((a, b) => {
  const diff = new Date(b.uploaded_at) - new Date(a.uploaded_at)
  return sortOrder.value === 'newest' ? diff : -diff
}))

const activePhoto = computed(() =>
  activeIndex.value === null ? null : sortedPhotos.value[activeIndex.value] || null,
)

const allSelected = computed(() =>
  sortedPhotos.value.length > 0 && selectedIds.value.length === sortedPhotos.value.length,
)

async function loadGallery() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`${API_BASE_URL}/api/gallery/share/${encodeURIComponent(token.value)}`)
    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'This gallery link is not available.')
    photos.value = data.photos || []
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function isSelected(id){ return selectedIds.value.includes(id) }
function toggle(id){ selectedIds.value = isSelected(id) ? selectedIds.value.filter(v => v !== id) : [...selectedIds.value, id] }
function toggleMode(){ selectionMode.value = !selectionMode.value; if(!selectionMode.value) selectedIds.value = [] }
function toggleAll(){ selectedIds.value = allSelected.value ? [] : sortedPhotos.value.map(photo => photo.id) }

function handlePhotoClick(photo){
  if(selectionMode.value){
    toggle(photo.id)
    return
  }
  activeIndex.value = sortedPhotos.value.findIndex(item => item.id === photo.id)
}

function close(){activeIndex.value=null}
function next(){if(activeIndex.value!==null&&activeIndex.value<sortedPhotos.value.length-1)activeIndex.value++}
function prev(){if(activeIndex.value!==null&&activeIndex.value>0)activeIndex.value--}
function onKey(event){if(!activePhoto.value)return;if(event.key==='Escape')close();if(event.key==='ArrowRight')next();if(event.key==='ArrowLeft')prev()}
function touchStart(event){touchStartX.value=event.changedTouches?.[0]?.clientX??null}
function touchEnd(event){const end=event.changedTouches?.[0]?.clientX;if(touchStartX.value===null||typeof end!=='number')return;const distance=end-touchStartX.value;touchStartX.value=null;if(Math.abs(distance)<45)return;distance<0?next():prev()}

async function downloadSelected(){
  if(!selectedIds.value.length || downloading.value) return
  downloading.value = true
  error.value = ''
  try{
    const response = await fetch(`${API_BASE_URL}/api/gallery/share/download-zip`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ token: token.value, ids: selectedIds.value }),
    })
    if(!response.ok){
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Could not prepare download.')
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'caz-and-dan-photos.zip'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }catch(err){
    error.value = err?.message || 'Download failed.'
  }finally{
    downloading.value = false
  }
}

async function downloadOriginal(photo){
  error.value = ''
  try{
    const response = await fetch(photo.imageUrl)
    if(!response.ok) throw new Error('Download failed.')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${photo.id}.jpg`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }catch(err){
    error.value = err?.message || 'Download failed.'
  }
}

onMounted(()=>{window.addEventListener('keydown',onKey);loadGallery()})
onBeforeUnmount(()=>window.removeEventListener('keydown',onKey))
</script>

<template>
  <main class="guest-gallery">
    <div class="inner">
      <header>
        <div class="heading">
          <p>CAZ &amp; DAN · 10.10.26</p>
          <h1>Photo gallery</h1>
          <span v-if="!loading && !error">{{ photos.length }} photographs from the day</span>
        </div>

        <button
          v-if="!loading && !error && photos.length"
          class="select-button"
          :class="{ active:selectionMode }"
          type="button"
          @click="toggleMode"
        >
          {{ selectionMode ? 'Done selecting' : 'Select photos for download' }}
        </button>
      </header>

      <div
        v-if="!loading && !error && photos.length"
        class="controls"
        :class="{ selecting:selectionMode }"
      >
        <div class="sort-select">
          <select v-model="sortOrder" aria-label="Sort gallery">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
        </div>

        <div v-if="selectionMode" class="selection">
          <strong>{{ selectedIds.length }} selected</strong>
          <div class="selection-actions">
            <button type="button" @click="toggleAll">{{ allSelected ? 'Clear all' : 'Select all' }}</button>
            <button type="button" :disabled="!selectedIds.length" @click="selectedIds=[]">Clear</button>
          </div>
          <button class="download" type="button" :disabled="!selectedIds.length || downloading" @click="downloadSelected">
            {{ downloading ? 'Preparing ZIP…' : `Download ${selectedIds.length || ''}`.trim() }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="state">Loading gallery…</div>
      <div v-else-if="error && !photos.length" class="state error"><strong>Gallery unavailable</strong><p>{{ error }}</p></div>
      <div v-else-if="!photos.length" class="state"><strong>No photographs yet</strong><p>Check back again soon.</p></div>

      <template v-else>
        <p v-if="error" class="inline-error">{{ error }}</p>

        <section class="grid" aria-label="Caz and Dan guest gallery">
          <article
            v-for="photo in sortedPhotos"
            :key="photo.id"
            :class="{ selected:isSelected(photo.id), selecting:selectionMode }"
          >
            <button type="button" @click="handlePhotoClick(photo)">
              <img :src="photo.thumbnailUrl || photo.imageUrl" alt="" loading="lazy" />
              <span v-if="selectionMode" class="tick" :class="{ on:isSelected(photo.id) }">
                {{ isSelected(photo.id) ? '✓' : '' }}
              </span>
            </button>
          </article>
        </section>
      </template>
    </div>

    <Teleport to="body">
      <div v-if="activePhoto" class="viewer" @touchstart.passive="touchStart" @touchend.passive="touchEnd">
        <div class="viewer-bar">
          <button type="button" @click="close">Close</button>
          <span>{{ activeIndex + 1 }} / {{ sortedPhotos.length }}</span>
          <button type="button" class="viewer-download" @click="downloadOriginal(activePhoto)">Download</button>
        </div>
        <button class="arrow left" type="button" :disabled="activeIndex===0" aria-label="Previous photo" @click="prev">‹</button>
        <img class="viewer-photo" :src="activePhoto.imageUrl" alt="" />
        <button class="arrow right" type="button" :disabled="activeIndex===sortedPhotos.length-1" aria-label="Next photo" @click="next">›</button>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css');
.guest-gallery{min-height:100svh;background:#f7f5ef;color:#111;padding:42px 22px 70px}
.inner{width:min(100%,1280px);margin:0 auto}
.inner>header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding-bottom:24px;border-bottom:1px solid #d8d5cd}
.heading p{margin:0 0 8px;font-size:10px;letter-spacing:.22em}
.heading h1{margin:0;font:400 clamp(42px,7vw,68px)/1 Georgia,serif}
.heading span{display:block;margin-top:10px;color:#77736c;font-size:12px}
button,select{min-height:44px;border:1px solid #cac7bf;border-radius:7px;background:#fff;color:#111;padding:9px 14px;font:inherit;cursor:pointer}
button:disabled{cursor:not-allowed;opacity:.4}
.select-button{font-weight:700}
.select-button.active{background:#111;color:#fff;border-color:#111}
.controls{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:22px;margin-bottom:22px}
.sort-select{position:relative;width:290px;max-width:100%}
.sort-select select{width:100%;appearance:none;-webkit-appearance:none;padding-right:46px}
.sort-select i{position:absolute;top:50%;right:16px;transform:translateY(-50%);pointer-events:none}
.selection{display:flex;align-items:center;gap:10px}
.selection strong{font-size:12px}
.selection-actions{display:flex;gap:10px}
.download{background:#111!important;color:#fff!important;border-color:#111!important}
.state{min-height:50vh;display:grid;place-content:center;justify-items:center;gap:8px;text-align:center;color:#716f69}
.state strong{color:#111;font:400 28px Georgia,serif}
.state p{margin:0;font-size:13px}
.state.error p{max-width:360px}
.inline-error{margin:0 0 16px;color:#983838;font-size:12px;font-weight:700}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
.grid article{position:relative;aspect-ratio:1;border:2px solid transparent;border-radius:10px;overflow:hidden;background:#fff;box-shadow:0 8px 22px rgba(0,0,0,.06)}
.grid article.selected{border-color:#111}
.grid article>button{position:relative;width:100%;height:100%;min-height:0;padding:0;border:0;border-radius:8px;overflow:hidden}
.grid img{display:block;width:100%;height:100%;object-fit:cover}
.tick{position:absolute;top:10px;right:10px;width:28px;height:28px;display:grid;place-items:center;border:2px solid #fff;border-radius:50%;background:rgba(0,0,0,.25);color:#fff;font-weight:800}
.tick.on{background:#111}
.viewer{position:fixed;z-index:9999;inset:0;display:grid;grid-template-columns:65px 1fr 65px;grid-template-rows:auto 1fr;background:rgba(8,8,8,.97);color:#fff}
.viewer-bar{grid-column:1/-1;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:14px 18px}
.viewer-bar button{width:max-content;border:1px solid #555;background:#111;color:#fff}
.viewer-bar .viewer-download{justify-self:end}
.viewer-bar span{font-size:12px}
.viewer-photo{grid-column:2;grid-row:2;max-width:100%;max-height:calc(100svh - 82px);margin:auto;object-fit:contain}
.arrow{grid-row:2;border:0;background:transparent;color:#fff;font-size:46px}
.left{grid-column:1}.right{grid-column:3}.arrow:disabled{opacity:.2}
@media(max-width:767px){
  .guest-gallery{padding:28px 12px 45px}
  .inner>header{align-items:stretch;flex-direction:column;gap:16px}
  .heading{text-align:center}
  .controls{align-items:stretch;flex-direction:column}
  .sort-select{width:100%}
  .selection{display:grid;grid-template-columns:1fr;gap:10px;width:100%}
  .selection-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .download{width:100%}
  .grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .viewer{grid-template-columns:46px 1fr 46px}
  .viewer-bar{padding:10px}
  .viewer-bar button{padding:8px 10px;font-size:12px}
}
</style>
