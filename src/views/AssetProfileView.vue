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

    <div class="pl-4 pr-4 mt-4">
      <div class="flex items-center">
        <h1 class="text-xl">{{ info.fullName }}</h1>
      </div>
      <div class="chart-container">
        <div class="grid grid-cols-3 gap-8">
          <!-- 左邊 -->
          <Card class="w-full col-span-2">
            <template #content>
              <div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center mb-2">
                      <div class="text-3xl font-bold mr-4">${{ info.regularMarketPrice }}</div>
                      <Tag :severity="growthRate >=0 ? 'success' : 'danger'">
                        <div :class="growthRate >= 0 ? 'text-green-600' : 'text-red-600'" class="flex items-center text-lg">
                          <!-- 變化數值 -->
                          <span class="mr-2">                          
                            <i v-if="growthRate >= 0" class="pi pi-sort-up-fill"></i>
                            <i v-else class="pi pi-sort-down-fill"></i>
                          </span>
                          <span class="font-semibold mr-4">{{ Math.abs(change.toFixed(2)) }}</span>
                          (
                            <!-- 變化%數 -->
                            <span v-if="growthRate >= 0">+</span>
                            <span v-else>-</span>
                            <span class="font-semibold">{{  Math.abs(growthRate) }}%</span>
                          )
                        </div>
                      </Tag>
                  </div>
    
                  <!-- 選擇圖表類型 -->
                  <div class="flex items-center space-x-2">
                    <SelectButton
                      v-model="chartType"
                      :options="chartTypeOptions"
                      optionLabel="label"
                      optionValue="value"
                      class="text-sm"
                    >
                      <template #option="slotProps">
                        <div class="flex items-center space-x-2">
                          <i :class="slotProps.option.icon"></i>
                          <!-- <span>{{ slotProps.option.label }}</span> -->
                        </div>
                      </template>
                    </SelectButton>
                  </div>
                </div>
                
                <!-- 收盤時間 -->
                <div class="flex justify-between text-[#5f6368] text-xs ">
                    <span>已收盤：{{ formatUTC8(info.regularMarketTime) }}</span>
                    
                </div>
    
                <!-- 時段區塊 -->
                <!-- <div class="flex justify-between items-center mt-4">
    
                      <Tabs 
                        v-model:value="currentRange"
                        >
                          <TabList
                            :pt="{
                              tabList: { style: { borderWidth: '0px' } },
                              content: { style: { borderWidth: '0px' } },
                            }"
                          >
                              <Tab v-for="tab in rangeOptions" :key="tab.label" :value="tab.value">{{ tab.label }}</Tab>
                          </TabList>
                      </Tabs>
    
                    <span class="text-xs ml-4">{{ startDate }} - {{ endDate }}</span>
                </div> -->
                
                <!-- 切換期間按鈕 -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4">                
                  <div class="flex flex-wrap justify-center sm:justify-start gap-2 py-4">
                    <Button
                      v-for="tab in rangeOptions"
                      :key="tab.label"
                      :label="tab.label"
                      text
                      rounded
                      unstyled
                      @click="currentRange = tab.value"
                      class="px-3 py-2 text-xs sm:text-sm rounded-lg cursor-pointer transition-all"
                      :style="{
                        backgroundColor: currentRange === tab.value ? 'var(--p-primary-500)' : 'transparent',
                        fontWeight: currentRange === tab.value ? '600' : '400',
                        color: currentRange === tab.value ? 'var(--p-surface-0)' : 'var(--p-text-color)'
                      }"
                    />
                  </div>
  
                  <div>
                    <span class="text-xs ml-4">{{ startDate }} ~ {{ endDate }}</span>
                  </div>
                </div>
    
                <!-- 圖表區 -->
                <div>
                  <apexchart
                    v-if="chartType === 'area'"
                    width="100%"
                    type="area"
                    :options="chartOptions"
                    :series="chartSeries"
                    height="300"
                  />
    
                  <apexchart
                    v-else-if="chartType === 'candlestick'"
                    width="100%"
                    type="candlestick"
                    :options="candleOptions"
                    :series="candleSeries"
                  />
                </div>
              </div>
            </template>
          </Card>

          <!-- 右邊 -->
          <div>
            <Card class="w-full">
              <template #content>
                <div class="flex flex-col gap-3 text-sm">
                  <div class="flex justify-between border-b border-gray-300 py-4 px-0">
                    <span>前次收盤價</span>
                    <span class="font-semibold">{{ info.chartPreviousClose }}</span>
                  </div>
                  <div class="flex justify-between border-b border-gray-300 py-4 px-0">
                    <span>單日股價範圍</span>
                    <span class="font-semibold">${{ info.regularMarketDayLow }} - ${{ info.regularMarketDayHigh }}</span>
                  </div>
                  <div class="flex justify-between border-b border-gray-300 py-4 px-0">
                    <span>一年股價範圍</span>
                    <span class="font-semibold">${{ info.fiftyTwoWeekLow }} - ${{ info.fiftyTwoWeekHigh }}</span>
                  </div>
                  <div class="flex justify-between border-b border-gray-300 py-4 px-0">
                    <span>今日交易量</span>
                    <span class="font-semibold">{{ info.regularMarketVolume }}</span>
                  </div>
                  <div class="flex justify-between border-gray-300 py-4 px-0">
                    <span>主要交易所</span>
                    <span class="font-semibold">{{ info.fullExchangeName }}</span>
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
import { ref, onMounted, watch, computed, reactive } from 'vue'
import Breadcrumb from 'primevue/breadcrumb';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import SelectButton from 'primevue/selectbutton'
import api from '@/utils/api'
import { useRoute, onBeforeRouteUpdate } from 'vue-router'
import { Tag } from 'primevue';

