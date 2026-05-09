<template>
  <CustomToast :dark="isDark" />
  <GlobalLoading />

  <div class="flex min-h-screen bg-[var(--p-content-background)]">

    <!-- ========== Left Sidebar (Desktop only) ========== -->
    <aside class="hidden lg:flex flex-col fixed top-0 left-0 h-full w-60 z-50
                  border-r border-[var(--p-content-border-color)]
                  bg-[var(--p-content-background)]">

      <!-- Logo -->
      <div class="px-5 pt-5 pb-4 shrink-0">
        <div @click="$router.push('/dashboard')"
             class="text-2xl font-bold cursor-pointer whitespace-nowrap select-none">
          <span class="text-gray-500">Stock</span>
          <span :style="{ color: 'var(--p-primary-color)' }">Bar</span>
        </div>
      </div>

      <!-- Portfolio Selector -->
      <div class="px-3 pb-4 shrink-0">
        <Select
          v-model="selectedPortfolioId"
          size="small"
          :options="portfolioStore.portfolios"
          optionLabel="name"
          optionValue="id"
          checkmark
          :highlightOnSelect="false"
          class="w-full"
        >
          <template #header>
            <div class="px-5 py-4 font-bold">{{ $t('currentPortfolio') }}</div>
          </template>
          <template #dropdownicon>
            <i class="pi pi-chevron-down text-xs"></i>
          </template>
          <template #footer>
            <div class="p-3 border-t border-[var(--p-content-border-color)]">
              <Button :label="$t('addPortfolio')" icon="pi pi-plus"
                @click="dialogVisible = true" fluid text size="small" />
            </div>
            <div class="p-3 pt-0">
              <Button :label="$t('portfolioManagement')" icon="pi pi-folder"
                @click="$router.push('/portfolios')" fluid text size="small" />
            </div>
          </template>
        </Select>
      </div>

      <!-- Navigation -->
      <div class="flex-1 overflow-y-auto pb-4">
        <HeaderNav />
      </div>

      <!-- User Info (bottom) -->
      <div class="shrink-0 border-t border-[var(--p-content-border-color)] p-3">
        <div class="flex items-center gap-3 cursor-pointer rounded-lg px-2 py-2
                    hover:bg-[var(--p-surface-100)] dark:hover:bg-[var(--p-surface-800)]
                    transition-colors"
             @click="toggleMenu">
          <Avatar :image="auth.user.photoURL" shape="circle" size="normal" />
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-medium truncate">
              {{ auth.user.displayName || auth.user.email }}
            </span>
            <span class="text-xs text-[var(--p-text-muted-color)] truncate">
              {{ auth.user.email }}
            </span>
          </div>
        </div>
      </div>
    </aside>

    <!-- ========== Main Area ========== -->
    <div class="flex flex-col flex-1 lg:ml-60 min-h-screen">

      <!-- Top Header -->
      <header class="fixed top-0 left-0 right-0 lg:left-60 z-40 h-14
                     px-3 sm:px-4 flex items-center gap-3
                     bg-[var(--p-content-background)]
                     border-b border-[var(--p-content-border-color)]">

        <!-- Mobile: Hamburger + Logo -->
        <div class="flex items-center gap-2 lg:hidden shrink-0">
          <Button
            @click="sidebarVisible = true"
            icon="pi pi-bars"
            size="small"
            variant="outlined"
            severity="secondary"
          />
          <div @click="$router.push('/dashboard')"
               class="text-xl font-bold cursor-pointer whitespace-nowrap select-none">
            <span class="text-gray-500">Stock</span>
            <span :style="{ color: 'var(--p-primary-color)' }">Bar</span>
          </div>
        </div>

        <!-- Search — Centered -->
        <div class="flex-1 flex justify-center">
          <SearchBox ref="searchBoxRef" />
        </div>

        <!-- Right: Theme toggle + Avatar (mobile only) -->
        <div class="flex items-center gap-1 shrink-0">
          <Button
            :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
            @click="toggleTheme"
            aria-label="Toggle Dark Mode"
            size="small"
            text
            rounded
            severity="secondary"
          />
          <!-- Avatar — mobile only (desktop shows in sidebar bottom) -->
          <div
            class="lg:hidden cursor-pointer ml-1 rounded-full
                   hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                   flex items-center justify-center"
            @click="toggleMenu"
          >
            <Avatar :image="auth.user.photoURL" shape="circle" size="normal" />
          </div>
        </div>

        <!-- TieredMenu popup -->
        <TieredMenu ref="menu" :model="menuItems" :popup="true" class="user-tiered-menu">
          <template #start>
            <div v-if="auth.user.uid !== 'demo-user'" class="user-info-item flex items-center p-4">
              <Avatar :image="auth.user.photoURL" shape="circle" class="mr-3" />
              <div class="flex flex-col">
                <span class="font-medium">{{ auth.user.displayName || auth.user.email }}</span>
                <span class="text-sm text-gray-500">{{ auth.user.email }}</span>
              </div>
            </div>
          </template>
          <template #item="{ item, props }">
            <a v-ripple class="flex items-center w-full" v-bind="props.action">
              <span class="ml-2">{{ item.label }}</span>
              <span v-if="item.suffix && !item.items" class="ml-auto text-sm text-gray-500">{{ item.suffix }}</span>
              <span v-if="item.items" class="ml-auto flex items-center gap-1 text-sm text-gray-500">
                <span v-if="item.suffix">{{ item.suffix }}</span>
                <i class="pi pi-chevron-right text-xs"></i>
              </span>
              <i v-if="item.active" class="pi pi-check ml-auto text-xs"></i>
            </a>
          </template>
        </TieredMenu>
      </header>

      <!-- Page Content -->
      <div class="flex flex-col flex-grow pt-14">
        <main class="px-2 sm:px-4 w-full flex-grow">

          <!-- Action Bar -->
          <div v-if="!isAssetRoute"
               class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-3">

            <!-- Portfolio Selector — Mobile only -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:hidden">
              <Select
                v-model="selectedPortfolioId"
                size="small"
                :options="portfolioStore.portfolios"
                optionLabel="name"
                optionValue="id"
                checkmark
                :highlightOnSelect="false"
              >
                <template #header>
                  <div class="px-5 py-4 font-bold">{{ $t('currentPortfolio') }}</div>
                </template>
                <template #dropdownicon>
                  <i class="pi pi-chevron-down text-xs"></i>
                </template>
                <template #footer>
                  <div class="p-3 border-t border-[var(--p-content-border-color)]">
                    <Button :label="$t('addPortfolio')" icon="pi pi-plus"
                      @click="dialogVisible = true" fluid text size="small" />
                  </div>
                  <div class="p-3 pt-0">
                    <Button :label="$t('portfolioManagement')" icon="pi pi-folder"
                      @click="$router.push('/portfolios')" fluid text size="small" />
                  </div>
                </template>
              </Select>
              <div
                v-if="auth.user?.uid === 'demo-user'"
                class="text-xs text-gray-400 flex items-center gap-1 whitespace-normal text-left sm:whitespace-nowrap"
              >
                <i class="pi pi-info-circle text-gray-400" aria-hidden="true"></i>
                <span>{{ $t('demoUserMessage') }}</span>
              </div>
            </div>

            <!-- Demo message on desktop -->
            <div v-if="auth.user?.uid === 'demo-user'"
                 class="hidden lg:flex text-xs text-gray-400 items-center gap-1">
              <i class="pi pi-info-circle" aria-hidden="true"></i>
              <span>{{ $t('demoUserMessage') }}</span>
            </div>
            <div v-else class="hidden lg:block"></div>

            <!-- Action Buttons -->
            <div class="flex justify-end w-full lg:ml-auto">
              <div v-if="showAddTradeButtonBar && auth.user.uid !== 'demo-user'">
                <div v-if="portfolioStore.portfolios.length === 0">
                  <Button @click="dialogVisible = true" size="small" :label="$t('addPortfolio')" icon="pi pi-plus" />
                </div>
                <div class="flex flex-wrap gap-4" v-else>
                  <Button @click="transctionDialogVisible = true" size="small" :label="$t('addInvestment')" icon="pi pi-plus" />
                  <Button @click="importDataDialogVisible = true" size="small" :label="$t('import')" icon="pi pi-upload" variant="text" />
                </div>
              </div>
              <div v-else-if="auth.user.uid === 'demo-user'">
                <Button @click="auth.login" label="Get Started" icon="pi pi-arrow-right" iconPos="right" />
              </div>
            </div>
          </div>

          <RouterView />
        </main>

        <Footer />
      </div>
    </div>
  </div>



  <ImportDataDialog v-model="importDataDialogVisible" />
  <TransactionDialog v-model="transctionDialogVisible" />
  <PortfolioFormDialog :visible="dialogVisible" @update:visible="dialogVisible = $event" />
  <MobileSidebar v-model:visible="sidebarVisible" />
