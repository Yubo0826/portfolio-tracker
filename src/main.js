// Global Styles
import './assets/main.css'

// Vue Core
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// i18n Setup
import { createI18n } from 'vue-i18n'
import messages from './i18n/index.js'

const lang = sessionStorage.getItem('lang') || 'zh'
const i18n = createI18n({
  legacy: false,
  locale: lang,
  messages
})

import SvgIcon from './components/SvgIcon.vue'
import AppCard from './components/AppCard.vue'

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
app.component('SvgIcon', SvgIcon)
app.component('AppCard', AppCard)

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
  MultiSelect
}

Object.entries(components).forEach(([name, component]) => {
  app.component(name, component)
})

// Mount App
app.mount('#app')
