<script setup>
import { ref } from 'vue'

const tabs = ['熱門', '最近', '影片']
const activeTab = ref('熱門') // 預設選中「熱門」
</script>

<template>
  <div class="p-4 bg-white">
    <div class="inline-flex items-center gap-2 p-1 bg-transparent">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        class="px-4 py-1.5 text-sm font-bold transition-all duration-200 rounded-lg"
        :class="[
          activeTab === tab 
            ? 'bg-gray-100 text-black' // 選中狀態：灰色背景，黑色文字
            : 'text-gray-500 hover:text-black hover:bg-gray-50' // 未選中：灰色文字，Hover 效果
        ]"
      >
        {{ tab }}
      </button>
    </div>
  </div>
</template>