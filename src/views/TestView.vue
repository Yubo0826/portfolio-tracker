<template>
  <div>
    <!-- Menu bar container -->
    <div class="flex items-center justify-between px-8 py-4 shadow-sm bg-white">
      <!-- Logo -->
      <div class="text-2xl font-bold">
        <span class="text-purple-400">Loan</span>
        <span class="text-gray-900">Planner</span>
      </div>

      <!-- Menu items -->
      <nav class="flex space-x-8 text-sm font-medium">
        <a href="#" class="text-black border-b-2 border-purple-400 pb-1">Dashboard</a>
        <a href="#" class="text-gray-500 hover:text-black transition">Offer</a>
        <a href="#" class="text-gray-500 hover:text-black transition">Loan Transaction</a>
        <a href="#" class="text-gray-500 hover:text-black transition">Analytics</a>
        <a href="#" class="text-gray-500 hover:text-black transition">News</a>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api from '@/api';

const symbols = ref(['AAPL', 'TSLA', 'MSFT']); // 可改成從 holdings.value.map(h => h.symbol)
const chartDataMap = ref({});
const loadingMap = ref({});

const fetchChartData = async (symbol) => {
  loadingMap.value[symbol] = true;
  const now = Math.floor(Date.now() / 1000);
  const oneYearAgo = now - 365 * 24 * 60 * 60;
  try {
    const res = await api.get(`http://localhost:3000/api/yahoo/chart?symbol=${symbol}&period1=${oneYearAgo}&period2=${now}`);
    chartDataMap.value[symbol] = res.prices || [];
  } catch (error) {
    console.error(`Error loading chart data for ${symbol}:`, error);
  } finally {
    loadingMap.value[symbol] = false;
  }
};

const getChartSeries = (symbol) => {
  const prices = chartDataMap.value[symbol] || [];
  return [
    {
      name: symbol,
      data: prices.map(p => [new Date(p.date * 1000), p.close])
    }
  ];
};

const getChartOptions = (symbol) => ({
  chart: { id: `chart-${symbol}` },
  xaxis: { type: 'datetime' },
  stroke: { curve: 'smooth' },
  tooltip: { x: { format: 'yyyy-MM-dd' } },
});

onMounted(() => {
  symbols.value.forEach(symbol => fetchChartData(symbol));
});
</script>
