<template>
  <nav class="flex gap-2">
    <!-- Dashboard -->
    <Button
      :label="t('dashboard')"
      severity="secondary"
      variant="text"
      class="font-bold m-1"
      :style="{ color: isActive('/dashboard') ? 'var(--p-primary-color)' : '' }"
      @click="$router.push('/dashboard')"
    />

    <!-- Portfolio Menu -->
    <Menu
      ref="portfolioMenu"
      :model="portfolioItems"
      popup
      class="custom-menu"
    >
      <template #item="{ item, props }">
          <a v-ripple :href="item.url" :target="item.target" v-bind="props.action">
              <span :class="item.icon" />
              <span class="ml-2">{{ item.label }}</span>
          </a>
      </template>
      <template #end>
        <div class="p-3">
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
    </Menu>
    <Button
      :label="t('portfolio')"
      icon="pi pi-chevron-down"
      iconPos="right"
      severity="secondary"
      variant="text"
      class="m-1"
      :style="{ color: isActive(['/portfolio','/portfolio/holdings','/portfolio/transactions','/portfolio/dividends']) ? 'var(--p-primary-color)' : '' }"
      @click="toggleMenu($event, 'portfolioMenu')"
    />

    <!-- Allocation Menu -->
    <Menu
      ref="toolMenu"
      :model="toolItems"
      popup
      class="custom-menu"
    >
      <template #item="{ item, props }">
          <a v-ripple :href="item.url" :target="item.target" v-bind="props.action">
              <span :class="item.icon" />
              <span class="ml-2">{{ item.label }}</span>
          </a>
      </template>
      <template #end>
        <div class="p-3">
          <Button
            :label="$t('setTargets')"
            icon="pi pi-cog "
            @click="$router.push('/allocation'); openDropdown = null; closeTimer = null;"
            fluid
            text
            size="small"
          />
        </div>
      </template>
    </Menu>
    <Button
      :label="t('functions')"
      icon="pi pi-chevron-down"
      iconPos="right"
      severity="secondary"
      variant="text"
      class="m-1"
      :style="{ color: isActive(['/allocation','/rebalancing','/backtesting']) ? 'var(--p-primary-color)' : '' }"
      @click="toggleMenu($event, 'toolMenu')"
    />
  </nav>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Menu from 'primevue/menu'
import Button from 'primevue/button'

import { usePortfolioStore } from '@/stores/portfolio'
const portfolioStore = usePortfolioStore()

const selectedPortfolio = ref(null)

watch(
  () => portfolioStore.currentPortfolio,
  (newVal) => {
    if (newVal?.id !== selectedPortfolio.value)
      selectedPortfolio.value = newVal?.id
  }
)

const { t } = useI18n()

// Menu references
const portfolioMenu = ref()
const toolMenu = ref()

// Toggle which menu opens
const toggleMenu = (event, menuName) => {
  if (menuName === 'portfolioMenu') {
    portfolioMenu.value.toggle(event)
  } else if (menuName === 'toolMenu') {
    toolMenu.value.toggle(event)
  }
}

// Menu items
const portfolioItems = computed(() => [
  // {
  //   label: portfolioStore.currentPortfolio
  //     ? portfolioStore.currentPortfolio.name
  //     : t('portfolio'),
  //   items: [
  //     {
  //       label: t('holdings'),
  //       command: () => router.push('/portfolio/holdings'),
  //     },
  //     {
  //       label: t('transactions'),
  //       command: () => router.push('/portfolio/transactions'),
  //     },
  //     {
  //       label: t('dividends'),
  //       command: () => router.push('/portfolio/dividends'),
  //     },
  //   ]
  // },
  {
    label: t('holdings'),
    command: () => router.push('/portfolio/holdings'),
  },
  {
    label: t('transactions'),
    command: () => router.push('/portfolio/transactions'),
  },
  {
    label: t('dividends'),
    command: () => router.push('/portfolio/dividends'),
  },
  { separator: true },
  // {
  //   label: t('portfolios'),
  //   icon: 'pi pi-folder',
  //   command: () => router.push('/portfolios'),
  // },
])

const toolItems = ref([
  // {
  //   label: t('setTargets'),
  //   icon: 'pi pi-cog',
  //   command: () => router.push('/allocation'),
  // },
  {
    label: t('rebalance'),
    command: () => router.push('/rebalancing'),
  },
  {
    label: t('backtesting'),
    command: () => router.push('/backtesting'),
  },
  { separator: true },
])

// 路由狀態檢查
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

const isActive = (paths) => {
  if (Array.isArray(paths)) {
    return paths.includes(route.path)
  }
  return route.path === paths
}
</script>

<style scoped>
.custom-menu {
  background-color: var(--p-surface-card);
  border: 1px solid var(--p-select-border-color);
  color: var(--p-content-color);
  border-radius: 0.5rem;
}

.custom-menu .p-menuitem:hover {
  background-color: var(--p-surface-hover);
  color: var(--p-primary-color);
}

.p-menu .p-menuitem-link {
  padding: 0.75rem 1rem;
}
</style>
