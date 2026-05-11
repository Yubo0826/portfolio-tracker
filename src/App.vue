<template>
  <CustomToast :dark="isDark" />
  <GlobalLoading />
  <ConfirmDialog />

  <div class="flex flex-col min-h-screen">
    <!-- 最大寬度 ; max-w-screen-md, 768px ; max-w-screen-lg, 1024px ; max-w-screen-xl, 1280px ; max-w-screen-2xl, 1536px. -->
    <div class="w-full flex-grow mx-auto p-16 ">
      <!-- Header -->
      <header class="fixed top-0 left-0 right-0 z-50  px-4 sm:px-16 bg-[var(--p-surface-background)] backdrop-blur-sm">
        <div class="mx-auto flex justify-between items-center gap-3 py-4">
          <!-- Left: Logo + Portfolio Selector -->
          <div class="flex items-center gap-3">
            <!-- Hamburger Toggle Button - Mobile Only -->
            <span class="lg:hidden">
              <Button
                @click="sidebarVisible = true"
                icon="pi pi-bars"
                class="hamburger-btn lg:hidden"
                size="small"
                variant="outlined"
                severity="secondary"
              />
            </span>

            <!-- Logo -->
            <div @click="$router.push('/dashboard')" class="text-2xl sm:text-3xl font-bold cursor-pointer whitespace-nowrap flex-shrink-0">
              <span class="text-gray-500 dark:text-gray-100">Stock</span>
              <!-- <span class="text-gray-500 dark:text-gray-100">Bar</span> -->
              <span class="text-[#a1a1aa]">Bar</span>
            </div>

          </div>

          <!-- Center: Navigation - Hidden on mobile, shown on lg+ -->
          <div class="hidden lg:flex items-center justify-center flex-1">
            <HeaderNav />
          </div>

          <!-- 右上功能按鈕區 -->
          <div class="flex justify-center items-center flex-wrap gap-1">
            <!-- 搜尋按鈕 - 小螢幕：icon only -->
            <button
              aria-label="Search"
              @click="openSearchBox"
              class="lg:hidden flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"
            >
              <i class="pi pi-search text-sm"></i>
            </button>
            <!-- 搜尋按鈕 - 大螢幕：pill 樣式 -->
            <button
              @click="openSearchBox"
              aria-label="Search"
              class="hidden lg:flex items-center w-[16rem] gap-3 px-4 py-2.5 rounded-full bg-[#f2f2f2] dark:bg-[#22232b] hover:bg-[#e0e0e0] dark:hover:bg-[#33333b] transition-colors text-sm text-[var(--p-text-muted-color)] cursor-pointer"
            >
              <i class="pi pi-search text-xs"></i>
              <span class="truncate">{{ $t('search') }}</span>
              <span class="ml-auto inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full border border-[var(--p-content-border-color)] text-sm leading-none text-[var(--p-text-muted-color)]">/</span>
            </button>

            <Button
              :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
              @click="toggleTheme"
              aria-label="Toggle Dark Mode"
              size="small"
              text
              rounded
              severity="secondary"
            />

            
            <!-- User Menu -->
             <div 
                class="cursor-pointer ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
                @click="toggleMenu"
              >
                <Avatar :image="auth.user.photoURL" shape="circle" size="normal" />
              </div>
              <!-- <Button
                @click="toggleMenu"
                class="px-1 py-1"
                rounded
                text
                severity="secondary"
                aria-label="User Menu"
              >
                  <Avatar :image="auth.user.photoURL" shape="circle" size="normal" />
              </Button> -->

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
                      <!-- <span v-if="item.icon" :class="item.icon" /> -->
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
          
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="w-full mx-auto flex-grow pt-16 bg-[var(--p-surface-background)]">
        <!-- 行：選擇投資組合和新增交易 -->
        <div v-if="!isAssetRoute" class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-3">
          <!-- 投資組合下拉選單 --> 
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
            <button
              type="button"
              class="portfolio-menu-trigger"
              :class="{ 'is-open': portfolioMenuVisible }"
              :aria-label="t('openPortfolioMenu')"
              :aria-expanded="portfolioMenuVisible"
              @click="togglePortfolioMenu"
            >
              <span class="portfolio-menu-trigger__label">{{ currentPortfolioName }}</span>
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
              class="text-xs text-gray-400 flex items-center gap-1 whitespace-normal text-left sm:whitespace-nowrap"
            >
              <i class="pi pi-info-circle text-gray-400" aria-hidden="true"></i>
              <span>{{ $t('demoUserMessage') }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end w-full lg:ml-auto">
            <div v-if="showAddTradeButtonBar && auth.user.uid !== 'demo-user'">
              <div v-if="portfolioStore.portfolios.length === 0">
                <Button @click="dialogVisible = true" size="small" :label="$t('addPortfolio')" icon="pi pi-plus" />
              </div>
              <div class="flex flex-wrap" v-else>
                <SplitButton
                  @click="transctionDialogVisible = true"
                  class="trade-actions-split"
                  size="small"
                  :label="$t('addInvestment')"
                  icon="pi pi-plus"
                  :model="tradeActionItems"
                  appendTo="self"
                  severity="contrast"
                />
              </div>
            </div>
            <div v-else-if="auth.user.uid === 'demo-user'">
              <Button @click="auth.login" label="Get Started" icon="pi pi-arrow-right" iconPos="right" />
            </div>
          </div>
        </div>

        <!-- <RouterView v-slot="{ Component, route: currentRoute }">
          <Transition name="page-main" mode="out-in" appear>
            <div :key="currentRoute.fullPath" class="page-main-transition">
              <component :is="Component" />
            </div>
          </Transition> -->
        <RouterView>
        </RouterView>
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
      <SearchBox ref="searchBoxRef" @close="searchBoxVisible = false" />
    </template>
  </Dialog>

  <ImportDataDialog v-model="importDataDialogVisible" />

  <TransactionDialog v-model="transctionDialogVisible" />

  <PortfolioFormDialog
    :visible="dialogVisible"
    :editPortfolio="editPortfolio"
    @update:visible="dialogVisible = $event"
    @clear:editPortfolio="resetEditPortfolio()"
  />

  <!-- Mobile Sidebar -->
  <MobileSidebar v-model:visible="sidebarVisible" />
</template>

<script setup>
// 同原始邏輯，無變動
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { usePortfolioStore } from '@/stores/portfolio'
const portfolioStore = usePortfolioStore()
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import TieredMenu from 'primevue/tieredmenu'
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
import * as toast from '@/composables/toast'
import SplitButton from 'primevue/splitbutton'

const { locale, t } = useI18n()
const confirm = useConfirm()
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
            { label: t('portfolioManagement'), icon: 'pi pi-folder-open', command: openPortfolioManagement },
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
      label: t('portfolioManagement'),
      icon: 'pi pi-folder',
      command: openPortfolioManagement
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
const portfolioMenu = ref()
const portfolioMenuVisible = ref(false)

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
  if (!visible) return
  await nextTick()
  searchBoxRef.value?.focusInput?.()
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

const tradeActionItems = computed(() => [
  {
    label: t('import'),
    icon: 'pi pi-upload',
    command: () => {
      importDataDialogVisible.value = true
    },
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

.portfolio-menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  width: fit-content;
  padding: 0.4rem 0.65rem;
  border: 0;
  border-radius: 0.9rem;
  background: transparent;
  color: var(--p-text-color);
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.portfolio-menu-trigger:hover,
.portfolio-menu-trigger.is-open {
  background: color-mix(in srgb, var(--p-surface-hover) 82%, transparent);
}

.portfolio-menu-trigger__label {
  font-size: clamp(1.75rem, 1.2rem + 1.2vw, 2.4rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.portfolio-tiered-menu.p-tieredmenu,
.portfolio-tiered-menu .p-tieredmenu-submenu {
  min-width: 17rem;
  padding: 0.375rem;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 90%, #303030);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--p-surface-card) 92%, #1b1b1b);
  box-shadow: 0 22px 44px rgba(0, 0, 0, 0.28);
}

.portfolio-tiered-menu .p-tieredmenu-root-list,
.portfolio-tiered-menu .p-tieredmenu-submenu {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.portfolio-tiered-menu .p-tieredmenu-separator {
  margin: 0.375rem 0.5rem;
  border-top: 1px solid color-mix(in srgb, var(--p-content-border-color) 90%, #3a3a3a);
}

.portfolio-menu-current {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 0.875rem 0.625rem;
  color: var(--p-text-color);
}

.portfolio-menu-current__label {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
}

.portfolio-menu-section {
  padding: 0.5rem 0.875rem 0.25rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--p-text-muted-color);
}

.portfolio-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 0.875rem;
  border-radius: 0.7rem;
  color: var(--p-text-color);
  transition: background-color 0.14s ease, color 0.14s ease;
}

.portfolio-menu-item:hover {
  background: color-mix(in srgb, var(--p-surface-hover) 80%, transparent);
}

.portfolio-menu-item.is-active {
  background: rgba(255, 255, 255, 0.92);
  color: #111827;
}

.portfolio-menu-item.is-danger {
  color: #ef4444;
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

.portfolio-menu-item__label {
  flex: 1 1 auto;
  min-width: 0;
}

.portfolio-menu-item__suffix {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: auto;
  color: var(--p-text-muted-color);
}

.dark .portfolio-tiered-menu.p-tieredmenu,
.dark .portfolio-tiered-menu .p-tieredmenu-submenu {
  border-color: #383838;
  background: #242424;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.48);
}

.dark .portfolio-tiered-menu .p-tieredmenu-separator {
  border-top-color: #3a3a3a;
}

.dark .portfolio-menu-trigger:hover,
.dark .portfolio-menu-trigger.is-open {
  background: rgba(255, 255, 255, 0.08);
}

.dark .portfolio-menu-item:hover {
  background: rgba(255, 255, 255, 0.05);
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
