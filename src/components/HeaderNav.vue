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
    <div
      class="relative"
      @mouseenter="openHoverMenu('portfolioMenu', $event)"
      @mouseleave="closeHoverMenu('portfolioMenu')"
    >
    <!-- :label="t('portfolio')"
    icon="pi pi-chevron-down"
    iconPos="right" -->
      <Button
        severity="secondary"
        variant="text"
        class="m-1"
        :style="{ color: isActive(['/portfolio','/portfolio/holdings','/portfolio/transactions','/portfolio/dividends']) ? 'var(--p-primary-color)' : '' }"
        @click="$router.push('/portfolio/holdings')"
      >
        <template #default>
          <div class="font-medium">
            {{ t('portfolio') }}
            <i class="pi pi-chevron-down ml-1" style="font-size: .65rem"></i>
          </div>
        </template>
      </Button>
      <Menu
        ref="portfolioMenu"
        :model="portfolioItems"
        popup
        class="custom-menu"
        @mouseenter="openHoverMenu('portfolioMenu', $event)"
        @mouseleave="closeHoverMenu('portfolioMenu')"
      >
        <template #item="{ item, props }">
          <a v-ripple v-bind="props.action">
            <span :class="item.icon" />
            <span class="ml-2">{{ item.label }}</span>
          </a>
        </template>
        <template #end>
          <div class="p-3">
            <Button
              :label="$t('portfolios')"
              icon="pi pi-folder"
              @click="$router.push('/portfolios')"
              fluid
              text
              size="small"
            />
          </div>
        </template>
      </Menu>
    </div>

    <!-- Tools Menu -->
    <div
      class="relative"
      @mouseenter="openHoverMenu('toolMenu', $event)"
      @mouseleave="closeHoverMenu('toolMenu')"
    >
      <Button
        severity="secondary"
        variant="text"
        class="m-1"
        :style="{ color: isActive(['/allocation','/rebalancing','/backtesting']) ? 'var(--p-primary-color)' : '' }"
      >
        <template #default>
          <div class="font-medium">
            {{ t('functions') }}
            <i class="pi pi-chevron-down ml-1" style="font-size: .65rem"></i>
          </div>
        </template>
      </Button>
      <Menu
        ref="toolMenu"
        :model="toolItems"
        popup
        class="custom-menu"
        @mouseenter="openHoverMenu('toolMenu', $event)"
        @mouseleave="closeHoverMenu('toolMenu')"
      >
        <template #item="{ item, props }">
          <a v-ripple v-bind="props.action">
            <span :class="item.icon" />
            <span class="ml-2">{{ item.label }}</span>
          </a>
        </template>
        <template #end>
          <div class="p-3">
            <Button
              :label="$t('setTargets')"
              icon="pi pi-cog"
              @click="$router.push('/allocation')"
              fluid
              text
              size="small"
            />
          </div>
        </template>
      </Menu>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import { useRouter, useRoute } from 'vue-router'
import { usePortfolioStore } from '@/stores/portfolio'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const portfolioStore = usePortfolioStore()
const portfolioMenu = ref()
const toolMenu = ref()
const hoverTimeout = ref(null)

const openHoverMenu = (menuName, event) => {
  console.log('openHoverMenu ', menuName)
  clearTimeout(hoverTimeout.value)
  // 開一個之前先全部關掉，確保不重疊
  portfolioMenu.value?.hide()
  toolMenu.value?.hide()

  if (menuName === 'portfolioMenu') {
    portfolioMenu.value.show(event)
  } else if (menuName === 'toolMenu') {
    toolMenu.value.show(event)
  }
}

const closeHoverMenu = (menuName) => {
  console.log('closeHoverMenu called for', menuName)
  hoverTimeout.value = setTimeout(() => {
    if (menuName === 'portfolioMenu') {
      portfolioMenu.value?.hide()
    } else if (menuName === 'toolMenu') {
      toolMenu.value?.hide()
    }
  }, 150)
}


const portfolioItems = computed(() => [
  { label: t('holdings'), command: () => router.push('/portfolio/holdings') },
  { label: t('transactions'), command: () => router.push('/portfolio/transactions') },
  { label: t('dividends'), command: () => router.push('/portfolio/dividends') },
  { separator: true }
])

const toolItems = ref([
  { label: t('rebalance'), command: () => router.push('/rebalancing') },
  { label: t('backtesting'), command: () => router.push('/backtesting') },
  { separator: true }
])

const isActive = (paths) => {
  if (Array.isArray(paths)) return paths.includes(route.path)
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
