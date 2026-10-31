<script setup>
// Shown when nobody has an event at this web address.
</script>

<template>
  <main class="no-event">
    <div class="no-event__card">
      <p class="no-event__eyebrow">Online Disposable Camera</p>
      <h1>This camera isn’t here</h1>
      <p>Check the link or QR code you were given, or ask the person who invited you for a new one.</p>
      <a href="https://onlinedisposablecamera.co.uk">Visit onlinedisposablecamera.co.uk</a>
    </div>
  </main>
</template>

<style scoped>
.no-event {
  min-height: 100svh;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: #f7f5ef;
  color: #111;
  font-family: Georgia, 'Times New Roman', serif;
  text-align: center;
}

.no-event__card {
  width: min(100%, 360px);
}

.no-event__eyebrow {
  margin: 0 0 14px;
  font-family: Montserrat, system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #716f69;
}

h1 {
  margin: 0 0 12px;
  font-size: 30px;
  font-weight: 400;
  line-height: 1.1;
  text-wrap: balance;
}

p {
  margin: 0 0 22px;
  font-size: 16px;
  line-height: 1.5;
  text-wrap: balance;
}

a {
  display: inline-block;
  padding: 12px 18px;
  background: #111;
  color: #fff;
  font-family: Montserrat, system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}
</style>
