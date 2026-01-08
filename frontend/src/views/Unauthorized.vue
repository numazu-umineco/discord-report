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
  AUTH_CANCELLED: {
    title: '認証がキャンセルされました',
    description: 'Discord認証がキャンセルされたか、失敗しました。\n再度ログインしてください。'
  },
  NOT_IN_GUILD: {
    title: 'サーバーに参加していません',
    description: 'このアプリケーションを利用するには、指定されたDiscordサーバーに参加している必要があります。'
  },
  NO_REQUIRED_ROLE: {
    title: '必要なロールがありません',
    description: 'このアプリケーションを利用するには、サーバーで特定のロールが割り当てられている必要があります。\nサーバー管理者にお問い合わせください。'
  },
  MEMBER_FETCH_FAILED: {
    title: 'メンバー情報の取得に失敗しました',
    description: 'サーバーのメンバー情報を取得できませんでした。\n再度ログインしてください。'
  },
  UNKNOWN: {
    title: 'アクセスが拒否されました',
    description: 'このアプリケーションを利用する権限がありません。'
  }
}

const currentError = computed(() => {
  const error = errorMessages[errorCode.value] || errorMessages.UNKNOWN
  return {
    ...error,
    descriptionHtml: error.description.replace(/\n/g, '<br>')
  }
})

const logout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="unauthorized-container flex justify-content-center align-items-center min-h-screen">
    <Card class="unauthorized-card">
      <template #content>
        <div class="text-center">
          <i class="pi pi-exclamation-circle text-6xl text-red-500 mt-2 mb-4"></i>
          <h1 class="text-xl m-0 mb-3">{{ currentError.title }}</h1>
          <p class="text-muted mb-4 line-height-3" v-html="currentError.descriptionHtml"></p>
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
  background: linear-gradient(135deg, #22c4fa 0%, #0ea5e9 50%, #0284c7 100%);
}

.unauthorized-card {
  width: 520px;
  max-width: 90%;
}

.text-muted {
  color: var(--p-text-muted-color);
}
</style>
