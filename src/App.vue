<template>
  <CustomToast />
  <GlobalLoading />

  <div class="flex flex-col min-h-screen">
    <!-- 最大寬度 ; max-w-screen-md, 768px ; max-w-screen-lg, 1024px ; max-w-screen-xl, 1280px ; max-w-screen-2xl, 1536px. -->
    <div class="w-full flex-grow mx-auto p-4 max-w-screen-xl">
      <!-- Header -->
      <header class="px-2 sm:px-4 mb-4">
        <div class="flex justify-between items-center gap-2 sm:gap-3 py-2">
          <!-- Left: Hamburger Menu (Mobile) + Logo -->
          <div class="flex items-center gap-2 sm:gap-3">
            <!-- Hamburger Toggle Button - Mobile Only -->
            <span class="lg:hidden">
              <Button
                @click="sidebarVisible = true"
                icon="pi pi-bars"
                class="hamburger-btn lg:hidden"
                size="small"
                variant="outlined"
              />
            </span>

            <!-- Logo -->
            <div @click="$router.push('/dashboard')" class="text-3xl font-bold cursor-pointer whitespace-nowrap flex-shrink-0">
              <span class="text-gray-500">Stock</span>
              <span :style="{ color: 'var(--p-primary-color)' }">Bar</span>
            </div>
          </div>

          <!-- 導覽列 - Hidden on mobile, shown on lg+ -->
          <div class="hidden lg:flex items-center justify-center flex-wrap gap-2 sm:gap-4">
            <HeaderNav />
          </div>

          <!-- 右上功能按鈕區 -->
          <div class="flex justify-center items-center flex-wrap gap-1">
            <!-- Currency Toggle -->
            <Button
              class="p-button-rounded p-button-text"
              aria-label="Toggle Currency"
              @click="toggleCurrency"
              v-tooltip.bottom="currencyTooltip"
              size="small"
            >
              <div class="flex items-center gap-1 font-medium text-xs sm:text-sm">
                <i class="pi pi-sync" style="font-size: 0.75rem"></i>
                <span class="hidden sm:inline">{{ displayCurrency }}</span>
              </div>
            </Button>

            <Button
              class="p-button-rounded p-button-text"
              aria-label="Search"
              icon="pi pi-search"
              @click="searchBoxVisible = true"
              size="small"
            />

            <Button
              :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
              @click="toggleTheme"
              class="p-button-rounded p-button-text"
              aria-label="Toggle Dark Mode"
              size="small"
            />

            <div class="relative">
              <Button
                ref="languageButton"
                class="p-button-rounded p-button-text"
                icon="pi pi-language"
                aria-label="Language"
                size="small"
                @click="toggleLanguageMenu"
              />
              <Menu 
                ref="languageMenu"
                :model="languageMenuItems"
                :popup="true"
                class="language-menu"
              />
            </div>

            
            <template v-if="auth.user.uid !== 'demo-user'">
              <Avatar :image="auth.user.photoURL" @click="toggleMenu" shape="circle" class="cursor-pointer ml-4" size="normal" />
              <Menu ref="menu" :model="menuItems" :popup="true">

                <template #start>
                  <div class="user-info-item flex items-center p-3">
                    <Avatar :image="auth.user.photoURL" shape="circle" class="mr-3" />
                    <div class="flex flex-col">
                      <span class="font-medium">{{ auth.user.displayName || auth.user.email }}</span>
                      <span class="text-sm text-gray-500">{{ auth.user.email }}</span>
                    </div>
                  </div>
                </template>

              </Menu>
            </template>
            
            <template v-else>
              <!-- <Avatar @click="auth.login" icon="pi pi-user" shape="circle" class="m-2 cursor-pointer" /> -->
            </template>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="px-2 sm:px-4">
        <!-- Portfolio 選單 + 按鈕 -->
        <div v-if="!isAssetRoute" class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-3">
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <div class="text-sm font-medium">{{ $t('currentPortfolio') }}</div>
            <Select
              v-model="selectedPortfolioId"
              size="small"
              ref="PortfolioSelect"
              :options="portfolioStore.portfolios"
              optionLabel="name"
              optionValue="id"
              checkmark
              :highlightOnSelect="false"
              class="min-w-[180px]"
            >
              <template #header>
                <div class="p-3 font-bold">{{ $t('currentPortfolio') }}</div>
              </template>
              <template #dropdownicon>
                <i class="pi pi-chevron-down text-xs"></i>
              </template>
              <template #footer>
                <div class="p-3 border-t border-gray-200">
                  <Button
                    :label="$t('addPortfolio')"
                    icon="pi pi-plus"
                    @click="dialogVisible = true"
                    fluid
                    text
                    size="small"
                  />
                </div>

                <div class="p-3 pt-0">
                  <Button
                    :label="$t('portfolios')"
                    icon="pi pi-folder"
                    @click="$router.push('/portfolios'); openDropdown = null; closeTimer = null;"
                    fluid
                    text
                    size="small"
                  />
                </div>
              </template>
            </Select>
          </div>

          <div v-if="showAddTradeButtonBar && auth.user.uid !== 'demo-user'">
            <div v-if="portfolioStore.portfolios.length === 0">
              <Button @click="dialogVisible = true" size="small" :label="$t('addPortfolio')" icon="pi pi-plus" />
            </div>
            <div class="flex flex-wrap gap-2 justify-end" v-else>
              <Button @click="transctionDialogVisible = true" size="small" :label="$t('addInvestment')" icon="pi pi-plus" />
              <Button @click="importDataDialogVisible = true" size="small" :label="$t('import')" icon="pi pi-file-import" />
            </div>
          </div>
          <div v-else-if="auth.user.uid === 'demo-user'">
            <Button @click="auth.login" label="Get Started" icon="pi pi-arrow-right" iconPos="right" />
             <!-- <Button @click="auth.login" class="start-btn" data-hover="Login">
              <div class="flex items-center gap-2">
              {{ $t('GetStarted') }}
                <i class="pi pi-arrow-right"></i>
              </div>
             </Button> -->
          </div>
        </div>

        <RouterView />
      </main>
    </div>

    <Footer />
  </div>

  <!-- Search Dialog -->
  <Dialog
    v-model:visible="searchBoxVisible"
    modal
    dismissableMask
    position="top"
    :style="{ width: '90vw', maxWidth: '25rem', top: '5rem' }"
    :closeOnEscape="true"
    :showHeader="false"
  >
    <template #container>
      <SearchBox @close="searchBoxVisible = false" />
    </template>
  </Dialog>

  <ImportDataDialog v-model="importDataDialogVisible" />

  <TransactionDialog v-model="transctionDialogVisible" />

  <PortfolioFormDialog :visible="dialogVisible" @update:visible="dialogVisible = $event" />

  <!-- Mobile Sidebar -->
  <MobileSidebar v-model:visible="sidebarVisible" />
