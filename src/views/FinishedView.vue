<script setup>
import { useRouter } from 'vue-router'
import { eventConfig } from '@/config/event.js'

const router = useRouter()
const isDev = import.meta.env.DEV

const STORAGE_KEYS = {
  deviceToken: `disposable_camera_${eventConfig.slug}_device_token`,
  sessionId: `disposable_camera_${eventConfig.slug}_session_id`,
}

function resetForTesting() {
  localStorage.removeItem(STORAGE_KEYS.deviceToken)
  localStorage.removeItem(STORAGE_KEYS.sessionId)
  router.replace('/camera')
}
</script>

<template>
  <main class="finished-page">
    <section class="finished-card">
      <p class="eyebrow">{{ eventConfig.title }}</p>
      <h1>That’s a wrap</h1>
      <div class="zero">0</div>
      <p>Your {{ eventConfig.maxShots }} shots have been used and your photographs are safely stored.</p>
      <p class="small">The gallery will be available to the event admin.</p>

      <button v-if="isDev" type="button" @click="resetForTesting">
        Dev: start a new roll
      </button>
    </section>
  </main>
</template>

<style scoped>
.finished-page {
  min-height: 100svh;
  background: #17120f;
  color: #fff8ef;
}
.finished-card {
  display: grid;
  min-height: 100svh;
  width: min(100%, 30rem);
  margin: 0 auto;
  padding: max(1.5rem, env(safe-area-inset-top)) 1.25rem max(1.5rem, env(safe-area-inset-bottom));
  place-content: center;
  text-align: center;
}
.eyebrow { color:#d9a0a7; font-weight:800; text-transform:uppercase; letter-spacing:.15em; }
h1 { margin:.5rem 0; font-family:Georgia,serif; font-size:3rem; }
.zero { margin:.8rem auto; font-family:Georgia,serif; font-size:7rem; line-height:.8; }
p { color:#d8ccc2; line-height:1.55; }
.small { font-size:.8rem; color:#9f9188; }
button { margin-top:1rem; border:1px solid #d9a0a7; background:transparent; color:#d9a0a7; padding:.8rem 1rem; }
</style>
