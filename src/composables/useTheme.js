import { ref, computed, watchEffect } from 'vue'

// 放在 function 外層，整個 app 共用
const media = window.matchMedia('(prefers-color-scheme: dark)')
const systemDark = ref(media.matches)
media.addEventListener('change', (e) => { systemDark.value = e.matches })

const theme = ref(localStorage.getItem('theme') || 'system') // 'light' | 'dark' | 'system'
const isDark = computed(() => theme.value === 'dark' || (theme.value === 'system' && systemDark.value))
watchEffect(() => document.documentElement.classList.toggle('dark', isDark.value))

export function useTheme() {
  const setTheme = (value) => {
    theme.value = value
    localStorage.setItem('theme', value)
  }

  return { theme, isDark, setTheme }
}
