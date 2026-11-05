<template>
  <!-- 桌面版：固定側欄；手機版：Drawer。內容共用同一份模板 -->
  <component :is="persistent ? 'div' : Drawer" v-bind="wrapperProps">
    <template #[wrapperSlot]>
      <aside
        class="sidebar"
        :class="persistent ? ['sidebar--persistent', { 'sidebar--collapsed': collapsed }] : 'sidebar--drawer'"
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

          <!-- 投資組合切換已移到 AppHeader（由 App.vue teleport 進去） -->
          <div v-if="isDemoUser && !collapsed" class="sidebar-demo-notice">
            <i class="pi pi-info-circle"></i>
            <span>{{ $t('demoUserMessage') }}</span>
          </div>

          <template v-for="(section, index) in sidebarSections" :key="section.key">
            <!-- 收合時標題放不下，改用分隔線區分區段 -->
            <div v-if="collapsed && index > 0" class="menu-divider"></div>

            <div class="menu-group">
              <div v-if="!collapsed" class="menu-section-label">{{ section.label }}</div>
              <template v-for="item in section.items" :key="item.key">
                <RouterLink
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
                <img :src="userPhotoUrl" :alt="userDisplayName" referrerpolicy="no-referrer" />
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
            @show="userMenuVisible = true"
            @hide="userMenuVisible = false"
          />
        </div>
      </aside>
    </template>
  </component>
</template>

<script setup>
import { computed, ref } from 'vue'
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

.dark .sidebar {
  --sidebar-bg: var(--p-content-background);
  --sidebar-active-bg: #3a3a3a;
}

/* 不用 Tailwind 的 hidden lg:flex：v4 utilities 在 @layer 裡，會被上面的 display: flex 蓋掉 */
@media (max-width: 1023px) {
  .sidebar--persistent {
    display: none;
  }
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

/* p-menu-submenu-label 的樣式屬於 PrimeVue Menu，沒有載入 Menu 時要自己補（App.vue 的投資組合選單用） */
.p-tieredmenu .p-menu-submenu-label {
  padding: var(--p-tieredmenu-item-padding);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--p-text-muted-color);
}

.portfolio-menu-list {
  display: flex;
  flex-direction: column;
  gap: var(--p-tieredmenu-list-gap);
  max-height: 240px;
  overflow-y: auto;
  margin: 0;
  padding: var(--p-tieredmenu-list-padding);
  list-style: none;
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
  margin: 3px 0;
  padding: 8px 12px;
  border-radius: 6px;
  color: var(--sidebar-text);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.16s ease;
}

.menu-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

/* icon 跟著同列文字的顏色與字重 */
.menu-item i {
  width: 16px;
  color: inherit;
  font-weight: inherit;
  text-align: center;
  flex-shrink: 0;
}

.menu-item-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.menu-group .menu-item:hover,
.menu-group .menu-item.active {
  color: var(--sidebar-text);
}

.menu-item:hover,
.menu-item.active {
  background-color: var(--sidebar-active-bg);
  color: var(--sidebar-active-text, var(--sidebar-text));
}

.menu-section-label {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--sidebar-text-muted);
}

.menu-divider {
  height: 1px;
  background-color: var(--sidebar-border);
  margin: 12px 0;
}

.sidebar--collapsed .menu-item,
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

.p-menu-item.menu-item-danger .p-menu-item-label,
.p-menu-item.menu-item-danger .p-menu-item-icon,
.p-tieredmenu-item.menu-item-danger .p-tieredmenu-item-label,
.p-tieredmenu-item.menu-item-danger .p-tieredmenu-item-icon {
  color: var(--p-red-500);
}
</style>
