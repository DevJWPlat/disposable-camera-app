<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import leopardPattern from '@/assets/images/leopard-pattern.png'
import leopard from '@/assets/images/leopard.png'
import leopardGold from '@/assets/images/leopard-gold.png'


const router = useRouter()

const isDev = import.meta.env.DEV

const STORAGE_KEYS = {
  deviceToken: 'paul_60_camera_device_token',
  sessionId: 'paul_60_camera_session_id',
  guestName: 'paul_60_guest_name',
}

const guestName = computed(() => {
  return localStorage.getItem(STORAGE_KEYS.guestName) || 'Guest'
})

function resetForTesting() {
  localStorage.removeItem(STORAGE_KEYS.deviceToken)
  localStorage.removeItem(STORAGE_KEYS.sessionId)

  router.replace('/camera')
}
</script>

<template>
  <main
    class="finished-page"
    :style="{
      '--leopard-background': `url(${leopardPattern})`,
    }"
  >
    <section class="finished-shell">
      <div
        class="leopard-header"
        aria-hidden="true"
      ></div>

      <header class="finished-header">
        <div class="film-details">
          <span>PP 60</span>
          <span>ISO 400</span>
        </div>

        <p class="eyebrow">
          Paul’s disposable camera
        </p>

        <h1>
          Roll
          <span>complete</span>
        </h1>
      </header>

      <section class="finished-content">
        <div class="completed-film">
          <div
            class="film-edge film-edge--left"
            aria-hidden="true"
          >
            <span>25 EXP</span>
            <span>PP 60</span>
          </div>

          <div class="film-centre">
            <p class="film-status">
              Exposures remaining
            </p>

            <div
              class="zero-counter"
              aria-label="Zero shots remaining"
            >
              <span>0</span>
              <span>0</span>
            </div>

            <p class="remaining-label">
              Shots remaining
            </p>

            <div class="developed-mark">
              <img class="leopard-gold" :src="leopardGold" alt="Leopard" />

              <span>Film exposed</span>
            </div>
          </div>

          <div
            class="film-edge film-edge--right"
            aria-hidden="true"
          >
            <i v-for="index in 5" :key="index"></i>
          </div>
        </div>

        <div class="thank-you">
          <p class="guest-name">
            That’s a wrap, {{ guestName }}.
          </p>

          <h2>
            Your memories are safely stored.
          </h2>

          <p>
            Thank you for helping capture Paul’s
            60th celebration. The photographs will
            remain hidden while the disposable film
            is being developed.
          </p>
        </div>
      </section>

      <footer class="finished-footer">
        <div class="development-ticket">
          <span class="ticket-number">
            <small>Roll</small>
            <strong>25</strong>
          </span>

          <span class="ticket-message">
            Awaiting development
          </span>

          <span
            class="ticket-mark"
            aria-hidden="true"
          >
            <img class="leopard-mark" :src="leopard" alt="Leopard" />
          </span>
        </div>

        <p class="footer-message">
          Disposable memories last a lifetime
        </p>

        <button
          v-if="isDev"
          type="button"
          class="reset-button"
          @click="resetForTesting"
        >
          Dev: start a new camera roll
        </button>
      </footer>
    </section>
  </main>
</template>

<style scoped lang="scss">
.finished-page {
  --black: #090907;
  --panel: #11110e;
  --cream: #eadfc9;
  --muted: #a99b84;
  --gold: #c7a15a;
  --dark-gold: #755728;

  position: relative;
  min-height: 100svh;
  overflow: hidden;
  background:
    linear-gradient(
      120deg,
      transparent 0 42%,
      rgba(255, 255, 255, 0.012) 50%,
      transparent 58%
    ),
    var(--panel);
  color: var(--cream);
}

.finished-page::before {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.2'/%3E%3C/svg%3E");
  content: '';
  opacity: 0.18;
  pointer-events: none;
}

.finished-shell {
  position: relative;
  isolation: isolate;
  display: flex;
  min-height: 100svh;
  width: min(100%, 30rem);
  margin: 0 auto;
  padding:
    max(1rem, env(safe-area-inset-top))
    1.2rem
    max(0.8rem, env(safe-area-inset-bottom));
  flex-direction: column;
  overflow: hidden;
}

.leopard-header {
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
  width: 100%;
  height: 11rem;
  opacity: 0.65;
  background-image: var(--leopard-background);
  background-position: top center;
  background-repeat: no-repeat;
  background-size: cover;
  filter: contrast(1.08);
  mask-image: linear-gradient(
    to bottom,
    black 0%,
    black 48%,
    transparent 100%
  );
  pointer-events: none;
}

.finished-header {
  position: relative;
  z-index: 1;
  flex: none;
  text-align: center;
}

.film-details {
  display: flex;
  margin-bottom: 0.8rem;
  justify-content: space-between;
  color: rgba(199, 161, 90, 0.64);
  font-size: 0.48rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.eyebrow {
  margin: 0 0 0.45rem;
  color: var(--gold);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}

.leopard-gold {
  width: 30px;
}

h1 {
  margin: 0;
  color: var(--cream);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.2rem, 10vw, 3.2rem);
  font-weight: 400;
  line-height: 0.88;
  text-transform: uppercase;
}

h1 span {
  display: block;
  margin-top: 0.18rem;
  color: var(--gold);
  font-size: 0.75em;
}

