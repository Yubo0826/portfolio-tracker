<template>
  <!-- px-4 sm:px-6 lg:px-8 -->
  <div class="container mx-auto mt-4 ">
    <!-- 左右兩欄 -->
    <div class="flex flex-col lg:flex-row gap-6">

      <!-- 左半邊（統計卡 + 走勢圖） -->
      <div class="w-full lg:w-3/5 flex flex-col gap-6">
        
        <!-- 三張統計卡 -->
        <!-- grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Total Value -->
          <Card class="rounded-xl shadow-md">
            <template #title>
              <div class="flex items-center">
                <Button icon="pi pi-wallet" rounded size="small" disabled />
                <div class="text-sm ml-2">{{ $t('totalValue') }}</div>
              </div>
            </template>
            <template #content>
              <div class="flex justify-between items-center mt-2">
                <div v-if="totalValue" class="text-2xl font-bold">
                  {{ formatAmount(totalValue) }}
                </div>
                <div v-else class="text-2xl font-bold">--</div>
              </div>
            </template>
            <template #footer>
              <div class="text-sm mt-2 sm:mt-4">
                {{ $t('baseCurrency', { code: displayCurrency }) }}
              </div>
            </template>
          </Card>

          <!-- Total Profit -->
          <Card class="rounded-xl shadow-md">
            <template #title>
              <div class="flex items-center">
                <Button icon="pi pi-chart-line" rounded size="small" disabled />
                <div class="text-sm ml-2 flex items-center justify-end gap-2">
                  {{ $t('totalProfit') }}
                  <i class="pi pi-question-circle" v-tooltip.bottom="$t('totalProfitHint')"></i>
                </div>
              </div>
            </template>
            <template #content>
              <div class="flex justify-between items-center mt-2">
                <div v-if="totalProfit" class="text-2xl font-bold">
                  {{ formatAmount(totalProfit) }}
                </div>
                <div v-else class="text-2xl font-bold">--</div>
              </div>
            </template>
            <template #footer>
              <div class="text-sm mt-2 sm:mt-4">
                {{ $t('roi') }}
                <span v-if="annualReturn" :class="annualReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                  {{ annualReturn.toFixed(2) }}%
                </span>
                <span v-else>--</span>
              </div>
            </template>
          </Card>

          <!-- XIRR -->
          <Card class="rounded-xl shadow-md">
            <template #title>
              <div class="flex items-center">
                <Button icon="pi pi-calendar" rounded size="small" disabled />
                <div class="text-sm ml-2 flex items-center justify-end gap-2">
                  {{ $t('irr') }}
                  <i class="pi pi-question-circle" v-tooltip.bottom="$t('xirrHint')" />
                </div>
              </div>
            </template>
            <template #content>
              <div v-if="irr" class="flex justify-between items-center mt-2">
                <div class="text-2xl font-bold">{{ irr }}%</div>
              </div>
              <div v-else class="text-2xl font-bold text-gray-400 mt-2">--</div>
            </template>
            <template #footer>
              <div class="text-sm mt-2 sm:mt-4 opacity-0">
                1
              </div>
            </template>
          </Card>
        </div>

        <!-- 資產走勢圖 -->
        <Card>
          <template #title>
            <div class="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 mb-4">
              <div class="text-sm">{{ $t('assetTrend') }}</div>

              <Tag v-if="holdingsStore.list.length > 0" :severity="growthRate >= 0 ? 'success' : 'danger'" class="whitespace-nowrap">
                <div :class="growthRate >= 0 ? 'text-green-600' : 'text-red-600'" class="flex items-center font-medium">
                  <!-- 變化數值 -->
                  <span class="mr-2">                          
                    <i v-if="growthRate >= 0" class="pi pi-sort-up-fill"></i>
                    <i v-else class="pi pi-sort-down-fill"></i>
                  </span>
                  <span class="font-semibold mr-2">{{ Math.abs(change.toFixed(2)) }}</span>
                  (
                    <!-- 變化%數 -->
                    <span v-if="growthRate >= 0">+</span>
                    <span v-else>-</span>
                    <span class="font-semibold">{{  Math.abs(growthRate) }}%</span>
                  )
                </div>
              </Tag>
            </div>

            <!-- 切換期間按鈕 -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4">
              <!-- Segmented pill control -->
              <div class="inline-flex items-center rounded-xl p-1 gap-0.5
                          bg-slate-100 border border-slate-200
                          dark:bg-[#0f1520] dark:border-[#1d2b3a]">
                <button
                  v-for="tab in periods"
                  :key="tab.label"
                  @click="selectedPeriod = tab.value"
                  class="relative px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer
                         transition-all duration-150 select-none tracking-wide"
                  :class="selectedPeriod === tab.value
                    ? 'text-[#030609] bg-[#00F5FF] shadow-[0_0_10px_2px_rgba(0,245,255,0.45)]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5'"
                >
                  {{ tab.label }}
                </button>
              </div>

              <span class="text-xs text-slate-500 dark:text-slate-400">{{ startDate }} ~ {{ endDate }}</span>
            </div>
          </template>

          <template #content>
            <StockChart
              :options="areaChartOptions"
              :height="300"
            />
          </template>
        </Card>
      </div>

      <!-- 右半邊圓餅圖（縮小會掉到下方） -->
      <div class="w-full lg:w-2/5">
        <Card class="w-full h-full">
          <template #title>
            <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
              <SelectButton v-model="selectedPieType" :options="pieChartType" optionLabel="label" optionValue="value" size="small" />
              <!-- unstyled  -->
              <!-- :label="$t('setTargets')"  -->
              <!-- :pt="{ root: { class: 'whitespace-nowrap inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 ' + 'text-sm font-medium text-slate-700 ' + 'shadow-[0_4px_12px_rgba(2,6,23,0.08)] hover:border-slate-300 hover:shadow-[0_8px_20px_rgba(2,6,23,0.12)] active:shadow-sm ' + 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 ' + 'transition' + ' cursor-pointer' }, icon: { class: 'order-0 mr-0 text-slate-600 text-[18px]' }, label: { class: 'order-1' } }" /> -->
              <Button
                icon="pi pi-cog"
                variant="text" rounded
                @click="$router.push('allocation')" 
              />
            </div>
          </template>

          <template #content>
            <div v-if="holdingsStore.list.length > 0" class="flex justify-center items-center py-4">
              <highcharts
                v-if="selectedPieType === 'actual'"
                :options="holdingsChart"
                style="width: 100%; min-height: 260px;"
              />
              <highcharts
                v-else
                :options="allocationChart"
                style="width: 100%; min-height: 260px;"
              />
            </div>

            <div v-else class="flex flex-col items-center text-center gap-3 py-8">
              <img class="w-60 h-60 sm:w-80 sm:h-80" src="/src/assets/undraw_report_k55w.svg" alt="">
              <h2 class="text-lg sm:text-xl font-semibold">{{ $t('portfolioNoHoldingsTitle') }}</h2>
              <p class="text-sm sm:text-base text-gray-600">{{ $t('portfolioNoHoldingsDesc') }}</p>
            </div>
          </template>

          <template #footer>
            <div
              v-if="holdingsStore.list.length > 0"
              class="w-full max-w-md mx-auto rounded-2xl border border-[var(--p-content-border-color)] bg-[var(--p-content-background)] p-5 mt-auto"
            >
              <div class="mb-3 grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] text-[13px] font-medium text-[var(--p-text-muted-color)] tracking-wide">
                <div>{{ $t('symbol') }}</div>
                <div class="text-right">{{ $t('actualPercentage') }}</div>
                <div class="text-right">{{ $t('targetPercentage') }}</div>
                <div class="text-right">{{ $t('diffChange') }}</div>
                <div class="flex items-center justify-end gap-1">
                    <span>{{ $t('rebalance') }}</span>
                    <i class="pi pi-info-circle" v-tooltip.bottom="$t('diffLegend')"></i>
                </div>
              </div>

              <div class="divide-y divide-[var(--p-content-border-color)]">
                <div
                  v-for="r in rebalanceRows"
                  :key="r.symbol"
                  class="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] items-center py-2.5 text-sm"
                >
                  <div class="font-semibold text-[var(--p-text-color)]">{{ r.symbol }}</div>
                  <div class="text-right text-[var(--p-text-muted-color)]">{{ r.currentPct.toFixed(1) }}%</div>
                  <div class="text-right text-[var(--p-text-muted-color)]">{{ r.targetPct.toFixed(1) }}%</div>
                  <div class="text-right">
                    <span :class="r.change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'" class="font-medium tracking-wide">
                      <!-- <i v-if="r.change > 0" class="fas fa-arrow-right -rotate-45 text-[10px]"></i>
                      <i v-else class="fas fa-arrow-right rotate-45 text-[10px]"></i> -->
                      <span class="ml-1">{{ Math.abs(r.change).toFixed(1) }}%</span>
                    </span>
                  </div>
                  <div class="text-right font-semibold text-[var(--p-text-color)] tracking-wide">
                    {{ formatAmount(r.amount, { maximumFractionDigits: 0 }) }}
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
        <DataTable :value="holdingsStore.list" :loading="isLoading" sortField="currentValue" :sortOrder="-1" dataKey="id" tableStyle="min-width: 50rem" rowHover>
          <Column field="name" :header="$t('currentAsset')">
            <template #body="{ data }">
              <div @click="() => $router.push({ name: 'asset', params: { symbol: data.symbol } })"
                  class="flex items-center cursor-pointer p-2 rounded-md truncate hover:text-[var(--p-primary-color)]"
                  :style="{ width: '300px', minWidth: '250px' }">
                <StockIcon :symbol="data.symbol" class="mr-2" />
                <div class="truncate">
                  <span class="font-bold mx-2">{{ data.symbol }}</span>
                  <span class="truncate text-sm">{{ data.name }}</span>
                </div>
              </div>
            </template>
          </Column>

          <Column field="currentPrice" :header="$t('currentPrice')" sortable>
            <template #body="{ data }">
              <span class="font-bold mr-4">{{ formatPrice(data.currentPrice) }}</span>
            </template>
          </Column>

          <Column field="shares" :header="$t('shares')" sortable>
            <template #body="{ data }">
              <span class="font-bold mr-4">{{ data.shares }}</span>
            </template>
          </Column>
          <Column field="totalCost" :header="$t('totalCost')" sortable>
            <template #body="{ data }">
              <span class="font-bold mr-4">{{ formatAmount(data.totalCost) }}</span>
              <div class="text-sm text-[var(--p-card-subtitle-color)]">{{ formatPrice(data.avgCost) }} {{ $t('perShare') }}</div>
            </template>
          </Column>

          <Column field="currentValue" :header="$t('totalValue')" sortable>
            <template #body="{ data }">
              <span class="font-bold mr-4">{{ formatAmount(data.currentValue) }}</span>
              <div :class="{ 'text-emerald-600': data.profitPercentage >= 0, 'text-[#f27362]': data.profitPercentage < 0 }">
                <div class="flex items-center gap-1 font-bold text-sm">
                  <!-- <i v-if="data.profitPercentage >= 0" class="pi pi-sort-up-fill"></i>
                  <i v-else class="pi pi-sort-down-fill"></i> -->
                  
                  <i v-if="data.profitPercentage >= 0" class="fas fa-arrow-right -rotate-90"></i>
                  <i v-else class="fas fa-arrow-right rotate-90"></i>

                  <!-- <span v-if="data.profitPercentage >= 0">+</span>
                  <span v-else>-</span> -->
                  <span>{{ Math.abs(data.profitPercentage) }}%</span>
                </div>
              </div>
            </template>
          </Column>

          <Column field="target" :header="$t('allocationRatio')" sortable>
            <template #body="{ data }">
              <span class="font-bold mr-4">{{ ((data.currentValue / totalValue) * 100).toFixed(1) }}%</span>
              <div class="text-sm text-[var(--p-card-subtitle-color)]" :title="$t('targetPct')">
                {{ data.target || 0 }}%</div>
            </template>
          </Column>

          <template #empty>
            <NoData />
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
import api from '@/utils/api'
import xirr from 'xirr'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTransactionsStore } from '@/stores/transactions';
import { useHoldingsStore } from '@/stores/holdings'
import NoData from '@/components/NoData.vue'

