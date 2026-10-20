<template>
  <div>
    <Teleport defer to="#page-title-aside">
      <span v-if="info.regularMarketTime">{{ t('lastUpdated', { time: formatUpdatedAt(info.regularMarketTime) }) }}</span>
    </Teleport>
    <div>
      <Teleport defer to="#page-title-actions">
        <Button
          :icon="isWatched ? 'pi pi-star-fill' : 'pi pi-star'"
          text
          rounded
          size="large"
          :severity="isWatched ? 'warn' : 'secondary'"
          :aria-label="watchLabel"
          :aria-pressed="isWatched"
          v-tooltip.top="{ value: watchLabel, showDelay: 500 }"
          @click="toggleWatch()"
        />
      </Teleport>
      <div class="flex items-center">
        <p class="text-muted-color">{{ info.fullName }}</p>
      </div>
      <div class="chart-container">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
          <div class="min-w-0 lg:col-span-2 flex flex-col gap-4">
            <Card class="app-panel w-full">
              <template #content>
                <div>
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <div class="flex flex-col">
                      <div class="flex flex-wrap items-end gap-2">
                        <div class="text-4xl font-bold inline-flex items-end">
                          <span>{{ splitPriceForEmphasis(info.regularMarketPrice).main }}</span>
                          <span>{{ splitPriceForEmphasis(info.regularMarketPrice).fraction }}</span>
                          <span class="ml-1 text-[10px] leading-none pb-1 font-semibold">{{ splitPriceForEmphasis(info.regularMarketPrice).code }}</span>
                        </div>

                        <div
                          v-if="growthRateNumber !== null"
                          class="inline-flex items-center gap-2 pb-1"
                        >
                          <span class="asset-growth-change" :class="growthRateNumber >= 0 ? 'text-up' : 'text-down'">
                            <i :class="growthRateNumber >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" aria-hidden="true"></i>
                            {{ formatSignedNumber(growthRateNumber) }}%
                            ({{ formatSignedNumber(change) }})
                          </span>
                        </div>

                        <div v-else class="inline-flex items-center gap-2 pb-1 text-lg text-muted-color">
                          <span>--</span>
                          <span>(--)</span>
                        </div>
                      </div>
                      <p v-if="marketTimeText" class="mt-1 text-xs text-muted-color">{{ marketTimeText }}</p>
                    </div>

                  <div class="chart-toolbar">
                      <Button
                        size="small"
                        text
                        severity="secondary"
                        aria-haspopup="menu"
                        :aria-expanded="chartTypeMenuOpen"
                        @click="chartTypeMenu.toggle($event)"
                      >
                        <i :class="activeChartType.icon" aria-hidden="true"></i>
                        <span class="font-semibold">{{ activeChartType.label }}</span>
                        <i class="pi text-xs" :class="chartTypeMenuOpen ? 'pi-chevron-up' : 'pi-chevron-down'" aria-hidden="true"></i>
                      </Button>
                      <Menu
                        ref="chartTypeMenu"
                        :model="chartTypeMenuItems"
                        popup
                        @show="chartTypeMenuOpen = true"
                        @hide="chartTypeMenuOpen = false"
                      />

                      <Button
                        size="small"
                        text
                        severity="secondary"
                        :disabled="isComparisonDisabled"
                        aria-haspopup="dialog"
                        :aria-expanded="comparePopoverOpen"
                        @click="comparePopover.toggle($event)"
                      >
                        <i class="pi pi-chart-line" aria-hidden="true"></i>
                        <span class="font-semibold">{{ t('compareAssets') }}</span>
                        <i class="pi text-xs" :class="comparePopoverOpen ? 'pi-chevron-up' : 'pi-chevron-down'" aria-hidden="true"></i>
                      </Button>
                      <Popover
                        ref="comparePopover"
                        @show="onComparePopoverShow"
                        @hide="comparePopoverOpen = false"
                      >
                        <div class="compare-popover">
                          <div class="flex items-center gap-1">
                            <IconField class="flex-1">
                              <InputIcon class="pi pi-search" />
                              <InputText
                                ref="compareSearchInput"
                                v-model="compareQuery"
                                :placeholder="t('inputSymbol')"
                                :aria-label="t('inputSymbol')"
                                fluid
                              />
                            </IconField>
                            <Button
                              v-if="compareQuery"
                              icon="pi pi-times"
                              text
                              rounded
                              severity="secondary"
                              size="small"
                              :aria-label="t('clear')"
                              v-tooltip.top="{ value: t('clear'), showDelay: 500 }"
                              @click="compareQuery = ''; compareSearchInput?.$el?.focus()"
                            />
                          </div>

                          <div class="compare-popover-heading">
                            <span>{{ t(compareQuery.trim() ? 'compareAssets' : 'relatedStocks') }}</span>
                            <span>{{ t('comparisonLimitHint', { max: MAX_COMPARE_SYMBOLS }) }}</span>
                          </div>

                          <Listbox
                            :modelValue="compareSymbols"
                            :options="compareOptions"
                            optionLabel="symbol"
                            optionValue="symbol"
                            multiple
                            :metaKeySelection="false"
                            :optionDisabled="item => !isCardCompared(item.symbol) && !canAddRecommendationSymbol(item.symbol)"
                            :emptyMessage="t(compareQuery.trim() ? 'noResults' : (recommendationErrorKey || 'recommendationEmpty'))"
                            :ariaLabel="t('compareAssets')"
                            scrollHeight="20rem"
                            class="w-full !border-0 !bg-transparent !shadow-none"
                            @update:modelValue="onCompareListChange"
                          >
                            <template #option="{ option }">
                              <div class="flex w-full min-w-0 items-center justify-between gap-3">
                                <div class="min-w-0">
                                  <div class="font-semibold">{{ option.symbol }}</div>
                                  <div class="truncate text-xs text-muted-color">{{ option.name }}</div>
                                </div>
                                <div v-if="Number.isFinite(option.regularMarketPrice)" class="shrink-0 text-right">
                                  <div class="font-semibold">{{ Number(option.regularMarketPrice).toFixed(2) }}</div>
                                  <div class="text-xs font-semibold" :class="recommendationGrowthClass(option.regularMarketChangePercent)">
                                    {{ formatSignedNumber(option.regularMarketChangePercent) }}%
                                  </div>
                                </div>
                                <i v-if="isCardCompared(option.symbol)" class="pi pi-check shrink-0 text-xs" aria-hidden="true"></i>
                              </div>
                            </template>
                          </Listbox>

                          <div v-if="compareSymbols.length" class="compare-popover-footer">
                            <Button
                              size="small"
                              text
                              severity="secondary"
                              :label="t('clearComparisons')"
                              @click="clearComparisonSymbols"
                            />
                          </div>
                        </div>
                      </Popover>
                  </div>
                  </div>

                  <p
                    v-if="isComparisonDisabled && compareSymbols.length"
                    class="mt-2 text-xs text-muted-color"
                  >
                    {{ t('comparisonDisabledForCandlestick') }}
                  </p>
                  <p
                    v-else-if="comparisonNoticeText"
                    class="mt-2 text-xs text-orange-600 dark:text-orange-300"
                  >
                    {{ comparisonNoticeText }}
                  </p>

                  <div v-if="compareSymbols.length && !isComparisonDisabled" class="mt-3 flex flex-wrap gap-2">
                    <span class="compare-chip compare-chip--static">
                      <span class="compare-chip-dot" :style="{ background: getSeriesColor(0) }"></span>
                      <span class="font-semibold">{{ String(symbol || '').toUpperCase() }}</span>
                    </span>
                    <button
                      v-for="(item, index) in compareSymbols"
                      :key="item"
                      type="button"
                      class="compare-chip"
                      :aria-label="`${t('removeFromComparison')} ${item}`"
                      @click="removeComparisonSymbol(item)"
                    >
                      <span class="compare-chip-dot" :style="{ background: getSeriesColor(index + 1) }"></span>
                      <span class="font-semibold">{{ item }}</span>
                      <span
                        v-if="compareNameMap[item] && compareNameMap[item] !== item"
                        class="ml-1 max-w-28 truncate text-xs text-muted-color"
                      >
                        {{ compareNameMap[item] }}
                      </span>
                      <i class="pi pi-times ml-2 text-xs" />
                    </button>
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

                  <SelectButton
                    v-model="currentRange"
                    :options="rangeOptionsWithGrowth"
                    optionLabel="label"
                    optionValue="value"
                    :allowEmpty="false"
                    fluid
                    class="range-select mt-4"
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

                  <dl class="mt-5 grid grid-cols-1 gap-x-8 text-xs sm:grid-cols-2">
                    <div v-for="row in quoteStatsRows" :key="row.label" class="flex items-baseline justify-between gap-4 border-b border-surface py-2">
                      <dt class="whitespace-nowrap text-muted-color">{{ t(row.label) }}</dt>
                      <dd class="whitespace-nowrap font-semibold text-right">{{ row.value }}</dd>
                    </div>
                  </dl>
                </div>
              </template>
            </Card>

            <Card v-if="isFundQuote" class="app-panel w-full">
              <template #content>
                <div>
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-sm font-semibold">{{ t(fundHoldingsTab === 'sector' ? 'sectorWeightingsTitle' : 'topHoldingsTitle') }}</span>

                    <SelectButton
                      v-model="fundHoldingsTab"
                      :options="fundHoldingsTabOptions"
                      optionLabel="label"
                      optionValue="value"
                      :allowEmpty="false"
                      size="small"
                    />
                  </div>

                  <p
                    v-if="fundHoldingsError"
                    class="mt-2 text-xs text-red-600 dark:text-red-300"
                  >
                    {{ t(fundHoldingsTab === 'sector' ? 'sectorWeightingsLoadFailed' : 'topHoldingsLoadFailed') }}
                  </p>

                  <Skeleton v-if="fundHoldingsLoading" height="18rem" class="mt-3" />

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
                    class="mt-3 text-xs text-muted-color"
                  >
                    {{ t(fundHoldingsTab === 'sector' ? 'sectorWeightingsEmpty' : 'topHoldingsEmpty') }}
                  </p>
                </div>
              </template>
            </Card>

          </div>

          <div class="min-w-0 flex flex-col gap-4">
            <Card class="app-panel w-full">
              <template #content>
                <div>
                  <span class="text-sm font-semibold">{{ t('relatedStocks') }}</span>

                  <div v-if="recommendLoading" class="trending-list mt-2">
                    <div v-for="n in 5" :key="n" class="trending-row cursor-default">
                      <div class="min-w-0">
                        <Skeleton width="3rem" height="0.8rem" />
                        <Skeleton width="7rem" height="0.8rem" class="mt-1" />
                      </div>
                      <Skeleton width="4.5rem" height="1.75rem" />
                      <Skeleton width="4.5rem" height="1.75rem" />
                    </div>
                  </div>

                  <p v-else-if="!recommendedCards.length" class="mt-3 text-xs text-muted-color">
                    {{ t(recommendationErrorKey || 'recommendationEmpty') }}
                  </p>

                  <div v-else class="trending-list mt-2">
                    <div
                      v-for="item in recommendedCards"
                      :key="item.symbol"
                      class="trending-row"
                      role="link"
                      tabindex="0"
                      @click="openAssetProfile(item.symbol)"
                      @keydown.enter.self="openAssetProfile(item.symbol)"
                    >
                      <div class="min-w-0">
                        <div class="font-semibold">{{ item.symbol }}</div>
                        <div class="truncate text-xs text-muted-color">{{ item.name }}</div>
                      </div>

                      <svg
                        v-if="item.sparkPath"
                        class="trending-spark"
                        viewBox="0 0 72 28"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                        :class="item.regularMarketChange >= 0 ? 'text-up' : 'text-down'"
                      >
                        <path :d="`${item.sparkPath} L72,28 L0,28 Z`" fill="currentColor" fill-opacity="0.2" />
                        <path :d="item.sparkPath" fill="none" stroke="currentColor" stroke-width="1.25" vector-effect="non-scaling-stroke" />
                      </svg>
                      <span v-else></span>

                      <div class="text-right">
                        <div class="font-semibold">{{ Number(item.regularMarketPrice).toFixed(2) }}</div>
                        <div class="whitespace-nowrap text-xs font-semibold" :class="recommendationGrowthClass(item.regularMarketChange)">
                          {{ formatSignedNumber(item.regularMarketChange) }} ({{ formatSignedNumber(item.regularMarketChangePercent) }}%)
                        </div>
                      </div>

                      <button
                        type="button"
                        class="trending-watch"
                        :class="{ 'trending-watch--active': watchlistStore.symbolSet.has(item.symbol) }"
                        v-tooltip.top="{ value: t(watchlistStore.symbolSet.has(item.symbol) ? 'removeFromWatchlist' : 'addToWatchlist'), showDelay: 500 }"
                        :aria-label="`${t(watchlistStore.symbolSet.has(item.symbol) ? 'removeFromWatchlist' : 'addToWatchlist')} ${item.symbol}`"
                        :aria-pressed="watchlistStore.symbolSet.has(item.symbol)"
                        @click.stop="toggleWatch(item.symbol, item.name, item.quoteType)"
                      >
                        <i :class="watchlistStore.symbolSet.has(item.symbol) ? 'pi pi-star-fill' : 'pi pi-star'"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </template>
            </Card>

            <Card class="app-panel w-full">
              <template #content>
                <div class="flex flex-col gap-3 text-sm">
                  <p
                    v-if="companyInfoError"
                    class="text-xs text-red-600 dark:text-red-300"
                  >
                    {{ t('companyInfoLoadFailed') }}
                  </p>

                  <div>
                    <p class="text-sm font-semibold pb-3">{{ t('companyKeyStats') }}</p>

                    <div
                      v-for="(row, index) in companyKeyStatsRows"
                      :key="row.label"
                      class="flex justify-between py-3 px-0"
                      :class="index === companyKeyStatsRows.length - 1 ? '' : 'border-b border-surface'"
                    >
                      <span>{{ t(row.label) }}</span>
                      <span class="font-semibold text-right">{{ row.value }}</span>
                    </div>

                    <p
                      v-if="!companyKeyStatsRows.length"
                      class="mt-2 text-xs text-muted-color"
                    >
                      {{ t('companyKeyStatsEmpty') }}
                    </p>
                  </div>

                  <!-- 公司簡介 -->
                  <div
                    v-if="companyInfo.longBusinessSummary"
                    class="pt-3"
                  >
                    <p class="text-xs font-semibold text-muted-color">{{ t('companySummary') }}</p>
                    <p class="company-summary mt-2 text-xs">{{ companyInfo.longBusinessSummary }}</p>
                  </div>

                  <p
                    v-else-if="!companyInfoLoading && !hasCompanyInfo"
                    class="text-xs text-muted-color"
                  >
                    {{ t('companyInfoEmpty') }}
                  </p>
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
import { ref, watch, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import SelectButton from 'primevue/selectbutton'
import Skeleton from 'primevue/skeleton'
import Popover from 'primevue/popover'
import Menu from 'primevue/menu'
import Listbox from 'primevue/listbox'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import debounce from 'lodash/debounce'
import api from '@/utils/api'
import { percentChange, periodRange, filterByPeriod, toIsoDate, yAxisBounds } from '@/utils/portfolioMetrics'
import { useRoute, useRouter } from 'vue-router'
import { useCurrency } from '@/composables/useCurrency'
import { useTheme } from '@/composables/useTheme.js'
import * as toast from '@/composables/toast'
import { useWatchlistStore } from '@/stores/watchlist'

const { t, locale } = useI18n()
const { isDark, chartPalette } = useTheme()
const { formatAmount, formatPriceWithCode: formatNativePriceWithCode, splitDisplayAmount, displayCurrency } = useCurrency()
// Yahoo 回傳的是標的原幣價格（0050.TW 是 TWD），個股頁直接以原幣顯示，不換成偏好設定的顯示幣別
// 圖表座標軸只顯示數字，幣別已標在現價旁
const formatAxisPrice = value => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatPrice = (value) =>formatAmount(value, { minimumFractionDigits: 2, maximumFractionDigits: 3, currency: info.currency || 'USD' })
const formatPriceWithCode = (value) => formatNativePriceWithCode(value, info.currency || 'USD')

const route = useRoute()
const router = useRouter()
const symbol = computed(() => route.params.symbol)

// 關注清單星號；demo 帳號不能改，點了只提示登入
const watchlistStore = useWatchlistStore()
const isWatched = computed(() => watchlistStore.symbolSet.has(String(symbol.value).toUpperCase()))
const watchLabel = computed(() => watchlistStore.isReadOnly
  ? t('watchlistSignInHint')
  : t(isWatched.value ? 'removeFromWatchlist' : 'addToWatchlist'))
// 預設是本頁標的；熱門清單的星號會帶入該列的代號
const toggleWatch = async (s = String(symbol.value).toUpperCase(), name = info.fullName, quoteType = info.quoteType) => {
  if (watchlistStore.isReadOnly) return toast.info(t('watchlistSignInHint'))
  try {
    if (watchlistStore.symbolSet.has(s)) {
      await watchlistStore.removeSymbol(s)
      toast.success(t('removedFromWatchlist', { symbol: s }))
    } else {
      await watchlistStore.addSymbol(s, name || null, quoteType || null)
      toast.success(t('addedToWatchlist', { symbol: s }))
    }
  } catch (error) {
    toast.error(t('saveFailed'), error.message)
  }
}

const chartType = ref('area')
const currentRange = ref('3mo')

const MAX_COMPARE_SYMBOLS = 5
const MAX_RECOMMENDATION_CARDS = 5
const comparisonColorPalette = ['#60a5fa', '#f59e0b', '#22c55e', '#ef4444', '#a855f7', '#14b8a6']

let mainRequestId = 0
let intradayRequestId = 0
let compareRequestId = 0
let recommendRequestId = 0
let companyRequestId = 0
let fundHoldingsRequestId = 0

const comparePopover = ref(null)
const comparePopoverOpen = ref(false)
const compareSearchInput = ref(null)
const compareQuery = ref('')
const compareSearchResults = ref([])
const compareSymbols = ref([])
const compareRawSeries = ref([])
const compareNameMap = reactive({})
const comparisonNotice = ref({ key: '', params: {} })
const recommendedCards = ref([])
const recommendLoading = ref(false)
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
const rawIntradayQuotes = ref([])

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
  currency: '',
  timezone: '',
  exchangeTimezoneName: '',
  tradingStart: '',
  tradingEnd: '',
})

