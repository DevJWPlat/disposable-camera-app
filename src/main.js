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

const app = createApp(App)

app.use(router)

app.mount('#app')
