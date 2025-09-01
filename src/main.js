import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

import { createI18n } from 'vue-i18n'
import messages from './i18n/index.js'

const langCookie = sessionStorage.getItem('lang') || 'zh';
const i18n = createI18n({
    legacy: false,
    locale: langCookie,
    messages
});

app.use(i18n);

import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

import { definePreset } from '@primeuix/themes';

const MyPreset = definePreset(Aura, {
    components: {
        card: {
            colorScheme: {
                light: {
                    root: {
                        background: '{surface.0}',
                        color: '{surface.700}'
                    },
                    subtitle: {
                        color: '{surface.500}'
                    }
                },
                dark: {
                    root: {
                        background: '{surface.900}',
                        color: '{surface.0}'
                    },
                    subtitle: {
                        color: '{surface.400}'
                    }
                }
            }
        }
    }
});



app.directive('tooltip', Tooltip);

app.use(PrimeVue, {
    theme: {
        preset: MyPreset,
        options: {
            darkModeSelector: '.my-app-dark',
            cssLayer: false
        }
    }
 });

app.use(ConfirmationService);
app.use(ToastService);
app.use(createPinia());
app.use(router);


import VueApexCharts from "vue3-apexcharts";
app.use(VueApexCharts);

// primevue components
import Button from 'primevue/button';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import SelectButton from 'primevue/selectbutton';
import Card from 'primevue/card';
import Tag from 'primevue/tag';

app.component('Button', Button);
app.component('Select', Select);
app.component('InputText', InputText);
app.component('DataTable', DataTable);
app.component('Column', Column);
app.component('Dialog', Dialog);
app.component('ConfirmDialog', ConfirmDialog);
app.component('InputNumber', InputNumber);
app.component('DatePicker', DatePicker);
app.component('Toast', Toast);
app.component('SelectButton', SelectButton);
app.component('Card', Card);
app.component('Tag', Tag);


app.mount('#app');
