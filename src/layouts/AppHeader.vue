<template>
  <header class="app-shell__topbar">
    <div class="flex min-h-[5rem] items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">

        <!-- 窄屏: 顯示側邊攔按鈕 -->
      <div class="lg:hidden">
        <Button
          icon="pi pi-bars"
          size="small"
          variant="outlined"
          severity="secondary"
          @click="$emit('open-sidebar')"
        />
      </div>


      <!-- 搜尋欄位 -->
      <div class="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
        <!-- <div class="min-w-0">
          <div class="truncate text-lg font-semibold sm:text-xl">{{ currentPageLabel }}</div>
        </div> -->

        <button
          aria-label="Search"
          class="app-shell__search hidden md:flex"
          @click="$emit('open-search')"
        >
          <i class="pi pi-search text-xs"></i>
          <span class="truncate">{{ t('searchPlaceholder') }}</span>
          <span class="ml-auto inline-flex min-w-8 items-center justify-center rounded-md border border-[var(--p-content-border-color)] px-2 py-1 text-[11px] font-semibold text-[var(--p-text-muted-color)]">/</span>
        </button>
      </div>

      <button
        aria-label="Search"
        class="flex h-10 w-10 items-center justify-center rounded-full text-[var(--p-text-muted-color)] transition-colors hover:bg-[var(--p-content-background)] md:hidden"
        @click="$emit('open-search')"
      >
        <i class="pi pi-search text-sm"></i>
      </button>

      <div class="ml-auto flex items-center gap-2">
        <template v-if="showAddTradeButtonBar && !isDemoUser">
          <Button
            v-if="!hasPortfolios"
            size="small"
            :label="t('addPortfolio')"
            icon="pi pi-plus"
            class="hidden sm:inline-flex"
            @click="$emit('create-portfolio')"
          />
          <!-- severity="contrast" -->
          <SplitButton
            v-else
            class="trade-actions-split hidden sm:inline-flex"
            size="small"
            :label="t('addInvestment')"
            icon="pi pi-plus"
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

        <Button
          :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
          aria-label="Toggle Dark Mode"
          size="small"
          text
          rounded
          severity="secondary"
          @click="$emit('toggle-theme')"
        />

        <TieredMenu ref="menu" :model="menuItems" :popup="true" class="user-tiered-menu">
          <template #start>
            <div v-if="!isDemoUser" class="user-info-item flex items-center p-4">
              <Avatar :image="userPhotoUrl" shape="circle" class="mr-3" />
              <div class="flex flex-col">
                <span class="font-medium">{{ displayUserName }}</span>
                <span class="text-sm text-gray-500">{{ userEmail }}</span>
              </div>
            </div>
          </template>

          <template #item="{ item, props }">
            <a v-ripple class="flex items-center w-full" v-bind="props.action">
              <span class="ml-2">{{ item.label }}</span>
              <span v-if="item.suffix && !item.items" class="ml-auto text-sm text-gray-500">{{ item.suffix }}</span>
              <span v-if="item.items" class="ml-auto flex items-center gap-1 text-sm text-gray-500">
                <span v-if="item.suffix">{{ item.suffix }}</span>
                <i class="pi pi-chevron-right text-xs"></i>
              </span>
              <i v-if="item.active" class="pi pi-check ml-auto text-xs"></i>
            </a>
          </template>
        </TieredMenu>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import SplitButton from 'primevue/splitbutton'
import TieredMenu from 'primevue/tieredmenu'

defineEmits(['open-sidebar', 'open-search', 'create-portfolio', 'open-transaction', 'login', 'toggle-theme'])

defineProps({
  currentPageLabel: {
    type: String,
    required: true,
  },
  isDark: {
    type: Boolean,
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
  displayUserName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    default: '',
  },
  userPhotoUrl: {
    type: String,
    default: '',
  },
  menuItems: {
    type: Array,
    required: true,
  },
  tradeActionItems: {
    type: Array,
    required: true,
  },
})

const { t } = useI18n()
const menu = ref()

const toggleMenu = (event) => menu.value?.toggle(event)

defineExpose({
  toggleMenu,
})
</script>