<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import leopardPattern from '@/assets/images/leopard-pattern.png'
import leopard from '@/assets/images/leopard.png' 
import paulPhoto from '@/assets/images/paul.png'

const router = useRouter()

const guestName = ref('')
const submitted = ref(false)

const STORAGE_KEYS = {
  guestName: 'paul_60_guest_name',
}

const cleanedGuestName = computed(() => guestName.value.trim().replace(/\s+/g, ' '))

const nameError = computed(() => {
  if (!submitted.value) return ''
  if (!cleanedGuestName.value) return 'Enter your name to begin.'
  if (cleanedGuestName.value.length < 2) return 'Enter at least 2 characters.'
  if (cleanedGuestName.value.length > 60) return 'Keep your name under 60 characters.'
  return ''
})

function beginCamera() {
  submitted.value = true

  if (nameError.value) return

  localStorage.setItem(STORAGE_KEYS.guestName, cleanedGuestName.value)
  router.push('/camera')
}

onMounted(() => {
  guestName.value = localStorage.getItem(STORAGE_KEYS.guestName) || ''
})
</script>

<template>
  <main class="landing-page">
    <section class="camera-card">
      <div
        class="leopard-print"
        :style="{ backgroundImage: `url(${leopardPattern})` }"
        aria-hidden="true"
      ></div>

      <header class="event-header">
        <p class="eyebrow">Paul Peters</p>

        <h1>
          <span>Celebrating</span>
          <strong>60 Years</strong>
          <span class="title-tail">of Paul</span>
        </h1>

        <div class="event-meta">
          <p>1 August <span>•</span> Masonic Hall, Leigh</p>
        </div>
      </header>

      <div class="film-frame">
        <div class="film-edge film-edge--left" aria-hidden="true">
          <span>ISO 400</span>
          <span>PP 60</span>
        </div>

        <div class="photo-frame">
          <img
            class="paul-photo"
            :src="paulPhoto"
            alt="Paul Peters"
          />

          <div class="photo-grain" aria-hidden="true"></div>
        </div>

        <div class="film-edge film-edge--right" aria-hidden="true">
          <i v-for="index in 4" :key="index"></i>
        </div>
      </div>

      <form class="guest-form" @submit.prevent="beginCamera">
        <label for="guest-name">Who’s behind the lens?</label>

        <div class="input-wrap">
          <input
            id="guest-name"
            v-model="guestName"
            type="text"
            name="guest-name"
            autocomplete="name"
            enterkeyhint="go"
            maxlength="60"
            placeholder="Enter your full name"
            :aria-invalid="Boolean(nameError)"
            :aria-describedby="nameError ? 'name-error' : undefined"
          />

          <span aria-hidden="true">✦</span>
        </div>

        <p
          v-if="nameError"
          id="name-error"
          class="name-error"
          role="alert"
        >
          {{ nameError }}
        </p>

        <button class="camera-ticket" type="submit">
          <span class="shot-stub">
            <strong>25</strong>
            <small>Shots</small>
          </span>

          <span class="start-label">Start the camera</span>

          <span class="ticket-mark" aria-hidden="true">
            <img class="leopard-mark-ticket" :src="leopard" alt="Leopard" />
          </span>
        </button>
      </form>

      <footer class="event-footer">
        <p class="tagline">
          <span></span>
          Disposable memories last a lifetime
          <span></span>
        </p>

        <RouterLink class="admin-link" to="/admin">
          Admin
        </RouterLink>
      </footer>
    </section>
  </main>
</template>

