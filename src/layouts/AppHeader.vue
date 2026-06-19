<template>
  <header class="app-shell__topbar">
    <div class="flex min-h-[1rem] items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">

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
      <!-- <div class="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
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
      </button> -->

      <div class="flex-1" />

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
          :label="`${currentLanguageShort} · ${displayCurrency}`"
          icon="pi pi-language"
          :aria-label="t('language')"
          size="small"
          text
          rounded
          severity="secondary"
          class="hidden sm:inline-flex"
          @click="toggleLangCurrencyMenu"
        />
        <Button
          icon="pi pi-language"
          :aria-label="t('language')"
          size="small"
          text
          rounded
          severity="secondary"
          class="sm:hidden"
          @click="toggleLangCurrencyMenu"
        />
        <Menu
          ref="langCurrencyMenu"
          :popup="true"
          class="lang-currency-menu language-menu"
        >
          <template #start>
            <div class="p-2">
              <div class="menu-panel-title text-xs font-semibold uppercase tracking-wide px-1 pb-2">{{ t('language') }}</div>
              <div class="flex flex-col gap-1.5 mb-3">
                <button
                  v-for="option in languageOptions"
                  :key="option.value"
                  type="button"
                  class="menu-panel-item w-full px-3 py-2 text-sm text-left"
                  :class="{ 'is-active': locale === option.value }"
                  @click="selectLanguage(option.value)"
                >
                  {{ option.flag }} {{ option.label }}
                </button>
              </div>
              <div class="menu-panel-title text-xs font-semibold uppercase tracking-wide px-1 pb-2">{{ t('currency.label') }}</div>
              <div class="flex flex-col gap-1.5">
                <button
                  v-for="currency in currencyOptions"
                  :key="currency"
                  type="button"
                  class="menu-panel-item w-full px-3 py-2 text-sm text-left"
                  :class="{ 'is-active': displayCurrency === currency }"
                  @click="setCurrency(currency)"
                >
                  {{ currency }}
                </button>
              </div>
            </div>
          </template>
        </Menu>

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
import Menu from 'primevue/menu'
import { useSettingsStore } from '@/stores/settings'

const { locale, t } = useI18n()
const settingsStore = useSettingsStore()
const { displayCurrency } = storeToRefs(settingsStore)

const langCurrencyMenu = ref()
const currencyOptions = ['USD', 'TWD']

const languageOptions = [
  { label: 'English', value: 'en', flag: '🇺🇸' },
  { label: '繁體中文', value: 'zh-TW', flag: '🇹🇼' },
]

const currentLanguageShort = computed(() => {
  if (locale.value === 'zh-TW') return '中文'
  return 'EN'
})

const toggleLangCurrencyMenu = (event) => {
  langCurrencyMenu.value?.toggle(event)
}

const selectLanguage = (value) => {
  locale.value = value
  localStorage.setItem('locale', value)
  langCurrencyMenu.value?.hide()
}

const setCurrency = (value) => {
  settingsStore.setDisplayCurrency(value)
  langCurrencyMenu.value?.hide()
}

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
  tradeActionItems: {
    type: Array,
    required: true,
  },
})
</script>
