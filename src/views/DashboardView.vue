<template>
  <!-- px-4 sm:px-6 lg:px-8 -->
  <!--  max-w-screen-2xl -->
  <div class="w-full mt-4">

    <!-- Skeleton Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <Card class="rounded-xl shadow-md">
        <template #content>
          <div class="space-y-4 py-1">
            <div class="flex justify-between items-center gap-4">
              <Skeleton width="7rem" height="1rem" />
              <Skeleton width="16rem" height="1.5rem" borderRadius="999px" />
            </div>
            <div class="space-y-3">
              <Skeleton width="13rem" height="2.75rem" />
              <Skeleton width="10rem" height="1rem" />
            </div>
            <Skeleton width="100%" height="18rem" borderRadius="0.75rem" />
          </div>
        </template>
      </Card>

      <div class="grid grid-cols-12 gap-6 items-stretch">
        <div class="col-span-12 xl:col-span-8 space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card v-for="idx in skeletonStatCards.slice(0, 2)" :key="`skeleton-stat-${idx}`" class="rounded-xl shadow-md h-full">
              <template #content>
                <div class="space-y-3 py-2">
                  <Skeleton width="6rem" height="1rem" />
                  <Skeleton width="10rem" height="2rem" />
                  <Skeleton width="8rem" height="0.85rem" />
                </div>
              </template>
            </Card>
          </div>

          <Card class="rounded-xl shadow-md">
          <template #content>
            <div class="space-y-3 py-2">
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Skeleton v-for="idx in 3" :key="`skeleton-summary-${idx}`" width="100%" height="4.5rem" />
              </div>
            </div>
          </template>
          </Card>
        </div>

        <Card class="col-span-12 xl:col-span-4 rounded-xl shadow-md h-full">
          <template #content>
            <div class="space-y-4 py-1">
              <div class="flex justify-between items-center gap-4">
                <Skeleton width="8rem" height="1.5rem" borderRadius="999px" />
                <Skeleton width="6rem" height="1rem" />
              </div>
              <Skeleton width="100%" height="18rem" borderRadius="0.75rem" />
              <Skeleton width="100%" height="9rem" borderRadius="0.75rem" />
            </div>
          </template>
        </Card>
      </div>

      <Card class="mb-8 p-4">
        <template #content>
          <div class="space-y-3">
            <Skeleton width="12rem" height="1rem" />
            <div class="space-y-2">
              <div v-for="idx in skeletonTableRows" :key="`skeleton-row-${idx}`" class="grid grid-cols-5 gap-3 items-center">
                <Skeleton width="100%" height="1.25rem" />
                <Skeleton width="100%" height="1.25rem" />
                <Skeleton width="100%" height="1.25rem" />
                <Skeleton width="100%" height="1.25rem" />
                <Skeleton width="100%" height="1.25rem" />
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">

      <div class="grid grid-cols-12 gap-6 items-stretch">
        <!-- 總資產走勢圖 -->
        <div class="col-span-12 xl:col-span-8">
          <Card class="dashboard-panel dashboard-panel--hero h-full">
            <template #content>
              <!-- 第一列 -->
              <div>
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p class="dashboard-kicker">{{ $t('totalValue') }}</p>

                  <!-- 時間範圍選擇 -->
                  <div class="flex flex-wrap gap-2 sm:justify-end">
                    <button
                      v-for="option in timeRangeOptions"
                      :key="option.value"
                      type="button"
                      :aria-pressed="selectedPeriod === option.value"
                      class="rounded-lg px-3 py-1 text-xs font-bold transition-colors cursor-pointer"
                      :class="selectedPeriod === option.value
                        ? 'bg-[#25395c] text-white'
                        : 'bg-transparent text-slate-500 hover:bg-[var(--p-surface-variant)] dark:text-slate-300'"
                      @click="setSelectedPeriod(option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>

                <div class="min-w-0">
                  <!-- 總資產金額 -->
                  <div v-if="totalValue" class="mt-3 inline-flex max-w-full items-end gap-1 overflow-hidden leading-none">
                    <span class="truncate text-4xl font-black tracking-tight sm:text-5xl">{{ splitAmountForEmphasis(totalValue).main }}</span>
                    <span class="text-2xl font-semibold text-slate-400 dark:text-slate-500">{{ splitAmountForEmphasis(totalValue).fraction }}</span>
                    <span class="mb-1 text-xs font-semibold text-slate-400 dark:text-slate-500">{{ splitAmountForEmphasis(totalValue).code }}</span>
                  </div>
                  <div v-else class="mt-3 text-4xl font-black tracking-tight sm:text-5xl">--</div>

                  <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div
                      v-if="growthRateNumber !== null"
                      :class="growthRateNumber >= 0 ? 'text-emerald-500' : 'text-rose-500'"
                      class="inline-flex items-center gap-2 text-base font-semibold"
                    >
                      <span>{{ formatSignedNumber(growthRateNumber) }}%</span>
                      <!-- <span class="text-sm opacity-80">({{ formatSignedNumber(change) }})</span> -->
                    </div>
                    <div v-else class="inline-flex items-center gap-2 text-base font-semibold text-slate-400 dark:text-slate-500">
                      <span>--</span>
                      <span class="text-sm opacity-80">(--)</span>
                    </div>

                    <div class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      <span>{{ selectedPeriodLabel }}</span>
                      <span class="h-1 w-1 rounded-full bg-current opacity-40"></span>
                      <span>{{ chartWindowLabel }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 面積圖 -->
              <StockChart :options="areaChartOptions" :height="320" />
            </template>
          </Card>
        </div>

        <!-- 比例區塊 -->
        <div class="col-span-12 xl:col-span-4">
          <Card class="dashboard-panel dashboard-allocation-card h-full">
            <template #title>
              <div class="flex flex-wrap items-center justify-between gap-3">
                <SelectButton v-model="selectedPieType" :options="pieChartType" optionLabel="label" optionValue="value" size="small" :allowEmpty="false" />
                <button @click="$router.push('allocation')" class="text-sm font-semibold text-[var(--p-primary-color)] hover:underline">{{ $t('setTargets') }} ⭢</button>
              </div>
            </template>

            <template #content>
              <div v-if="holdingsStore.list.length > 0" class="dashboard-allocation-content py-2">
                <div v-if="selectedPieType === 'target' && !hasTargetAllocation" class="flex flex-col items-center text-center gap-3 py-8">
                  <img class="w-56 h-56 sm:w-64 sm:h-64" src="/src/assets/undraw_report_k55w.svg" alt="">
                  <h2 class="text-lg font-semibold">{{ $t('allocationNoSettings') }}</h2>
                </div>

                <div v-else class="dashboard-allocation-layout">
                  <div class="dashboard-allocation-figure">
                    <highcharts
                      :options="selectedAllocationChart"
                      class="dashboard-allocation-chart"
                    />

                    <div class="dashboard-allocation-total">
                      <span class="dashboard-allocation-total-label">{{ allocationSummary.label }}</span>
                      <span class="dashboard-allocation-total-value">{{ allocationSummary.value }}</span>
                    </div>
                  </div>

                  <div class="dashboard-allocation-list">
                    <div
                      v-for="item in selectedAllocationBreakdown"
                      :key="`${selectedPieType}-${item.key}`"
                      class="dashboard-allocation-item"
                    >
                      <div class="dashboard-allocation-item-main">
                        <span class="dashboard-allocation-dot" :style="{ backgroundColor: item.color }"></span>
                        <span class="dashboard-allocation-symbol">{{ item.name }}</span>
                      </div>
                      <span class="dashboard-allocation-percentage">{{ formatAllocationPercentage(item.percentage) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="flex flex-col items-center text-center gap-3 py-8">
                <img class="w-60 h-60 sm:w-80 sm:h-80" src="/src/assets/undraw_report_k55w.svg" alt="">
                <h2 class="text-lg sm:text-xl font-semibold">{{ $t('portfolioNoHoldingsTitle') }}</h2>
                <p class="text-sm sm:text-base text-gray-600">{{ $t('portfolioNoHoldingsDesc') }}</p>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- 個股資訊小卡 -->
      <section v-if="featuredHoldings.length" class="space-y-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardHoldingCard
            v-for="holding in featuredHoldings"
            :key="holding.id"
            :holding="holding"
          />
        </div>
      </section>

      <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card class="dashboard-panel dashboard-metric-card h-full">
              <template #content>
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="dashboard-kicker">{{ $t('totalProfit') }}</p>
                    <div v-if="totalProfit" class="mt-3 inline-flex items-end text-3xl font-bold tracking-tight">
                      <span>{{ splitAmountForEmphasis(totalProfit).main }}</span>
                      <span class="text-xl text-slate-400 dark:text-slate-500">{{ splitAmountForEmphasis(totalProfit).fraction }}</span>
                      <span class="ml-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">{{ splitAmountForEmphasis(totalProfit).code }}</span>
                    </div>
                    <div v-else class="mt-3 text-3xl font-bold tracking-tight">--</div>
                  </div>

                  <Button icon="pi pi-chart-line" rounded size="small" disabled />
                </div>

                <div class="dashboard-footnote mt-6">
                  {{ $t('roi') }}
                  <span v-if="annualReturn" :class="annualReturn >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                    {{ annualReturn.toFixed(2) }}%
                  </span>
                  <span v-else>--</span>
                </div>
              </template>
            </Card>

            <Card class="dashboard-panel dashboard-metric-card h-full">
              <template #content>
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="dashboard-kicker">{{ $t('irr') }}</p>
                    <div v-if="irr" class="mt-3 text-3xl font-bold tracking-tight text-[var(--p-primary-color)]">{{ irr }}%</div>
                    <div v-else class="mt-3 text-3xl font-bold tracking-tight text-slate-400">--</div>
                  </div>

                  <Button icon="pi pi-calendar" rounded size="small" disabled />
                </div>

                <div class="dashboard-footnote mt-6 flex items-center gap-2">
                  <i class="pi pi-info-circle" v-tooltip.bottom="$t('xirrHint')" />
                  <span>{{ $t('xirrHint') }}</span>
                </div>
              </template>
            </Card>
          </div>
      </div>

      <!-- Holdings Table -->
      <Card class="dashboard-panel dashboard-table-panel mb-8 p-4">
      <template #content>
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <p class="dashboard-kicker">{{ $t('currentAsset') }}</p>
            <h2 class="mt-1 text-lg font-semibold">{{ $t('holdings') }}</h2>
          </div>

          <button
            type="button"
            class="text-sm font-semibold text-[var(--p-primary-color)] hover:underline"
            @click="$router.push('/portfolio/holdings')"
          >
            {{ $t('holdings') }} ⭢
          </button>
        </div>

        <DataTable :value="holdingsStore.list" :loading="isLoading" sortField="currentValue" :sortOrder="-1" dataKey="id" tableStyle="min-width: 50rem" rowHover>
          <Column field="name" :header="$t('currentAsset')">
            <template #body="{ data }">
              <div @click="() => $router.push({ name: 'asset', params: { symbol: data.symbol } })"
                  class="flex items-center cursor-pointer p-2 rounded-md truncate hover:text-[var(--p-primary-color)]"
                  :style="{ width: '300px', minWidth: '250px' }">
                <StockIcon :symbol="data.symbol" class="mr-8" />
                <div class="truncate">
                  <span class="font-medium">{{ data.symbol }}</span>
                  <div class="text-sm text-[var(--p-card-subtitle-color)] mt-1">{{ data.name }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="currentPrice" :header="$t('currentPrice')" sortable>
            <template #body="{ data }">
              <div class="font-medium mr-4 inline-flex items-end">
                <span>{{ splitNativePriceWithCode(data.nativeCurrentPrice, data.currency).main }}</span>
                <span>{{ splitNativePriceWithCode(data.nativeCurrentPrice, data.currency).fraction }}</span>
                <span class="ml-1 text-[10px] pb-0.5 font-semibold text-[var(--p-text-muted-color)]">{{ splitNativePriceWithCode(data.nativeCurrentPrice, data.currency).code }}</span>
              </div>
            </template>
          </Column>

          <Column field="shares" :header="$t('shares')" sortable>
            <template #body="{ data }">
              <span class="font-medium mr-4">{{ data.shares }}</span>
            </template>
          </Column>
          <Column field="totalCost" :header="$t('totalCost')" sortable>
            <template #body="{ data }">
              <div
                v-tooltip.top="formatAvgCostTooltip(data.avgCost)"
                class="font-medium mr-4 inline-flex items-end cursor-help"
              >
                <span>{{ splitAmountWithCode(data.totalCost).main }}</span>
                <span>{{ splitAmountWithCode(data.totalCost).fraction }}</span>
                <span class="ml-1 text-[10px] pb-0.5 font-semibold text-[var(--p-text-muted-color)]">{{ splitAmountWithCode(data.totalCost).code }}</span>
              </div>
            </template>
          </Column>

          <Column field="currentValue" :header="$t('totalValue')" sortable>
            <template #body="{ data }">
              <div class="font-medium mr-4 inline-flex items-end">
                <span>{{ splitAmountWithCode(data.currentValue).main }}</span>
                <span>{{ splitAmountWithCode(data.currentValue).fraction }}</span>
                <span class="ml-1 text-[10px] pb-0.5 font-semibold text-[var(--p-text-muted-color)]">{{ splitAmountWithCode(data.currentValue).code }}</span>
              </div>
              <div :class="{ 'text-emerald-600': data.profitPercentage >= 0, 'text-[#f27362]': data.profitPercentage < 0 }">
                <div class="flex items-center gap-1 font-bold text-sm">
                  <!-- <i v-if="data.profitPercentage >= 0" class="pi pi-sort-up-fill"></i>
                  <i v-else class="pi pi-sort-down-fill"></i> -->
                  
                  <!-- <i v-if="data.profitPercentage >= 0" class="fas fa-arrow-right -rotate-90"></i>
                  <i v-else class="fas fa-arrow-right rotate-90"></i> -->

                  <!-- <span v-if="data.profitPercentage >= 0">+</span>
                  <span v-else>-</span> -->
                  <span>{{ Math.abs(data.profitPercentage) }}%</span>

                  <i v-if="data.profitPercentage >= 0" class="fas fa-arrow-right -rotate-45"></i>
                  <i v-else class="fas fa-arrow-right rotate-45"></i>
                </div>
              </div>
            </template>
          </Column>

          <Column field="currentValue" :header="$t('rate')">
            <template #body="{ data }">
              <div class="dashboard-weight-cell">
                <div class="dashboard-weight-track" aria-hidden="true">
                  <div class="dashboard-weight-fill" :style="getHoldingWeightBarStyle(data)"></div>
                </div>
                <span class="dashboard-weight-value">{{ formatAllocationPercentage(getHoldingWeightPercentage(data)) }}</span>
              </div>
            </template>
          </Column>

          <template #empty>
            <NoData />
          </template>
        </DataTable>
      </template>
      </Card>
    </div>
  </div>
</template>


<script setup>
/* =========================
 *  Imports & Stores
 * =======================*/
import { ref, watch, computed } from 'vue'
import SelectButton from 'primevue/selectbutton'
import Skeleton from 'primevue/skeleton'
import StockIcon from '@/components/StockIcon.vue'
import StockChart from '@/components/StockChart.vue'
import DashboardHoldingCard from '@/components/DashboardHoldingCard.vue'
import api from '@/utils/api'
import xirr from 'xirr'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
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
const { formatAmount, formatAmountWithCode, formatChange, formatPrice, formatPriceWithCode, currencySymbol, convertAmountFromCurrency } = useCurrency()

import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'
const settingsStore = useSettingsStore()
const { displayCurrency } = storeToRefs(settingsStore)

/* =========================
 *  State
 * =======================*/
const isLoading = ref(false)
const skeletonStatCards = [1, 2, 3]
const skeletonTableRows = [1, 2, 3, 4, 5, 6]

const allocation = ref([])
const dividends = ref([])

const totalValue = computed(() => {
  return holdingsStore.list.reduce((sum, h) => sum + h.currentValue, 0)
})
const totalProfit = computed(() => {
  return holdingsStore.list.reduce((sum, h) => sum + (h.currentValue - h.avgCost * h.shares), 0)
})
const featuredHoldings = computed(() => {
  return [...holdingsStore.list]
    .sort((left, right) => right.currentValue - left.currentValue)
    .slice(0, 4)
})

const selectedPieType = ref('actual')
const pieChartType = computed(() => ([
  { label: t('actualAllocation'), value: 'actual' },
  { label: t('targetAllocation'), value: 'target' }
]))

// 配置比例色票
const allocationPalette = ['#3b82f6', '#14b8a6', '#f59e0b', '#f97316']

const timeRangeOptions = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1mo' },
  { label: '6M', value: '6mo' },
  { label: 'YTD', value: 'ytd' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
]

const selectedPeriod = ref('1mo')

const chartSeries = ref([{ name: t('totalPrice'), data: [] }])
const growthRate = ref(null)
const change = ref(0)
const periodLabelMap = {
  '1d': '1D',
  '1w': '1W',
  '7d': '7D',
  '1mo': '1M',
  '3mo': '3M',
  '6mo': '6M',
  ytd: 'YTD',
  '1y': '1Y',
  '5y': '5Y',
}

const selectedPeriodLabel = computed(() => {
  return timeRangeOptions.find(option => option.value === selectedPeriod.value)?.label
    || periodLabelMap[selectedPeriod.value]
    || String(selectedPeriod.value || '').toUpperCase()
})

const recentTradingDayPointCount = 2
const growthRateNumber = computed(() => {
  const n = Number(growthRate.value)
  return Number.isFinite(n) ? n : null
})
const chartWindowLabel = computed(() => {
  if (startDate.value && endDate.value) return `${startDate.value} - ${endDate.value}`
  return selectedPeriodLabel.value
})

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

function splitAmountForEmphasis(value) {
  const fractionDigits = displayCurrency.value === 'TWD' ? 0 : 2
  const formatted = formatAmount(value, {
    showSymbol: false,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })

  if (formatted === '--') {
    return { main: '--', fraction: '', code: displayCurrency.value }
  }

  const match = formatted.match(/^(.*?)([.,]\d+)?$/)
  if (!match) {
    return { main: formatted, fraction: '', code: displayCurrency.value }
  }

  return {
    main: match[1] || formatted,
    fraction: match[2] || '',
    code: displayCurrency.value,
  }
}

function splitAmountWithCode(value, mode = 'amount') {
  const formatted = mode === 'price' ? formatPriceWithCode(value) : formatAmountWithCode(value)
  if (formatted === '--') {
    return { main: '--', fraction: '', code: displayCurrency.value }
  }

  const match = formatted.match(/^(.*?)([.,]\d+)?\s([A-Z]{3})$/)
  if (!match) {
    return { main: formatted, fraction: '', code: displayCurrency.value }
  }

  return {
    main: match[1] || formatted,
    fraction: match[2] || '',
    code: match[3] || displayCurrency.value,
  }
}

function formatAvgCostTooltip(value) {
  const formatted = formatPriceWithCode(value)
  if (formatted === '--') {
    return '--'
  }

  return `${formatted} ${t('perShare')}`
}

function splitNativePriceWithCode(value, currency) {
  const amount = Number(value)
  const code = String(currency || 'USD').toUpperCase()

  if (value == null || Number.isNaN(amount)) {
    return { main: '--', fraction: '', code }
  }

  const formatted = amount.toLocaleString(code === 'TWD' ? 'zh-TW' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const match = formatted.match(/^(.*?)([.,]\d+)?$/)
  if (!match) {
    return { main: formatted, fraction: '', code }
  }

  return {
    main: match[1] || formatted,
    fraction: match[2] || '',
    code,
  }
}

function formatSignedNumber(value, digits = 2) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '--'
  const sign = n >= 0 ? '+' : '-'
  return `${sign}${Math.abs(n).toFixed(digits)}`
}

function formatAllocationPercentage(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '--'

  const digits = Math.abs(n - Math.round(n)) < 0.05 ? 0 : 1
  return `${n.toFixed(digits)}%`
}

function getHoldingWeightPercentage(holding) {
  const portfolioTotal = Number(totalValue.value)
  const holdingValue = Number(holding?.currentValue)

  if (!Number.isFinite(portfolioTotal) || portfolioTotal <= 0 || !Number.isFinite(holdingValue)) {
    return 0
  }

  return (holdingValue / portfolioTotal) * 100
}

function getHoldingWeightBarStyle(holding) {
  const percentage = Math.max(0, Math.min(getHoldingWeightPercentage(holding), 100))

  return {
    width: `${percentage}%`,
  }
}

function getAllocationTargetValue(item) {
  return Number(item?.target ?? item?.target_percentage ?? item?.percentage ?? 0)
}

function formatCompactAmount(value) {
  return formatAmount(value, {
    compact: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: displayCurrency.value === 'TWD' ? 0 : 1,
  })
}

function buildAllocationBreakdown(items, mapItem) {
  const normalized = items
    .map(mapItem)
    .filter(item => Number.isFinite(item.value) && item.value > 0)
    .sort((a, b) => b.value - a.value)

  const primaryItems = normalized.slice(0, 3).map((item, index) => ({
    ...item,
    color: allocationPalette[index] || allocationPalette[allocationPalette.length - 1],
  }))

  const remainingItems = normalized.slice(3)
  if (!remainingItems.length) return primaryItems

  primaryItems.push({
    key: 'others',
    name: locale.value.startsWith('zh') ? '其他' : 'Others',
    value: remainingItems.reduce((sum, item) => sum + item.value, 0),
    percentage: remainingItems.reduce((sum, item) => sum + item.percentage, 0),
    amount: remainingItems.reduce((sum, item) => sum + item.amount, 0),
    color: allocationPalette[3],
  })

  return primaryItems
}

function setSelectedPeriod(nextPeriod) {
  if (selectedPeriod.value === nextPeriod) return
  selectedPeriod.value = nextPeriod
}

function setChartWindowFromPoints(points) {
  if (!points.length) {
    startDate.value = ''
    endDate.value = ''
    return
  }

  const localeCode = locale.value || 'en'
  const firstPoint = points[0].x instanceof Date ? points[0].x : new Date(points[0].x)
  const lastPoint = points[points.length - 1].x instanceof Date ? points[points.length - 1].x : new Date(points[points.length - 1].x)

  startDate.value = formatStrDate(formatDate(firstPoint), localeCode)
  endDate.value = formatStrDate(formatDate(lastPoint), localeCode)
}

function normalizeChartDataForPeriod(points, range) {
  if (range !== '1d') return points
  return points.slice(-recentTradingDayPointCount)
}

const startDate = ref('')
const endDate = ref('')

function getPeriodRange(range) {
  const today = new Date()
  const e = formatDate(today)
  const localeCode = locale.value || 'en'

  const daysMap = { '1d': 7, '1w': 7, '7d': 7, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365, '2y': 730, '5y': 1825 }
  if (range === 'ytd') {
    const start = new Date(today.getFullYear(), 0, 1)
    startDate.value = formatStrDate(formatDate(start), localeCode)
    endDate.value = formatStrDate(e, localeCode)
    return { period1: formatDate(start), period2: e }
  }
  const days = daysMap[range] || 30
  const start = new Date()
  start.setDate(start.getDate() - days)
  startDate.value = formatStrDate(formatDate(start), localeCode)
  endDate.value = formatStrDate(e, localeCode)
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
const actualAllocationBreakdown = computed(() => {
  const total = totalValue.value || 0

  return buildAllocationBreakdown(holdingsStore.list, holding => {
    const amount = Number(holding.currentValue)
    const percentage = total > 0 ? (amount / total) * 100 : 0

    return {
      key: holding.symbol,
      name: holding.symbol,
      value: amount,
      percentage,
      amount,
    }
  })
})

const targetAllocationBreakdown = computed(() => {
  const total = totalValue.value || 0

  return buildAllocationBreakdown(allocation.value || [], item => {
    const percentage = getAllocationTargetValue(item)

    return {
      key: item.symbol,
      name: item.symbol,
      value: percentage,
      percentage,
      amount: total * (percentage / 100),
    }
  })
})

const hasTargetAllocation = computed(() => targetAllocationBreakdown.value.length > 0)

const selectedAllocationBreakdown = computed(() => {
  return selectedPieType.value === 'actual'
    ? actualAllocationBreakdown.value
    : targetAllocationBreakdown.value
})

const allocationSummary = computed(() => {
  if (selectedPieType.value === 'actual') {
    return {
      label: t('totalValue'),
      value: formatCompactAmount(totalValue.value),
    }
  }

  const targetTotal = targetAllocationBreakdown.value.reduce((sum, item) => sum + item.percentage, 0)
  return {
    label: t('target'),
    value: formatAllocationPercentage(targetTotal),
  }
})

const selectedAllocationChart = computed(() => ({
  chart: {
    type: 'pie',
    backgroundColor: 'transparent',
    spacing: [0, 0, 0, 0],
    height: 260,
    animation: { duration: 350 },
  },
  title: { text: null },
  credits: { enabled: false },
  accessibility: { enabled: false },
  legend: { enabled: false },
  tooltip: {
    useHTML: true,
    borderWidth: 0,
    shadow: false,
    backgroundColor: isDark.value ? '#111b31' : '#ffffff',
    style: { color: isDark.value ? '#f8fafc' : '#0f172a' },
    formatter: function () {
      const custom = this.point?.options?.custom || {}
      const amount = Number(custom.amount)
      const percentage = Number(custom.percentage)
      const secondaryLabel = selectedPieType.value === 'actual' ? t('chartValue') : t('totalValue')

      return `
        <div style="min-width: 120px; font-size: 12px; line-height: 1.5;">
          <div style="font-weight: 700; margin-bottom: 2px;">${this.point.name}</div>
          <div style="font-weight: 600;">${formatAllocationPercentage(percentage)}</div>
          <div style="opacity: 0.75;">${secondaryLabel}: ${formatCompactAmount(amount)}</div>
        </div>
      `
    },
  },
  plotOptions: {
    pie: {
      innerSize: '78%',
      size: '100%',
      borderWidth: 4,
      borderColor: isDark.value ? '#0f172a' : '#ffffff',
      slicedOffset: 0,
      dataLabels: { enabled: false },
      showInLegend: false,
      states: {
        hover: {
          halo: { size: 0 },
        },
      },
    },
  },
  series: [{
    type: 'pie',
    name: selectedPieType.value === 'actual' ? t('actualAllocation') : t('targetAllocation'),
    data: selectedAllocationBreakdown.value.map(item => ({
      name: item.name,
      y: item.value,
      color: item.color,
      custom: {
        amount: item.amount,
        percentage: item.percentage,
      },
    })),
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

  transactionsStore.list.forEach(tx => {
    let amount
    if (tx.transactionType === 'buy') {
      amount = -(tx.price * tx.shares + tx.fee)
    } else {
      amount = tx.price * tx.shares - tx.fee
    }
    cashflows.push({ amount: convertAmountFromCurrency(amount, tx.currency), when: new Date(tx.date) })
  })
  
  // Dividend cash inflow
  dividends.value.forEach(d => {
    cashflows.push({ amount: parseFloat(d.totalAmount), when: new Date(d.date) })
  })
  
  // Current holdings treated as terminal cash inflow today
  cashflows.push({ amount: holdingsStore.list.reduce((s, h) => s + h.currentValue, 0), when: new Date() })

  try {
    const rate = xirr(cashflows)
    return (rate * 100).toFixed(2)
  } catch (e) {
    console.error('Error calculating XIRR:', e)
    return 'N/A'
  }
})

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
  const lineColor = 'var(--p-primary-color)'
  const fillFrom = 'color-mix(in srgb, var(--p-primary-color) 35%, transparent)'
  const axisColor = isDark.value ? '#9ca3af' : '#999'
  const gridColor = isDark.value ? '#374151' : '#eee'
  const tooltipBg = isDark.value ? '#1f2937' : '#fff'
  const tooltipFg = isDark.value ? '#f3f4f6' : '#374151'
  const yValues = chartSeries.value[0].data
    .map(d => Number(d.y))
    .filter(v => Number.isFinite(v))
  const yMin = yValues.length ? Math.min(...yValues) : null
  const yMax = yValues.length ? Math.max(...yValues) : null
  const yRange = yMin !== null && yMax !== null ? yMax - yMin : 0
  const yPadding = yMin !== null && yMax !== null
    ? (yRange > 0 ? yRange * 0.08 : Math.max(Math.abs(yMax), 1) * 0.02)
    : 0
  const chartLocale = locale.value.startsWith('zh') ? 'zh-TW' : 'en-US'
  const chartDateFormatter = new Intl.DateTimeFormat(
    chartLocale,
    locale.value.startsWith('zh')
      ? { month: 'numeric', day: 'numeric' }
      : { month: 'short', day: 'numeric' }
  )

  return {
    chart: { type: 'area', backgroundColor: 'transparent', animation: { duration: 300 } },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      type: 'datetime',
      labels: {
        formatter: function () {
          return chartDateFormatter.format(new Date(this.value))
        },
        style: { fontSize: '12px', color: axisColor }
      },
      lineColor: gridColor,
      tickColor: gridColor,
    },
    yAxis: {
      title: { text: null },
      min: yMin !== null ? yMin - yPadding : undefined,
      max: yMax !== null ? yMax + yPadding : undefined,
      startOnTick: false,
      endOnTick: false,
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
        threshold: null,
        softThreshold: false,
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
  if (!chartSeries.value[0].data || chartSeries.value[0].data.length < 2) {
    growthRate.value = null
    change.value = 0
    return null
  }
  const firstPrice = chartSeries.value[0].data[0].y
  const lastPrice = chartSeries.value[0].data[chartSeries.value[0].data.length - 1].y
  change.value = lastPrice - firstPrice
  growthRate.value = Number((((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2))
}

async function fetchChartData() {
  if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id || holdingsStore.list.length === 0) {
    chartSeries.value = [{ name: t('totalPrice'), data: [] }]
    growthRate.value = null
    change.value = 0
    startDate.value = ''
    endDate.value = ''
    return
  }

  const { period1, period2 } = getPeriodRange(selectedPeriod.value)
  try {
    const data = await api.get(`/api/yahoo/holdings-chart?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}&period1=${period1}&period2=${period2}`)
    const lineData = data.map(item => ({ x: new Date(item.date), y: item.close }))
    const normalizedLineData = normalizeChartDataForPeriod(lineData, selectedPeriod.value)

    chartSeries.value = [{ name: t('closePrice'), data: normalizedLineData }]
    setChartWindowFromPoints(normalizedLineData)
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
    }
  },
  { immediate: true }
)

watch(() => transactionsStore.list, async () => {
  console.log('Dashboard Watch Transactions changed, reloading data...', isLoadingData)
  if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id || isLoadingData || transactionsStore.isLoading) {
    return
  }

  await fetchChartData()
})

watch(selectedPeriod, (newVal, oldVal) => {
  if (newVal !== oldVal) fetchChartData()
})

watch(locale, () => {
  getPeriodRange(selectedPeriod.value)
})
</script>

<style scoped>
.dashboard-panel {
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 82%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--p-content-background) 94%, transparent), color-mix(in srgb, var(--p-content-background) 86%, transparent));
  box-shadow: 0 18px 36px rgba(10, 14, 24, 0.08);
}

.dashboard-panel--hero {
  overflow: hidden;
}

.dashboard-kicker {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--p-text-muted-color);
}

.dashboard-footnote {
  font-size: 0.88rem;
  color: var(--p-text-muted-color);
}

.dashboard-summary-strip {
  overflow: hidden;
}

.dashboard-allocation-card :deep(.p-card),
.dashboard-allocation-card :deep(.p-card-body) {
  height: 100%;
}

.dashboard-allocation-card :deep(.p-card-body) {
  display: flex;
  flex-direction: column;
}

.dashboard-allocation-card :deep(.p-card-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.dashboard-allocation-card :deep(.p-card-title) {
  margin-bottom: 0;
}

.dashboard-allocation-content {
  display: flex;
  flex: 1;
}

.dashboard-allocation-card :deep(.highcharts-container),
.dashboard-allocation-card :deep(.highcharts-root) {
  overflow: visible !important;
}

.dashboard-allocation-card :deep(.highcharts-background) {
  fill: transparent;
}

.dashboard-allocation-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.dashboard-allocation-layout {
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(10.5rem, 13rem);
  justify-content: center;
  align-items: center;
  align-content: center;
  gap: 1.5rem;
  min-height: 100%;
  width: 100%;
  flex: 1;
}

.dashboard-allocation-figure {
  position: relative;
  width: min(100%, 240px);
  margin-inline: auto;
}

.dashboard-allocation-chart {
  display: block;
  width: 100%;
  height: 260px;
}

.dashboard-allocation-total {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  pointer-events: none;
}

.dashboard-allocation-total-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--p-text-muted-color);
}

.dashboard-allocation-total-value {
  margin-top: 0.35rem;
  max-width: 7rem;
  font-size: 1.125rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--p-text-color);
}

.dashboard-allocation-list {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.85rem;
  width: min(100%, 13rem);
}

.dashboard-allocation-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dashboard-allocation-item-main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.55rem;
}

