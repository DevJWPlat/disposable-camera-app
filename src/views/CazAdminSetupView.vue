<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '@/utils/api.js'
import { eventConfig } from '@/config/event.js'

const route = useRoute()
const router = useRouter()
const token = computed(() => String(route.query.token || ''))
const username = ref(eventConfig.adminUsername || 'cazanddan')
const verified = ref(false)
const password = ref('')
const confirm = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const loading = ref(false)
const error = ref('')

async function call(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  const text = await response.text()
  let data = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    throw new Error(`Server error (${response.status})`)
  }

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`)
  }

  return data
}

async function verify() {
  loading.value = true
  error.value = ''

  try {
    await call('/api/admin/setup/verify', {
      email: username.value,
      token: token.value,
    })
    verified.value = true
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function activate() {
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 10) {
    error.value = 'Use at least 10 characters'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await call('/api/admin/setup/activate', {
      email: username.value,
      token: token.value,
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
  <main class="setup">
    <section class="phone-card">
      <button class="hero" type="button" aria-label="Back to Caz and Dan" @click="router.push('/')">
        <img :src="eventConfig.heroImage" alt="Caz and Dan" />
      </button>

      <div class="setup-copy">
        <p class="eyebrow">PRIVATE ADMIN</p>
        <h1>{{ verified ? 'Create your password' : 'Confirm your username' }}</h1>
      </div>

      <form v-if="!verified" @submit.prevent="verify">
        <label>
          <span>USERNAME</span>
          <input v-model.trim="username" autocomplete="username" />
        </label>

        <button type="submit" :disabled="loading">
          {{ loading ? 'CHECKING…' : 'CONTINUE' }}
        </button>
      </form>

      <form v-else @submit.prevent="activate">
        <label>
          <span>PASSWORD</span>
          <div class="password-field"><input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" /><button type="button" class="password-toggle" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword=!showPassword"><i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i></button></div>
        </label>

        <label>
          <span>CONFIRM PASSWORD</span>
          <div class="password-field"><input v-model="confirm" :type="showConfirm ? 'text' : 'password'" autocomplete="new-password" /><button type="button" class="password-toggle" :aria-label="showConfirm ? 'Hide password' : 'Show password'" @click="showConfirm=!showConfirm"><i :class="showConfirm ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i></button></div>
        </label>

        <button type="submit" :disabled="loading">
          {{ loading ? 'SAVING…' : 'CREATE PASSWORD' }}
        </button>
      </form>

      <p class="hint">
        {{ verified
          ? 'Choose a password with at least 10 characters.'
          : 'Use the private username supplied with your setup link.' }}
      </p>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </section>
  </main>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css');
.setup {
  min-height: 100svh;
  display: grid;
  place-items: start center;
  background: #ecebe7;
  color: #111;
}

.phone-card {
  width: min(100%, 430px);
  min-height: 100svh;
  padding: 34px 22px 30px;
  background: #faf9f4;
  color: #111;
  text-align: center;
  box-shadow: 0 18px 60px rgba(0, 0, 0, .08);
}

.hero {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: 10px;
  overflow: hidden;
  background: transparent;
  cursor: pointer;
}

.hero img {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.setup-copy {
  padding: 31px 4px 23px;
}

.eyebrow {
  margin: 0 0 9px;
  color: #716f69;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .3em;
}

.setup-copy h1 {
  margin: 0;
  color: #111;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(34px, 9.5vw, 44px);
  font-weight: 400;
  line-height: 1.03;
}

form {
  display: grid;
  gap: 17px;
  text-align: left;
}

label {
  display: grid;
  gap: 8px;
}

label span {
  color: #111;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .18em;
}

.password-field {
  position: relative;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 7px;
  transform: translateY(-50%);
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #111;
  cursor: pointer;
}

.password-toggle i { font-size: 15px; }

.password-field input { padding-right: 48px; }

input {
  width: 100%;
  min-height: 54px;
  border: 1px solid #c9c6be;
  border-radius: 7px;
  outline: 0;
  background: #fff;
  color: #111;
  padding: 0 14px;
  transition: border-color .15s ease, box-shadow .15s ease;
}

input:focus {
  border-color: #111;
  box-shadow: 0 0 0 1px #111;
}

form > button {
  width: 100%;
  min-height: 62px;
  margin-top: 5px;
  border: 0;
  border-radius: 7px;
  background: #111;
  color: #fff;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 18px;
  letter-spacing: .18em;
  cursor: pointer;
}

form > button:disabled {
  cursor: wait;
  opacity: .65;
}

.hint {
  margin: 20px auto 0;
  max-width: 330px;
  color: #716f69;
  font-size: 12px;
  line-height: 1.5;
}

.error {
  margin: 13px 0 0;
  color: #983838;
  font-size: 12px;
  font-weight: 700;
}

@media (min-width: 521px) {
  .phone-card {
    box-shadow: 0 28px 80px rgba(0, 0, 0, .12);
  }
}

@media (max-width: 520px) {
  .phone-card {
    width: 100vw;
    padding-top: 24px;
    box-shadow: none;
  }
}

@media (max-height: 780px) {
  .phone-card {
    padding-top: 18px;
  }

  .setup-copy {
    padding: 22px 4px 18px;
  }

  .setup-copy h1 {
    font-size: 32px;
  }

  form > button {
    min-height: 56px;
  }
}
</style>
