<template>
  <header
    class="app-shell__topbar"
    :class="{ 'app-shell__topbar--header-nav': isHeaderNav }"
  >
    <div class="flex min-h-[1rem] items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">

      <!-- 窄屏: 顯示側邊攔按鈕 -->
      <div class="lg:hidden">
        <Button
          icon="pi pi-bars"
          :aria-label="t('openSidebar')"
          size="small"
          variant="outlined"
          severity="secondary"
          @click="$emit('open-sidebar')"
        />
      </div>

      <!-- header 導覽模式：沒有側邊欄，品牌與主導覽改放這裡（投資組合切換在 App.vue 頁面標題上方） -->
      <template v-if="isHeaderNav">
        <button type="button" class="topbar-brand" :title="t('dashboard')" @click="router.push('/dashboard')">
          <svg class="topbar-brand__logo" width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
            <rect x="6" y="6" width="52" height="52" rx="16" class="topbar-brand__box" />
            <rect x="18" y="34" width="7" height="14" rx="2" class="topbar-brand__bar" />
            <rect x="28.5" y="26" width="7" height="22" rx="2" class="topbar-brand__bar" />
            <rect x="39" y="18" width="7" height="30" rx="2" class="topbar-brand__bar topbar-brand__bar--accent" />
          </svg>
          <span class="topbar-brand__text hidden sm:inline">
            <span class="topbar-brand__stock">Stock</span><span class="topbar-brand__accent">Bar</span>
          </span>
        </button>

        <div class="topbar-divider hidden lg:block"></div>

        <HeaderNav class="hidden lg:flex" />

        <div class="flex-1" />

        <button
          :aria-label="t('searchPlaceholder')"
          class="flex h-10 w-10 items-center justify-center rounded-full text-[var(--p-text-muted-color)] transition-colors hover:bg-[var(--p-content-background)]"
          @click="$emit('open-search')"
        >
          <i class="pi pi-search text-sm"></i>
        </button>
      </template>

      <template v-else>
        <!-- 搜尋欄位 -->
        <button
          aria-label="Search"
          class="app-shell__search hidden md:flex"
          @click="$emit('open-search')"
        >
          <i class="pi pi-search text-xs"></i>
          <span class="truncate">{{ t('searchPlaceholder') }}</span>
          <span class="ml-auto inline-flex min-w-8 items-center justify-center rounded-md border border-[var(--p-content-border-color)] px-2 py-1 text-[11px] font-semibold text-[var(--p-text-muted-color)]">/</span>
        </button>

        <button
          aria-label="Search"
          class="flex h-10 w-10 items-center justify-center rounded-full text-[var(--p-text-muted-color)] transition-colors hover:bg-[var(--p-content-background)] md:hidden"
          @click="$emit('open-search')"
        >
          <i class="pi pi-search text-sm"></i>
        </button>

        <div class="flex-1" />
      </template>

      <div class="ml-auto flex items-center gap-2">
        <template v-if="showAddTradeButtonBar && !isDemoUser">
          <Button
            v-if="!hasPortfolios"
            size="small"
            :label="t('addPortfolio')"
            severity="contrast"
            class="hidden sm:inline-flex"
            @click="$emit('create-portfolio')"
          />
          <!-- icon="pi pi-plus" -->
          <!-- severity="contrast" -->
          <SplitButton
            v-else
            class="trade-actions-split hidden sm:inline-flex"
            size="small"
            :label="t('addInvestment')"
            severity="contrast"
            :model="tradeActionItems"
            appendTo="self"
            @click="$emit('open-transaction')"
          />
        </template>

        <Button
          v-else-if="isDemoUser"
          label="Get Started"
          icon="pi pi-arrow-right"
          iconPos="right"
          size="small"
          class="hidden sm:inline-flex"
          @click="$emit('login')"
        />

        <!-- header 導覽模式的使用者選單（側邊欄模式時在 Sidebar 底部） -->
        <template v-if="isHeaderNav">
          <button
            type="button"
            class="topbar-avatar hidden lg:inline-flex"
            :class="{ 'is-open': userMenuVisible }"
            :aria-label="t('openUserMenu')"
            :aria-expanded="userMenuVisible"
            @click="userMenu?.toggle($event)"
          >
            <img v-if="userPhotoUrl" :src="userPhotoUrl" :alt="userDisplayName" referrerpolicy="no-referrer" />
            <span v-else>{{ userInitial }}</span>
          </button>

          <TieredMenu
            ref="userMenu"
            :model="menuItems"
            :popup="true"
            @show="userMenuVisible = true"
            @hide="userMenuVisible = false"
          />
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import SplitButton from 'primevue/splitbutton'
import TieredMenu from 'primevue/tieredmenu'
import HeaderNav from './HeaderNav.vue'
import { useNavLayout } from '@/composables/useNavLayout.js'

const { t } = useI18n()
const router = useRouter()
const { isHeaderNav } = useNavLayout()

defineEmits(['open-sidebar', 'open-search', 'create-portfolio', 'open-transaction', 'login'])


const props = defineProps({
  currentPageLabel: {
    type: String,
    required: true,
  },
  showAddTradeButtonBar: {
    type: Boolean,
    required: true,
  },
  isDemoUser: {
    type: Boolean,
    required: true,
  },
  hasPortfolios: {
    type: Boolean,
    required: true,
  },
  tradeActionItems: {
    type: Array,
    required: true,
  },
  menuItems: {
    type: Array,
    default: () => [],
  },
  userDisplayName: {
    type: String,
    default: '',
  },
  userPhotoUrl: {
    type: String,
    default: '',
  },
})

const userMenu = ref()
const userMenuVisible = ref(false)

const userInitial = computed(() => (props.userDisplayName || '?').charAt(0).toUpperCase())
</script>

<style scoped>
.app-shell__topbar--header-nav > div {
  min-height: 3.75rem;
}

/* 品牌 */
.topbar-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.25rem 0.25rem 0;
  border: none;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}

.topbar-brand__logo {
  flex: 0 0 auto;
}

.topbar-brand__box {
  fill: var(--p-primary-color);
}

.topbar-brand__bar {
  fill: #ffffff;
}

.topbar-brand__bar--accent {
  fill: color-mix(in srgb, var(--p-primary-color) 30%, #ffffff);
}

.topbar-brand__text {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  white-space: nowrap;
}

.topbar-brand__stock {
  color: var(--p-text-color);
}

.topbar-brand__accent {
  color: var(--p-primary-color);
}

.topbar-divider {
  width: 1px;
  height: 1.5rem;
  background: var(--p-content-border-color);
  flex-shrink: 0;
}

/* 使用者頭像（display 由 hidden / lg:inline-flex 決定） */
.topbar-avatar {
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 2px solid transparent;
  border-radius: 50%;
  overflow: hidden;
  background: var(--p-primary-color);
  color: var(--p-primary-contrast-color);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.16s ease;
}

.topbar-avatar:hover,
.topbar-avatar.is-open {
  border-color: var(--p-primary-color);
}

.topbar-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
