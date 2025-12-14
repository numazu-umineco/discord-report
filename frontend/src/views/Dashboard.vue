<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const API_URL = 'http://localhost:3000'

const user = ref(null)
const guilds = ref([])
const selectedGuild = ref(null)
const selectedChannel = ref(null)
const message = ref('')
const isLoading = ref(true)

onMounted(async () => {
  try {
    const [userResponse, guildsResponse] = await Promise.all([
      fetch(`${API_URL}/api/user`, { credentials: 'include' }),
      fetch(`${API_URL}/api/guilds`, { credentials: 'include' })
    ])

    if (userResponse.ok && guildsResponse.ok) {
      user.value = await userResponse.json()
      guilds.value = await guildsResponse.json()
    } else {
      router.push('/')
    }
  } catch (error) {
    console.error('Failed to fetch user data:', error)
    router.push('/')
  } finally {
    isLoading.value = false
  }
})

const logout = async () => {
  try {
    await fetch(`${API_URL}/auth/logout`, { credentials: 'include' })
    router.push('/')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const getAvatarUrl = (user) => {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
  }
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`
}

const getGuildIconUrl = (guild) => {
  if (guild.icon) {
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
  }
  return null
}

const submitPost = async () => {
  if (!message.value.trim()) {
    alert('メッセージを入力してください')
    return
  }

  // TODO: Implement actual posting functionality
  alert('投稿機能は次のステップで実装します')
}
</script>

<template>
  <div class="dashboard">
    <header class="header">
      <h1>Discord Report</h1>
      <div v-if="user" class="user-info">
        <img :src="getAvatarUrl(user)" :alt="user.username" class="avatar" />
        <span>{{ user.username }}</span>
        <button @click="logout" class="logout-btn">ログアウト</button>
      </div>
    </header>

    <main class="main-content">
      <div v-if="isLoading" class="loading">
        読み込み中...
      </div>

      <div v-else class="post-form">
        <h2>新規投稿</h2>

        <div class="form-group">
          <label>サーバーを選択</label>
          <div class="guild-list">
            <div
              v-for="guild in guilds"
              :key="guild.id"
              class="guild-item"
              :class="{ selected: selectedGuild?.id === guild.id }"
              @click="selectedGuild = guild"
            >
              <img
                v-if="getGuildIconUrl(guild)"
                :src="getGuildIconUrl(guild)"
                :alt="guild.name"
                class="guild-icon"
              />
              <div v-else class="guild-icon guild-icon-placeholder">
                {{ guild.name.charAt(0) }}
              </div>
              <span class="guild-name">{{ guild.name }}</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="message">メッセージ</label>
          <textarea
            id="message"
            v-model="message"
            placeholder="投稿するメッセージを入力..."
            rows="6"
          ></textarea>
        </div>

        <button
          class="submit-btn"
          @click="submitPost"
          :disabled="!selectedGuild || !message.trim()"
        >
          投稿する
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
  max-width: 800px;
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

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.guild-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
}

.guild-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 2px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.guild-item:hover {
  border-color: #5865F2;
  background: #f8f9ff;
}

.guild-item.selected {
  border-color: #5865F2;
  background: #eef0ff;
}

.guild-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-bottom: 0.5rem;
}

.guild-icon-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #5865F2;
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
}

.guild-name {
  font-size: 0.875rem;
  text-align: center;
  word-break: break-word;
  color: #333;
}

textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #eee;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}

textarea:focus {
  outline: none;
  border-color: #5865F2;
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
