<template>
  <div>
    <Breadcrumb :home="home" :model="items">
        <template #item="{ item, props }">
            <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
                <a :href="href" v-bind="props.action" @click="navigate">
                    <span :class="[item.icon, 'text-color']" />
                    <span class="text-primary font-semibold">{{ item.label }}</span>
                </a>
            </router-link>
            <a v-else :href="item.url" :target="item.target" v-bind="props.action">
                <span class="text-surface-700 dark:text-surface-0">{{ item.label }}</span>
            </a>
        </template>
    </Breadcrumb>

    <div class="pl-4">
      <h1 class="text-2xl mb-4">{{ fullName }}</h1>
      <div class="chart-container">
        <div class="grid grid-cols-3 gap-16">
          <!-- 左邊 -->
          <div class="col-span-2">
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center mb-2">
                  <div class="text-3xl font-semibold mr-4">${{ regularMarketPrice }}</div>
                  <div :class="growthRate >= 0 ? 'text-green-600' : 'text-red-600'" class="flex items-center">
                      <span v-if="growthRate >= 0" class="mr-1">▲</span>
                      <span v-else class="mr-1">▼</span>
                      <span class=" font-semibold">{{ change.toFixed(2) }}</span>
                      <span class="ml-2 font-semibold">{{ growthRate }}%</span>
                  </div>
              </div>
              <span>
                  {{ formatUTC8(regularMarketTime) }}
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

          <!-- 右邊 -->
          <div>
            <Card class="w-full">
              <template #content>
                <div class="flex flex-col gap-3 text-sm">
                  <div class="flex justify-between border-b pb-2">
                    <span>前次收盤價</span>
                    <span class="font-semibold">$1,200.00</span>
                  </div>
                  <div class="flex justify-between border-b pb-2">
                    <span>單日股價範圍</span>
                    <span class="font-semibold">$1,175.00 - $1,190.00</span>
                  </div>
                  <div class="flex justify-between border-b pb-2">
                    <span>一年股價範圍</span>
                    <span class="font-semibold">$780.00 - $1,200.00</span>
                  </div>
                  <div class="flex justify-between border-b pb-2">
                    <span>總市值</span>
                    <span class="font-semibold">30.47兆 TWD</span>
                  </div>
                  <div class="flex justify-between border-b pb-2">
                    <span>平均交易量</span>
                    <span class="font-semibold">3,178.01萬</span>
                  </div>
                  <div class="flex justify-between border-b pb-2">
                    <span>本益比</span>
                    <span class="font-semibold">20.87</span>
                  </div>
                  <div class="flex justify-between border-b pb-2">
                    <span>股利收益率</span>
                    <span class="font-semibold">1.53%</span>
                  </div>
                  <div class="flex justify-between">
                    <span>主要交易所</span>
                    <span class="font-semibold">TPE</span>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>


        
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from 'vue'
import TabMenu from 'primevue/tabmenu';
import Breadcrumb from 'primevue/breadcrumb';
import api from '@/api'
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

const home = ref({
    icon: 'pi pi-home',
    route: '/dashboard'
});
const items = ref([
    { label: symbol },
]);

// 計算成長率和變化量

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

const fullName = ref('')
const regularMarketPrice = ref(0)
const regularMarketTime = ref('')

async function fetchChartData() {
  const range = rangeOptions[activeIndex.value].value
  const { period1, period2 } = getPeriodRange(range)

  try {
      const data = await api.get(`http://localhost:3000/api/yahoo/chart?symbol=${symbol}&period1=${period1}&period2=${period2}`)
      console.log('Chart data:', data)
      fullName.value = data.meta.longName || symbol
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

function formatUTC8(isoString) {
  const date = new Date(isoString);

  // 轉換成 UTC+8 時間（毫秒）
  const utc8Time = date.getTime() + 8 * 60 * 60 * 1000;
  const utc8Date = new Date(utc8Time);

  const pad = n => String(n).padStart(2, "0");

  const month = utc8Date.getUTCMonth() + 1;
  const day = utc8Date.getUTCDate();

  let hour = utc8Date.getUTCHours();
  const minute = pad(utc8Date.getUTCMinutes());
  const second = pad(utc8Date.getUTCSeconds());
  const period = hour >= 12 ? "下午" : "上午";

  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;

  return `${month}月${day}日, ${period}${hour}:${minute}:${second} [UTC+8]`;
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
