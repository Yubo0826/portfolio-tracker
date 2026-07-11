<template>
  <div>
    <div class="pl-4 pr-4 mt-4">
      <div class="flex items-center">
        <h1 class="text-2xl">{{ info.fullName }}</h1>
      </div>
      <div class="chart-container">
        <div class="grid grid-cols-3 gap-8">
          <div class="col-span-2 flex flex-col gap-4">
            <AppCard class="w-full">
              <template #content>
                <div>
                  <div class="flex items-center justify-between">
                    <div class="flex flex-col mb-2">
                      <p class="asset-kicker">{{ t('currentPrice') }}</p>

                      <div class="mt-1 flex flex-wrap items-end gap-2">
                        <div class="text-4xl font-bold inline-flex items-end">
                          <span>{{ splitPriceForEmphasis(info.regularMarketPrice).main }}</span>
                          <span>{{ splitPriceForEmphasis(info.regularMarketPrice).fraction }}</span>
                          <span class="ml-1 text-[10px] leading-none pb-1 font-semibold">{{ splitPriceForEmphasis(info.regularMarketPrice).code }}</span>
                        </div>

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
                          <span class="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-400">{{ selectedRangeLabel }}</span>
                        </div>

                        <div v-else class="inline-flex items-center gap-2 pb-1 text-lg text-slate-600 dark:text-slate-500">
                          <span>--</span>
                          <span>(--)</span>
                          <span class="text-xs font-semibold uppercase tracking-wide">{{ selectedRangeLabel }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center space-x-2">
                      <SelectButton
                        v-model="chartType"
                        :options="chartTypeOptions"
                        optionLabel="label"
                        optionValue="value"
                        class="text-sm"
                        :allowEmpty="false"
                      >
                        <template #option="slotProps">
                          <div class="flex items-center space-x-2">
                            <i :class="slotProps.option.icon"></i>
                          </div>
                        </template>
                      </SelectButton>
                    </div>
                  </div>

                  <div class="flex justify-between text-[#5f6368] text-xs">
                    <span>已收盤：{{ formatUTC8(info.regularMarketTime) }}</span>
                  </div>

                  <div class="mt-2">
                    <highcharts
                      v-if="chartType === 'area'"
                      :options="highAreaOptions"
                      style="width: 100%; height: 300px;"
                    />

                    <highcharts
                      v-else-if="chartType === 'candlestick'"
                      :options="highCandleOptions"
                      style="width: 100%; height: 300px;"
                    />
                  </div>

                  <div class="asset-range-row">
                    <button
                      v-for="option in rangeOptionsWithGrowth"
                      :key="option.value"
                      type="button"
                      class="asset-range-btn"
                      :class="{ 'asset-range-btn--active': currentRange === option.value }"
                      @click="currentRange = option.value"
                    >
                      <span>{{ option.label }}</span>
                      <span
                        class="asset-range-btn-growth"
                        :class="option.growth === null ? 'asset-range-btn-growth--muted' : option.growth >= 0 ? 'asset-range-btn-growth--up' : 'asset-range-btn-growth--down'"
                      >
                        {{ option.growth === null ? '--' : `${formatSignedNumber(option.growth)}%` }}
                      </span>
                    </button>
                  </div>
                </div>
              </template>
            </AppCard>

            <AppCard v-if="isFundQuote" class="w-full">
              <template #content>
                <div>
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-sm font-semibold">{{ t(fundHoldingsTab === 'sector' ? 'sectorWeightingsTitle' : 'topHoldingsTitle') }}</span>

                    <SelectButton
                      v-model="fundHoldingsTab"
                      :options="fundHoldingsTabOptions"
                      optionLabel="label"
                      optionValue="value"
                      class="text-sm"
                      :allowEmpty="false"
                    />
                  </div>

                  <p
                    v-if="fundHoldingsError"
                    class="mt-2 text-xs text-red-600 dark:text-red-300"
                  >
                    {{ t(fundHoldingsTab === 'sector' ? 'sectorWeightingsLoadFailed' : 'topHoldingsLoadFailed') }}
                  </p>

                  <div
                    v-if="fundHoldingsLoading"
                    class="mt-3 h-72 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                  />

                  <highcharts
                    v-else-if="fundHoldingsTab === 'sector' && sectorWeightingsData.length"
                    :options="sectorTreemapOptions"
                    style="width: 100%; height: 300px;"
                    class="mt-2"
                  />

                  <highcharts
                    v-else-if="fundHoldingsTab === 'holdings' && topHoldingsData.length"
                    :options="topHoldingsTreemapOptions"
                    style="width: 100%; height: 300px;"
                    class="mt-2"
                  />

                  <p
                    v-else-if="!fundHoldingsError"
                    class="mt-3 text-xs text-slate-700 dark:text-slate-400"
                  >
                    {{ t(fundHoldingsTab === 'sector' ? 'sectorWeightingsEmpty' : 'topHoldingsEmpty') }}
                  </p>
                </div>
              </template>
            </AppCard>

            <AppCard class="w-full">
              <template #content>
                <div>
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-sm font-semibold">{{ t('compareAssets') }}</span>
                    <span class="text-xs text-slate-700 dark:text-slate-400">
                      {{ t('comparisonLimitHint', { max: MAX_COMPARE_SYMBOLS }) }}
                    </span>
                  </div>

                  <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div class="flex-1">
                      <SymbolAutoComplete
                        v-model="compareInput"
                        :disabled="isComparisonDisabled"
                        @update="onCompareSymbolSelected"
                      />
                    </div>

                    <Button
                      size="small"
                      :label="t('addComparison')"
                      :disabled="!canAddComparison"
                      @click="addComparisonSymbol"
                    />

                    <Button
                      size="small"
                      text
                      severity="secondary"
                      :label="t('clearComparisons')"
                      :disabled="!compareSymbols.length"
                      @click="clearComparisonSymbols"
                    />
                  </div>

                  <p
                    v-if="isComparisonDisabled && compareSymbols.length"
                    class="mt-2 text-xs text-slate-700 dark:text-slate-400"
                  >
                    {{ t('comparisonDisabledForCandlestick') }}
                  </p>
                  <p
                    v-else-if="comparisonNoticeText"
                    class="mt-2 text-xs text-orange-600 dark:text-orange-300"
                  >
                    {{ comparisonNoticeText }}
                  </p>

                  <div v-if="compareSymbols.length" class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="item in compareSymbols"
                      :key="item"
                      type="button"
                      class="compare-chip"
                      @click="removeComparisonSymbol(item)"
                    >
                      <span class="font-semibold">{{ item }}</span>
                      <span
                        v-if="compareNameMap[item] && compareNameMap[item] !== item"
                        class="ml-1 max-w-28 truncate text-xs text-slate-700 dark:text-slate-300"
                      >
                        {{ compareNameMap[item] }}
                      </span>
                      <i class="pi pi-times ml-2 text-xs" />
                    </button>
                  </div>
                </div>
              </template>
            </AppCard>

            <AppCard class="w-full">
              <template #content>
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-sm font-semibold">{{ t('recommendedStocks') }}</span>
                    <!-- <span class="recommend-muted text-xs">{{ t('comparisonLimitHint', { max: MAX_RECOMMENDATION_CARDS }) }}</span> -->
                  </div>

                  <p
                    v-if="recommendationPartialText"
                    class="recommend-hint mt-2 text-xs"
                  >
                    {{ recommendationPartialText }}
                  </p>

                  <p
                    v-if="recommendationErrorText"
                    class="recommend-error mt-2 text-xs"
                  >
                    {{ recommendationErrorText }}
                  </p>

                  <Carousel
                    v-if="recommendLoading"
                    :value="recommendSkeletonItems"
                    :numVisible="RECOMMENDATION_VISIBLE_DESKTOP"
                    :numScroll="1"
                    :showNavigators="false"
                    :showIndicators="false"
                    :responsiveOptions="recommendResponsiveOptions"
                    class="recommend-carousel mt-3"
                  >
                    <template #item="{ index }">
                      <div
                        :key="`recommend-skeleton-${index}`"
                        class="recommend-card recommend-card--skeleton animate-pulse"
                      >
                        <div class="recommend-skeleton-line w-1/2" />
                        <div class="recommend-skeleton-line mt-3 w-2/3" />
                        <div class="recommend-skeleton-line mt-2 w-1/3" />
                        <div class="recommend-skeleton-line mt-4 h-7 w-full" />
                      </div>
                    </template>
                  </Carousel>

                  <p
                    v-else-if="!recommendedCards.length"
                    class="recommend-muted mt-3 text-xs"
                  >
                    {{ t('recommendationEmpty') }}
                  </p>

                  <Carousel
                    v-else
                    :value="recommendedCards"
                    :numVisible="RECOMMENDATION_VISIBLE_DESKTOP"
                    :numScroll="1"
                    :showNavigators="recommendedCards.length > RECOMMENDATION_VISIBLE_DESKTOP"
                    :showIndicators="recommendedCards.length > 1"
                    :responsiveOptions="recommendResponsiveOptions"
                    class="recommend-carousel mt-3"
                  >
                    <template #item="{ data: card }">
                    <article
                      class="recommend-card"
                      @click="openAssetProfile(card.symbol)"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0 flex items-center gap-2">
                          <StockIcon :symbol="card.symbol" class="recommend-icon" />
                          <div class="min-w-0">
                            <div class="text-sm font-semibold">{{ card.symbol }}</div>
                            <div class="recommend-muted truncate text-xs">{{ card.name }}</div>
                          </div>
                        </div>

                        <!-- <span class="recommend-score-badge rounded-full px-2 py-0.5 text-[10px] font-semibold">
                          {{ t('recommendationScore', { score: card.score.toFixed(3) }) }}
                        </span> -->
                      </div>

                      <div class="mt-3 inline-flex items-end gap-1">
                        <span class="text-base font-semibold">{{ splitPriceForEmphasis(card.regularMarketPrice).main }}</span>
                        <span>{{ splitPriceForEmphasis(card.regularMarketPrice).fraction }}</span>
                        <span class="recommend-muted text-[10px] font-semibold">{{ card.currency || splitPriceForEmphasis(card.regularMarketPrice).code }}</span>
                      </div>

                      <div
                        class="mt-2 text-xs font-semibold"
                        :class="recommendationGrowthClass(card.regularMarketChangePercent)"
                      >
                        <!-- {{ t('recommendationDailyChange') }}: -->
                        {{ formatSignedNumber(card.regularMarketChangePercent) }}%
                        <span class="ml-1">({{ formatSignedNumber(card.regularMarketChange) }})</span>
                      </div>

                      <Button
                        class="mt-4 w-full"
                        size="small"
                        :label="t('addToComparison')"
                        :disabled="isComparisonDisabled || !canAddRecommendationSymbol(card.symbol)"
                        @click.stop="addComparisonBySymbol(card)"
                      />
                    </article>
                    </template>
                  </Carousel>
                </div>
              </template>
            </AppCard>
          </div>

          <div class="flex flex-col gap-4">
            <AppCard class="w-full">
              <template #content>
                <div class="flex flex-col gap-3 text-sm">
                  <div class="flex justify-between border-b border-gray-300 dark:border-gray-700 py-4 px-0">
                    <span>{{ t('assetPreviousClose') }}</span>
                    <span class="font-semibold">{{ formatPrice(info.chartPreviousClose) }}</span>
                  </div>
                  <div class="flex justify-between border-b border-gray-300 dark:border-gray-700 py-4 px-0">
                    <span>{{ t('assetDayRange') }}</span>
                    <span class="font-semibold">{{ formatPrice(info.regularMarketDayLow) }} - {{ formatPrice(info.regularMarketDayHigh) }}</span>
                  </div>
                  <div class="flex justify-between border-b border-gray-300 dark:border-gray-700 py-4 px-0">
                    <span>{{ t('assetYearRange') }}</span>
                    <span class="font-semibold">{{ formatPrice(info.fiftyTwoWeekLow) }} - {{ formatPrice(info.fiftyTwoWeekHigh) }}</span>
                  </div>
                  <div class="flex justify-between border-b border-gray-300 dark:border-gray-700 py-4 px-0">
                    <span>{{ t('assetTodayVolume') }}</span>
                    <span class="font-semibold">{{ info.regularMarketVolume }}</span>
                  </div>
                  <div class="flex justify-between border-gray-300 py-4 px-0">
                    <span>{{ t('assetPrimaryExchange') }}</span>
                    <span class="font-semibold">{{ info.fullExchangeName }}</span>
                  </div>
                </div>
              </template>
            </AppCard>

            <AppCard class="w-full">
              <template #content>
                <div class="flex flex-col gap-3 text-sm">
                  <p
                    v-if="companyInfoError"
                    class="text-xs text-red-600 dark:text-red-300"
                  >
                    {{ t('companyInfoLoadFailed') }}
                  </p>

                  <div class="pt-3">
                    <p class="text-xs font-semibold text-slate-700 dark:text-slate-400 pb-3">{{ t('companyKeyStats') }}</p>

                    <div
                      v-for="(row, index) in companyKeyStatsRows"
                      :key="row.label"
                      class="flex justify-between py-3 px-0"
                      :class="index === companyKeyStatsRows.length - 1 ? '' : 'border-b border-gray-300 dark:border-gray-700'"
                    >
                      <span>{{ t(row.label) }}</span>
                      <span class="font-semibold text-right">{{ row.value }}</span>
                    </div>

                    <p
                      v-if="!companyKeyStatsRows.length"
                      class="mt-2 text-xs text-slate-700 dark:text-slate-400"
                    >
                      {{ t('companyKeyStatsEmpty') }}
                    </p>
                  </div>

                  <!-- 公司簡介 -->
                  <div
                    v-if="companyInfo.longBusinessSummary"
                    class="pt-3"
                  >
                    <p class="text-xs font-semibold text-slate-700 dark:text-slate-400">{{ t('companySummary') }}</p>
                    <p class="company-summary mt-2 text-xs">{{ companyInfo.longBusinessSummary }}</p>
                  </div>

                  <p
                    v-else-if="!companyInfoLoading && !hasCompanyInfo"
                    class="text-xs text-slate-700 dark:text-slate-400"
                  >
                    {{ t('companyInfoEmpty') }}
                  </p>
                </div>
              </template>
            </AppCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import SelectButton from 'primevue/selectbutton'
import Carousel from 'primevue/carousel'
import SymbolAutoComplete from '@/components/SymbolAutoComplete.vue'
import StockIcon from '@/components/StockIcon.vue'
import api from '@/utils/api'
import { useRoute, useRouter } from 'vue-router'
import { useCurrency } from '@/composables/useCurrency'
import { useTheme } from '@/composables/useTheme.js'

const { t, locale } = useI18n()
const { isDark } = useTheme()
const { formatPrice, formatPriceWithCode, displayCurrency } = useCurrency()

const route = useRoute()
const router = useRouter()
const symbol = computed(() => route.params.symbol)

const chartType = ref('area')
const currentRange = ref('3mo')

const MAX_COMPARE_SYMBOLS = 5
const MAX_RECOMMENDATION_CARDS = 5
const RECOMMENDATION_VISIBLE_DESKTOP = 4
const comparisonColorPalette = ['#60a5fa', '#f59e0b', '#22c55e', '#ef4444', '#a855f7', '#14b8a6']
const recommendSkeletonItems = ref(Array.from({ length: MAX_RECOMMENDATION_CARDS }, (_, idx) => ({ id: idx + 1 })))
const recommendResponsiveOptions = [
  {
    breakpoint: '1600px',
    numVisible: 3,
    numScroll: 1,
  },
  {
    breakpoint: '1100px',
    numVisible: 2,
    numScroll: 1,
  },
  {
    breakpoint: '768px',
    numVisible: 1,
    numScroll: 1,
  },
]

let mainRequestId = 0
let compareRequestId = 0
let recommendRequestId = 0
let companyRequestId = 0
let fundHoldingsRequestId = 0

const compareInput = ref('')
const compareSymbols = ref([])
const compareRawSeries = ref([])
const compareSelection = ref(null)
const compareNameMap = reactive({})
const comparisonNotice = ref({ key: '', params: {} })
const recommendedCards = ref([])
const recommendLoading = ref(false)
const recommendationWarningCount = ref(0)
const recommendationErrorKey = ref('')
const companyInfoLoading = ref(false)
const companyInfoError = ref(false)

const sectorWeightings = ref([])
const topHoldings = ref([])
const fundHoldingsLoading = ref(false)
const fundHoldingsError = ref(false)
const fundHoldingsTab = ref('sector')
const fundHoldingsTabOptions = computed(() => [
  { label: t('sectorWeightingsTitle'), value: 'sector' },
  { label: t('topHoldingsTitle'), value: 'holdings' },
])

// Yahoo topHoldings.sectorWeightings 的固定色彩對應，讓同一產業在不同 ETF 之間顏色一致
const SECTOR_META = {
  technology: { labelKey: 'sectorTechnology', light: '#2a78d6', dark: '#3987e5' },
  healthcare: { labelKey: 'sectorHealthcare', light: '#1baf7a', dark: '#199e70' },
  financial_services: { labelKey: 'sectorFinancialServices', light: '#eda100', dark: '#c98500' },
  consumer_cyclical: { labelKey: 'sectorConsumerCyclical', light: '#008300', dark: '#008300' },
  industrials: { labelKey: 'sectorIndustrials', light: '#4a3aa7', dark: '#9085e9' },
  communication_services: { labelKey: 'sectorCommunicationServices', light: '#e34948', dark: '#e66767' },
  consumer_defensive: { labelKey: 'sectorConsumerDefensive', light: '#e87ba4', dark: '#d55181' },
  energy: { labelKey: 'sectorEnergy', light: '#eb6834', dark: '#d95926' },
  // 較少見的產業別權重通常很小，使用中性灰階以免和主要 8 色搶戲
  utilities: { labelKey: 'sectorUtilities', light: '#6b6b66', dark: '#9a9990' },
  realestate: { labelKey: 'sectorRealEstate', light: '#8f8d86', dark: '#b9b7ae' },
  basic_materials: { labelKey: 'sectorBasicMaterials', light: '#52514e', dark: '#7d7b74' },
}

const rawQuotes = ref([])

const info = reactive({
  fullName: '',
  regularMarketPrice: 0,
  regularMarketTime: '',
  chartPreviousClose: 0,
  regularMarketDayHigh: 0,
  regularMarketDayLow: 0,
  fiftyTwoWeekHigh: 0,
  fiftyTwoWeekLow: 0,
  fullExchangeName: '',
  regularMarketVolume: 0,
})

const companyInfo = reactive({
  sector: '',
  industry: '',
  website: '',
  fullTimeEmployees: null,
  marketCap: null,
  beta: null,
  beta3Year: null,
  forwardPE: null,
  priceToBook: null,
  dividendYield: null,
  earningsQuarterlyGrowth: null,
  shortPercentOfFloat: null,
  category: '',
  fundFamily: '',
  legalType: '',
  totalAssets: null,
  ytdReturn: null,
  threeYearAverageReturn: null,
  fiveYearAverageReturn: null,
  quoteType: '',
  currency: '',
  city: '',
  state: '',
  country: '',
  longBusinessSummary: '',
})

const startDate = ref('')
const endDate = ref('')

const chartTypeOptions = computed(() => [
  { label: t('areaChart'), value: 'area', icon: 'pi pi-chart-line' },
  { label: t('klineChart'), value: 'candlestick', icon: 'pi pi-chart-bar' },
])

const periodLabelMap = {
  '7d': '7D',
  '1mo': '1M',
  '3mo': '3M',
  '6mo': '6M',
  ytd: 'YTD',
  '1y': '1Y',
  '5y': '5Y',
}

const selectedRangeLabel = computed(() => periodLabelMap[currentRange.value] || String(currentRange.value || '').toUpperCase())

const rangeOptions = computed(() => ([
  { label: t('period7d'), value: '7d' },
  { label: t('period1mo'), value: '1mo' },
  { label: t('period3mo'), value: '3mo' },
  { label: t('period6mo'), value: '6mo' },
  { label: t('periodYTD'), value: 'ytd' },
  { label: t('period1y'), value: '1y' },
  { label: t('period5y'), value: '5y' },
]))

function filterQuotesByRange(quotes, range) {
  const { period1, period2 } = getPeriodRange(range)
  const start = new Date(period1)
  const end = new Date(period2)
  end.setHours(23, 59, 59, 999)

  return quotes.filter(item => {
    const pointDate = new Date(item?.date)
    return !Number.isNaN(pointDate.getTime()) && pointDate >= start && pointDate <= end
  })
}

const currentRangeQuotes = computed(() => filterQuotesByRange(rawQuotes.value, currentRange.value))

const chartSeries = computed(() => [{ name: t('closePrice'), data: toLineSeriesFromQuotes(currentRangeQuotes.value) }])
const candleSeries = computed(() => [{ name: t('klineChart'), data: toCandleSeriesFromQuotes(currentRangeQuotes.value) }])

function computeRangeGrowth(range) {
  const list = toLineSeriesFromQuotes(filterQuotesByRange(rawQuotes.value, range))
  if (list.length < 2 || !list[0].y) return null

  return Number((((list[list.length - 1].y - list[0].y) / list[0].y) * 100).toFixed(2))
}

const rangeOptionsWithGrowth = computed(() => rangeOptions.value.map(option => ({
  ...option,
  growth: computeRangeGrowth(option.value),
})))

const growthRateNumber = computed(() => {
  const list = chartSeries.value[0].data
  if (!list || list.length < 2 || !list[0].y) return null

  return Number((((list[list.length - 1].y - list[0].y) / list[0].y) * 100).toFixed(2))
})

const change = computed(() => {
  const list = chartSeries.value[0].data
  if (!list || list.length < 2) return 0

  return list[list.length - 1].y - list[0].y
})

const comparisonNoticeText = computed(() => {
  if (!comparisonNotice.value.key) return ''
  return t(comparisonNotice.value.key, comparisonNotice.value.params)
})

const recommendationPartialText = computed(() => {
  if (!recommendationWarningCount.value) return ''
  return t('recommendationPartialHint', { count: recommendationWarningCount.value })
})

const recommendationErrorText = computed(() => {
  if (!recommendationErrorKey.value) return ''
  return t(recommendationErrorKey.value)
})

const companyTotalAssetsText = computed(() => {
  const normalized = Number(companyInfo.totalAssets)
  if (!Number.isFinite(normalized)) return '--'

  const formatterLocale = locale.value.startsWith('zh') ? 'zh-TW' : 'en-US'
  const currencyCode = String(companyInfo.currency || '').toUpperCase()

  if (currencyCode) {
    try {
      return new Intl.NumberFormat(formatterLocale, {
        style: 'currency',
        currency: currencyCode,
        notation: 'compact',
        maximumFractionDigits: 2,
      }).format(normalized)
    } catch {
      // Ignore invalid currency code and fall back to numeric compact formatting.
    }
  }

  return new Intl.NumberFormat(formatterLocale, {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(normalized)
})

const companyBetaText = computed(() => formatMetricNumber(companyInfo.beta, 2))
const companyForwardPEText = computed(() => formatMetricNumber(companyInfo.forwardPE, 2))
const companyPriceToBookText = computed(() => formatMetricNumber(companyInfo.priceToBook, 2))
const companyDividendYieldText = computed(() => formatMetricPercent(companyInfo.dividendYield, 2))
const companyEarningsQuarterlyGrowthText = computed(() => formatMetricPercent(companyInfo.earningsQuarterlyGrowth, 2))
const companyShortPercentOfFloatText = computed(() => formatMetricPercent(companyInfo.shortPercentOfFloat, 2))
const companyYtdReturnText = computed(() => formatMetricPercent(companyInfo.ytdReturn, 2))
const companyThreeYearAverageReturnText = computed(() => formatMetricPercent(companyInfo.threeYearAverageReturn, 2))
const companyFiveYearAverageReturnText = computed(() => formatMetricPercent(companyInfo.fiveYearAverageReturn, 2))

const isFundQuote = computed(() => {
  const quoteType = String(companyInfo.quoteType || '').toUpperCase()
  return quoteType === 'ETF' || quoteType === 'MUTUALFUND'
})

const companyKeyStatsRows = computed(() => {
  const stockRows = [
    { label: 'companyBeta', value: companyBetaText.value },
    { label: 'companyForwardPE', value: companyForwardPEText.value },
    { label: 'companyPriceToBook', value: companyPriceToBookText.value },
    { label: 'companyDividendYield', value: companyDividendYieldText.value },
    { label: 'companyEarningsQuarterlyGrowth', value: companyEarningsQuarterlyGrowthText.value },
    { label: 'companyShortPercentOfFloat', value: companyShortPercentOfFloatText.value },
  ]

  const fundRows = [
    { label: 'companyCategory', value: companyInfo.category || '--' },
    { label: 'companyFundFamily', value: companyInfo.fundFamily || '--' },
    { label: 'companyLegalType', value: companyInfo.legalType || '--' },
    { label: 'companyTotalAssets', value: companyTotalAssetsText.value },
    { label: 'companyDividendYield', value: companyDividendYieldText.value },
    { label: 'companyYtdReturn', value: companyYtdReturnText.value },
    { label: 'companyThreeYearAverageReturn', value: companyThreeYearAverageReturnText.value },
    { label: 'companyFiveYearAverageReturn', value: companyFiveYearAverageReturnText.value },
    { label: 'companyBeta3Year', value: formatMetricNumber(companyInfo.beta3Year, 2) },
  ]

  const baseRows = isFundQuote.value ? fundRows : stockRows
  return baseRows.filter(row => row.value !== '--')
})

const hasCompanyInfo = computed(() => {
  const hasText = [
    companyInfo.sector,
    companyInfo.industry,
    companyInfo.website,
    companyInfo.city,
    companyInfo.state,
    companyInfo.country,
    companyInfo.category,
    companyInfo.fundFamily,
    companyInfo.legalType,
    companyInfo.longBusinessSummary,
  ].some(item => String(item || '').trim().length > 0)

  const hasNumeric = [
    companyInfo.fullTimeEmployees,
    companyInfo.marketCap,
    companyInfo.beta,
    companyInfo.beta3Year,
    companyInfo.forwardPE,
    companyInfo.priceToBook,
    companyInfo.dividendYield,
    companyInfo.earningsQuarterlyGrowth,
    companyInfo.shortPercentOfFloat,
    companyInfo.totalAssets,
    companyInfo.ytdReturn,
    companyInfo.threeYearAverageReturn,
    companyInfo.fiveYearAverageReturn,
  ].some(item => Number.isFinite(Number(item)))

  return hasText || hasNumeric
})

const isComparisonDisabled = computed(() => chartType.value === 'candlestick')

const canAddComparison = computed(() => {
  if (isComparisonDisabled.value) return false
  return compareInput.value.trim().length > 0 && compareSymbols.value.length < MAX_COMPARE_SYMBOLS
})

function setComparisonNotice(key = '', params = {}) {
  comparisonNotice.value = { key, params }
}

function getSeriesColor(index) {
  return comparisonColorPalette[index % comparisonColorPalette.length]
}

function recommendationGrowthClass(value) {
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) return 'recommend-growth-neutral'
  return normalized >= 0 ? 'recommend-growth-up' : 'recommend-growth-down'
}

function toNullableNumber(value) {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : null
}

function formatMetricNumber(value, digits = 2) {
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) return '--'

  return normalized.toFixed(digits)
}

function formatMetricPercent(value, digits = 2) {
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) return '--'

  return `${(normalized * 100).toFixed(digits)}%`
}

