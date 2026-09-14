import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '@/views/LandingView.vue'
import CameraView from '@/views/CameraView.vue'
import SophieCameraView from '@/views/SophieCameraView.vue'
import { eventConfig } from '@/config/event.js'
import FinishedView from '@/views/FinishedView.vue'
import SophieFinishedView from '@/views/SophieFinishedView.vue'
import AdminView from '@/views/AdminView.vue'
import AdminSetupView from '@/views/AdminSetupView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

const ActiveCameraView = eventConfig.key === 'sophies-last-rodeo' ? SophieCameraView : CameraView
const ActiveFinishedView = eventConfig.key === 'sophies-last-rodeo' ? SophieFinishedView : FinishedView

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: LandingView },
    { path: '/camera', name: 'camera', component: ActiveCameraView },
    { path: '/finished', name: 'finished', component: ActiveFinishedView },
    { path: '/admin', name: 'admin', component: AdminView },
    { path: '/admin/setup', name: 'admin-setup', component: AdminSetupView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})
