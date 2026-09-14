<script setup>
import { useRouter } from 'vue-router'
import { eventConfig } from '@/config/event.js'

import lostLogo from '@/assets/events/sophies-last-rodeo/sophie-got-lost.png'
import photoFrame from '@/assets/events/sophies-last-rodeo/polaroid-frame.png'
import cowboyHat from '@/assets/events/sophies-last-rodeo/cowboy-hat.png'
import horseshoe from '@/assets/events/sophies-last-rodeo/horseshoe.png'
import rope from '@/assets/events/sophies-last-rodeo/rope.png'
import sparkles from '@/assets/events/sophies-last-rodeo/sparkles.png'
import desertFooter from '@/assets/events/sophies-last-rodeo/desert-footer.png'
import shotsTicket from '@/assets/events/sophies-last-rodeo/shots-ticket-50.png'

const router = useRouter()

const heroImages = eventConfig.heroImages || []
const heroImage = heroImages.length
  ? heroImages[Math.floor(Math.random() * heroImages.length)]
  : eventConfig.heroImage

function goHome() {
  router.push('/')
}
</script>

<template>
  <main class="not-found-page">
    <section class="poster">
      <div class="grain" aria-hidden="true"></div>

      <img class="sparkles" :src="sparkles" alt="" aria-hidden="true" />
      <img class="horseshoe" :src="horseshoe" alt="" aria-hidden="true" />
      <img class="rope" :src="rope" alt="" aria-hidden="true" />

      <div class="photo-stage">
        <div class="photo-window">
          <img
            v-if="heroImage"
            :src="heroImage"
            :alt="`${eventConfig.title} photo`"
            class="hero-photo"
          />

          <div v-else class="photo-placeholder">
            <span>{{ eventConfig.copy.landing.photoPlaceholder }}</span>
            <b>♡</b>
          </div>
        </div>

        <img class="photo-frame" :src="photoFrame" alt="" aria-hidden="true" />
        <img class="cowboy-hat" :src="cowboyHat" alt="" aria-hidden="true" />
      </div>

      <section class="lost-logo-stage">
        <img
          class="lost-logo"
          :src="lostLogo"
          alt="Sophie's got lost. That page doesn't exist. Back to the beginning."
        />
      </section>

      <button class="home-button" type="button" @click="goHome">
        <span>Back to the beginning</span>
      </button>

      <section class="desert-stage">
        <img class="desert-art" :src="desertFooter" alt="" aria-hidden="true" />
        <div class="desert-shadow" aria-hidden="true"></div>

        <p class="bottom-note bottom-note--left">
          {{ eventConfig.copy.landing.sideNoteLeft }}
        </p>
        <p class="bottom-note bottom-note--right">
          {{ eventConfig.copy.landing.sideNoteRight }}
        </p>
        <p class="footer-label">{{ eventConfig.copy.landing.footer }}</p>
      </section>
    </section>
  </main>
</template>

<style scoped>
.not-found-page {
  display: grid;
  width: 100%;
  height: 100svh;
  overflow: hidden;
  place-items: center;
  background:
    radial-gradient(circle at 50% -10%, rgba(216, 106, 134, .18), transparent 34rem),
    #151515;
}

.poster {
  position: relative;
  isolation: isolate;
  width: min(100vw, calc(100svh * 0.4621));
  height: min(100svh, calc(100vw / 0.4621));
  max-width: 430px;
  max-height: 930px;
  overflow: hidden;
  background:
    linear-gradient(
      180deg,
      rgba(255, 245, 242, 1) 0%,
      rgba(253, 198, 182, 1) 40%
    );
  color: #2a1e1c;
}

.grain {
  position: absolute;
  inset: 0;
  z-index: 30;
  pointer-events: none;
  opacity: .08;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.48'/%3E%3C/svg%3E");
}

.sparkles {
  position: absolute;
  z-index: 2;
  top: -10%;
  left: 50%;
  width: 100%;
  transform: translateX(-50%);
  opacity: .72;
  pointer-events: none;
}

.horseshoe {
  position: absolute;
  z-index: 6;
  top: 22%;
  left: -1.5%;
  width: 17%;
  transform: rotate(-13deg);
  filter: drop-shadow(0 5px 5px rgba(71,39,33,.12));
}

.rope {
  position: absolute;
  z-index: 4;
  top: 28%;
  right: 0;
  width: 20%;
  height: 40%;
  object-fit: contain;
  object-position: top right;
  transform: rotate(-25deg);
}

