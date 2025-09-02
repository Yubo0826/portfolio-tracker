<template>
    <div class="chart-container">
      <div class="flex justify-between mb-4">

        <div class="flex items-center mb-2">
            <div class="text-3xl font-bold mr-4">${{ regularMarketPrice }}</div>
            <div :class="growthRate >= 0 ? 'text-green-600' : 'text-red-600'" class="flex items-center">
                <span v-if="growthRate >= 0" class="mr-1">▲</span>
                <span v-else class="mr-1">▼</span>
                <span class="font-semibold">{{ growthRate }}%</span>
                <span class="ml-2 font-semibold">{{ change.toFixed(2) }}</span>
            </div>
        </div>
        <span>
            {{ new Date(regularMarketTime) }}
        </span>
        <!-- <div class="text-sm text-gray-500 mb-4">
            盤前： ${{ premarketPrice }} <span :class="premarketChangePercent >= 0 ? 'text-green-600' : 'text-red-600'">({{ premarketChangePercent.toFixed(2) }}%)</span>
        </div> -->


        <!-- <div>
            <label for="range">時間區間：</label>
            <select v-model="selectedRange" @change="fetchChartData">
              <option v-for="option in rangeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
        </div>

        <div v-if="growthRate !== null" :class="growthRate >= 0 ? 'text-green-500' : 'text-red-500'" class="font-semibold mt-2">
            區間漲跌率：{{ growthRate }}%
        </div> -->
      </div>

        <div>
            <TabMenu :model="rangeOptions" v-model:activeIndex="activeIndex" />
        </div>
  
      <apexchart
        width="100%"
        type="line"
        :options="chartOptions"
        :series="chartSeries"
      />
    </div>
  </template>
  
<script setup>
import { ref, onMounted, watch, defineProps } from 'vue'
import TabMenu from 'primevue/tabmenu';
import api from '@/utils/api'
import { useRoute  } from 'vue-router'

const route  = useRoute()
const symbol = route.params.symbol

const selectedRange = ref('3mo')

const rangeOptions = [
    { label: '7 天', value: '7d' },
    { label: '1 個月', value: '1mo' },
    { label: '3 個月', value: '3mo' },
    { label: '1 年', value: '1y' },
    { label: '5 年', value: '5y' },
]


const activeIndex = ref(3);

const chartOptions = ref({
    chart: {
        id: `${symbol}-chart`,
        zoom: { enabled: true },
        toolbar: { show: false },
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
    // title: {
    //     text: `${props.symbol} · 歷史股價走勢`,
    //     align: 'left'
    // },
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

const growthRate = ref(null)
const change = ref(0)

function calculateGrowthRate() {
    if (!chartSeries.value[0].data || chartSeries.value[0].data.length < 2) return null
    const firstPrice = chartSeries.value[0].data[0].y
    const lastPrice = chartSeries.value[0].data[chartSeries.value[0].data.length - 1].y
    change.value = lastPrice - firstPrice
    growthRate.value = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2)
}

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

const regularMarketPrice = ref(0)
const regularMarketTime = ref('')

async function fetchChartData() {
    const range = rangeOptions[activeIndex.value].value
    const { period1, period2 } = getPeriodRange(range)

    try {
        const data = await api.get(`http://localhost:3000/api/yahoo/chart?symbol=${symbol}&period1=${period1}&period2=${period2}`)
        console.log('Chart data:', data)
        regularMarketPrice.value = data.meta.regularMarketPrice || 0
        regularMarketTime.value = data.meta.regularMarketTime || ''

        const quotes = data.quotes || []
        
        const chartData = quotes
        .filter(q => q.close !== null)
        .map(q => ({
            x: new Date(q.date),
            y: q.close.toFixed(2)
        }))
        
        chartSeries.value[0].data = chartData
        calculateGrowthRate()
    } catch (error) {
        console.error('取得資料失敗:', error)
    }
}

watch(activeIndex, (newIndex, oldIndex) => {
  if (newIndex !== oldIndex) {
    fetchChartData();
  }
});

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
  