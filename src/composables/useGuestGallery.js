// Loads the shared guest gallery for the token in the URL.
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiRequest } from './api.js'

export function useGuestGallery() {
  const route = useRoute()
  const token = computed(() => String(route.params.token || ''))
  const loading = ref(true)
  const error = ref('')
  const photos = ref([])

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const data = await apiRequest(`/api/gallery/share/${encodeURIComponent(token.value)}`)
      photos.value = data.photos || []
    } catch (err) {
      error.value = err.message || 'This gallery link is not available.'
    } finally {
      loading.value = false
    }
  }

  onMounted(load)
  return { token, loading, error, photos, reload: load }
}
