<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../stores/auth'
import Toolbar from 'primevue/toolbar'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const activities = ref([])
const isLoading = ref(true)
const isSubmitting = ref(false)

// Form fields
const activityId = ref(null)
const activityDate = ref(new Date().toISOString().split('T')[0])
const activityTimeStart = ref('')
const activityTimeEnd = ref('')
const participants = ref(null)
const content = ref('')
const xPostUrl = ref('')

onMounted(async () => {
  try {
    const response = await fetch('/api/activities', { credentials: 'include' })
    if (response.ok) {
      activities.value = await response.json()
    } else {
      router.push('/')
    }
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    router.push('/')
  } finally {
    isLoading.value = false
  }
})

const logout = async () => {
  await authStore.logout()
  router.push('/')
}

const getAvatarUrl = (user) => {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
  }
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`
}

const isFormValid = () => {
  return activityId.value && activityDate.value && activityTimeStart.value && activityTimeEnd.value && participants.value !== null
}

const resetForm = () => {
  activityId.value = null
  activityDate.value = new Date().toISOString().split('T')[0]
  activityTimeStart.value = ''
  activityTimeEnd.value = ''
  participants.value = null
  content.value = ''
  xPostUrl.value = ''
}

const submitPost = async () => {
  if (!isFormValid()) {
    return
  }

  isSubmitting.value = true

  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        activityId: activityId.value,
        date: activityDate.value,
        timeStart: activityTimeStart.value,
        timeEnd: activityTimeEnd.value,
        participants: participants.value,
        content: content.value,
        xPostUrl: xPostUrl.value
      })
    })

    if (response.ok) {
      toast.add({
        severity: 'success',
        summary: '投稿完了',
        detail: '活動報告を投稿しました',
        life: 3000
      })
      resetForm()
    } else {
      const error = await response.json()
      toast.add({
        severity: 'error',
        summary: 'エラー',
        detail: error.error || '投稿に失敗しました',
        life: 5000
      })
    }
  } catch (error) {
    console.error('Failed to submit post:', error)
    toast.add({
      severity: 'error',
      summary: 'エラー',
      detail: '投稿に失敗しました',
      life: 5000
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="dashboard">
    <Toolbar class="header-toolbar">
      <template #start>
        <span class="app-title">Discord Report</span>
      </template>
      <template #end>
        <div v-if="authStore.user" class="flex align-items-center gap-2">
          <Avatar :image="getAvatarUrl(authStore.user)" shape="circle" />
          <span class="font-medium hidden md:inline">{{ authStore.user.username }}</span>
          <Button icon="pi pi-sign-out" severity="secondary" variant="outlined" size="small" @click="logout" />
        </div>
      </template>
    </Toolbar>

    <main class="main-content">
      <div v-if="isLoading" class="flex flex-column align-items-center gap-3 p-5">
        <ProgressSpinner strokeWidth="4" />
        <p class="text-muted m-0">読み込み中...</p>
      </div>

      <Card v-else class="post-form-card">
        <template #title>活動報告</template>
        <template #content>
          <div class="grid">
            <div class="col-12">
              <label for="activity">活動名 <span class="required">*</span></label>
              <Select
                id="activity"
                v-model="activityId"
                :options="activities"
                optionLabel="name"
                optionValue="id"
                placeholder="選択してください"
                :disabled="isSubmitting"
                fluid
              />
            </div>

            <div class="col-12 md:col-6">
              <label for="date">活動日 <span class="required">*</span></label>
              <InputText
                id="date"
                type="date"
                v-model="activityDate"
                :disabled="isSubmitting"
                fluid
              />
            </div>

            <div class="col-12 md:col-6">
              <label>活動時間 <span class="required">*</span></label>
              <div class="time-range">
                <InputText
                  id="timeStart"
                  type="time"
                  v-model="activityTimeStart"
                  :disabled="isSubmitting"
                  fluid
                />
                <span class="time-separator">〜</span>
                <InputText
                  id="timeEnd"
                  type="time"
                  v-model="activityTimeEnd"
                  :disabled="isSubmitting"
                  fluid
                />
              </div>
            </div>

            <div class="col-12">
              <label for="participants">活動人数 <span class="required">*</span></label>
              <InputNumber
                id="participants"
                v-model="participants"
                :min="0"
                showButtons
                placeholder="人数を入力"
                :disabled="isSubmitting"
                fluid
              />
            </div>

            <div class="col-12">
              <label for="content">活動内容・連絡事項</label>
              <Textarea
                id="content"
                v-model="content"
                placeholder="活動内容や連絡事項があれば入力..."
                rows="4"
                :disabled="isSubmitting"
                fluid
              />
            </div>

            <div class="col-12">
              <label for="xPostUrl">X (Twitter) 投稿URL</label>
              <InputText
                id="xPostUrl"
                v-model="xPostUrl"
                placeholder="https://x.com/..."
                :disabled="isSubmitting"
                fluid
              />
              <small class="block mt-2 text-muted">活動報告のポストURLがあれば入力してください</small>
            </div>

            <div class="col-12">
              <Button
                label="報告を投稿する"
                icon="pi pi-send"
                :loading="isSubmitting"
                :disabled="!isFormValid()"
                @click="submitPost"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--p-surface-100);
}

.header-toolbar {
  background: var(--p-surface-0);
}

.app-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.main-content {
  max-width: 600px;
  margin: 1rem auto;
  padding: 0 0.5rem;
}

.text-muted {
  color: var(--p-text-muted-color);
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.92rem;
  font-weight: 600;
}

.required {
  color: var(--p-red-500);
}

.time-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-separator {
  flex-shrink: 0;
  color: var(--p-text-muted-color);
}
</style>
