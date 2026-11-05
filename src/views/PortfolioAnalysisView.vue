<template>
  <div class="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
    <section :aria-label="t('portfolioSectorTitle')">
      <h3 class="flex min-h-10 items-center text-sm font-semibold">{{ t('portfolioSectorTitle') }}</h3>
      <Skeleton v-if="sectorsLoading" height="300px" class="mt-3" />
      <p v-else-if="sectorsError" class="mt-3 text-xs text-red-600 dark:text-red-300">{{ t('sectorWeightingsLoadFailed') }}</p>
      <template v-else-if="sectorRows.length">
        <highcharts :options="sectorChartOptions" style="width: 100%; height: 300px;" />
        <ul class="mt-2 text-sm">
          <li v-for="row in sectorRows" :key="row.sector" class="flex items-center gap-2 border-b border-surface py-1.5">
            <span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: row.color }" aria-hidden="true"></span>
            <span>{{ row.name }}</span>
            <span class="ml-auto font-semibold tabular-nums">{{ row.percent.toFixed(1) }}%</span>
          </li>
        </ul>
      </template>
      <NoData v-else />
    </section>

    <section :aria-label="t('holdingsGrowthTitle')">
      <div class="flex min-h-10 flex-wrap items-center justify-between gap-2">
        <h3 class="text-sm font-semibold">{{ t('holdingsGrowthTitle') }}</h3>
        <SelectButton
          v-model="period"
          :options="periodOptions"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
          size="small"
        />
      </div>
      <Skeleton v-if="growthLoading" height="360px" class="mt-3" />
      <p v-else-if="growthError" class="mt-3 text-xs text-red-600 dark:text-red-300">{{ t('holdingsGrowthLoadFailed') }}</p>
      <template v-else-if="growthSeries.length">
        <highcharts :options="growthChartOptions" style="width: 100%; height: 360px;" class="mt-2" />
        <p class="mt-1 text-xs text-muted-color">{{ t('holdingsGrowthHint', { n: VISIBLE_SERIES }) }}</p>
      </template>
      <NoData v-else />
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Skeleton from 'primevue/skeleton'
import NoData from '@/components/NoData.vue'
import api from '@/utils/api'
import { SECTOR_META, sectorBreakdown } from '@/utils/sectors'
import { periodRange } from '@/utils/portfolioMetrics'
import { useTheme } from '@/composables/useTheme.js'
import { useHoldingsStore } from '@/stores/holdings'
import { usePortfolioStore } from '@/stores/portfolio'

const { t } = useI18n()
const { isDark, chartPalette } = useTheme()
const store = useHoldingsStore()
const portfolioStore = usePortfolioStore()

// 直接開這個分頁時持股分頁沒掛載過，這裡自己載；切換投組也要重載
watch(() => portfolioStore.currentPortfolio?.id, () => store.fetchHoldings(), { immediate: !store.list.length })

// 依市值大到小；symbol 清單變了才重抓。key 用字母排序：匯率載入後市值排名會變，不該因此重打 API
const holdingsByValue = computed(() => [...store.list].sort((a, b) => b.currentValue - a.currentValue))
const symbolsKey = computed(() => store.list.map(h => h.symbol).sort().join(','))

/* ── 產業分布 ── */
const sectorWeights = ref({})
const sectorsLoading = ref(false)
const sectorsError = ref(false)
let sectorRequestId = 0

watch(symbolsKey, async (symbols) => {
  const id = ++sectorRequestId
  sectorsError.value = false
  if (!symbols) return (sectorWeights.value = {})
  sectorsLoading.value = true
  try {
    const data = await api.get(`/api/yahoo/sectors?symbols=${encodeURIComponent(symbols)}`)
    if (id === sectorRequestId) sectorWeights.value = data
  } catch {
    if (id === sectorRequestId) sectorsError.value = true
  } finally {
    if (id === sectorRequestId) sectorsLoading.value = false
  }
}, { immediate: true })

const sectorRows = computed(() => {
  const rows = sectorBreakdown(store.list, sectorWeights.value)
  const total = rows.reduce((sum, r) => sum + r.value, 0)
  return rows.map(({ sector, value }) => {
    const meta = SECTOR_META[sector]
    return { sector, name: t(meta.labelKey), percent: total ? (value / total) * 100 : 0, color: isDark.value ? meta.dark : meta.light }
  })
})

