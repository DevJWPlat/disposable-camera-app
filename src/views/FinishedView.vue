<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { eventConfig } from '@/config/event.js'

const router = useRouter()
const isDev = import.meta.env.DEV
const isWestern = computed(() => eventConfig.theme === 'western')
const themeStyle = computed(() => ({
  '--event-bg': eventConfig.palette?.background,
  '--event-surface': eventConfig.palette?.surface,
  '--event-ink': eventConfig.palette?.ink,
  '--event-muted': eventConfig.palette?.muted,
  '--event-accent': eventConfig.palette?.accent,
  '--event-accent-dark': eventConfig.palette?.accentDark,
  '--event-line': eventConfig.palette?.line,
}))

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
  <main class="finished-page" :class="`theme--${eventConfig.theme}`" :style="themeStyle">
    <section class="finished-card">
      <div class="stamp" aria-hidden="true">
        <span>{{ isWestern ? '25' : '✓' }}</span>
        <small>{{ isWestern ? 'exposures' : 'complete' }}</small>
      </div>

      <p class="eyebrow">{{ eventConfig.title }}</p>
      <h1>{{ eventConfig.finishedTitle || 'That’s a wrap' }}</h1>

      <div v-if="isWestern" class="stars" aria-hidden="true">★ ✦ ★</div>

      <p class="body-copy">
        {{ eventConfig.finishedCopy }}
      </p>

      <div class="keepsake">
        <span>Roll complete</span>
        <strong>0 shots remaining</strong>
      </div>

      <p class="small">{{ isWestern ? 'No previews tonight — the best bits stay a surprise.' : 'No previews yet — the best bits stay a surprise.' }}</p>

      <button v-if="isDev" type="button" @click="resetForTesting">
        Dev: start a new roll
      </button>
    </section>
  </main>
</template>

<style scoped>
.finished-page {
  --event-bg:#f1dfd1;
  --event-surface:#fff8ef;
  --event-ink:#2c1a16;
  --event-muted:#7b5e55;
  --event-accent:#c77f8c;
  --event-accent-dark:#8c4c58;
  --event-line:#432820;
  min-height:100svh;
  background:
    radial-gradient(circle at 50% 22%, rgba(255,255,255,.7), transparent 25rem),
    var(--event-bg);
  color:var(--event-ink);
}
.finished-card {
  display:grid;
  min-height:100svh;
  width:min(100%,30rem);
  margin:0 auto;
  padding:max(1.5rem,env(safe-area-inset-top)) 1.3rem max(1.5rem,env(safe-area-inset-bottom));
  place-content:center;
  justify-items:center;
  text-align:center;
}
.stamp {
  display:grid;
  width:7.5rem;
  height:7.5rem;
  place-content:center;
  transform:rotate(-5deg);
  border:2px solid var(--event-line);
  border-radius:50%;
  box-shadow:inset 0 0 0 5px var(--event-bg), inset 0 0 0 6px var(--event-line);
  font-family:Georgia,serif;
}
.stamp span { font-size:3rem; font-weight:900; line-height:.85; }
.stamp small { margin-top:.35rem; color:var(--event-accent-dark); font-size:.54rem; font-weight:900; letter-spacing:.13em; text-transform:uppercase; }
.eyebrow { margin:1.3rem 0 0; color:var(--event-accent-dark); font-size:.62rem; font-weight:900; letter-spacing:.16em; text-transform:uppercase; }
h1 { max-width:24rem; margin:.5rem 0 0; color:var(--event-line); font-family:Georgia,serif; font-size:clamp(2.8rem,12vw,4rem); font-style:italic; line-height:.92; }
.stars { margin:.75rem 0 0; color:var(--event-accent-dark); font-size:.75rem; letter-spacing:.6em; }
.body-copy { max-width:23rem; margin:1rem auto 0; color:var(--event-muted); font-size:.9rem; line-height:1.6; }
.keepsake { display:flex; width:min(100%,23rem); margin:1.2rem auto 0; padding:.8rem 0; align-items:center; justify-content:space-between; border-top:1px solid rgba(67,40,32,.2); border-bottom:1px solid rgba(67,40,32,.2); color:var(--event-muted); font-size:.6rem; letter-spacing:.1em; text-transform:uppercase; }
.keepsake strong { color:var(--event-line); font-family:Georgia,serif; font-size:.85rem; letter-spacing:0; text-transform:none; }
.small { margin:.9rem 0 0; color:var(--event-muted); font-size:.67rem; }
button { margin-top:1.25rem; border:1px solid var(--event-line); background:transparent; color:var(--event-line); padding:.75rem 1rem; cursor:pointer; font-size:.64rem; font-weight:800; text-transform:uppercase; }
</style>
