<template>
  <CustomToast :dark="isDark" />
  <GlobalLoading />
  <ConfirmDialog />

  <div class="app-shell min-h-screen bg-[var(--p-surface-background)] text-[var(--p-text-color)]">
    <aside class="app-shell__sidebar hidden lg:flex">
      <div class="flex items-center justify-between px-6 pt-6">
        <button type="button" class="app-shell__brand" @click="$router.push('/dashboard')">
          <span class="app-shell__brand-stock">Stock</span>
          <span class="app-shell__brand-bar">Bar</span>
        </button>
      </div>

      <div class="px-4 pt-6">
        <button
          type="button"
          class="portfolio-menu-trigger app-shell__portfolio-trigger"
          :class="{ 'is-open': portfolioMenuVisible }"
          :aria-label="t('openPortfolioMenu')"
          :aria-expanded="portfolioMenuVisible"
          @click="togglePortfolioMenu"
        >
          <div class="flex min-w-0 flex-col items-start text-left">
            <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--p-text-muted-color)]">{{ t('portfolio') }}</span>
            <span class="portfolio-menu-current__label truncate">{{ currentPortfolioName }}</span>
          </div>
          <i class="pi pi-chevron-down text-xs portfolio-menu-trigger__icon"></i>
        </button>

        <TieredMenu
          ref="portfolioMenu"
          :model="portfolioMenuItems"
          :popup="true"
          class="portfolio-tiered-menu"
          @show="portfolioMenuVisible = true"
          @hide="portfolioMenuVisible = false"
        >
          <template #start>
            <div class="portfolio-menu-current">
              <span class="portfolio-menu-current__label">{{ currentPortfolioName }}</span>
              <i class="pi pi-chevron-up text-xs"></i>
            </div>
          </template>

          <template #item="{ item, props }">
            <div v-if="item.kind === 'section'" class="portfolio-menu-section">
              {{ item.label }}
            </div>

            <a
              v-else
              v-ripple
              class="portfolio-menu-item"
              :class="{
                'is-active': item.kind === 'portfolio' && item.active,
                'is-danger': item.kind === 'danger'
              }"
              v-bind="props.action"
            >
              <i v-if="item.icon" :class="[item.icon, 'text-sm']"></i>
              <span class="portfolio-menu-item__label">{{ item.label }}</span>
              <span v-if="item.items" class="portfolio-menu-item__suffix">
                <span v-if="item.suffix">{{ item.suffix }}</span>
                <i class="pi pi-chevron-right text-xs"></i>
              </span>
              <span v-else-if="item.suffix" class="portfolio-menu-item__suffix">{{ item.suffix }}</span>
              <i v-if="item.active && !item.items" class="pi pi-check ml-auto text-xs"></i>
            </a>
          </template>
        </TieredMenu>

        <div
          v-if="auth.user?.uid === 'demo-user'"
          class="mt-3 flex items-start gap-2 rounded-2xl border border-[var(--p-content-border-color)] bg-[var(--p-content-background)] px-3 py-2 text-xs text-[var(--p-text-muted-color)]"
        >
          <i class="pi pi-info-circle mt-0.5"></i>
          <span>{{ $t('demoUserMessage') }}</span>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 pb-6 pt-8">
        <div v-for="section in sidebarSections" :key="section.key" class="mb-6 last:mb-0">
          <div v-if="section.label" class="app-shell__section-label">{{ section.label }}</div>

          <RouterLink
            v-for="item in section.items"
            :key="item.key"
            :to="item.to"
            class="app-shell__nav-item"
            :class="{ 'is-active': isNavItemActive(item) }"
          >
            <span class="app-shell__nav-icon">
              <span class="material-symbols-outlined app-shell__material-icon" :data-icon="item.icon">{{ item.icon }}</span>
            </span>
            <span class="truncate">{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>

      <div class="mt-auto border-t border-[var(--p-content-border-color)] px-4 py-4">
        <button type="button" class="app-shell__profile" @click="toggleMenu">
          <Avatar :image="auth.user.photoURL" shape="circle" class="shrink-0" />
          <div class="min-w-0 flex-1 text-left">
            <p class="truncate text-sm font-semibold">{{ displayUserName }}</p>
            <p class="truncate text-xs text-[var(--p-text-muted-color)]">{{ auth.user.email }}</p>
          </div>
          <i class="pi pi-ellipsis-v text-xs text-[var(--p-text-muted-color)]"></i>
        </button>
      </div>
    </aside>

    <div class="flex min-h-screen flex-col lg:pl-[17rem]">
      <AppHeader
        ref="appHeader"
        :currentPageLabel="currentPageLabel"
        :isDark="isDark"
        :showAddTradeButtonBar="showAddTradeButtonBar"
        :isDemoUser="auth.user?.uid === 'demo-user'"
        :hasPortfolios="portfolioStore.portfolios.length > 0"
        :displayUserName="displayUserName"
        :userEmail="auth.user?.email || ''"
        :userPhotoUrl="auth.user?.photoURL || ''"
        :menuItems="menuItems"
        :tradeActionItems="tradeActionItems"
        @open-sidebar="sidebarVisible = true"
        @open-search="openSearchBox"
        @create-portfolio="dialogVisible = true"
        @open-transaction="transctionDialogVisible = true"
        @login="auth.login"
        @toggle-theme="toggleTheme"
      />

      <main class="app-shell__content flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8 xl:px-10">
        <RouterView />
      </main>

      <div class="px-4 pb-6 sm:px-6 lg:px-8 xl:px-10">
        <Footer />
      </div>
    </div>
  </div>

  <!-- Search Overlay -->
  <Teleport to="body">
    <Transition name="search-overlay-fade">
      <div
        v-if="searchBoxVisible"
        class="search-overlay"
        role="dialog"
        aria-modal="true"
        @click.self="closeSearchBox"
      >
        <div class="search-overlay-panel">
          <SearchBox ref="searchBoxRef" @close="closeSearchBox" />
        </div>
      </div>
    </Transition>
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
import Avatar from 'primevue/avatar'
import TieredMenu from 'primevue/tieredmenu'
import 'primeicons/primeicons.css'
import SearchBox from './components/SearchBox.vue'
import TransactionDialog from '@/components/TransactionDialog.vue'
import PortfolioFormDialog from './components/PortfolioFormDialog.vue'
import AppHeader from './layouts/AppHeader.vue'
import Sidebar from './layouts/Sidebar.vue'
import Footer from './layouts/Footer.vue'
import CustomToast from './components/CustomToast.vue'
import ImportDataDialog from './components/ImportDataDialog.vue'
import GlobalLoading from "@/components/GlobalLoading.vue"
import { useI18n } from 'vue-i18n'
import { useHoldingsStore } from '@/stores/holdings'
import { useTransactionsStore } from '@/stores/transactions'
import { showLoading, hideLoading } from "@/composables/loading.js"
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

  const activeItem = sidebarSections.value.flatMap((section) => section.items).find(isNavItemActive)
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
const appHeader = ref(null)
const portfolioMenu = ref()
const portfolioMenuVisible = ref(false)

const closeSearchBox = () => {
  searchBoxVisible.value = false
}

const openSearchBox = async () => {
  searchBoxVisible.value = true
  await nextTick()
  searchBoxRef.value?.focusInput?.()
}

const togglePortfolioMenu = (event) => portfolioMenu.value.toggle(event)

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

const toggleMenu = (event) => appHeader.value?.toggleMenu(event)
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

const tradeActionItems = computed(() => [
  {
    label: t('importTransactions'),
    icon: 'pi pi-upload',
    command: openImportTransactionsDialog,
  },
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
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 1.5rem 1rem 1rem;
  background: rgba(9, 14, 24, 0.48);
  backdrop-filter: blur(2px);
}

.search-overlay-panel {
  width: min(90vw, 65rem);
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
.app-shell__sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 40;
  width: 17rem;
  flex-direction: column;
  border-right: 1px solid rgb(30, 43, 70);
  background: var(--p-surface-background);
  backdrop-filter: blur(18px);
}

.app-shell__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
}

.app-shell__brand-stock {
  color: color-mix(in srgb, var(--p-text-color) 80%, transparent);
}

.app-shell__brand-bar {
  color: var(--p-primary-color);
}

.app-shell__portfolio-trigger {
  width: 100%;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border: 1px solid rgb(30, 43, 70);
  border-radius: 1rem;
  background: rgb(20 31 52 / var(--tw-bg-opacity, 1));
}

.app-shell__section-label {
  padding: 0 0.75rem 0.6rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--p-text-muted-color);
}

.app-shell__topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  border-bottom: 1px solid rgb(30, 43, 70);
  background: color-mix(in srgb, var(--p-surface-background) 82%, transparent);
  backdrop-filter: blur(18px);
}

.app-shell__search {
  align-items: center;
  gap: 0.75rem;
  width: min(24rem, 100%);
  padding: 0.85rem 1rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--p-content-background) 94%, transparent);
  color: var(--p-text-muted-color);
  text-align: left;
  transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease;
}

.app-shell__search:hover {
  color: var(--p-text-color);
  cursor: text;
}

.app-shell__content {
  min-height: calc(100vh - 5rem);
}

.app-shell__profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 78%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--p-content-background) 92%, transparent);
  color: var(--p-text-color);
  transition: background-color 0.16s ease, border-color 0.16s ease;
}

.app-shell__profile:hover {
  background: color-mix(in srgb, var(--p-content-background) 100%, transparent);
  border-color: color-mix(in srgb, var(--p-primary-color) 22%, var(--p-content-border-color));
}

.custom-select-root:hover {
  border: 1px solid rgb(121, 121, 121) !important;
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
