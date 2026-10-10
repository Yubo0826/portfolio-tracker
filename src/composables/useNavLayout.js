import { computed, ref } from 'vue'

/*
  導覽版面（整個 app 共用，放在 function 外層）
  - 'sidebar': 主導覽放在左側固定側邊欄
  - 'header' : 主導覽放在頂部標題列
  切換後會寫入 localStorage，並在 <html> 標上 data-nav-layout 供 CSS 調整版面。
*/
const STORAGE_KEY = 'navLayout'
const LAYOUTS = ['sidebar', 'header']
const DEFAULT_LAYOUT = 'sidebar'

const readStoredLayout = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  return LAYOUTS.includes(saved) ? saved : DEFAULT_LAYOUT
}

const navLayout = ref(readStoredLayout())

const applyLayoutAttr = () => {
  document.documentElement.dataset.navLayout = navLayout.value
}

applyLayoutAttr()

const isHeaderNav = computed(() => navLayout.value === 'header')

function setNavLayout(layout) {
  if (!LAYOUTS.includes(layout) || layout === navLayout.value) return
  navLayout.value = layout
  localStorage.setItem(STORAGE_KEY, layout)
  applyLayoutAttr()
}

function toggleNavLayout() {
  setNavLayout(navLayout.value === 'sidebar' ? 'header' : 'sidebar')
}

/*
  導覽版面選項（需要 t 才能翻譯，所以做成 builder；供偏好設定頁使用）
*/
export function buildNavLayoutOptions(t) {
  return [
    {
      value: 'sidebar',
      label: t('preferences.navLayout.sidebar'),
      hint: t('preferences.navLayout.sidebarDesc'),
    },
    {
      value: 'header',
      label: t('preferences.navLayout.header'),
      hint: t('preferences.navLayout.headerDesc'),
    },
  ]
}

export function useNavLayout() {
  return { navLayout, isHeaderNav, setNavLayout, toggleNavLayout }
}
