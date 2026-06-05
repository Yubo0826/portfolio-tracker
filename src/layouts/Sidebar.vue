<template>
  <!-- Desktop: fixed sidebar -->
  <aside
    v-if="persistent"
    class="shell__sidebar hidden lg:flex"
  >
    <div class="flex items-center justify-between px-6 pt-6">
      <button type="button" class="shell__brand" @click="goDashboard">
        <span class="shell__brand-stock">Stock</span>
        <span class="shell__brand-bar">Bar</span>
      </button>
    </div>

    <div class="px-4 pt-6">
      <button
        type="button"
        class="portfolio-menu-trigger shell__portfolio-trigger"
        :class="{ 'is-open': portfolioMenuVisible }"
        :aria-label="t('openPortfolioMenu')"
        :aria-expanded="portfolioMenuVisible"
        @click="togglePortfolioMenu"
      >
        <div class="flex min-w-0 flex-col items-start text-left">
          <span class="text-[8px] font-semibold uppercase tracking-[0.18em] text-[var(--p-text-muted-color)]">{{ t('portfolio') }}</span>
          <span class="portfolio-menu-current__label truncate">{{ currentPortfolioName }}</span>
        </div>
        <SvgIcon name="chevron-down" class="portfolio-menu-trigger__icon" />
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

    <nav class="flex-1 overflow-y-auto px-3 pb-6 pt-8">
      <div
        v-for="section in sidebarSections"
        :key="section.key"
        class="mb-6 last:mb-0"
      >
        <div v-if="section.label" class="shell__section-label">{{ section.label }}</div>
        <div :class="{ 'pl-6': section.label }">
          <RouterLink
            v-for="item in section.items"
            :key="item.key"
            :to="item.to"
            class="shell__nav-item"
            :class="{ 'is-active': isNavItemActive(item), 'shell__nav-item--sub': section.label }"
          >
            <span class="shell__nav-icon">
              <!-- <span class="material-symbols-outlined shell__material-icon" :data-icon="item.icon">{{ item.icon }}</span> -->
              <SvgIcon :name="item.icon" class="shell__nav-icon" />
            </span>
            <span class="truncate">{{ item.label }}</span>
          </RouterLink>
        </div>
      </div>
    </nav>

    <div class="mt-auto border-t border-[var(--p-content-border-color)] px-4 py-4">
      <button type="button" class="shell__profile" @click="$emit('toggle-menu')">
        <Avatar :image="userPhotoUrl" shape="circle" class="shrink-0" />
        <div class="min-w-0 flex-1 text-left">
          <p class="truncate text-sm font-semibold">{{ userDisplayName }}</p>
          <p class="truncate text-xs text-[var(--p-text-muted-color)]">{{ userEmail }}</p>
        </div>
        <i class="pi pi-ellipsis-v text-xs text-[var(--p-text-muted-color)]"></i>
      </button>
    </div>
  </aside>

  <!-- Mobile: drawer sidebar -->
  <Drawer
    v-else
    v-model:visible="visible"
    position="left"
    class="w-[19rem] max-w-[88vw]"
  >
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
              class="shell__nav-item w-full"
              :class="{ 'is-active': isNavItemActive(item), 'shell__nav-item--sub': section.label }"
              @click="go(item.to, closeCallback)"
            >
              <span class="shell__nav-icon">
                <span class="material-symbols-outlined shell__material-icon" :data-icon="item.icon">{{ item.icon }}</span>
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

import SvgIcon from '@/components/SvgIcon.vue'
import { buildSidebarSections } from './navigation.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const props = defineProps({
  persistent: {
    type: Boolean,
    default: false,
  },
  visible: {
    type: Boolean,
    default: false,
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

const emit = defineEmits(['update:visible', 'toggle-menu'])

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

const goDashboard = () => {
  router.push('/dashboard')
}
</script>

<style>
/* ===== Desktop sidebar layout ===== */
.shell__sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 40;
  width: 17rem;
  flex-direction: column;
  border-right: 1px solid rgb(30, 43, 70);
  background: var(--p-content-background);
  backdrop-filter: blur(18px);
}

.shell__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
}

.shell__brand-stock {
  color: color-mix(in srgb, var(--p-text-color) 80%, transparent);
}

.shell__brand-bar {
  color: var(--p-primary-color);
}

.shell__portfolio-trigger {
  width: 100%;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border: 1px solid rgb(30, 43, 70);
  border-radius: 1rem;
  background: rgb(20 31 52 / var(--tw-bg-opacity, 1));
}

.shell__section-label {
  padding: 0 0.75rem 0.6rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--p-text-muted-color);
}

.shell__profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 78%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--p-content-background) 92%, transparent);
  color: var(--p-text-color);
  transition: background-color 0.16s ease, border-color 0.16s ease;
}

.shell__profile:hover {
  background: color-mix(in srgb, var(--p-content-background) 100%, transparent);
  border-color: color-mix(in srgb, var(--p-primary-color) 22%, var(--p-content-border-color));
}

/* ===== Shared nav items ===== */
.shell__nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  /* min-height: 2.6rem; */
  /* margin-bottom: 0.125rem; */
  padding: 0.25rem 0.8rem;
  border-radius: 0.6rem;
  font-size: 0.9rem;
  /* font-weight: 500; */
  color: color-mix(in srgb, var(--p-text-color) 72%, transparent);
  transition: background-color 0.14s ease, color 0.14s ease;
}

.shell__nav-item--sub {
  border-left: 1px solid #424242;
  border-radius: 0 1rem 1rem 0;
}

.shell__nav-item:hover {
  /* background: color-mix(in srgb, var(--p-text-color) 6%, transparent); */
  color: var(--p-text-color);
}

.shell__nav-item--sub:hover {
  border-left-color: #747474;
}

.shell__nav-item.is-active {
  /* background: color-mix(in srgb, var(--p-primary-color) 14%, var(--p-surface-card)); */
  color: var(--p-primary-color);
  font-weight: 500;
}

.shell__nav-item--sub.is-active {
  border-left-color: #c2c2c2;
}

.dark .shell__nav-item:hover {
  /* background: color-mix(in srgb, var(--p-text-color) 8%, transparent); */
  color: var(--p-text-color);
}

.dark .shell__nav-item.is-active {
  /* background: color-mix(in srgb, var(--p-primary-color) 22%, var(--p-surface-card)); */
  color: color-mix(in srgb, white 94%, var(--p-primary-color));
}

.shell__nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  color: inherit;
  transition: color 0.14s ease;
}

.shell__material-icon {
  font-size: 1rem;
  color: inherit;
}

/* ===== Portfolio menu shared ===== */
.portfolio-menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
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
</style>
