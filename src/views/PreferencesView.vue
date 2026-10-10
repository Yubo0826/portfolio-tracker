<template>
  <div class="preferences">
    <!-- 頁面標題由 App.vue 統一渲染，這裡只放說明 -->
    <p class="preferences__intro">{{ t('preferences.intro') }}</p>

    <!-- 1. Color mode -->
    <section class="pref-section">
      <div class="pref-section__head">
        <h2 class="pref-section__title">{{ t('preferences.colorMode.label') }}</h2>
        <p class="pref-section__desc">{{ t('preferences.colorMode.desc') }}</p>
      </div>
      <SelectButton
        :modelValue="theme"
        :options="colorModeOptions"
        optionLabel="label"
        optionValue="value"
        :allowEmpty="false"
        @update:modelValue="onColorModeChange"
      >
        <template #option="{ option }">
          <i :class="option.icon" aria-hidden="true"></i>
          <span>{{ option.label }}</span>
        </template>
      </SelectButton>
    </section>

    <div class="pref-divider"></div>

    <!-- 2. Dark style（深色配色，任何進入深色的情況都適用，含跟隨系統） -->
    <section class="pref-section">
      <div class="pref-section__head">
        <h2 class="pref-section__title">{{ t('preferences.darkStyle.label') }}</h2>
        <p class="pref-section__desc">{{ t('preferences.darkStyle.desc') }}</p>
      </div>

      <div class="layout-grid">
        <button
          v-for="option in darkStyleOptions"
          :key="option.value"
          type="button"
          class="layout-card"
          :class="{ 'is-selected': darkVariant === option.value }"
          @click="setDarkVariant(option.value)"
        >
          <span class="layout-card__preview">
            <span class="layout-card__window dark-card__window" :style="option.swatch">
              <span class="layout-card__nav dark-card__nav">
                <span class="layout-card__dot dark-card__dot"></span>
                <span class="layout-card__line dark-card__line"></span>
                <span class="layout-card__line layout-card__line--short dark-card__line"></span>
              </span>
              <span class="layout-card__body dark-card__body"></span>
            </span>
          </span>
          <span class="layout-card__label">
            <span class="layout-card__radio" :class="{ 'is-checked': darkVariant === option.value }"></span>
            <span>
              <span class="layout-card__name">{{ option.label }}</span>
              <span class="layout-card__hint">{{ option.hint }}</span>
            </span>
          </span>
        </button>
      </div>
    </section>

    <div class="pref-divider"></div>

    <!-- 3. Theme (accent color) -->
    <section class="pref-section">
      <div class="pref-section__head">
        <h2 class="pref-section__title">{{ t('preferences.theme.label') }}</h2>
        <p class="pref-section__desc">{{ t('preferences.theme.desc') }}</p>
      </div>

      <div class="accent-grid">
        <button
          v-for="option in accentOptions"
          :key="option.key"
          type="button"
          class="accent-card"
          :class="{ 'is-selected': accentColor === option.key }"
          :style="{ '--accent': option.swatch }"
          @click="setAccentColor(option.key)"
        >
          <span class="accent-card__preview">
            <span class="accent-card__window">
              <span class="accent-card__sidebar">
                <span class="accent-card__dot"></span>
                <span class="accent-card__line"></span>
                <span class="accent-card__line accent-card__line--short"></span>
              </span>
              <span class="accent-card__body"></span>
            </span>
          </span>
          <span class="accent-card__label">
            <span class="accent-card__radio" :class="{ 'is-checked': accentColor === option.key }"></span>
            {{ t(`preferences.accent.${option.key}`) }}
          </span>
        </button>
      </div>
    </section>

    <div class="pref-divider"></div>

    <!-- 4. Navigation layout -->
    <section class="pref-section">
      <div class="pref-section__head">
        <h2 class="pref-section__title">{{ t('preferences.navLayout.label') }}</h2>
        <p class="pref-section__desc">{{ t('preferences.navLayout.desc') }}</p>
      </div>

      <div class="layout-grid">
        <button
          v-for="option in navLayoutOptions"
          :key="option.value"
          type="button"
          class="layout-card"
          :class="{ 'is-selected': navLayout === option.value }"
          @click="setNavLayout(option.value)"
        >
          <span class="layout-card__preview">
            <span class="layout-card__window" :class="`layout-card__window--${option.value}`">
              <span class="layout-card__nav">
                <span class="layout-card__dot"></span>
                <span class="layout-card__line"></span>
                <span class="layout-card__line layout-card__line--short"></span>
              </span>
              <span class="layout-card__body"></span>
            </span>
          </span>
          <span class="layout-card__label">
            <span class="layout-card__radio" :class="{ 'is-checked': navLayout === option.value }"></span>
            <span>
              <span class="layout-card__name">{{ option.label }}</span>
              <span class="layout-card__hint">{{ option.hint }}</span>
            </span>
          </span>
        </button>
      </div>
    </section>

    <div class="pref-divider"></div>

    <!-- 5. Language -->
    <section class="pref-section">
      <div class="pref-section__head">
        <h2 class="pref-section__title">{{ t('preferences.language.label') }}</h2>
        <p class="pref-section__desc">{{ t('preferences.language.desc') }}</p>
      </div>
      <SelectButton
        :modelValue="locale"
        :options="languageOptions"
        optionLabel="label"
        optionValue="value"
        :allowEmpty="false"
        @update:modelValue="onLanguageChange"
      />
    </section>

    <div class="pref-divider"></div>

    <!-- 6. Currency -->
    <section class="pref-section">
      <div class="pref-section__head">
        <h2 class="pref-section__title">{{ t('preferences.currency.label') }}</h2>
        <p class="pref-section__desc">{{ t('preferences.currency.desc') }}</p>
      </div>
      <SelectButton
        :modelValue="displayCurrency"
        :options="currencyOptions"
        optionLabel="label"
        optionValue="value"
        :allowEmpty="false"
        @update:modelValue="onCurrencyChange"
      />
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import SelectButton from 'primevue/selectbutton'
import { useTheme, ACCENT_OPTIONS } from '@/composables/useTheme.js'
import { useNavLayout, buildNavLayoutOptions } from '@/composables/useNavLayout.js'
import { useLocale } from '@/composables/useLocale.js'
import { useSettingsStore, CURRENCY_OPTIONS } from '@/stores/settings'