import { useTheme } from '@/composables/useTheme.js'
const { isDark } = useTheme()

const transactionsStore = useTransactionsStore()
const auth = useAuthStore()
const portfolioStore = usePortfolioStore()
const holdingsStore = useHoldingsStore()

// Currency settings
import { useCurrency } from '@/composables/useCurrency'
const { formatAmount, formatChange, formatPrice, currencySymbol } = useCurrency()

import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'
const settingsStore = useSettingsStore()
const { displayCurrency, exchangeRate } = storeToRefs(settingsStore)

/* =========================
 *  State
 * =======================*/
const isLoading = ref(false)

const allocation = ref([])
const dividends = ref([])

const totalValue = computed(() => {
  return holdingsStore.list.reduce((sum, h) => sum + h.currentValue, 0)
})
const totalProfit = computed(() => {
  return holdingsStore.list.reduce((sum, h) => sum + (h.currentValue - h.avgCost * h.shares), 0)
})

const selectedPieType = ref('actual')
const pieChartType = computed(() => ([
  { label: t('actualAllocation'), value: 'actual' },
  { label: t('targetAllocation'), value: 'target' }
]))

const selectedPeriod = ref('')

const periods = computed(() => ([
  { label: '7D', value: '7d' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: 'YTD', value: 'ytd' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' }
]))

const chartSeries = ref([{ name: t('totalPrice'), data: [] }])
const growthRate = ref(null)
const change = ref(0)

/* =========================
 *  Utils / Formatters
 * =======================*/
// formatUSD now uses useCurrency composable (formatAmount)
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

const startDate = ref('')
const endDate = ref('')

function getPeriodRange(range) {
  const today = new Date()
  const e = formatDate(today)

  const daysMap = { '7d': 7, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365, '2y': 730, '5y': 1825 }
  if (range === 'ytd') {
    const start = new Date(today.getFullYear(), 0, 1)
    return { period1: formatDate(start), period2: e }
  }
  const days = daysMap[range] || 30
  const start = new Date()
  start.setDate(start.getDate() - days)
  startDate.value = formatDate(start) // formatStrDate(formatDate(start))
  endDate.value = e // formatStrDate(e)
  return { period1: formatDate(start), period2: e }
}

/* =========================
 *  Setters (transform API -> view model)
 * =======================*/
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

/* =========================
 *  API Calls
 * =======================*/
async function getAllocation() {
  try {
    if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return
    const data = await api.get(`/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`)
    allocation.value = data
  } catch (e) {
    console.error('Error fetching allocation:', e)
  }
}

async function getDividends() {
  try {
    const data = await api.get(`/api/dividends?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`)
    setDividends(data)
  } catch (e) {
    console.error('Error fetching dividends:', e)
  }
}
async function loadData() {
  isLoading.value = true
  if (portfolioStore.currentPortfolio == null) {
    isLoading.value = false
    return
  }
  try {
    await holdingsStore.fetchHoldings()
    if (holdingsStore.list.length === 0) {
      totalValue.value = 0
      totalProfit.value = 0
      chartSeries.value = [{ name: t('totalPrice'), data: [] }]
      return
    }
    // await transactionsStore.fetchTransactions()
    await getAllocation()
    await getDividends()
    fetchChartData()
  } catch (e) {
    console.error('Error fetching data:', e)
  } finally {
    isLoading.value = false
  }
}

/* =========================
 *  Computed (derived data)
 * =======================*/
const sortedAllocation = computed(() => {
  const holdingSymbols = holdingsStore.list.map(h => h.symbol)
  const allocationList = allocation.value || []

  return [...allocationList].sort((a, b) => {
    const indexA = holdingSymbols.indexOf(a.symbol)
    const indexB = holdingSymbols.indexOf(b.symbol)

    // 不在 holdings 裡的放後面
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1

    // 依 holdings 順序排序
    return indexA - indexB
  })
})

const holdingsChart = computed(() => ({
  chart: { type: 'pie', backgroundColor: 'transparent' },
  title: { text: null },
  credits: { enabled: false },
  plotOptions: {
    pie: {
      innerSize: '50%',
      dataLabels: { enabled: false },
      showInLegend: true,
    },
  },
  legend: {
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    itemStyle: { color: isDark.value ? '#d1d5db' : '#374151' },
  },
  tooltip: {
    pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b><br/>Value: ${point.y:.2f}',
    backgroundColor: isDark.value ? '#1f2937' : '#fff',
    style: { color: isDark.value ? '#f3f4f6' : '#374151' },
  },
  series: [{
    name: 'Holdings',
    data: holdingsStore.list.map(h => ({ name: h.symbol, y: h.currentValue })),
  }],
}))

const allocationChart = computed(() => ({
  chart: { type: 'pie', backgroundColor: 'transparent' },
  title: { text: null },
  credits: { enabled: false },
  plotOptions: {
    pie: {
      innerSize: '50%',
      dataLabels: { enabled: false },
      showInLegend: true,
    },
  },
  legend: {
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    itemStyle: { color: isDark.value ? '#d1d5db' : '#374151' },
  },
  tooltip: {
    pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b><br/>Target: {point.y}%',
    backgroundColor: isDark.value ? '#1f2937' : '#fff',
    style: { color: isDark.value ? '#f3f4f6' : '#374151' },
  },
  series: [{
    name: 'Allocation',
    data: sortedAllocation.value.map(a => ({ name: a.symbol, y: Number(a.target) })),
  }],
}))

const annualReturn = computed(() => {
  if (!holdingsStore.list.length) return 0
  const totalCost = holdingsStore.list.reduce((s, h) => s + h.avgCost * h.shares, 0)
  const curr = holdingsStore.list.reduce((s, h) => s + h.currentValue, 0)
  if (totalCost === 0) return 0
  return ((curr - totalCost) / totalCost) * 100
})

const irr = computed(() => {
  if (transactionsStore.list.length === 0 || holdingsStore.list.length === 0) return null
  const cashflows = []

  // 處理交易：買入為負（現金流出），賣出為正（現金流入）
  transactionsStore.list.forEach(tx => {
    let amount
    if (tx.transactionType === 'buy') {
      // 買入：成本 = 股價 × 股數 + 手續費（現金流出，所以是負數）
      amount = -(tx.price * tx.shares + tx.fee)
    } else {
      // 賣出：收入 = 股價 × 股數 - 手續費（現金流入，所以是正數）
      amount = tx.price * tx.shares - tx.fee
    }
    cashflows.push({ amount, when: new Date(tx.date) })
  })
  
  // 股息收入（現金流入，正數）
  dividends.value.forEach(d => {
    cashflows.push({ amount: parseFloat(d.totalAmount), when: new Date(d.date) })
  })
  
  // 當前持倉市值（視為今日賣出的收入，正數）
  cashflows.push({ amount: holdingsStore.list.reduce((s, h) => s + h.currentValue, 0), when: new Date() })

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
  if (!tv || (!holdingsStore.list.length && !allocation.value.length)) return []

  const targetMap = new Map()
  allocation.value.forEach(a => {
    const pct = Number(a.target ?? a.target_percentage ?? a.percentage ?? 0)
    targetMap.set(a.symbol, pct)
  })
  holdingsStore.list.forEach(h => {
    if (!targetMap.has(h.symbol) && h.target) targetMap.set(h.symbol, Number(h.target))
  })

  const symbols = new Set([...holdingsStore.list.map(h => h.symbol), ...targetMap.keys()])
  const out = []
  symbols.forEach(sym => {
    const h = holdingsStore.list.find(x => x.symbol === sym)
    const currentVal = h?.currentValue ?? 0
    const currentPct = tv ? (currentVal / tv) * 100 : 0
    const targetPct = targetMap.get(sym) ?? 0
    const deltaPct = targetPct - currentPct
    if (Math.abs(deltaPct) < 0.05) return
    const amount = Math.round(tv * (deltaPct / 100))
    out.push({ symbol: sym, currentPct: Number(currentPct.toFixed(1)), targetPct: Number(targetPct.toFixed(1)), change: Number(deltaPct.toFixed(1)), amount })
  })
  out.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  return out.slice(0, 5)
})

/* =========================
 *  Charts (options & helpers)
 * =======================*/
const areaChartOptions = computed(() => {
  const isPositive = growthRate.value >= 0
  const lineColor = isPositive ? '#10b981' : '#ef4444'
  const fillFrom = isPositive ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'
  const axisColor = isDark.value ? '#9ca3af' : '#999'
  const gridColor = isDark.value ? '#374151' : '#eee'
  const tooltipBg = isDark.value ? '#1f2937' : '#fff'
  const tooltipFg = isDark.value ? '#f3f4f6' : '#374151'

  return {
    chart: { type: 'area', backgroundColor: 'transparent', animation: { duration: 300 } },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      type: 'datetime',
      labels: { style: { fontSize: '12px', color: axisColor } },
      lineColor: gridColor,
      tickColor: gridColor,
    },
    yAxis: {
      title: { text: null },
      labels: {
        formatter: function () { return `$${this.value.toFixed(2)}` },
        style: { fontSize: '12px', color: axisColor },
      },
      gridLineDashStyle: 'Dash',
      gridLineColor: gridColor,
    },
    tooltip: {
      xDateFormat: '%Y/%m/%d',
      valuePrefix: '$',
      valueDecimals: 2,
      shared: true,
      backgroundColor: tooltipBg,
      style: { color: tooltipFg },
    },
    plotOptions: {
      area: {
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [[0, fillFrom], [1, 'rgba(255,255,255,0)']],
        },
        lineColor,
        lineWidth: 2,
        marker: { enabled: false },
      },
    },
    series: [{
      type: 'area',
      name: t('totalPrice'),
      data: chartSeries.value[0].data.map(d => [
        d.x instanceof Date ? d.x.getTime() : new Date(d.x).getTime(),
        d.y
      ]),
      color: lineColor,
    }],
  }
})

