<template>
  <CustomToast />
  <GlobalLoading />

  <div class="flex flex-col min-h-screen">
    <!-- 最大寬度 ; max-w-screen-md, 768px ; max-w-screen-lg, 1024px ; max-w-screen-xl, 1280px ; max-w-screen-2xl, 1536px. -->
    <div class="w-full flex-grow mx-auto p-4 max-w-screen-xl">
      <!-- Header -->
      <header class="px-4 mb-4">
        <div class="flex flex-col sm:flex-row justify-between items-center gap-3">
          <!-- Logo -->
          <div @click="$router.push('/dashboard')" class="text-3xl font-bold cursor-pointer whitespace-nowrap">
            <span class="text-gray-500">Stock</span>
            <span :style="{ color: 'var(--p-primary-color)' }">Bar</span>
          </div>

          <!-- 導覽列 -->
          <div class="flex items-center justify-center flex-wrap gap-2 sm:gap-4">
            <HeaderNav />
          </div>

          <!-- 功能按鈕區 -->
          <div class="flex justify-center items-center flex-wrap gap-1 sm:gap-2">
            <Button
              class="p-button-rounded p-button-text"
              aria-label="Search"
              icon="pi pi-search"
              @click="searchBoxVisible = true"
            />

            <Button
              :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
              @click="toggleTheme"
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

            
            <template v-if="auth.user.uid !== 'demo-user'">
              <Avatar :image="auth.user.photoURL" @click="toggleMenu" shape="circle" class="m-2 cursor-pointer" />
              <Menu ref="menu" :model="menuItems" :popup="true" />
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

          <div v-if="showAddTradeButtonBar && auth.user.uid !== 'demo-user'" class="flex flex-wrap gap-2 justify-end">
            <Button @click="transctionDialogVisible = true" size="small" :label="$t('addInvestment')" icon="pi pi-plus" />
            <Button @click="importDataDialogVisible = true" size="small" :label="$t('import')" icon="pi pi-file-import" />
          </div>
          <div v-else-if="auth.user.uid === 'demo-user'">
            <!-- <Button @click="auth.login" label="Get Started" icon="pi pi-arrow-right" iconPos="right" /> -->
             <Button class="start-btn" data-hover="Login!">
              <div>Get Started</div>
             </Button>
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
import 'primeicons/primeicons.css'
import SearchBox from './components/SearchBox.vue'
import TransactionDialog from '@/components/TransactionDialog.vue'
import PortfolioFormDialog from './components/PortfolioFormDialog.vue'
import HeaderNav from './components/HeaderNav.vue'
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
const isAssetRoute = computed(() => ['asset', 'user-settings', 'portfolios'].includes(route.name))
const auth = useAuthStore()
const transctionDialogVisible = ref(false)
const holdingsStore = useHoldingsStore()
const transactionsStore = useTransactionsStore()

import { useTheme } from '@/composables/useTheme.js'
const { isDark, toggleTheme } = useTheme()

watch(() => auth.user, async (newUser) => {
  if (newUser) {
    showLoading('Loading user data...')
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

const toggleLanguage = () => {
  const newLocale = locale.value === 'en' ? 'zh-TW' : 'en'
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
}

// 顯示新增交易按鈕列的條件: 在 portfolios, backtesting, rebalancing 頁面不顯示
const showAddTradeButtonBar = computed(() => !['portfolios', 'backtesting', 'rebalancing'].includes(route.name))

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('my-app-dark')
  }
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale && savedLocale !== locale.value) locale.value = savedLocale
})

const menu = ref()
const toggleMenu = (event) => menu.value.toggle(event)
const menuItems = [
  // { label: '設定', icon: 'pi pi-cog', command: () => router.push('/user-settings') },
  // { separator: true },
  { label: t('logout'), icon: 'pi pi-sign-out', command: () => auth.logout() },
]
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
  /* font-weight: 800; */
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
  /* font-weight: 800; */
  /* font-size: .8em; */
  transition: all .3s ease-in-out;
}
</style>

<style>
.custom-select-root:hover {
  border: 1px solid rgb(121, 121, 121) !important;
}
</style>
