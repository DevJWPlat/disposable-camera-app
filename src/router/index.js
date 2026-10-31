import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '@/views/LandingView.vue'
import CazLandingView from '@/views/CazLandingView.vue'
import CameraView from '@/views/CameraView.vue'
import SophieCameraView from '@/views/SophieCameraView.vue'
import CazCameraView from '@/views/CazCameraView.vue'
import { eventConfig } from '@/config/event.js'
import FinishedView from '@/views/FinishedView.vue'
import SophieFinishedView from '@/views/SophieFinishedView.vue'
import CazFinishedView from '@/views/CazFinishedView.vue'
import AdminView from '@/views/AdminView.vue'
import CazAdminView from '@/views/CazAdminView.vue'
import AdminSetupView from '@/views/AdminSetupView.vue'
import CazAdminSetupView from '@/views/CazAdminSetupView.vue'
import CazJoinView from '@/views/CazJoinView.vue'
import CazGuestGalleryView from '@/views/CazGuestGalleryView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

const isCazAndDan = eventConfig.key === 'caz-and-dan'
const ActiveLandingView = isCazAndDan ? CazLandingView : LandingView
const ActiveCameraView = isCazAndDan ? CazCameraView : (eventConfig.key === 'sophies-last-rodeo' ? SophieCameraView : CameraView)
const ActiveFinishedView = isCazAndDan ? CazFinishedView : (eventConfig.key === 'sophies-last-rodeo' ? SophieFinishedView : FinishedView)
const ActiveAdminView = isCazAndDan ? CazAdminView : AdminView
const ActiveAdminSetupView = isCazAndDan ? CazAdminSetupView : AdminSetupView

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: ActiveLandingView },
    { path: '/camera', name: 'camera', component: ActiveCameraView },
    { path: '/finished', name: 'finished', component: ActiveFinishedView },
    { path: '/admin', name: 'admin', component: ActiveAdminView },
    { path: '/admin/setup', name: 'admin-setup', component: ActiveAdminSetupView },
    { path: '/join', name: 'join', component: isCazAndDan ? CazJoinView : NotFoundView },
    { path: '/gallery/share/:token', name: 'guest-gallery', component: isCazAndDan ? CazGuestGalleryView : NotFoundView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})
