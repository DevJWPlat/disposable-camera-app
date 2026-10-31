import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// VITE_EVENT is only set by the old per-event scripts (build:caz, deploy:sophie...).
// A plain `vite build` makes the single app in dist/app.
const outName = process.env.VITE_EVENT || 'app'

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: `dist/${outName}`,
    emptyOutDir: true,
  },
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
