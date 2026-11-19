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
            <button type="button" class="back-btn" :title="t('dashboard')" :tabindex="collapsed ? -1 : null" @click="goDashboard">
              <i v-if="!persistent" class="pi pi-arrow-left"></i>
              <img src="/stockbar-logo.svg" alt="" class="h-6" />
              <span class="sidebar-brand">
                <span class="sidebar-brand__stock">Stock</span><span class="sidebar-brand__bar">Bar</span>
              </span>
            </button>

            <button
              v-if="persistent"
              type="button"
              class="sidebar-collapse-btn"
              :aria-label="collapsed ? t('expandSidebar') : t('collapseSidebar')"
              v-tooltip.right="{ value: collapsed ? t('expandSidebar') : t('collapseSidebar'), showDelay: 500 }"
              @click="toggleCollapsed"
            >
              <!-- ponytail: 側欄面板圖示內嵌 SVG（lucide panel-left），線寬與 lucide-icons.css 一致 -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <path d="M9 3v18" />
              </svg>
            </button>
          </div>

          <!-- 投資組合切換已移到 AppHeader（由 App.vue teleport 進去） -->
          <Transition name="sidebar-fade">
            <div v-if="isDemoUser && !collapsed" class="sidebar-demo-notice">
              <i class="pi pi-info-circle"></i>
              <span>{{ $t('demoUserMessage') }}</span>
            </div>
          </Transition>

          <template v-for="(section, index) in sidebarSections" :key="section.key">
            <div class="menu-group">
              <!-- 標題一律佔位，收合時只淡出文字（第二段起改顯示分隔線），項目才不會上下跳動 -->
              <div class="menu-section-label" :class="{ 'menu-section-label--divider': index > 0 }">
                <span class="menu-section-label__text">{{ section.label }}</span>
              </div>
              <template v-for="item in section.items" :key="item.key">
                <RouterLink
                  :to="item.to"
                  class="menu-item"
                  :class="{ active: isNavItemActive(item) }"
                  v-tooltip.right="{ value: item.label, showDelay: 500, disabled: !collapsed }"
                  @click="closeDrawer"
                >
                  <span class="menu-item-left">
                    <i :class="[item.icon, 'menu-item-icon']" />
                    <span class="menu-item-label">{{ item.label }}</span>
                  </span>
                </RouterLink>
              </template>
            </div>
          </template>
        </div>

        <!-- 桌面固定側欄的使用者選單移到 AppHeader 右上角，這裡只給手機 Drawer 用 -->
        <div v-if="!persistent" class="sidebar-user">
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
  --sidebar-active-text: var(--sidebar-text);
  --sidebar-input-bg: var(--p-content-background);
  --sidebar-avatar-bg: color-mix(in srgb, var(--p-text-muted-color) 35%, transparent);
  --sidebar-hover-bg: color-mix(in srgb, var(--p-text-color) 8%, transparent);

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
}

/* 桌面版側欄是浮動圓角卡片：四周內縮 12px，右側與主內容留 12px 間距 */
.sidebar--persistent {
  inset: 12px auto 16px 12px;
  width: calc(var(--sidebar-width, 260px) - 24px);
  padding: 0 12px 12px;
  background-color: var(--p-content-background);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

/* 收合／展開時文字淡入淡出：收合先淡出、寬度再縮（見 .sidebar--collapsed 的 transition-delay），
   展開等寬度撐到一半再淡入，避免文字在窄欄裡被擠壓 */
.sidebar-fade-enter-active {
  transition: opacity 0.16s ease 0.1s;
}

.sidebar-fade-leave-active {
  transition: opacity 0.1s ease;
}

.sidebar-fade-enter-from,
.sidebar-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar-fade-enter-active,
  .sidebar-fade-leave-active,
  .sidebar .back-btn,
  .sidebar .menu-item-label,
  .sidebar .menu-section-label__text,
  .sidebar .menu-section-label--divider::before {
    transition: none;
  }
}

.menu-item-label {
  white-space: nowrap;
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

/* 頂列版面在收合／展開時不變：logo 只淡出，收合鈕固定在右側 3px（收合後 38px 寬的列裡剛好置中） */
.sidebar--persistent .sidebar-top-row {
  position: relative;
  padding-right: 36px;
}

.sidebar--persistent .sidebar-collapse-btn {
  position: absolute;
  top: 50%;
  right: 3px;
  transform: translateY(-50%);
}

.sidebar-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  min-height: 64px;
}

/* 收合時等文字淡出（0.1s）後才開始縮寬；展開則立刻變寬。
   左右內距不變，icon 才會固定在同一個位置 */
.sidebar--collapsed {
  transition-delay: 0.1s;
}

.sidebar-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
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
  transition: opacity 0.16s ease 0.1s, visibility 0s;
}

.sidebar--collapsed .back-btn {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.1s ease, visibility 0s linear 0.1s;
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
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.04em;
  white-space: nowrap;
}


.sidebar-brand__stock {
  color: color-mix(in srgb, var(--sidebar-text) 80%, transparent);
}

.sidebar-brand__bar {
  color: #ffb800; /* 與 logo 同色 */
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
  margin: 1px 0;
  padding: 8px 12px;
  border-radius: 12px;
  overflow: hidden;
  color: var(--sidebar-text);
  text-decoration: none;
  font-size: 13px;
  font-weight: 400;
  transition: background-color 0.16s ease;
}

.menu-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

/* icon 平時用次要色壓暗，hover 與目前頁才亮成主文字色（次要色對比仍 ≥ 3:1，收合時只剩 icon 也認得出） */
.menu-item i {
  width: 14px;
  font-size: 14px;
  color: var(--sidebar-text-muted);
  font-weight: inherit;
  text-align: center;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.menu-item:hover i,
.menu-item.active i {
  color: var(--sidebar-active-text);
}

.menu-item-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* 圓角矩形導覽：hover 疊 8% 前景色；目前所在頁填 12% 中性灰並略加粗，不帶主色 */
.menu-item:hover {
  background-color: var(--sidebar-hover-bg);
}

.menu-item.active {
  background-color: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  font-weight: 500;
}

.menu-section-label {
  position: relative;
  padding: 8px 12px 4px;
  font-size: 12px;
  font-weight: 400;
  color: var(--sidebar-text-muted);
  white-space: nowrap;
  overflow: hidden;
}

/* 收合時第二段起的標題位置畫一條分隔線 */
.menu-section-label--divider::before {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  top: 60%;
  height: 1px;
  background-color: var(--sidebar-border);
  opacity: 0;
  transition: opacity 0.1s ease;
}

.sidebar--collapsed .menu-section-label--divider::before {
  opacity: 1;
  transition: opacity 0.16s ease 0.1s;
}

/* 文字淡入淡出（時間同 sidebar-fade）：元素一直在、只改透明度，icon 與列高都不變 */
.menu-item-label,
.menu-section-label__text {
  transition: opacity 0.16s ease 0.1s;
}

.sidebar--collapsed .menu-item-label,
.sidebar--collapsed .menu-section-label__text {
  opacity: 0;
  transition: opacity 0.1s ease;
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
  font-weight: 500;
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
  font-size: 12px;
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
