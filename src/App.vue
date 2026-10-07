<template>
  <Toast position="bottom-center" group="standard" />
  <div v-if="globalLoadingVisible" class="fixed inset-0 z-[2102] flex items-center justify-center bg-black/40">
    <ProgressSpinner />
  </div>
  <ConfirmDialog />

  <!-- ponytail: 寫死 home 路由不套 app shell；之後若有第二個獨立頁面再改用 route.meta.bare -->
  <RouterView v-if="route.name === 'home'" />
  <div v-else class="app-shell h-screen overflow-hidden">
    <Sidebar
      persistent
      :currentPortfolioName="currentPortfolioName"
      :portfolioMenuItems="portfolioMenuItems"
      :portfolioListItems="portfolioListItems"
      :menuItems="menuItems"
      :isDemoUser="auth.user?.uid === 'demo-user'"
      :userDisplayName="displayUserName"
      :userEmail="auth.user?.email || ''"
      :userPhotoUrl="auth.user?.photoURL || ''"
    />

    <div class="flex h-screen flex-col app-shell__main">
      <AppHeader
        :currentPageLabel="currentPageLabel"
        :showAddTradeButtonBar="showAddTradeButtonBar"
        :isDemoUser="auth.user?.uid === 'demo-user'"
        :hasPortfolios="portfolioStore.portfolios.length > 0"
        :tradeActionItems="tradeActionItems"
        @open-sidebar="sidebarVisible = true"
        @open-search="openSearchBox"
        @create-portfolio="dialogVisible = true"
        @open-transaction="transctionDialogVisible = true"
        @login="auth.login"
      />

      <div class="app-shell__scroll app-shell__content flex-1 overflow-y-auto max-w-[1680px]">
        <main class="px-4 pb-8 pt-6 sm:px-6 lg:px-8 xl:px-10">
          <div v-if="route.name !== 'not-found'" class="mb-6 flex items-center justify-between gap-4">
            <div class="flex items-center gap-1">
              <h1 class="text-2xl font-bold">{{ currentPageLabel }}</h1>
              <div id="page-title-actions" class="flex items-center"></div>
            </div>
            <div id="page-title-aside" class="text-xs text-muted-color"></div>
          </div>
          <RouterView />
        </main>

        <div class="px-4 pb-6 sm:px-6 lg:px-8 xl:px-10">
          <Footer />
        </div>
      </div>
    </div>
  </div>

  <!-- Search Overlay -->
  <Dialog
    v-model:visible="searchBoxVisible"
    modal
    dismissableMask
    blockScroll
    position="top"
    :showHeader="false"
    :draggable="false"
    class="w-[min(38rem,calc(100vw-2rem))]"
    :pt="{ content: { class: '!p-2' } }"
  >
    <SearchBox @close="searchBoxVisible = false" />
  </Dialog>

  <ImportDataDialog v-model="importDialogVisible" :mode="importDialogMode" />

  <TransactionDialog v-model="transctionDialogVisible" />

  <PortfolioFormDialog
    :visible="dialogVisible"
    :editPortfolio="editPortfolio"
    @update:visible="dialogVisible = $event"
    @clear:editPortfolio="resetEditPortfolio()"
  />

  <!-- Sidebar -->
  <Sidebar
    v-model:visible="sidebarVisible"
    :currentPortfolioName="currentPortfolioName"
    :portfolioMenuItems="portfolioMenuItems"
    :portfolioListItems="portfolioListItems"
    :menuItems="menuItems"
    :isDemoUser="auth.user?.uid === 'demo-user'"
    :userDisplayName="displayUserName"
    :userEmail="auth.user?.email || ''"
    :userPhotoUrl="auth.user?.photoURL || ''"
  />
</template>

<script setup>
// 同原始邏輯，無變動
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { usePortfolioStore } from '@/stores/portfolio'
const portfolioStore = usePortfolioStore()
import { useAuthStore } from '@/stores/auth'
import 'primeicons/primeicons.css'
import SearchBox from './components/SearchBox.vue'
import TransactionDialog from '@/components/TransactionDialog.vue'
import PortfolioFormDialog from './components/PortfolioFormDialog.vue'
import AppHeader from './layouts/AppHeader.vue'
import Sidebar from './layouts/Sidebar.vue'
import Footer from './layouts/Footer.vue'
import ProgressSpinner from 'primevue/progressspinner'
import ImportDataDialog from './components/ImportDataDialog.vue'
import { useI18n } from 'vue-i18n'
import { useHoldingsStore } from '@/stores/holdings'
import { useTransactionsStore } from '@/stores/transactions'
import { useWatchlistStore } from '@/stores/watchlist'
import { showLoading, hideLoading, globalLoadingVisible } from "@/composables/loading.js"
import * as toast from '@/composables/toast'
import { buildSidebarSections } from './layouts/navigation.js'

