import { useI18n } from 'vue-i18n'

/*
  介面語言（整個 app 共用）
  - 實際狀態由 vue-i18n 的 locale 持有，這裡只負責「選項清單 + 寫入 localStorage」，
    避免 App.vue 的使用者選單 / PreferencesView 各自複製一份切換邏輯。
  - main.js 開機時會用同一個 STORAGE_KEY 還原語言。
*/
export const LOCALE_STORAGE_KEY = 'locale'
export const DEFAULT_LOCALE = 'zh'

export const LOCALE_OPTIONS = [
  { value: 'zh', label: '繁體中文', badge: '繁' },
  { value: 'en', label: 'English', badge: 'EN' },
]

export const readStoredLocale = () => {
  // 舊版 header 曾存 'zh-TW'，但 i18n messages 只有 'zh'
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY)?.replace('zh-TW', 'zh')
  return LOCALE_OPTIONS.some((option) => option.value === saved) ? saved : DEFAULT_LOCALE
}

export function useLocale() {
  const { locale } = useI18n()

  const setLocale = (value) => {
    if (!LOCALE_OPTIONS.some((option) => option.value === value)) return
    if (locale.value === value) return
    locale.value = value
    localStorage.setItem(LOCALE_STORAGE_KEY, value)
  }

  return { locale, localeOptions: LOCALE_OPTIONS, setLocale }
}