// 仿 Yahoo：盤中顯示「As of 時間. Market Open.」，盤後顯示收盤日期時間；一律用交易所當地時區
// ponytail: 只看當日正規盤起訖，港股午休等盤中休市不另外判斷
const marketTimeText = computed(() => {
  if (!info.regularMarketTime) return ''
  const now = Date.now()
  const isOpen = now >= new Date(info.tradingStart).getTime() && now < new Date(info.tradingEnd).getTime()
  const time = new Intl.DateTimeFormat(locale.value.startsWith('zh') ? 'zh-TW' : 'en-US', {
    timeZone: info.exchangeTimezoneName || undefined,
    ...(!isOpen && { month: 'long', day: 'numeric' }),
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(info.regularMarketTime))
  return t(isOpen ? 'marketOpenAsOf' : 'marketClosedAt', { time: `${time} ${info.timezone}`.trim() })
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

const chartTypeOptions = computed(() => [
  { label: t('areaChart'), value: 'area', icon: 'pi pi-chart-line' },
  { label: t('klineChart'), value: 'candlestick', icon: 'pi pi-chart-bar' },
])

const quoteStatsRows = computed(() => [
  { label: 'assetPreviousClose', value: formatPrice(info.chartPreviousClose) },
  { label: 'assetDayRange', value: `${formatPrice(info.regularMarketDayLow)} - ${formatPrice(info.regularMarketDayHigh)}` },
  { label: 'assetYearRange', value: `${formatPrice(info.fiftyTwoWeekLow)} - ${formatPrice(info.fiftyTwoWeekHigh)}` },
  { label: 'assetTodayVolume', value: Number.isFinite(info.regularMarketVolume) ? info.regularMarketVolume.toLocaleString() : '--' },
  { label: 'assetPrimaryExchange', value: info.fullExchangeName || '--' },
])

const chartTypeMenu = ref(null)
const chartTypeMenuOpen = ref(false)
const activeChartType = computed(() => chartTypeOptions.value.find(option => option.value === chartType.value))
const chartTypeMenuItems = computed(() => chartTypeOptions.value.map(option => ({
  label: option.label,
  icon: option.icon,
  class: option.value === chartType.value ? 'chart-type-item--active' : undefined,
  command: () => { chartType.value = option.value },
})))

// 收盤價陣列 → 72x28 viewBox 內的折線路徑
function toSparkPath(closes) {
  if (!Array.isArray(closes) || closes.length < 2) return ''
  const min = Math.min(...closes)
  const span = Math.max(...closes) - min || 1
  return closes
    .map((close, index) => `${index ? 'L' : 'M'}${(index / (closes.length - 1) * 72).toFixed(2)},${(26 - (close - min) / span * 24).toFixed(2)}`)
    .join(' ')
}


const rangeOptions = computed(() => ([
  { label: t('period1d'), value: '1d' },
  { label: t('period7d'), value: '7d' },
  { label: t('period1mo'), value: '1mo' },
  { label: t('period3mo'), value: '3mo' },
  { label: t('period6mo'), value: '6mo' },
  { label: t('periodYTD'), value: 'ytd' },
  { label: t('period1y'), value: '1y' },
  { label: t('period5y'), value: '5y' },
]))

function quotesForRange(range) {
  return range === '1d' ? rawIntradayQuotes.value : filterByPeriod(rawQuotes.value, range, item => item?.date)
}

const currentRangeQuotes = computed(() => quotesForRange(currentRange.value))

const chartSeries = computed(() => [{ name: t('closePrice'), data: toLineSeriesFromQuotes(currentRangeQuotes.value) }])
const candleSeries = computed(() => [{ name: t('klineChart'), data: toCandleSeriesFromQuotes(currentRangeQuotes.value) }])

const rangeOptionsWithGrowth = computed(() => rangeOptions.value.map(option => ({
  ...option,
  growth: percentChange(toLineSeriesFromQuotes(quotesForRange(option.value))),
})))

const growthRateNumber = computed(() => percentChange(chartSeries.value[0].data))

const change = computed(() => {
  const list = chartSeries.value[0].data
  if (!list || list.length < 2) return 0

  return list[list.length - 1].y - list[0].y
})

const comparisonNoticeText = computed(() => {
  if (!comparisonNotice.value.key) return ''
  return t(comparisonNotice.value.key, comparisonNotice.value.params)
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

// 比較選單：沒輸入時列推薦標的（帶價格），輸入後列搜尋結果
const compareOptions = computed(() => compareQuery.value.trim() ? compareSearchResults.value : recommendedCards.value)

const searchCompareSymbols = debounce(async query => {
  if (!query.trim()) {
    compareSearchResults.value = []
    return
  }
  try {
    const data = await api.get(`/api/yahoo/symbol?query=${encodeURIComponent(query)}`)
    if (query !== compareQuery.value) return
    compareSearchResults.value = data.map(item => ({ symbol: item.symbol, name: item.longname || item.shortname || item.symbol }))
  } catch {
    compareSearchResults.value = []
  }
}, 250)

watch(compareQuery, searchCompareSymbols)

function onComparePopoverShow() {
  comparePopoverOpen.value = true
  compareSearchInput.value?.$el?.focus()
}

// Listbox 多選只回傳新陣列：多出來的代號走加入流程（帶名稱、檢查上限），少掉的移除
function onCompareListChange(next) {
  const added = next.find(item => !compareSymbols.value.includes(item))
  if (added) return addComparisonBySymbol(compareOptions.value.find(option => option.symbol === added))
  compareSymbols.value.filter(item => !next.includes(item)).forEach(removeComparisonSymbol)
}

function setComparisonNotice(key = '', params = {}) {
  comparisonNotice.value = { key, params }
}

function getSeriesColor(index) {
  return comparisonColorPalette[index % comparisonColorPalette.length]
}

function recommendationGrowthClass(value) {
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) return 'recommend-growth-neutral'
  return normalized >= 0 ? 'text-up' : 'text-down'
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

// 小數位與拆解規則由 useCurrency 統一處理（各自實作會把千分位逗號誤判成小數）
// 個股頁的價格一律以該標的的原幣顯示，不換算成顯示幣別
function splitPriceForEmphasis(value) {
  const split = splitDisplayAmount(value, 'price', info.currency || 'USD')
  return split.code ? split : { ...split, code: displayCurrency.value }
}

function formatSignedNumber(value, digits = 2) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '--'
  const sign = n >= 0 ? '+' : '-'
  return `${sign}${Math.abs(n).toFixed(digits)}`
}

function getIntradayPeriodRange() {
  // 往前抓 5 天緩衝，避免今天遇到假日/週末時 Yahoo 回傳空資料；實際顯示範圍由 extractLatestSessionQuotes 收斂到最近一個交易日
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const start = new Date(today)
  start.setDate(start.getDate() - 5)

  return {
    period1: toIsoDate(start),
    period2: toIsoDate(tomorrow),
  }
}

function extractLatestSessionQuotes(quotes) {
  const SESSION_GAP_MS = 60 * 60 * 1000
  const sorted = quotes
    .filter(item => item?.date)
    .map(item => ({ ...item, date: new Date(item.date) }))
    .filter(item => !Number.isNaN(item.date.getTime()))
    .sort((a, b) => a.date - b.date)

  let sessionStartIndex = 0
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].date - sorted[i - 1].date > SESSION_GAP_MS) sessionStartIndex = i
  }

  return sorted.slice(sessionStartIndex)
}

// call 推薦股票 api
async function fetchRecommendedSymbols(targetSymbol = symbol.value) {
  const requestId = ++recommendRequestId
  const activeSymbol = String(targetSymbol || '').trim().toUpperCase()

  if (!activeSymbol) {
    recommendedCards.value = []
    recommendationErrorKey.value = ''
    return
  }

  recommendationErrorKey.value = ''
  recommendLoading.value = true

  try {
    const data = await api.get(`/api/yahoo/recommend/cards?symbol=${encodeURIComponent(activeSymbol)}&limit=${MAX_RECOMMENDATION_CARDS}&spark=1`)
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
        quoteType: item.quoteType || null,
        sparkPath: toSparkPath(item.spark),
      }))

    recommendationErrorKey.value = ''
  } catch (error) {
    if (requestId !== recommendRequestId) return
    recommendedCards.value = []
    recommendationErrorKey.value = 'recommendationLoadFailed'
    console.error('推薦股票載入失敗:', error)
  } finally {
    if (requestId === recommendRequestId) recommendLoading.value = false
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
  compareNameMap[nextSymbol] = payload.name || nextSymbol
  compareQuery.value = ''
}

