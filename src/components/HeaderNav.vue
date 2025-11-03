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
          class="nav-menu absolute left-0 mt-2 w-48 rounded-md focus:outline-none z-10 transition-colors duration-200"
        >
          <div class="py-1 cursor-pointer">
            <!-- Portfolio link -->
            <div
              @click="$router.push('/portfolios'); openDropdown = null; closeTimer = null;"
              class="nav-menu-item block text-left px-4 py-2 border-b transition-colors duration-150"
              :style="{
                borderColor: 'var(--p-select-border-color)',
              }"
            >
              <i class="pi pi-folder mr-2"></i>{{ t('portfolios') }}
            </div>

            <!-- Holdings -->
            <div
              @click="$router.push('/portfolio/holdings'); openDropdown = null; closeTimer = null;"
              class="nav-menu-item block text-left px-4 py-2 transition-colors duration-150"
            >
              {{ t('holdings') }}
            </div>

            <!-- Transactions -->
            <div
              @click="$router.push('/portfolio/transactions'); openDropdown = null; closeTimer = null;"
              class="nav-menu-item block text-left px-4 py-2 transition-colors duration-150"
            >
              {{ t('transactions') }}
            </div>

            <!-- Dividends -->
            <div
              @click="$router.push('/portfolio/dividends'); openDropdown = null; closeTimer = null;"
              class="nav-menu-item block text-left px-4 py-2 transition-colors duration-150"
            >
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
      <RouterLink to="/allocation">
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
          class="nav-menu absolute left-0 mt-2 w-48 rounded-md focus:outline-none z-10 transition-colors duration-200"
          >
          <div class="py-1 cursor-pointer">
            <div @click="$router.push('/allocation'); openDropdown = null; closeTimer = null;" 
              class="nav-menu-item block text-left px-4 py-2 border-b transition-colors duration-150"
                :style="{
                  borderColor: 'var(--p-select-border-color)',
                }"
              >
              <i class="pi pi-bullseye mr-2"></i>
              <!-- <i class="pi pi-cog mr-2"></i> -->
              {{ t('allocationSettings') }}
            </div>
            <div @click="$router.push('/rebalancing'); openDropdown = null; closeTimer = null;" 
              class="nav-menu-item block text-left px-4 py-2 transition-colors duration-150"
              >
              {{ t('rebalance') }}
            </div>
            <div @click="$router.push('/backtesting'); openDropdown = null; closeTimer = null;" 
              class="nav-menu-item block text-left px-4 py-2 transition-colors duration-150"
              >
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

<style>
.nav-menu {
  background-color: var(--p-surface-card);
  color: var(--p-surface-400);
  border: 1px solid var(--p-select-border-color);
  transition: color 0.2s;
}

.nav-menu-item {
  color: var(--p-content-color);
  transition: color 0.2s;
}

.nav-menu-item:hover {
  color: var(--p-primary-color);
}
</style>