</template>

<script setup>
// 同原始邏輯，無變動
import { ref, watch, onMounted, computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { usePortfolioStore } from '@/stores/portfolio'
const portfolioStore = usePortfolioStore()
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import Menu from 'primevue/menu'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import 'primeicons/primeicons.css'
import SearchBox from './components/SearchBox.vue'
import TransactionDialog from '@/components/TransactionDialog.vue'
import PortfolioFormDialog from './components/PortfolioFormDialog.vue'
import HeaderNav from './components/HeaderNav.vue'
import MobileSidebar from './components/MobileSidebar.vue'
import Footer from './components/Footer.vue'
import CustomToast from './components/CustomToast.vue'
import ImportDataDialog from './components/ImportDataDialog.vue'
import GlobalLoading from "@/components/GlobalLoading.vue"
import { useI18n } from 'vue-i18n'
import { useHoldingsStore } from '@/stores/holdings'
import { useTransactionsStore } from '@/stores/transactions'
import { showLoading, hideLoading } from "@/composables/loading.js"

const { locale, t } = useI18n()
const dialogVisible = ref(false)
const importDataDialogVisible = ref(false)
const route = useRoute()
const router = useRouter()
const isAssetRoute = computed(() => ['asset', 'user-settings', 'portfolios', 'user-guide'].includes(route.name))
const auth = useAuthStore()
const transctionDialogVisible = ref(false)
const holdingsStore = useHoldingsStore()
const transactionsStore = useTransactionsStore()

import { useTheme } from '@/composables/useTheme.js'
const { isDark, toggleTheme } = useTheme()

// Currency settings
import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'
const settingsStore = useSettingsStore()
const { displayCurrency, exchangeRate } = storeToRefs(settingsStore)

const toggleCurrency = () => {
  settingsStore.toggleCurrency()
}

const currencyTooltip = computed(() => {
  if (displayCurrency.value === 'TWD') {
    const rate = exchangeRate.value.toFixed(2)
    return `1 USD = ${rate} TWD`
  }
  return t('currency.clickToSwitch', 'Click to switch currency')
})

// Fetch exchange rate on mount
onMounted(() => {
  settingsStore.fetchExchangeRate()
})

watch(() => auth.user, async (newUser) => {
  if (newUser) {
    showLoading(t('loadingUserData'))
    await getPortfolios()
    await holdingsStore.fetchHoldings()
    await transactionsStore.fetchTransactions()
    hideLoading()
  }
})

const selectedPortfolioId = ref(null)

watch(
  () => portfolioStore.currentPortfolio,
  (newVal) => {
    if (newVal?.id !== selectedPortfolioId.value)
      selectedPortfolioId.value = newVal?.id
  }
)

watch(selectedPortfolioId, (newId) => {
  const matchedPortfolio = portfolioStore.portfolios.find(p => p.id === newId)
  if (matchedPortfolio && matchedPortfolio.id !== portfolioStore.currentPortfolio?.id)
    portfolioStore.setCurrentPortfolio(matchedPortfolio)
})

async function getPortfolios() {
  try {
    await portfolioStore.fetchPortfolios()
    selectedPortfolioId.value = portfolioStore.currentPortfolio?.id
  } catch (error) {
    console.error('Error fetching portfolios:', error)
  }
}

const searchBoxVisible = ref(false)

const languageOptions = [
  { label: 'English', value: 'en', flag: '🇺🇸' },
  { label: '繁體中文', value: 'zh-TW', flag: '🇹🇼' }
]

const currentLanguage = ref(locale.value)

const languageMenuItems = computed(() => 
  languageOptions.map(option => ({
    label: `${option.flag} ${option.label}`,
    command: () => selectLanguage(option.value),
    class: currentLanguage.value === option.value ? 'active-language' : ''
  }))
)

const onLanguageChange = (event) => {
  const newLocale = event.value
  locale.value = newLocale
  currentLanguage.value = newLocale
  localStorage.setItem('locale', newLocale)
}

const languageMenu = ref()
const languageButton = ref()

const toggleLanguageMenu = (event) => {
  languageMenu.value?.toggle(event)
}

const selectLanguage = (value) => {
  locale.value = value
  currentLanguage.value = value
  localStorage.setItem('locale', value)
  languageMenu.value?.hide()
}

const toggleLanguage = () => {
  const newLocale = locale.value === 'en' ? 'zh-TW' : 'en'
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
}

// 顯示新增交易按鈕列的條件: 在 portfolios, backtesting, rebalancing 頁面不顯示
const showAddTradeButtonBar = computed(() => !['portfolios', 'backtesting', 'rebalancing'].includes(route.name))

// Mobile sidebar state
const sidebarVisible = ref(false)

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('my-app-dark')
  }
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale && savedLocale !== locale.value) {
    locale.value = savedLocale
    currentLanguage.value = savedLocale
  }
})

