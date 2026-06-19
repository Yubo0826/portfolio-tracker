<template>
  <!-- Desktop: fixed sidebar -->
  <aside
    v-if="persistent"
    class="sidebar hidden lg:flex"
  >
    <div class="sidebar-top">
      <button type="button" class="back-btn" @click="goDashboard">
        <span class="sidebar-brand">
          <span class="sidebar-brand__stock">Stock</span><span class="sidebar-brand__bar">Bar</span>
        </span>
      </button>

      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input
          type="text"
          :placeholder="t('searchPlaceholder')"
          readonly
          @click="$emit('open-search')"
          @keydown.enter.prevent="$emit('open-search')"
        />
      </div>

      <!-- Portfolio Menu -->
      <div class="sidebar-portfolio">
        <button
          type="button"
          class="portfolio-menu-trigger menu-item sidebar-portfolio__trigger"
          :class="{ 'is-open': portfolioMenuVisible }"
          :aria-label="t('openPortfolioMenu')"
          :aria-expanded="portfolioMenuVisible"
          @click="togglePortfolioMenu"
        >
          <span class="menu-item-left">
            <i class="fa-solid fa-briefcase"></i>
            <span class="sidebar-portfolio__text">
              <span class="sidebar-portfolio__label">{{ t('portfolio') }}</span>
              <span class="portfolio-menu-current__label truncate">{{ currentPortfolioName }}</span>
            </span>
          </span>
          <i class="fa-solid fa-chevron-down portfolio-menu-trigger__icon"></i>
        </button>

        <TieredMenu
          ref="portfolioMenu"
          :model="portfolioMenuItems"
          :popup="true"
          class="portfolio-tiered-menu"
          @show="onPortfolioMenuShow"
          @hide="onPortfolioMenuHide"
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
          class="sidebar-demo-notice"
        >
          <i class="pi pi-info-circle"></i>
          <span>{{ $t('demoUserMessage') }}</span>
        </div>
      </div>

      <template v-for="(section, index) in sidebarSections" :key="section.key">
        <div v-if="index > 0" class="menu-divider"></div>

        <div class="menu-group">
          <RouterLink
            v-for="item in section.items"
            :key="item.key"
            :to="item.to"
            class="menu-item"
            :class="{ active: isNavItemActive(item) }"
          >
            <span class="menu-item-left">
              <i :class="navIconClass(item.icon)"></i>
              {{ item.label }}
            </span>
          </RouterLink>
        </div>
      </template>
    </div>

    <div class="sidebar-user">
      <button
        type="button"
        class="user-profile"
        :class="{ 'is-open': userMenuVisible }"
        :aria-label="t('openUserMenu')"
        :aria-expanded="userMenuVisible"
        @click="toggleUserMenu"
      >
        <div class="user-info">
          <div v-if="userPhotoUrl" class="avatar avatar--image">
            <img :src="userPhotoUrl" :alt="userDisplayName" />
          </div>
          <div v-else class="avatar">{{ userInitial }}</div>
          <div>
            <div class="user-name">{{ userDisplayName }}</div>
            <div class="user-plan">{{ userEmail }}</div>
          </div>
        </div>
        <i class="fa-solid fa-chevron-up user-profile__chevron"></i>
      </button>

      <TieredMenu
        ref="userMenu"
        :model="menuItems"
        :popup="true"
        class="portfolio-tiered-menu"
        @show="onUserMenuShow"
        @hide="onUserMenuHide"
      >
        <template #start>
          <div class="portfolio-menu-current">
            <span class="portfolio-menu-current__label">{{ userDisplayName }}</span>
            <i class="pi pi-chevron-up text-xs"></i>
          </div>
        </template>

        <template #item="{ item, props }">
          <a
            v-ripple
            class="portfolio-menu-item"
            :class="{
              'is-active': item.active,
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
    </div>
  </aside>

  <!-- Mobile: drawer sidebar -->
  <Drawer
    v-else
    v-model:visible="visible"
    position="left"
    class="sidebar-drawer w-[19rem] max-w-[88vw]"
  >
    <template #container="{ closeCallback }">
      <div class="sidebar sidebar--drawer">
        <div class="sidebar-top">
          <button
            type="button"
            class="back-btn"
            @click="go('/dashboard', closeCallback)"
          >
            <i class="fa-solid fa-arrow-left"></i>
            <span class="sidebar-brand">
              <span class="sidebar-brand__stock">Stock</span><span class="sidebar-brand__bar">Bar</span>
            </span>
          </button>

          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              :placeholder="t('searchPlaceholder')"
              readonly
              @click="openSearchAndClose(closeCallback)"
              @keydown.enter.prevent="openSearchAndClose(closeCallback)"
            />
          </div>

          <div class="sidebar-portfolio">
            <button
              type="button"
              class="portfolio-menu-trigger menu-item sidebar-portfolio__trigger"
              :class="{ 'is-open': portfolioMenuVisible }"
              :aria-label="t('openPortfolioMenu')"
              :aria-expanded="portfolioMenuVisible"
              @click="togglePortfolioMenu"
            >
              <span class="menu-item-left">
                <i class="fa-solid fa-briefcase"></i>
                <span class="sidebar-portfolio__text">
                  <span class="sidebar-portfolio__label">{{ t('portfolio') }}</span>
                  <span class="portfolio-menu-current__label truncate">{{ currentPortfolioName }}</span>
                </span>
              </span>
              <i class="fa-solid fa-chevron-down portfolio-menu-trigger__icon"></i>
            </button>

            <TieredMenu
              ref="portfolioMenuMobile"
              :model="portfolioMenuItems"
              :popup="true"
              class="portfolio-tiered-menu"
              @show="onPortfolioMenuShow"
              @hide="onPortfolioMenuHide"
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
              class="sidebar-demo-notice"
            >
              <i class="pi pi-info-circle"></i>
              <span>{{ $t('demoUserMessage') }}</span>
            </div>
          </div>

          <template v-for="(section, index) in sidebarSections" :key="section.key">
            <div v-if="index > 0" class="menu-divider"></div>

            <div class="menu-group">
              <button
                v-for="item in section.items"
                :key="item.key"
                type="button"
                class="menu-item w-full"
                :class="{ active: isNavItemActive(item) }"
                @click="go(item.to, closeCallback)"
              >
                <span class="menu-item-left">
                  <i :class="navIconClass(item.icon)"></i>
                  {{ item.label }}
                </span>
              </button>
            </div>
          </template>
        </div>

        <div class="sidebar-user">
          <button
            type="button"
            class="user-profile"
            :class="{ 'is-open': userMenuVisible }"
            :aria-label="t('openUserMenu')"
            :aria-expanded="userMenuVisible"
            @click="toggleUserMenu"
          >
            <div class="user-info">
              <div v-if="userPhotoUrl" class="avatar avatar--image">
                <img :src="userPhotoUrl" :alt="userDisplayName" />
              </div>
              <div v-else class="avatar">{{ userInitial }}</div>
              <div>
                <div class="user-name">{{ userDisplayName }}</div>
                <div class="user-plan">{{ userEmail }}</div>
              </div>
            </div>
            <i class="fa-solid fa-chevron-up user-profile__chevron"></i>
          </button>

          <TieredMenu
            ref="userMenuMobile"
            :model="menuItems"
            :popup="true"
            class="portfolio-tiered-menu"
            @show="onUserMenuShow"
            @hide="onUserMenuHide"
          >
            <template #start>
              <div class="portfolio-menu-current">
                <span class="portfolio-menu-current__label">{{ userDisplayName }}</span>
                <i class="pi pi-chevron-up text-xs"></i>
              </div>
            </template>

            <template #item="{ item, props }">
              <a
                v-ripple
                class="portfolio-menu-item"
                :class="{
                  'is-active': item.active,
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
        </div>
      </div>
    </template>
  </Drawer>
