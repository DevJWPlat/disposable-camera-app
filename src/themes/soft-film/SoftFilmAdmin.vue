<script setup>
import { ref } from 'vue'
import { useSoftFilm } from './useSoftFilm.js'
import { useOrganiser } from '@/composables/useOrganiser.js'
import SoftFilmGallery from './SoftFilmGallery.vue'
import './soft-film-organiser.css'

const { event, vars, dateLabel } = useSoftFilm()
const {
  loading, loggingIn, refreshing, email, password, showPassword, error, admin, stats, photos,
  displayGuests, displayPhotos, share, sharingSaving, copied, galleryOpen, unlockLabel, storageLabel,
  guestSharingAvailable, login, logout, refresh, setGuestSharing, copyShareLink,
} = useOrganiser()

const stage = ref('dashboard')

function signOut() {
  stage.value = 'dashboard'
  logout()
}
</script>

<template>
  <main class="sf sf-org" :style="vars">
    <p v-if="loading" class="sf-loading">Loading…</p>

    <!-- Login -->
    <div v-else-if="!admin" class="sf-inner sf-org__login">
      <div class="sf-org__centre">
        <p class="sf-date">{{ dateLabel }}</p>
        <h1 class="sf-names">{{ event.title }}</h1>
        <h2 class="sf-rule">ORGANISER LOGIN</h2>
        <p class="sf-copy">Your private dashboard and gallery.</p>
      </div>

      <form class="sf-panel sf-org__form" @submit.prevent="login">
        <label class="sf-field">
          <span class="sf-label">Email</span>
          <input v-model.trim="email" class="sf-input" type="email" autocomplete="username" required />
        </label>
        <label class="sf-field">
          <span class="sf-label">Password</span>
          <span class="sf-input-wrap">
            <input v-model="password" class="sf-input" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required />
            <button type="button" class="sf-input-toggle" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button>
          </span>
        </label>
        <p v-if="error" class="sf-error">{{ error }}</p>
        <button class="sf-button sf-org__submit" :disabled="loggingIn">{{ loggingIn ? 'LOGGING IN…' : 'LOG IN' }}</button>
      </form>

      <div class="sf-org__centre sf-org__back">
        <RouterLink class="sf-link" to="/">Back to the camera</RouterLink>
      </div>
    </div>

    <!-- Signed in -->
    <div v-else class="sf-inner sf-org__signed-in">
      <header class="sf-bar">
        <span class="sf-bar__names">{{ event.title }}</span>
        <button type="button" class="sf-link" @click="signOut">Log out</button>
      </header>

      <template v-if="stage === 'dashboard'">
        <div class="sf-heading">
          <div>
            <p>{{ dateLabel }}</p>
            <h1>Overview</h1>
          </div>
          <button type="button" class="sf-link" :disabled="refreshing" @click="refresh">{{ refreshing ? 'Refreshing…' : 'Refresh' }}</button>
        </div>

        <p v-if="storageLabel" class="sf-notice">
          <span>
            <strong>Photo storage</strong>
            Your photos are kept until {{ storageLabel }}. Download any you want to keep before then.
          </span>
        </p>

        <div class="sf-stats">
          <article class="sf-panel sf-stat">
            <span class="sf-label">Guests</span>
            <strong>{{ displayGuests }}</strong>
          </article>
          <article class="sf-panel sf-stat">
            <span class="sf-label">Photos</span>
            <strong>{{ displayPhotos }}</strong>
          </article>
        </div>

        <button type="button" class="sf-panel sf-card-button" :disabled="!galleryOpen" @click="stage = 'gallery'">
          <span>
            <span class="sf-label">Gallery</span>
            <span class="sf-card-button__title">{{ galleryOpen ? 'Open the gallery' : 'Gallery locked' }}</span>
            <span class="sf-small">{{ galleryOpen ? `${stats ? stats.photos : 0} photos ready to view` : `Opens ${unlockLabel}` }}</span>
          </span>
          <span class="sf-round" :class="{ 'sf-round--muted': !galleryOpen }" aria-hidden="true">
            <svg v-if="galleryOpen" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            <svg v-else viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          </span>
        </button>

        <section v-if="guestSharingAvailable" class="sf-panel sf-share">
          <div class="sf-share__top">
            <div>
              <span class="sf-label">Guest gallery</span>
              <span class="sf-card-button__title">Share with guests</span>
              <p class="sf-small">Turn this on for a link your guests can use to see and download every photo.</p>
            </div>
            <button
              v-if="galleryOpen"
              type="button"
              class="sf-switch"
              :class="{ 'sf-switch--on': share.enabled }"
              role="switch"
              :aria-checked="share.enabled"
              aria-label="Share with guests"
              :disabled="sharingSaving"
              @click="setGuestSharing(!share.enabled)"
            ><span></span></button>
          </div>
          <div v-if="galleryOpen && share.enabled && share.shareUrl" class="sf-share__link">
            <input :value="share.shareUrl" readonly aria-label="Guest gallery link" />
            <button type="button" @click="copyShareLink">{{ copied ? 'Copied' : 'Copy' }}</button>
          </div>
          <p v-if="!galleryOpen" class="sf-small">Available once the gallery opens.</p>
        </section>

        <p v-if="error" class="sf-error">{{ error }}</p>
      </template>

      <template v-else>
        <div class="sf-heading">
          <div>
            <p>{{ stats ? stats.photos : 0 }} PHOTOS</p>
            <h1>Gallery</h1>
          </div>
          <button type="button" class="sf-link" @click="stage = 'dashboard'">← Overview</button>
        </div>
        <SoftFilmGallery :photos="photos" zip-path="/api/admin/download-zip" />
      </template>
    </div>
  </main>
</template>