function resetCompanyInfo() {
  Object.assign(companyInfo, {
    sector: '',
    industry: '',
    website: '',
    fullTimeEmployees: null,
    marketCap: null,
    beta: null,
    beta3Year: null,
    forwardPE: null,
    priceToBook: null,
    dividendYield: null,
    earningsQuarterlyGrowth: null,
    shortPercentOfFloat: null,
    category: '',
    fundFamily: '',
    legalType: '',
    totalAssets: null,
    ytdReturn: null,
    threeYearAverageReturn: null,
    fiveYearAverageReturn: null,
    quoteType: '',
    currency: '',
    city: '',
    state: '',
    country: '',
    longBusinessSummary: '',
  })
}

function canAddRecommendationSymbol(targetSymbol) {
  const normalized = String(targetSymbol || '').trim().toUpperCase()
  if (!normalized) return false

  const primarySymbol = String(symbol.value || '').trim().toUpperCase()
  if (normalized === primarySymbol) return false
  if (compareSymbols.value.includes(normalized)) return false

  return compareSymbols.value.length < MAX_COMPARE_SYMBOLS
}

function splitPriceForEmphasis(value) {
  const formatted = formatPriceWithCode(value)
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

function formatSignedNumber(value, digits = 2) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '--'
  const sign = n >= 0 ? '+' : '-'
  return `${sign}${Math.abs(n).toFixed(digits)}`
}