</template>

<script setup>
import { computed, ref, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Drawer from 'primevue/drawer'
import TieredMenu from 'primevue/tieredmenu'

import { buildSidebarSections } from './navigation.js'

const NAV_ICON_MAP = {
  dashboard: 'fa-solid fa-gauge',
  bank: 'fa-solid fa-building-columns',
  receipt: 'fa-solid fa-receipt',
  savings: 'fa-solid fa-piggy-bank',
  cash: 'fa-solid fa-money-bill-wave',
  'pie-chart': 'fa-solid fa-bullseye',
  piechart: 'fa-solid fa-arrows-rotate',
  history: 'fa-solid fa-clock-rotate-left',
  folder: 'fa-solid fa-folder',
  book: 'fa-solid fa-book',
}

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
  menuItems: {
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

const emit = defineEmits(['update:visible', 'open-search'])

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const portfolioMenu = ref()
const portfolioMenuMobile = ref()
const portfolioMenuVisible = ref(false)
const userMenu = ref()
const userMenuMobile = ref()
const userMenuVisible = ref(false)
const sidebarSections = computed(() => buildSidebarSections(t))

const userInitial = computed(() => (props.userDisplayName || '?').charAt(0).toUpperCase())

const navIconClass = (icon) => NAV_ICON_MAP[icon] || 'fa-solid fa-circle'

const isNavItemActive = (item) => {
  return item.activePaths.some((path) => route.path === path || route.path.startsWith(`${path}/`))
}

const togglePortfolioMenu = (event) => {
  const menuRef = props.persistent ? portfolioMenu.value : portfolioMenuMobile.value
  menuRef?.toggle(event)
}

const toggleUserMenu = (event) => {
  const menuRef = props.persistent ? userMenu.value : userMenuMobile.value
  menuRef?.toggle(event)
}

let menuPositionCleanup = null

const clearMenuPositionLock = () => {
  menuPositionCleanup?.()
  menuPositionCleanup = null
}

const lockPopupMenuPosition = (menuRef) => {
  clearMenuPositionLock()

  nextTick(() => {
    const menu = menuRef.value
    if (!menu?.container || !menu?.target) return

    const reposition = () => {
      if (!menu.visible || !menu.container || !menu.target) return

      const target = menu.target.getBoundingClientRect()
      const container = menu.container
      const gap = 4
      const containerHeight = container.offsetHeight
      const containerWidth = container.offsetWidth
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth

      let top = target.bottom + gap
      if (top + containerHeight > viewportHeight && target.top - containerHeight - gap > 0) {
        top = target.top - containerHeight - gap
      }

      let left = target.left
      if (left + containerWidth > viewportWidth) {
        left = Math.max(gap, viewportWidth - containerWidth - gap)
      }

      container.style.position = 'fixed'
      container.style.top = `${top}px`
      container.style.left = `${left}px`
      container.style.minWidth = `${target.width}px`
    }

    reposition()

    const sidebarScroll = menu.target.closest('.sidebar-top')
    const onScroll = () => reposition()

    window.addEventListener('scroll', onScroll, true)
    sidebarScroll?.addEventListener('scroll', onScroll, { passive: true })

    menuPositionCleanup = () => {
      window.removeEventListener('scroll', onScroll, true)
      sidebarScroll?.removeEventListener('scroll', onScroll)
    }
  })
}

const onPortfolioMenuShow = () => {
  portfolioMenuVisible.value = true
  lockPopupMenuPosition(props.persistent ? portfolioMenu : portfolioMenuMobile)
}

const onPortfolioMenuHide = () => {
  portfolioMenuVisible.value = false
  clearMenuPositionLock()
}

const onUserMenuShow = () => {
  userMenuVisible.value = true
  lockPopupMenuPosition(props.persistent ? userMenu : userMenuMobile)
}

const onUserMenuHide = () => {
  userMenuVisible.value = false
  clearMenuPositionLock()
}

onBeforeUnmount(clearMenuPositionLock)

const go = (to, closeCallback) => {
  emit('update:visible', false)
  closeCallback?.()
  router.push(to)
}

const goDashboard = () => {
  router.push('/dashboard')
}

const openSearchAndClose = (closeCallback) => {
  emit('update:visible', false)
  closeCallback?.()
  emit('open-search')
}
</script>

<style>
/* Reference light-mode palette (Cursor Settings) */
html:not(.dark) .sidebar {
  --bg-sidebar: #f0f4f8;
  --bg-main: #f8fafc;
  --bg-card: #f1f5f9;
  --text-main: #334155;
  --text-muted: #64748b;
  --accent-color: #3b82f6;
  --border-color: #e2e8f0;

  --sidebar-bg: var(--bg-sidebar);
  --sidebar-border: var(--border-color);
  --sidebar-text: var(--text-main);
  --sidebar-text-muted: var(--text-muted);
  --sidebar-active-bg: #e2e8f0;
  --sidebar-active-text: #334155;
  --sidebar-input-bg: #ffffff;
  --sidebar-avatar-bg: #cbd5e1;
  --sidebar-hover-bg: #e2e8f0;
}

.sidebar {
  --sidebar-bg: color-mix(in srgb, var(--p-surface-background) 88%, var(--p-content-border-color));
  --sidebar-border: var(--p-content-border-color);
  --sidebar-text: var(--p-text-color);
  --sidebar-text-muted: var(--p-text-muted-color);
  --sidebar-active-bg: color-mix(in srgb, var(--p-text-color) 12%, transparent);
  --sidebar-input-bg: var(--p-content-background);
  --sidebar-avatar-bg: color-mix(in srgb, var(--p-text-muted-color) 35%, transparent);
  --sidebar-hover-bg: color-mix(in srgb, var(--p-text-color) 6%, transparent);

  position: fixed;
  inset: 0 auto 0 0;
  z-index: 40;
  width: 260px;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  padding: 16px;
  padding-top: 0px;
  justify-content: space-between;
  overflow: hidden;
}

.sidebar--drawer {
  position: static;
  width: 100%;
  height: 100%;
  z-index: auto;
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  color: var(--sidebar-text-muted);
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
}

.back-btn:hover {
  color: var(--sidebar-text);
}

html:not(.dark) .back-btn:hover {
  color: #64748b;
}

.sidebar-brand {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.sidebar-brand__stock {
  color: color-mix(in srgb, var(--sidebar-text) 80%, transparent);
}

html:not(.dark) .sidebar-brand__stock {
  color: #334155;
}

.sidebar-brand__bar {
  color: var(--p-primary-color);
}

html:not(.dark) .sidebar-brand__bar {
  color: #3b82f6;
}

.search-box {
  position: relative;
  margin: 8px 0;
}

.search-box i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--sidebar-text-muted);
  font-size: 14px;
  pointer-events: none;
}

.search-box input {
  width: 100%;
  padding: 8px 8px 8px 32px;
  border: 1px solid var(--sidebar-border);
  border-radius: 6px;
  background-color: var(--sidebar-input-bg);
  font-size: 13px;
  color: var(--sidebar-text);
  cursor: pointer;
}

.search-box input:focus {
  outline: none;
  border-color: var(--border-color, var(--sidebar-border));
}

html:not(.dark) .search-box input:focus {
  border-color: #e2e8f0;
}

.sidebar-portfolio {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-portfolio__trigger {
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
}

.sidebar-portfolio__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

.sidebar-portfolio__label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sidebar-text-muted);
}

