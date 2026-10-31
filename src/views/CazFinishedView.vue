<script setup>
import { eventConfig } from '@/config/event.js'
</script>

<template>
  <main class="finished">
    <section class="card">
      <p class="eyebrow">{{ eventConfig.copy.finished.eyebrow }}</p>
      <h1>{{ eventConfig.copy.finished.title }}</h1>
      <div class="heart-rule"><span></span><b>♥</b><span></span></div>
      <h2>{{ eventConfig.copy.finished.subtitle }}</h2>
      <p class="body">{{ eventConfig.copy.finished.body }}</p>
      <div class="camera-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M7 7h2.2l1.2-2h3.2l1.2 2H17a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Zm5 3.1a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/></svg>
        <span>25 / 25</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.finished{min-height:100svh;display:grid;place-items:center;background:#efeee9;padding:24px;color:#111}.card{width:min(100%,430px);min-height:min(760px,calc(100svh - 48px));display:flex;flex-direction:column;justify-content:center;background:#faf9f4;padding:44px 30px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.08)}.eyebrow{margin:0;font-size:11px;letter-spacing:.24em}.card h1{margin:26px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:58px;font-weight:400;letter-spacing:.16em;text-indent:.16em}.heart-rule{display:flex;align-items:center;justify-content:center;gap:12px;margin:20px 0}.heart-rule span{width:58px;height:1px;background:#777}.card h2{margin:0;font-size:13px;font-weight:500;letter-spacing:.23em}.body{max-width:330px;margin:28px auto 0;color:#66645f;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-style:italic;line-height:1.55}.camera-mark{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:46px;font-size:13px;letter-spacing:.2em}.camera-mark svg{width:30px;fill:none;stroke:#111;stroke-width:1.4}
@media(max-width:430px){.finished{padding:0}.card{min-height:100svh;box-shadow:none}.card h1{font-size:48px}}
</style>
