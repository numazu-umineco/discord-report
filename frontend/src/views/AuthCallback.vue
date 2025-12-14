<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  const { authenticated, authorized, error } = await authStore.fetchStatus()

  if (authenticated) {
    if (authorized) {
      router.replace('/dashboard')
    } else {
      router.replace({ path: '/unauthorized', query: { error } })
    }
  } else {
    router.replace('/')
  }
})
</script>

<template>
  <div class="callback-container">
    <div class="loading-card">
      <div class="spinner"></div>
      <p>認証中...</p>
    </div>
  </div>
</template>

<style scoped>
.callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading-card {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #eee;
  border-top-color: #5865F2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-card p {
  color: #666;
  margin: 0;
}
</style>