const menu = ref()
const toggleMenu = (event) => menu.value.toggle(event)
const menuItems = computed(() => [
  { separator: true },
  { label: t('userGuide'), icon: 'pi pi-book', command: () => router.push('/user-guide') },
  { label: t('logout'), icon: 'pi pi-sign-out', command: () => auth.logout() },
])
</script>

<style scoped>
header {
  text-align: center;
}

.start-btn:hover{cursor: pointer}
.start-btn {
  /* background: transparent; outline: none; */
  /* color: var(--p-primary-color); */
  position: relative;
  /* border: 2px solid var(--p-primary-color); */
  /* padding: 15px 50px; */
  overflow: hidden;
}

/*button:before (attr data-hover)*/
.start-btn:hover:before{opacity: 1; transform: translate(0,0);}
.start-btn:before{
  content: attr(data-hover);
  position: absolute;
  /* top: 1.1em; left: 0; */
  width: 100%;
  /* text-transform: uppercase; */
  /* letter-spacing: 3px; */
  font-weight: 600;
  /* font-size: .8em; */
  opacity: 0;
  transform: translate(-100%,0);
  transition: all .3s ease-in-out;
}

/*button div (button text before hover)*/
.start-btn:hover div{opacity: 0; transform: translate(100%,0)}
.start-btn div{
  /* text-transform: uppercase; */
  /* letter-spacing: 3px; */
  font-weight: 600;
  /* font-size: .8em; */
  transition: all .3s ease-in-out;
}

</style>

<style>
.custom-select-root:hover {
  border: 1px solid rgb(121, 121, 121) !important;
}

.language-menu {
  z-index: 1000;
}

.language-menu :deep(.active-language) {
  color: var(--p-primary-color) !important;
  font-weight: 600;
}

.language-menu :deep(.active-language:hover) {
  color: var(--p-primary-color) !important;
}

/* 用戶選單頭像樣式 */
.p-menu :deep(.user-info-item) {
  padding: 0 !important;
  margin: 0 !important;
}

.p-menu :deep(.user-info-item):hover {
  background: none !important;
  cursor: default !important;
}

.p-menu :deep(.user-info-item) .p-menuitem-content {
  padding: 0 !important;
}
</style>
