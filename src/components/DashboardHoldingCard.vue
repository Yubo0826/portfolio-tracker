<template>
  <button
    type="button"
    class="holding-card hover:bg-[var(--p-surface-content)] dark:hover:bg-[#4d9a84]"
    @click="handleClick"
  >
    <div class="holding-card__header">
      <div class="holding-card__identity">
        <StockIcon :symbol="holding.symbol" class="holding-card__icon" />
        <div class="min-w-0">
          <p class="holding-card__symbol">{{ holding.symbol }}</p>
          <p class="holding-card__name">{{ holding.name }}</p>
        </div>
      </div>

    </div>
    
    <div class="holding-card__body">
        <div class="flex items-center gap-4">
            <p class="holding-card__price">
              {{ nativePriceAmountLabel }}
              <span class="text-xs font-semibold text-slate-400 dark:text-slate-500">{{ nativePriceCurrencyLabel }}</span>
            </p>
            <span class="holding-card__change" :class="trendClass">{{ trendLabel }}</span>
        <!-- <p class="holding-card__meta">{{ totalValueLabel }}</p> -->
      </div>

      <div class="holding-card__chart-shell">
        <div v-if="isChartLoading" class="holding-card__chart-placeholder holding-card__chart-placeholder--loading"></div>
        <div v-else-if="hasChartError || !sparklinePoints.length" class="holding-card__chart-placeholder"></div>
        <StockChart
          v-else
          :options="sparklineOptions"
          :height="72"
        />
      </div>
    </div>
  </button>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import StockChart from '@/components/StockChart.vue'
import StockIcon from '@/components/StockIcon.vue'
import api from '@/utils/api.js'
import { useCurrency } from '@/composables/useCurrency'

const props = defineProps({
  holding: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const { t } = useI18n()
const { formatAmount } = useCurrency()

const isChartLoading = ref(false)
const hasChartError = ref(false)
const sparklinePoints = ref([])

const trendPercent = computed(() => {
  if (sparklinePoints.value.length < 2) return null

  const firstPrice = Number(sparklinePoints.value[0]?.y)
  const lastPrice = Number(sparklinePoints.value[sparklinePoints.value.length - 1]?.y)

  if (!Number.isFinite(firstPrice) || !Number.isFinite(lastPrice) || firstPrice === 0) {
    return null
  }

  return ((lastPrice - firstPrice) / firstPrice) * 100
})

const trendDirection = computed(() => {
  if (trendPercent.value == null) return 'neutral'
  if (trendPercent.value > 0) return 'up'
  if (trendPercent.value < 0) return 'down'
  return 'neutral'
})

const trendClass = computed(() => {
  if (trendDirection.value === 'up') return 'holding-card__change--up'
  if (trendDirection.value === 'down') return 'holding-card__change--down'
  return 'holding-card__change--neutral'
})

const trendLabel = computed(() => {
  if (trendPercent.value == null) return '--'

  const sign = trendPercent.value >= 0 ? '+' : '-'
  return `${sign}${Math.abs(trendPercent.value).toFixed(2)}%`
})

const nativePriceAmountLabel = computed(() => {
  const amount = Number(props.holding?.nativeCurrentPrice)
  const code = String(props.holding?.currency || 'USD').toUpperCase()

  if (!Number.isFinite(amount)) return '--'

  const locale = code === 'TWD' ? 'zh-TW' : 'en-US'
  const formatted = amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return formatted
})

const nativePriceCurrencyLabel = computed(() => {
  const amount = Number(props.holding?.nativeCurrentPrice)
  const code = String(props.holding?.currency || 'USD').toUpperCase()

  if (!Number.isFinite(amount)) return ''

  return code
})

const totalValueLabel = computed(() => {
  return `${t('totalValue')} ${formatAmount(props.holding?.currentValue, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    compact: true,
  })}`
})

const sparklineColor = computed(() => {
  if (trendDirection.value === 'up') return '#22c55e'
  if (trendDirection.value === 'down') return '#fb7185'
  return '#94a3b8'
})

const sparklineOptions = computed(() => {
  const values = sparklinePoints.value
    .map(point => Number(point.y))
    .filter(value => Number.isFinite(value))

  const minValue = values.length ? Math.min(...values) : null
  const maxValue = values.length ? Math.max(...values) : null
  const range = minValue !== null && maxValue !== null ? maxValue - minValue : 0
  const padding = minValue !== null && maxValue !== null
    ? (range > 0 ? range * 0.18 : Math.max(Math.abs(maxValue), 1) * 0.04)
    : 0

  return {
    chart: {
      type: 'areaspline',
      backgroundColor: 'transparent',
      spacing: [0, 0, 0, 0],
      margin: [2, 0, 2, 0],
      animation: { duration: 240 },
    },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false },
    accessibility: { enabled: false },
    tooltip: { enabled: false },
    xAxis: {
      visible: false,
      lineWidth: 0,
      tickLength: 0,
    },
    yAxis: {
      visible: false,
      title: { text: null },
      min: minValue !== null ? minValue - padding : undefined,
      max: maxValue !== null ? maxValue + padding : undefined,
      startOnTick: false,
      endOnTick: false,
      gridLineWidth: 0,
    },
    plotOptions: {
      series: {
        animation: false,
        enableMouseTracking: false,
        marker: { enabled: false },
        states: {
          hover: {
            enabled: false,
          },
          inactive: {
            opacity: 1,
          },
        },
      },
      areaspline: {
        lineWidth: 2.5,
        threshold: null,
        softThreshold: false,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, sparklineColor.value],
            [1, 'rgba(255,255,255,0)'],
          ],
        },
      },
    },
    series: [{
      type: 'areaspline',
      data: sparklinePoints.value.map(point => [point.x, point.y]),
      color: sparklineColor.value,
    }],
  }
})