</template>

<script setup>
// 同原始邏輯，無變動
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { usePortfolioStore } from '@/stores/portfolio'
const portfolioStore = usePortfolioStore()
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import TieredMenu from 'primevue/tieredmenu'
import Select from 'primevue/select'
import 'primeicons/primeicons.css'
import SearchBox from './components/SearchBox.vue'
import TransactionDialog from '@/components/TransactionDialog.vue'
import PortfolioFormDialog from './components/PortfolioFormDialog.vue'
import HeaderNav from './layouts/HeaderNav.vue'
import MobileSidebar from './layouts/MobileSidebar.vue'
import Footer from './layouts/Footer.vue'
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
const isAssetRoute = computed(() => ['asset', 'user-settings', 'portfolios', 'user-guide', 'cash-flow', 'cash-flows'].includes(route.name))
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

const searchBoxRef = ref(null)

const openSearchBox = () => {
  searchBoxRef.value?.open()
}

const onGlobalSearchShortcut = (event) => {
  if (event.isComposing || event.repeat) return
  const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'
  if (!isShortcut) return

  event.preventDefault()
  openSearchBox()
}

const languageOptions = [
  { label: 'English', value: 'en', flag: '🇺🇸' },
  { label: '繁體中文', value: 'zh-TW', flag: '🇹🇼' }
]