.dashboard-allocation-dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 999px;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--p-content-background) 55%, transparent);
}

.dashboard-allocation-symbol {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--p-text-color);
}

.dashboard-allocation-percentage {
  margin-left: auto;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--p-text-muted-color);
}

.dashboard-summary-item {
  position: relative;
  padding-right: 1rem;
}

.dashboard-summary-item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 0.25rem;
  right: 0;
  width: 1px;
  height: calc(100% - 0.5rem);
  background: color-mix(in srgb, var(--p-content-border-color) 76%, transparent);
}

.dashboard-table-panel :deep(.p-datatable-header-cell) {
  white-space: nowrap;
}

.dashboard-weight-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 6.75rem;
}

.dashboard-weight-track {
  position: relative;
  width: 5rem;
  flex: none;
  height: 0.42rem;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--p-primary-color) 18%, var(--p-surface-200));
}

.dashboard-weight-fill {
  height: 100%;
  min-width: 0.35rem;
  border-radius: inherit;
  background: linear-gradient(90deg, color-mix(in srgb, var(--p-primary-color) 88%, white 12%), var(--p-primary-color));
}

.dashboard-weight-value {
  min-width: 2.8rem;
  text-align: right;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--p-text-muted-color);
}

@media (max-width: 639px) {
  .dashboard-allocation-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .dashboard-allocation-list {
    width: min(100%, 18rem);
    margin-inline: auto;
  }

  .dashboard-summary-item {
    padding-right: 0;
    padding-bottom: 1rem;
  }

  .dashboard-summary-item:not(:last-child)::after {
    top: auto;
    right: auto;
    bottom: 0;
    width: 100%;
    height: 1px;
  }
}
</style>
