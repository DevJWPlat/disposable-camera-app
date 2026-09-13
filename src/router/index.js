import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '@/views/LandingView.vue'
import CameraView from '@/views/CameraView.vue'
import FinishedView from '@/views/FinishedView.vue'
import AdminView from '@/views/AdminView.vue'
import AdminSetupView from '@/views/AdminSetupView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: LandingView },
    { path: '/camera', name: 'camera', component: CameraView },
    { path: '/finished', name: 'finished', component: FinishedView },
    { path: '/admin', name: 'admin', component: AdminView },
    { path: '/admin/setup', name: 'admin-setup', component: AdminSetupView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})
