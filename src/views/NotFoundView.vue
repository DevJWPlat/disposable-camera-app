<script setup>
import { useRouter } from 'vue-router'

import leopardPattern from '@/assets/images/leopard-pattern.png'
import leopard from '@/assets/images/leopard.png'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <main
    class="not-found-page"
    :style="{
      '--leopard-background': `url(${leopardPattern})`,
    }"
  >
    <section class="not-found-shell">
      <div
        class="leopard-header"
        aria-hidden="true"
      ></div>

      <header class="page-header">
        <div class="film-details">
          <span>PP 60</span>
          <span>ISO 400</span>
        </div>

        <p class="eyebrow">
          Paul’s disposable camera
        </p>

        <h1>
          Lost
          <span>exposure</span>
        </h1>
      </header>

      <section class="not-found-content">
        <div class="film-frame">
          <div
            class="film-edge film-edge--left"
            aria-hidden="true"
          >
            <span>ERROR</span>
            <span>PP 60</span>
          </div>

          <div class="film-centre">
            <p class="frame-label">
              Frame not found
            </p>

            <div
              class="error-number"
              aria-label="Error 404"
            >
              404
            </div>

            <div
              class="missing-mark"
              aria-hidden="true"
            >
              <span></span>
              <i></i>
              <span></span>
            </div>

            <h2>Page not found</h2>

            <p class="frame-message">
              Looks like this shot didn’t make it
              onto the camera roll.
            </p>
          </div>

          <div
            class="film-edge film-edge--right"
            aria-hidden="true"
          >
            <i v-for="index in 5" :key="index"></i>
          </div>
        </div>
      </section>

      <footer class="not-found-footer">
        <button
          type="button"
          class="home-ticket"
          @click="goHome"
        >
          <span class="ticket-number">
            <small>Frame</small>
            <strong>00</strong>
          </span>

          <span class="ticket-action">
            Back to the beginning
          </span>

          <span
            class="ticket-mark"
            aria-hidden="true"
          >
            <img class="leopard-mark" :src="leopard" alt="Leopard" />
          </span>
        </button>

        <p class="footer-message">
          Disposable memories last a lifetime
        </p>
      </footer>
    </section>
  </main>
</template>

<style scoped lang="scss">
.not-found-page {
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

.not-found-page::before {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.2'/%3E%3C/svg%3E");
  content: '';
  opacity: 0.18;
  pointer-events: none;
}

.not-found-shell {
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

.page-header {
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

.not-found-content {
  display: flex;
  padding: 1.2rem 0;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.film-frame {
  position: relative;
  display: grid;
  width: 100%;
  min-height: 24rem;
  grid-template-columns: 1.4rem minmax(0, 1fr) 1.4rem;
  overflow: hidden;
  border: 2px solid var(--gold);
  background: #080806;
  box-shadow:
    inset 0 0 0 4px #080806,
    inset 0 0 0 5px rgba(199, 161, 90, 0.55),
    0 0.8rem 2rem rgba(0, 0, 0, 0.4);
}

.film-frame::after {
  position: absolute;
  z-index: 3;
  inset: 0;
  background:
    radial-gradient(
      ellipse at center,
      transparent 45%,
      rgba(0, 0, 0, 0.44) 100%
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
      circle at 50% 46%,
      rgba(199, 161, 90, 0.11),
      transparent 34%
    ),
    repeating-linear-gradient(
      125deg,
      #11110e 0 3px,
      #0d0d0b 3px 6px
    );
  padding: 1.5rem;
  text-align: center;
}

.frame-label {
  margin: 0;
  color: var(--gold);
  font-size: 0.48rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.error-number {
  margin-top: 0.65rem;
  color: var(--cream);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(5rem, 25vw, 7.5rem);
  font-weight: 400;
  letter-spacing: -0.07em;
  line-height: 0.9;
  text-shadow:
    2px 2px rgba(199, 161, 90, 0.12),
    -2px -2px rgba(234, 223, 201, 0.04);
}

.missing-mark {
  display: flex;
  width: 100%;
  margin: 1rem 0;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
}

.missing-mark span {
  height: 1px;
  flex: 1;
  background: linear-gradient(
    to right,
    transparent,
    var(--dark-gold)
  );
}

.missing-mark span:last-child {
  background: linear-gradient(
    to left,
    transparent,
    var(--dark-gold)
  );
}

.missing-mark i {
  width: 0.55rem;
  height: 0.55rem;
  border: 1px solid var(--gold);
  transform: rotate(45deg);
}

.film-centre h2 {
  margin: 0;
  color: var(--gold);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.35rem;
  font-weight: 400;
}

.frame-message {
  max-width: 17rem;
  margin: 0.7rem 0 0;
  color: var(--muted);
  font-size: 0.72rem;
  line-height: 1.55;
}

.not-found-footer {
  flex: none;
}

.leopard-mark {
  width: 75%;
}

.home-ticket {
  display: grid;
  width: 100%;
  min-height: 4.25rem;
  padding: 0;
  grid-template-columns: 3.8rem minmax(0, 1fr) 2.8rem;
  align-items: stretch;
  overflow: hidden;
  border-radius: 0;
  background:
    linear-gradient(
      100deg,
      rgba(255, 255, 255, 0.1),
      transparent 28% 72%,
      rgba(66, 37, 6, 0.15)
    ),
    var(--gold);
  color: #17130c;
  box-shadow: 0 0.6rem 1.4rem rgba(0, 0, 0, 0.32);
  cursor: pointer;
  text-transform: uppercase;
}

.home-ticket:active {
  transform: translateY(1px);
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
  font-size: 1.45rem;
  font-weight: 400;
  line-height: 1;
}

.ticket-action {
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

@media (max-height: 740px) {
  .not-found-shell {
    padding-top: 0.55rem;
  }

  .film-details {
    margin-bottom: 0.35rem;
  }

  .not-found-content {
    padding: 0.6rem 0;
  }

  .film-frame {
    min-height: 17rem;
  }

  .error-number {
    font-size: 4.5rem;
  }

  .missing-mark {
    margin: 0.65rem 0;
  }

  .home-ticket {
    min-height: 3.8rem;
  }
}
</style>