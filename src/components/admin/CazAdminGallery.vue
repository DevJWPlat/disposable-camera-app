<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { API_BASE_URL } from '@/utils/api.js'

const props = defineProps({ photos: { type: Array, default: () => [] } })
const selectedIds = ref([])
const activeIndex = ref(null)
const sortOrder = ref('newest')
const selectionMode = ref(false)
const downloading = ref(false)
const error = ref('')
const touchStartX = ref(null)

const sortedPhotos = computed(() => [...props.photos].sort((a,b) => {
  const diff = new Date(b.uploaded_at)-new Date(a.uploaded_at)
  return sortOrder.value === 'newest' ? diff : -diff
}))
const activePhoto = computed(() => activeIndex.value === null ? null : sortedPhotos.value[activeIndex.value] || null)
const allSelected = computed(() => sortedPhotos.value.length > 0 && selectedIds.value.length === sortedPhotos.value.length)
function isSelected(id){ return selectedIds.value.includes(id) }
function toggle(id){ selectedIds.value = isSelected(id) ? selectedIds.value.filter(v=>v!==id) : [...selectedIds.value,id] }
function toggleMode(){ selectionMode.value=!selectionMode.value; if(!selectionMode.value) selectedIds.value=[] }
function toggleAll(){ selectedIds.value = allSelected.value ? [] : sortedPhotos.value.map(p=>p.id) }
function clickPhoto(photo){ if(selectionMode.value) toggle(photo.id); else activeIndex.value=sortedPhotos.value.findIndex(p=>p.id===photo.id) }
function close(){ activeIndex.value=null }
function next(){ if(activeIndex.value!==null && activeIndex.value<sortedPhotos.value.length-1) activeIndex.value++ }
function prev(){ if(activeIndex.value!==null && activeIndex.value>0) activeIndex.value-- }
function key(e){ if(!activePhoto.value)return; if(e.key==='Escape')close(); if(e.key==='ArrowRight')next(); if(e.key==='ArrowLeft')prev() }
function touchStart(e){ touchStartX.value=e.changedTouches?.[0]?.clientX ?? null }
function touchEnd(e){ const end=e.changedTouches?.[0]?.clientX; if(touchStartX.value===null || typeof end!=='number')return; const d=end-touchStartX.value; touchStartX.value=null; if(Math.abs(d)<45)return; d<0?next():prev() }
async function downloadSelected(){
  if(!selectedIds.value.length || downloading.value)return
  downloading.value=true; error.value=''
  try{
    const response=await fetch(`${API_BASE_URL}/api/admin/download-zip`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:selectedIds.value})})
    if(!response.ok){ const data=await response.json().catch(()=>null); throw new Error(data?.error||'Could not prepare download.') }
    const blob=await response.blob(); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='caz-and-dan-photos.zip'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),2000)
  }catch(err){error.value=err?.message||'Download failed.'}finally{downloading.value=false}
}
onMounted(()=>window.addEventListener('keydown',key)); onBeforeUnmount(()=>window.removeEventListener('keydown',key))
</script>

<template>
  <section class="gallery">
    <header><div><p>CAZ &amp; DAN · 10.10.26</p><h2>Gallery</h2><span>{{ photos.length }} photographs</span></div><button class="select" :class="{active:selectionMode}" type="button" @click="toggleMode">{{ selectionMode ? 'Done selecting' : 'Select photos for download' }}</button></header>
    <div class="controls"><div class="sort-select"><select v-model="sortOrder"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></div><div v-if="selectionMode" class="selection"><strong>{{ selectedIds.length }} selected</strong><div class="selection-actions"><button type="button" @click="toggleAll">{{ allSelected?'Clear all':'Select all' }}</button><button type="button" :disabled="!selectedIds.length" @click="selectedIds=[]">Clear</button></div><button class="download" :disabled="!selectedIds.length||downloading" type="button" @click="downloadSelected">{{ downloading?'Preparing ZIP…':`Download ${selectedIds.length||''}`.trim() }}</button></div></div>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="grid"><article v-for="photo in sortedPhotos" :key="photo.id" :class="{selected:isSelected(photo.id)}"><button type="button" @click="clickPhoto(photo)"><img :src="photo.thumbnailUrl||photo.imageUrl" alt="" loading="lazy"><span v-if="selectionMode" class="tick" :class="{on:isSelected(photo.id)}">{{ isSelected(photo.id)?'✓':'' }}</span></button></article></div>
    <Teleport to="body"><div v-if="activePhoto" class="viewer" @touchstart.passive="touchStart" @touchend.passive="touchEnd"><div class="viewer-bar"><button @click="close">Close</button><span>{{ activeIndex+1 }} / {{ sortedPhotos.length }}</span></div><button class="arrow left" :disabled="activeIndex===0" @click="prev">‹</button><img class="viewer-photo" :src="activePhoto.imageUrl" alt=""><button class="arrow right" :disabled="activeIndex===sortedPhotos.length-1" @click="next">›</button></div></Teleport>
  </section>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css');
