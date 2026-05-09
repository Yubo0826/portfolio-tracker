<template>
  <nav class="flex flex-col gap-0.5 px-2">
    <div v-for="link in navLinks" :key="link.key">
      <!-- 無子選單的連結 -->
      <button
        v-if="!link.hasMenu"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        :class="isActive(link.activePaths)
          ? 'bg-[color-mix(in_srgb,var(--p-primary-color)_12%,transparent)] text-[var(--p-primary-color)]'
          : 'text-[var(--p-text-color)] hover:bg-[var(--p-surface-100)] dark:hover:bg-[var(--p-surface-800)]'"
        @click="go(link.to)"
      >
        <i :class="link.icon" class="text-sm w-4 shrink-0 text-center"></i>
        <span>{{ link.label }}</span>
      </button>

      <!-- 有子選單的連結（可展開） -->
      <div v-else>
        <button
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          :class="isActive(link.activePaths)
            ? 'bg-[color-mix(in_srgb,var(--p-primary-color)_12%,transparent)] text-[var(--p-primary-color)]'
            : 'text-[var(--p-text-color)] hover:bg-[var(--p-surface-100)] dark:hover:bg-[var(--p-surface-800)]'"
          @click="toggleSection(link.key)"
        >
          <i :class="link.icon" class="text-sm w-4 shrink-0 text-center"></i>
          <span class="flex-1 text-left">{{ link.label }}</span>
          <i class="pi text-[10px]" :class="openSections[link.key] ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
        </button>

        <!-- 子項目 -->
        <div v-show="openSections[link.key]"
             class="ml-4 pl-3 border-l border-[var(--p-content-border-color)] mt-0.5 mb-1 flex flex-col gap-0.5">
          <template v-for="group in link.menuGroups" :key="group.label">
            <button
              v-for="item in group.items"
              :key="item.label"
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              :class="isSubActive(item.to)
                ? 'text-[var(--p-primary-color)] font-semibold bg-[color-mix(in_srgb,var(--p-primary-color)_8%,transparent)]'
                : 'text-[var(--p-text-muted-color)] hover:text-[var(--p-text-color)] hover:bg-[var(--p-surface-100)] dark:hover:bg-[var(--p-surface-800)]'"
              @click="go(item.to)"
            >
              <i v-if="item.icon" :class="item.icon" class="text-xs w-4 shrink-0 text-center"></i>
              <span>{{ item.label }}</span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const navLinks = computed(() => [
  {
    key: 'dashboard',
    label: t('dashboard'),
    to: '/dashboard',
    activePaths: ['/dashboard'],
    icon: 'pi pi-home',
    hasMenu: false,
  },
  {
    key: 'portfolio',
    label: t('portfolio'),
    to: '/portfolio/holdings',
    activePaths: ['/portfolio', '/portfolio/holdings', '/portfolio/transactions', '/portfolio/dividends', '/portfolios'],
    icon: 'pi pi-briefcase',
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
          { label: t('portfolioManagement'), to: '/portfolios', icon: 'pi pi-folder' },
        ],
      },
    ],
  },
  {
    key: 'cashflow',
    label: t('cashFlowNav'),
    to: '/cash-flow',
    activePaths: ['/cash-flow', '/cash-flows'],
    icon: 'pi pi-chart-bar',
    hasMenu: false,
  },
  {
    key: 'tools',
    label: t('functions'),
    to: '/allocation',
    activePaths: ['/allocation', '/rebalancing', '/backtesting'],
    icon: 'pi pi-wrench',
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

const isActive = (paths) => {
  if (Array.isArray(paths)) return paths.some(p => route.path === p || route.path.startsWith(p + '/'))
  return route.path === paths || route.path.startsWith(paths + '/')
}

const isSubActive = (path) => route.path === path || route.path.startsWith(path + '/')

const openSections = ref({})

function initOpenSections() {
  navLinks.value.forEach(link => {
    if (link.hasMenu && isActive(link.activePaths)) {
      openSections.value[link.key] = true
    }
  })
}

initOpenSections()
watch(() => route.path, initOpenSections)

const toggleSection = (key) => {
  openSections.value[key] = !openSections.value[key]
}

const go = (to) => router.push(to)
</script>
