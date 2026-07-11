import { ref } from 'vue'

const STORAGE_KEY = 'sidebarCollapsed'
const COLLAPSED_WIDTH = '76px'
const EXPANDED_WIDTH = '260px'

const isCollapsed = ref(localStorage.getItem(STORAGE_KEY) === 'true')

const applyWidthVar = () => {
  document.documentElement.style.setProperty(
    '--sidebar-width',
    isCollapsed.value ? COLLAPSED_WIDTH : EXPANDED_WIDTH
  )
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
