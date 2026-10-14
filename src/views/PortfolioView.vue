<template>
  <div>
      <nav ref="navEl" class="subnav">
        <RouterLink
          v-for="o in options"
          :key="o.value"
          :to="{ name: 'portfolio', params: { tab: o.value } }"
          replace
          :class="{ active: tab === o.value }"
          :aria-current="tab === o.value ? 'page' : undefined"
        >{{ o.label }}</RouterLink>
        <span class="subnav-ink" :style="inkStyle" aria-hidden="true" />
      </nav>
  
      <div class="mt-4 card-table">
        <!-- KeepAlive：切分頁不重掛元件，避免每次重打 API、重建 DataTable 造成底線動畫卡頓。
             資料新鮮度靠 store：交易增刪會連帶 fetchHoldings/fetchDividends，切換投組由各分頁的 watch 處理 -->
        <KeepAlive>
          <component :is="views[tab]" />
        </KeepAlive>
      </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import HoldingsView from './HoldingsView.vue'
import TransactionsView from './TransactionsView.vue'
import DividendsView from './DividendsView.vue'

const views = { holdings: HoldingsView, transactions: TransactionsView, dividends: DividendsView }

import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const VALID_TABS = ['holdings', 'transactions', 'dividends']
const normalize = (t) => (VALID_TABS.includes(t) ? t : 'holdings')

// 分頁選項
const options = computed(() => [
  { label: t('holding'), value: 'holdings' },
  { label: t('transactions'), value: 'transactions' },
  { label: t('dividends'), value: 'dividends' },
])

const route = useRoute()

// 分頁直接由 URL 決定，切換靠 RouterLink
const tab = computed(() => normalize(route.params.tab))

// 主題色底線滑到目前分頁：量 active 連結的位置與寬度（粗體會改變寬度，所以等 DOM 更新後再量）
// ponytail: 只在切換分頁、換語系、字型載入時重量；視窗縮放導致換行時底線不會跟著移，需要時再加 ResizeObserver
const navEl = ref(null)
const inkStyle = ref({})
const moveInk = () => {
  const a = navEl.value?.querySelector('a.active')
  // 用 transform 而非 left/width：transform 動畫在合成層跑，主執行緒忙著建表格時也不會卡
  if (a) inkStyle.value = { transform: `translateX(${a.offsetLeft}px) scaleX(${a.offsetWidth})` }
}
watch([tab, options], () => nextTick(moveInk))
onMounted(() => {
  moveInk()
  document.fonts?.ready.then(moveInk)
})
</script>

<style scoped>
/* 資產明細／交易／配息三分頁共用：表頭文字用次要色、不換行 */
.card-table :deep(.p-datatable-header-cell) {
  color: var(--p-text-muted-color);
  white-space: nowrap;
}
.subnav {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  padding: 0.75rem 0;
  font-size: 1rem;
  border-top: 1px solid var(--p-content-border-color);
  border-bottom: 1px solid var(--p-content-border-color);
}
.subnav a {
  color: var(--p-text-color);
  text-decoration: none;
}
.subnav a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.subnav a.active {
  font-weight: 700;
}
.subnav-ink {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 1px;
  height: 2px;
  background: var(--p-primary-color);
  transform-origin: left;
  transform: scaleX(0); /* 量到位置前先藏起來 */
  transition: transform 0.25s ease;
}
@media (prefers-reduced-motion: reduce) {
  .subnav-ink {
    transition: none;
  }
}
</style>
