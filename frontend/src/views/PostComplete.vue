<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import confetti from 'canvas-confetti'
import { useAuthStore } from '../stores/auth'
import { useDiscordAvatar } from '../composables/useDiscordAvatar'
import AppLayout from '../components/AppLayout.vue'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Card from 'primevue/card'

const router = useRouter()
const authStore = useAuthStore()
const { getAvatarUrl } = useDiscordAvatar()

const fireConfetti = () => {
  const colors = ['#5865F2', '#667eea', '#764ba2', '#FFD700', '#FF6B6B']

  // 左から発射
  confetti({
    particleCount: 30,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.7 },
    colors
  })

  // 右から発射
  confetti({
    particleCount: 30,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.7 },
    colors
  })
}

onMounted(() => {
  fireConfetti()
})

const goBack = () => {
  router.push('/dashboard')
}
</script>

<template>
  <AppLayout>
    <Card class="complete-card">
      <template #content>
        <div class="text-center">
          <Avatar
            v-if="authStore.user"
            :image="getAvatarUrl(authStore.user)"
            shape="circle"
            size="xlarge"
            class="mb-3 user-avatar"
          />
          <h1 class="text-xl m-0 mb-2">お疲れ様でした！</h1>
          <p class="text-muted mb-4 line-height-3">
            活動報告の投稿が完了しました。<br />
            引き続き活動を応援しています！
          </p>
          <Button
            label="続けて報告する"
            icon="pi pi-plus"
            @click="goBack"
            class="w-full"
          />
        </div>
      </template>
    </Card>
  </AppLayout>
</template>

<style scoped>
.user-avatar {
  width: 80px;
  height: 80px;
}

.text-muted {
  color: var(--p-text-muted-color);
}
</style>
