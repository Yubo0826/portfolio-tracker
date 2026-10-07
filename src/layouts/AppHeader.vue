<template>
  <header class="app-shell__topbar">
    <div class="flex min-h-[1rem] items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">

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
          icon="pi pi-language"
          :aria-label="t('language')"
          aria-haspopup="true"
          aria-controls="language-menu"
          size="small"
          text
          rounded
          severity="secondary"
          @click="languageMenu.toggle($event)"
        />
        <Menu id="language-menu" ref="languageMenu" :model="languageItems" popup />

        <Button
          icon="pi pi-dollar"
          :aria-label="t('currency.label')"
          aria-haspopup="true"
          aria-controls="currency-menu"
          size="small"
          text
          rounded
          severity="secondary"
          @click="currencyMenu.toggle($event)"
        />
        <Menu id="currency-menu" ref="currencyMenu" :model="currencyItems" popup />

        <Button
          :icon="isDark ? 'pi pi-moon' : 'pi pi-sun'"
          :aria-label="t('appearance')"
          aria-haspopup="true"
          aria-controls="theme-menu"
          size="small"
          text
          rounded
          severity="secondary"
          @click="themeMenu.toggle($event)"
        />
        <Menu id="theme-menu" ref="themeMenu" :model="themeItems" popup>
          <template #item="{ item, props }">
            <a v-bind="props.action" class="flex items-center gap-2">
              <i :class="item.icon" />
              <span>{{ item.label }}</span>
              <i v-if="item.selected" class="pi pi-check ml-auto pl-3 text-xs" />
            </a>
          </template>
        </Menu>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import SplitButton from 'primevue/splitbutton'
import { useSettingsStore } from '@/stores/settings'
import { useTheme } from '@/composables/useTheme'

const { locale, t } = useI18n()
const settingsStore = useSettingsStore()
const { displayCurrency } = storeToRefs(settingsStore)

const languageMenu = ref()
const languages = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en', label: 'English' },
]

const setLanguage = (code) => {
  locale.value = code
  localStorage.setItem('locale', code)
}

const languageItems = computed(() => languages.map(({ code, label }) => ({
  label,
  icon: locale.value === code ? 'pi pi-check' : 'pi pi-fw',
  command: () => setLanguage(code),
})))

const currencyMenu = ref()
const currencyItems = computed(() => [
  { code: 'USD', label: 'USD ($)' },
  { code: 'TWD', label: 'TWD (NT$)' },
].map(({ code, label }) => ({
  label,
  icon: displayCurrency.value === code ? 'pi pi-check' : 'pi pi-fw',
  command: () => settingsStore.setDisplayCurrency(code),
})))

const { theme, isDark, setTheme } = useTheme()
const themeMenu = ref()
const themeItems = computed(() => [
  { code: 'light', label: t('lightMode'), icon: 'pi pi-sun' },
  { code: 'dark', label: t('darkMode'), icon: 'pi pi-moon' },
  { code: 'system', label: t('systemMode'), icon: 'pi pi-desktop' },
].map(({ code, label, icon }) => ({
  label,
  icon,
  selected: theme.value === code,
  command: () => setTheme(code),
})))

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
