import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import AuthCallback from '../views/AuthCallback.vue'
import Dashboard from '../views/Dashboard.vue'
import Unauthorized from '../views/Unauthorized.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: AuthCallback
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
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
    try {
      const response = await fetch('/auth/status', {
        credentials: 'include'
      })
      const data = await response.json()

      if (!data.authenticated) {
        next('/')
      } else if (!data.authorized) {
        next({ path: '/unauthorized', query: { error: data.error } })
      } else {
        next()
      }
    } catch (error) {
      next('/')
    }
  } else {
    next()
  }
})

export default router
