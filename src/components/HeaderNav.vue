<template>
  <nav class="flex items-center h-full gap-1">
    <div
      v-for="link in navLinks"
      :key="link.key"
      class="relative h-full flex items-center"
      @mouseenter="activeMenu = link.key"
      @mouseleave="activeMenu = null"
    >
      <button
        class="px-4 h-10 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--p-surface-100)] dark:hover:bg-[var(--p-surface-800)] relative nav-trigger cursor-pointer"
        :class="isActive(link.activePaths) ? 'text-[var(--p-primary-color)]' : 'text-[var(--p-text-color)]'"
        @click="handleLinkClick(link)"
      >
        <span>{{ link.label }}</span>
        <i v-if="link.hasMenu" class="pi pi-chevron-down ml-2 text-[10px]"></i>
        <div v-if="isActive(link.activePaths)" class="absolute bottom-0 left-3 right-3 h-[2px] bg-[var(--p-primary-color)] rounded"></div>
      </button>

      <transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div
          v-if="link.hasMenu && activeMenu === link.key"
          class="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl py-2 z-[60]"
        >
          <div v-for="group in link.menuGroups" :key="group.label" class="mb-2 last:mb-0">
            <div class="px-4 py-2 text-[10px] uppercase tracking-widest text-[var(--p-text-muted-color)]">
              {{ group.label }}
            </div>

            <button
              v-for="item in group.items"
              :key="item.label"
              class="w-[calc(100%-0.5rem)] mx-1 px-2 py-2 rounded-lg cursor-pointer flex items-center justify-between text-left transition-colors hover:bg-[var(--p-surface-100)] dark:hover:bg-[var(--p-surface-800)]"
              @click="go(item.to)"
            >
              <div class="flex items-center gap-3">
                <i v-if="item.icon" :class="item.icon" class="text-sm text-[var(--p-text-muted-color)] w-4"></i>
                <div class="flex flex-col">
                  <span class="text-sm text-[var(--p-text-color)]">{{ item.label }}</span>
                  <!-- <span v-if="item.sub" class="text-[10px] text-[var(--p-text-muted-color)]">{{ item.sub }}</span> -->
                </div>
              </div>
              <!-- <i class="pi pi-angle-right text-[10px] text-[var(--p-text-muted-color)]"></i> -->
            </button>

            <hr
              v-if="!group.noDivider"
              class="mx-4 my-2 border-[var(--p-content-border-color)]"
            />
          </div>
        </div>
      </transition>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { usePortfolioStore } from '@/stores/portfolio'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const portfolioStore = usePortfolioStore()
const activeMenu = ref(null)

const navLinks = computed(() => [
  {
    key: 'dashboard',
    label: t('dashboard'),
    to: '/dashboard',
    activePaths: ['/dashboard'],
    hasMenu: false,
  },
  {
    key: 'cashflow',
    label: t('cashFlowNav'),
    to: '/cash-flow',
    activePaths: ['/cash-flow', '/cash-flows'],
    hasMenu: false,
  },
  {
    key: 'portfolio',
    label: t('portfolio'),
    to: '/portfolio/holdings',
    activePaths: ['/portfolio', '/portfolio/holdings', '/portfolio/transactions', '/portfolio/dividends', '/portfolios'],
    hasMenu: true,
    menuGroups: [
      {
        label: t('portfolio'),
        items: [
          { label: t('holdings'), to: '/portfolio/holdings', icon: 'pi pi-briefcase' },
          { label: t('transactions'), to: '/portfolio/transactions', icon: 'pi pi-list' },
          { label: t('dividends'), to: '/portfolio/dividends', icon: 'pi pi-wallet' },
        ],
      },
      {
        label: t('portfolios'),
        noDivider: true,
        items: [
          {
            label: t('portfolioManagement'),
            to: '/portfolios',
            icon: 'pi pi-folder',
            sub: portfolioStore.currentPortfolio?.name || undefined,
          },
        ],
      },
    ],
  },
  {
    key: 'tools',
    label: t('functions'),
    to: '/allocation',
    activePaths: ['/allocation', '/rebalancing', '/backtesting'],
    hasMenu: true,
    menuGroups: [
      {
        label: t('functions'),
        items: [
          { label: t('rebalance'), to: '/rebalancing', icon: 'pi pi-sync' },
          { label: t('backtesting'), to: '/backtesting', icon: 'pi pi-chart-line' },
        ],
      },
      {
        label: t('setTargets'),
        noDivider: true,
        items: [
          { label: t('setTargets'), to: '/allocation', icon: 'pi pi-cog' },
        ],
      },
    ],
  },
])

const go = (to) => {
  activeMenu.value = null
  router.push(to)
}

const handleLinkClick = (link) => {
  if (!link.hasMenu) {
    go(link.to)
    return
  }
  if (activeMenu.value !== link.key) {
    activeMenu.value = link.key
    return
  }
  go(link.to)
}

const isActive = (paths) => {
  if (Array.isArray(paths)) return paths.includes(route.path)
  return route.path === paths
}
</script>

<style scoped>
.nav-trigger {
  letter-spacing: 0.01em;
}
</style>
