<template>
  <!-- px-4 sm:px-6 lg:px-8 -->
  <!--  max-w-screen-2xl -->
  <div class="w-full">
    <Teleport defer to="#page-title-aside">
      <span v-if="pricesUpdatedAt">{{ t('lastUpdated', { time: formatUpdatedAt(pricesUpdatedAt) }) }}</span>
    </Teleport>

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
          <Card class="app-panel dashboard-panel--hero h-full">
            <template #content>
              <div>
                <div class="flex items-center justify-between">
                  <div class="flex flex-col mb-2">
                    <p class="dashboard-kicker">{{ $t('totalValue') }}</p>

                    <div class="mt-1 flex flex-wrap items-end gap-2">
                      <div v-if="totalValue" class="max-w-full truncate text-4xl font-bold inline-flex items-end">
                        <span>{{ splitAmountForEmphasis(totalValue).main }}</span>
                        <span>{{ splitAmountForEmphasis(totalValue).fraction }}</span>
                        <span class="ml-1 text-[10px] leading-none pb-1 font-semibold text-muted-color">{{ splitAmountForEmphasis(totalValue).code }}</span>
                      </div>
                      <div v-else class="text-4xl font-bold">--</div>

                      <div
                        v-if="growthRateNumber !== null"
                        class="inline-flex items-center gap-2 pb-1"
                      >
                        <span
                          class="asset-growth-pill"
                          :class="growthRateNumber >= 0 ? 'asset-growth-pill--up' : 'asset-growth-pill--down'"
                        >
                          <i :class="growthRateNumber >= 0 ? 'pi pi-arrow-up-right' : 'pi pi-arrow-down-right'"></i>
                          {{ formatSignedNumber(growthRateNumber) }}%
                          <span>({{ formatSignedNumber(change) }})</span>
                        </span>
                        <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">{{ selectedPeriodLabel }}</span>
                      </div>

                      <div v-else class="inline-flex items-center gap-2 pb-1 text-lg text-muted-color">
                        <span>--</span>
                        <span>(--)</span>
                        <span class="text-xs font-semibold uppercase tracking-wide">{{ selectedPeriodLabel }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 面積圖 -->
                <div class="mt-2">
                  <StockChart :options="areaChartOptions" :height="320" />
                </div>

                <!-- 時間範圍選擇 -->
                <SelectButton
                  v-model="selectedPeriod"
                  :options="timeRangeOptionsWithGrowth"
                  optionLabel="label"
                  optionValue="value"
                  :allowEmpty="false"
                  fluid
                  class="mt-4"
                >
                  <template #option="{ option }">
                    <div class="flex flex-col items-center text-xs font-bold">
                      <span>{{ option.label }}</span>
                      <span :class="option.growth === null ? 'text-muted-color' : option.growth >= 0 ? 'text-green-600' : 'text-red-600'">
                        {{ option.growth === null ? '--' : `${formatSignedNumber(option.growth)}%` }}
                      </span>
                    </div>
                  </template>
                </SelectButton>
              </div>
            </template>
          </Card>
        </div>

        <!-- 損益資訊小卡 -->
        <div class="col-span-12 xl:col-span-4 flex flex-col gap-4">
          <Card class="app-panel dashboard-metric-card flex-1">
            <template #content>
              <p class="dashboard-kicker">{{ $t('unrealizedProfit') }}</p>
              <div v-if="totalProfit" class="mt-2 inline-flex items-end text-xl font-bold tracking-tight">
                <span>{{ splitAmountForEmphasis(totalProfit).main }}</span>
                <span class="text-sm text-muted-color">{{ splitAmountForEmphasis(totalProfit).fraction }}</span>
                <span class="ml-1 text-[10px] font-semibold text-muted-color">{{ splitAmountForEmphasis(totalProfit).code }}</span>
              </div>
              <div v-else class="mt-2 text-xl font-bold tracking-tight">--</div>

              <div class="dashboard-footnote mt-3">
                {{ $t('roi') }}
                <span v-if="totalReturn" :class="totalReturn >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                  {{ totalReturn.toFixed(2) }}%
                </span>
                <span v-else>--</span>
              </div>
            </template>
          </Card>

          <Card class="app-panel dashboard-metric-card flex-1">
            <template #content>
              <p class="dashboard-kicker flex items-center gap-1.5">
                {{ $t('realizedProfit') }}
                <i class="pi pi-info-circle text-[0.7rem] normal-case tracking-normal" v-tooltip.bottom="$t('realizedProfitHint')" />
              </p>
              <div v-if="realizedProfit" class="mt-2 inline-flex items-end text-xl font-bold tracking-tight">
                <span>{{ splitAmountForEmphasis(realizedProfit).main }}</span>
                <span class="text-sm text-muted-color">{{ splitAmountForEmphasis(realizedProfit).fraction }}</span>
                <span class="ml-1 text-[10px] font-semibold text-muted-color">{{ splitAmountForEmphasis(realizedProfit).code }}</span>
              </div>
              <div v-else class="mt-2 text-xl font-bold tracking-tight">--</div>
            </template>
          </Card>

          <Card class="app-panel dashboard-metric-card flex-1">
            <template #content>
              <p class="dashboard-kicker flex items-center gap-1.5">
                {{ $t('irr') }}
                <i class="pi pi-info-circle text-[0.7rem] normal-case tracking-normal" v-tooltip.bottom="$t('xirrHint')" />
              </p>
              <div v-if="irr !== null" class="mt-2 text-xl font-bold tracking-tight text-[var(--p-primary-color)]">{{ irr.toFixed(2) }}%</div>
              <div v-else class="mt-2 text-xl font-bold tracking-tight text-muted-color">--</div>
            </template>
          </Card>
        </div>
      </div>

      <!-- 資產配置 -->
      <div>
        <Card class="app-panel dashboard-allocation-card">
          <template #title>
            <div class="dashboard-allocation-head">
              <div class="flex items-center justify-between gap-3">
                <h3 class="dashboard-allocation-title">{{ $t('allocation') }}</h3>
                <Button @click="$router.push('allocation')" v-tooltip.top="{ value: $t('setTargets'), showDelay: 500 }" :aria-label="$t('setTargets')" icon="pi pi-sliders-h" text rounded severity="secondary" size="small" class="cursor-pointer" />
              </div>

              <SelectButton
                v-model="selectedPieType"
                :options="pieChartType"
                optionLabel="label"
                optionValue="value"
                :allowEmpty="false"
                size="small"
                class="self-start"
              />
            </div>
          </template>

          <template #content>
            <div v-if="holdingsStore.list.length > 0" class="dashboard-allocation-content py-2">
              <div v-if="selectedPieType === 'target' && !hasTargetAllocation" class="flex flex-col items-center text-center gap-3 py-8">
                <h2 class="text-base font-semibold">{{ $t('allocationNoSettings') }}</h2>
              </div>

              <div v-else class="dashboard-allocation-layout">
                <div class="dashboard-allocation-figure">
                  <!-- before the chart so the chart's tooltip paints over it -->
                  <div class="dashboard-allocation-total">
                    <span class="dashboard-allocation-total-value">{{ allocationItemCount }}</span>
                    <span class="dashboard-allocation-total-label">{{ $t('totalAssets') }}</span>
                  </div>

                  <highcharts
                    :options="selectedAllocationChart"
                    class="dashboard-allocation-chart"
                  />
                </div>

                <DataTable :value="selectedAllocationBreakdown" dataKey="key" size="small" class="min-w-0 text-[0.8rem] font-semibold">
                  <Column :header="$t('currentAsset')">
                    <template #body="{ data: item }">
                      <div class="flex min-w-0 items-center gap-2.5">
                        <span class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: item.color }"></span>
                        <StockIcon :symbol="item.key" class="!m-0 !size-7 shrink-0" />
                        <Tag :value="item.name" severity="secondary" class="truncate" />
                      </div>
                    </template>
                  </Column>
                  <Column :header="selectedPieType === 'actual' ? $t('holdingValue') : $t('targetAmount')">
                    <template #body="{ data: item }">{{ formatAmountWithCode(item.amount) }}</template>
                  </Column>
                  <Column :header="$t('distribution')">
                    <template #body="{ data: item }">{{ formatPreciseAllocationPercentage(item.percentage) }}</template>
                  </Column>
                  <Column v-if="selectedPieType === 'actual'" :header="$t('unrealizedProfit')">
                    <template #body="{ data: item }">
                      <span :class="item.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'">{{ formatAmountWithCode(item.profit) }}</span>
                    </template>
                  </Column>
                </DataTable>
              </div>
            </div>

            <div v-else class="flex flex-col items-center text-center gap-3 py-8">
              <h2 class="text-base sm:text-lg font-semibold">{{ $t('portfolioNoHoldingsTitle') }}</h2>
              <p class="text-xs sm:text-sm text-muted-color">{{ $t('portfolioNoHoldingsDesc') }}</p>
            </div>
          </template>
        </Card>
      </div>

      <!-- Holdings Table -->
      <Card class="app-panel dashboard-table-panel mb-8 p-4">
      <template #content>
        <div class="mb-4">
          <p class="dashboard-kicker">{{ $t('currentAsset') }}</p>
          <h2 class="mt-1 text-base font-semibold">{{ $t('holdings') }}</h2>
        </div>

        <DataTable :value="holdingsStore.list" :loading="isLoading" sortField="currentValue" :sortOrder="-1" dataKey="id" tableStyle="min-width: 50rem" rowHover>
          <Column field="name" :header="$t('currentAsset')">
            <template #body="{ data }">
              <RouterLink :to="{ name: 'asset', params: { symbol: data.symbol } }"
                  class="flex items-center cursor-pointer p-2 rounded-md truncate hover:text-[var(--p-primary-color)]"
                  :style="{ width: '300px', minWidth: '250px' }">
                <StockIcon :symbol="data.symbol" class="mr-8" />
                <div class="truncate">
                  <span class="font-medium">{{ data.symbol }}</span>
                  <div class="text-xs text-[var(--p-card-subtitle-color)] mt-1">{{ data.name }}</div>
                </div>
              </RouterLink>
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
              <div :class="{ 'text-emerald-600': data.profitPercentage >= 0, 'text-rose-600': data.profitPercentage < 0 }">
                <div class="flex items-center gap-1 font-bold text-xs">
                  <!-- <i v-if="data.profitPercentage >= 0" class="pi pi-sort-up-fill"></i>
                  <i v-else class="pi pi-sort-down-fill"></i> -->
                  
                  <!-- <i v-if="data.profitPercentage >= 0" class="pi pi-arrow-right -rotate-90"></i>
                  <i v-else class="pi pi-arrow-right rotate-90"></i> -->

                  <!-- <span v-if="data.profitPercentage >= 0">+</span>
                  <span v-else>-</span> -->
                  <span>{{ Math.abs(data.profitPercentage) }}%</span>

                  <i v-if="data.profitPercentage >= 0" class="pi pi-arrow-right -rotate-45"></i>
                  <i v-else class="pi pi-arrow-right rotate-45"></i>
                </div>
              </div>
            </template>
          </Column>

          <Column field="currentValue" :header="$t('rate')">
            <template #body="{ data }">
              <div class="flex min-w-27 items-center gap-3">
                <ProgressBar :value="getHoldingWeightPercentage(data)" :showValue="false" class="!h-1.5 w-20 shrink-0" />
                <span class="min-w-11 text-right text-xs font-bold text-muted-color">{{ formatAllocationPercentage(getHoldingWeightPercentage(data)) }}</span>
              </div>
            </template>
          </Column>

          <template #empty>
            <NoData />
          </template>
        </DataTable>
      </template>
      </Card>

      <!-- 關注清單 -->
      <Card class="app-panel mb-8 p-4">
        <template #content>
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold">{{ $t('watchlist') }}</h2>
            <Button @click="$router.push('/watchlist')" v-tooltip.top="{ value: $t('viewWatchlist'), showDelay: 500 }" :aria-label="$t('viewWatchlist')" icon="pi pi-arrow-right" text rounded severity="secondary" size="small" />
          </div>
          <ul v-if="watchlistStore.items.length" class="divide-y divide-[var(--p-content-border-color)]">
            <li v-for="item in watchlistStore.items.slice(0, 5)" :key="item.symbol">
              <RouterLink :to="{ name: 'asset', params: { symbol: item.symbol } }" class="flex items-center gap-3 py-2 hover:text-[var(--p-primary-color)]">
                <StockIcon :symbol="item.symbol" class="!m-0 !size-7 shrink-0" />
                <span class="font-medium">{{ item.symbol }}</span>
                <span class="ml-auto font-medium">{{ item.regularMarketPrice == null ? '--' : item.regularMarketPrice.toFixed(2) }}</span>
                <span class="w-20 text-right text-sm" :class="(item.regularMarketChangePercent ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                  {{ item.regularMarketChangePercent == null ? '--' : `${item.regularMarketChangePercent > 0 ? '+' : ''}${item.regularMarketChangePercent.toFixed(2)}%` }}
                </span>
              </RouterLink>
            </li>
          </ul>
          <p v-else class="text-sm text-muted-color">
            {{ $t('watchlistEmpty') }} ·
            <RouterLink to="/watchlist" class="text-[var(--p-primary-color)]">{{ $t('addToWatchlist') }}</RouterLink>
          </p>
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
import Skeleton from 'primevue/skeleton'
import ProgressBar from 'primevue/progressbar'
import StockIcon from '@/components/StockIcon.vue'
import StockChart from '@/components/StockChart.vue'
import api from '@/utils/api'
import { totalReturnPct, realizedProfit as calcRealizedProfit, portfolioXirr, percentChange, filterByPeriod, yAxisBounds } from '@/utils/portfolioMetrics'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTransactionsStore } from '@/stores/transactions';
import { useHoldingsStore } from '@/stores/holdings'
import { useWatchlistStore } from '@/stores/watchlist'
import NoData from '@/components/NoData.vue'

