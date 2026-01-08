<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  const { authenticated, authorized, error } = await authStore.fetchStatus()

  if (authenticated) {
    if (authorized) {
      router.replace('/report')
    } else {
      router.replace({ path: '/unauthorized', query: { error } })
    }
  } else {
    router.replace('/')
  }
})
</script>

<template>
  <div class="callback-container flex justify-content-center align-items-center min-h-screen">
    <Card class="w-9 md:w-3 p-5">
      <template #content>
        <div class="flex flex-column align-items-center gap-3">
          <ProgressSpinner strokeWidth="4" />
          <p class="text-muted m-0">認証中...</p>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.callback-container {
  background: linear-gradient(135deg, #22c4fa 0%, #0ea5e9 50%, #0284c7 100%);
}

.text-muted {
  color: var(--p-text-muted-color);
}
</style>
