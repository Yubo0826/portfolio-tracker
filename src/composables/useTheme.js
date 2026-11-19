import { ref, computed, watchEffect } from 'vue'

/*
  外觀設定（放在 function 外層，整個 app 共用）
  - theme:       'light' | 'dark' | 'system'（system 跟隨系統偏好）
  - darkVariant: 'night' | 'standard' | 'dim'（深色的配色，色票見 src/assets/dark-variants.css）
  主題色固定為 logo 黃（customPreset.js），不再提供切換
*/
const THEME_KEY = 'theme'
const DARK_VARIANT_KEY = 'darkVariant'

// 舊的 'default'（近黑）已移除；localStorage 存著它的使用者會由 readStored 退回預設 'night'
export const DARK_VARIANTS = ['night', 'standard', 'dim']

const media = window.matchMedia('(prefers-color-scheme: dark)')
const systemDark = ref(media.matches)
media.addEventListener('change', (e) => { systemDark.value = e.matches })

const readStored = (key, allowed, fallback) => {
  const saved = localStorage.getItem(key)
  return allowed.includes(saved) ? saved : fallback
}

const theme = ref(readStored(THEME_KEY, ['light', 'dark', 'system'], 'system'))
const darkVariant = ref(readStored(DARK_VARIANT_KEY, DARK_VARIANTS, 'night'))
localStorage.removeItem('accentColor') // 主題色設定已移除，清掉舊值

const isDark = computed(() => theme.value === 'dark' || (theme.value === 'system' && systemDark.value))

watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDark.value)
  document.documentElement.dataset.darkVariant = darkVariant.value
})

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
    border: '#ffffff', // 圓餅切片間隔線，與卡片同色
    legend: '#374151',
  },
  night: {
    axis: '#8f8f8f',
    grid: '#363636',
    tooltipBg: '#2a2a2a',
    tooltipFg: '#e6e6e6',
    tooltipFgStrong: '#f2f2f2',
    border: '#1e1e1e',
    legend: '#e6e6e6',
  },
  dim: {
    axis: '#9aa0a6',
    grid: '#434b56',
    tooltipBg: '#282c32',
    tooltipFg: '#e8eaed',
    tooltipFgStrong: '#f1f4f9',
    border: '#353b43',
    legend: '#bdc1c6',
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

export function useTheme() {
  const setTheme = (value) => {
    theme.value = value
    localStorage.setItem(THEME_KEY, value)
  }

  const setDarkVariant = (value) => {
    if (!DARK_VARIANTS.includes(value)) return
    darkVariant.value = value
    localStorage.setItem(DARK_VARIANT_KEY, value)
  }

  return {
    theme,
    isDark,
    darkVariant,
    chartPalette,
    setTheme,
    setDarkVariant,
  }
}
