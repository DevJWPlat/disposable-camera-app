<script setup>
import { useClassicEditorial } from './useClassicEditorial.js'

const { event, copy, vars, dateLabel, fill } = useClassicEditorial()
</script>

<template>
  <main class="ce ce-finished" :style="vars">
    <div class="ce-inner ce-finished__inner">
      <section class="ce-finished__card">
        <p class="ce-eyebrow">{{ event.title }} · {{ dateLabel }}</p>
        <h1 class="ce-finished__title">{{ copy.finishedTitle }}</h1>
        <div class="ce-heart-rule" aria-hidden="true"><span></span><b>♥</b><span></span></div>
        <h2 class="ce-finished__subtitle">{{ copy.finishedSubtitle }}</h2>
        <p class="ce-italic ce-finished__body">{{ fill(copy.finishedBody) }}</p>
        <div class="ce-finished__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M7 7h2.2l1.2-2h3.2l1.2 2H17a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Zm5 3.1a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /></svg>
          <span>{{ event.maxShots }} / {{ event.maxShots }}</span>
        </div>
      </section>
    </div>
  </main>
</template>

<style>
.ce-finished__inner {
  justify-content: center;
}

.ce-finished__card {
  width: 100%;
  border: 1px solid var(--ce-line);
  background: var(--ce-card);
  padding: 42px 24px 36px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.06);
}

.ce-finished__title {
  margin: 22px 0 0;
  font-family: var(--ce-serif);
  font-size: clamp(32px, 9.6vw, 54px);
  font-weight: 400;
  letter-spacing: 0.16em;
  white-space: nowrap;
  text-indent: 0.16em;
}

.ce-finished__card .ce-heart-rule {
  margin-top: 14px;
}

.ce-finished__subtitle {
  margin: 16px 0 0;
  font-size: clamp(10.5px, 3.1vw, 12px);
  font-weight: 400;
  letter-spacing: 0.22em;
  text-indent: 0.22em;
  text-wrap: balance;
}

.ce-finished__body {
  margin-top: 22px;
  font-size: 18px;
}

.ce-finished__mark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 28px;
  font-size: 12px;
  letter-spacing: 0.2em;
}

.ce-finished__mark svg {
  width: 26px;
  height: 26px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
}
</style>
