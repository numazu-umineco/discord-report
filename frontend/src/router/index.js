import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Callback from '../views/Callback.vue'
import Report from '../views/Report.vue'
import PostComplete from '../views/PostComplete.vue'
import Unauthorized from '../views/Unauthorized.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/callback',
    name: 'Callback',
    component: Callback
  },
  {
    path: '/report',
    name: 'Report',
    component: Report,
    meta: { requiresAuth: true }
  },
  {
    path: '/complete',
    name: 'PostComplete',
    component: PostComplete,
    meta: { requiresAuth: true }
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: Unauthorized
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard to check authentication and authorization
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const authStore = useAuthStore()

    // Skip fetch if already authenticated and authorized
    if (authStore.isReady) {
      next()
      return
    }

    const { authenticated, authorized, error } = await authStore.fetchStatus()

    if (!authenticated) {
      next('/')
    } else if (!authorized) {
      next({ path: '/unauthorized', query: { error } })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