const { locale, t } = useI18n()
const confirm = useConfirm()
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const importDialogMode = ref('transactions')
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const transctionDialogVisible = ref(false)
const holdingsStore = useHoldingsStore()
const transactionsStore = useTransactionsStore()
const watchlistStore = useWatchlistStore()
const sidebarSections = computed(() => buildSidebarSections(t))


// Currency settings
import { useSettingsStore } from '@/stores/settings'
import { useTheme } from '@/composables/useTheme'
const settingsStore = useSettingsStore()

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
    watchlistStore.fetchWatchlist() // 不阻塞載入畫面
    hideLoading()
  }
})

const RECENT_PORTFOLIOS_STORAGE_KEY = 'recentPortfolios'

const createEmptyPortfolio = () => ({
  id: null,
  name: '',
  description: '',
  drift_threshold: 5,
  enable_email_alert: true,
})

const safeParseRecentPortfolioIds = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_PORTFOLIOS_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const editPortfolio = ref(createEmptyPortfolio())
const recentPortfolioIds = ref(safeParseRecentPortfolioIds())

const persistRecentPortfolioIds = () => {
  localStorage.setItem(RECENT_PORTFOLIOS_STORAGE_KEY, JSON.stringify(recentPortfolioIds.value))
}

const resetEditPortfolio = () => {
  editPortfolio.value = createEmptyPortfolio()
}

const currentPortfolioName = computed(() => portfolioStore.currentPortfolio?.name || t('portfolio'))
const displayUserName = computed(() => auth.user.displayName || auth.user.email || 'StockBar')

const isNavItemActive = (item) => {
  return item.activePaths.some((path) => route.path === path || route.path.startsWith(`${path}/`))
}

const currentPageLabel = computed(() => {
  if (route.name === 'asset') return String(route.params.symbol || t('currentAsset'))
  if (route.name === 'user-settings') return t('userSettings')
  if (route.name === 'user-guide') return t('userGuide')

  const activeItem = sidebarSections.value
    .flatMap((section) => section.items)
    .find(isNavItemActive)
  if (activeItem) return activeItem.label

  return currentPortfolioName.value
})

// 全部投資組合，最近使用的排前面
const recentPortfolios = computed(() => {
  const recent = recentPortfolioIds.value
    .map((id) => portfolioStore.portfolios.find((portfolio) => portfolio.id === id))
    .filter(Boolean)
  const others = portfolioStore.portfolios.filter((portfolio) => !recentPortfolioIds.value.includes(portfolio.id))
  return [...recent, ...others]
})

const switchPortfolio = (portfolio) => {
  if (!portfolio || portfolio.id === portfolioStore.currentPortfolio?.id) return
  portfolioStore.setCurrentPortfolio(portfolio)
}

const rememberRecentPortfolio = (portfolio) => {
  if (!portfolio?.id) return
  recentPortfolioIds.value = [portfolio.id, ...recentPortfolioIds.value.filter((id) => id !== portfolio.id)].slice(0, 6)
  persistRecentPortfolioIds()
}

const pruneRecentPortfolios = () => {
  const validIds = new Set(portfolioStore.portfolios.map((portfolio) => portfolio.id))
  recentPortfolioIds.value = recentPortfolioIds.value.filter((id) => validIds.has(id))
  persistRecentPortfolioIds()
}

const openCreatePortfolioDialog = () => {
  resetEditPortfolio()
  dialogVisible.value = true
}

const openEditPortfolioDialog = (portfolio = portfolioStore.currentPortfolio) => {
  if (!portfolio) return
  editPortfolio.value = {
    id: portfolio.id,
    name: portfolio.name,
    description: portfolio.description || '',
    drift_threshold: portfolio.drift_threshold ?? 5,
    enable_email_alert: portfolio.enable_email_alert ?? true,
  }
  dialogVisible.value = true
}

const openPortfolioManagement = () => {
  router.push('/portfolios')
}

const openImportTransactionsDialog = () => {
  importDialogMode.value = 'transactions'
  importDialogVisible.value = true
}

const openImportPortfolioDialog = () => {
  importDialogMode.value = 'portfolio'
  importDialogVisible.value = true
}

const buildDuplicatePortfolioName = (name) => t('portfolioCopyName', { name })

