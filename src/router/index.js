import { createRouter, createWebHistory } from 'vue-router'
import { eventConfig, eventMissing } from '@/config/event.js'

// Each theme's views load only when needed, so one event's images and code
// aren't downloaded on another event's site.
const NotFoundView = () => import('@/views/NotFoundView.vue')
const NoEventView = () => import('@/views/NoEventView.vue')

const defaultViews = {
  landing: () => import('@/views/LandingView.vue'),
  camera: () => import('@/views/CameraView.vue'),
  finished: () => import('@/views/FinishedView.vue'),
  admin: () => import('@/views/AdminView.vue'),
  adminSetup: () => import('@/views/AdminSetupView.vue'),
  join: NotFoundView,
  guestGallery: NotFoundView,
}

const themeViews = {
  'caz-and-dan': {
    landing: () => import('@/views/CazLandingView.vue'),
    camera: () => import('@/views/CazCameraView.vue'),
    finished: () => import('@/views/CazFinishedView.vue'),
    admin: () => import('@/views/CazAdminView.vue'),
    adminSetup: () => import('@/views/CazAdminSetupView.vue'),
    join: () => import('@/views/CazJoinView.vue'),
    guestGallery: () => import('@/views/CazGuestGalleryView.vue'),
  },
  // Ready-made themes: every screen comes from the theme.
  'soft-film': {
    landing: () => import('@/themes/soft-film/SoftFilmLanding.vue'),
    camera: () => import('@/themes/soft-film/SoftFilmCamera.vue'),
    finished: () => import('@/themes/soft-film/SoftFilmFinished.vue'),
    admin: () => import('@/themes/soft-film/SoftFilmAdmin.vue'),
    adminSetup: () => import('@/themes/soft-film/SoftFilmAdminSetup.vue'),
    join: NotFoundView,
    guestGallery: () => import('@/themes/soft-film/SoftFilmGuestGallery.vue'),
  },
  'after-dark': {
    landing: () => import('@/themes/after-dark/AfterDarkLanding.vue'),
    camera: () => import('@/themes/after-dark/AfterDarkCamera.vue'),
    finished: () => import('@/themes/after-dark/AfterDarkFinished.vue'),
    admin: () => import('@/themes/after-dark/AfterDarkAdmin.vue'),
    adminSetup: () => import('@/themes/after-dark/AfterDarkAdminSetup.vue'),
    join: NotFoundView,
    guestGallery: () => import('@/themes/after-dark/AfterDarkGuestGallery.vue'),
  },
  'sophies-last-rodeo': {
    ...defaultViews,
    camera: () => import('@/views/SophieCameraView.vue'),
    finished: () => import('@/views/SophieFinishedView.vue'),
  },
}

const views = themeViews[eventConfig.key] || defaultViews

const routes = eventMissing
  ? [{ path: '/:pathMatch(.*)*', name: 'no-event', component: NoEventView }]
  : [
      { path: '/', name: 'landing', component: views.landing },
      { path: '/camera', name: 'camera', component: views.camera },
      { path: '/finished', name: 'finished', component: views.finished },
      { path: '/admin', name: 'admin', component: views.admin },
      { path: '/admin/setup', name: 'admin-setup', component: views.adminSetup },
      { path: '/join', name: 'join', component: views.join },
      { path: '/gallery/share/:token', name: 'guest-gallery', component: views.guestGallery },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
    ]

export default createRouter({
  history: createWebHistory(),
  routes,
})
