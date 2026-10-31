// Grid, sort, select, full-screen viewer and ZIP download. Used by both the
// organiser gallery and the guest gallery.
//
//   usePhotoGallery(photosRef, { zipPath: '/api/admin/download-zip' })
//   usePhotoGallery(photosRef, { zipPath: '/api/gallery/share/download-zip', zipBody: { token } })
import { computed, onBeforeUnmount, onMounted, ref, unref } from 'vue'
import { API_BASE_URL } from '@/utils/api.js'
import { filenameFrom, saveBlob } from './api.js'
import { eventConfig } from '@/config/event.js'

export function usePhotoGallery(photos, { zipPath, zipBody = {} } = {}) {
  const selectedIds = ref([])
  const activeIndex = ref(null)
  const sortOrder = ref('newest')
  const selectionMode = ref(false)
  const downloading = ref(false)
  const error = ref('')
  let touchStartX = null

  const sortedPhotos = computed(() =>
    [...(unref(photos) || [])].sort((a, b) => {
      const diff = new Date(b.uploaded_at) - new Date(a.uploaded_at)
      return sortOrder.value === 'newest' ? diff : -diff
    }),
  )
  const activePhoto = computed(() => (activeIndex.value === null ? null : sortedPhotos.value[activeIndex.value] || null))
  const allSelected = computed(() => sortedPhotos.value.length > 0 && selectedIds.value.length === sortedPhotos.value.length)

  const isSelected = (id) => selectedIds.value.includes(id)
  function toggle(id) {
    selectedIds.value = isSelected(id) ? selectedIds.value.filter((v) => v !== id) : [...selectedIds.value, id]
  }
  function toggleMode() {
    selectionMode.value = !selectionMode.value
    if (!selectionMode.value) selectedIds.value = []
  }
  function toggleAll() {
    selectedIds.value = allSelected.value ? [] : sortedPhotos.value.map((p) => p.id)
  }
  function clearSelection() {
    selectedIds.value = []
  }
  function clickPhoto(photo) {
    if (selectionMode.value) toggle(photo.id)
    else activeIndex.value = sortedPhotos.value.findIndex((p) => p.id === photo.id)
  }
  const close = () => (activeIndex.value = null)
  function next() {
    if (activeIndex.value !== null && activeIndex.value < sortedPhotos.value.length - 1) activeIndex.value++
  }
  function prev() {
    if (activeIndex.value !== null && activeIndex.value > 0) activeIndex.value--
  }
  function onKey(e) {
    if (!activePhoto.value) return
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowRight') next()
    if (e.key === 'ArrowLeft') prev()
  }
  function touchStart(e) {
    touchStartX = e.changedTouches?.[0]?.clientX ?? null
  }
  function touchEnd(e) {
    const end = e.changedTouches?.[0]?.clientX
    if (touchStartX === null || typeof end !== 'number') return
    const d = end - touchStartX
    touchStartX = null
    if (Math.abs(d) < 45) return
    if (d < 0) next()
    else prev()
  }

  async function downloadSelected() {
    if (!selectedIds.value.length || downloading.value || !zipPath) return
    downloading.value = true
    error.value = ''
    try {
      const response = await fetch(`${API_BASE_URL}${zipPath}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...unref(zipBody), ids: selectedIds.value }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Could not prepare download.')
      }
      saveBlob(await response.blob(), filenameFrom(response, `${eventConfig.slug}-photos.zip`))
    } catch (err) {
      error.value = err?.message || 'Download failed.'
    } finally {
      downloading.value = false
    }
  }

  async function downloadOne(photo) {
    error.value = ''
    try {
      const response = await fetch(photo.imageUrl, { credentials: 'include' })
      if (!response.ok) throw new Error('Download failed.')
      saveBlob(await response.blob(), `${eventConfig.slug}-${photo.id.slice(0, 8)}.jpg`)
    } catch (err) {
      error.value = err?.message || 'Download failed.'
    }
  }

  onMounted(() => window.addEventListener('keydown', onKey))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

  return {
    selectedIds, activeIndex, sortOrder, selectionMode, downloading, error, sortedPhotos, activePhoto,
    allSelected, isSelected, toggle, toggleMode, toggleAll, clearSelection, clickPhoto, close, next, prev,
    touchStart, touchEnd, downloadSelected, downloadOne,
  }
}