function isCardCompared(targetSymbol) {
  return compareSymbols.value.includes(String(targetSymbol || '').trim().toUpperCase())
}

function toggleRecommendationCompare(card) {
  const nextSymbol = String(card?.symbol || '').trim().toUpperCase()
  if (!nextSymbol) return

  if (compareSymbols.value.includes(nextSymbol)) {
    removeComparisonSymbol(nextSymbol)
    return
  }

  addComparisonBySymbol(card)
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

const isComparing = computed(() => compareRawSeries.value.some(item => item.data.length))

const areaSeries = computed(() => {
  const merged = []
  const primarySymbol = String(symbol.value || '').toUpperCase() || t('closePrice')
  const primarySeries = toPriceSeries(chartSeries.value[0].data)
  const primaryColor = getSeriesColor(0)
  // 日線各市場的時間戳不同（台股 01:00Z、美股 13:30Z），shared tooltip 只合併 x 完全相同的點，故對齊到 UTC 日界
  const DAY_MS = 86400000
  const toX = currentRange.value === '1d' ? date => date.getTime() : date => Math.floor(date.getTime() / DAY_MS) * DAY_MS
  // 有對比時各線改畫相對區間首日的漲跌 %，價差大的標的才能比較走勢；原價留在 point.price 給 tooltip
  const toPoints = series => isComparing.value
    ? series.map(point => ({ x: toX(point.x), y: (point.y / series[0].y - 1) * 100, price: point.y }))
    : series.map(point => [toX(point.x), point.y])

  if (primarySeries.length) {
    merged.push({
      type: 'area',
      name: primarySymbol,
      data: toPoints(primarySeries),
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
      data: toPoints(priceSeries),
      // 依 compareSymbols 的位置配色，與 chip 色點一致（某檔載入失敗時 compareRawSeries 會少一筆）
      color: getSeriesColor(compareSymbols.value.indexOf(item.symbol) + 1),
      lineWidth: 2,
    })
  })

  return merged
})

