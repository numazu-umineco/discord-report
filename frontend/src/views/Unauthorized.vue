<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

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
  try {
    await fetch('/auth/logout', { credentials: 'include' })
  } catch (error) {
    // Ignore logout errors
  }
  router.push('/')
}
</script>

<template>
  <div class="unauthorized-container">
    <div class="unauthorized-card">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h1>{{ currentError.title }}</h1>
      <p>{{ currentError.description }}</p>
      <div class="actions">
        <button @click="logout" class="logout-btn">
          別のアカウントでログイン
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.unauthorized-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.unauthorized-card {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 450px;
  width: 90%;
}

.error-icon {
  color: #dc3545;
  margin-bottom: 1.5rem;
}

.unauthorized-card h1 {
  margin: 0 0 1rem;
  color: #333;
  font-size: 1.5rem;
}

.unauthorized-card p {
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #5865F2;
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: #4752C4;
}
</style>
