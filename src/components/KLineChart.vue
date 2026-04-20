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

    <highcharts
      :options="highCandleOptions"
      style="width: 100%; height: 400px;"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/utils/api'

const { t } = useI18n()

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

const highCandleOptions = computed(() => ({
  chart: { type: 'candlestick', backgroundColor: 'transparent', animation: { duration: 300 } },
  title: { text: `${props.symbol} · ${t('klineChart')}`, align: 'left' },
  credits: { enabled: false },
  legend: { enabled: false },
  xAxis: { type: 'datetime' },
  yAxis: {
    title: { text: t('priceUSD') },
    labels: { formatter: function () { return `$${this.value.toFixed(2)}` } },
  },
  tooltip: { xDateFormat: '%Y/%m/%d' },
  plotOptions: {
    candlestick: {
      color: '#ef4444',
      upColor: '#10b981',
      lineColor: '#ef4444',
      upLineColor: '#10b981',
    },
  },
  series: [{
    type: 'candlestick',
    name: t('klineChart'),
    data: chartSeries.value[0].data.map(d => {
      const ts = d.x instanceof Date ? d.x.getTime() : new Date(d.x).getTime()
      return [ts, d.y[0], d.y[1], d.y[2], d.y[3]]
    }),
  }],
}))

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
