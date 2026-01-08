<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AppLayout from '../components/AppLayout.vue'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import Card from 'primevue/card'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import FileUpload from 'primevue/fileupload'

const router = useRouter()
const toast = useToast()

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

// Image upload
const selectedImage = ref(null)
const imagePreviewUrl = ref(null)

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

onUnmounted(() => {
  // Clean up preview URL to prevent memory leak
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
})

const onImageSelect = (event) => {
  const file = event.files[0]
  if (file) {
    selectedImage.value = file
    if (imagePreviewUrl.value) {
      URL.revokeObjectURL(imagePreviewUrl.value)
    }
    imagePreviewUrl.value = URL.createObjectURL(file)
  }
}

const removeImage = () => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  selectedImage.value = null
  imagePreviewUrl.value = null
}

const isTimeOrderValid = () => {
  if (!activityTimeStart.value || !activityTimeEnd.value) return true
  return activityTimeStart.value < activityTimeEnd.value
}

// Time assist button helpers
const timeToMinutes = (time) => {
  if (!time) return null
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const isMinusButtonDisabled = computed(() => {
  if (!activityTimeStart.value || !activityTimeEnd.value || isSubmitting.value) {
    return true
  }
  return activityTimeStart.value === activityTimeEnd.value
})

const isPlusButtonDisabled = computed(() => {
  return !activityTimeStart.value || isSubmitting.value
})

const activityDurationText = computed(() => {
  if (!activityTimeStart.value || !activityTimeEnd.value) return null
  const startMinutes = timeToMinutes(activityTimeStart.value)
  const endMinutes = timeToMinutes(activityTimeEnd.value)
  const diff = endMinutes - startMinutes
  if (diff <= 0) return null
  const hours = Math.floor(diff / 60)
  const minutes = diff % 60
  if (hours > 0 && minutes > 0) {
    return `${hours}時間${minutes}分`
  } else if (hours > 0) {
    return `${hours}時間`
  } else {
    return `${minutes}分`
  }
})

const adjustEndTime = (deltaMinutes) => {
  const startMinutes = timeToMinutes(activityTimeStart.value)
  let endMinutes = timeToMinutes(activityTimeEnd.value)

  if (endMinutes === null || endMinutes <= startMinutes) {
    // 終了時刻が未入力または開始時刻以前の場合は開始時刻を基準にする
    endMinutes = startMinutes + deltaMinutes
  } else {
    endMinutes = endMinutes + deltaMinutes
  }

  if (endMinutes < startMinutes) {
    endMinutes = startMinutes
  }

  activityTimeEnd.value = minutesToTime(endMinutes)
}

const isFormValid = () => {
  return activityId.value && activityDate.value && activityTimeStart.value && activityTimeEnd.value && participants.value !== null && isTimeOrderValid()
}

const resetForm = () => {
  activityId.value = null
  activityDate.value = new Date().toISOString().split('T')[0]
  activityTimeStart.value = ''
  activityTimeEnd.value = ''
  participants.value = null
  content.value = ''
  xPostUrl.value = ''
  removeImage()
}

const submitPost = async () => {
  if (!isFormValid()) {
    return
  }

  isSubmitting.value = true

  try {
    const formData = new FormData()
    formData.append('activityId', activityId.value)
    formData.append('date', activityDate.value)
    formData.append('timeStart', activityTimeStart.value)
    formData.append('timeEnd', activityTimeEnd.value)
    formData.append('participants', participants.value)
    if (content.value) {
      formData.append('content', content.value)
    }
    if (xPostUrl.value) {
      formData.append('xPostUrl', xPostUrl.value)
    }
    if (selectedImage.value) {
      formData.append('image', selectedImage.value)
    }

    const response = await fetch('/api/posts', {
      method: 'POST',
      credentials: 'include',
      body: formData
    })

    if (response.ok) {
      resetForm()
      router.push('/complete')
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
  <AppLayout>
    <div v-if="isLoading" class="flex flex-column align-items-center gap-3 p-5">
      <ProgressSpinner strokeWidth="4" />
      <p class="text-muted m-0">読み込み中...</p>
    </div>

    <Card v-else class="post-form-card">
      <template #content>
        <div class="formgrid grid">
          <div class="field col-12">
            <label for="activity">活動名 <span class="required">*</span></label>
            <Select
              id="activity"
              v-model="activityId"
              :options="activities"
              optionValue="id"
              placeholder="選択してください"
              :disabled="isSubmitting"
              fluid
            >
              <template #value="slotProps">
                <span v-if="slotProps.value">
                  {{ activities.find(a => a.id === slotProps.value)?.emoji }}
                  {{ activities.find(a => a.id === slotProps.value)?.name }}
                </span>
                <span v-else>{{ slotProps.placeholder }}</span>
              </template>
              <template #option="slotProps">
                <span>{{ slotProps.option.emoji }} {{ slotProps.option.name }}</span>
              </template>
            </Select>
          </div>

          <div class="field col-12 md:col-6">
            <label for="date">活動日 <span class="required">*</span></label>
            <InputText
              id="date"
              type="date"
              v-model="activityDate"
              :disabled="isSubmitting"
              fluid
            />
          </div>
          <div class="hidden md:block md:col-6" />

          <div class="col-12">
            <label>活動時間 <span class="required">*</span></label>
          </div>
          <div class="col-12 md:col-6 mb-2">
            <div class="time-range">
              <InputText
                id="timeStart"
                type="time"
                v-model="activityTimeStart"
                :disabled="isSubmitting"
                :invalid="!isTimeOrderValid()"
                fluid
              />
              <span class="time-separator">〜</span>
              <InputText
                id="timeEnd"
                type="time"
                v-model="activityTimeEnd"
                :disabled="isSubmitting"
                :invalid="!isTimeOrderValid()"
                fluid
              />
            </div>
          </div>

          <div class="col-12 md:col-6 mb-2 flex align-items-center">
            <div class="time-assist-buttons flex gap-2">
              <ButtonGroup>
                <Button label="-30m" size="small" severity="secondary" outlined :disabled="isMinusButtonDisabled" @click="adjustEndTime(-30)" />
                <Button label="+30m" size="small" severity="secondary" outlined :disabled="isPlusButtonDisabled" @click="adjustEndTime(30)" />
              </ButtonGroup>
              <ButtonGroup>
                <Button label="-1h" size="small" severity="secondary" outlined :disabled="isMinusButtonDisabled" @click="adjustEndTime(-60)" />
                <Button label="+1h" size="small" severity="secondary" outlined :disabled="isPlusButtonDisabled" @click="adjustEndTime(60)" />
              </ButtonGroup>
            </div>
          </div>
          
          <div class="field col-12">
            <small v-if="!isTimeOrderValid()" class="block text-error">終了時刻は開始時刻より後にしてください</small>
            <small v-else-if="activityDurationText" class="block text-muted">合計: {{ activityDurationText }}</small>
          </div>

          <div class="field col-12 md:col-6">
            <label for="participants">活動人数 <span class="required">*</span></label>
            <InputNumber
              id="participants"
              v-model="participants"
              :min="1"
              showButtons
              :disabled="isSubmitting"
              fluid
            />
          </div>

          <div class="hidden md:block md:col-6" />

          <div class="field col-12">
            <label for="content">活動内容・連絡事項</label>
            <Textarea
              id="content"
              v-model="content"
              rows="4"
              :disabled="isSubmitting"
              autoResize
              fluid
            />
            <small class="block mt-2 text-muted">トラブルの予見などがあれば報告してください</small>
          </div>

          <div class="field col-12">
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

          <div class="field col-12">
            <label for="image">活動写真</label>
            <div v-if="!selectedImage">
              <FileUpload
                mode="basic"
                accept="image/jpeg,image/png,image/gif,image/webp"
                :maxFileSize="8000000"
                chooseLabel="画像を選択"
                :auto="false"
                customUpload
                @select="onImageSelect"
                :disabled="isSubmitting"
                class="p-button-outlined"
                severity="secondary"
              />
            </div>
            <div v-else class="image-preview">
              <img :src="imagePreviewUrl" alt="プレビュー" class="preview-img" />
              <Button
                icon="pi pi-times"
                severity="secondary"
                size="small"
                text
                rounded
                @click="removeImage"
                :disabled="isSubmitting"
                class="remove-btn"
              />
            </div>
            <small class="block mt-2 text-muted">広報写真として利用する場合があります</small>
          </div>

          <div class="field col-12 mb-0">
            <Button
              label="投稿する"
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
  </AppLayout>
</template>

<style scoped>
.text-muted {
  color: var(--p-text-muted-color);
}

.text-error {
  color: var(--p-red-500);
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
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

.image-preview {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.preview-img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  object-fit: contain;
}

.remove-btn {
  position: absolute;
  top: 3px;
  right: 3px;
}
</style>
