<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '@/utils/api.js'
import { eventConfig } from '@/config/event.js'

const route = useRoute()
const router = useRouter()
const token = computed(() => String(route.query.token || ''))

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const stage = ref('email')
const loading = ref(false)
const error = ref('')

async function request(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.ok) throw new Error(data?.error || 'Request failed')
  return data
}

async function verifyEmail() {
  error.value = ''
  loading.value = true
  try {
    await request('/api/admin/setup/verify', { email: email.value, token: token.value })
    stage.value = 'password'
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function activate() {
  error.value = ''
  if (password.value.length < 10) {
    error.value = 'Use at least 10 characters.'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    await request('/api/admin/setup/activate', {
      email: email.value,
      token: token.value,
      password: password.value,
    })
    router.replace('/admin?activated=1')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="setup-page">
    <section class="card">
      <p class="eyebrow">{{ eventConfig.title }}</p>
      <h1>Set up admin access</h1>

      <form v-if="stage === 'email'" @submit.prevent="verifyEmail">
        <label>Email</label>
        <input v-model.trim="email" type="email" autocomplete="email" required />
        <button :disabled="loading || !token" type="submit">
          {{ loading ? 'Checking…' : 'Continue' }}
        </button>
      </form>

      <form v-else @submit.prevent="activate">
        <label>Password</label>
        <input v-model="password" type="password" autocomplete="new-password" required />
        <label>Confirm password</label>
        <input v-model="confirmPassword" type="password" autocomplete="new-password" required />
        <button :disabled="loading" type="submit">
          {{ loading ? 'Activating…' : 'Activate account' }}
        </button>
      </form>

      <p v-if="!token" class="error">This setup link is missing its token.</p>
      <p v-if="error" class="error">{{ error }}</p>
    </section>
  </main>
</template>

<style scoped>
.setup-page { min-height:100svh; display:grid; place-items:center; background:#17120f; color:#fff8ef; padding:1rem; }
.card { width:min(100%,28rem); border:1px solid #5a4039; background:#211916; padding:1.5rem; }
.eyebrow { color:#d9a0a7; font-size:.7rem; font-weight:800; text-transform:uppercase; letter-spacing:.14em; }
h1 { font-family:Georgia,serif; }
form { display:grid; gap:.65rem; margin-top:1.25rem; }
input { min-height:3rem; border:1px solid #6e5048; background:#17120f; color:white; padding:0 .8rem; }
button { min-height:3rem; margin-top:.4rem; border:0; background:#d9a0a7; color:#211916; font-weight:800; }
.error { color:#ffaaa1; }
</style>