function formatDate(date) {
  return date.toISOString().split('T')[0]
}

function createSparklineRange() {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 14)

  return {
    period1: formatDate(start),
    period2: formatDate(end),
  }
}

function normalizeSparklineData(quotes) {
  return quotes
    .map(point => {
      const timestamp = new Date(point.date).getTime()
      const close = Number(point.close)

      if (!Number.isFinite(timestamp) || !Number.isFinite(close)) return null

      return {
        x: timestamp,
        y: close,
      }
    })
    .filter(Boolean)
    .slice(-7)
}

async function fetchSparkline() {
  const symbol = props.holding?.symbol
  if (!symbol) {
    sparklinePoints.value = []
    hasChartError.value = false
    return
  }

  isChartLoading.value = true
  hasChartError.value = false

  try {
    const { period1, period2 } = createSparklineRange()
    const result = await api.get(`/api/yahoo/chart?symbol=${encodeURIComponent(symbol)}&period1=${period1}&period2=${period2}&interval=1d`)
    const quotes = Array.isArray(result?.quotes) ? result.quotes : []
    sparklinePoints.value = normalizeSparklineData(quotes)
  } catch (error) {
    console.error(`Error fetching sparkline for ${symbol}:`, error)
    sparklinePoints.value = []
    hasChartError.value = true
  } finally {
    isChartLoading.value = false
  }
}

function handleClick() {
  if (!props.holding?.symbol) return

  router.push({
    name: 'asset',
    params: { symbol: props.holding.symbol },
  })
}

watch(
  () => props.holding?.symbol,
  () => {
    fetchSparkline()
  },
  { immediate: true }
)
</script>

<style scoped>
.holding-card {
  display: flex;
  width: 100%;
  min-height: 184px;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  border-radius: 1.25rem;
  padding: 1rem;
  text-align: left;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--p-primary-color) 10%, transparent), transparent 44%),
    linear-gradient(180deg, color-mix(in srgb, var(--p-content-background) 97%, transparent), color-mix(in srgb, var(--p-content-background) 90%, transparent));
  box-shadow: 0 14px 28px rgba(10, 14, 24, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
}

.holding-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.holding-card__identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
}

.holding-card__icon {
  flex-shrink: 0;
}

.holding-card__symbol {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--p-text-color);
}

.holding-card__name {
  margin-top: 0.18rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.78rem;
  color: var(--p-text-muted-color);
}

.holding-card__change {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 0.32rem 0.65rem;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.holding-card__change--up {
  color: #047857;
  background: rgba(16, 185, 129, 0.12);
}

.holding-card__change--down {
  color: #be123c;
  background: rgba(244, 63, 94, 0.12);
}

.holding-card__change--neutral {
  color: #475569;
  background: rgba(148, 163, 184, 0.14);
}

.holding-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.85rem;
}

.holding-card__price {
  font-size: clamp(1.45rem, 2.4vw, 2rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--p-text-color);
}

.holding-card__meta {
  margin-top: 0.4rem;
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
}

.holding-card__chart-shell {
  min-height: 72px;
}

.holding-card__chart-placeholder {
  height: 72px;
  border-radius: 0.95rem;
  background:
    linear-gradient(135deg, rgba(148, 163, 184, 0.12), rgba(148, 163, 184, 0.04));
}

.holding-card__chart-placeholder--loading {
  position: relative;
  overflow: hidden;
}

.holding-card__chart-placeholder--loading::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.42), transparent);
  animation: holding-card-shimmer 1.15s ease-in-out infinite;
}

@keyframes holding-card-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>