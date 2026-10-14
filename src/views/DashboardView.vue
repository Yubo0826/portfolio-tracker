<template>
  <!-- px-4 sm:px-6 lg:px-8 -->
  <!--  max-w-screen-2xl -->
  <div class="w-full">
    <Teleport defer to="#page-title-aside">
      <div class="flex items-center gap-3">
        <span v-if="pricesUpdatedAt">{{ t('lastUpdated', { time: formatUpdatedAt(pricesUpdatedAt) }) }}</span>
        <label class="inline-flex items-center gap-1.5 cursor-pointer">
          <ToggleSwitch :model-value="!showDetails" @update:model-value="v => showDetails = !v" class="dashboard-details-switch" />
          {{ t('compactMode') }}
        </label>
      </div>
    </Teleport>

    <!-- Skeleton Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card v-for="idx in 3" :key="`skeleton-metric-${idx}`" class="app-panel dashboard-metric-card h-full">
          <template #content>
            <div class="space-y-3">
              <Skeleton width="6rem" height="0.85rem" />
              <Skeleton width="10rem" height="2rem" />
              <Skeleton width="100%" height="0.5rem" borderRadius="999px" />
            </div>
          </template>
        </Card>
      </div>

      <Card class="app-panel dashboard-panel--hero">
        <template #content>
          <div class="space-y-3">
            <Skeleton width="6rem" height="0.85rem" />
            <Skeleton width="16rem" height="2.5rem" />
            <Skeleton width="100%" height="320px" borderRadius="0.75rem" />
            <Skeleton width="18rem" height="1.75rem" borderRadius="999px" />
          </div>
        </template>
      </Card>

      <Card class="app-panel dashboard-allocation-card">
        <template #content>
          <div class="space-y-4">
            <Skeleton width="8rem" height="1.25rem" />
            <Skeleton width="14rem" height="2rem" borderRadius="999px" />
            <Skeleton width="100%" height="18rem" borderRadius="0.75rem" />
          </div>
        </template>
      </Card>

      <Card class="app-panel dashboard-table-panel mb-8 p-4">
        <template #content>
          <div class="space-y-3">
            <Skeleton width="8rem" height="1rem" />
            <div class="space-y-2">
              <div v-for="idx in 6" :key="`skeleton-row-${idx}`" class="grid grid-cols-5 gap-3 items-center">
                <Skeleton v-for="col in 5" :key="col" width="100%" height="1.25rem" />
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">

      <!-- 損益資訊小卡 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card class="app-panel dashboard-metric-card h-full">
          <template #content>
            <div class="flex items-start justify-between gap-2">
              <p class="dashboard-kicker">{{ $t('unrealizedProfit') }}</p>
              <span
                v-if="holdingsStore.list.length"
                class="asset-growth-pill asset-growth-pill--sm"
                :class="totalReturn >= 0 ? 'asset-growth-pill--up' : 'asset-growth-pill--down'"
                v-tooltip.top="$t('cumulativeReturn')"
              >{{ formatSignedNumber(totalReturn) }}%</span>
            </div>
            <div v-if="totalProfit" class="mt-2 inline-flex items-end text-2xl font-bold tracking-tight" :class="profitColor(totalProfit)">
              <span>{{ totalProfit > 0 ? '+' : '' }}{{ splitAmountForEmphasis(totalProfit).main }}</span>
              <span class="text-sm opacity-70">{{ splitAmountForEmphasis(totalProfit).fraction }}</span>
              <span class="ml-1 pb-1 text-[10px] font-semibold text-muted-color">{{ splitAmountForEmphasis(totalProfit).code }}</span>
            </div>
            <div v-else class="mt-2 text-2xl font-bold tracking-tight">--</div>

            <!-- 獲利／虧損檔數比例條 -->
            <div v-if="holdingsStore.list.length" class="dashboard-winloss mt-3" :aria-label="$t('winLossValue', winLoss)">
              <span v-if="winLoss.up" class="dashboard-winloss__up" :style="{ flexGrow: winLoss.up }" />
              <span v-if="winLoss.down" class="dashboard-winloss__down" :style="{ flexGrow: winLoss.down }" />
            </div>

            <dl v-show="showDetails" class="dashboard-metric-rows">
              <div v-for="row in unrealizedRows" :key="row.label"><dt>{{ row.label }}</dt><dd>{{ row.value }}</dd></div>
            </dl>
          </template>
        </Card>

        <Card class="app-panel dashboard-metric-card h-full">
          <template #content>
            <p class="dashboard-kicker flex items-center gap-1.5">
              {{ $t('realizedProfit') }}
              <i class="pi pi-info-circle text-[0.7rem] normal-case tracking-normal" v-tooltip.bottom="$t('realizedProfitHint')" />
            </p>
            <div v-if="realizedProfit" class="mt-2 inline-flex items-end text-2xl font-bold tracking-tight" :class="profitColor(realizedProfit)">
              <span>{{ realizedProfit > 0 ? '+' : '' }}{{ splitAmountForEmphasis(realizedProfit).main }}</span>
              <span class="text-sm opacity-70">{{ splitAmountForEmphasis(realizedProfit).fraction }}</span>
              <span class="ml-1 pb-1 text-[10px] font-semibold text-muted-color">{{ splitAmountForEmphasis(realizedProfit).code }}</span>
            </div>
            <div v-else class="mt-2 text-2xl font-bold tracking-tight">--</div>

            <dl v-show="showDetails" class="dashboard-metric-rows">
              <div v-for="row in realizedRows" :key="row.label"><dt>{{ row.label }}</dt><dd>{{ row.value }}</dd></div>
            </dl>
          </template>
        </Card>

        <Card class="app-panel dashboard-metric-card h-full">
          <template #content>
            <p class="dashboard-kicker flex items-center gap-1.5">
              {{ $t('irr') }}
              <i class="pi pi-info-circle text-[0.7rem] normal-case tracking-normal" v-tooltip.bottom="$t('xirrHint')" />
            </p>
            <div v-if="irr !== null" class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl font-bold tracking-tight">{{ irr.toFixed(2) }}%</span>
              <span class="dashboard-footnote">{{ $t('annualizedReturn') }}</span>
            </div>
            <div v-else class="mt-2 text-2xl font-bold tracking-tight text-muted-color">--</div>

            <dl v-show="showDetails" class="dashboard-metric-rows">
              <div v-for="row in irrRows" :key="row.label"><dt>{{ row.label }}</dt><dd>{{ row.value }}</dd></div>
            </dl>
          </template>
        </Card>
      </div>

      <!-- 總資產走勢圖 -->
      <Card class="app-panel dashboard-panel--hero">
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
                      <i :class="growthRateNumber >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" aria-hidden="true"></i>
                      {{ Math.abs(growthRateNumber).toFixed(2) }}%
                      <span>({{ formatSignedNumber(change) }})</span>
                    </span>
                  </div>

                  <div v-else class="inline-flex items-center gap-2 pb-1 text-lg text-muted-color">
                    <span>--</span>
                    <span>(--)</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 面積圖 -->
            <div v-if="holdingsStore.list.length" class="mt-2">
              <StockChart :options="areaChartOptions" :height="320" />
            </div>

            <!-- 沒有交易時：引導新增 -->
            <div v-else class="dashboard-chart-empty mt-2">
              <div class="dashboard-chart-empty__body">
                <span class="dashboard-chart-empty__icon"><i class="pi pi-chart-line" /></span>
                <h3 class="text-base font-semibold">{{ $t('dashboardChartEmptyTitle') }}</h3>
                <p class="text-xs sm:text-sm text-muted-color max-w-sm">{{ $t('dashboardChartEmptyDesc') }}</p>
                <div class="mt-2 flex flex-wrap justify-center gap-2">
                  <Button :label="$t('addInvestment')" icon="pi pi-plus" size="small" @click="transactionDialogVisible = true" />
                  <Button :label="$t('importTransactions')" icon="pi pi-upload" size="small" severity="secondary" outlined @click="importDialogVisible = true" />
                </div>
              </div>
            </div>
            <TransactionDialog v-model="transactionDialogVisible" />
            <ImportDataDialog v-model="importDialogVisible" mode="transactions" />

            <!-- 時間範圍選擇 -->
            <SelectButton
              v-if="holdingsStore.list.length"
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
                  <span :class="option.growth === null ? 'text-muted-color' : option.growth >= 0 ? 'text-up' : 'text-down'">
                    {{ option.growth === null ? '--' : `${formatSignedNumber(option.growth)}%` }}
                  </span>
                </div>
              </template>
            </SelectButton>

            <!-- 區間統計：跟著選取的時間區間變動 -->
            <dl v-if="stats" v-show="showDetails" class="dashboard-period-stats mt-4">
              <div>
                <dt>{{ $t('periodHigh') }}</dt>
                <dd>{{ formatAmountWithCode(stats.high.y) }}</dd>
                <dd class="dashboard-period-stats__sub">{{ formatShortDate(stats.high.x) }}</dd>
              </div>
              <div>
                <dt>{{ $t('periodLow') }}</dt>
                <dd>{{ formatAmountWithCode(stats.low.y) }}</dd>
                <dd class="dashboard-period-stats__sub">{{ formatShortDate(stats.low.x) }}</dd>
              </div>
              <div>
                <dt>{{ $t('maxDrawdown') }}</dt>
                <dd :class="{ 'text-down': stats.maxDrawdown > 0 }">{{ formatSignedNumber(-stats.maxDrawdown) }}%</dd>
              </div>
              <div>
                <dt>{{ $t('fromPeriodHigh') }}</dt>
                <dd :class="stats.fromHigh < 0 ? 'text-down' : 'text-up'">{{ stats.fromHigh < 0 ? `${formatSignedNumber(stats.fromHigh)}%` : $t('atPeriodHigh') }}</dd>
              </div>
            </dl>
          </div>
        </template>
      </Card>

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
                        <span class="truncate">{{ item.name }}</span>
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
                      <span :class="item.profit >= 0 ? 'text-up' : 'text-down'">{{ formatAmountWithCode(item.profit) }}</span>
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
        <h2 class="mb-4 text-base font-semibold">{{ $t('holdings') }}</h2>

        <DataTable :value="holdingsStore.list" sortField="currentValue" :sortOrder="-1" dataKey="id" tableStyle="min-width: 50rem" rowHover>
          <Column field="name" :header="$t('currentAsset')">
            <template #body="{ data }">
              <RouterLink :to="{ name: 'asset', params: { symbol: data.symbol } }"
                  class="flex items-center cursor-pointer p-2 rounded-md truncate hover:text-[var(--p-primary-color)]"
                  :style="{ width: '300px', minWidth: '250px' }">
                <div class="truncate">
                  <div class="truncate font-medium">{{ data.symbol }}</div>
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
            </template>
          </Column>

          <Column field="profitPercentage" :header="$t('comparisonReturnRate')" sortable>
            <template #body="{ data }">
              <span class="font-bold" :class="{ 'text-up': data.profitPercentage >= 0, 'text-down': data.profitPercentage < 0 }">
                {{ formatSignedNumber(data.profitPercentage) }}%
              </span>
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
import ToggleSwitch from 'primevue/toggleswitch'
import StockChart from '@/components/StockChart.vue'
import api from '@/utils/api'
import { totalReturnPct, realizedProfit as calcRealizedProfit, portfolioXirr, percentChange, filterByPeriod, yAxisBounds, periodStats } from '@/utils/portfolioMetrics'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTransactionsStore } from '@/stores/transactions';
import { useHoldingsStore } from '@/stores/holdings'
import NoData from '@/components/NoData.vue'
import TransactionDialog from '@/components/TransactionDialog.vue'
import ImportDataDialog from '@/components/ImportDataDialog.vue'

