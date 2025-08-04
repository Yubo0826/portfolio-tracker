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
        type="line"
        :options="chartOptions"
        :series="chartSeries"
      />

      <KLineChart />
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import api from '@/api'
  import KLineChart from '@/components/KLineChart.vue'
  
  const selectedRange = ref('7d')
  
  const rangeOptions = [
    { label: '近 7 天', value: '7d' },
    { label: '近 1 個月', value: '1mo' },
    { label: '近 3 個月', value: '3mo' },
    { label: '近 1 年', value: '1y' },
    { label: '近 5 年', value: '5y' },
  ]
  
  const chartOptions = ref({
    chart: {
      id: 'aapl-chart',
      zoom: { enabled: true },
      toolbar: { show: true },
    },
    xaxis: {
      type: 'datetime',
    },
    yaxis: {
      labels: {
        formatter: (val) => `$${val.toFixed(2)}`
      },
      title: {
        text: '股價 (美元)'
      }
    },
    title: {
      text: 'Apple (AAPL) 歷史股價走勢',
      align: 'left'
    },
    tooltip: {
      x: {
        format: 'yyyy/MM/dd HH:mm'
      }
    }
  })
  
  const chartSeries = ref([
    {
      name: '收盤價',
      data: []
    }
  ])

  function getPeriodRange(range) {
  const today = new Date()
  const endDate = formatDate(today) // period2

  const daysMap = {
    '7d': 7,
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '1y': 365,
    '2y': 730,
    '5y': 1825
  }

  const days = daysMap[range] || 30
  const start = new Date()
  start.setDate(start.getDate() - days)
  const startDate = formatDate(start) // period1

  return {
    period1: startDate,
    period2: endDate
  }
}

function formatDate(date) {
  return date.toISOString().split('T')[0] // 轉為 YYYY-MM-DD
}


  
async function fetchChartData() {
  const symbol = 'AAPL'
  const range = selectedRange.value
  const { period1, period2 } = getPeriodRange(range)

  try {
    const data = await api.get(`http://localhost:3000/api/yahoo/chart?symbol=${symbol}&period1=${period1}&period2=${period2}`)
    console.log('取得資料:', data)
    const quotes = data.quotes || []

    const chartData = quotes
      .filter(q => q.close !== null)
      .map(q => ({
        x: new Date(q.date),
        y: q.close.toFixed(2)
      }))

    chartSeries.value[0].data = chartData
    console.log('Chart data:', chartSeries.value[0].data)
  } catch (error) {
    console.error('取得資料失敗:', error)
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
  