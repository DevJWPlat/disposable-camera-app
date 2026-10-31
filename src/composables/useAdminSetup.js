// Organiser account setup from an invite link: /admin/setup?token=...
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiRequest } from './api.js'

export function useAdminSetup() {
  const route = useRoute()
  const router = useRouter()
  const token = computed(() => String(route.query.token || ''))
  const email = ref(String(route.query.email || ''))
  const verified = ref(false)
  const password = ref('')
  const confirm = ref('')
  const showPassword = ref(false)
  const loading = ref(false)
  const error = ref('')

  async function verify() {
    loading.value = true
    error.value = ''
    try {
      await apiRequest('/api/admin/setup/verify', { method: 'POST', body: JSON.stringify({ email: email.value, token: token.value }) })
      verified.value = true
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function activate() {
    if (password.value.length < 10) {
      error.value = 'Use at least 10 characters.'
      return
    }
    if (password.value !== confirm.value) {
      error.value = 'Those passwords don’t match.'
      return
    }
    loading.value = true
    error.value = ''
    try {
      await apiRequest('/api/admin/setup/activate', {
        method: 'POST',
        body: JSON.stringify({ email: email.value, token: token.value, password: password.value }),
      })
      router.replace('/admin')
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return { token, email, verified, password, confirm, showPassword, loading, error, verify, activate }
}
