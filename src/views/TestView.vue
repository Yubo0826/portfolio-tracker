<template>
  <div class="w-48">
    <Dropdown
      v-model="selectedChart"
      :options="chartTypes"
      optionLabel="label"
      class="w-full chart-dropdown"
    >
      <template #value="{ value }">
        <div class="flex items-center gap-2">
          <i :class="value.icon" />
          <span>{{ value.label }}</span>
        </div>
      </template>

      <template #option="slotProps">
        <div class="flex items-center gap-2">
          <i :class="slotProps.option.icon" />
          <span>{{ slotProps.option.label }}</span>
        </div>
      </template>
    </Dropdown>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Dropdown from 'primevue/dropdown';

const chartTypes = [
  { label: 'Mountain', value: 'mountain', icon: 'pi pi-chart-line' },
  { label: 'Candle', value: 'candle', icon: 'pi pi-chart-bar' },
];

const selectedChart = ref(chartTypes[0]);
</script>

<style scoped>
.chart-dropdown .p-dropdown-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chart-dropdown .p-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
}

.chart-dropdown .p-dropdown-items {
  background-color: #1e1e2f;
  color: white;
}

.chart-dropdown .p-dropdown-item.p-highlight {
  background-color: #3245a6;
  color: white;
}
</style>
