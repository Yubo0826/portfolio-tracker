<template>
  <Drawer v-model:visible="visible">
    <template #container="{ closeCallback }">
      <div class="flex flex-col h-full">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
          <span class="inline-flex items-center gap-2">
            <span class="text-2xl font-bold">
              <span class="text-gray-500">Stock</span>
              <span :style="{ color: 'var(--p-primary-color)' }">Bar</span>
            </span>
          </span>
          <span>
            <Button type="button" @click="closeCallback" icon="pi pi-times" rounded variant="outlined"></Button>
          </span>
        </div>

        <!-- Scrollable Navigation -->
        <div class="overflow-y-auto">
          <ul class="list-none p-4 m-0">
            <!-- Main Navigation -->
            <li>
              <router-link
                v-ripple
                to="/dashboard"
                @click="emit('update:visible', false)"
                class="flex items-center cursor-pointer p-4 rounded text-surface-700 hover:bg-surface-100 dark:text-surface-0 dark:hover:bg-surface-800 duration-150 transition-colors p-ripple"
                :class="isActive('/dashboard') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : ''"
              >
                <Button icon="pi pi-home" class="mr-3" variant="outlined" severity="secondary" size="small"></Button>
                <span class="font-medium">{{ $t('dashboard') }}</span>
              </router-link>
            </li>
            <li>
              <router-link
                v-ripple
                to="/cash-flow"
                @click="emit('update:visible', false)"
                class="flex items-center cursor-pointer p-4 rounded text-surface-700 hover:bg-surface-100 dark:text-surface-0 dark:hover:bg-surface-800 duration-150 transition-colors p-ripple"
                :class="isActive('/cash-flow') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : ''"
              >
                <Button icon="pi pi-wallet" class="mr-3" variant="outlined" severity="secondary" size="small"></Button>
                <span class="font-medium">{{ $t('cashFlowNav') }}</span>
              </router-link>
            </li>
          </ul>

          <!-- Portfolio Section -->
          <ul class="list-none p-4 m-0">
            <li>
              <div class="p-4 flex items-center justify-between text-surface-500 dark:text-surface-400 cursor-default">
                <span class="font-medium uppercase text-xs tracking-wider">{{ $t('portfolio') }}</span>
              </div>
              <ul class="list-none p-0 m-0 overflow-hidden">
                <li>
                  <router-link
                    v-ripple
                    to="/portfolio/holdings"
                    @click="emit('update:visible', false)"
                    class="flex items-center cursor-pointer p-4 rounded text-surface-700 hover:bg-surface-100 dark:text-surface-0 dark:hover:bg-surface-800 duration-150 transition-colors p-ripple"
                    :class="isActive('/portfolio/holdings') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : ''"
                  >
                    <Button icon="pi pi-briefcase" class="mr-3" variant="outlined" severity="secondary" size="small"></Button>
                    <span class="font-medium">{{ $t('holdings') }}</span>
                  </router-link>
                </li>
                <li>
                  <router-link
                    v-ripple
                    to="/portfolio/transactions"
                    @click="emit('update:visible', false)"
                    class="flex items-center cursor-pointer p-4 rounded text-surface-700 hover:bg-surface-100 dark:text-surface-0 dark:hover:bg-surface-800 duration-150 transition-colors p-ripple"
                    :class="isActive('/portfolio/transactions') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : ''"
                  >
                    <Button icon="pi pi-list" class="mr-3" variant="outlined" severity="secondary" size="small"></Button>
                    <span class="font-medium">{{ $t('transactions') }}</span>
                  </router-link>
                </li>
                <li>
                  <router-link
                    v-ripple
                    to="/portfolio/dividends"
                    @click="emit('update:visible', false)"
                    class="flex items-center cursor-pointer p-4 rounded text-surface-700 hover:bg-surface-100 dark:text-surface-0 dark:hover:bg-surface-800 duration-150 transition-colors p-ripple"
                    :class="isActive('/portfolio/dividends') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : ''"
                  >
                    <Button icon="pi pi-dollar" class="mr-3" variant="outlined" severity="secondary" size="small"></Button>
                    <span class="font-medium">{{ $t('dividends') }}</span>
                  </router-link>
                </li>
              </ul>
            </li>
          </ul>

          <!-- Functions Section -->
          <ul class="list-none p-4 m-0">
            <li>
              <div class="p-4 flex items-center justify-between text-surface-500 dark:text-surface-400 cursor-default">
                <span class="font-medium uppercase text-xs tracking-wider">{{ $t('functions') }}</span>
              </div>
              <ul class="list-none p-0 m-0 overflow-hidden">
                <li>
                  <router-link
                    v-ripple
                    to="/allocation"
                    @click="emit('update:visible', false)"
                    class="flex items-center cursor-pointer p-4 rounded text-surface-700 hover:bg-surface-100 dark:text-surface-0 dark:hover:bg-surface-800 duration-150 transition-colors p-ripple"
                    :class="isActive('/allocation') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : ''"
                  >
                    <Button icon="pi pi-chart-pie" class="mr-3" variant="outlined" severity="secondary" size="small"></Button>
                    <span class="font-medium">{{ $t('setTargets') }}</span>
                  </router-link>
                </li>
                <li>
                  <router-link
                    v-ripple
                    to="/rebalancing"
                    @click="emit('update:visible', false)"
                    class="flex items-center cursor-pointer p-4 rounded text-surface-700 hover:bg-surface-100 dark:text-surface-0 dark:hover:bg-surface-800 duration-150 transition-colors p-ripple"
                    :class="isActive('/rebalancing') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : ''"
                  >
                    <Button icon="pi pi-sliders-h" class="mr-3" variant="outlined" severity="secondary" size="small"></Button>
                    <span class="font-medium">{{ $t('rebalance') }}</span>
                  </router-link>
                </li>
                <li>
                  <router-link
                    v-ripple
                    to="/backtesting"
                    @click="emit('update:visible', false)"
                    class="flex items-center cursor-pointer p-4 rounded text-surface-700 hover:bg-surface-100 dark:text-surface-0 dark:hover:bg-surface-800 duration-150 transition-colors p-ripple"
                    :class="isActive('/backtesting') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : ''"
                  >
                    <Button icon="pi pi-history" class="mr-3" variant="outlined" severity="secondary" size="small"></Button>
                    <span class="font-medium">{{ $t('backtesting') }}</span>
                  </router-link>
                </li>
                <li>
                  <router-link
                    v-ripple
                    to="/portfolios"
                    @click="emit('update:visible', false)"
                    class="flex items-center cursor-pointer p-4 rounded text-surface-700 hover:bg-surface-100 dark:text-surface-0 dark:hover:bg-surface-800 duration-150 transition-colors p-ripple"
                    :class="isActive('/portfolios') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : ''"
                  >
                    <Button icon="pi pi-folder" class="mr-3" variant="outlined" severity="secondary" size="small"></Button>
                    <span class="font-medium">{{ $t('portfolios') }}</span>
                  </router-link>
                </li>
              </ul>
            </li>
          </ul>
        </div>

        <!-- Footer -->
        <div class="mt-auto">
          <div class="user-info-item flex items-center p-5 border-b border-gray-200">
            <Avatar :image="auth.user.photoURL" shape="circle" class="mr-3" />
            <div class="flex flex-col">
              <span class="font-medium">{{ auth.user.displayName || auth.user.email }}</span>
              <span class="text-sm text-gray-500">{{ auth.user.email }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Drawer>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Drawer from 'primevue/drawer'
import Avatar from 'primevue/avatar'

import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()

const { t: $t } = useI18n()
const route = useRoute()

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:visible'])

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>
