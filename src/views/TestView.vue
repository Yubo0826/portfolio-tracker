<template>
  <div>
    <Card v-for="symbol in symbols" :key="symbol" class="mb-6">
      <template #title>
        <div class="text-sm font-semibold">{{ symbol }} 價格歷史圖表</div>
      </template>
      <template #content>
        <div v-if="loadingMap[symbol]" class="p-4">載入中...</div>
        <div v-else>
          <apexchart
            type="line"
            height="250"
            :options="getChartOptions(symbol)"
            :series="getChartSeries(symbol)"
          />
        </div>
      </template>
    </Card>
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