import { useTheme } from '@/composables/useTheme.js'
const { isDark } = useTheme()

const transactionsStore = useTransactionsStore()
const auth = useAuthStore()
const portfolioStore = usePortfolioStore()
const holdingsStore = useHoldingsStore()
const watchlistStore = useWatchlistStore()
// 每日排程更新股價時會寫 last_updated，取最新一筆當作股價更新時間（ISO 字串可直接比大小）
const pricesUpdatedAt = computed(() => holdingsStore.rawList.reduce((max, h) => (h.last_updated > max ? h.last_updated : max), ''))
// ponytail: 與 AssetProfileView 同一行格式化，未抽共用 util
const formatUpdatedAt = iso => new Date(iso).toLocaleString(locale.value.startsWith('zh') ? 'zh-TW' : 'en-US', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

// Currency settings
import { useCurrency } from '@/composables/useCurrency'
const { formatAmount, formatAmountWithCode, formatPriceWithCode, convertAmountFromCurrency, currencySymbol } = useCurrency()

import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'
const settingsStore = useSettingsStore()
const { displayCurrency } = storeToRefs(settingsStore)

/* =========================
 *  State
 * =======================*/
const isLoading = ref(true)
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
  { label: t('currentAsset'), value: 'actual' },
  { label: t('targetAllocation'), value: 'target' }
]))

