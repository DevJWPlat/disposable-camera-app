import './style.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { eventConfig } from './config/event'

document.title = eventConfig.title

const description = document.querySelector('meta[name="description"]')
if (description) {
  description.content = `${eventConfig.title} disposable camera`
}

if (eventConfig.favicon) {
  const favicon = document.querySelector('link[rel="icon"]') || document.createElement('link')
  favicon.rel = 'icon'
  favicon.href = eventConfig.favicon
  if (!favicon.parentNode) document.head.appendChild(favicon)
}

// Ready-made themes bring their own fonts and browser bar colour.
const themeMeta = eventConfig.themeMeta
if (themeMeta?.fonts) {
  const fonts = document.createElement('link')
  fonts.rel = 'stylesheet'
  fonts.href = themeMeta.fonts
  document.head.appendChild(fonts)
}
if (themeMeta?.themeColor) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeMeta.themeColor)
}

const app = createApp(App)

app.use(router)

app.mount('#app')
