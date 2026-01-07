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
  <div class="app-layout">
    <Toolbar class="header-toolbar">
      <template #start>
        <span class="app-title">Discord Report</span>
      </template>
      <template #end>
        <div v-if="authStore.user" class="flex align-items-center gap-2">
          <Avatar :image="getAvatarUrl(authStore.user)" shape="circle" />
          <span class="hidden md:inline">{{ authStore.user.username }}</span>
          <Button icon="pi pi-sign-out" severity="secondary" variant="outlined" size="small" @click="logout" />
        </div>
      </template>
    </Toolbar>

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
  border-top: none;
  border-right: none;
  border-left: none;
  border-radius: 0;
  background: var(--p-surface-0);
}

.app-title {
  font-weight: 600;
}

.main-content {
  max-width: 600px;
  margin: 1rem auto;
  padding: 0 0.5rem;
}
</style>