.sidebar-demo-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--sidebar-border);
  border-radius: 6px;
  background-color: var(--sidebar-input-bg);
  font-size: 12px;
  color: var(--sidebar-text-muted);
}

.menu-group {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  color: var(--sidebar-text);
  text-decoration: none;
  font-size: 14px;
  transition: background-color 0.16s ease;
}

.menu-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.menu-item i {
  width: 16px;
  color: var(--sidebar-text-muted);
  text-align: center;
  flex-shrink: 0;
}

.menu-item:hover,
.menu-item.active {
  background-color: var(--sidebar-active-bg);
  color: var(--sidebar-active-text, var(--sidebar-text));
}

.menu-item.active {
  font-weight: 500;
}

.menu-divider {
  height: 1px;
  background-color: var(--sidebar-border);
  margin: 12px 0;
}

.user-profile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  background: none;
  color: inherit;
  width: 100%;
  flex-shrink: 0;
  transition: background-color 0.16s ease;
}

.user-profile:hover,
.user-profile.is-open {
  background-color: var(--sidebar-hover-bg);
}

html:not(.dark) .user-profile:hover,
html:not(.dark) .user-profile.is-open {
  background-color: transparent;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.avatar {
  width: 32px;
  height: 32px;
  background-color: var(--sidebar-avatar-bg);
  color: var(--sidebar-avatar-text, var(--sidebar-text));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.avatar--image {
  overflow: hidden;
  background: none;
}

.avatar--image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--sidebar-user-name, var(--sidebar-text));
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-plan {
  font-size: 11px;
  color: var(--sidebar-text-muted);
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-profile__chevron {
  font-size: 12px;
  color: var(--sidebar-text-muted);
  flex-shrink: 0;
  transition: transform 0.16s ease;
}

.user-profile.is-open .user-profile__chevron {
  transform: rotate(180deg);
}

.portfolio-menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--sidebar-text);
  transition: background-color 0.16s ease, color 0.16s ease;
}

