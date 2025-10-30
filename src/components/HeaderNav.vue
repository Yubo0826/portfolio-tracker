<template>
  <nav>
    <!-- Dashboard -->
    <RouterLink to="/dashboard">
      <Button
        :style="{ color: ['/dashboard'].includes($router.currentRoute.value.path) ? 'var(--p-primary-color)' : '' }"
        :label="t('dashboard')"
        severity="secondary"
        variant="text"
        class="font-bold m-1"
      />
    </RouterLink>

    <!-- Portfolio -->
    <div class="relative inline-block">
      <RouterLink to="/portfolio">
        <!-- icon="pi pi-chevron-down" -->
        <Button
          :label="t('portfolio')"
          iconPos="right"
          severity="secondary"
          variant="text"
          class="m-1"
          :style="{ color: ['/portfolio', '/portfolio/holdings', '/portfolio/transactions', '/portfolio/dividends'].includes($router.currentRoute.value.path) ? 'var(--p-primary-color)' : '' }"
          @mouseenter="cancelClose(); toggleDropdown('portfolio')"
          @mouseleave="closeDropdown(180)"
        />
      </RouterLink>

      <transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-show="openDropdown === 'portfolio'"
          @mouseenter="cancelClose"
          @mouseleave="closeDropdown(180)"
          class="absolute left-0 mt-2 w-48 rounded-md shadow bg-white ring-1 ring-[#ececec] ring-opacity-5 focus:outline-none z-10"
        >
          <div class="py-1 cursor-pointer">
            <div @click="$router.push('/portfolios'); openDropdown = null; closeTimer = null;" class="block text-left px-4 py-2 text-gray-700 border-b border-gray-200 hover:bg-gray-100">
              <i class="pi pi-folder mr-2"></i>{{ t('portfolios') }}
            </div>

            <!-- <div class="px-4 py-2 text-gray-500 border-b border-gray-200 cursor-default">
              {{ portfolioStore.currentPortfolio.name }}
            </div> -->

            <div @click="$router.push('/portfolio/holdings'); openDropdown = null; closeTimer = null;" class="block text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
              {{ t('holdings') }}
            </div>
            <div @click="$router.push('/portfolio/transactions'); openDropdown = null; closeTimer = null;" class="block text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
              {{ t('transactions') }}
            </div>
            <div @click="$router.push('/portfolio/dividends'); openDropdown = null; closeTimer = null;" class="block text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
              {{ t('dividends') }}
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Allocation -->
    <div class="relative inline-block">
      <!-- icon="pi pi-chevron-down" -->
       <!-- to="/allocation" -->
      <RouterLink>
        <Button
          :label="t('allocation')"
          iconPos="right"
          severity="secondary"
          variant="text"
          class="m-1"
          :style="{ color: ['/rebalancing', '/allocation', '/backtesting'].includes($router.currentRoute.value.path) ? 'var(--p-primary-color)' : '' }"
          @mouseenter="cancelClose(); toggleDropdown('tool')"
          @mouseleave="closeDropdown(180)"
        />
      </RouterLink>

      <transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-show="openDropdown === 'tool'"
          @mouseenter="cancelClose"
          @mouseleave="closeDropdown(180)"
          class="absolute left-0 mt-2 w-48 rounded-md shadow bg-white ring-1 ring-[#ececec] ring-opacity-5 focus:outline-none z-10"
        >
          <div class="py-1 cursor-pointer">
            <div @click="$router.push('/allocation'); openDropdown = null; closeTimer = null;" class="block text-left px-4 py-2 text-gray-700 border-b border-gray-200 hover:bg-gray-100">
              <i class="pi pi-bullseye mr-2"></i>
              <!-- <i class="pi pi-cog mr-2"></i> -->
              {{ t('allocationSettings') }}
            </div>
            <div @click="$router.push('/rebalancing'); openDropdown = null; closeTimer = null;" class="block text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
              {{ t('rebalance') }}
            </div>
            <div @click="$router.push('/backtesting'); openDropdown = null; closeTimer = null;" class="block text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
              {{ t('backtesting') }}
            </div>
          </div>
        </div>
      </transition>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { usePortfolioStore } from '@/stores/portfolio';
const portfolioStore = usePortfolioStore();

const openDropdown = ref(null)
const closeTimer = ref(null)


const toggleDropdown = (menuKey) => {
  cancelClose()
  openDropdown.value = openDropdown.value === menuKey ? null : menuKey
}

const closeDropdown = (delay = 180) => {
  if (closeTimer.value) clearTimeout(closeTimer.value)
  closeTimer.value = setTimeout(() => {
    openDropdown.value = null
    closeTimer.value = null
  }, delay)
}

const cancelClose = () => {
  if (closeTimer.value) {
    clearTimeout(closeTimer.value)
    closeTimer.value = null
  }
}
</script>