.finished-content {
  display: flex;
  padding: 1rem 0;
  flex: 1;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.completed-film {
  position: relative;
  display: grid;
  width: 100%;
  min-height: 16rem;
  grid-template-columns: 1.4rem minmax(0, 1fr) 1.4rem;
  overflow: hidden;
  border: 2px solid var(--gold);
  background: #080806;
  box-shadow:
    inset 0 0 0 4px #080806,
    inset 0 0 0 5px rgba(199, 161, 90, 0.55),
    0 0.8rem 2rem rgba(0, 0, 0, 0.4);
}

.completed-film::after {
  position: absolute;
  z-index: 3;
  inset: 0;
  background:
    radial-gradient(
      ellipse at center,
      transparent 48%,
      rgba(0, 0, 0, 0.4) 100%
    ),
    linear-gradient(
      135deg,
      transparent 45%,
      rgba(199, 161, 90, 0.05) 50%,
      transparent 55%
    );
  content: '';
  pointer-events: none;
}

.film-edge {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-around;
  color: var(--gold);
  font-size: 0.46rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  writing-mode: vertical-rl;
}

.film-edge--left {
  border-right: 1px solid rgba(199, 161, 90, 0.5);
  transform: rotate(180deg);
}

.film-edge--right {
  border-left: 1px solid rgba(199, 161, 90, 0.5);
}

.film-edge i {
  width: 0.36rem;
  height: 0.55rem;
  border: 1px solid var(--gold);
}

.film-centre {
  position: relative;
  z-index: 2;
  display: flex;
  margin: 0.45rem;
  border: 1px solid rgba(199, 161, 90, 0.48);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background:
    radial-gradient(
      circle at 50% 45%,
      rgba(199, 161, 90, 0.1),
      transparent 35%
    ),
    repeating-linear-gradient(
      125deg,
      #11110e 0 3px,
      #0d0d0b 3px 6px
    );
}

.film-status {
  margin: 0 0 0.5rem;
  color: var(--gold);
  font-size: 0.48rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.zero-counter {
  display: flex;
  color: var(--cream);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(4.4rem, 22vw, 6.6rem);
  line-height: 0.8;
  letter-spacing: -0.08em;
}

// .zero-counter span:first-child {
//   color: rgba(234, 223, 201, 0.38);
// }

.remaining-label {
  margin: 0.8rem 0 0;
  color: var(--gold);
  font-size: 0.72rem;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.developed-mark {
  display: flex;
  margin-top: 1.2rem;
  align-items: center;
  gap: 0.55rem;
  color: var(--muted);
  font-size: 0.48rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.developed-mark svg {
  width: 1.45rem;
  fill: none;
  stroke: var(--gold);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.4;
}

.leopard-mark {
  width: 75%;
}

.thank-you {
  max-width: 23rem;
  margin-top: 1.35rem;
  text-align: center;
}

.guest-name {
  margin: 0;
  color: var(--gold);
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.thank-you h2 {
  margin: 0.5rem 0 0;
  color: var(--cream);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.2;
}

.thank-you > p:last-child {
  margin: 0.65rem 0 0;
  color: var(--muted);
  font-size: 0.7rem;
  line-height: 1.55;
}

.finished-footer {
  flex: none;
}

.development-ticket {
  display: grid;
  width: 100%;
  min-height: 4.2rem;
  grid-template-columns: 3.8rem minmax(0, 1fr) 2.8rem;
  overflow: hidden;
  background:
    linear-gradient(
      100deg,
      rgba(255, 255, 255, 0.1),
      transparent 28% 72%,
      rgba(66, 37, 6, 0.15)
    ),
    var(--gold);
  color: #17130c;
  text-transform: uppercase;
}

.ticket-number,
.ticket-mark {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ticket-number {
  position: relative;
  border-right: 1px dashed rgba(23, 19, 12, 0.58);
  flex-direction: column;
}

.ticket-number::before,
.ticket-number::after {
  position: absolute;
  right: -0.28rem;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--panel);
  content: '';
}

.ticket-number::before {
  top: -0.28rem;
}

.ticket-number::after {
  bottom: -0.28rem;
}

.ticket-number small {
  font-size: 0.42rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.ticket-number strong {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.55rem;
  font-weight: 400;
  line-height: 1;
}

.ticket-message {
  display: grid;
  margin: 0.6rem 0.5rem;
  border: 1px solid rgba(23, 19, 12, 0.52);
  place-items: center;
  font-size: clamp(0.62rem, 2.8vw, 0.78rem);
  font-weight: 900;
  letter-spacing: 0.08em;
}

.ticket-mark {
  border-left: 1px solid rgba(23, 19, 12, 0.32);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1rem;
}

.footer-message {
  margin: 0.65rem 0 0;
  color: var(--gold);
  font-size: 0.5rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-align: center;
  text-transform: uppercase;
}

.reset-button {
  display: block;
  margin: 0.55rem auto 0;
  border: 0;
  background: transparent;
  padding: 0.3rem 0.7rem;
  color: #756b59;
  font-size: 0.5rem;
  letter-spacing: 0.09em;
  text-decoration: underline;
  text-underline-offset: 0.2rem;
  cursor: pointer;
  text-transform: uppercase;
}

@media (max-height: 740px) {
  .finished-shell {
    padding-top: 0.55rem;
  }

  .film-details {
    margin-bottom: 0.35rem;
  }

  .finished-content {
    padding: 0.55rem 0;
  }

  .completed-film {
    min-height: 12rem;
  }

  .zero-counter {
    font-size: 4rem;
  }

  .developed-mark {
    margin-top: 0.7rem;
  }

  .thank-you {
    margin-top: 0.75rem;
  }

  .thank-you > p:last-child {
    margin-top: 0.4rem;
  }

  .development-ticket {
    min-height: 3.8rem;
  }
}
</style>