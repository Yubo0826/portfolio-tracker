import { ref, computed, watchEffect } from 'vue'
import { updatePrimaryPalette } from '@primeuix/themes'
import customPreset from '@/themes/customPreset.js'

/*
  外觀設定（放在 function 外層，整個 app 共用）
  - theme:       'light' | 'dark' | 'system'（system 跟隨系統偏好）
  - darkVariant: 'default' | 'dim' | 'standard'（深色的配色，色票見 src/assets/dark-variants.css）
  - accentColor: 主題強調色，對應 Tailwind 色盤名稱
*/
const THEME_KEY = 'theme'
const DARK_VARIANT_KEY = 'darkVariant'
const ACCENT_KEY = 'accentColor'

export const DARK_VARIANTS = ['default', 'dim', 'standard']

// 可選的強調色（key 對應 i18n，palette 對應 PrimeVue/Tailwind 色盤，swatch 為預覽色）
// palette 為 null 代表「跟隨 customPreset 的 primary 定義」，不做執行期覆寫
export const ACCENT_OPTIONS = [
  { key: 'blue', palette: null, swatch: '#3b82f6' },
  { key: 'indigo', palette: 'indigo', swatch: '#6366f1' },
  { key: 'emerald', palette: 'emerald', swatch: '#10b981' },
  { key: 'rose', palette: 'rose', swatch: '#f43f5e' },
  { key: 'stone', palette: 'stone', swatch: '#78716c' },
  { key: 'slate', palette: 'slate', swatch: '#64748b' },
]

const media = window.matchMedia('(prefers-color-scheme: dark)')
const systemDark = ref(media.matches)
media.addEventListener('change', (e) => { systemDark.value = e.matches })

const readStored = (key, allowed, fallback) => {
  const saved = localStorage.getItem(key)
  return allowed.includes(saved) ? saved : fallback
}

const theme = ref(readStored(THEME_KEY, ['light', 'dark', 'system'], 'system'))
const darkVariant = ref(readStored(DARK_VARIANT_KEY, DARK_VARIANTS, 'default'))
const accentColor = ref(readStored(ACCENT_KEY, ACCENT_OPTIONS.map((o) => o.key), 'blue'))

const isDark = computed(() => theme.value === 'dark' || (theme.value === 'system' && systemDark.value))

watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDark.value)
  document.documentElement.dataset.darkVariant = darkVariant.value
})

const buildRamp = (palette) =>
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].reduce((ramp, shade) => {
    ramp[shade] = `{${palette}.${shade}}`
    return ramp
  }, {})

// 記錄是否曾覆寫過 primary，切回預設時才需要還原，避免初次載入多注入一份 CSS 造成閃色
let accentOverridden = false

const applyAccent = () => {
  const option = ACCENT_OPTIONS.find((o) => o.key === accentColor.value) || ACCENT_OPTIONS[0]

  if (!option.palette) {
    if (accentOverridden) {
      updatePrimaryPalette(customPreset.semantic.primary)
      accentOverridden = false
    }
    return
  }

  updatePrimaryPalette(buildRamp(option.palette))
  accentOverridden = true
}

/*
  圖表配色。Highcharts 吃的是字串不是 CSS 變數，所以色票得留在 JS 這側，
  統一收在這裡供各圖表共用，色值與 dark-variants.css 的三種深色風格對應。
    tooltipFgStrong 深色底的 tooltip（Dashboard 圓環）用的高對比文字
    border          圓環/樹狀圖切片之間的分隔線，需與卡片底色同色
*/
const CHART_PALETTES = {
  light: {
    axis: '#999',
    grid: '#eee',
    tooltipBg: '#ffffff',
    tooltipFg: '#374151',
    tooltipFgStrong: '#0f172a',
    border: '#ffffff',
    legend: '#374151',
  },
  default: {
    axis: '#9ca3af',
    grid: '#374151',
    tooltipBg: '#1f2937',
    tooltipFg: '#f3f4f6',
    tooltipFgStrong: '#f8fafc',
    border: '#1d1e1e',
    legend: '#d1d5db',
  },
  dim: {
    axis: '#768390',
    grid: '#373e47',
    tooltipBg: '#22272e',
    tooltipFg: '#cdd9e5',
    tooltipFgStrong: '#cdd9e5',
    border: '#2d333b',
    legend: '#adbac7',
  },
  standard: {
    axis: '#8b949e',
    grid: '#30363d',
    tooltipBg: '#0d1117',
    tooltipFg: '#f0f6fc',
    tooltipFgStrong: '#f0f6fc',
    border: '#161b22',
    legend: '#e6edf3',
  },
}

export const chartPalette = computed(() =>
  isDark.value ? CHART_PALETTES[darkVariant.value] : CHART_PALETTES.light
)

// updatePrimaryPalette 要等 PrimeVue 安裝後才能呼叫，所以延到第一次 useTheme()（元件 setup 期間）才套用
let accentInitialized = false

export function useTheme() {
  if (!accentInitialized) {
    accentInitialized = true
    applyAccent()
  }

  const setTheme = (value) => {
    theme.value = value
    localStorage.setItem(THEME_KEY, value)
  }

  const setDarkVariant = (value) => {
    if (!DARK_VARIANTS.includes(value)) return
    darkVariant.value = value
    localStorage.setItem(DARK_VARIANT_KEY, value)
  }

  const setAccentColor = (key) => {
    accentColor.value = key
    localStorage.setItem(ACCENT_KEY, key)
    applyAccent()
  }

  return {
    theme,
    isDark,
    darkVariant,
    accentColor,
    chartPalette,
    setTheme,
    setDarkVariant,
    setAccentColor,
  }
}
