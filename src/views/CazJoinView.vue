<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/utils/api.js'
import { eventConfig } from '@/config/event.js'

const router = useRouter()
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const stage = ref('username')
const loading = ref(false)
const error = ref('')

async function request(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.ok) throw new Error(data?.error || 'Request failed')
  return data
}

async function checkUsername() {
  error.value = ''
  loading.value = true
  try {
    await request('/api/admin/join/check', { username: username.value })
    stage.value = 'password'
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function createAccount() {
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
    await request('/api/admin/join/activate', {
      username: username.value,
      password: password.value,
    })
    router.replace('/admin')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="join-page">
    <section class="join-card">
      <button class="join-hero" type="button" aria-label="Back to Caz and Dan" @click="router.push('/')">
        <img :src="eventConfig.heroImage" alt="Caz and Dan" />
      </button>

      <div class="join-copy">
        <p>PRIVATE ADMIN</p>
        <h1>{{ stage === 'username' ? 'Claim your account' : 'Create your password' }}</h1>
        <span>{{ stage === 'username' ? 'Enter the username you were given.' : 'Choose a password with at least 10 characters.' }}</span>
      </div>

      <form v-if="stage === 'username'" @submit.prevent="checkUsername">
        <label for="join-username">USERNAME</label>
        <input id="join-username" v-model.trim="username" autocomplete="username" placeholder="Enter your username" required />
        <button class="primary" :disabled="loading" type="submit">{{ loading ? 'CHECKING…' : 'CONTINUE' }}</button>
      </form>

      <form v-else @submit.prevent="createAccount">
        <label for="join-password">PASSWORD</label>
        <div class="password-field">
          <input id="join-password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="Create your password" required />
          <button class="password-toggle" type="button" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
            <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" aria-hidden="true"></i>
          </button>
        </div>

        <label for="join-confirm">CONFIRM PASSWORD</label>
        <div class="password-field">
          <input id="join-confirm" v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="Confirm your password" required />
          <button class="password-toggle" type="button" :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'" @click="showConfirmPassword = !showConfirmPassword">
            <i :class="showConfirmPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" aria-hidden="true"></i>
          </button>
        </div>

        <button class="primary" :disabled="loading" type="submit">{{ loading ? 'CREATING…' : 'CREATE PASSWORD' }}</button>
      </form>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button v-if="error.toLowerCase().includes('already')" class="login-link" type="button" @click="router.push('/admin')">Go to login</button>
    </section>
  </main>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css');
.join-page{min-height:100svh;display:grid;place-items:start center;background:#ecebe7;color:#111}.join-card{width:min(100%,430px);min-height:100svh;padding:30px 24px;background:#faf9f4;box-shadow:0 20px 70px rgba(0,0,0,.1)}.join-hero{display:block;width:72%;margin:0 auto;padding:0;border:0;border-radius:8px;overflow:hidden;background:transparent;cursor:pointer}.join-hero img{display:block;width:100%;aspect-ratio:1;object-fit:cover}.join-copy{margin:25px 0 24px;text-align:center}.join-copy p{margin:0 0 8px;color:#716f69;font-size:10px;font-weight:700;letter-spacing:.22em}.join-copy h1{margin:0;font:400 40px/1.02 Georgia,serif}.join-copy span{display:block;max-width:330px;margin:10px auto 0;color:#716f69;font-size:12px;line-height:1.5}form{display:grid;gap:10px}label{margin-top:5px;font-size:10px;font-weight:700;letter-spacing:.18em}.password-field{position:relative}input{width:100%;min-height:54px;border:1px solid #c9c6be;border-radius:7px;outline:0;background:#fff;color:#111;padding:0 14px;font:inherit}input:focus{border-color:#111;box-shadow:0 0 0 1px #111}.password-field input{padding-right:52px}.password-toggle{position:absolute;top:50%;right:7px;transform:translateY(-50%);display:grid;width:40px;height:40px;place-items:center;padding:0;border:0;background:transparent;color:#111;cursor:pointer}.password-toggle i{font-size:16px}.primary{width:100%;min-height:58px;margin-top:10px;border:0;border-radius:7px;background:#111;color:#fff;font:600 13px Montserrat,sans-serif;letter-spacing:.18em;cursor:pointer}.primary:disabled{cursor:wait;opacity:.6}.error{margin:15px 0 0;color:#983838;font-size:12px;font-weight:700;line-height:1.45;text-align:center}.login-link{display:block;margin:13px auto 0;border:0;background:transparent;color:#111;text-decoration:underline;cursor:pointer;font:inherit;font-size:12px}@media(max-width:520px){.join-card{width:100vw;box-shadow:none}.join-hero{width:78%}}
</style>