.portfolio-menu-trigger:hover,
.portfolio-menu-trigger.is-open {
  background: var(--sidebar-hover-bg);
}

html:not(.dark) .portfolio-menu-trigger:hover,
html:not(.dark) .portfolio-menu-trigger.is-open {
  background: #e2e8f0;
}

.portfolio-menu-trigger__icon {
  font-size: 10px;
  color: var(--sidebar-text-muted);
  transition: transform 0.16s ease;
}

.portfolio-menu-trigger.is-open .portfolio-menu-trigger__icon {
  transform: rotate(180deg);
}

.portfolio-tiered-menu.p-tieredmenu,
.portfolio-tiered-menu .p-tieredmenu-submenu {
  min-width: 17rem;
  padding: 0.375rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 1rem;
  background: var(--p-surface-card);
  box-shadow: 0 22px 44px rgba(0, 0, 0, 0.12);
}

.portfolio-tiered-menu.p-tieredmenu {
  position: fixed;
}

html:not(.dark) .portfolio-tiered-menu.p-tieredmenu,
html:not(.dark) .portfolio-tiered-menu .p-tieredmenu-submenu {
  border-color: #e2e8f0;
  background: #ffffff;
  box-shadow: 0 22px 44px rgba(15, 23, 42, 0.08);
}

