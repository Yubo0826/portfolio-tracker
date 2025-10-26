import { globalLoadingVisible } from "@/components/GlobalLoading.vue";

export const showLoading = () => {
  globalLoadingVisible.value = true;
};

export const hideLoading = () => {
  globalLoadingVisible.value = false;
};