const sectorChartOptions = computed(() => ({
  chart: { type: 'pie', backgroundColor: 'transparent', animation: { duration: 350 } },
  title: { text: null },
  credits: { enabled: false },
  legend: { enabled: false },
  tooltip: {
    backgroundColor: chartPalette.value.tooltipBg,
    style: { color: chartPalette.value.tooltipFg },
    pointFormat: '<b>{point.y:.1f}%</b>',
  },
  plotOptions: {
    pie: {
      innerSize: '70%',
      borderWidth: 3,
      borderColor: chartPalette.value.border,
      dataLabels: { enabled: false }, // 下方清單即圖例
      states: { hover: { halo: { size: 0 } } },
    },
  },
  series: [{
    type: 'pie',
    name: t('portfolioSectorTitle'),
    data: sectorRows.value.map(r => ({ name: r.name, y: r.percent, color: r.color })),
  }],
}))

/* ── 持股走勢比較 ── */
// 線太多就看不出關係：預設只顯示市值前幾名，其餘點圖例開啟
const VISIBLE_SERIES = 8
const DAY_MS = 86400000

const period = ref('1y')
const periodOptions = computed(() => [
  { label: t('period1mo'), value: '1mo' },
  { label: t('period3mo'), value: '3mo' },
  { label: t('period6mo'), value: '6mo' },
  { label: t('periodYTD'), value: 'ytd' },
  { label: t('period1y'), value: '1y' },
  { label: t('period5y'), value: '5y' },
])

const growthSeries = ref([])
const growthLoading = ref(false)
const growthError = ref(false)
let growthRequestId = 0

// 各檔換成相對區間首日的漲跌 %；用還原股價（含配息）。x 對齊到 UTC 日界，台股（01:00Z）和美股（13:30Z）同一天才會在 shared tooltip 合併
function toGrowthPoints(quotes) {
  const valid = quotes
    .map(q => ({ t: new Date(q.date).getTime(), close: q.adjclose ?? q.close }))
    .filter(q => Number.isFinite(q.t) && Number.isFinite(q.close) && q.close > 0)
  if (valid.length < 2) return []
  const base = valid[0].close
  return valid.map(q => [Math.floor(q.t / DAY_MS) * DAY_MS, (q.close / base - 1) * 100])
}

watch([symbolsKey, period], async () => {
  const id = ++growthRequestId
  const holdings = holdingsByValue.value
  growthError.value = false
  if (!holdings.length) return (growthSeries.value = [])
  growthLoading.value = true
  const { period1, period2 } = periodRange(period.value)
  // 5 年日線每檔上千點，改抓週線
  const interval = period.value === '5y' ? '1wk' : '1d'
  // ponytail: 每檔一個 request（同資產頁對比）；持股上百檔時要改成後端一次批次抓
  const results = await Promise.allSettled(holdings.map(h =>
    api.get(`/api/yahoo/chart?symbol=${encodeURIComponent(h.symbol)}&period1=${period1}&period2=${period2}&interval=${interval}`)))
  if (id !== growthRequestId) return
  growthSeries.value = holdings
    .map((h, i) => ({ symbol: h.symbol, data: toGrowthPoints(results[i].value?.quotes || []) }))
    .filter(s => s.data.length)
  growthError.value = !growthSeries.value.length
  growthLoading.value = false
}, { immediate: true })

const growthChartOptions = computed(() => {
  const { axis, grid, tooltipBg, tooltipFg, legend } = chartPalette.value
  return {
    chart: { type: 'line', backgroundColor: 'transparent', animation: { duration: 400 }, zooming: { type: 'x' } },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: true, itemStyle: { color: legend, fontWeight: '600' } },
    xAxis: {
      type: 'datetime',
      labels: { style: { fontSize: '12px', color: axis } },
      lineColor: grid,
      tickColor: grid,
    },
    yAxis: {
      title: { text: null },
      plotLines: [{ value: 0, color: axis, dashStyle: 'Dot', width: 1 }],
      labels: { format: '{value}%', style: { fontSize: '12px', color: axis } },
      gridLineDashStyle: 'Dash',
      gridLineColor: grid,
    },
    tooltip: {
      shared: true,
      xDateFormat: '%Y/%m/%d',
      valueDecimals: 2,
      valueSuffix: '%',
      backgroundColor: tooltipBg,
      style: { color: tooltipFg },
    },
    plotOptions: { series: { marker: { enabled: false }, lineWidth: 1.5 } },
    series: growthSeries.value.map((s, i) => ({ name: s.symbol, data: s.data, visible: i < VISIBLE_SERIES })),
  }
})
</script>
