<!-- src/components/StockChart.vue -->
<template>
  <highcharts :options="options" :style="{ height: `${height}px`, width: '100%' }" />
</template>

<script setup>
defineProps({
  options: {
    type: Object,
    required: true
  },
  height: {
    type: [String, Number],
    default: 300
  }
});
</script>
