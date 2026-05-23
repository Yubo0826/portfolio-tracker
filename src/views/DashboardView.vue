<template>
  <!-- px-4 sm:px-6 lg:px-8 -->
  <!--  max-w-screen-2xl -->
  <div class="w-full mt-4">

    <!-- Skeleton Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card v-for="idx in skeletonStatCards" :key="`skeleton-stat-${idx}`" class="rounded-xl shadow-md">
          <template #content>
            <div class="space-y-3 py-2">
              <Skeleton width="6rem" height="1rem" />
              <Skeleton width="10rem" height="2rem" />
              <Skeleton width="8rem" height="0.85rem" />
            </div>
          </template>
        </Card>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <Card class="w-full lg:w-3/5">
          <template #content>
            <div class="space-y-4 py-1">
              <div class="flex justify-between items-center gap-4">
                <Skeleton width="7rem" height="1rem" />
                <Skeleton width="9rem" height="1.5rem" borderRadius="999px" />
              </div>
              <Skeleton width="100%" height="18rem" borderRadius="0.75rem" />
            </div>
          </template>
        </Card>

        <Card class="w-full lg:w-2/5">
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
      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-12 xl:col-span-8 space-y-6">
          <Card class="dashboard-panel dashboard-panel--hero">
            <template #content>
              <div class="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0">
                  <p class="dashboard-kicker">{{ $t('totalValue') }}</p>
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
                      <span class="text-sm opacity-80">({{ formatSignedNumber(change) }})</span>
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

                <SelectButton
                  v-model="selectedPeriod"
                  :options="periods"
                  optionLabel="label"
                  optionValue="value"
                  size="small"
                  :allowEmpty="false"
                />
              </div>

              <StockChart :options="areaChartOptions" :height="320" />
            </template>
          </Card>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card class="dashboard-panel dashboard-metric-card">
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

            <Card class="dashboard-panel dashboard-metric-card">
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

          <Card class="dashboard-panel dashboard-summary-strip">
            <template #content>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div class="dashboard-summary-item">
                  <p class="dashboard-kicker">{{ $t('holdings') }}</p>
                  <p class="mt-2 text-2xl font-bold">{{ holdingsStore.list.length }}</p>
                </div>
                <div class="dashboard-summary-item">
                  <p class="dashboard-kicker">{{ $t('rebalance') }}</p>
                  <p class="mt-2 text-2xl font-bold">{{ rebalanceRows.length }}</p>
                </div>
                <div class="dashboard-summary-item">
                  <p class="dashboard-kicker">{{ $t('date') }}</p>
                  <p class="mt-2 text-base font-semibold leading-relaxed text-[var(--p-text-color)]">{{ chartWindowLabel }}</p>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <div class="col-span-12 xl:col-span-4">
          <Card class="dashboard-panel h-full">
          <template #title>
            <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
              <SelectButton v-model="selectedPieType" :options="pieChartType" optionLabel="label" optionValue="value" size="small" :allowEmpty="false" />
              <button @click="$router.push('allocation')" class="text-sm font-semibold text-[var(--p-primary-color)] hover:underline">{{ $t('setTargets') }} ⭢</button>
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
              class="w-full mx-auto rounded-2xl border border-[var(--p-content-border-color)] bg-[var(--p-content-background)] p-5 mt-auto"
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

              <div class="divide-y divide-[var(--p-content-border-color)] overflow-auto height-[155px]">
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

          <Column field="target" :header="$t('rate')" sortable>
            <template #body="{ data }">
              <span class="font-medium mr-4">{{ ((data.currentValue / totalValue) * 100).toFixed(1) }}%</span>
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

const selectedPieType = ref('actual')
const pieChartType = computed(() => ([
  { label: t('actualAllocation'), value: 'actual' },
  { label: t('targetAllocation'), value: 'target' }
]))

const selectedPeriod = ref('3mo')

const periods = computed(() => ([
  { label: t('period7d'), value: '7d' },
  { label: t('period1mo'), value: '1mo' },
  { label: t('period3mo'), value: '3mo' },
  { label: t('period6mo'), value: '6mo' },
  { label: t('periodYTD'), value: 'ytd' },
  { label: t('period1y'), value: '1y' },
  { label: t('period5y'), value: '5y' }
]))

const chartSeries = ref([{ name: t('totalPrice'), data: [] }])
const growthRate = ref(null)
const change = ref(0)
const periodLabelMap = {
  '7d': '7D',
  '1mo': '1M',
  '3mo': '3M',
  '6mo': '6M',
  ytd: 'YTD',
  '1y': '1Y',
  '5y': '5Y',
}

const selectedPeriodLabel = computed(() => periodLabelMap[selectedPeriod.value] || String(selectedPeriod.value || '').toUpperCase())
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

const startDate = ref('')
const endDate = ref('')

function getPeriodRange(range) {
  const today = new Date()
  const e = formatDate(today)
  const localeCode = locale.value || 'en'

  const daysMap = { '7d': 7, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365, '2y': 730, '5y': 1825 }
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
const sortedAllocation = computed(() => {
  const holdingSymbols = holdingsStore.list.map(h => h.symbol)
  const allocationList = allocation.value || []

  return [...allocationList].sort((a, b) => {
    const indexA = holdingSymbols.indexOf(a.symbol)
    const indexB = holdingSymbols.indexOf(b.symbol)

    // 銝 holdings 鋆∠??曉???
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1

    // 靘?holdings ????
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
      dataLabels: {
        enabled: true,
        format: '<b>{point.name}</b><br>{point.percentage:.1f}%',
        distance: 18,
        style: {
          fontSize: '12px',
          fontWeight: '600',
          color: isDark.value ? '#d1d5db' : '#374151',
          textOutline: 'none',
        },
        connectorColor: isDark.value ? '#6b7280' : '#9ca3af',
      },
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
    pointFormat: `{series.name}: <b>{point.percentage:.1f}%</b><br/>${t('chartValue')}: ${currencySymbol.value}` + '{point.y:.2f}',
    backgroundColor: isDark.value ? '#1f2937' : '#fff',
    style: { color: isDark.value ? '#f3f4f6' : '#374151' },
  },
  series: [{
    name: t('holdings'),
    data: [...holdingsStore.list]
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 5)
      .map(h => ({ name: h.symbol, y: h.currentValue })),
  }],
}))

const allocationChart = computed(() => ({
  chart: { type: 'pie', backgroundColor: 'transparent' },
  title: { text: null },
  credits: { enabled: false },
  plotOptions: {
    pie: {
      innerSize: '50%',
      dataLabels: {
        enabled: true,
        format: '<b>{point.name}</b><br>{point.percentage:.1f}%',
        distance: 18,
        style: {
          fontSize: '12px',
          fontWeight: '600',
          color: isDark.value ? '#d1d5db' : '#374151',
          textOutline: 'none',
        },
        connectorColor: isDark.value ? '#6b7280' : '#9ca3af',
      },
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
    pointFormat: `{series.name}: <b>{point.percentage:.1f}%</b><br/>${t('target')}: {point.y}%`,
    backgroundColor: isDark.value ? '#1f2937' : '#fff',
    style: { color: isDark.value ? '#f3f4f6' : '#374151' },
  },
  series: [{
    name: t('allocation'),
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

@media (max-width: 639px) {
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