const highAreaOptions = computed(() => {
  const { axis: axisColor, grid: gridColor, tooltipBg, tooltipFg } = chartPalette.value

  const isIntradayView = currentRange.value === '1d'
  const chartLocale = locale.value.startsWith('zh') ? 'zh-TW' : 'en-US'
  const chartDateFormatter = new Intl.DateTimeFormat(
    chartLocale,
    isIntradayView
      ? { hour: '2-digit', minute: '2-digit', hour12: false }
      : locale.value.startsWith('zh')
        ? { month: 'numeric', day: 'numeric' }
        : { month: 'short', day: 'numeric' }
  )

  return {
    chart: { type: 'area', backgroundColor: 'transparent', animation: { duration: 400 } },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false }, // 對比 chip 已帶系列色點，等同圖例
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
      title: { text: null },
      ...yAxisBounds(areaSeries.value.flatMap(series => series.data.map(point => Number(point.y ?? point[1])))),
      startOnTick: false,
      endOnTick: false,
      plotLines: isComparing.value ? [{ value: 0, color: axisColor, dashStyle: 'Dot', width: 1 }] : [],
      labels: {
        formatter: function () {
          return isComparing.value ? `${Number(this.value.toFixed(2))}%` : formatAxisPrice(this.value)
        },
        style: { fontSize: '12px', color: axisColor },
      },
      gridLineDashStyle: 'Dash',
      gridLineColor: gridColor,
    },
    tooltip: {
      xDateFormat: isIntradayView ? '%Y/%m/%d %H:%M' : '%Y/%m/%d',
      valueDecimals: 2,
      shared: true,
      ...(isComparing.value && {
        pointFormatter: function () {
          const pct = `${this.y >= 0 ? '+' : ''}${this.y.toFixed(2)}%`
          return `<span style="color:${this.color}">●</span> ${this.series.name}: <b>${pct}</b> (${this.price.toFixed(2)})<br/>`
        },
      }),
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
  const { axis: axisColor, grid: gridColor, tooltipBg, tooltipFg } = chartPalette.value
  const isIntradayView = currentRange.value === '1d'
  const chartLocale = locale.value.startsWith('zh') ? 'zh-TW' : 'en-US'
  const chartDateFormatter = new Intl.DateTimeFormat(
    chartLocale,
    isIntradayView
      ? { hour: '2-digit', minute: '2-digit', hour12: false }
      : locale.value.startsWith('zh')
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
      title: { text: null },
      labels: {
        formatter: function () {
          return formatAxisPrice(this.value)
        },
        style: { color: axisColor },
      },
      gridLineColor: gridColor,
    },
    tooltip: {
      xDateFormat: isIntradayView ? '%Y/%m/%d %H:%M' : '%Y/%m/%d',
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
  const { tooltipBg, tooltipFg, border: borderColor } = chartPalette.value

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
  const { tooltipBg, tooltipFg, border: borderColor } = chartPalette.value

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

  if (currentRange.value === '1d') {
    if (compareSymbols.value.length) {
      setComparisonNotice('comparisonDisabledFor1d')
    }
    return
  }

  const { period1, period2 } = periodRange(currentRange.value)
  fetchComparisonData(period1, period2)
}

async function fetchChartData(targetSymbol) {
  const requestId = ++mainRequestId
  // 一次抓取最大區間（5年）的原始資料，各時間範圍按鈕改為在前端切片計算，避免每次切換都重打 API
  const { period1, period2 } = periodRange('5y')
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
      // meta.chartPreviousClose 是整段 5 年區間起點前的收盤價，不是昨收；改取倒數第二根日 K 的收盤
      chartPreviousClose: quotes.map(q => q?.close).filter(Number.isFinite).at(-2) || 0,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
      fullExchangeName: meta.fullExchangeName || '',
      regularMarketVolume: meta.regularMarketVolume || 0,
      currency: meta.currency || '',
      timezone: meta.timezone || '',
      exchangeTimezoneName: meta.exchangeTimezoneName || '',
      tradingStart: meta.currentTradingPeriod?.regular?.start || '',
      tradingEnd: meta.currentTradingPeriod?.regular?.end || '',
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

// 1D 區間走勢圖使用當日 5 分鐘線圖，與其餘區間共用的 5 年日線資料分開抓取
async function fetchIntradayChartData(targetSymbol) {
  const requestId = ++intradayRequestId
  const { period1, period2 } = getIntradayPeriodRange()
  const activeSymbol = String(targetSymbol || symbol.value || '').toUpperCase()

  try {
    const data = await api.get(`/api/yahoo/chart?symbol=${encodeURIComponent(activeSymbol)}&period1=${period1}&period2=${period2}&interval=5m`)
    if (requestId !== intradayRequestId) return

    rawIntradayQuotes.value = extractLatestSessionQuotes(data?.quotes || [])
  } catch (error) {
    if (requestId !== intradayRequestId) return
    rawIntradayQuotes.value = []
    console.error('取得當日走勢資料失敗:', error)
  }
}

function removeComparisonSymbol(targetSymbol) {
  compareSymbols.value = compareSymbols.value.filter(item => item !== targetSymbol)
  delete compareNameMap[targetSymbol]
}

function clearComparisonSymbols() {
  compareSymbols.value = []
  compareRawSeries.value = []
  setComparisonNotice()
}

// ponytail: 與 DashboardView 同一行格式化，未抽共用 util
const formatUpdatedAt = iso => new Date(iso).toLocaleString(locale.value.startsWith('zh') ? 'zh-TW' : 'en-US', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

watch(symbol, nextSymbol => {
  const normalized = String(nextSymbol || '').toUpperCase()
  compareSymbols.value = compareSymbols.value.filter(item => item !== normalized)
  fetchRecommendedSymbols(normalized)
  fetchCompanyBasicInfo(normalized)
  fetchFundHoldings(normalized)
}, { immediate: true })

watch(symbol, nextSymbol => {
  fetchChartData(nextSymbol)
  if (currentRange.value === '1d') fetchIntradayChartData(nextSymbol)
}, { immediate: true })

watch(currentRange, nextRange => {
  if (nextRange === '1d') fetchIntradayChartData()
})

watch([currentRange, chartType], () => {
  syncComparisonData()
}, { immediate: true })

watch(compareSymbols, () => {
  syncComparisonData()
}, { deep: true })
</script>

<style scoped>
.chart-container {
  max-width: 100%;
  margin: 1rem auto;
}

.controls {
  margin-bottom: 1rem;
}

/* 8 個區間在窄螢幕擠不下，給最小寬度並改成橫向捲動 */
.range-select {
  overflow-x: auto;
}

.range-select :deep(.p-togglebutton) {
  flex: 1 0 auto;
  min-width: 3.5rem;
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
  cursor: pointer;
  transition: all 0.2s ease;
}

.compare-chip:hover {
  background: var(--p-content-hover-background);
}

.compare-chip--static,
.compare-chip--static:hover {
  cursor: default;
  border-color: var(--p-surface-300, #d1d5db);
  color: inherit;
  background: transparent;
}

.compare-popover {
  width: min(22rem, calc(100vw - 2rem));
  margin: -0.5rem;
}

.compare-popover-heading {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--p-text-muted-color);
}

.compare-popover-footer {
  display: flex;
  justify-content: flex-end;
  padding: 0.25rem 0.5rem 0;
  border-top: 1px solid var(--p-content-border-color);
}

.compare-chip-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 2px;
  margin-right: 0.4rem;
  flex-shrink: 0;
}

.chart-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  margin-right: -0.75rem;
}

.chart-toolbar .pi {
  font-size: 0.8rem;
}

.chart-toolbar .pi-chevron-down,
.chart-toolbar .pi-chevron-up {
  font-size: 0.625rem;
}

:global(.chart-type-item--active .p-menu-item-content) {
  color: var(--p-primary-color);
  font-weight: 600;
}

.trending-list {
  display: flex;
  flex-direction: column;
}

.trending-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 4.5rem auto 1.75rem;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.25rem;
  border-bottom: 1px dashed var(--p-content-border-color);
  cursor: pointer;
}

.trending-row:last-child {
  border-bottom: 0;
}

.trending-row:hover {
  background: color-mix(in srgb, var(--p-primary-color) 6%, transparent);
}

.trending-spark {
  width: 4.5rem;
  height: 1.75rem;
}

.trending-watch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  color: var(--p-text-muted-color);
  cursor: pointer;
}

.trending-watch:hover {
  background: var(--p-content-hover-background);
}

.trending-watch--active {
  color: #f59e0b;
}

/* 有滑鼠的裝置 hover 該列才顯示星號；觸控裝置沒有 hover，維持常駐 */
@media (hover: hover) {
  .trending-watch {
    opacity: 0;
  }

  .trending-row:hover .trending-watch,
  .trending-row:focus-within .trending-watch {
    opacity: 1;
  }
}

.recommend-growth-neutral {
  color: var(--p-text-muted-color, #64748b);
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