import { useTheme } from '@/composables/useTheme.js'
const { isDark } = useTheme()

const route  = useRoute()
const symbol = computed(() => route.params.symbol)

onBeforeRouteUpdate((to, from) => {
  const s = to.params.symbol
  items.value = [{ label: s }]
  console.log('Route updated to symbol:', s)
  fetchChartData(s)
})

const chartType = ref('area');

const chartTypeOptions = [
  { label: '面積圖', value: 'area', icon: 'pi pi-chart-line' },
  { label: 'K線圖', value: 'candlestick', icon: 'pi pi-chart-bar' }
]

// 偵測切換
watch(chartType, (newType) => {
  fetchChartData(symbol.value)
})

const currentRange = ref('3mo')

const rangeOptions = computed(() => ([
  { label: '7D', value: '7d' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: 'YTD', value: 'ytd' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' }
]))

const chartOptions = computed(() => ({
  chart: {
    id: `${symbol.value}-chart`,
    type: 'area',
    zoom: { enabled: false },
    toolbar: { show: false },
    background: 'transparent'
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  dataLabels: {
    enabled: false
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'vertical',
      gradientToColors: [growthRate.value >= 0 ? '#a7f3d0' : '#fecaca'],
      opacityFrom: 0.5,
      opacityTo: 0,
      stops: [0, 100]
    }
  },
  colors: [growthRate.value >= 0 ? '#10b981' : '#ef4444'],
  xaxis: {
    type: 'datetime',
    labels: {
      style: {
        fontSize: '12px',
        colors: '#999'
      }
    }
  },
  yaxis: {
    labels: {
      formatter: (val) => `$${val.toFixed(2)}`,
      style: {
        fontSize: '12px',
        colors: '#999'
      }
    },
    title: {
      text: '股價 (美元)',
      style: {
        fontSize: '14px'
      }
    }
  },
  tooltip: {
    x: {
      format: 'yyyy/MM/dd'
    }
  },
  grid: {
    show: true,
    borderColor: '#eee',
    strokeDashArray: 5,
  },
  theme: {
    mode: isDark.value ? 'dark' : 'light' // 一鍵套用深色主題
  },
}))

const chartSeries = ref([
  {
    name: '收盤價',
    data: []
  }
])

const candleSeries = ref([
  {
    name: 'K線圖',
    data: []
  }
])

const candleOptions = ref({
  chart: {
    type: 'candlestick',
    // height: 400,
    toolbar: {
      show: false
    },
    zoom: {
      enabled: true
    },
    background: 'transparent'
  },
  // title: {
  //   text: `${symbol} · K 線圖`,
  //   align: 'left'
  // },
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
  },
  theme: {
    mode: isDark.value ? 'dark' : 'light' // 一鍵套用深色主題
  },
})


