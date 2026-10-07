<template>
  <Toast position="bottom-center" group="standard" />
  <div v-if="globalLoadingVisible" class="fixed inset-0 z-[2102] flex items-center justify-center bg-black/40">
    <ProgressSpinner />
  </div>
  <ConfirmDialog />

  <div class="app-shell h-screen overflow-hidden">
    <Sidebar
      persistent
      :currentPortfolioName="currentPortfolioName"
      :portfolioMenuItems="portfolioMenuItems"
      :menuItems="menuItems"
      :isDemoUser="auth.user?.uid === 'demo-user'"
      :userDisplayName="displayUserName"
      :userEmail="auth.user?.email || ''"
      :userPhotoUrl="auth.user?.photoURL || ''"
    />

    <div class="flex h-screen flex-col app-shell__main">
      <AppHeader
        ref="appHeaderRef"
        :currentPageLabel="currentPageLabel"
        :isDark="isDark"
        :showAddTradeButtonBar="showAddTradeButtonBar"
        :isDemoUser="auth.user?.uid === 'demo-user'"
        :hasPortfolios="portfolioStore.portfolios.length > 0"
        :tradeActionItems="tradeActionItems"
        @open-sidebar="sidebarVisible = true"
        @open-search="openSearchBox"
        @create-portfolio="dialogVisible = true"
        @open-transaction="transctionDialogVisible = true"
        @login="auth.login"
        @toggle-theme="toggleTheme"
      />

      <div class="app-shell__scroll flex-1 overflow-y-auto">
        <main class="app-shell__content mx-auto max-w-[1680px] px-4 pb-8 pt-6 sm:px-6 lg:px-8 xl:px-10">
          <RouterView />
        </main>

        <div class="px-4 pb-6 sm:px-6 lg:px-8 xl:px-10">
          <Footer />
        </div>
      </div>
    </div>
  </div>

  <!-- Search Overlay -->
  <Teleport to="body">
    <Transition name="search-overlay-fade">
      <div
        v-if="searchBoxVisible"
        class="search-overlay"
        aria-hidden="true"
        @click="closeSearchBox"
      ></div>
    </Transition>

    <div
      v-if="searchBoxVisible"
      class="search-overlay-panel"
      :class="{ 'search-overlay-panel--expanded': searchPanelExpanded }"
      :style="searchPanelStyle"
      role="dialog"
      aria-modal="true"
    >
      <SearchBox ref="searchBoxRef" @close="closeSearchBox" />
    </div>
  </Teleport>

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
    :menuItems="menuItems"
    :isDemoUser="auth.user?.uid === 'demo-user'"
    :userDisplayName="displayUserName"
    :userEmail="auth.user?.email || ''"
    :userPhotoUrl="auth.user?.photoURL || ''"
  />
</template>

<script setup>
// 同原始邏輯，無變動
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
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
const sidebarSections = computed(() => buildSidebarSections(t))

import { useTheme } from '@/composables/useTheme.js'
const { isDark, toggleTheme } = useTheme()

// Currency settings
import { useSettingsStore } from '@/stores/settings'
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

  const activeItem = sidebarSections.value
    .flatMap((section) => section.items)
    .flatMap((item) => (item.type === 'group' ? item.children : item))
    .find(isNavItemActive)
  if (activeItem) return activeItem.label

  return currentPortfolioName.value
})

const recentPortfolios = computed(() =>
  recentPortfolioIds.value
    .map((id) => portfolioStore.portfolios.find((portfolio) => portfolio.id === id))
    .filter(Boolean)
)

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
  label: portfolio.name,
  kind: 'portfolio',
  active: portfolio.id === portfolioStore.currentPortfolio?.id,
  command: () => switchPortfolio(portfolio),
})

