<script setup>
import { useRouter } from 'vue-router'
import { eventConfig } from '@/config/event.js'

import logo from '@/assets/events/sophies-last-rodeo/sophie-logo.png'
import sparkles from '@/assets/events/sophies-last-rodeo/sparkles.png'
import horseshoe from '@/assets/events/sophies-last-rodeo/horseshoe.png'
import rope from '@/assets/events/sophies-last-rodeo/rope.png'
import desertFooter from '@/assets/events/sophies-last-rodeo/desert-footer.png'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <main class="not-found-page">
    <section class="not-found-poster">
      <div class="grain" aria-hidden="true"></div>
      <img class="sparkles" :src="sparkles" alt="" aria-hidden="true" />
      <img class="horseshoe" :src="horseshoe" alt="" aria-hidden="true" />
      <img class="rope" :src="rope" alt="" aria-hidden="true" />

      <img class="event-logo" :src="logo" :alt="eventConfig.title" />

      <section class="error-card">
        <p class="error-kicker">Frame not found</p>
        <strong>404</strong>
        <h1>Wrong trail, cowgirl.</h1>
        <p>Looks like this shot didn’t make it onto Sophie’s camera roll.</p>

        <button type="button" class="home-button" @click="goHome">
          Back to the beginning
        </button>
      </section>

      <section class="desert-stage">
        <img class="desert-art" :src="desertFooter" alt="" aria-hidden="true" />
        <div class="desert-shadow" aria-hidden="true"></div>
        <p class="footer-label">{{ eventConfig.copy.landing.footer }}</p>
      </section>
    </section>
  </main>
</template>

<style scoped>
.not-found-page {
  display:grid;
  min-height:100svh;
  place-items:center;
  overflow:hidden;
  background:radial-gradient(circle at 50% -10%,rgba(216,106,134,.18),transparent 34rem),#151515;
}
.not-found-poster {
  position:relative;
  isolation:isolate;
  width:min(100vw,430px);
  height:100svh;
  min-height:680px;
  overflow:hidden;
  background:linear-gradient(180deg,#fff8f2 0%,#f8ece5 44%,#f6d7d8 73%,#e99aaa 100%);
  color:#2a1e1c;
}
.grain { position:absolute; inset:0; z-index:30; pointer-events:none; opacity:.08; mix-blend-mode:multiply; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.48'/%3E%3C/svg%3E"); }
.sparkles { position:absolute; z-index:2; top:-4%; left:50%; width:100%; transform:translateX(-50%); opacity:.72; }
.horseshoe { position:absolute; z-index:4; top:18%; left:-4%; width:20%; transform:rotate(-13deg); }
.rope { position:absolute; z-index:3; top:14%; right:-5%; width:24%; height:45%; object-fit:contain; transform:rotate(-20deg); }
.event-logo { position:relative; z-index:8; display:block; width:86%; margin:5vh auto 0; }
.error-card { position:relative; z-index:10; width:78%; margin:-2vh auto 0; padding:22px 18px; border:2px solid #8f4d59; background:rgba(255,248,242,.82); box-shadow:0 0 0 3px rgba(216,167,91,.62),0 18px 36px rgba(95,47,46,.14); text-align:center; backdrop-filter:blur(5px); }
.error-kicker { margin:0; color:#c55370; font-size:10px; font-weight:900; letter-spacing:.18em; text-transform:uppercase; }
.error-card strong { display:block; margin:4px 0 -4px; color:#2a1e1c; font-family:Georgia,'Times New Roman',serif; font-size:82px; font-weight:700; line-height:1; }
.error-card h1 { margin:10px 0 0; color:#2a1e1c; font-family:Georgia,'Times New Roman',serif; font-size:27px; line-height:1.1; }
.error-card p:not(.error-kicker) { margin:9px auto 0; max-width:250px; color:#7e625a; font-size:13px; line-height:1.45; }
.home-button { width:100%; min-height:56px; margin-top:18px; border:3px solid #2c1d19; border-radius:999px; background:#d95475; box-shadow:0 0 0 3px #d9aa5f,inset 0 0 0 2px rgba(255,255,255,.42); color:#fff8ef; cursor:pointer; font-family:Georgia,'Times New Roman',serif; font-size:14px; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }
.desert-stage { position:absolute; z-index:5; right:0; bottom:0; left:0; height:28%; overflow:hidden; }
.desert-art { position:absolute; inset:auto 0 0; width:100%; height:130%; object-fit:cover; object-position:center 70%; transform:scale(1.35); transform-origin:center bottom; }
.desert-shadow { position:absolute; inset:auto 0 0; height:44%; background:linear-gradient(180deg,transparent,rgba(23,17,15,.96) 55%); }
.footer-label { position:absolute; right:0; bottom:9%; left:0; margin:0; color:#f9eadc; font-size:7px; font-weight:900; letter-spacing:.28em; text-align:center; text-transform:uppercase; }
@media (max-height:760px) { .event-logo { width:72%; margin-top:2vh; } .error-card { margin-top:-4vh; } .desert-stage { height:24%; } }
</style>
