<template>
  <Drawer v-model:visible="visible" position="left" class="w-[19rem] max-w-[88vw]">
    <template #container="{ closeCallback }">
      <div class="flex h-full flex-col bg-[var(--p-surface-card)] text-[var(--p-text-color)]">
        <div class="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <button
            type="button"
            class="inline-flex items-center gap-1 text-left text-2xl font-bold"
            @click="go('/dashboard', closeCallback)"
          >
            <span class="text-[var(--p-text-color)] opacity-75">Stock</span>
            <span class="text-[var(--p-primary-color)]">Bar</span>
          </button>

          <Button type="button" @click="closeCallback" icon="pi pi-times" rounded variant="text" severity="secondary"></Button>
        </div>

        <div class="px-4 pt-2 shrink-0">
          <button
            type="button"
            class="portfolio-menu-trigger w-full justify-between rounded-2xl border border-[var(--p-content-border-color)] bg-[var(--p-content-background)] px-4 py-3"
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
            v-if="isDemoUser"
            class="mt-3 flex items-start gap-2 rounded-2xl border border-[var(--p-content-border-color)] bg-[var(--p-content-background)] px-3 py-2 text-xs text-[var(--p-text-muted-color)]"
          >
            <i class="pi pi-info-circle mt-0.5"></i>
            <span>{{ $t('demoUserMessage') }}</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-3 pb-6 pt-6">
          <div
            v-for="section in sidebarSections"
            :key="section.key"
            class="mb-6 last:mb-0"
          >
            <div
              v-if="section.label"
              class="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--p-text-muted-color)]"
            >
              {{ section.label }}
            </div>

            <button
              v-for="item in section.items"
              :key="item.key"
              type="button"
              class="app-shell__nav-item w-full"
              :class="{ 'is-active': isNavItemActive(item) }"
              @click="go(item.to, closeCallback)"
            >
              <span class="app-shell__nav-icon">
                <span class="material-symbols-outlined app-shell__material-icon" :data-icon="item.icon">{{ item.icon }}</span>
              </span>
              <span class="truncate">{{ item.label }}</span>
            </button>
          </div>
        </div>

        <div class="mt-auto border-t border-[var(--p-content-border-color)] px-4 py-4">
          <div class="flex items-center gap-3 rounded-2xl bg-[var(--p-content-background)] px-3 py-3">
            <Avatar :image="userPhotoUrl" shape="circle" class="shrink-0" />
            <div class="flex min-w-0 flex-col text-left">
              <span class="truncate text-sm font-semibold">{{ userDisplayName }}</span>
              <span class="truncate text-xs text-[var(--p-text-muted-color)]">{{ userEmail }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Drawer>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Drawer from 'primevue/drawer'
import Avatar from 'primevue/avatar'
import TieredMenu from 'primevue/tieredmenu'

import { buildSidebarSections } from './navigation.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  currentPortfolioName: {
    type: String,
    required: true,
  },
  portfolioMenuItems: {
    type: Array,
    required: true,
  },
  isDemoUser: {
    type: Boolean,
    default: false,
  },
  userDisplayName: {
    type: String,
    default: '',
  },
  userEmail: {
    type: String,
    default: '',
  },
  userPhotoUrl: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:visible'])

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const portfolioMenu = ref()
const portfolioMenuVisible = ref(false)
const sidebarSections = computed(() => buildSidebarSections(t))

const isNavItemActive = (item) => {
  return item.activePaths.some((path) => route.path === path || route.path.startsWith(`${path}/`))
}

const togglePortfolioMenu = (event) => {
  portfolioMenu.value?.toggle(event)
}

const go = (to, closeCallback) => {
  emit('update:visible', false)
  closeCallback?.()
  router.push(to)
}
</script>
