// Global Styles
import './assets/main.css'

// Vue Core
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 部署新版後，開著的舊分頁還在用舊的 index，點到沒載過的頁面時會去抓已被刪掉的舊 chunk（Failed to fetch dynamically imported module）。
// 遇到就重新整理拿新版；10 秒內只重整一次，避免伺服器真的掛掉時無限重整。
window.addEventListener('vite:preloadError', (event) => {
  let last = 0
  try { last = Number(sessionStorage.getItem('chunk-reload-at')) || 0 } catch {}
  if (Date.now() - last < 10000) return
  try { sessionStorage.setItem('chunk-reload-at', String(Date.now())) } catch {}
  event.preventDefault()
  window.location.reload()
})

// i18n Setup
import { createI18n } from 'vue-i18n'
import messages from './i18n/index.js'
import { readStoredLocale } from './composables/useLocale.js'

const lang = readStoredLocale()
const i18n = createI18n({
  legacy: false,
  locale: lang,
  messages
})

import Card from 'primevue/card'

// PrimeVue Setup
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'
import Ripple from 'primevue/ripple'
import customPreset from './themes/customPreset.js'

// PrimeVue Components
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import MultiSelect from 'primevue/multiselect'

// Chart Library
// 'highcharts/highstock' 是獨立打包的完整實例，無法和其他 modules/* 共用同一個 Highcharts 物件，
// 所以改用基礎 'highcharts' 搭配 modules/stock、modules/treemap 個別掛載
import Highcharts from 'highcharts'
import HighchartsVue from 'highcharts-vue'
import 'highcharts/modules/stock'
import 'highcharts/modules/treemap'
// 資產頁 K 線圖的技術指標（indicators 為核心，含 SMA／EMA；stochastic 需在 slow-stochastic 之前）
import 'highcharts/indicators/indicators'
import 'highcharts/indicators/bollinger-bands'
import 'highcharts/indicators/rsi'
import 'highcharts/indicators/macd'
import 'highcharts/indicators/stochastic'
import 'highcharts/indicators/slow-stochastic'

Highcharts.setOptions({
  lang: {
    locale: 'en-US',
    thousandsSep: ',',
    decimalPoint: '.',
  },
})

// App Instance
const app = createApp(App)

// Plugins
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(HighchartsVue, { highcharts: Highcharts })

app.use(PrimeVue, {
  theme: {
    preset: customPreset,
    options: {
      darkModeSelector: '.dark'
    }
  },
  locale: {
    selectAll: lang === 'zh' ? '全部' : 'All',
  }
})
app.use(ToastService)
app.use(ConfirmationService)

// Directives
app.directive('tooltip', Tooltip)
app.directive('ripple', Ripple)

// Global Components
const components = {
  Button,
  Select,
  InputText,
  DataTable,
  Column,
  Dialog,
  InputNumber,
  DatePicker,
  ConfirmDialog,
  Toast,
  SelectButton,
  Tag,
  MultiSelect,
  Card
}

Object.entries(components).forEach(([name, component]) => {
  app.component(name, component)
})

// Mount App
app.mount('#app')
