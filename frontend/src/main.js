import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import Material from '@primeuix/themes/material'
import Lara from '@primeuix/themes/lara'
import ToastService from 'primevue/toastservice'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: 'none'
    }
  }
})
app.use(ToastService)
app.mount('#app')
