<script setup>
import { useAfterDark } from './useAfterDark.js'
import { useAdminSetup } from '@/composables/useAdminSetup.js'
import './after-dark-organiser.css'

const { event, vars, dateLabel } = useAfterDark()
const { email, verified, password, confirm, showPassword, loading, error, verify, activate } = useAdminSetup()
</script>

<template>
  <main class="ad ad-org" :style="vars">
    <div class="ad-inner ad-org__login">
      <div class="ad-org__centre">
        <h1 class="ad-title ad-org__title">{{ event.title }}</h1>
        <p class="ad-date">{{ dateLabel }}</p>
        <h2 class="ad-rule">{{ verified ? 'CHOOSE A PASSWORD' : 'ORGANISER SETUP' }}</h2>
        <p class="ad-sub">{{ verified ? 'At least 10 characters.' : 'Confirm the email address your invite was sent to.' }}</p>
      </div>

      <form v-if="!verified" class="ad-panel ad-org__form" @submit.prevent="verify">
        <label class="ad-field">
          <span class="ad-label">Email</span>
          <input v-model.trim="email" class="ad-input" type="email" autocomplete="username" required />
        </label>
        <p v-if="error" class="ad-error">{{ error }}</p>
        <button class="ad-button ad-org__submit" :disabled="loading">{{ loading ? 'CHECKING…' : 'CONTINUE' }}</button>
      </form>

      <form v-else class="ad-panel ad-org__form" @submit.prevent="activate">
        <label class="ad-field">
          <span class="ad-label">Password</span>
          <span class="ad-input-wrap">
            <input v-model="password" class="ad-input" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" required />
            <button type="button" class="ad-input-toggle" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button>
          </span>
        </label>
        <label class="ad-field">
          <span class="ad-label">Confirm password</span>
          <input v-model="confirm" class="ad-input" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" required />
        </label>
        <p v-if="error" class="ad-error">{{ error }}</p>
        <button class="ad-button ad-org__submit" :disabled="loading">{{ loading ? 'SAVING…' : 'SAVE AND LOG IN' }}</button>
      </form>
    </div>
  </main>
</template>
