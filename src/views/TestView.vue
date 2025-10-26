<template>
  <div>
    <button
      @click="loadData"
      class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 opacity-25"
    >
      載入資料
    </button>
  </div>
</template>

<script>
import { showLoading, hideLoading } from "@/composables/loading.js";

export default {
  methods: {
    async loadData() {
      showLoading();
      // 模擬 API
      await new Promise((res) => setTimeout(res, 5000));
      hideLoading();
    }
  }
};
</script>
