<template>
  <div>
    <div class="flex gap-4">
      <!-- 左半邊 -->
      <div class="w-3/5">
        <div class="flex flex-col sm:flex-row w-full gap-4 mb-8">
          <!-- Total Value Card -->
          <Card class="w-full md:w-1/2 rounded-xl shadow-md">
            <template #title>
              <div class="flex items-center text-[#475569]">
                <Button icon="pi pi-wallet" severity="secondary" rounded size="small" disabled />
                <div class="text-sm ml-2">{{ $t('totalValue') }}</div>
              </div>
            </template>
            <template #content>
              <div class="flex justify-between items-center mt-2">
                <div class="text-2xl font-bold">
                  ${{ totalValue.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }}
                </div>
              </div>
            </template>
            <template #footer>
              <div class="text-sm text-gray-500 mt-4">
                基準貨幣：USD

              </div>

            </template>
          </Card>
    
          <!-- Total Profit Card -->
          <Card class="w-full md:w-1/2 rounded-xl shadow-md">
            <template #title>
              <div class="flex items-center text-[#475569]">
                <Button icon="pi pi-chart-line" severity="secondary" rounded size="small" disabled />
                <div class="text-sm ml-2">
                  {{ $t('totalProfit') }}
                  <i class="pi pi-question-circle" v-tooltip.bottom="'總收益 = 總市值 - 總成本'"></i>
                </div>
              </div>
            </template>
            <template #content>
              <div class="flex justify-between items-center mt-2">
                <div class="text-2xl font-bold">
                  ${{ totalProfit.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }}
                </div>
              </div>
            </template>
            <template #footer>
              <div class="text-sm text-gray-500 mt-4">
                投資報酬率： 
                <span :class="annualReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                  {{ annualReturn.toFixed(2) }}%
                </span>
              </div>

            </template>
          </Card>
    
          <!-- XIRR Card -->
          <Card class="w-full md:w-1/2 rounded-xl shadow-md">
            <template #title>
              <div class="flex items-center text-[#475569]">
                <Button icon="pi pi-calendar" severity="secondary" rounded size="small" disabled />
                <div class="text-sm ml-2">
                  IRR
                  <i
                    class="pi pi-question-circle"
                    v-tooltip.bottom="'使用 XIRR 計算的年化投資報酬率，考慮了每筆買進、賣出、股息發放的時間與金額，以及目前持有資產的市值。'">
                  </i>
                </div>
              </div>
            </template>
            <template #content>
              <div class="flex justify-between items-center mt-2">
                <div class="text-2xl font-bold">{{ irr }}%</div>
              </div>
            </template>
          </Card>
        </div>
    
        <!-- 資產走勢圖 -->
        <div>
          <Card>
            <template #title>
              <div class="flex items-center justify-between text-[#252525]">
                <div class="text-sm mb-4 font-bold">資產走勢</div>
                <SelectButton v-model="selectedPeriod" :options="periods" optionLabel="label" optionValue="value" class="mb-4" size="small" />
              </div>
            </template>
            <template #content>
              <StockChart
                type="area"
                :options="chartOptions"
                :series="chartSeries"
                @update:date="fetchChartData"
                height="300"
              />
            </template>
          </Card>
      </div>
      </div>
      <!-- 右半邊 圓餅圖 -->
      <div class="w-2/5">
        <Card class="w-full">
          <!-- title -->
          <template #title>
            <div class="flex items-center justify-between mb-4">
              <SelectButton v-model="selectedPieType" :options="pieChartType" optionLabel="label" optionValue="value" size="small" />
               <Button
                unstyled
                label="前往目標設定"
                icon="pi pi-bullseye"
                @click="$router.push('allocation')"
                :pt="{
                  root: {
                    class:
                      // 尺寸/外觀
                      'inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 ' +
                      // 文字
                      'text-sm font-medium text-slate-700 ' +
                      // 陰影/互動
                      'shadow-[0_4px_12px_rgba(2,6,23,0.08)] hover:border-slate-300 hover:shadow-[0_8px_20px_rgba(2,6,23,0.12)] active:shadow-sm ' +
                      // 無障礙
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 ' +
                      // 動畫
                      'transition' + ' cursor-pointer'
                  },
                  icon: {
                    // 使用 primeicons，靠字級控制大小
                    class: 'order-0 mr-0 text-slate-600 text-[18px]'
                  },
                  label: {
                    class: 'order-1'
                  }
                }"
              />
            </div>
          </template>
          <!-- Pie -->
          <template #content>
            <div class="flex justify-between items-center mb-4">
              <apexchart
                v-if="selectedPieType === 'actual'"
                width="380"
                type="donut"
                :options="holdingsChart"
                :series="holdingsSeries" />
              <apexchart
                v-else
                width="380"
                type="donut"
                :options="allocationChart"
                :series="allocationSeries" />
            </div>
          </template>
          <!-- Footer -->
          <template #footer>
            <div class="w-full max-w-md rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div class="mb-2 grid grid-cols-2">
                <div class="text-[13px] font-medium text-slate-600">與目標的差值（需調整）</div>
                <div class="text-right text-[13px] text-slate-500">正數 = 買入 | 負數 = 賣出</div>
              </div>
  
              <div class="divide-y divide-slate-100">
                <div v-for="r in rebalanceRows" :key="r.symbol" class="grid grid-cols-2 items-center py-2">
                  <div class="flex items-center gap-3">
                    <div class="w-10 shrink-0 text-slate-700">{{ r.symbol }}</div>
                    <span :class="['inline-flex items-center gap-1.5 font-medium', r.change > 0 ? 'text-emerald-600' : 'text-rose-600']">
                      <span class="leading-none text-sm">{{ r.change > 0 ? '↗' : '↘' }}</span>
                      <span class="tabular-nums">{{ Math.abs(r.change).toFixed(1) }}%</span>
                    </span>
                  </div>
                  <div class="text-right tabular-nums font-medium text-slate-700">
                    {{ formatUSD(r.amount) }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Holdings Table -->
    <Card class="mb-8 mt-8 p-4">
      <template #content>
        <DataTable :value="holdings" :loading="isLoading" sortField="currentValue" :sortOrder="-1" dataKey="id" tableStyle="min-width: 50rem">
          <Column field="name" header="現在資產">
            <template #body="{ data }">
              <div @click="() => $router.push({ name: 'asset', params: { symbol: data.symbol } })" class="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-md">
                <StockIcon :symbol="data.symbol" class="mr-8" />
                <div>
                  <span class="font-bold mr-4">{{ data.symbol }}</span>
                  <div class="truncate">{{ data.name }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="shares" header="持有股數" />
          <Column field="totalCost" header="交易成本">
            <template #body="{ data }">
              <span class="font-bold mr-4">${{ data.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
              <div class="text-[#b5b5c3]">{{ data.avgCost.toFixed(2) }} / 股</div>
            </template>
          </Column>

          <Column field="currentPrice" header="股價">
            <template #body="{ data }">
              <span class="font-bold mr-4">${{ data.currentPrice.toFixed(2) }}</span>
            </template>
          </Column>

          <Column field="currentValue" header="總價值" sortable>
            <template #body="{ data }">
              <span class="font-bold mr-4">${{ data.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
              <div :class="{ 'text-[#5cd59b]': data.profitPercentage >= 0, 'text-[#f27362]': data.profitPercentage < 0 }">
                <div class="flex items-center gap-2">
                  <i v-if="data.profitPercentage >= 0" class="pi pi-sort-up-fill"></i>
                  <i v-else class="pi pi-sort-down-fill"></i>
                  <span>{{ data.profitPercentage }}%</span>
                </div>
              </div>
            </template>
          </Column>

          <Column field="target" header="配置比例">
            <template #body="{ data }">
              <span class="font-bold mr-4">{{ ((data.currentValue / totalValue) * 100).toFixed(1) }}%</span>
              <div class="text-[#b5b5c3]">{{ data.target || 0 }}%</div>
            </template>
          </Column>

          <template #empty>
            <div class="p-4 text-center text-gray-500">
              <i class="pi pi-info-circle mr-2" /> 現在並無資料。
            </div>
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
/* =========================
 *  Imports & Stores
 * =======================*/
import { ref, watch, computed } from 'vue'
import SelectButton from 'primevue/selectbutton'
import StockIcon from '@/components/StockIcon.vue'
import StockChart from '@/components/StockChart.vue'
import api from '@/api'
import xirr from 'xirr'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'

const auth = useAuthStore()
const portfolioStore = usePortfolioStore()

/* =========================
 *  State
 * =======================*/
const isLoading = ref(false)

const holdings = ref([])
const allocation = ref([])
const transactions = ref([])
const dividends = ref([])

const totalValue = ref(0)
const totalProfit = ref(0)

const selectedPieType = ref('actual')
const pieChartType = [
  { label: '實際配置', value: 'actual' },
  { label: '目標配置', value: 'target' }
]

const selectedPeriod = ref('')
const periods = [
  { label: '7天', value: '7d' },
  { label: '1個月', value: '1mo' },
  { label: '3個月', value: '3mo' },
  { label: '6個月', value: '6mo' },
  { label: 'YTD', value: 'ytd' },
  { label: '1年', value: '1y' },
  { label: '5年 ', value: '5y' }
]

const chartSeries = ref([{ name: '收盤價', data: [] }])
const growthRate = ref(null)
const change = ref(0)

/* =========================
 *  Utils / Formatters
 * =======================*/
function formatUSD(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(n)
}
function formatDate(date) {
  return date.toISOString().split('T')[0]
}
function formatStrDate(dateStr, locale = 'en-US') {
  const date = new Date(dateStr)
  if (locale.startsWith('en')) {
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: '2-digit' }).format(date)
  }
  if (locale.startsWith('zh')) {
    const formatted = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'numeric', day: 'numeric' }).format(date)
    const [year, month, day] = formatted.match(/\d+/g)
    return `${month}月${day}日, ${year}年`
  }
  return dateStr
}
function getPeriodRange(range) {
  const today = new Date()
  const endDate = formatDate(today)

  const daysMap = { '7d': 7, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365, '2y': 730, '5y': 1825 }
  if (range === 'ytd') {
    const start = new Date(today.getFullYear(), 0, 1)
    return { period1: formatDate(start), period2: endDate }
  }
  const days = daysMap[range] || 30
  const start = new Date()
  start.setDate(start.getDate() - days)
  return { period1: formatDate(start), period2: endDate }
}

/* =========================
 *  Setters (transform API -> view model)
 * =======================*/
function setHoldings(data) {
  holdings.value = data.map(item => {
    const shares = parseInt(item.total_shares) || 0
    const avgCost = parseFloat(item.avg_cost) || 0
    const currentPrice = parseFloat(item.current_price) || 0
    const target = parseFloat(item.target_percentage) || 0
    const lastUpdated = item.last_updated?.split('T')[0] || ''
    const totalCost = avgCost * shares
    const currentValue = Math.round(currentPrice * shares * 100) / 100
    const totalProfit = Math.round((currentValue - totalCost) * 100) / 100
    const profitPercentage = ((currentValue / (totalCost || 1)) * 100 - 100).toFixed(2)

    return {
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      assetType: item.asset_type,
      shares,
      avgCost,
      currentPrice,
      totalCost,
      totalProfit,
      profitPercentage,
      currentValue,
      target,
      lastUpdated
    }
  })
  setChartData()
}
function setTransactions(data) {
  transactions.value = data.map(item => ({
    id: item.id,
    symbol: item.symbol,
    name: item.name,
    assetType: item.assetType,
    price: parseFloat(item.price) || 0,
    fee: parseFloat(item.fee) || 0,
    shares: parseInt(item.shares) || 0,
    transactionType: item.transaction_type,
    date: item.transaction_date.split('T')[0]
  }))
}
function setDividends(data) {
  dividends.value = data.map(item => ({
    id: item.id,
    symbol: item.symbol,
    name: item.name,
    shares: item.shares,
    amount: item.amount,
    totalAmount: (item.shares * item.amount).toFixed(2),
    date: item.date.slice(0, 10)
  }))
}
function setChartData() {
  totalValue.value = holdings.value.reduce((sum, h) => sum + h.currentValue, 0)
  totalProfit.value = holdings.value.reduce((sum, h) => sum + (h.currentValue - h.avgCost * h.shares), 0)
}

/* =========================
 *  API Calls
 * =======================*/
async function getHoldings() {
  try {
    const data = await api.get(`http://localhost:3000/api/holdings/?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`)
    setHoldings(data)
  } catch (e) {
    console.error('Error fetching current prices:', e)
  }
}
async function getAllocation() {
  try {
    if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return
    const data = await api.get(`http://localhost:3000/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`)
    allocation.value = data
  } catch (e) {
    console.error('Error fetching allocation:', e)
  }
}
async function getTransactions() {
  try {
    if (!portfolioStore.currentPortfolio) return
    const data = await api.get(`http://localhost:3000/api/transactions?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`)
    setTransactions(data.transactions)
  } catch (e) {
    console.error(e)
  }
}
async function getDividends() {
  try {
    const data = await api.get(`http://localhost:3000/api/dividends?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`)
    setDividends(data)
  } catch (e) {
    console.error('Error fetching dividends:', e)
  }
}
async function getData() {
  isLoading.value = true
  try {
    await getHoldings()
    await getAllocation()
    await getTransactions()
    await getDividends()
  } catch (e) {
    console.error('Error fetching data:', e)
  } finally {
    isLoading.value = false
  }
}

/* =========================
 *  Computed (derived data)
 * =======================*/
const holdingsSeries = computed(() => holdings.value.map(h => h.currentValue))
const allocationSeries = computed(() => allocation.value.map(a => a.target))

const holdingsChart = computed(() => ({
  chart: { type: 'donut' },
  labels: holdings.value.map(h => h.symbol),
  responsive: [{ breakpoint: 480, options: { legend: { position: 'bottom' } } }]
}))
const allocationChart = computed(() => ({
  chart: { type: 'donut' },
  labels: allocation.value.map(a => a.symbol),
  responsive: [{ breakpoint: 480, options: { legend: { position: 'bottom' } } }]
}))

const annualReturn = computed(() => {
  if (!holdings.value.length) return 0
  const totalCost = holdings.value.reduce((s, h) => s + h.avgCost * h.shares, 0)
  const curr = holdings.value.reduce((s, h) => s + h.currentValue, 0)
  if (totalCost === 0) return 0
  return ((curr - totalCost) / totalCost) * 100
})

const irr = computed(() => {
  if (!transactions.value.length || !holdings.value.length) return null
  const cashflows = []

  transactions.value.forEach(tx => {
    const amount = (tx.price * tx.shares + tx.fee) * (tx.transactionType === 'buy' ? -1 : 1)
    cashflows.push({ amount, when: new Date(tx.date) })
  })
  dividends.value.forEach(d => {
    cashflows.push({ amount: parseFloat(d.totalAmount), when: new Date(d.date) })
  })
  cashflows.push({ amount: holdings.value.reduce((s, h) => s + h.currentValue, 0), when: new Date() })

  try {
    const rate = xirr(cashflows)
    return (rate * 100).toFixed(2)
  } catch (e) {
    console.error('Error calculating XIRR:', e)
    return 'N/A'
  }
})

/** 與目標差值（正=買入、負=賣出） */
const rebalanceRows = computed(() => {
  const tv = totalValue.value
  if (!tv || (!holdings.value.length && !allocation.value.length)) return []

  const targetMap = new Map()
  allocation.value.forEach(a => {
    const pct = Number(a.target ?? a.target_percentage ?? a.percentage ?? 0)
    targetMap.set(a.symbol, pct)
  })
  holdings.value.forEach(h => {
    if (!targetMap.has(h.symbol) && h.target) targetMap.set(h.symbol, Number(h.target))
  })

  const symbols = new Set([...holdings.value.map(h => h.symbol), ...targetMap.keys()])
  const out = []
  symbols.forEach(sym => {
    const h = holdings.value.find(x => x.symbol === sym)
    const currentVal = h?.currentValue ?? 0
    const currentPct = tv ? (currentVal / tv) * 100 : 0
    const targetPct = targetMap.get(sym) ?? 0
    const deltaPct = targetPct - currentPct
    if (Math.abs(deltaPct) < 0.05) return
    const amount = Math.round(tv * (deltaPct / 100))
    out.push({ symbol: sym, change: Number(deltaPct.toFixed(1)), amount })
  })
  out.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  return out.slice(0, 5)
})

/* =========================
 *  Charts (options & helpers)
 * =======================*/
const chartOptions = {
  chart: { id: 'chart', type: 'area', zoom: { enabled: false }, toolbar: { show: false } },
  stroke: { curve: 'smooth', width: 2 },
  dataLabels: { enabled: false },
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
  xaxis: { type: 'datetime', labels: { style: { fontSize: '12px', colors: '#999' } } },
  yaxis: {
    labels: { formatter: val => `$${val.toFixed(2)}`, style: { fontSize: '12px', colors: '#999' } },
    title: { style: { fontSize: '14px' } }
  },
  tooltip: { x: { format: 'yyyy/MM/dd' } },
  grid: { show: true, borderColor: '#eee', strokeDashArray: 5 }
}

function calculateGrowthRate() {
  if (!chartSeries.value[0].data || chartSeries.value[0].data.length < 2) return null
  const firstPrice = chartSeries.value[0].data[0].y
  const lastPrice = chartSeries.value[0].data[chartSeries.value[0].data.length - 1].y
  change.value = lastPrice - firstPrice
  growthRate.value = (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2)
}
async function fetchChartData(period1, period2) {
  try {
    const data = await api.get(`http://localhost:3000/api/yahoo/holdings-chart?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}&period1=${period1}&period2=${period2}`)
    const lineData = data.map(item => ({ x: new Date(item.date), y: item.close }))
    chartSeries.value = [{ name: '收盤價', data: lineData }]
    calculateGrowthRate()
  } catch (e) {
    console.error('Error fetching total value chart data:', e)
  }
}

/* =========================
 *  Watchers & Init
 * =======================*/
watch(selectedPeriod, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    const { period1, period2 } = getPeriodRange(newVal)
    fetchChartData(period1, period2)
  }
})
watch(
  () => [auth.user?.uid, portfolioStore.currentPortfolio?.id],
  ([uid, pid]) => {
    if (uid && pid) {
      getData()
      selectedPeriod.value = '3mo'
    }
  },
  { immediate: true }
)

if (auth.user) {
  getData()
} else {
  console.log('No user is logged in')
}
</script>
