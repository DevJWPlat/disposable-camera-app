<script setup>
import { useClassicEditorial } from './useClassicEditorial.js'

const { event, copy, vars, dateLabel, heroUrl, paperRip, fill } = useClassicEditorial()
</script>

<template>
  <main class="ce ce-landing" :style="vars">
    <div class="ce-inner">
      <header>
        <h1 class="ce-names">{{ event.title }}</h1>
        <div class="ce-heart-rule" aria-hidden="true"><span></span><b>♥</b><span></span></div>
        <p class="ce-date">{{ dateLabel }}</p>
      </header>

      <div class="ce-landing__hero">
        <img v-if="heroUrl" :src="heroUrl" alt="" />
        <span v-else class="ce-landing__hero-empty"></span>
      </div>
      <img class="ce-landing__tear" :src="paperRip" alt="" aria-hidden="true" />

      <section class="ce-landing__welcome">
        <h2>{{ copy.welcome }}</h2>
        <p class="ce-landing__subtitle">{{ copy.subtitle }}</p>
        <b class="ce-landing__heart" aria-hidden="true">♥</b>
        <p class="ce-italic">{{ fill(copy.intro) }}</p>
      </section>

      <RouterLink class="ce-button" to="/camera">{{ copy.cta }}</RouterLink>

      <p class="ce-allowance">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h2.2l1.2-2h3.2l1.2 2H17a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Zm5 3.1a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /></svg>
        <span>{{ event.maxShots }} PHOTOS PER GUEST</span>
      </p>
    </div>
  </main>
</template>

<style>
.ce-landing__hero {
  position: relative;
  z-index: 1;
  width: 100%;
  margin-top: 18px;
  overflow: hidden;
  border-radius: 10px;
}

.ce-landing__hero img,
.ce-landing__hero-empty {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  background: #e9e5db;
}

/* The torn paper edge overlaps the bottom of the photo. */
.ce-landing__tear {
  position: relative;
  z-index: 2;
  display: block;
  width: calc(100% + 44px);
  max-width: none;
  height: auto;
  margin: -22px -22px 0;
  pointer-events: none;
}

.ce-landing__welcome {
  margin-top: 4px;
}

.ce-landing__welcome h2 {
  margin: 0;
  font-family: var(--ce-serif);
  font-size: clamp(36px, 11vw, 52px);
  font-weight: 400;
  letter-spacing: 0.23em;
  text-indent: 0.23em;
}

.ce-landing__subtitle {
  margin: 10px 0 0;
  font-size: 13px;
  letter-spacing: 0.31em;
  text-indent: 0.31em;
}

.ce-landing__heart {
  display: block;
  margin: 16px 0 14px;
  font-size: 20px;
  font-weight: 400;
}

@media (max-height: 780px) {
  .ce-landing { padding-top: 24px; }
  .ce-landing__hero { margin-top: 12px; }
  .ce-landing__tear { margin-top: -17px; }
  .ce-landing__heart { margin: 10px 0; }
  .ce-landing .ce-italic { font-size: 19px; }
  .ce-landing .ce-button { margin-top: 20px; padding: 18px 16px; }
  .ce-landing .ce-allowance { margin-top: 16px; }
}
</style>
