<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Card from 'primevue/card'
import Button from 'primevue/button'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const errorCode = computed(() => route.query.error || 'UNKNOWN')

const errorMessages = {
  NOT_IN_GUILD: {
    title: 'サーバーに参加していません',
    description: 'このアプリケーションを利用するには、指定されたDiscordサーバーに参加している必要があります。'
  },
  NO_REQUIRED_ROLE: {
    title: '必要なロールがありません',
    description: 'このアプリケーションを利用するには、サーバーで特定のロールが割り当てられている必要があります。サーバー管理者にお問い合わせください。'
  },
  MEMBER_FETCH_FAILED: {
    title: 'メンバー情報の取得に失敗しました',
    description: 'サーバーのメンバー情報を取得できませんでした。再度ログインしてください。'
  },
  UNKNOWN: {
    title: 'アクセスが拒否されました',
    description: 'このアプリケーションを利用する権限がありません。'
  }
}

const currentError = computed(() => {
  return errorMessages[errorCode.value] || errorMessages.UNKNOWN
})

const logout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="unauthorized-container flex justify-content-center align-items-center min-h-screen">
    <Card class="w-9 md:w-4">
      <template #content>
        <div class="text-center">
          <i class="pi pi-exclamation-circle text-6xl text-red-500 mb-3"></i>
          <h1 class="text-xl m-0 mb-3">{{ currentError.title }}</h1>
          <p class="text-muted mb-4 line-height-3">{{ currentError.description }}</p>
          <Button
            label="別のアカウントでログイン"
            icon="pi pi-sign-in"
            @click="logout"
            class="w-full"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.unauthorized-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.text-muted {
  color: var(--p-text-muted-color);
}
</style>