.gallery{min-height:100svh;background:#f7f5ef;color:#111;padding:34px 24px 60px}.gallery>header,.controls,.grid,.error{width:min(100%,1280px);margin-inline:auto}.gallery>header{display:flex;align-items:end;justify-content:space-between;gap:24px;padding-bottom:24px;border-bottom:1px solid #d8d5cd}.gallery>header p{margin:0 0 5px;font-size:10px;letter-spacing:.22em}.gallery>header h2{margin:0;font:400 48px Georgia,serif}.gallery>header span{color:#77736c;font-size:12px}.gallery button,.gallery select{min-height:44px;border:1px solid #cac7bf;border-radius:7px;background:#fff;color:#111;padding:9px 14px;font:inherit;cursor:pointer}.sort-select{position:relative;width:290px;max-width:100%}.sort-select select{width:100%;appearance:none;-webkit-appearance:none;padding-right:46px;background:#fff}.sort-select i{position:absolute;top:50%;right:16px;transform:translateY(-50%);font-size:16px;pointer-events:none;color:#111}.select.active{border-color:#111;background:#111;color:#fff}.controls{display:flex;justify-content:space-between;gap:16px;margin-top:22px;margin-bottom:22px}.selection{display:flex;align-items:center;gap:10px}.selection strong{font-size:12px}.selection-actions{display:flex;gap:10px}.download{background:#111!important;color:#fff!important;border-color:#111!important}.download:disabled{opacity:.35;cursor:not-allowed}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}.grid article{aspect-ratio:1;border:2px solid transparent;border-radius:10px;overflow:hidden;background:#fff;box-shadow:0 9px 24px rgba(0,0,0,.06)}.grid article.selected{border-color:#111}.grid article>button{position:relative;width:100%;height:100%;padding:0;border:0;border-radius:8px;overflow:hidden}.grid img{display:block;width:100%;height:100%;object-fit:cover}.tick{position:absolute;top:10px;right:10px;width:28px;height:28px;display:grid;place-items:center;border:2px solid white;border-radius:50%;background:rgba(0,0,0,.25);color:#fff}.tick.on{background:#111}.error{color:#923b3b}.viewer{position:fixed;z-index:9999;inset:0;display:grid;grid-template-columns:65px 1fr 65px;grid-template-rows:auto 1fr;background:rgba(8,8,8,.97);color:#fff}.viewer-bar{grid-column:1/-1;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:14px 18px}.viewer-bar button{width:max-content;border:1px solid #555;background:#111;color:#fff}.viewer-photo{grid-column:2;grid-row:2;max-width:100%;max-height:calc(100svh - 82px);margin:auto;object-fit:contain}.arrow{grid-row:2;border:0;background:transparent;color:#fff;font-size:46px}.left{grid-column:1}.right{grid-column:3}.arrow:disabled{opacity:.2}
@media(max-width:767px){.gallery{padding:24px 12px 40px}.sort-select{width:100%}.gallery>header{align-items:stretch;flex-direction:column}.gallery>header h2{font-size:40px}.controls{align-items:stretch;flex-direction:column}.selection{display:grid;grid-template-columns:1fr;gap:10px}.selection strong{grid-column:1}.selection-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.download{width:100%}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.viewer{grid-template-columns:46px 1fr 46px}}
</style>
