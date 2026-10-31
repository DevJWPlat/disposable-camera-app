<script setup>
import { ref } from 'vue'
import { useClassicEditorial } from './useClassicEditorial.js'
import { useOrganiser } from '@/composables/useOrganiser.js'
import ClassicEditorialGallery from './ClassicEditorialGallery.vue'
import './classic-editorial-organiser.css'

const { event, vars, dateLabel } = useClassicEditorial()
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
  <main class="ce ce-org" :style="vars">
    <p v-if="loading" class="ce-loading">Loading…</p>

    <!-- Login -->
    <div v-else-if="!admin" class="ce-inner ce-org__login">
      <div class="ce-org__centre">
        <h1 class="ce-names ce-org__title">{{ event.title }}</h1>
        <p class="ce-date ce-org__date">{{ dateLabel }}</p>
        <h2 class="ce-org__rule">ORGANISER LOGIN</h2>
        <p class="ce-body">Your private dashboard and gallery.</p>
      </div>

      <form class="ce-panel ce-org__form" @submit.prevent="login">
        <label class="ce-field">
          <span class="ce-label">Email</span>
          <input v-model.trim="email" class="ce-input" type="email" autocomplete="username" required />
        </label>
        <label class="ce-field">
          <span class="ce-label">Password</span>
          <span class="ce-input-wrap">
            <input v-model="password" class="ce-input" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required />
            <button type="button" class="ce-input-toggle" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button>
          </span>
        </label>
        <p v-if="error" class="ce-error">{{ error }}</p>
        <button class="ce-button ce-org__submit" :disabled="loggingIn">{{ loggingIn ? 'LOGGING IN…' : 'LOG IN' }}</button>
      </form>

      <div class="ce-org__centre ce-org__back">
        <RouterLink class="ce-link" to="/">Back to the camera</RouterLink>
      </div>
    </div>

    <!-- Signed in -->
    <div v-else class="ce-inner ce-org__signed-in">
      <header class="ce-bar">
        <span class="ce-bar__names">{{ event.title }}</span>
        <button type="button" class="ce-link" @click="signOut">Log out</button>
      </header>

      <template v-if="stage === 'dashboard'">
        <div class="ce-heading">
          <div>
            <p>{{ dateLabel }}</p>
            <h1>Overview</h1>
          </div>
          <button type="button" class="ce-link" :disabled="refreshing" @click="refresh">{{ refreshing ? 'Refreshing…' : 'Refresh' }}</button>
        </div>

        <p v-if="storageLabel" class="ce-notice">
          <span>
            <strong>Photo storage</strong>
            Your photos are kept until {{ storageLabel }}. Download any you want to keep before then.
          </span>
        </p>

        <div class="ce-stats">
          <article class="ce-panel ce-stat">
            <span class="ce-label">Guests</span>
            <strong>{{ displayGuests }}</strong>
          </article>
          <article class="ce-panel ce-stat">
            <span class="ce-label">Photos</span>
            <strong>{{ displayPhotos }}</strong>
          </article>
        </div>

        <button type="button" class="ce-panel ce-card-button" :disabled="!galleryOpen" @click="stage = 'gallery'">
          <span>
            <span class="ce-label">Gallery</span>
            <span class="ce-card-button__title">{{ galleryOpen ? 'Open the gallery' : 'Gallery locked' }}</span>
            <span class="ce-small">{{ galleryOpen ? `${stats ? stats.photos : 0} photos ready to view` : `Opens ${unlockLabel}` }}</span>
          </span>
          <span class="ce-round" :class="{ 'ce-round--muted': !galleryOpen }" aria-hidden="true">
            <svg v-if="galleryOpen" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            <svg v-else viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          </span>
        </button>

        <section v-if="guestSharingAvailable" class="ce-panel ce-share">
          <div class="ce-share__top">
            <div>
              <span class="ce-label">Guest gallery</span>
              <span class="ce-card-button__title">Share with guests</span>
              <p class="ce-small">Turn this on for a link your guests can use to see and download every photo.</p>
            </div>
            <button
              v-if="galleryOpen"
              type="button"
              class="ce-switch"
              :class="{ 'ce-switch--on': share.enabled }"
              role="switch"
              :aria-checked="share.enabled"
              aria-label="Share with guests"
              :disabled="sharingSaving"
              @click="setGuestSharing(!share.enabled)"
            ><span></span></button>
          </div>
          <div v-if="galleryOpen && share.enabled && share.shareUrl" class="ce-share__link">
            <input :value="share.shareUrl" readonly aria-label="Guest gallery link" />
            <button type="button" @click="copyShareLink">{{ copied ? 'Copied' : 'Copy' }}</button>
          </div>
          <p v-if="!galleryOpen" class="ce-small">Available once the gallery opens.</p>
        </section>

        <p v-if="error" class="ce-error">{{ error }}</p>
      </template>

      <template v-else>
        <div class="ce-heading">
          <div>
            <p>{{ stats ? stats.photos : 0 }} PHOTOS</p>
            <h1>Gallery</h1>
          </div>
          <button type="button" class="ce-link" @click="stage = 'dashboard'">← Overview</button>
        </div>
        <ClassicEditorialGallery :photos="photos" zip-path="/api/admin/download-zip" />
      </template>
    </div>
  </main>
</template>