const currentLanguage = ref(locale.value)

const setCurrency = (value) => {
  settingsStore.setDisplayCurrency(value)
}

const selectLanguage = (value) => {
  locale.value = value
  currentLanguage.value = value
  localStorage.setItem('locale', value)
}

// 顯示新增交易按鈕列的條件: 在 portfolios, backtesting, rebalancing 頁面不顯示
const showAddTradeButtonBar = computed(() => !['portfolios', 'backtesting', 'rebalancing'].includes(route.name))

// Mobile sidebar state
const sidebarVisible = ref(false)

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale && savedLocale !== locale.value) {
    locale.value = savedLocale
    currentLanguage.value = savedLocale
  }

  window.addEventListener('keydown', onGlobalSearchShortcut)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalSearchShortcut)
})


const menu = ref()
const toggleMenu = (event) => menu.value.toggle(event)
const languageSubItems = computed(() =>
  languageOptions.map(option => ({
    label: `${option.flag} ${option.label}`,
    active: currentLanguage.value === option.value,
    command: () => selectLanguage(option.value),
  }))
)

const currencySubItems = computed(() => [
  { label: 'USD', active: displayCurrency.value === 'USD', command: () => setCurrency('USD') },
  { label: 'TWD', active: displayCurrency.value === 'TWD', command: () => setCurrency('TWD') },
])

const currentLanguageLabel = computed(() => {
  const lang = languageOptions.find(opt => opt.value === currentLanguage.value)
  return lang ? lang.label : currentLanguage.value
})

