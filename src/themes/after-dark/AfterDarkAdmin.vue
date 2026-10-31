<script setup>
import { ref } from 'vue'
import { useAfterDark } from './useAfterDark.js'
import { useOrganiser } from '@/composables/useOrganiser.js'
import AfterDarkGallery from './AfterDarkGallery.vue'
import './after-dark-organiser.css'

const { event, vars, dateLabel } = useAfterDark()
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
  <main class="ad ad-org" :style="vars">
    <p v-if="loading" class="ad-loading">Loading…</p>

    <!-- Login -->
    <div v-else-if="!admin" class="ad-inner ad-org__login">
      <div class="ad-org__centre">
        <h1 class="ad-title ad-org__title">{{ event.title }}</h1>
        <p class="ad-date">{{ dateLabel }}</p>
        <h2 class="ad-rule">ORGANISER LOGIN</h2>
        <p class="ad-sub">Your private dashboard and gallery.</p>
      </div>

      <form class="ad-panel ad-org__form" @submit.prevent="login">
        <label class="ad-field">
          <span class="ad-label">Email</span>
          <input v-model.trim="email" class="ad-input" type="email" autocomplete="username" required />
        </label>
        <label class="ad-field">
          <span class="ad-label">Password</span>
          <span class="ad-input-wrap">
            <input v-model="password" class="ad-input" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required />
            <button type="button" class="ad-input-toggle" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button>
          </span>
        </label>
        <p v-if="error" class="ad-error">{{ error }}</p>
        <button class="ad-button ad-org__submit" :disabled="loggingIn">{{ loggingIn ? 'LOGGING IN…' : 'LOG IN' }}</button>
      </form>

      <div class="ad-org__centre ad-org__back">
        <RouterLink class="ad-link" to="/">Back to the camera</RouterLink>
      </div>
    </div>

    <!-- Signed in -->
    <div v-else class="ad-inner ad-org__signed-in">
      <header class="ad-bar">
        <span class="ad-bar__names">{{ event.title }}</span>
        <button type="button" class="ad-link" @click="signOut">Log out</button>
      </header>

      <template v-if="stage === 'dashboard'">
        <div class="ad-heading">
          <div>
            <p>{{ dateLabel }}</p>
            <h1>Overview</h1>
          </div>
          <button type="button" class="ad-link" :disabled="refreshing" @click="refresh">{{ refreshing ? 'Refreshing…' : 'Refresh' }}</button>
        </div>

        <p v-if="storageLabel" class="ad-notice">
          <span>
            <strong>Photo storage</strong>
            Your photos are kept until {{ storageLabel }}. Download any you want to keep before then.
          </span>
        </p>

        <div class="ad-stats">
          <article class="ad-panel ad-stat">
            <span class="ad-label">Guests</span>
            <strong>{{ displayGuests }}</strong>
          </article>
          <article class="ad-panel ad-stat">
            <span class="ad-label">Photos</span>
            <strong>{{ displayPhotos }}</strong>
          </article>
        </div>

        <button type="button" class="ad-panel ad-card-button" :disabled="!galleryOpen" @click="stage = 'gallery'">
          <span>
            <span class="ad-label">Gallery</span>
            <span class="ad-card-button__title">{{ galleryOpen ? 'Open the gallery' : 'Gallery locked' }}</span>
            <span class="ad-small">{{ galleryOpen ? `${stats ? stats.photos : 0} photos ready to view` : `Opens ${unlockLabel}` }}</span>
          </span>
          <span class="ad-round" :class="{ 'ad-round--muted': !galleryOpen }" aria-hidden="true">
            <svg v-if="galleryOpen" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            <svg v-else viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          </span>
        </button>

        <section v-if="guestSharingAvailable" class="ad-panel ad-share">
          <div class="ad-share__top">
            <div>
              <span class="ad-label">Guest gallery</span>
              <span class="ad-card-button__title">Share with guests</span>
              <p class="ad-small">Turn this on for a link your guests can use to see and download every photo.</p>
            </div>
            <button
              v-if="galleryOpen"
              type="button"
              class="ad-switch"
              :class="{ 'ad-switch--on': share.enabled }"
              role="switch"
              :aria-checked="share.enabled"
              aria-label="Share with guests"
              :disabled="sharingSaving"
              @click="setGuestSharing(!share.enabled)"
            ><span></span></button>
          </div>
          <div v-if="galleryOpen && share.enabled && share.shareUrl" class="ad-share__link">
            <input :value="share.shareUrl" readonly aria-label="Guest gallery link" />
            <button type="button" @click="copyShareLink">{{ copied ? 'Copied' : 'Copy' }}</button>
          </div>
          <p v-if="!galleryOpen" class="ad-small">Available once the gallery opens.</p>
        </section>

        <p v-if="error" class="ad-error">{{ error }}</p>
      </template>

      <template v-else>
        <div class="ad-heading">
          <div>
            <p>{{ stats ? stats.photos : 0 }} PHOTOS</p>
            <h1>Gallery</h1>
          </div>
          <button type="button" class="ad-link" @click="stage = 'dashboard'">← Overview</button>
        </div>
        <AfterDarkGallery :photos="photos" zip-path="/api/admin/download-zip" />
      </template>
    </div>
  </main>
</template>