const duplicatePortfolio = async (portfolio = portfolioStore.currentPortfolio) => {
  if (!portfolio) return

  try {
    await portfolioStore.addPortfolio({
      name: buildDuplicatePortfolioName(portfolio.name),
      description: portfolio.description || '',
      drift_threshold: portfolio.drift_threshold ?? 5,
      enable_email_alert: portfolio.enable_email_alert ?? true,
    })

    const duplicatedPortfolio = portfolioStore.portfolios[portfolioStore.portfolios.length - 1]

    if (duplicatedPortfolio) {
      portfolioStore.setCurrentPortfolio(duplicatedPortfolio)
      toast.success(t('portfolioDuplicated', { name: duplicatedPortfolio.name }), '')
    }
  } catch (error) {
    console.error('Error duplicating portfolio:', error)
    toast.error(t('errorOccurred'), error.message || '')
  }
}

const confirmDeletePortfolio = (portfolio = portfolioStore.currentPortfolio) => {
  if (!portfolio) return

  confirm.require({
    message: t('deletePortfolioConfirm', { name: portfolio.name }),
    header: t('warning'),
    icon: 'pi pi-info-circle',
    rejectProps: {
      label: t('cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: t('delete'),
      severity: 'danger',
    },
    accept: async () => {
      await portfolioStore.removePortfolio([portfolio.id])
      toast.success(t('portfolioDeleted'), '')
    },
  })
}

const buildPortfolioMenuItem = (portfolio) => ({
  key: portfolio.id,
  label: portfolio.name,
  icon: portfolio.id === portfolioStore.currentPortfolio?.id ? 'pi pi-fw pi-check' : 'pi pi-fw',
  command: () => switchPortfolio(portfolio),
})

const portfolioMenuItems = computed(() => {
  const currentActions = auth.user.uid === 'demo-user'
    ? []
    : [
        { label: t('duplicatePortfolio'), icon: 'pi pi-copy', command: () => duplicatePortfolio() },
        { label: t('updatePortfolio'), icon: 'pi pi-pencil', command: () => openEditPortfolioDialog() },
        { label: t('delete'), icon: 'pi pi-trash', class: 'menu-item-danger', command: () => confirmDeletePortfolio() },
        { separator: true },
        { label: t('createNewPortfolio'), icon: 'pi pi-plus', command: openCreatePortfolioDialog },
        { separator: true },
      ]

  return [
    {
      label: t('managePortfolio'),
      icon: 'pi pi-cog',
      items: [
        ...currentActions,
        { label: t('importPortfolio'), icon: 'pi pi-upload', command: openImportPortfolioDialog },
      ],
    },
  ]
})

const portfolioListItems = computed(() => recentPortfolios.value.map(buildPortfolioMenuItem))

async function getPortfolios() {
  try {
    await portfolioStore.fetchPortfolios()
    pruneRecentPortfolios()
  } catch (error) {
    console.error('Error fetching portfolios:', error)
  }
}

const searchBoxVisible = ref(false)
const openSearchBox = () => {
  searchBoxVisible.value = true
}

const isEditableTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

const onGlobalSearchShortcut = (event) => {
  if (event.isComposing || event.repeat) return

  const isCommandShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'
  const isSlashShortcut = !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && event.key === '/'
  if (!isCommandShortcut && !isSlashShortcut) return
  if (isSlashShortcut && isEditableTarget(event.target)) return

  event.preventDefault()
  openSearchBox()
}

// 顯示新增交易按鈕列的條件: 在 portfolios, backtesting, rebalancing 頁面不顯示
const showAddTradeButtonBar = computed(() => !['portfolios', 'backtesting', 'rebalancing'].includes(route.name))

// Mobile sidebar state
const sidebarVisible = ref(false)

onMounted(() => {
  // 舊版 header 曾存 'zh-TW'，但 i18n messages 只有 'zh'
  const savedLocale = localStorage.getItem('locale')?.replace('zh-TW', 'zh')
  if (savedLocale && savedLocale !== locale.value) {
    locale.value = savedLocale
  }

  window.addEventListener('keydown', onGlobalSearchShortcut)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalSearchShortcut)
})

watch(
  () => portfolioStore.currentPortfolio,
  (portfolio) => {
    if (portfolio) rememberRecentPortfolio(portfolio)
  },
  { immediate: true }
)

watch(
  () => portfolioStore.portfolios.map((portfolio) => portfolio.id),
  () => {
    pruneRecentPortfolios()
  }
)

watch(dialogVisible, (visible) => {
  if (!visible) resetEditPortfolio()
})

const tradeActionItems = computed(() => [
  {
    label: t('importTransactions'),
    icon: 'pi pi-upload',
    command: openImportTransactionsDialog,
  },
])

const { theme, setTheme } = useTheme()
const setLanguage = (code) => {
  locale.value = code
  localStorage.setItem('locale', code)
}
// 子選單項目：目前選中的打勾，其餘用 pi-fw 佔位讓文字對齊
const choice = (label, selected, command) => ({ label, icon: selected ? 'pi pi-check' : 'pi pi-fw', command })

