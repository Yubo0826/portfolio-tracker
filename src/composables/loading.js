import { ref } from 'vue'

export const globalLoadingVisible = ref(false)

export const showLoading = () => {
  globalLoadingVisible.value = true
}

export const hideLoading = () => {
  globalLoadingVisible.value = false
}
