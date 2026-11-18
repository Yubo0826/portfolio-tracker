import { ref } from 'vue'

const STORAGE_KEY = 'sidebarCollapsed'
// 收合寬度 = 外距 24 + 卡片內距 24 + 選單項目內距 24 + icon 14，icon 才會置中且與展開時同位置
const COLLAPSED_WIDTH = '86px'
const EXPANDED_WIDTH = '272px'

const isCollapsed = ref(localStorage.getItem(STORAGE_KEY) === 'true')

const applyWidthVar = () => {
  document.documentElement.style.setProperty(
    '--sidebar-width',
    isCollapsed.value ? COLLAPSED_WIDTH : EXPANDED_WIDTH
  )
  // 給 CSS 判斷收合方向（App.vue 主內容的 transition-delay）
  document.documentElement.dataset.sidebarCollapsed = String(isCollapsed.value)
}

applyWidthVar()

export function useSidebarCollapse() {
  const toggleCollapsed = () => {
    isCollapsed.value = !isCollapsed.value
    localStorage.setItem(STORAGE_KEY, String(isCollapsed.value))
    applyWidthVar()
  }

  return { isCollapsed, toggleCollapsed }
}
