<template>
  <RouterView />

  <div class="portrait-guard" role="status" aria-live="polite">
    <div class="portrait-guard__card">
      <span aria-hidden="true">↻</span>
      <strong>Turn your phone upright</strong>
      <p>This camera works best in portrait.</p>
    </div>
  </div>
</template>

<style>
.portrait-guard {
  display: none;
}

@media (orientation: landscape) and (max-height: 600px) and (pointer: coarse) {
  .portrait-guard {
    position: fixed;
    z-index: 99999;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    background:
      linear-gradient(180deg, rgba(255, 245, 242, 1) 0%, rgba(253, 198, 182, 1) 100%);
    color: #2a1e1c;
    text-align: center;
  }

  .portrait-guard__card {
    width: min(100%, 320px);
  }

  .portrait-guard__card > span {
    display: block;
    margin-bottom: 8px;
    color: #d94f73;
    font-size: 48px;
    line-height: 1;
  }

  .portrait-guard__card strong {
    display: block;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 28px;
    line-height: 1;
  }

  .portrait-guard__card p {
    margin: 10px 0 0;
    color: #76564d;
    font-size: 14px;
  }
}
</style>
