<template>
    <div class="chart-container">
      <div class="flex justify-between mb-4">

        <div class="flex items-center mb-2">
            <div class="text-3xl font-bold mr-4">${{ regularMarketPrice }}</div>
            <div :class="growthRate !== null && growthRate >= 0 ? 'text-green-600' : 'text-red-600'" class="flex items-center">
                <span v-if="growthRate !== null && growthRate >= 0" class="mr-1">▲</span>
                <span v-else class="mr-1">▼</span>
                <span class="font-semibold">{{ growthRate }}%</span>
                <span class="ml-2 font-semibold">{{ change.toFixed(2) }}</span>
            </div>
        </div>
        <span>
            {{ new Date(regularMarketTime).toLocaleString() }}
        </span>
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
  
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import TabMenu from 'primevue/tabmenu';
import api from '@/utils/api'
import { useRoute } from 'vue-router'

const route = useRoute()
const symbol = route.params.symbol as string

// const selectedRange = ref('3mo')

interface RangeOption {
    label: string;
    value: string;
}

const rangeOptions: RangeOption[] = [
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
        formatter: (val: number) => `$${val.toFixed(2)}`
        },
        title: {
        text: '股價 (美元)'
        }
    },
    tooltip: {
        x: {
            format: 'yyyy/MM/dd HH:mm'
        }
    }
})

interface ChartSeries {
    name: string;
    data: { x: Date; y: string }[];
}

const chartSeries = ref<ChartSeries[]>([
{
    name: '收盤價',
    data: []
}
])

const growthRate = ref<number | null>(null)
const change = ref(0)

function calculateGrowthRate() {
    if (!chartSeries.value[0].data || chartSeries.value[0].data.length < 2) return null
    const firstPrice = parseFloat(chartSeries.value[0].data[0].y)
    const lastPrice = parseFloat(chartSeries.value[0].data[chartSeries.value[0].data.length - 1].y)
    change.value = lastPrice - firstPrice
    growthRate.value = parseFloat(((lastPrice - firstPrice) / firstPrice * 100).toFixed(2))
}

function getPeriodRange(range: string) {
    const today = new Date()
    const endDate = formatDate(today) // period2

    const daysMap: Record<string, number> = {
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

function formatDate(date: Date) {
    return date.toISOString().split('T')[0] // 轉為 YYYY-MM-DD
}

const regularMarketPrice = ref(0)
const regularMarketTime = ref('')

async function fetchChartData() {
    const range = rangeOptions[activeIndex.value].value
    const { period1, period2 } = getPeriodRange(range)

    try {
        const data: any = await api.get(`/api/yahoo/chart?symbol=${symbol}&period1=${period1}&period2=${period2}`)
        console.log('Chart data:', data)
        regularMarketPrice.value = data.meta.regularMarketPrice || 0
        regularMarketTime.value = data.meta.regularMarketTime || ''

        const quotes = data.quotes || []
        
        const chartData = quotes
        .filter((q: any) => q.close !== null)
        .map((q: any) => ({
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