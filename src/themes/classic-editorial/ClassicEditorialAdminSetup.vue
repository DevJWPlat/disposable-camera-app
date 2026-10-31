<script setup>
import { useClassicEditorial } from './useClassicEditorial.js'
import { useAdminSetup } from '@/composables/useAdminSetup.js'
import './classic-editorial-organiser.css'

const { event, vars, dateLabel } = useClassicEditorial()
const { email, verified, password, confirm, showPassword, loading, error, verify, activate } = useAdminSetup()
</script>

<template>
  <main class="ce ce-org" :style="vars">
    <div class="ce-inner ce-org__login">
      <div class="ce-org__centre">
        <h1 class="ce-names ce-org__title">{{ event.title }}</h1>
        <p class="ce-date ce-org__date">{{ dateLabel }}</p>
        <h2 class="ce-org__rule">{{ verified ? 'CHOOSE A PASSWORD' : 'ORGANISER SETUP' }}</h2>
        <p class="ce-body">{{ verified ? 'At least 10 characters.' : 'Confirm the email address your invite was sent to.' }}</p>
      </div>

      <form v-if="!verified" class="ce-panel ce-org__form" @submit.prevent="verify">
        <label class="ce-field">
          <span class="ce-label">Email</span>
          <input v-model.trim="email" class="ce-input" type="email" autocomplete="username" required />
        </label>
        <p v-if="error" class="ce-error">{{ error }}</p>
        <button class="ce-button ce-org__submit" :disabled="loading">{{ loading ? 'CHECKING…' : 'CONTINUE' }}</button>
      </form>

      <form v-else class="ce-panel ce-org__form" @submit.prevent="activate">
        <label class="ce-field">
          <span class="ce-label">Password</span>
          <span class="ce-input-wrap">
            <input v-model="password" class="ce-input" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" required />
            <button type="button" class="ce-input-toggle" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button>
          </span>
        </label>
        <label class="ce-field">
          <span class="ce-label">Confirm password</span>
          <input v-model="confirm" class="ce-input" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" required />
        </label>
        <p v-if="error" class="ce-error">{{ error }}</p>
        <button class="ce-button ce-org__submit" :disabled="loading">{{ loading ? 'SAVING…' : 'SAVE AND LOG IN' }}</button>
      </form>
    </div>
  </main>
</template>
