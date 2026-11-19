<template>
  <div>
      <!-- 分頁樣式同儀表板的時間範圍小字分頁（main.css .range-tabs） -->
      <nav class="range-tabs portfolio-tabs" :aria-label="t('portfolio')">
        <RouterLink
          v-for="o in options"
          :key="o.value"
          :to="{ name: 'portfolio', params: { tab: o.value } }"
          replace
          class="range-tabs__btn"
          :class="{ 'is-active': tab === o.value }"
          :aria-current="tab === o.value ? 'page' : undefined"
        >{{ o.label }}</RouterLink>
      </nav>

      <div class="mt-4 card-table">
        <!-- KeepAlive：切分頁不重掛元件，避免每次重打 API、重建 DataTable。
             資料新鮮度靠 store：交易增刪會連帶 fetchHoldings/fetchDividends，切換投組由各分頁的 watch 處理 -->
        <KeepAlive>
          <component :is="views[tab]" />
        </KeepAlive>
      </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import HoldingsView from './HoldingsView.vue'
import TransactionsView from './TransactionsView.vue'
import DividendsView from './DividendsView.vue'
import PortfolioAnalysisView from './PortfolioAnalysisView.vue'

const views = { holdings: HoldingsView, transactions: TransactionsView, dividends: DividendsView, analysis: PortfolioAnalysisView }

import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const VALID_TABS = ['holdings', 'transactions', 'dividends', 'analysis']
const normalize = (t) => (VALID_TABS.includes(t) ? t : 'holdings')

// 分頁選項
const options = computed(() => [
  { label: t('holding'), value: 'holdings' },
  { label: t('transactions'), value: 'transactions' },
  { label: t('dividends'), value: 'dividends' },
  { label: t('portfolioAnalysis'), value: 'analysis' },
])

const route = useRoute()

// 分頁直接由 URL 決定，切換靠 RouterLink
const tab = computed(() => normalize(route.params.tab))
</script>

<style scoped>
/* 整頁主分頁：比儀表板的小字分頁大一號 */
.portfolio-tabs .range-tabs__btn {
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
}
.portfolio-tabs {
  margin-left: -0.75rem; /* 抵銷第一個分頁的左內距，文字與下方內容對齊 */
}

/* 資產明細／交易／配息三分頁共用：表頭文字用次要色、不換行 */
.card-table :deep(.p-datatable-header-cell) {
  color: var(--p-text-muted-color);
  white-space: nowrap;
}
</style>
