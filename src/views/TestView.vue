<template>
  <div class="p-6 bg-slate-50 min-h-screen">
    <draggable v-model="items" item-key="id" handle=".drag-handle" class="space-y-3">
      <template #item="{ element }">
        <div
          class="flex items-center justify-between bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 
                     rounded-xl p-3 shadow-sm transition-all duration-200 cursor-move"
        >
          <!-- 拖曳圖示 -->
          <div
            class="drag-handle flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-600 dark:bg-indigo-800 dark:text-indigo-300 mr-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 9h.01M8 15h.01M12 9h.01M12 15h.01M16 9h.01M16 15h.01" />
            </svg>
          </div>

          <!-- 標題 -->
          <div class="flex-1 font-medium text-slate-800 dark:text-slate-100">
            {{ element.name }}
          </div>

          <!-- 模擬 placeholder bar -->
          <div class="flex space-x-2">
            <div class="w-16 h-4 bg-slate-300/70 rounded-full"></div>
            <div class="w-16 h-4 bg-slate-300/70 rounded-full"></div>
            <div class="w-16 h-4 bg-slate-300/70 rounded-full"></div>
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import draggable from "vuedraggable";

const items = [
  { id: 1, name: "Analysis regression" },
  { id: 2, name: "Analysis regression" },
  { id: 3, name: "Analysis regression" },
  { id: 4, name: "Analysis regression" },
];
</script>
