<!-- src/components/StockChart.vue -->
<template>
  <apexchart
    v-if="type === 'area'"
    type="area"
    :height="height"
    :options="options"
    :series="series"
  />
  <apexchart
    v-else-if="type === 'candlestick'"
    type="candlestick"
    :options="options"
    :series="series"
  />
  <div v-else class="text-red-500">未知圖表類型</div>
</template>

<script setup lang="ts">
defineProps<{
  type: 'area' | 'candlestick';
  options: Record<string, any>;
  series: any[];
  height?: string | number;
}>();
</script>
