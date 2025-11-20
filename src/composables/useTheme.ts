import { ref, onMounted } from 'vue'

const isDark = ref(false) // 放在 function 外層，整個 app 共用

export function useTheme() {

    // const isDark = ref(false) // 每次 useTheme() 都會建立一個新的 ref，彼此獨立（互不相通）。

    const updateThemeState = () => {
        isDark.value = document.documentElement.classList.contains('my-app-dark')
        console.log('Theme updated:', isDark.value ? 'dark' : 'light')
    }

    const toggleTheme = () => {
        document.documentElement.classList.toggle('my-app-dark')
        updateThemeState()
        localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    }

    onMounted(updateThemeState)

    return { isDark, toggleTheme }
}
