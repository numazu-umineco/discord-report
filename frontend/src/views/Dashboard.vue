<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const activities = ref([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const submitResult = ref(null)

// Form fields
const activityId = ref('')
const activityDate = ref('')
const activityTime = ref('')
const participants = ref('')
const content = ref('')
const xPostUrl = ref('')

// Set default date to today
const today = new Date()
const defaultDate = today.toISOString().split('T')[0]
activityDate.value = defaultDate

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
  return activityId.value && activityDate.value && activityTime.value && participants.value
}

const resetForm = () => {
  activityId.value = ''
  activityDate.value = defaultDate
  activityTime.value = ''
  participants.value = ''
  content.value = ''
  xPostUrl.value = ''
}

const submitPost = async () => {
  if (!isFormValid()) {
    return
  }

  isSubmitting.value = true
  submitResult.value = null

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
        time: activityTime.value,
        participants: parseInt(participants.value),
        content: content.value,
        xPostUrl: xPostUrl.value
      })
    })

    if (response.ok) {
      submitResult.value = { success: true, message: '活動報告を投稿しました' }
      resetForm()
    } else {
      const error = await response.json()
      submitResult.value = { success: false, message: error.error || '投稿に失敗しました' }
    }
  } catch (error) {
    console.error('Failed to submit post:', error)
    submitResult.value = { success: false, message: '投稿に失敗しました' }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="dashboard">
    <header class="header">
      <h1>Discord Report</h1>
      <div v-if="authStore.user" class="user-info">
        <img :src="getAvatarUrl(authStore.user)" :alt="authStore.user.username" class="avatar" />
        <span>{{ authStore.user.username }}</span>
        <button @click="logout" class="logout-btn">ログアウト</button>
      </div>
    </header>

    <main class="main-content">
      <div v-if="isLoading" class="loading">
        読み込み中...
      </div>

      <div v-else class="post-form">
        <h2>活動報告</h2>

        <div v-if="submitResult" class="result-message" :class="{ success: submitResult.success, error: !submitResult.success }">
          {{ submitResult.message }}
        </div>

        <div class="form-group">
          <label for="activity">活動名 <span class="required">*</span></label>
          <select
            id="activity"
            v-model="activityId"
            :disabled="isSubmitting"
          >
            <option value="" disabled>選択してください</option>
            <option v-for="activity in activities" :key="activity.id" :value="activity.id">
              {{ activity.name }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="date">活動日 <span class="required">*</span></label>
            <input
              type="date"
              id="date"
              v-model="activityDate"
              :disabled="isSubmitting"
            />
          </div>

          <div class="form-group">
            <label for="time">活動時間 <span class="required">*</span></label>
            <input
              type="time"
              id="time"
              v-model="activityTime"
              :disabled="isSubmitting"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="participants">活動人数 <span class="required">*</span></label>
          <input
            type="number"
            id="participants"
            v-model="participants"
            min="0"
            placeholder="人数を入力"
            :disabled="isSubmitting"
          />
        </div>

        <div class="form-group">
          <label for="content">活動内容・連絡事項</label>
          <textarea
            id="content"
            v-model="content"
            placeholder="活動内容や連絡事項があれば入力..."
            rows="4"
            :disabled="isSubmitting"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="xPostUrl">X (Twitter) 投稿URL</label>
          <input
            type="url"
            id="xPostUrl"
            v-model="xPostUrl"
            placeholder="https://x.com/..."
            :disabled="isSubmitting"
          />
          <p class="field-hint">活動報告のポストURLがあれば入力してください</p>
        </div>

        <button
          class="submit-btn"
          @click="submitPost"
          :disabled="!isFormValid() || isSubmitting"
        >
          {{ isSubmitting ? '投稿中...' : '報告を投稿する' }}
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.logout-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: #c82333;
}

.main-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.post-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-form h2 {
  margin: 0 0 1.5rem;
  color: #333;
}

.result-message {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.result-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.result-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.required {
  color: #dc3545;
}

select,
input[type="date"],
input[type="time"],
input[type="number"],
input[type="url"],
textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #eee;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

select:focus,
input:focus,
textarea:focus {
  outline: none;
  border-color: #5865F2;
}

select:disabled,
input:disabled,
textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

textarea {
  resize: vertical;
}

.field-hint {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: #666;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: #5865F2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #4752C4;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