const menuItems = computed(() => {
  const list = [
    { label: t('language'), icon: 'pi pi-language', items: languageSubItems.value, suffix: currentLanguageLabel.value },
    { label: t('currency.label'), icon: 'pi pi-dollar', items: currencySubItems.value, suffix: displayCurrency.value },
    { separator: true },
    { label: t('userGuide'), icon: 'pi pi-book', command: () => router.push('/user-guide') },
  ]
  if (auth.user.uid !== 'demo-user') {
    list.unshift({ separator: true })
    list.push({ separator: true })
    list.push({ label: t('logout'), icon: 'pi pi-sign-out', command: () => auth.logout() })
  } else {
    list.push({ separator: true })
    list.push({ label: t('login'), icon: 'pi pi-sign-in', command: () => auth.login() })
  }
  return list
})
</script>

<style scoped>
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


.page-main-transition {
  width: 100%;
}

.page-main-enter-active,
.page-main-leave-active {
  transition: opacity 0.32s ease, transform 0.32s ease;
  will-change: opacity, transform;
}

.page-main-enter-from,
.page-main-leave-to {
  opacity: 0;
  transform: translateY(18px);
}

.page-main-enter-to,
.page-main-leave-from {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .page-main-enter-active,
  .page-main-leave-active {
    transition: none;
  }
}

</style>

<style>
.custom-select-root:hover {
  border: 1px solid rgb(121, 121, 121) !important;
}

.language-menu {
  z-index: 1000;
}

.lang-currency-menu {
  min-width: 200px;
}

.lang-currency-menu :deep(.p-menu-item-content) {
  padding: 0 !important;
}

.lang-currency-menu.p-menu {
  padding: 0.5rem;
  border-radius: 0.75rem;
  border: 1px solid var(--p-content-border-color);
  background: var(--p-surface-card);
  box-shadow: 0 14px 30px rgba(7, 10, 18, 0.16);
}

.lang-currency-menu .p-menu-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.menu-panel-title {
  color: var(--p-text-color);
}

.menu-panel-item {
  border-radius: 0.5rem;
  border: 1px solid var(--p-content-border-color);
  color: var(--p-text-color);
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.menu-panel-item:hover {
  background: var(--p-surface-hover);
}

.menu-panel-item.is-active {
  border-color: color-mix(in srgb, var(--p-primary-color) 55%, white);
  background: color-mix(in srgb, var(--p-primary-color) 18%, white);
  color: var(--p-primary-color);
}

.dark .lang-currency-menu.p-menu {
  background: color-mix(in srgb, var(--p-surface-card) 88%, black);
  border-color: color-mix(in srgb, var(--p-content-border-color) 85%, #1d2436);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.45);
}

.dark .menu-panel-item {
  border-color: color-mix(in srgb, var(--p-content-border-color) 80%, #1c2438);
}

.dark .menu-panel-item:hover {
  background: color-mix(in srgb, var(--p-primary-color) 14%, transparent);
}

.dark .menu-panel-item.is-active {
  border-color: color-mix(in srgb, var(--p-primary-color) 72%, #6f7cff);
  background: color-mix(in srgb, var(--p-primary-color) 62%, #3644b3);
  color: #ffffff;
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


/* 自訂 Primevue DataTable 排序圖示 */

/* 1. 把原本的 SVG icon 藏起來 */
.p-datatable .p-datatable-sort-icon {
  display: none;
}

/* 2. 基本樣式：讓 sort 的 span 有空間顯示新 icon */
.p-datatable th [data-pc-section="sort"]::before {
  display: inline-block;
  font-size: 0.75rem;
  width: 1em;
  text-align: center;
}

/* 3. 未排序：不顯示任何符號 */
.p-datatable th[aria-sort="none"] [data-pc-section="sort"]::before,
.p-datatable th:not([aria-sort]) [data-pc-section="sort"]::before {
  content: '';
}

/* 4. 升冪 ▲ */
.p-datatable th[aria-sort="ascending"] [data-pc-section="sort"]::before {
  content: '▲';
}

/* 5. 降冪 ▼ */
.p-datatable th[aria-sort="descending"] [data-pc-section="sort"]::before {
  content: '▼';
}

</style>