const { t } = useI18n()
const { theme, darkVariant, accentColor, setTheme, setDarkVariant, setAccentColor } = useTheme()
const { navLayout, setNavLayout } = useNavLayout()
const { locale, localeOptions, setLocale } = useLocale()

const settingsStore = useSettingsStore()
const { displayCurrency } = storeToRefs(settingsStore)

const accentOptions = ACCENT_OPTIONS

const colorModeOptions = computed(() => [
  { label: t('preferences.colorMode.light'), value: 'light', icon: 'pi pi-sun' },
  { label: t('preferences.colorMode.dark'), value: 'dark', icon: 'pi pi-moon' },
  { label: t('preferences.colorMode.system'), value: 'system', icon: 'pi pi-desktop' },
])

/*
  深色風格預覽卡。色票寫死是刻意的：卡片要在淺色模式下也能呈現該風格長什麼樣，
  不能引用 PrimeVue 的 --p-* （會隨目前模式變動）。與 dark-variants.css / customPreset.js 對應。
*/
const darkStyleOptions = computed(() => [
  {
    value: 'default',
    label: t('preferences.darkStyle.default'),
    hint: t('preferences.darkStyle.defaultHint'),
    swatch: {
      '--dv-canvas': '#0d0d0d',
      '--dv-card': '#1d1e1e',
      '--dv-border': '#444454',
      '--dv-text': '#dedede',
    },
  },
  {
    value: 'dim',
    label: t('preferences.darkStyle.dim'),
    hint: t('preferences.darkStyle.dimHint'),
    swatch: {
      '--dv-canvas': '#22272e',
      '--dv-card': '#2d333b',
      '--dv-border': '#373e47',
      '--dv-text': '#adbac7',
    },
  },
  {
    value: 'standard',
    label: t('preferences.darkStyle.standard'),
    hint: t('preferences.darkStyle.standardHint'),
    swatch: {
      '--dv-canvas': '#0d1117',
      '--dv-card': '#161b22',
      '--dv-border': '#30363d',
      '--dv-text': '#e6edf3',
    },
  },
])

const navLayoutOptions = computed(() => buildNavLayoutOptions(t))

const languageOptions = localeOptions

const currencyOptions = CURRENCY_OPTIONS.map((option) => ({ label: option.code, value: option.value }))

const onColorModeChange = (value) => {
  if (value) setTheme(value)
}

const onLanguageChange = (value) => {
  if (value) setLocale(value)
}

const onCurrencyChange = (value) => {
  if (value) settingsStore.setDisplayCurrency(value)
}
</script>

<style scoped>
.preferences {
  max-width: 62rem;
}

.preferences__intro {
  margin-bottom: 2rem;
  font-size: 0.9rem;
  color: var(--p-text-muted-color);
}

.pref-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.pref-section__title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--p-text-color);
}

.pref-section__desc {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
}