// 配置比例色票
const allocationPalette = ['#3b82f6', '#14b8a6', '#f59e0b', '#f97316']

const timeRangeOptions = [
  { label: '5D', value: '5d' },
  { label: '1M', value: '1mo' },
  { label: '6M', value: '6mo' },
  { label: 'YTD', value: 'ytd' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
]

const selectedPeriod = ref('5d')
const selectedPeriodLabel = computed(() => timeRangeOptions.find(option => option.value === selectedPeriod.value)?.label)

// 後端回傳「最早交易日 ~ 今天」的完整資料，切換時間區間只在前端切片，避免重打 API
const rawChartPoints = ref([])
const chartPoints = computed(() => filterByPeriod(rawChartPoints.value, selectedPeriod.value, p => p.x))
const growthRateNumber = computed(() => percentChange(chartPoints.value))
const change = computed(() => {
  const list = chartPoints.value
  return list.length < 2 ? 0 : list[list.length - 1].y - list[0].y
})

/* =========================
 *  Utils / Formatters
 * =======================*/
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

function formatPreciseAllocationPercentage(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '--'
  return `${n.toFixed(2)}%`
}

function getHoldingWeightPercentage(holding) {
  const portfolioTotal = Number(totalValue.value)
  const holdingValue = Number(holding?.currentValue)

  if (!Number.isFinite(portfolioTotal) || portfolioTotal <= 0 || !Number.isFinite(holdingValue)) {
    return 0
  }

  return (holdingValue / portfolioTotal) * 100
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

  const hasProfit = remainingItems.some(item => item.profit !== undefined)

  primaryItems.push({
    key: 'others',
    name: locale.value.startsWith('zh') ? '其他' : 'Others',
    value: remainingItems.reduce((sum, item) => sum + item.value, 0),
    percentage: remainingItems.reduce((sum, item) => sum + item.percentage, 0),
    amount: remainingItems.reduce((sum, item) => sum + item.amount, 0),
    profit: hasProfit ? remainingItems.reduce((sum, item) => sum + (item.profit || 0), 0) : undefined,
    color: allocationPalette[3],
  })

  return primaryItems
}

const timeRangeOptionsWithGrowth = computed(() => timeRangeOptions.map(option => ({
  ...option,
  growth: percentChange(filterByPeriod(rawChartPoints.value, option.value, p => p.x)),
})))

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
    dividends.value = data.map(item => ({ symbol: item.symbol, amount: item.shares * item.amount, date: item.date.slice(0, 10) }))
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
      rawChartPoints.value = []
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
    const profit = amount - Number(holding.avgCost) * Number(holding.shares)

    return {
      key: holding.symbol,
      name: holding.symbol,
      value: amount,
      percentage,
      amount,
      profit,
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

const allocationItemCount = computed(() => {
  return selectedPieType.value === 'actual'
    ? holdingsStore.list.length
    : (allocation.value || []).length
})

const selectedAllocationChart = computed(() => ({
  chart: {
    type: 'pie',
    backgroundColor: 'transparent',
    spacing: [8, 8, 8, 8],
    height: 260,
    animation: { duration: 350 },
  },
  title: { text: null },
  credits: { enabled: false },
  accessibility: { enabled: false },
  legend: { enabled: false },
  tooltip: {
    useHTML: true,
    borderWidth: 1,
    borderColor: isDark.value ? '#334155' : '#e2e8f0',
    shadow: false,
    backgroundColor: isDark.value ? '#111b31' : '#ffffff',
    style: { color: isDark.value ? '#f8fafc' : '#0f172a' },
    formatter: function () {
      const custom = this.point?.options?.custom || {}
      const amount = Number(custom.amount)
      const percentage = Number(custom.percentage)
      const secondaryLabel = selectedPieType.value === 'actual' ? t('chartValue') : t('totalValue')

      return `
        <div style="min-width: 120px; font-size: 11px; line-height: 1.5;">
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
      // ponytail: auto size so Highcharts shrinks the pie to fit side labels instead of truncating them; fixed center keeps the HTML total overlay aligned, minSize keeps the hole wide enough for it
      center: ['50%', '50%'],
      minSize: 140,
      borderWidth: 4,
      borderColor: isDark.value ? '#1d1e1e' : '#ffffff',
      slicedOffset: 0,
      showInLegend: false,
      dataLabels: {
        enabled: true,
        distance: 14,
        format: '{point.name}',
        allowOverlap: false,
        connectorColor: isDark.value ? '#475569' : '#cbd5e1',
        filter: { property: 'percentage', operator: '>', value: 3 },
        style: {
          color: isDark.value ? '#cbd5e1' : '#475569',
          fontWeight: '600',
          fontSize: '12px',
          textOutline: 'none',
        },
      },
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

const totalReturn = computed(() => totalReturnPct(holdingsStore.list))
const realizedProfit = computed(() => calcRealizedProfit(transactionsStore.list, convertAmountFromCurrency))
const irr = computed(() => holdingsStore.list.length
  ? portfolioXirr(transactionsStore.list, dividends.value, totalValue.value, convertAmountFromCurrency)
  : null)

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
        style: { fontSize: '11px', color: axisColor }
      },
      lineColor: gridColor,
      tickColor: gridColor,
    },
    yAxis: {
      title: { text: null },
      ...yAxisBounds(chartPoints.value.map(d => Number(d.y))),
      startOnTick: false,
      endOnTick: false,
      labels: {
        formatter: function () { return `${currencySymbol.value}${this.value.toFixed(2)}` },
        style: { fontSize: '11px', color: axisColor },
      },
      gridLineDashStyle: 'Dash',
      gridLineColor: gridColor,
    },
    tooltip: {
      xDateFormat: '%Y/%m/%d',
      valuePrefix: currencySymbol.value,
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
      data: chartPoints.value.map(d => [d.x.getTime(), d.y]),
      color: lineColor,
    }],
  }
})

async function fetchChartData() {
  if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id || holdingsStore.list.length === 0) {
    rawChartPoints.value = []
    return
  }

  try {
    const data = await api.get(`/api/yahoo/holdings-chart?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}&currency=${displayCurrency.value}`)
    rawChartPoints.value = data
      .map(item => ({ x: new Date(item.date), y: item.close }))
      .sort((a, b) => a.x - b.x)
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
  () => [auth.user?.uid, portfolioStore.currentPortfolio?.id, portfolioStore.isInitializing],
  async ([uid, pid, isInitializing]) => {
    console.log('Dashboard Watch User or Portfolio changed, reloading data...', isLoadingData)
    // portfolioStore 尚未確認是否有 portfolio 前，繼續顯示 skeleton，避免閃現空狀態畫面
    if (isInitializing) return

    if (uid && pid && !isLoadingData) {
      isLoadingData = true
      await loadData()
      isLoadingData = false
    } else if (!pid) {
      isLoading.value = false
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

// 走勢圖由後端用歷史匯率換算，切換顯示幣別要重抓
watch(displayCurrency, () => {
  if (!isLoadingData) fetchChartData()
})
</script>

<style scoped>
.dashboard-panel--hero {
  overflow: hidden;
}

.dashboard-kicker {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--p-text-muted-color);
}

.dashboard-footnote {
  font-size: 0.78rem;
  color: var(--p-text-muted-color);
}

.asset-growth-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  padding: 0.3rem 0.7rem;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1;
}

.asset-growth-pill i {
  font-size: 0.7rem;
}

.asset-growth-pill--up {
  color: #047857;
  background: rgba(16, 185, 129, 0.14);
}

.asset-growth-pill--down {
  color: #be123c;
  background: rgba(244, 63, 94, 0.14);
}

.dashboard-summary-strip {
  overflow: hidden;
}

.dashboard-allocation-card,
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

.dashboard-allocation-head {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dashboard-allocation-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--p-text-color);
}

.dashboard-allocation-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
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
  grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
  align-items: center;
  align-content: center;
  gap: 2.5rem;
  min-height: 100%;
  width: 100%;
  flex: 1;
}

.dashboard-allocation-figure {
  position: relative;
  width: min(100%, 260px);
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

.dashboard-allocation-total-value {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--p-text-color);
}

.dashboard-allocation-total-label {
  margin-top: 0.2rem;
  font-size: 0.72rem;
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
  font-size: 0.78rem;
}

.dashboard-table-panel :deep(.p-datatable-tbody > tr > td) {
  font-size: 0.8125rem;
}

@media (max-width: 639px) {
  .dashboard-allocation-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
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
