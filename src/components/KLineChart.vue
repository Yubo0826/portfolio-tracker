<template>
  <div class="chart-container">
    <div class="controls">
      <label for="range">時間區間：</label>
      <select v-model="selectedRange" @change="fetchChartData">
        <option v-for="option in rangeOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <apexchart
      width="100%"
      type="candlestick"
      :options="chartOptions"
      :series="chartSeries"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from 'vue'
import api from '@/utils/api'

const props = defineProps({
  symbol: {
    type: String,
    required: true
  }
})

const selectedRange = ref('3mo')

const rangeOptions = [
  { label: '近 7 天', value: '7d' },
  { label: '近 1 個月', value: '1mo' },
  { label: '近 3 個月', value: '3mo' },
  { label: '近 1 年', value: '1y' },
  { label: '近 5 年', value: '5y' }
]

const chartSeries = ref([
  {
    name: 'K線圖',
    data: []
  }
])

const chartOptions = ref({
  chart: {
    type: 'candlestick',
    height: 400,
    toolbar: {
      show: true
    },
    zoom: {
      enabled: true
    }
  },
  title: {
    text: `${props.symbol} · K 線圖`,
    align: 'left'
  },
  xaxis: {
    type: 'datetime'
  },
  yaxis: {
    tooltip: {
      enabled: true
    },
    title: {
      text: '價格 (USD)'
    }
  },
  tooltip: {
    x: {
      format: 'yyyy/MM/dd'
    }
  }
})

function getPeriodRange(range) {
  const today = new Date()
  const endDate = formatDate(today)

  const daysMap = {
    '7d': 7,
    '1mo': 30,
    '3mo': 90,
    '1y': 365,
    '5y': 1825
  }

  const days = daysMap[range] || 30
  const start = new Date()
  start.setDate(start.getDate() - days)
  const startDate = formatDate(start)

  return {
    period1: startDate,
    period2: endDate
  }
}

function formatDate(date) {
  return date.toISOString().split('T')[0]
}

async function fetchChartData() {
  const range = selectedRange.value
  const { period1, period2 } = getPeriodRange(range)

  try {
    const res = await api.get(
      `/api/yahoo/chart?symbol=${props.symbol}&period1=${period1}&period2=${period2}`
    )
    const quotes = res.quotes || []

    const candleData = quotes
      .filter(q => q.open !== null && q.close !== null && q.high !== null && q.low !== null)
      .map(q => ({
        x: new Date(q.date),
        y: [
          parseFloat(q.open.toFixed(2)),
          parseFloat(q.high.toFixed(2)),
          parseFloat(q.low.toFixed(2)),
          parseFloat(q.close.toFixed(2))
        ]
      }))

    chartSeries.value[0].data = candleData
  } catch (err) {
    console.error('取得資料失敗:', err)
  }
}

onMounted(fetchChartData)
</script>

<style scoped>
.chart-container {
  max-width: 100%;
  margin: 1rem auto;
}
.controls {
  margin-bottom: 1rem;
}
</style>
