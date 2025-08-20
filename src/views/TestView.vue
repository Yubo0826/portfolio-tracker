<template>
  <div class="space-y-2">
    <label class="text-sm font-semibold">Acceleration</label>
    <div class="flex w-[160px] bg-gray-200 rounded-full p-1">
      <button
        class="w-1/2 py-1 rounded-full transition-all duration-300"
        :class="selected === 'CHILL'
          ? 'bg-white shadow font-bold text-gray-800'
          : 'text-gray-500'"
        @click="selected = 'CHILL'"
      >
        CHILL
      </button>
      <button
        class="w-1/2 py-1 rounded-full transition-all duration-300"
        :class="selected === 'SPORT'
          ? 'bg-white shadow font-bold text-gray-800'
          : 'text-gray-500'"
        @click="selected = 'SPORT'"
      >
        SPORT
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const selected = ref('SPORT');
</script>
