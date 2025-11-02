<template>
  <CustomToast />
  <GlobalLoading />

  <div class="flex flex-col min-h-screen">
    <div class="w-full flex-grow mx-auto p-4">
      <!-- Header -->
      <header class="px-4">
        <div class="flex justify-between items-center">
          <div @click="$router.push('/dashboard')" class="text-3xl font-bold cursor-pointer">
            <span class="text-gray-500">Stock</span>
            <span :style="{ color: 'var(--p-primary-color)' }">Bar</span>
          </div>
    
          <HeaderNav />
          
    
          <div class="flex justify-center items-center">
            <Button
              class="p-button-rounded p-button-text"
              aria-label="Search"
              icon="pi pi-search"
              @click="searchBoxVisible = true"
            />
            
    
            <Button
              :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
              @click="toggleDarkMode"
              class="p-button-rounded p-button-text"
              aria-label="Toggle Dark Mode"
              size="small"
            />
    
            <Button
              @click="toggleLanguage"
              class="p-button-rounded p-button-text"
              icon="pi pi-language"
              aria-label="Language"
              size="small"
            />
    
            <!-- 有登入 -->
            <template v-if="auth.user">
              <Avatar :image="auth.user.photoURL" @click="toggleMenu" shape="circle" class="m-2 cursor-pointer" />
              <Menu ref="menu" :model="menuItems" :popup="true" />
            </template>
            <!-- 沒登入 -->
            <template v-else>
              <Avatar  @click="auth.login" icon="pi pi-user" shape="circle" class="m-2 cursor-pointer" />
            </template>
    
          </div>
        </div>
      </header>
      
      <!-- Main Content -->
      <div class="px-4">
        <!-- portfolios drop select ＋ buttons bar -->
        <div v-if="!isAssetRoute" class="flex items-center justify-between py-4">
          <div>
            <!-- <a class="font-bold" @click="$router.push('/portfolios')" :style="{ color: 'var(--p-primary-color)' }">
              {{ $t('allPortfolios') }}
            </a>
              /  -->
            
            {{ $t('currentPortfolio') }}

            <!-- 選擇投資組合 -->
            <Select 
              v-model="selectedPortfolio" 
              size="small" ref="PortfolioSelect" 
              :options="portfolioStore.portfolios" optionLabel="name" checkmark 
              :highlightOnSelect="false" class="m-2"
              >
              <!-- :pt="{
                root: { 
                  style: { border: '1px solid transparent', boxShadow: 'none' },
                  class: 'custom-select-root' 
                }
              }" -->
              <template #header>
                  <div class="p-3">
                      <span class="font-bold">{{ $t('currentPortfolio') }}</span>
                  </div>
              </template>
              <template #dropdownicon>
                <i class="pi pi-chevron-down" style="font-size: .75rem"></i>
              </template>
              <template #footer>
                  <div class="p-3 border-t-1 border-gray-200">
                      <Button :label="$t('addPortfolio')" icon="pi pi-plus" @click="dialogVisible = true" fluid severity="secondary" text size="small" />
                  </div>
              </template>
            </Select>
          </div>
      
          <div v-if="noShowAddInvestmentButton">
            <Button @click="transctionDialogVisible = true" type="button" size="small" :label="$t('addInvestment')" icon="pi pi-plus" />
            <Button @click="importDataDialogVisible = true" type="button" size="small" :label="$t('import')" icon="pi pi-file-import" class="ml-2"></Button>
            <!-- <Button type="button" :label="$t('rebalance')" @click="$router.push('/rebalancing')" icon="pi pi-building-columns" rounded /> -->
          </div>
          
        </div>

        <RouterView />
      </div>
    </div>
  
    <Footer></Footer>
  </div>



  <Dialog v-model:visible="searchBoxVisible" modal dismissableMask position="top" :style="{ width: '25rem', top: '5rem' }" :closeOnEscape="true" :showHeader="false">
    <template #container>
      <SearchBox 
        @close="searchBoxVisible = false"
        ></SearchBox>
    </template>
  </Dialog>

  <ImportDataDialog 
      v-model="importDataDialogVisible"
      />

  <TransactionDialog
      v-model="transctionDialogVisible"
    />

  <PortfolioFormDialog 
      :visible="dialogVisible"
      @update:visible="dialogVisible = $event"
      />
  
