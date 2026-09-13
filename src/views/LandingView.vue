<script setup>
import { useRouter } from 'vue-router'
import { eventConfig } from '@/config/event.js'

const router = useRouter()

function beginCamera() {
  router.push('/camera')
}
</script>

<template>
  <main class="landing-page">
    <section class="landing-card">
      <p class="eyebrow">{{ eventConfig.shortTitle }}</p>
      <h1>{{ eventConfig.title }}</h1>
      <p class="intro">
        You have {{ eventConfig.maxShots }} disposable-camera shots for the event.
        No names, no previews — just point, shoot and enjoy it.
      </p>

      <div class="hero-placeholder" aria-hidden="true">
        <span>Event photo goes here</span>
      </div>

      <button type="button" class="start-button" @click="beginCamera">
        Start snapping
      </button>

      <RouterLink class="admin-link" to="/admin">
        Admin
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.landing-page {
  min-height: 100svh;
  background: #17120f;
  color: #fff8ef;
}
.landing-card {
  display: flex;
  min-height: 100svh;
  width: min(100%, 30rem);
  margin: 0 auto;
  padding: max(1.5rem, env(safe-area-inset-top)) 1.25rem max(1.25rem, env(safe-area-inset-bottom));
  flex-direction: column;
  justify-content: center;
  text-align: center;
}
.eyebrow {
  margin: 0;
  color: #d9a0a7;
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .18em;
  text-transform: uppercase;
}
h1 {
  margin: .6rem 0 0;
  font-family: Georgia, serif;
  font-size: clamp(2.6rem, 12vw, 4rem);
  line-height: .95;
}
.intro {
  margin: 1rem auto 0;
  max-width: 23rem;
  color: #d8ccc2;
  line-height: 1.55;
}
.hero-placeholder {
  display: grid;
  min-height: 18rem;
  margin-top: 1.4rem;
  place-items: center;
  border: 1px solid rgba(255,255,255,.22);
  background: #2a211d;
  color: #9f9188;
}
.start-button {
  min-height: 3.8rem;
  margin-top: 1rem;
  border: 0;
  background: #d9a0a7;
  color: #241916;
  font-weight: 900;
  cursor: pointer;
  text-transform: uppercase;
}
.admin-link {
  margin-top: .8rem;
  color: #9f9188;
  font-size: .7rem;
}
</style>