function formatDate(date) {
  return date.toISOString().split('T')[0]
}

function formatStrDate(dateStr, lang = 'en-US') {
  const date = new Date(dateStr)

  if (lang.startsWith('en')) {
    return new Intl.DateTimeFormat(lang, {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    }).format(date)
  }

  if (lang.startsWith('zh')) {
    const formatted = new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(date)
    const [year, month, day] = formatted.match(/\d+/g)
    return `${month}月${day}日, ${year}年`
  }

  return dateStr
}

function getPeriodRange(range) {
  const today = new Date()
  const end = formatDate(today)
  const daysMap = {
    '7d': 7,
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '1y': 365,
    '2y': 730,
    '5y': 1825,
  }

  if (range === 'ytd') {
    const start = new Date(today.getFullYear(), 0, 1)
    return {
      period1: formatDate(start),
      period2: end,
    }
  }

  const days = daysMap[range] || 30
  const start = new Date()
  start.setDate(start.getDate() - days)

  return {
    period1: formatDate(start),
    period2: end,
  }
}

// call 推薦股票 api
async function fetchRecommendedSymbols(targetSymbol = symbol.value) {
  const requestId = ++recommendRequestId
  const activeSymbol = String(targetSymbol || '').trim().toUpperCase()

  if (!activeSymbol) {
    recommendedCards.value = []
    recommendationWarningCount.value = 0
    recommendationErrorKey.value = ''
    return
  }

  recommendLoading.value = true
  recommendationErrorKey.value = ''

  try {
    const data = await api.get(`/api/yahoo/recommend/cards?symbol=${encodeURIComponent(activeSymbol)}&limit=${MAX_RECOMMENDATION_CARDS}`)
    if (requestId !== recommendRequestId) return

    const recommendations = Array.isArray(data?.recommendations) ? data.recommendations : []

    recommendedCards.value = recommendations
      .filter(item => item?.symbol)
      .map(item => ({
        symbol: String(item.symbol || '').toUpperCase(),
        name: item.name || item.longName || item.shortName || item.symbol,
        score: Number(item.score) || 0,
        regularMarketPrice: toNullableNumber(item.regularMarketPrice),
        regularMarketChange: toNullableNumber(item.regularMarketChange),
        regularMarketChangePercent: toNullableNumber(item.regularMarketChangePercent),
        currency: item.currency || '',
      }))

    recommendationWarningCount.value = Array.isArray(data?.warnings) ? data.warnings.length : 0
    recommendationErrorKey.value = ''
  } catch (error) {
    if (requestId !== recommendRequestId) return
    recommendedCards.value = []
    recommendationWarningCount.value = 0
    recommendationErrorKey.value = 'recommendationLoadFailed'
    console.error('推薦股票載入失敗:', error)
  } finally {
    if (requestId !== recommendRequestId) return
    recommendLoading.value = false
  }
}

