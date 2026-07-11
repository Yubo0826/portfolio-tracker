<template>
  <header class="app-shell__topbar">
    <div class="flex min-h-[1rem] items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">

      <!-- 搜尋欄位 -->
      <button
        ref="desktopSearchTriggerRef"
        aria-label="Search"
        class="app-shell__search hidden md:flex"
        @click="$emit('open-search')"
      >
        <i class="pi pi-search text-xs"></i>
        <span class="truncate">{{ t('searchPlaceholder') }}</span>
        <span class="ml-auto inline-flex min-w-8 items-center justify-center rounded-md border border-[var(--p-content-border-color)] px-2 py-1 text-[11px] font-semibold text-[var(--p-text-muted-color)]">/</span>
      </button>

      <button
        ref="mobileSearchTriggerRef"
        aria-label="Search"
        class="flex h-10 w-10 items-center justify-center rounded-full text-[var(--p-text-muted-color)] transition-colors hover:bg-[var(--p-content-background)] md:hidden"
        @click="$emit('open-search')"
      >
        <i class="pi pi-search text-sm"></i>
      </button>

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

        <Button
          :label="languageToggleLabel"
          :aria-label="t('language')"
          size="small"
          text
          rounded
          severity="secondary"
          @click="toggleLanguage"
        />

        <Button
          :label="displayCurrency"
          :aria-label="t('currency.label')"
          size="small"
          text
          rounded
          severity="secondary"
          @click="toggleCurrency"
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
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import SplitButton from 'primevue/splitbutton'
import { useSettingsStore } from '@/stores/settings'

const { locale, t } = useI18n()
const settingsStore = useSettingsStore()
const { displayCurrency } = storeToRefs(settingsStore)

const languageToggleLabel = computed(() => {
  return locale.value === 'zh-TW' ? 'EN' : '中文'
})

const toggleLanguage = () => {
  const nextLocale = locale.value === 'zh-TW' ? 'en' : 'zh-TW'
  locale.value = nextLocale
  localStorage.setItem('locale', nextLocale)
}

const toggleCurrency = () => {
  const nextCurrency = displayCurrency.value === 'USD' ? 'TWD' : 'USD'
  settingsStore.setDisplayCurrency(nextCurrency)
}

defineEmits(['open-sidebar', 'open-search', 'create-portfolio', 'open-transaction', 'login', 'toggle-theme'])

const desktopSearchTriggerRef = ref(null)
const mobileSearchTriggerRef = ref(null)

defineExpose({
  desktopSearchTriggerRef,
  mobileSearchTriggerRef,
})

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
  tradeActionItems: {
    type: Array,
    required: true,
  },
})
</script>
