<script setup>
import { useSoftFilm } from './useSoftFilm.js'

const { event, copy, vars, dateLabel, stamp, photos, fill } = useSoftFilm()
</script>

<template>
  <main class="sf sf-landing" :style="vars">
    <div class="sf-inner">
      <p class="sf-date">{{ dateLabel }}</p>
      <h1 class="sf-names">{{ event.title }}</h1>

      <div class="sf-landing__middle">
      <div class="sf-landing__prints">
        <figure class="sf-print sf-landing__print sf-landing__print--one">
          <i class="sf-tape"></i>
          <img v-if="photos[0] && photos[0].url" class="sf-print__photo" :src="photos[0].url" alt="" />
          <span v-else class="sf-print__photo"></span>
          <figcaption class="sf-print__caption">{{ photos[0] && photos[0].caption }}</figcaption>
        </figure>
        <figure class="sf-print sf-landing__print sf-landing__print--two">
          <img v-if="photos[1] && photos[1].url" class="sf-print__photo" :src="photos[1].url" alt="" />
          <span v-else class="sf-print__photo"></span>
          <b v-if="stamp" class="sf-stamp sf-landing__stamp">{{ stamp }}</b>
          <figcaption class="sf-print__caption">{{ photos[1] && photos[1].caption }}</figcaption>
        </figure>
      </div>

      <h2 class="sf-rule">{{ copy.heading }}</h2>
      <p class="sf-copy">{{ fill(copy.intro) }}</p>
      </div>

      <div class="sf-landing__actions">
        <RouterLink class="sf-button" to="/camera">{{ copy.cta }}</RouterLink>
        <p class="sf-note">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h2.2l1.2-2h3.2l1.2 2H17a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Z" /><circle cx="12" cy="13.5" r="3.5" /></svg>
          {{ event.maxShots }} PHOTOS PER GUEST
        </p>
      </div>
    </div>
  </main>
</template>

<style>
.sf-landing__prints {
  position: relative;
  width: 100%;
  /* Two prints side by side, overlapping; height follows their width. */
  height: calc(min(178px, 47vw) * 1.444 + 56px);
}

/* Prints and words sit centred in whatever space the phone has. */
.sf-landing__middle {
  width: 100%;
  margin: auto 0;
  padding-top: 18px;
}

.sf-landing__print {
  position: absolute;
  width: min(178px, 47vw);
}

.sf-landing__print--one {
  top: 4px;
  left: 4px;
  transform: rotate(-6deg);
}

.sf-landing__print--one .sf-print__caption {
  right: auto;
  left: 12px;
}

.sf-landing__print--two {
  top: 40px;
  right: 4px;
  transform: rotate(5deg);
}

.sf-landing__stamp {
  position: absolute;
  right: 16px;
  bottom: 44px;
}

.sf-landing__actions {
  width: 100%;
  padding-top: 22px;
}
</style>