async function fetchCompanyBasicInfo(targetSymbol = symbol.value) {
  const requestId = ++companyRequestId
  const activeSymbol = String(targetSymbol || '').trim().toUpperCase()

  if (!activeSymbol) {
    resetCompanyInfo()
    companyInfoError.value = false
    companyInfoLoading.value = false
    return
  }

  companyInfoLoading.value = true
  companyInfoError.value = false

  try {
    const data = await api.get(`/api/yahoo/summary?symbol=${encodeURIComponent(activeSymbol)}`)
    if (requestId !== companyRequestId) return

    const summaryProfile = data?.summaryProfile || {}
    const summaryDetail = data?.summaryDetail || {}
    const financialData = data?.financialData || {}
    const keyStatistics = data?.defaultKeyStatistics || {}
    const priceData = data?.price || {}
    const dividendYield = summaryDetail.dividendYield
      ?? summaryDetail.trailingAnnualDividendYield
      ?? keyStatistics.yield
    const beta3Year = toNullableNumber(keyStatistics.beta3Year)
    const beta = toNullableNumber(keyStatistics.beta ?? summaryDetail.beta ?? beta3Year)

    Object.assign(companyInfo, {
      sector: summaryProfile.sector || '',
      industry: summaryProfile.industry || '',
      website: summaryProfile.website || '',
      fullTimeEmployees: toNullableNumber(summaryProfile.fullTimeEmployees),
      marketCap: toNullableNumber(priceData.marketCap ?? financialData.marketCap),
      beta,
      beta3Year,
      forwardPE: toNullableNumber(keyStatistics.forwardPE ?? summaryDetail.forwardPE),
      priceToBook: toNullableNumber(keyStatistics.priceToBook),
      dividendYield: toNullableNumber(dividendYield),
      earningsQuarterlyGrowth: toNullableNumber(keyStatistics.earningsQuarterlyGrowth ?? financialData.earningsGrowth),
      shortPercentOfFloat: toNullableNumber(keyStatistics.shortPercentOfFloat),
      category: keyStatistics.category || '',
      fundFamily: keyStatistics.fundFamily || '',
      legalType: keyStatistics.legalType || '',
      totalAssets: toNullableNumber(keyStatistics.totalAssets),
      ytdReturn: toNullableNumber(keyStatistics.ytdReturn),
      threeYearAverageReturn: toNullableNumber(keyStatistics.threeYearAverageReturn),
      fiveYearAverageReturn: toNullableNumber(keyStatistics.fiveYearAverageReturn),
      quoteType: priceData.quoteType || '',
      currency: priceData.currency || financialData.financialCurrency || '',
      city: summaryProfile.city || '',
      state: summaryProfile.state || '',
      country: summaryProfile.country || '',
      longBusinessSummary: summaryProfile.longBusinessSummary || '',
    })
  } catch (error) {
    if (requestId !== companyRequestId) return
    resetCompanyInfo()
    companyInfoError.value = true
    console.error('公司基本資料載入失敗:', error)
  } finally {
    if (requestId !== companyRequestId) return
    companyInfoLoading.value = false
  }
}