const portfolioMenuItems = computed(() => {
  const currentActions = auth.user.uid === 'demo-user'
    ? []
    : [
        { label: t('duplicatePortfolio'), icon: 'pi pi-copy', command: () => duplicatePortfolio() },
        { label: t('updatePortfolio'), icon: 'pi pi-pencil', command: () => openEditPortfolioDialog() },
        { label: t('delete'), icon: 'pi pi-trash', kind: 'danger', command: () => confirmDeletePortfolio() },
        { separator: true },
        {
          label: t('createNewPortfolio'),
          icon: 'pi pi-plus',
          items: [
            { label: t('addPortfolio'), icon: 'pi pi-file-plus', command: openCreatePortfolioDialog },
            { label: t('importPortfolioDialogTitle'), icon: 'pi pi-upload', command: () => openImportPortfolioDialog() },
          ],
        },
      ]

  const recentItems = recentPortfolios.value.length
    ? [
        { separator: true },
        { label: t('recentlyUsed'), kind: 'section', disabled: true },
        ...recentPortfolios.value.map(buildPortfolioMenuItem),
      ]
    : []

  const openItems = [
    { separator: true },
    {
      label: t('importPortfolio'),
      icon: 'pi pi-upload',
      command: openImportPortfolioDialog
    },
  ]

  return [...currentActions, ...recentItems, ...openItems]
})

async function getPortfolios() {
  try {
    await portfolioStore.fetchPortfolios()
    pruneRecentPortfolios()
  } catch (error) {
    console.error('Error fetching portfolios:', error)
  }
}

const searchBoxVisible = ref(false)
const searchBoxRef = ref(null)
const appHeaderRef = ref(null)
const searchPanelStyle = ref({})
const searchPanelExpanded = ref(false)

const getVisibleSearchTrigger = () => {
  const desktop = appHeaderRef.value?.desktopSearchTriggerRef
  const mobile = appHeaderRef.value?.mobileSearchTriggerRef
  if (desktop?.offsetParent !== null) return desktop
  if (mobile?.offsetParent !== null) return mobile
  return desktop || mobile || null
}

const captureSearchTriggerRect = () => {
  const trigger = getVisibleSearchTrigger()
  if (!trigger) {
    return { top: '1rem', left: '1rem', width: 'min(24rem, calc(100vw - 2rem))' }
  }
  const rect = trigger.getBoundingClientRect()
  return {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

const closeSearchBox = () => {
  searchPanelExpanded.value = false
  searchBoxVisible.value = false
}

const openSearchBox = async () => {
  searchPanelStyle.value = captureSearchTriggerRect()
  searchPanelExpanded.value = true
  searchBoxVisible.value = true

  await nextTick()
  searchBoxRef.value?.focusInput?.()
}

const isEditableTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

const onGlobalSearchShortcut = (event) => {
  if (event.isComposing || event.repeat) return
  if (event.key === 'Escape' && searchBoxVisible.value) {
    event.preventDefault()
    closeSearchBox()
    return
  }

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
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale && savedLocale !== locale.value) {
    locale.value = savedLocale
  }

  window.addEventListener('keydown', onGlobalSearchShortcut)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalSearchShortcut)
  document.body.style.removeProperty('overflow')
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

watch(searchBoxVisible, async (visible) => {
  if (!visible) {
    document.body.style.removeProperty('overflow')
    return
  }

  document.body.style.overflow = 'hidden'
  await nextTick()
  searchBoxRef.value?.focusInput?.()
})

const tradeActionItems = computed(() => [
  {
    label: t('importTransactions'),
    icon: 'pi pi-upload',
    command: openImportTransactionsDialog,
  },
])

const menuItems = computed(() => {
  const list = [
    { label: t('userGuide'), icon: 'pi pi-book', command: () => router.push('/user-guide') },
  ]
  if (auth.user.uid !== 'demo-user') {
    list.push({ separator: true })
    list.push({ label: t('logout'), icon: 'pi pi-sign-out', kind: 'danger', command: () => auth.logout() })
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

.search-overlay-fade-enter-active,
.search-overlay-fade-leave-active {
  transition: opacity 0.18s ease;
}

.search-overlay-fade-enter-from,
.search-overlay-fade-leave-to {
  opacity: 0;
}

.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(9, 14, 24, 0.48);
  backdrop-filter: blur(2px);
}

.search-overlay-panel {
  position: fixed;
  z-index: 1201;
  max-width: calc(100vw - 2rem);
  border-radius: 999px;
  box-shadow: none;
  overflow: hidden;
}

.search-overlay-panel--expanded {
  width: min(38rem, calc(100vw - 2rem)) !important;
  border-radius: 1.25rem;
  box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.4);
  overflow: visible;
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

@media (min-width: 1024px) {
  .app-shell__main {
    padding-left: var(--sidebar-width, 260px);
    transition: padding-left 0.18s ease;
  }
}

.app-shell__content {
  min-height: calc(100vh - 5rem);
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
