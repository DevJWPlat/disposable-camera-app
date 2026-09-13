<script setup>
import { computed, onMounted, ref } from 'vue'
import { API_BASE_URL } from '@/utils/api.js'
import { eventConfig } from '@/config/event.js'
import AdminGallery from '@/components/admin/AdminGallery.vue'

const loading = ref(true)
const loggingIn = ref(false)
const refreshing = ref(false)
const email = ref('')
const password = ref('')
const error = ref('')
const admin = ref(null)
const stats = ref(null)
const photos = ref([])
const stage = ref('dashboard')

const isLoggedIn = computed(() => Boolean(admin.value))

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.ok) {
    if (response.status === 401) admin.value = null
    throw new Error(data?.error || `Request failed (${response.status})`)
  }
  return data
}

async function restore() {
  try {
    const data = await api('/api/admin/me')
    admin.value = data.admin
    await refreshData()
  } catch {
    admin.value = null
  } finally {
    loading.value = false
  }
}

async function login() {
  loggingIn.value = true
  error.value = ''
  try {
    const data = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, password: password.value }),
    })
    admin.value = data.admin
    password.value = ''
    await refreshData()
  } catch (err) {
    error.value = err.message
  } finally {
    loggingIn.value = false
  }
}

async function logout() {
  try {
    await api('/api/admin/logout', { method: 'POST', body: JSON.stringify({}) })
  } catch {}
  admin.value = null
  stats.value = null
  photos.value = []
  stage.value = 'dashboard'
}

async function refreshData() {
  if (!admin.value) return
  refreshing.value = true
  error.value = ''
  try {
    const [statsData, photoData] = await Promise.all([
      api('/api/admin/stats'),
      api('/api/admin/photos'),
    ])
    stats.value = statsData
    photos.value = photoData.photos || []
  } catch (err) {
    error.value = err.message
  } finally {
    refreshing.value = false
  }
}

onMounted(restore)
</script>

<template>
  <main class="admin-page">
    <section class="shell">
      <div v-if="loading" class="state">Loading admin…</div>

      <form v-else-if="!isLoggedIn" class="login-card" @submit.prevent="login">
        <p class="eyebrow">{{ eventConfig.title }}</p>
        <h1>Private admin</h1>
        <label>Email</label>
        <input v-model.trim="email" type="email" autocomplete="email" required />
        <label>Password</label>
        <input v-model="password" type="password" autocomplete="current-password" required />
        <p v-if="error" class="error">{{ error }}</p>
        <button :disabled="loggingIn" type="submit">
          {{ loggingIn ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <template v-else>
        <header class="toolbar">
          <div>
            <small>{{ eventConfig.shortTitle }}</small>
            <strong>Admin</strong>
          </div>
          <div class="toolbar-actions">
            <button type="button" @click="refreshData">Refresh</button>
            <button type="button" @click="logout">Log out</button>
          </div>
        </header>

        <p v-if="error" class="error">{{ error }}</p>

        <section v-if="stage === 'dashboard'" class="dashboard">
          <p class="eyebrow">{{ eventConfig.title }}</p>
          <h1>Event dashboard</h1>

          <div class="stats-grid">
            <article>
              <span>Total photos</span>
              <strong>{{ stats?.photos ?? 0 }}</strong>
            </article>
            <article>
              <span>Shot allowance</span>
              <strong>{{ stats?.maxShots ?? eventConfig.maxShots }}</strong>
            </article>
            <article>
              <span>Active sessions</span>
              <strong>{{ stats?.sessions ?? 0 }}</strong>
            </article>
            <article>
              <span>Latest upload</span>
              <strong class="small-stat">{{ stats?.latestUpload || 'None yet' }}</strong>
            </article>
          </div>

          <button class="primary" type="button" :disabled="photos.length === 0" @click="stage = 'gallery'">
            View gallery
          </button>
        </section>

        <AdminGallery
          v-else
          :photos="photos"
          @back="stage = 'dashboard'"
          @refresh="refreshData"
        />
      </template>
    </section>
  </main>
</template>

<style scoped>
.admin-page { min-height:100svh; background:#17120f; color:#fff8ef; }
.shell { width:min(100%,34rem); min-height:100svh; margin:0 auto; padding:max(1rem,env(safe-area-inset-top)) 1rem max(1rem,env(safe-area-inset-bottom)); }
.state { min-height:80svh; display:grid; place-items:center; }
.login-card { display:grid; gap:.65rem; margin:10vh auto 0; border:1px solid #5a4039; background:#211916; padding:1.5rem; }
.eyebrow { margin:0; color:#d9a0a7; font-size:.7rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
h1 { margin:.4rem 0 1rem; font-family:Georgia,serif; }
label { font-size:.75rem; color:#cbbab0; }
input { min-height:3rem; border:1px solid #6e5048; background:#17120f; color:white; padding:0 .8rem; }
button { min-height:2.6rem; border:1px solid #6e5048; background:#211916; color:#fff8ef; padding:.5rem .75rem; cursor:pointer; }
.login-card button,.primary { background:#d9a0a7; color:#211916; border:0; font-weight:900; }
.error { color:#ffaaa1; }
.toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
.toolbar div:first-child { display:flex; flex-direction:column; }
.toolbar small { color:#d9a0a7; }
.toolbar-actions { display:flex; gap:.5rem; }
.dashboard { padding-top:3rem; }
.stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
.stats-grid article { min-height:8rem; border:1px solid #4f3a34; background:#211916; padding:1rem; display:flex; flex-direction:column; justify-content:space-between; }
.stats-grid span { color:#a9978d; font-size:.75rem; }
.stats-grid strong { font-family:Georgia,serif; font-size:2.5rem; }
.small-stat { font-size:.85rem !important; line-height:1.3; }
.primary { width:100%; margin-top:1rem; min-height:3.2rem; }
</style>