async function fetchFundHoldings(targetSymbol = symbol.value) {
  const requestId = ++fundHoldingsRequestId
  const activeSymbol = String(targetSymbol || '').trim().toUpperCase()

  if (!activeSymbol) {
    sectorWeightings.value = []
    topHoldings.value = []
    fundHoldingsError.value = false
    fundHoldingsLoading.value = false
    return
  }

  fundHoldingsLoading.value = true
  fundHoldingsError.value = false

  try {
    const data = await api.get(`/api/yahoo/fund-holdings?symbol=${encodeURIComponent(activeSymbol)}`)
    if (requestId !== fundHoldingsRequestId) return
    sectorWeightings.value = Array.isArray(data?.sectorWeightings) ? data.sectorWeightings : []
    topHoldings.value = Array.isArray(data?.holdings) ? data.holdings : []
  } catch (error) {
    if (requestId !== fundHoldingsRequestId) return
    sectorWeightings.value = []
    topHoldings.value = []
    fundHoldingsError.value = true
    console.error('基金持股資料載入失敗:', error)
  } finally {
    if (requestId !== fundHoldingsRequestId) return
    fundHoldingsLoading.value = false
  }
}

function openAssetProfile(targetSymbol) {
  const nextSymbol = String(targetSymbol || '').trim().toUpperCase()
  if (!nextSymbol) return
  router.push({ name: 'asset', params: { symbol: nextSymbol } })
}