.pref-divider {
  height: 1px;
  background: var(--p-content-border-color);
  margin: 1.5rem 0;
}

/* Accent color cards */
.accent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: 1rem;
}

.accent-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
}

.accent-card__preview {
  display: block;
  padding: 0.4rem;
  border-radius: 0.75rem;
  border: 2px solid var(--p-content-border-color);
  background: var(--p-surface-card);
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.accent-card:hover .accent-card__preview {
  border-color: color-mix(in srgb, var(--accent) 50%, var(--p-content-border-color));
}

.accent-card.is-selected .accent-card__preview {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
}

.accent-card__window {
  display: flex;
  height: 4.5rem;
  border-radius: 0.5rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--accent) 14%, var(--p-surface-background));
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
}

.accent-card__sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 34%;
  padding: 0.5rem;
  background: color-mix(in srgb, var(--accent) 22%, var(--p-surface-background));
}

.accent-card__dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: var(--accent);
}

.accent-card__line {
  height: 0.35rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 45%, transparent);
}

.accent-card__line--short {
  width: 65%;
}

.accent-card__body {
  flex: 1;
  margin: 0.5rem;
  border-radius: 0.35rem;
  background: color-mix(in srgb, var(--p-surface-background) 82%, var(--accent));
}

.accent-card__label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--p-text-color);
}

.accent-card__radio {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 2px solid var(--p-text-muted-color);
  flex-shrink: 0;
  transition: border-color 0.16s ease;
}

.accent-card__radio.is-checked {
  border-color: var(--accent);
  background:
    radial-gradient(circle, var(--accent) 0 45%, transparent 46%);
}

/* Navigation layout cards */
.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
  gap: 1rem;
  max-width: 44rem;
}

.layout-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
}

.layout-card__preview {
  display: block;
  padding: 0.4rem;
  border-radius: 0.75rem;
  border: 2px solid var(--p-content-border-color);
  background: var(--p-surface-card);
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.layout-card:hover .layout-card__preview {
  border-color: color-mix(in srgb, var(--p-primary-color) 50%, var(--p-content-border-color));
}

.layout-card.is-selected .layout-card__preview {
  border-color: var(--p-primary-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--p-primary-color) 22%, transparent);
}

.layout-card__window {
  display: flex;
  height: 5.5rem;
  border-radius: 0.5rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--p-primary-color) 14%, var(--p-surface-background));
  border: 1px solid color-mix(in srgb, var(--p-primary-color) 30%, transparent);
}

.layout-card__window--header {
  flex-direction: column;
}

.layout-card__nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 34%;
  padding: 0.5rem;
  background: color-mix(in srgb, var(--p-primary-color) 22%, var(--p-surface-background));
}

.layout-card__window--header .layout-card__nav {
  flex-direction: row;
  align-items: center;
  width: 100%;
  padding: 0.45rem 0.5rem;
}

.layout-card__dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: var(--p-primary-color);
  flex-shrink: 0;
}

.layout-card__line {
  height: 0.35rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--p-primary-color) 45%, transparent);
}

.layout-card__window--header .layout-card__line {
  width: 2.25rem;
  flex-shrink: 0;
}

.layout-card__line--short {
  width: 65%;
}

.layout-card__window--header .layout-card__line--short {
  width: 1.5rem;
}

.layout-card__body {
  flex: 1;
  margin: 0.5rem;
  border-radius: 0.35rem;
  background: color-mix(in srgb, var(--p-surface-background) 82%, var(--p-primary-color));
}

.layout-card__label {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--p-text-color);
}

.layout-card__name {
  display: block;
  font-weight: 500;
}

.layout-card__hint {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
}

.layout-card__radio {
  width: 1rem;
  height: 1rem;
  margin-top: 0.1rem;
  border-radius: 50%;
  border: 2px solid var(--p-text-muted-color);
  flex-shrink: 0;
  transition: border-color 0.16s ease;
}

.layout-card__radio.is-checked {
  border-color: var(--p-primary-color);
  background:
    radial-gradient(circle, var(--p-primary-color) 0 45%, transparent 46%);
}

/* Dark style cards — 覆寫版型卡的 primary tint，改用該深色風格的真實色票 */
.dark-card__window {
  background: var(--dv-canvas);
  border-color: var(--dv-border);
}

.dark-card__nav {
  background: var(--dv-card);
}

.dark-card__dot {
  background: var(--dv-text);
}

.dark-card__line {
  background: color-mix(in srgb, var(--dv-text) 45%, transparent);
}

.dark-card__body {
  background: var(--dv-card);
  border: 1px solid var(--dv-border);
}
</style>
