<template>
  <header class="app-shell__topbar">
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
      </div>
    </div>
  </header>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import SplitButton from 'primevue/splitbutton'

const { t } = useI18n()

defineEmits(['open-sidebar', 'open-search', 'create-portfolio', 'open-transaction', 'login'])


defineProps({
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
})
</script>