</template>
<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar';
import Menu from 'primevue/menu';
import Dialog from 'primevue/dialog';
import 'primeicons/primeicons.css';
import SearchBox from './components/SearchBox.vue'
import TransactionDialog from '@/components/TransactionDialog.vue'
import PortfolioFormDialog from './components/PortfolioFormDialog.vue'
import HeaderNav from './components/HeaderNav.vue'
import Footer from './components/Footer.vue'
import CustomToast from './components/CustomToast.vue'
import ImportDataDialog from './components/ImportDataDialog.vue'
import GlobalLoading from "@/components/GlobalLoading.vue";

import { useI18n } from 'vue-i18n'
const { locale } = useI18n()

const dialogVisible = ref(false);
const importDataDialogVisible = ref(false);

const route = useRoute();
const router = useRouter()

const isAssetRoute = computed(() => route.name === 'asset' || route.name === 'user-settings' || route.name === 'portfolios' );

const auth = useAuthStore()

const portfolioStore = usePortfolioStore()
const transctionDialogVisible = ref(false)

import { useHoldingsStore } from '@/stores/holdings';
const holdingsStore = useHoldingsStore();

import { useTransactionsStore } from '@/stores/transactions';
const transactionsStore = useTransactionsStore();

/*
    1. 如果已在登入狀態下刷新瀏覽器，auth.user 會自動重新登入
    2. 監聽 auth.user 的變化，如果有用戶登入則取得資料
*/

import { showLoading, hideLoading } from "@/composables/loading.js";

watch(() => auth.user, async (newUser) => {
  if (newUser) {
    showLoading('Loading user data...');
    console.log('User is logged in:', newUser);
    await getPortfolios();
    await holdingsStore.fetchHoldings();
    await transactionsStore.fetchTransactions();
    hideLoading();
  }
})

const selectedPortfolio = ref(null);

// Pinia → Local v-model 同步
watch(() => portfolioStore.currentPortfolio, (newVal) => {
  if (newVal?.id !== selectedPortfolio.value?.id) {
    selectedPortfolio.value = newVal
  }
})

// Local v-model → Pinia 同步
watch(selectedPortfolio, (newVal) => {
  if (newVal?.id !== portfolioStore.currentPortfolio?.id) {
    portfolioStore.setCurrentPortfolio(newVal)
  }
})

async function getPortfolios() {
    try {
        await portfolioStore.fetchPortfolios();
        selectedPortfolio.value = portfolioStore.currentPortfolio;
    } catch (error) {
        console.error('Error fetching portfolios:', error);
    }
}

const isDark = ref(false);
const searchBoxVisible = ref(false);

const toggleDarkMode = () => {
  isDark.value = !isDark.value;

  if (isDark.value) {
    document.documentElement.classList.add('my-app-dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('my-app-dark');
    localStorage.setItem('theme', 'light');
  }
};

const toggleLanguage = () => {
  const newLocale = locale.value === 'en' ? 'zh-TW' : 'en';
  locale.value = newLocale;
  localStorage.setItem('locale', newLocale);
};

const noShowAddInvestmentButton = computed(() => {
  const hideOnRoutes = ['portfolios', 'backtesting', 'rebalancing'];
  return !hideOnRoutes.includes(route.name);
});

// 初始載入：
onMounted(() => {
  // 套用 localStorage 的主題偏好
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    isDark.value = true;
    document.documentElement.classList.add('my-app-dark');
  }

  // 套用 localStorage 的語系偏好
  console.log('locale', locale.value);
  const savedLocale = localStorage.getItem('locale');
  if (savedLocale && savedLocale !== locale.value) {
    locale.value = savedLocale;
  }
});

// 登入會員相關

const menu = ref();

const toggleMenu = (event) => {
  menu.value.toggle(event);
};

const menuItems = [
  {
    label: '設定',
    icon: 'pi pi-cog',
    command: () => {
      router.push('/user-settings');
    },
  },
  {
    separator: true,
  },
  {
    label: '登出',
    icon: 'pi pi-sign-out',
    command: () => {
      auth.logout();
    },
  },
];

</script>

<style scoped>
header {
  text-align: center;
}
</style>

<style>
  .custom-select-root:hover {
    border: 1px solid rgb(121, 121, 121)!important;
  }
</style>
