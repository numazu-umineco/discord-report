import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthenticated = ref(false)
  const isAuthorized = ref(false)
  const error = ref(null)
  const isLoading = ref(false)

  const isReady = computed(() => !isLoading.value && isAuthenticated.value && isAuthorized.value)

  async function fetchStatus() {
    isLoading.value = true
    try {
      const response = await fetch('/auth/status', { credentials: 'include' })
      const data = await response.json()

      isAuthenticated.value = data.authenticated
      isAuthorized.value = data.authorized ?? false
      error.value = data.error ?? null
      user.value = data.user ?? null

      return { authenticated: isAuthenticated.value, authorized: isAuthorized.value, error: error.value }
    } catch (err) {
      isAuthenticated.value = false
      isAuthorized.value = false
      user.value = null
      error.value = 'FETCH_FAILED'
      return { authenticated: false, authorized: false, error: 'FETCH_FAILED' }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      await fetch('/auth/logout', { credentials: 'include' })
    } catch (err) {
      // Ignore logout errors
    }
    user.value = null
    isAuthenticated.value = false
    isAuthorized.value = false
    error.value = null
  }

  function clear() {
    user.value = null
    isAuthenticated.value = false
    isAuthorized.value = false
    error.value = null
  }

  return {
    user,
    isAuthenticated,
    isAuthorized,
    error,
    isLoading,
    isReady,
    fetchStatus,
    logout,
    clear
  }
})
