<template>
  <!-- 桌面版：固定側欄；手機版：Drawer。內容共用同一份模板 -->
  <component :is="persistent ? 'div' : Drawer" v-bind="wrapperProps">
    <template #[wrapperSlot]>
      <aside
        class="sidebar"
        :class="persistent ? ['hidden lg:flex', { 'sidebar--collapsed': collapsed }] : 'sidebar--drawer'"
      >
        <div class="sidebar-top">
          <div class="sidebar-top-row">
            <button v-show="!collapsed" type="button" class="back-btn" :title="t('dashboard')" @click="goDashboard">
              <i v-if="!persistent" class="pi pi-arrow-left"></i>
              <span class="sidebar-brand">
                <span class="sidebar-brand__stock">Stock</span><span class="sidebar-brand__bar">Bar</span>
              </span>
            </button>

            <button
              v-if="persistent"
              type="button"
              class="sidebar-collapse-btn"
              :aria-label="collapsed ? t('expandSidebar') : t('collapseSidebar')"
              @click="toggleCollapsed"
            >
              <i :class="collapsed ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'"></i>
            </button>
          </div>

          <!-- Portfolio Menu -->
          <div class="sidebar-portfolio">
            <button
              type="button"
              class="portfolio-menu-trigger menu-item sidebar-portfolio__trigger"
              :class="{ 'is-open': portfolioMenuVisible }"
              :title="collapsed ? currentPortfolioName : null"
              :aria-label="t('openPortfolioMenu')"
              :aria-expanded="portfolioMenuVisible"
              @click="portfolioMenu?.toggle($event)"
            >
              <span class="menu-item-left">
                <i class="pi pi-briefcase"></i>
                <span v-show="!collapsed" class="sidebar-portfolio__text">
                  <span class="sidebar-portfolio__label">{{ t('portfolio') }}</span>
                  <span class="portfolio-menu-current__label truncate">{{ currentPortfolioName }}</span>
                </span>
              </span>
              <i v-show="!collapsed" class="pi pi-chevron-down portfolio-menu-trigger__icon"></i>
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

              <template #item="{ item, props: itemProps }">
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
                  v-bind="itemProps.action"
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

            <div v-if="isDemoUser && !collapsed" class="sidebar-demo-notice">
              <i class="pi pi-info-circle"></i>
              <span>{{ $t('demoUserMessage') }}</span>
            </div>
          </div>

          <template v-for="(section, index) in sidebarSections" :key="section.key">
            <div v-if="index > 0" class="menu-divider"></div>

            <div class="menu-group">
              <template v-for="item in section.items" :key="item.key">
                <template v-if="item.type === 'group'">
                  <button
                    type="button"
                    class="menu-item menu-item--group w-full"
                    :class="{ 'is-expanded': !collapsed && isGroupExpanded(item) }"
                    :title="collapsed ? item.label : null"
                    :aria-expanded="isGroupExpanded(item)"
                    @click="onGroupTriggerClick(item)"
                  >
                    <span class="menu-item-left">
                      <i :class="[item.icon, 'menu-item-icon']" />
                      <span v-show="!collapsed">{{ item.label }}</span>
                    </span>
                    <i v-show="!collapsed" class="pi pi-chevron-right menu-item-group__chevron"></i>
                  </button>
                  <div
                    v-show="!collapsed"
                    class="menu-subgroup-wrapper"
                    :class="{ 'is-expanded': isGroupExpanded(item) }"
                  >
                    <div class="menu-subgroup">
                      <RouterLink
                        v-for="child in item.children"
                        :key="child.key"
                        :to="child.to"
                        class="menu-subitem"
                        :class="{ active: isNavItemActive(child) }"
                        @click="closeDrawer"
                      >
                        {{ child.label }}
                      </RouterLink>
                    </div>
                  </div>
                </template>

                <RouterLink
                  v-else
                  :to="item.to"
                  class="menu-item"
                  :class="{ active: isNavItemActive(item) }"
                  :title="collapsed ? item.label : null"
                  @click="closeDrawer"
                >
                  <span class="menu-item-left">
                    <i :class="[item.icon, 'menu-item-icon']" />
                    <span v-show="!collapsed">{{ item.label }}</span>
                  </span>
                </RouterLink>
              </template>
            </div>
          </template>
        </div>

        <div class="sidebar-user">
          <button
            type="button"
            class="user-profile"
            :class="{ 'is-open': userMenuVisible }"
            :title="collapsed ? userDisplayName : null"
            :aria-label="t('openUserMenu')"
            :aria-expanded="userMenuVisible"
            @click="userMenu?.toggle($event)"
          >
            <div class="user-info">
              <div v-if="userPhotoUrl" class="avatar avatar--image">
                <img :src="userPhotoUrl" :alt="userDisplayName" />
              </div>
              <div v-else class="avatar">{{ userInitial }}</div>
              <div v-show="!collapsed">
                <div class="user-name">{{ userDisplayName }}</div>
                <div class="user-plan">{{ userEmail }}</div>
              </div>
            </div>
            <i v-show="!collapsed" class="pi pi-chevron-up user-profile__chevron"></i>
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

            <template #item="{ item, props: itemProps }">
              <a
                v-ripple
                class="portfolio-menu-item"
                :class="{
                  'is-active': item.active,
                  'is-danger': item.kind === 'danger'
                }"
                v-bind="itemProps.action"
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
    </template>
  </component>
</template>

