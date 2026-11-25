<!-- 儀表板上方的大盤指數行情：一次批次報價＋當日迷你走勢；依寬度決定一頁幾格、格子平分不被切，左右箭頭一次換一頁（觸控可直接滑）；點了進個股頁；抓不到就整條不顯示 -->
<template>
  <div v-if="state !== 'error'" class="market-strip app-panel">
    <button
      type="button"
      class="market-strip__nav"
      :disabled="!canPrev"
      :aria-label="t('previousPage')"
      v-tooltip.bottom="{ value: t('previousPage'), showDelay: 500 }"
      @click="page(-1)"
    ><i class="pi pi-chevron-left"></i></button>

    <div ref="scroller" class="market-strip__track" :style="{ '--per': perPage }" role="list" :aria-label="t('marketIndices')" @scroll="updateEdges">
      <RouterLink
        v-for="item in rows"
        :key="item.symbol"
        :to="{ name: 'asset', params: { symbol: item.symbol } }"
        class="market-strip__item"
        role="listitem"
      >
        <div class="min-w-0">
          <div class="market-strip__name">{{ item.name }}</div>
          <template v-if="item.price != null">
            <div class="market-strip__price">{{ formatPrice(item.price) }}</div>
            <div class="market-strip__change" :class="item.change >= 0 ? 'text-up' : 'text-down'">
              {{ item.change >= 0 ? '+' : '' }}{{ item.change.toFixed(2) }}%
            </div>
          </template>
          <template v-else-if="state === 'loading'">
            <Skeleton width="4.5rem" height="1rem" class="mt-1" />
            <Skeleton width="3rem" height="0.75rem" class="mt-1" />
          </template>
          <div v-else class="market-strip__price text-muted-color">--</div>
        </div>
        <!-- 畫法同個股頁「相關股票」的迷你圖 -->
        <svg
          v-if="item.sparkPath"
          class="market-strip__spark"
          viewBox="0 0 72 28"
          preserveAspectRatio="none"
          aria-hidden="true"
          :class="item.change >= 0 ? 'text-up' : 'text-down'"
        >
          <path :d="`${item.sparkPath} L72,28 L0,28 Z`" fill="currentColor" fill-opacity="0.2" />
          <path :d="item.sparkPath" fill="none" stroke="currentColor" stroke-width="1.25" vector-effect="non-scaling-stroke" />
        </svg>
      </RouterLink>
    </div>


    <button
      type="button"
      class="market-strip__nav"
      :disabled="!canNext"
      :aria-label="t('nextPage')"
      v-tooltip.bottom="{ value: t('nextPage'), showDelay: 500 }"
      @click="page(1)"
    ><i class="pi pi-chevron-right"></i></button>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Skeleton from 'primevue/skeleton'
import api from '@/utils/api'
import { toSparkPath } from '@/utils/sparkline'

const { t, locale } = useI18n()

// Yahoo 回的名稱很亂（例如「TSEC CAPITALIZATION WEIGHTED ST」），顯示名自己定
const INDICES = [
  { symbol: '^GSPC', zh: 'S&P 500', en: 'S&P 500' },
  { symbol: '^IXIC', zh: '那斯達克', en: 'Nasdaq' },
  { symbol: '^DJI', zh: '道瓊', en: 'Dow Jones' },
  { symbol: '^SOX', zh: '費城半導體', en: 'PHLX Semi' },
  { symbol: '^TWII', zh: '台股加權', en: 'TAIEX' },
  { symbol: '^N225', zh: '日經 225', en: 'Nikkei 225' },
  { symbol: '^HSI', zh: '恆生', en: 'Hang Seng' },
  { symbol: '^VIX', zh: 'VIX 恐慌指數', en: 'VIX' },
]

const quotes = ref([])
const state = ref('loading')

// ponytail: 只在進入儀表板時抓一次、不自動輪詢；要盤中即時更新再加 setInterval（注意 Yahoo 頻率限制）
onMounted(async () => {
  try {
    const data = await api.get('/api/yahoo/quote?' + INDICES.map((i) => 'symbol=' + encodeURIComponent(i.symbol)).join('&') + '&spark=1')
    quotes.value = [].concat(data ?? [])
    state.value = quotes.value.length ? 'ok' : 'error'
    nextTick(updateEdges)
  } catch {
    state.value = 'error'
  }
})

const rows = computed(() => INDICES.map((i) => {
  const q = quotes.value.find((x) => x?.symbol === i.symbol)
  return {
    symbol: i.symbol,
    name: locale.value === 'zh' ? i.zh : i.en,
    price: q?.regularMarketPrice ?? null,
    change: q?.regularMarketChangePercent ?? 0,
    sparkPath: toSparkPath(q?.spark),
  }
}))

// 一頁幾格：可用寬度 ÷ 每格最小寬，格子再平分寬度，任何寬度都不會切到半格；
// 翻頁一次捲一個可視寬度＝整數格，最後一頁捲到底也剛好對齊格子
const ITEM_MIN_PX = 180
const scroller = ref(null)
const perPage = ref(1)
const canPrev = ref(false)
const canNext = ref(false)
function updateEdges() {
  const el = scroller.value
  if (!el) return
  perPage.value = Math.max(1, Math.floor(el.clientWidth / ITEM_MIN_PX))
  canPrev.value = el.scrollLeft > 4
  canNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}
const page = (dir) => scroller.value?.scrollBy({ left: dir * scroller.value.clientWidth, behavior: 'smooth' })
// 側欄收合等也會改變寬度，不只視窗 resize，所以用 ResizeObserver
let resizeObserver
onMounted(() => {
  resizeObserver = new ResizeObserver(updateEdges)
  if (scroller.value) resizeObserver.observe(scroller.value)
})
onBeforeUnmount(() => resizeObserver?.disconnect())

const formatPrice = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
</script>

<style scoped>
.market-strip {
  display: flex;
  border-radius: 0.75rem;
  overflow: hidden;
}

.market-strip__track {
  display: flex;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.market-strip__item {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
  flex: 0 0 calc(100% / var(--per));
  min-width: 0;
  padding: 0.75rem 1rem;
  white-space: nowrap;
  color: inherit;
  text-decoration: none;
  scroll-snap-align: start;
  transition: background-color 0.15s ease;
}

.market-strip__item:hover {
  background: var(--p-content-hover-background);
}

/* 每格都畫左框線，track 左緣那條剛好當成與左箭頭欄的分隔 */
.market-strip__item {
  border-left: 1px solid color-mix(in srgb, var(--p-text-color) 8%, transparent);
}

.market-strip__name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
}

.market-strip__price {
  margin-top: 0.125rem;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
}

.market-strip__change {
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.market-strip__spark {
  width: 4.5rem;
  height: 2rem;
  flex-shrink: 1;
  min-width: 2.5rem;
}

/* 左右翻頁鈕：獨立窄欄，不蓋住格子；到頭／到尾變淡停用 */
.market-strip__nav {
  display: grid;
  place-items: center;
  flex: 0 0 2.25rem;
  border: none;
  background: none;
  color: var(--p-text-muted-color);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.market-strip__nav:hover:not(:disabled) {
  background: var(--p-content-hover-background);
  color: var(--p-text-color);
}

.market-strip__nav:disabled {
  opacity: 0.3;
  cursor: default;
}

.market-strip__nav + .market-strip__track + .market-strip__nav {
  border-left: 1px solid color-mix(in srgb, var(--p-text-color) 8%, transparent);
}

.market-strip__nav i {
  font-size: 0.75rem;
}
</style>