import { useTheme } from '@/composables/useTheme.js'
const { isDark, chartPalette } = useTheme()

const transactionsStore = useTransactionsStore()
const auth = useAuthStore()
const portfolioStore = usePortfolioStore()
const holdingsStore = useHoldingsStore()
// 每日排程更新股價時會寫 last_updated，取最新一筆當作股價更新時間（ISO 字串可直接比大小）
const pricesUpdatedAt = computed(() => holdingsStore.rawList.reduce((max, h) => (h.last_updated > max ? h.last_updated : max), ''))
// ponytail: 與 AssetProfileView 同一行格式化，未抽共用 util
const formatUpdatedAt = iso => new Date(iso).toLocaleString(locale.value.startsWith('zh') ? 'zh-TW' : 'en-US', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

// Currency settings
import { useCurrency } from '@/composables/useCurrency'
const { formatAmount, formatAmountWithCode, formatPriceWithCode, convertAmountToUsd, currencySymbol } = useCurrency()

import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'
const settingsStore = useSettingsStore()
const { displayCurrency } = storeToRefs(settingsStore)

/* =========================
 *  State
 * =======================*/
const isLoading = ref(true)
const transactionDialogVisible = ref(false)
const importDialogVisible = ref(false)

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

// 後端回傳「最早交易日 ~ 今天」的完整資料，切換時間區間只在前端切片，避免重打 API
const rawChartPoints = ref([])
const chartPoints = computed(() => filterByPeriod(rawChartPoints.value, selectedPeriod.value, p => p.x))
const growthRateNumber = computed(() => percentChange(chartPoints.value))
const change = computed(() => {
  const list = chartPoints.value
  return list.length < 2 ? 0 : list[list.length - 1].y - list[0].y
})
const stats = computed(() => periodStats(chartPoints.value))

// 小卡明細列＋區間統計的顯示開關，記在 localStorage；無痕或封鎖儲存時就當預設顯示
const SHOW_DETAILS_KEY = 'dashboard-show-details'
const showDetails = ref((() => { try { return localStorage.getItem(SHOW_DETAILS_KEY) !== '0' } catch { return true } })())
watch(showDetails, v => { try { localStorage.setItem(SHOW_DETAILS_KEY, v ? '1' : '0') } catch { /* 存不了就只在本次有效 */ } })
const formatShortDate = d => d.toLocaleDateString(locale.value.startsWith('zh') ? 'zh-TW' : 'en-US')

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
    await fetchChartData()
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
    height: 300,
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
    backgroundColor: chartPalette.value.tooltipBg,
    style: { color: chartPalette.value.tooltipFgStrong },
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
      borderColor: chartPalette.value.border,
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
const realizedProfit = computed(() => calcRealizedProfit(transactionsStore.list, convertAmountToUsd))
const irr = computed(() => holdingsStore.list.length
  ? portfolioXirr(transactionsStore.list, dividends.value, totalValue.value, convertAmountToUsd)
  : null)

/* 損益小卡的明細列 */
const profitColor = v => (v >= 0 ? 'text-up' : 'text-down')
const winLoss = computed(() => {
  const up = holdingsStore.list.filter(h => h.currentValue >= h.avgCost * h.shares).length
  return { up, down: holdingsStore.list.length - up }
})
// 股息表沒有幣別欄位，與 portfolioXirr 相同以該 symbol 交易的幣別換算；資料層一律用 USD，顯示時 formatAmount* 才轉幣別
const totalDividends = computed(() => {
  const currencyBySymbol = new Map(transactionsStore.list.map(tx => [tx.symbol, tx.currency]))
  return dividends.value.reduce((s, d) => s + convertAmountToUsd(d.amount, currencyBySymbol.get(d.symbol) ?? 'USD'), 0)
})
const firstTradeDate = computed(() => transactionsStore.list.reduce(
  (min, tx) => (!min || new Date(tx.date) < min ? new Date(tx.date) : min), null))

const unrealizedRows = computed(() => [
  { label: t('costBasis'), value: formatAmountWithCode(totalValue.value - totalProfit.value) },
  { label: t('winLoss'), value: t('winLossValue', winLoss.value) },
])
const realizedRows = computed(() => [
  { label: t('dividendTotal'), value: formatAmountWithCode(totalDividends.value) },
  { label: t('realizedPlusDividends'), value: formatAmountWithCode(realizedProfit.value + totalDividends.value) },
])
const irrRows = computed(() => {
  const first = firstTradeDate.value
  const years = first ? (Date.now() - first.getTime()) / (365.25 * 864e5) : null
  return [
    { label: t('investingSince'), value: first ? `${first.toLocaleDateString(locale.value.startsWith('zh') ? 'zh-TW' : 'en-US')} · ${t('yearsShort', { n: years.toFixed(1) })}` : '--' },
    { label: t('totalInvested'), value: formatAmountWithCode(transactionsStore.list
      .filter(tx => tx.transactionType === 'buy')
      .reduce((s, tx) => s + convertAmountToUsd(tx.price * tx.shares + tx.fee, tx.currency), 0)) },
  ]
})

/* =========================
 *  Charts (options & helpers)
 * =======================*/
const areaChartOptions = computed(() => {
  const lineColor = 'var(--p-primary-color)'
  const fillFrom = 'color-mix(in srgb, var(--p-primary-color) 35%, transparent)'
  const { axis: axisColor, grid: gridColor, tooltipBg, tooltipFg } = chartPalette.value
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

// 第一筆交易後 holdings 才非同步出現，此時 transactions watcher 抓圖已被 holdings 為空擋掉，補抓一次
watch(() => holdingsStore.list.length, (n, o) => {
  if (n && !o && !isLoadingData) fetchChartData()
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
  border-radius: 0.5rem;
  padding: 0.3rem 0.6rem;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1;
}

.asset-growth-pill i {
  font-size: 0.85em;
}

.asset-growth-pill--sm {
  padding: 0.2rem 0.5rem;
  font-size: 0.72rem;
}

/* 小卡內容撐滿高度，明細列貼底，避免卡片下半部空白 */
.dashboard-metric-card :deep(.p-card-body),
.dashboard-metric-card :deep(.p-card-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.dashboard-metric-rows {
  margin-top: auto;
  padding-top: 0.9rem;
  font-size: 0.78rem;
}

.dashboard-metric-rows > div {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 0;
  border-top: 1px dashed var(--p-content-border-color);
}

.dashboard-metric-rows dt {
  color: var(--p-text-muted-color);
}

.dashboard-metric-rows dd {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.dashboard-details-switch {
  --p-toggleswitch-width: 2rem;
  --p-toggleswitch-height: 1.125rem;
  --p-toggleswitch-handle-size: 0.75rem;
}

.dashboard-period-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  font-size: 0.78rem;
}

@media (min-width: 640px) {
  .dashboard-period-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

.dashboard-period-stats > div {
  padding: 0.6rem 0.75rem;
  border: 1px dashed var(--p-content-border-color);
  border-radius: 0.5rem;
}

.dashboard-period-stats dt {
  color: var(--p-text-muted-color);
}

.dashboard-period-stats dd {
  margin-top: 0.15rem;
  font-size: 0.95rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.dashboard-period-stats .dashboard-period-stats__sub {
  margin-top: 0;
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--p-text-muted-color);
}

.dashboard-winloss {
  display: flex;
  gap: 2px;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
}

.dashboard-winloss__up { background: #10b981; }
.dashboard-winloss__down { background: #f43f5e; }

/* 實色底＋深色字，淺色／深色主題共用同一組色 */
.asset-growth-pill--up {
  color: #14381f;
  background: #80c990;
}

.asset-growth-pill--down {
  color: #4c1019;
  background: #f2a3ab;
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
  color: var(--p-text-muted-color);
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
  grid-template-columns: minmax(260px, 400px) minmax(0, 1fr);
  align-items: center;
  align-content: center;
  gap: 2.5rem;
  min-height: 100%;
  width: 100%;
  flex: 1;
}

.dashboard-chart-empty {
  height: 320px;
  display: grid;
  place-items: center;
}

.dashboard-chart-empty__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  text-align: center;
}

.dashboard-chart-empty__icon {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  margin-bottom: 0.25rem;
  border-radius: 999px;
  color: var(--p-text-muted-color);
  background: color-mix(in srgb, var(--p-text-muted-color) 12%, transparent);
  font-size: 1.25rem;
}

.dashboard-allocation-figure {
  position: relative;
  width: min(100%, 380px);
  margin-inline: auto;
}

.dashboard-allocation-chart {
  display: block;
  width: 100%;
  height: 300px;
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
