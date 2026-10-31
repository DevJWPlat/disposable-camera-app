<script setup>
import { useRouter } from 'vue-router'
import { eventConfig } from '@/config/event.js'
import paperRip from '@/assets/events/caz-and-dan/paper-rip.png'
const router = useRouter()

function start() {
  router.push('/camera')
}

function openAdmin() {
  router.push('/admin')
}
</script>

<template>
  <main class="caz-landing">
    <section class="invite-card">
      <header class="invite-header">
        <h1>CAZ &amp; DAN</h1>
        <div class="heart-rule"><span></span><b>♥</b><span></span></div>
        <p>{{ eventConfig.dateLabel }}</p>
      </header>

      <button class="hero-button" type="button" aria-label="Open private admin" @click="openAdmin">
        <img :src="eventConfig.heroImage" alt="Caz and Dan together" />
      </button>

      <img class="paper-tear" :src="paperRip" alt="" aria-hidden="true" />

      <section class="welcome-copy">
        <h2>{{ eventConfig.copy.landing.welcome }}</h2>
        <p class="subtitle">{{ eventConfig.copy.landing.subtitle }}</p>
        <b class="heart">♥</b>
        <p class="intro">{{ eventConfig.copy.landing.intro }}</p>
      </section>

      <button class="start-button" type="button" @click="start">
        {{ eventConfig.copy.landing.cta }}
      </button>

      <p class="allowance">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h2.2l1.2-2h3.2l1.2 2H17a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Zm5 3.1a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/></svg>
        <span>{{ eventConfig.copy.landing.allowance }}</span>
      </p>
    </section>
  </main>
</template>

<style scoped>
.caz-landing { min-height:100svh; display:grid; place-items:start center; background:#f7f5ef; color:#111; }
.invite-card { position:relative; width:min(100%,430px); min-height:100svh; overflow:hidden; background:#f7f5ef; padding:38px 22px 30px; box-shadow:0 18px 60px rgba(0,0,0,.08); }
.invite-header { text-align:center; }
.invite-header h1 { margin:0; font-family:Georgia,'Times New Roman',serif; font-size:clamp(42px,12vw,60px); font-weight:400; letter-spacing:.035em; }
.invite-header p { margin:7px 0 22px; font-family:Georgia,'Times New Roman',serif; font-size:20px; letter-spacing:.24em; }
.heart-rule { display:flex; align-items:center; justify-content:center; gap:12px; margin-top:8px; }
.heart-rule span { width:52px; height:1px; background:#777; }
.heart-rule b { font-size:15px; }
.hero-button { position:relative; z-index:1; display:block; width:100%; padding:0; border:0; border-radius:10px; overflow:hidden; background:transparent; cursor:pointer; }
.hero-button img { display:block; width:100%; aspect-ratio:1/1; object-fit:cover; }
.paper-tear {
  position: relative;
  z-index: 4;
  display: block;
  width: calc(100% + 44px);
  max-width: none;
  height: auto;
  margin: -22px -22px 0;
  pointer-events: none;
}
.welcome-copy { margin-top:5px; text-align:center; }
.welcome-copy h2 { margin:0; font-family:Georgia,'Times New Roman',serif; font-size:clamp(38px,11vw,52px); font-weight:400; letter-spacing:.23em; text-indent:.23em; }
.subtitle { margin:10px 0 0; font-size:13px; letter-spacing:.31em; text-indent:.31em; }
.heart { display:block; margin:18px 0 16px; font-size:20px; }
.intro { margin:0 auto; max-width:330px; white-space:pre-line; font-family:Georgia,'Times New Roman',serif; font-size:22px; font-style:italic; line-height:1.45; }
.start-button { display:block; width:82%; min-height:68px; margin:28px auto 0; border:0; border-radius:8px; background:#111; color:#fff; font-family:Georgia,'Times New Roman',serif; font-size:17px; letter-spacing:.16em; cursor:pointer; box-shadow:0 10px 22px rgba(0,0,0,.12); }
.allowance { display:flex; align-items:center; justify-content:center; gap:12px; margin:24px 0 0; font-size:13px; letter-spacing:.2em; }
.allowance svg { width:28px; fill:none; stroke:#111; stroke-width:1.5; }
@media (max-height:780px) { .invite-card{padding-top:24px}.invite-header p{margin-bottom:14px}.paper-tear{margin-top:-17px}.heart{margin:12px 0}.intro{font-size:19px}.start-button{min-height:58px;margin-top:20px}.allowance{margin-top:16px} }
</style>