const home = ref({
    icon: 'pi pi-home',
    route: '/dashboard'
});
const items = ref([
    { label: symbol.value },
]);

// 計算區間的成長率和變化量
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

  if (range === 'ytd') {
      const start = new Date(today.getFullYear(), 0, 1) // 當年第一天
      return {
          period1: formatDate(start),
          period2: endDate
      }
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

function formatStrDate(dateStr, locale = 'en-US') {
  const date = new Date(dateStr);

  console.log('formatStrDate:', date, locale)

  // 英文：Aug 17, 20
  if (locale.startsWith('en')) {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    }).format(date);
  }

  // 中文：8月17日, 2020年
  if (locale.startsWith('zh')) {
    const formatted = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).format(date);

    // 根據中文常見習慣再手動調整格式
    const [year, month, day] = formatted.match(/\d+/g);
    return `${month}月${day}日, ${year}年`;
  }

  // fallback
  return dateStr;
}

const info = reactive({
  fullName: '',
  regularMarketPrice: 0,
  regularMarketTime: '',
  chartPreviousClose: 0,
  fiftyTwoWeekHigh: 0,
  fiftyTwoWeekLow: 0,
  fullExchangeName: '',
  regularMarketVolume: 0
})

const startDate = ref('')
const endDate = ref('')

async function fetchChartData(symbol) {
  const { period1, period2 } = getPeriodRange(currentRange.value)

  startDate.value = period1 // formatStrDate(period1)
  endDate.value = period2 // formatStrDate(period2)

  try {
    const data = await api.get(`/api/yahoo/chart?symbol=${symbol}&period1=${period1}&period2=${period2}`)
    console.log('Chart data:', data)
    const quotes = data.quotes || []

    Object.assign(info, {
      fullName: data.meta.longName || symbol,
      regularMarketPrice: data.meta.regularMarketPrice || 0,
      regularMarketDayHigh: data.meta.regularMarketDayHigh || 0,
      regularMarketDayLow: data.meta.regularMarketDayLow || 0,
      regularMarketTime: data.meta.regularMarketTime || '',
      chartPreviousClose: data.meta.chartPreviousClose || 0,
      fiftyTwoWeekHigh: data.meta.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: data.meta.fiftyTwoWeekLow || 0,
      fullExchangeName: data.meta.fullExchangeName || '',
      regularMarketVolume: data.meta.regularMarketVolume || 0
    })

    if (chartType.value === 'area') {
      const lineData = quotes
        .filter(q => q.close !== null)
        .map(q => ({
          x: new Date(q.date),
          y: Number(q.close.toFixed(2))
        }))
      chartSeries.value[0].data = lineData
      calculateGrowthRate()
    } else if (chartType.value === 'candlestick') {
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
      candleSeries.value[0].data = candleData
    }
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

watch(currentRange, (newValue, oldValue) => {
if (newValue !== oldValue) {
  fetchChartData(symbol.value);
}
});

watch(chartType, () => {
  fetchChartData(symbol.value);
})

onMounted(() => {
  fetchChartData(symbol.value);
})

</script>
<style scoped>
.chart-container {
  max-width: 100%;
  margin: 1rem auto;
}

.controls {
  margin-bottom: 1rem;
}

.p-breadcrumb {
  background: var(--p-surface-background);
}

</style>