.portfolio-tiered-menu .p-tieredmenu-root-list,
.portfolio-tiered-menu .p-tieredmenu-submenu {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.portfolio-tiered-menu .p-tieredmenu-item-content {
  padding: 0;
  background: transparent;
  border-radius: 0;
  color: inherit;
}

.portfolio-tiered-menu .p-tieredmenu-item-link {
  background: transparent;
  border-radius: 0;
  color: inherit;
}

.portfolio-tiered-menu .p-tieredmenu-item-content:hover,
.portfolio-tiered-menu .p-tieredmenu-item-content.p-focus,
.portfolio-tiered-menu .p-tieredmenu-item.p-focus > .p-tieredmenu-item-content,
.portfolio-tiered-menu .p-tieredmenu-item-link:hover,
.portfolio-tiered-menu .p-tieredmenu-item-link.p-focus {
  background: transparent;
  color: inherit;
}

.portfolio-tiered-menu .p-tieredmenu-separator {
  margin: 0.375rem 0.5rem;
  border-top: 1px solid var(--p-content-border-color);
}

.portfolio-menu-current {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 0.875rem 0.625rem;
  color: var(--p-text-color);
}

html:not(.dark) .portfolio-menu-current {
  color: #334155;
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

html:not(.dark) .portfolio-menu-section {
  color: #64748b;
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

html:not(.dark) .portfolio-menu-item {
  color: #334155;
}

.portfolio-menu-item:hover {
  background: color-mix(in srgb, var(--p-text-color) 6%, transparent);
}

html:not(.dark) .portfolio-menu-item:hover {
  background: #f1f5f9;
}

.portfolio-menu-item.is-active {
  background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
  color: var(--p-primary-color);
}

html:not(.dark) .portfolio-menu-item.is-active {
  background: #e2e8f0;
  color: #334155;
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

html:not(.dark) .portfolio-menu-item__suffix {
  color: #64748b;
}

html:not(.dark) .portfolio-tiered-menu .p-tieredmenu-separator {
  border-top-color: #e2e8f0;
}

/* Reference dark-mode palette (Cursor Settings) */
.dark .sidebar {
  --bg-sidebar: #0b121f;
  --bg-main: #070a12;
  --bg-card: #0f172a;
  --bg-input: #1e293b;
  --border-color: #1e293b;
  --text-main: #94a3b8;
  --text-muted: #64748b;
  --text-title: #f8fafc;
  --accent-blue: #38bdf8;
  --accent-bg: #1e293b;
  --control-btn-hover: #334155;

  --sidebar-bg: var(--bg-sidebar);
  --sidebar-border: var(--border-color);
  --sidebar-text: var(--text-main);
  --sidebar-text-muted: var(--text-muted);
  --sidebar-active-bg: var(--accent-bg);
  --sidebar-active-text: var(--text-title);
  --sidebar-input-bg: var(--bg-input);
  --sidebar-avatar-bg: #cbd5e1;
  --sidebar-avatar-text: #334155;
  --sidebar-user-name: var(--text-title);
  --sidebar-hover-bg: var(--control-btn-hover);
}

.dark .back-btn:hover {
  color: #64748b;
}

.dark .sidebar-brand__stock {
  color: #f8fafc;
}

.dark .sidebar-brand__bar {
  color: #38bdf8;
}

.dark .user-profile:hover,
.dark .user-profile.is-open {
  background-color: transparent;
}

.dark .portfolio-tiered-menu.p-tieredmenu,
.dark .portfolio-tiered-menu .p-tieredmenu-submenu {
  border-color: #1e293b;
  background: #0f172a;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.48);
}

.dark .portfolio-tiered-menu .p-tieredmenu-separator {
  border-top-color: #1e293b;
}

.dark .portfolio-menu-trigger:hover,
.dark .portfolio-menu-trigger.is-open {
  background: #334155;
}

.dark .portfolio-menu-current {
  color: #f8fafc;
}

.dark .portfolio-menu-section {
  color: #64748b;
}

.dark .portfolio-menu-item {
  color: #94a3b8;
}

.dark .portfolio-menu-item:hover {
  background: #334155;
}

.dark .portfolio-menu-item.is-active {
  background: #1e293b;
  color: #f8fafc;
}

.dark .portfolio-menu-item__suffix {
  color: #64748b;
}
</style>