<style scoped lang="scss">
.landing-page {
  --black: #090907;
  --panel: #11110e;
  --cream: #eadfc9;
  --muted: #a99b84;
  --gold: #c7a15a;
  --dark-gold: #755728;

  position: relative;
  isolation: isolate;
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

.landing-page::before {
  position: fixed;
  z-index: -1;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.2'/%3E%3C/svg%3E");
  content: '';
  opacity: 0.18;
  pointer-events: none;
}

.camera-card {
  position: relative;
  isolation: isolate;
  display: flex;
  min-height: 100svh;
  width: min(100%, 30rem);
  margin: 0 auto;
  padding:
    max(1.15rem, env(safe-area-inset-top))
    1.25rem
    max(0.75rem, env(safe-area-inset-bottom));
  flex-direction: column;
  overflow: hidden;
  background:
    linear-gradient(
      120deg,
      transparent 0 42%,
      rgba(255, 255, 255, 0.012) 50%,
      transparent 58%
    ),
    var(--panel);
  box-shadow: 0 0 60px #000;
}

.camera-card::after {
  position: absolute;
  z-index: -1;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.2'/%3E%3C/svg%3E");
  content: '';
  opacity: 0.18;
  pointer-events: none;
}

.leopard-print {
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
  width: 100%;
  height: 9.5rem;
  opacity: 0.72;
  background-position: top center;
  background-repeat: no-repeat;
  background-size: cover;
  filter: contrast(1.08);
  mask-image: linear-gradient(
    to bottom,
    black 0%,
    black 52%,
    rgba(0, 0, 0, 0.72) 70%,
    transparent 100%
  );
  pointer-events: none;
}

.event-header {
  position: relative;
  z-index: 1;
  flex: none;
  text-align: center;
}

.eyebrow {
  margin: 0 0 0.55rem;
  color: var(--gold);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 400;
  letter-spacing: 0.025em;
  line-height: 0.88;
  text-transform: uppercase;
}

h1 > span,
h1 strong {
  display: block;
}

h1 > span:first-child {
  color: var(--gold);
  font-size: clamp(1.45rem, 6.4vw, 2rem);
}

h1 strong {
  margin: 0.13rem 0;
  color: var(--cream);
  font-size: clamp(2.75rem, 12vw, 4rem);
  font-weight: 400;
}

h1 .title-tail {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: var(--gold);
  font-size: clamp(1.2rem, 5.3vw, 1.65rem);
}

h1 .title-tail::before,
h1 .title-tail::after {
  height: 1px;
  flex: 1;
  background: linear-gradient(to right, transparent, var(--dark-gold));
  content: '';
}

h1 .title-tail::after {
  background: linear-gradient(to left, transparent, var(--dark-gold));
}

.event-meta {
  display: flex;
  margin-top: 0.55rem;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}



.event-meta p {
  margin: 0;
  color: #ddc894;
  font-size: clamp(0.58rem, 2.5vw, 0.7rem);
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.event-meta p span {
  padding: 0 0.25rem;
  color: var(--gold);
}

.film-frame {
  position: relative;
  display: grid;
  min-height: 13rem;
  margin-top: 0.75rem;
  grid-template-columns: 1.45rem minmax(0, 1fr) 1.45rem;
  flex: 1 1 15rem;
  overflow: hidden;
  border: 2px solid var(--gold);
  background: #080806;
  box-shadow:
    inset 0 0 0 4px #080806,
    inset 0 0 0 5px rgba(199, 161, 90, 0.55),
    0 0.6rem 1.5rem rgba(0, 0, 0, 0.35);
}

.film-edge {
  display: flex;
  align-items: center;
  justify-content: space-around;
  color: var(--gold);
  font-size: 0.48rem;
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
  width: 0.38rem;
  height: 0.58rem;
  border: 1px solid var(--gold);
}

.photo-frame {
  position: relative;
  margin: 0.45rem;
  overflow: hidden;
  border: 1px solid rgba(199, 161, 90, 0.48);
  background: #080806;
}

.paul-photo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 32%;
  filter:
    grayscale(1)
    contrast(1.08)
    brightness(0.88)
    sepia(0.08);
  transform: scale(1.01);
}

.photo-frame::before {
  position: absolute;
  z-index: 2;
  inset: 0;
  background:
    linear-gradient(
      135deg,
      transparent 43%,
      rgba(199, 161, 90, 0.07) 50%,
      transparent 57%
    ),
    radial-gradient(
      ellipse at center,
      transparent 42%,
      rgba(0, 0, 0, 0.44) 100%
    );
  content: '';
  pointer-events: none;
}

.photo-grain {
  position: absolute;
  z-index: 3;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='.25'/%3E%3C/svg%3E");
  mix-blend-mode: soft-light;
  opacity: 0.2;
  pointer-events: none;
}

.guest-form {
  flex: none;
}

.guest-form > label {
  display: block;
  margin: 0.7rem 0 0.35rem;
  color: #d8c9ac;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.82rem;
  text-align: center;
}

.input-wrap {
  position: relative;
}

.input-wrap input {
  width: 100%;
  height: 2.8rem;
  border: 1px solid rgba(199, 161, 90, 0.65);
  border-radius: 0;
  outline: none;
  background: rgba(0, 0, 0, 0.28);
  padding: 0 2.8rem 0 1rem;
  color: var(--cream);
  font-size: 0.9rem;
  text-align: left;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.input-wrap input::placeholder {
  color: #786e5d;
}

.input-wrap input:focus {
  border-color: #e0c27f;
  box-shadow: 0 0 0 3px rgba(199, 161, 90, 0.12);
}

.input-wrap input[aria-invalid='true'] {
  border-color: #c87669;
}

.input-wrap span {
  position: absolute;
  top: 50%;
  right: 1rem;
  color: var(--gold);
  transform: translateY(-50%);
}

.name-error {
  margin: 0.3rem 0 -0.15rem;
  color: #e29a8e;
  font-size: 0.65rem;
  text-align: center;
}

.camera-ticket {
  display: grid;
  width: 100%;
  min-height: 4rem;
  margin-top: 0.65rem;
  padding: 0;
  grid-template-columns: 4rem minmax(0, 1fr) 3.2rem;
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

.camera-ticket:active {
  transform: translateY(1px);
}

.leopard-mark-ticket {
  width: 75%;
}

.shot-stub,
.ticket-mark {
  display: flex;
  align-items: center;
  justify-content: center;
}

.shot-stub {
  position: relative;
  flex-direction: column;
  border-right: 1px dashed rgba(23, 19, 12, 0.58);
}

.shot-stub::before,
.shot-stub::after {
  position: absolute;
  right: -0.28rem;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--panel);
  content: '';
}

.shot-stub::before {
  top: -0.28rem;
}

.shot-stub::after {
  bottom: -0.28rem;
}

.shot-stub strong {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.7rem;
  font-weight: 400;
  line-height: 0.82;
}

.shot-stub small {
  margin-top: 0.28rem;
  font-size: 0.52rem;
  font-weight: 900;
  letter-spacing: 0.11em;
}

.start-label {
  display: grid;
  place-items: center;
  border: 1px solid rgba(23, 19, 12, 0.52);
  margin: 0.62rem 0.5rem;
  font-size: clamp(0.72rem, 3.2vw, 0.9rem);
  font-weight: 900;
  letter-spacing: 0.09em;
}

.ticket-mark {
  border-left: 1px solid rgba(23, 19, 12, 0.32);
}

.ticket-mark svg {
  width: 1.7rem;
  fill: none;
  stroke: #17130c;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.event-footer {
  flex: none;
}

.tagline {
  display: flex;
  margin: 0.65rem 0 0;
  align-items: center;
  gap: 0.55rem;
  color: var(--gold);
  font-size: clamp(0.48rem, 2.1vw, 0.58rem);
  font-weight: 700;
  letter-spacing: 0.11em;
  line-height: 1.35;
  text-align: center;
  text-transform: uppercase;
}

.tagline span {
  height: 1px;
  flex: 1;
  background: var(--dark-gold);
}

.admin-link {
  display: block;
  width: fit-content;
  margin: 0.35rem auto 0;
  padding: 0.2rem 0.7rem;
  color: #706551;
  font-size: 0.55rem;
  letter-spacing: 0.13em;
  text-decoration: none;
  text-transform: uppercase;
}

@media (max-height: 740px) {
  .camera-card {
    padding-top: 0.65rem;
  }

  .leopard-mark {
    display: none;
  }

  .event-meta {
    margin-top: 0.4rem;
  }

  .film-frame {
    min-height: 10rem;
    margin-top: 0.5rem;
  }

  .guest-form > label {
    margin-top: 0.45rem;
  }

  .camera-ticket {
    min-height: 3.6rem;
    margin-top: 0.5rem;
  }
}
</style>