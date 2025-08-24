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

<script setup>
defineProps({
  type: {
    type: String,
    required: true,
    validator: (val) => ['area', 'candlestick'].includes(val)
  },
  options: {
    type: Object,
    required: true
  },
  series: {
    type: Array,
    required: true
  },
  height: {
    type: [String, Number]
  }
});
</script>
