import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { definePreset, palette } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip';

import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import './style.css'
import App from './App.vue'
import router from './router'

const UminecoTheme = definePreset(Aura, {
  semantic: {
    primary: palette('#22c4fa')
  }
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: UminecoTheme,
    options: {
      darkModeSelector: 'none'
    }
  }
})

app.directive('tooltip', Tooltip)
app.use(ToastService)
app.mount('#app')