function calculateGrowthRate() {
  if (!chartSeries.value[0].data || chartSeries.value[0].data.length < 2) return null
  const firstPrice = chartSeries.value[0].data[0].y
  const lastPrice = chartSeries.value[0].data[chartSeries.value[0].data.length - 1].y
  change.value = lastPrice - firstPrice
  growthRate.value = (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2)
}

async function fetchChartData() {
  const { period1, period2 } = getPeriodRange(selectedPeriod.value)
  try {
    const data = await api.get(`/api/yahoo/holdings-chart?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}&period1=${period1}&period2=${period2}`)
    const lineData = data.map(item => ({ x: new Date(item.date), y: item.close }))
    chartSeries.value = [{ name: t('closePrice'), data: lineData }]
    calculateGrowthRate()
  } catch (e) {
    console.error('Error fetching total value chart data:', e)
  }
}

/* =========================
 *  Watchers & Init
 * =======================*/

// Prevent multiple simultaneous data loads
let isLoadingData = false;

watch(
  () => [auth.user?.uid, portfolioStore.currentPortfolio?.id],
  async ([uid, pid]) => {
    console.log('Dashboard Watch User or Portfolio changed, reloading data...', isLoadingData)
    if (uid && pid && !isLoadingData) {
      isLoadingData = true
      await loadData()
      isLoadingData = false
      selectedPeriod.value = '3mo'
    }
  },
  { immediate: true }
)

watch(() => transactionsStore.list, async () => {
  console.log('Dashboard Watch Transactions changed, reloading data...', isLoadingData)
  if (!isLoadingData) {
    isLoadingData = true
    await loadData()
    isLoadingData = false
  }
})

watch(selectedPeriod, (newVal, oldVal) => {
  if (newVal !== oldVal) fetchChartData()
})

if (auth.user) {
  loadData()
} else {
  console.log('No user is logged in')
}
</script>