function addComparisonBySymbol(payload) {
  if (isComparisonDisabled.value) {
    setComparisonNotice('comparisonDisabledForCandlestick')
    return
  }

  const nextSymbol = String(payload?.symbol || '').trim().toUpperCase()
  if (!nextSymbol) return

  compareInput.value = nextSymbol
  if (payload?.name) {
    compareNameMap[nextSymbol] = payload.name
  }
  addComparisonSymbol()
}

function toLineSeriesFromQuotes(quotes) {
  return quotes
    .filter(item => item?.close !== null && item?.date)
    .map(item => ({
      x: new Date(item.date),
      y: Number(Number(item.close).toFixed(2)),
    }))
    .filter(item => !Number.isNaN(item.x.getTime()) && Number.isFinite(item.y))
    .sort((a, b) => a.x - b.x)
}

function toCandleSeriesFromQuotes(quotes) {
  return quotes
    .filter(item => item?.open !== null && item?.close !== null && item?.high !== null && item?.low !== null && item?.date)
    .map(item => ({
      x: new Date(item.date),
      y: [
        Number(Number(item.open).toFixed(2)),
        Number(Number(item.high).toFixed(2)),
        Number(Number(item.low).toFixed(2)),
        Number(Number(item.close).toFixed(2)),
      ],
    }))
    .filter(item => !Number.isNaN(item.x.getTime()))
    .sort((a, b) => a.x - b.x)
}

function toPriceSeries(points) {
  return points
    .map(point => {
      const pointDate = point.x instanceof Date ? point.x : new Date(point.x)
      const price = Number(point.y)
      if (!Number.isFinite(price) || Number.isNaN(pointDate.getTime())) return null

      return {
        x: pointDate,
        y: Number(price.toFixed(2)),
      }
    })
    .filter(Boolean)
}

const areaSeries = computed(() => {
  const merged = []
  const primarySymbol = String(symbol.value || '').toUpperCase() || t('closePrice')
  const primarySeries = toPriceSeries(chartSeries.value[0].data)
  const primaryColor = getSeriesColor(0)

  if (primarySeries.length) {
    merged.push({
      type: 'area',
      name: primarySymbol,
      data: primarySeries.map(point => [point.x.getTime(), point.y]),
      color: primaryColor,
      fillColor: {
        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
        stops: [[0, 'rgba(96,165,250,0.28)'], [1, 'rgba(255,255,255,0)']],
      },
      lineWidth: 2,
    })
  }

  compareRawSeries.value.forEach((item, index) => {
    const priceSeries = toPriceSeries(item.data)
    if (!priceSeries.length) return
    merged.push({
      type: 'line',
      name: item.symbol,
      data: priceSeries.map(point => [point.x.getTime(), point.y]),
      color: getSeriesColor(index + 1),
      lineWidth: 2,
    })
  })

  return merged
})

const highAreaOptions = computed(() => {
  const axisColor = isDark.value ? '#9ca3af' : '#999'
  const gridColor = isDark.value ? '#374151' : '#eee'
  const tooltipBg = isDark.value ? '#1f2937' : '#fff'
  const tooltipFg = isDark.value ? '#f3f4f6' : '#374151'

  const yValues = areaSeries.value
    .flatMap(series => series.data.map(point => Number(point[1])))
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
    chart: { type: 'area', backgroundColor: 'transparent', animation: { duration: 400 } },
    title: { text: null },
    credits: { enabled: false },
    legend: {
      enabled: areaSeries.value.length > 1,
      itemStyle: { color: axisColor },
    },
    xAxis: {
      type: 'datetime',
      labels: {
        formatter: function () {
          return chartDateFormatter.format(new Date(this.value))
        },
        style: { fontSize: '12px', color: axisColor },
      },
      lineColor: gridColor,
      tickColor: gridColor,
    },
    yAxis: {
      title: { text: t('closePrice'), style: { color: axisColor } },
      min: yMin !== null ? yMin - yPadding : undefined,
      max: yMax !== null ? yMax + yPadding : undefined,
      startOnTick: false,
      endOnTick: false,
      labels: {
        formatter: function () {
          return formatPrice(this.value)
        },
        style: { fontSize: '12px', color: axisColor },
      },
      gridLineDashStyle: 'Dash',
      gridLineColor: gridColor,
    },
    tooltip: {
      xDateFormat: '%Y/%m/%d',
      valueDecimals: 2,
      shared: true,
      backgroundColor: tooltipBg,
      style: { color: tooltipFg },
    },
    plotOptions: {
      series: {
        marker: { enabled: false },
      },
      area: {
        threshold: null,
        softThreshold: false,
        states: { hover: { enabled: true } },
      },
    },
    series: areaSeries.value,
  }
})

const highCandleOptions = computed(() => {
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
    chart: { type: 'candlestick', backgroundColor: 'transparent', animation: { duration: 400 } },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      type: 'datetime',
      labels: {
        formatter: function () {
          return chartDateFormatter.format(new Date(this.value))
        },
        style: { color: axisColor },
      },
    },
    yAxis: {
      title: { text: t('priceUSD'), style: { color: axisColor } },
      labels: {
        formatter: function () {
          return `$${this.value.toFixed(2)}`
        },
        style: { color: axisColor },
      },
      gridLineColor: gridColor,
    },
    tooltip: {
      xDateFormat: '%Y/%m/%d',
      backgroundColor: tooltipBg,
      style: { color: tooltipFg },
    },
    plotOptions: {
      candlestick: {
        color: '#ef4444',
        upColor: '#10b981',
        lineColor: '#ef4444',
        upLineColor: '#10b981',
      },
    },
    series: [{
      type: 'candlestick',
      name: t('klineChart'),
      data: candleSeries.value[0].data.map(d => {
        const ts = d.x instanceof Date ? d.x.getTime() : new Date(d.x).getTime()
        return [ts, d.y[0], d.y[1], d.y[2], d.y[3]]
      }),
    }],
  }
})

const sectorWeightingsData = computed(() => sectorWeightings.value
  .map(item => {
    const meta = SECTOR_META[item.sector]
    const weight = Number(item.weight)
    if (!meta || !Number.isFinite(weight) || weight <= 0) return null
    return {
      name: t(meta.labelKey),
      value: Number((weight * 100).toFixed(2)),
      color: isDark.value ? meta.dark : meta.light,
    }
  })
  .filter(Boolean)
  .sort((a, b) => b.value - a.value))

