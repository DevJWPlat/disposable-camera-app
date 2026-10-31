<script setup>
import { useSoftFilm } from './useSoftFilm.js'
import { useAdminSetup } from '@/composables/useAdminSetup.js'
import './soft-film-organiser.css'

const { event, vars, dateLabel } = useSoftFilm()
const { email, verified, password, confirm, showPassword, loading, error, verify, activate } = useAdminSetup()
</script>

<template>
  <main class="sf sf-org" :style="vars">
    <div class="sf-inner sf-org__login">
      <div class="sf-org__centre">
        <p class="sf-date">{{ dateLabel }}</p>
        <h1 class="sf-names">{{ event.title }}</h1>
        <h2 class="sf-rule">{{ verified ? 'CHOOSE A PASSWORD' : 'ORGANISER SETUP' }}</h2>
        <p class="sf-copy">{{ verified ? 'At least 10 characters.' : 'Confirm the email address your invite was sent to.' }}</p>
      </div>

      <form v-if="!verified" class="sf-panel sf-org__form" @submit.prevent="verify">
        <label class="sf-field">
          <span class="sf-label">Email</span>
          <input v-model.trim="email" class="sf-input" type="email" autocomplete="username" required />
        </label>
        <p v-if="error" class="sf-error">{{ error }}</p>
        <button class="sf-button sf-org__submit" :disabled="loading">{{ loading ? 'CHECKING…' : 'CONTINUE' }}</button>
      </form>

      <form v-else class="sf-panel sf-org__form" @submit.prevent="activate">
        <label class="sf-field">
          <span class="sf-label">Password</span>
          <span class="sf-input-wrap">
            <input v-model="password" class="sf-input" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" required />
            <button type="button" class="sf-input-toggle" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button>
          </span>
        </label>
        <label class="sf-field">
          <span class="sf-label">Confirm password</span>
          <input v-model="confirm" class="sf-input" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" required />
        </label>
        <p v-if="error" class="sf-error">{{ error }}</p>
        <button class="sf-button sf-org__submit" :disabled="loading">{{ loading ? 'SAVING…' : 'SAVE AND LOG IN' }}</button>
      </form>
    </div>
  </main>
</template>
