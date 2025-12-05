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
import Card from 'primevue/card'
import Tag from 'primevue/tag'

// Chart Library
import VueApexCharts from 'vue3-apexcharts'

// App Instance
const app = createApp(App)

// Plugins
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(VueApexCharts)

app.use(PrimeVue, {
  theme: {
    preset: customPreset,
    options: {
      darkModeSelector: '.my-app-dark'
    }
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
  Card,
  Tag
}

Object.entries(components).forEach(([name, component]) => {
  app.component(name, component)
})

// Mount App
app.mount('#app')