const sectorTreemapOptions = computed(() => {
  const labelColor = '#ffffff'
  const tooltipBg = isDark.value ? '#1f2937' : '#fff'
  const tooltipFg = isDark.value ? '#f3f4f6' : '#374151'
  const borderColor = isDark.value ? '#0f172a' : '#ffffff'

  return {
    chart: { type: 'treemap', backgroundColor: 'transparent', animation: { duration: 400 } },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false },
    tooltip: {
      backgroundColor: tooltipBg,
      style: { color: tooltipFg },
      formatter: function () {
        return `<b>${this.point.name}</b><br/>${this.point.value.toFixed(2)}%`
      },
    },
    series: [{
      type: 'treemap',
      layoutAlgorithm: 'squarified',
      alternateStartingDirection: true,
      borderColor,
      borderWidth: 2,
      dataLabels: {
        enabled: true,
        style: {
          color: labelColor,
          textOutline: '1px rgba(0,0,0,0.45)',
          fontSize: '12px',
          fontWeight: '600',
        },
        formatter: function () {
          return `${this.point.name}<br/>${this.point.value.toFixed(1)}%`
        },
      },
      data: sectorWeightingsData.value,
    }],
  }
})

// 前十大持股用單一藍色系依權重深淺呈現（權重也已經用方塊大小表達，顏色只是加強視覺對比）
const HOLDING_COLOR_STOPS = {
  light: ['#cde2fb', '#0d366b'],
  dark: ['#173963', '#7fb2f5'],
}

function interpolateHoldingColor(ratio, mode) {
  const [fromHex, toHex] = HOLDING_COLOR_STOPS[mode]
  const from = [1, 3, 5].map(i => parseInt(fromHex.slice(i, i + 2), 16))
  const to = [1, 3, 5].map(i => parseInt(toHex.slice(i, i + 2), 16))
  const mixed = from.map((channel, i) => Math.round(channel + (to[i] - channel) * ratio))
  return `#${mixed.map(v => v.toString(16).padStart(2, '0')).join('')}`
}

const topHoldingsData = computed(() => {
  const rows = topHoldings.value
    .map(item => {
      const weight = Number(item.weight)
      if (!item.symbol || !Number.isFinite(weight) || weight <= 0) return null
      return { symbol: item.symbol, name: item.name || item.symbol, value: Number((weight * 100).toFixed(2)) }
    })
    .filter(Boolean)
    .sort((a, b) => b.value - a.value)

  const maxValue = rows.length ? rows[0].value : 0
  const mode = isDark.value ? 'dark' : 'light'

  return rows.map(row => ({
    ...row,
    color: interpolateHoldingColor(maxValue > 0 ? row.value / maxValue : 0, mode),
  }))
})

const topHoldingsTreemapOptions = computed(() => {
  const labelColor = '#ffffff'
  const tooltipBg = isDark.value ? '#1f2937' : '#fff'
  const tooltipFg = isDark.value ? '#f3f4f6' : '#374151'
  const borderColor = isDark.value ? '#0f172a' : '#ffffff'

  return {
    chart: { type: 'treemap', backgroundColor: 'transparent', animation: { duration: 400 } },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false },
    tooltip: {
      backgroundColor: tooltipBg,
      style: { color: tooltipFg },
      formatter: function () {
        return `<b>${this.point.symbol}</b> ${this.point.name}<br/>${this.point.value.toFixed(2)}%`
      },
    },
    series: [{
      type: 'treemap',
      layoutAlgorithm: 'squarified',
      alternateStartingDirection: true,
      borderColor,
      borderWidth: 2,
      dataLabels: {
        enabled: true,
        style: {
          color: labelColor,
          textOutline: '1px rgba(0,0,0,0.45)',
          fontSize: '12px',
          fontWeight: '600',
        },
        formatter: function () {
          return `${this.point.symbol}<br/>${this.point.value.toFixed(1)}%`
        },
      },
      data: topHoldingsData.value.map(row => ({ name: row.name, symbol: row.symbol, value: row.value, color: row.color })),
    }],
  }
})

async function fetchComparisonData(period1, period2) {
  if (chartType.value !== 'area') return

  if (!compareSymbols.value.length) {
    compareRawSeries.value = []
    setComparisonNotice()
    return
  }

  const requestId = ++compareRequestId
  const targetSymbols = [...compareSymbols.value]

  try {
    const settled = await Promise.allSettled(
      targetSymbols.map(item => api.get(`/api/yahoo/chart?symbol=${encodeURIComponent(item)}&period1=${period1}&period2=${period2}`))
    )

    if (requestId !== compareRequestId) return

    let failedCount = 0
    const nextSeries = []

    settled.forEach((result, index) => {
      if (result.status !== 'fulfilled') {
        failedCount += 1
        return
      }

      const itemSymbol = targetSymbols[index]
      const quotes = result.value?.quotes || []
      const lineData = toLineSeriesFromQuotes(quotes)

      if (!lineData.length) {
        failedCount += 1
        return
      }

      nextSeries.push({
        symbol: itemSymbol,
        name: compareNameMap[itemSymbol] || itemSymbol,
        data: lineData,
      })
    })

    compareRawSeries.value = nextSeries

    if (failedCount > 0) {
      setComparisonNotice('comparisonPartialLoadFailed', { count: failedCount })
    } else if (!nextSeries.length) {
      setComparisonNotice('comparisonNoData')
    } else {
      setComparisonNotice()
    }
  } catch (error) {
    if (requestId !== compareRequestId) return
    compareRawSeries.value = []
    console.error('對比資料載入失敗:', error)
    setComparisonNotice('comparisonLoadFailed')
  }
}

function syncComparisonData() {
  if (chartType.value === 'candlestick') {
    if (compareSymbols.value.length) {
      setComparisonNotice('comparisonDisabledForCandlestick')
    }
    return
  }

  const { period1, period2 } = getPeriodRange(currentRange.value)
  fetchComparisonData(period1, period2)
}

async function fetchChartData(targetSymbol) {
  const requestId = ++mainRequestId
  // 一次抓取最大區間（5年）的原始資料，各時間範圍按鈕改為在前端切片計算，避免每次切換都重打 API
  const { period1, period2 } = getPeriodRange('5y')
  const activeSymbol = String(targetSymbol || symbol.value || '').toUpperCase()

  try {
    const data = await api.get(`/api/yahoo/chart?symbol=${encodeURIComponent(activeSymbol)}&period1=${period1}&period2=${period2}`)
    if (requestId !== mainRequestId) return

    const quotes = data?.quotes || []
    const meta = data?.meta || {}

    Object.assign(info, {
      fullName: meta.longName || activeSymbol,
      regularMarketPrice: meta.regularMarketPrice || 0,
      regularMarketDayHigh: meta.regularMarketDayHigh || 0,
      regularMarketDayLow: meta.regularMarketDayLow || 0,
      regularMarketTime: meta.regularMarketTime || '',
      chartPreviousClose: meta.chartPreviousClose || 0,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
      fullExchangeName: meta.fullExchangeName || '',
      regularMarketVolume: meta.regularMarketVolume || 0,
    })

    rawQuotes.value = quotes
  } catch (error) {
    if (requestId !== mainRequestId) return
    rawQuotes.value = []
    compareRawSeries.value = []
    console.error('取得資料失敗:', error)
    if (compareSymbols.value.length) {
      setComparisonNotice('comparisonLoadFailed')
    }
  }
}

function onCompareSymbolSelected(payload) {
  if (!payload?.symbol) return
  compareSelection.value = payload
  compareInput.value = payload.symbol
}

