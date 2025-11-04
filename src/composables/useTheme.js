import { ref, onMounted } from 'vue'

export function useTheme() {
  const isDark = ref(false)

  const updateThemeState = () => {
    isDark.value = document.documentElement.classList.contains('my-app-dark')
  }

  const toggleTheme = () => {
    document.documentElement.classList.toggle('my-app-dark')
    updateThemeState()
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  onMounted(updateThemeState)

  return { isDark, toggleTheme }
}