<script setup>
import { computed, ref, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Drawer from 'primevue/drawer'
import TieredMenu from 'primevue/tieredmenu'

import { buildSidebarSections } from './navigation.js'
import { useSidebarCollapse } from '@/composables/useSidebarCollapse.js'

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

const emit = defineEmits(['update:visible'])

const wrapperSlot = computed(() => (props.persistent ? 'default' : 'container'))
const wrapperProps = computed(() => props.persistent
  ? { class: 'contents' }
  : {
      visible: props.visible,
      'onUpdate:visible': (value) => emit('update:visible', value),
      position: 'left',
      class: 'sidebar-drawer w-[19rem] max-w-[88vw]',
    })

const portfolioMenu = ref()
const portfolioMenuVisible = ref(false)
const userMenu = ref()
const userMenuVisible = ref(false)
const sidebarSections = computed(() => buildSidebarSections(t))
const { isCollapsed, toggleCollapsed } = useSidebarCollapse()
// 收合只作用在桌面版固定側欄
const collapsed = computed(() => props.persistent && isCollapsed.value)

const userInitial = computed(() => (props.userDisplayName || '?').charAt(0).toUpperCase())

const isNavItemActive = (item) => {
  return item.activePaths.some((path) => route.path === path || route.path.startsWith(`${path}/`))
}

const expandedGroups = ref({})

const isGroupExpanded = (item) => {
  const override = expandedGroups.value[item.key]
  if (override !== undefined) return override
  return true
}

const toggleGroup = (item) => {
  expandedGroups.value = { ...expandedGroups.value, [item.key]: !isGroupExpanded(item) }
}

const onGroupTriggerClick = (item) => {
  if (collapsed.value) {
    router.push(item.children[0].to)
    return
  }
  toggleGroup(item)
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
  lockPopupMenuPosition(portfolioMenu)
}

const onPortfolioMenuHide = () => {
  portfolioMenuVisible.value = false
  clearMenuPositionLock()
}

const onUserMenuShow = () => {
  userMenuVisible.value = true
  lockPopupMenuPosition(userMenu)
}

const onUserMenuHide = () => {
  userMenuVisible.value = false
  clearMenuPositionLock()
}

onBeforeUnmount(clearMenuPositionLock)

const closeDrawer = () => {
  if (!props.persistent) emit('update:visible', false)
}

const goDashboard = () => {
  closeDrawer()
  router.push('/dashboard')
}
</script>

<style>
.sidebar {
  --sidebar-bg: var(--p-surface-background);
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
  width: var(--sidebar-width, 260px);
  background-color: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  padding: 16px;
  padding-top: 0px;
  justify-content: space-between;
  overflow: hidden;
  transition: width 0.18s ease;
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

.sidebar-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  min-height: 64px;
}

.sidebar--collapsed {
  padding-left: 8px;
  padding-right: 8px;
}

.sidebar--collapsed .sidebar-top-row {
  justify-content: center;
}

.sidebar-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--sidebar-text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.sidebar-collapse-btn:hover {
  background-color: var(--sidebar-hover-bg);
  color: var(--sidebar-text);
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
  min-width: 0;
  overflow: hidden;
}

.back-btn:hover {
  color: var(--sidebar-text);
}

.sidebar-brand {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.04em;
  white-space: nowrap;
}


.sidebar-brand__stock {
  color: color-mix(in srgb, var(--sidebar-text) 80%, transparent);
}

.sidebar-brand__bar {
  color: var(--p-primary-color);
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
  position: relative;
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

.menu-item.active::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 3px;
  background-color: var(--p-primary-color);
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

.menu-item-icon {
  width: 16px;
  height: 16px;
  color: var(--sidebar-text-muted) !important;
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

.menu-item--group {
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
}

.menu-item-group__chevron {
  font-size: 11px;
  color: var(--sidebar-text-muted);
  flex-shrink: 0;
  transition: transform 0.16s ease;
}

.menu-item--group.is-expanded .menu-item-group__chevron {
  transform: rotate(90deg);
}

.menu-subgroup-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.22s ease;
}

.menu-subgroup-wrapper.is-expanded {
  grid-template-rows: 1fr;
}

.menu-subgroup {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
  margin-bottom: 2px;
  overflow: hidden;
  min-height: 0;
}

.menu-subgroup-wrapper.is-expanded .menu-subitem {
  animation: menu-subitem-fade-in 0.22s ease both;
}

.menu-subitem {
  position: relative;
  display: block;
  width: 100%;
  padding: 7px 12px 7px 38px;
  border: none;
  background: none;
  border-radius: 6px;
  color: var(--sidebar-text-muted);
  text-decoration: none;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.menu-subitem.active::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 3px;
  background-color: var(--p-primary-color);
}

.menu-subitem:hover,
.menu-subitem.active {
  background-color: var(--sidebar-active-bg);
  color: var(--sidebar-active-text, var(--sidebar-text));
}

.menu-subitem.active {
  font-weight: 500;
}

.sidebar--collapsed .menu-subgroup-wrapper {
  display: none;
}

@keyframes menu-subitem-fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-divider {
  height: 1px;
  background-color: var(--sidebar-border);
  margin: 12px 0;
}

.sidebar--collapsed .menu-item,
.sidebar--collapsed .portfolio-menu-trigger,
.sidebar--collapsed .user-profile {
  justify-content: center;
  padding-left: 8px;
  padding-right: 8px;
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
  background: color-mix(in srgb, var(--p-text-color) 6%, transparent);
}

.portfolio-menu-item.is-active {
  background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
  color: var(--p-primary-color);
}

.portfolio-menu-item.is-danger {
  color: var(--p-red-500);
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

</style>
