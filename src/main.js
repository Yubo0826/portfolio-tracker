import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

import ToastService from 'primevue/toastservice';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
// import Material from '@primeuix/themes/material';
// import Lara from '@primeuix/themes/lara';

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.my-app-dark',
        }
    }
 });

app.use(ToastService);
app.use(createPinia())
app.use(router)

app.mount('#app')


import VueApexCharts from "vue3-apexcharts";
app.use(VueApexCharts);

// primevue components
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';

app.component('Button', Button);
app.component('InputText', InputText);
app.component('DataTable', DataTable);
app.component('Column', Column);
app.component('Dialog', Dialog);
app.component('InputNumber', InputNumber);
app.component('DatePicker', DatePicker);