.photo-stage {
  position: absolute;
  z-index: 7;
  top: 5.2%;
  left: 50%;
  width: 76%;
  aspect-ratio: 1 / 1;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transform: translateX(-50%);
}

.photo-window {
  position: absolute;
  top: 7.5%;
  left: 16%;
  z-index: 4;
  width: 68%;
  height: 72%;
  overflow: hidden;
  background: transparent;
  transform: rotate(-2.7deg);
}

.hero-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
}

.photo-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-content: center;
  justify-items: center;
  gap: .45em;
  padding: 8%;
  color: #e27f98;
  font-family: "Snell Roundhand", "Brush Script MT", "Segoe Script", cursive;
  font-size: clamp(18px, 6.3vw, 30px);
  line-height: 1.12;
  text-align: center;
}

.photo-placeholder span {
  white-space: pre-line;
}

.photo-placeholder b {
  font-size: 1.55em;
  font-weight: 400;
}

.photo-frame {
  position: absolute;
  inset: 0;
  z-index: 5;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 10px 14px rgba(76,37,31,.13));
}

.cowboy-hat {
  position: absolute;
  z-index: 7;
  top: -19%;
  right: -7%;
  width: 58%;
  height: auto;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 9px 8px rgba(76,37,31,.16));
}

.lost-logo-stage {
  position: absolute;
  z-index: 10;
  top: 39.2%;
  left: 50%;
  width: 91%;
  transform: translateX(-50%);
}

.lost-logo {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 5px 5px rgba(72, 40, 31, .08));
}

.ticket-stage {
  position: absolute;
  z-index: 10;
  top: 70.2%;
  left: 50%;
  width: 88%;
  height: 11.6%;
  transform: translateX(-50%);
}

.shots-ticket {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 59%;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 5px 5px rgba(64,31,27,.1));
}

.home-button {
  position: absolute;
  z-index: 11;
  top: 80%;
  left: 50%;
  display: grid;
  width: 78%;
  min-height: 7.4%;
  padding: 0 8%;
  transform: translateX(-50%);
  border: 3px solid #2a1e1c;
  border-radius: 999px;
  background:
    linear-gradient(180deg, #df6380 0%, #ce4968 100%);
  box-shadow:
    0 0 0 3px #d9aa5f,
    inset 0 0 0 2px rgba(255,255,255,.32);
  color: #fff7ec;
  cursor: pointer;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(11px, 3.25vw, 15px);
  font-weight: 900;
  letter-spacing: .14em;
  place-items: center;
  text-transform: uppercase;
  transition: transform .15s ease, filter .15s ease;
}

.home-button:hover {
  transform: translateX(-50%) translateY(-2px);
  filter: brightness(1.03);
}

.home-button:active {
  transform: translateX(-50%);
}

.desert-stage {
  position: absolute;
  z-index: 5;
  right: 0;
  bottom: 0;
  left: 0;
  height: 23%;
}

.desert-art {
  position: absolute;
  inset: auto 0 0;
  width: 100%;
  height: 140%;
  object-fit: cover;
  object-position: center 70%;
  transform: scale(1.36);
  transform-origin: center bottom;
}

.desert-shadow {
  position: absolute;
  inset: auto 0 0;
  height: 43%;
  background:
    linear-gradient(180deg, transparent, rgba(23,17,15,.96) 55%);
}

.bottom-note {
  position: absolute;
  z-index: 9;
  bottom: 8%;
  width: 19%;
  margin: 0;
  white-space: pre-line;
  color: #ef829b;
  font-family: "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive;
  font-size: clamp(7px, 2vw, 9px);
  font-weight: 800;
  line-height: .94;
  text-transform: uppercase;
}

.bottom-note--left {
  left: 4%;
  transform: rotate(-8deg);
}

.bottom-note--right {
  right: 4%;
  text-align: right;
  transform: rotate(7deg);
}

.footer-label {
  position: absolute;
  right: 0;
  bottom: 9%;
  left: 0;
  margin: 0;
  color: #f9eadc;
  font-size: clamp(5px, 1.65vw, 7px);
  font-weight: 900;
  letter-spacing: .28em;
  text-align: center;
  text-transform: uppercase;
}

@media (min-width: 521px) {
  .poster {
    box-shadow: 0 28px 80px rgba(0,0,0,.4);
  }
}

@media (max-width: 520px) {
  .poster {
    width: 100vw;
    height: 100svh;
    max-width: none;
    max-height: none;
  }
}
</style>