const menuItems = computed(() => {
  const list = [
    { label: t('userGuide'), icon: 'pi pi-book', command: () => router.push('/user-guide') },
    { separator: true },
    { label: t('language'), icon: 'pi pi-language', items: [
      choice('繁體中文', locale.value === 'zh', () => setLanguage('zh')),
      choice('English', locale.value === 'en', () => setLanguage('en')),
    ] },
    { label: t('currency.label'), icon: 'pi pi-dollar', items: ['USD ($)', 'TWD (NT$)'].map((label) => {
      const code = label.slice(0, 3)
      return choice(label, settingsStore.displayCurrency === code, () => settingsStore.setDisplayCurrency(code))
    }) },
    { label: t('appearance'), icon: 'pi pi-palette', items: [
      choice(t('lightMode'), theme.value === 'light', () => setTheme('light')),
      choice(t('darkMode'), theme.value === 'dark', () => setTheme('dark')),
      choice(t('systemMode'), theme.value === 'system', () => setTheme('system')),
    ] },
  ]
  if (auth.user.uid !== 'demo-user') {
    list.unshift({ label: t('userSettings'), icon: 'pi pi-cog', command: () => router.push('/user-settings') })
    list.push({ separator: true })
    list.push({ label: t('logout'), icon: 'pi pi-sign-out', class: 'menu-item-danger', command: async () => {
      await auth.logout()
      if (route.meta.requiresAuth) router.replace({ name: 'home' })
    } })
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
.app-shell,
.app-shell__main,
.app-shell__topbar {
  background-color: var(--p-surface-background);
  color: var(--p-text-color);
}

.app-shell__topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  padding: 10px 16px 10px 0;
}

.app-shell__search {
  align-items: center;
  gap: 0.75rem;
  width: min(24rem, 100%);
  padding: 0.5rem 1rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 999px;
  background: var(--p-content-background);
  color: var(--p-text-muted-color);
  text-align: left;
  transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease;
}

.app-shell__search:hover {
  color: var(--p-text-color);
  cursor: text;
}

.app-shell__content {
  background-color: var(--p-content-background);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

/* 深色：主內容區與底色一致，卡片 (#1d1e1e) 浮在 #0d0d0d 上 */
.dark .app-shell__content {
  background-color: var(--p-surface-background);
  box-shadow: none;
}

@media (min-width: 1024px) {
  .app-shell__main {
    padding-left: var(--sidebar-width, 260px);
    transition: padding-left 0.18s ease;
  }
}

.app-shell__content {
  min-height: 0;
  margin: 16px 16px 16px 0;
  border-radius: 16px;
}

@media (max-width: 1023px) {
  .app-shell__content {
    margin: 12px;
  }
}

.custom-select-root:hover {
  border: 1px solid var(--p-form-field-hover-border-color) !important;
}

.trade-actions-split {
  position: relative;
}

.trade-actions-split .p-tieredmenu {
  top: calc(100% + 0.35rem) !important;
  right: 0 !important;
  left: auto !important;
  max-width: calc(100vw - 1rem);
}

/* 已排序的表頭不變色，只靠排序圖示表示狀態 */
.p-datatable {
  --p-datatable-header-cell-selected-background: var(--p-datatable-header-cell-background);
  --p-datatable-header-cell-selected-color: var(--p-datatable-header-cell-color);
}

/* 自訂 Primevue DataTable 排序圖示 */

/* 1. 把原本的 SVG icon 藏起來 */
.p-datatable .p-datatable-sort-icon {
  display: none;
}

/* 2. 基本樣式：讓 sort 的 span 有空間顯示新 icon */
.p-datatable th [data-pc-section="sort"]::before {
  display: inline-block;
  font-family: 'primeicons';
  font-size: 0.75rem;
  width: 1em;
  text-align: center;
  transition: transform 0.2s ease;
}

/* 3. 未排序：上下箭頭（pi-sort-alt），淡色 */
.p-datatable th[aria-sort="none"] [data-pc-section="sort"]::before,
.p-datatable th:not([aria-sort]) [data-pc-section="sort"]::before {
  content: '\e99e';
  color: var(--p-text-muted-color);
}

/* 4. 升降冪共用 pi-chevron-down，升冪旋轉 180° 讓切換時有翻轉動畫（content 本身無法 transition） */
.p-datatable th[aria-sort="ascending"] [data-pc-section="sort"]::before,
.p-datatable th[aria-sort="descending"] [data-pc-section="sort"]::before {
  content: '\e902';
}

.p-datatable th[aria-sort="ascending"] [data-pc-section="sort"]::before {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .p-datatable th [data-pc-section="sort"]::before {
    transition: none;
  }
}

</style>