function addComparisonSymbol() {
  const nextSymbol = String(compareInput.value || '').trim().toUpperCase()
  if (!nextSymbol) return

  const primarySymbol = String(symbol.value || '').trim().toUpperCase()
  if (nextSymbol === primarySymbol) {
    setComparisonNotice('comparisonCannotMatchPrimary')
    return
  }

  if (compareSymbols.value.includes(nextSymbol)) {
    setComparisonNotice('comparisonDuplicate')
    return
  }

  if (compareSymbols.value.length >= MAX_COMPARE_SYMBOLS) {
    setComparisonNotice('comparisonMaxReached', { max: MAX_COMPARE_SYMBOLS })
    return
  }

  compareSymbols.value = [...compareSymbols.value, nextSymbol]

  if (compareSelection.value?.symbol?.toUpperCase() === nextSymbol) {
    compareNameMap[nextSymbol] = compareSelection.value.name || nextSymbol
  } else if (!compareNameMap[nextSymbol]) {
    compareNameMap[nextSymbol] = nextSymbol
  }

  compareInput.value = ''
  compareSelection.value = null
}

function removeComparisonSymbol(targetSymbol) {
  compareSymbols.value = compareSymbols.value.filter(item => item !== targetSymbol)
  delete compareNameMap[targetSymbol]
}

function clearComparisonSymbols() {
  compareSymbols.value = []
  compareRawSeries.value = []
  compareInput.value = ''
  compareSelection.value = null
  setComparisonNotice()
}

function formatUTC8(isoString) {
  if (!isoString) return '--'
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return '--'

  const utc8Time = date.getTime() + 8 * 60 * 60 * 1000
  const utc8Date = new Date(utc8Time)
  const pad = n => String(n).padStart(2, '0')

  const month = utc8Date.getUTCMonth() + 1
  const day = utc8Date.getUTCDate()
  let hour = utc8Date.getUTCHours()
  const minute = pad(utc8Date.getUTCMinutes())
  const second = pad(utc8Date.getUTCSeconds())
  const period = hour >= 12 ? '下午' : '上午'

  if (hour > 12) hour -= 12
  if (hour === 0) hour = 12

  return `${month}月${day}日, ${period}${hour}:${minute}:${second} [UTC+8]`
}

watch(symbol, nextSymbol => {
  const normalized = String(nextSymbol || '').toUpperCase()
  compareSymbols.value = compareSymbols.value.filter(item => item !== normalized)
  fetchRecommendedSymbols(normalized)
  fetchCompanyBasicInfo(normalized)
  fetchFundHoldings(normalized)
  document.querySelector('.app-shell__scroll')?.scrollTo({ top: 0 })
}, { immediate: true })

watch(symbol, nextSymbol => {
  fetchChartData(nextSymbol)
}, { immediate: true })

watch([currentRange, chartType], () => {
  syncComparisonData()
}, { immediate: true })

watch(compareSymbols, () => {
  syncComparisonData()
}, { deep: true })

watch(locale, () => {
  const { period1, period2 } = getPeriodRange(currentRange.value)
  const localeCode = locale.value || 'en-US'
  startDate.value = formatStrDate(period1, localeCode)
  endDate.value = formatStrDate(period2, localeCode)
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

.asset-kicker {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--p-text-muted-color, #64748b);
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

.asset-range-row {
  display: flex;
  justify-content: space-between;
  gap: 0.25rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--p-content-border-color, #e5e7eb);
}

.asset-range-btn {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  border-radius: 0.6rem;
  padding: 0.35rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--p-text-color);
  background: transparent;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.asset-range-btn:hover {
  background: color-mix(in srgb, var(--p-primary-color) 10%, transparent);
}

.asset-range-btn--active {
  background: color-mix(in srgb, var(--p-primary-color) 16%, transparent);
  color: var(--p-primary-color);
}

.asset-range-btn-growth {
  font-size: 0.68rem;
  font-weight: 700;
}

.asset-range-btn-growth--up {
  color: #16a34a;
}

.asset-range-btn-growth--down {
  color: #dc2626;
}

.asset-range-btn-growth--muted {
  color: var(--p-text-muted-color, #64748b);
}

.p-breadcrumb {
  background: var(--p-surface-background);
}

.compare-chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  border: 1px solid var(--p-surface-300, #d1d5db);
  border-radius: 9999px;
  padding: 0.35rem 0.6rem;
  font-size: 0.75rem;
  line-height: 1;
  transition: all 0.2s ease;
}

.compare-chip:hover {
  border-color: var(--p-primary-color);
  color: var(--p-primary-color);
}

.recommend-card {
  border: 1px solid var(--p-content-border-color, #d1d5db);
  border-radius: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  background: var(--p-content-background, #ffffff);
  color: var(--p-text-color, #111827);
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  min-height: 162px;
}

.recommend-card:hover {
  border-color: var(--p-primary-color);
  /* transform: translateY(-1px); */
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
}

.recommend-icon {
  margin-right: 0 !important;
}

.recommend-muted {
  color: var(--p-text-muted-color, #64748b);
}

.recommend-score-badge {
  border: 1px solid color-mix(in srgb, var(--p-primary-color) 35%, transparent);
  background: color-mix(in srgb, var(--p-primary-color) 14%, var(--p-content-background));
  color: color-mix(in srgb, var(--p-primary-color) 70%, var(--p-text-color));
}

.recommend-hint {
  color: #d97706;
}

.recommend-error {
  color: #dc2626;
}

.recommend-growth-up {
  color: #16a34a;
}

.recommend-growth-down {
  color: #dc2626;
}

.recommend-growth-neutral {
  color: var(--p-text-muted-color, #64748b);
}

.recommend-card--skeleton {
  border-color: var(--p-content-border-color, #d1d5db);
}

.recommend-skeleton-line {
  height: 0.75rem;
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--p-text-muted-color) 18%, transparent);
}

.recommend-carousel :deep(.p-carousel-container) {
  align-items: stretch;
}

.recommend-carousel :deep(.p-carousel-content) {
  padding: 0.2rem 0;
}

.recommend-carousel :deep(.p-carousel-item) {
  padding: 0 0.35rem;
}

.recommend-carousel :deep(.p-carousel-prev-button),
.recommend-carousel :deep(.p-carousel-next-button) {
  width: 1.8rem;
  height: 1.8rem;
  color: var(--p-text-muted-color, #64748b);
  border: 1px solid var(--p-content-border-color, #d1d5db);
  background: var(--p-content-background, #ffffff);
}

.recommend-carousel :deep(.p-carousel-prev-button:hover),
.recommend-carousel :deep(.p-carousel-next-button:hover) {
  color: var(--p-primary-color);
  border-color: var(--p-primary-color);
}

.recommend-carousel :deep(.p-carousel-indicator button) {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--p-text-muted-color) 45%, transparent);
}

.recommend-carousel :deep(.p-carousel-indicator.p-highlight button) {
  background: var(--p-primary-color);
}

.company-link {
  color: var(--p-primary-color);
  text-decoration: underline;
  text-underline-offset: 2px;
  word-break: break-all;
}

.company-summary {
  color: var(--p-text-muted-color, #64748b);
  line-clamp: 4;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.45;
}
</style>