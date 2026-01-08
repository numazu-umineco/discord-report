<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useDiscordAvatar } from '../composables/useDiscordAvatar'
import Toolbar from 'primevue/toolbar'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'

const router = useRouter()
const authStore = useAuthStore()
const { getAvatarUrl } = useDiscordAvatar()

const logout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="app-layout flex flex-column min-h-screen px-2">
    <div class="header-container">
      <Toolbar class="header-toolbar px-3">
        <template #start>
          <h1 class="app-title text-lg font-semibold m-0">umineco-report</h1>
        </template>
        <template #end>
          <div v-if="authStore.user" class="flex align-items-center gap-2">
            <Avatar :image="getAvatarUrl(authStore.user)" shape="circle" />
            <span class="hidden md:inline">{{ authStore.user.username }}</span>
            <Button icon="pi pi-sign-out"
              v-tooltip.bottom="'ログアウト'"
              severity="secondary"
              variant="outlined"
              size="small"
              @click="logout" />
          </div>
        </template>
      </Toolbar>
    </div>

    <main class="main-content">
      <slot />
    </main>

    <footer class="py-5">
      <div class="text-center text-muted text-sm">
        &copy; 2023 umineco
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--p-surface-100);
}

.header-toolbar {
  max-width: 600px;
  margin: 1rem auto;
  background: var(--p-surface-0);
}

.app-title {
  font-weight: 600;
}

.main-content {
  max-width: 600px;
  width: 100%;
  margin: 1rem auto;
}
</style>
