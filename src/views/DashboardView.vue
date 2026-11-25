<template>
  <!-- px-4 sm:px-6 lg:px-8 -->
  <!--  max-w-screen-2xl -->
  <div class="w-full">
    <Teleport defer to="#page-title-aside">
      <span v-if="pricesUpdatedAt">{{ t('lastUpdated', { time: formatUpdatedAt(pricesUpdatedAt) }) }}</span>
    </Teleport>

    <!-- 大盤指數行情：與投資組合資料無關，載入中也先顯示 -->
    <MarketStrip class="mb-6" />

    <!-- Skeleton Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <!-- 大螢幕：走勢圖在左、三張損益小卡疊在右欄；小螢幕維持小卡在上 -->
      <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_19rem] gap-4">
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 lg:auto-rows-fr lg:order-2 gap-4">
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

        <Card class="app-panel dashboard-panel--hero lg:order-1">
          <template #content>
            <div class="space-y-3">
              <Skeleton width="6rem" height="0.85rem" />
              <Skeleton width="16rem" height="2.5rem" />
              <Skeleton width="100%" height="320px" borderRadius="0.75rem" />
            </div>
          </template>
        </Card>
      </div>

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

      <!-- 持股篩選標籤：全部 + 市值前幾大，其餘收進向下箭頭的 Popover；可複選 -->
      <div v-if="symbolOptions.length > 1" class="symbol-chips" role="group" :aria-label="t('filterHoldings')">
        <button type="button" :class="chipClass(!isFiltered)" :aria-pressed="!isFiltered" @click="selectedSymbols = []">
          {{ t('allHoldings') }}
        </button>
        <button
          v-for="symbol in visibleSymbols"
          :key="symbol"
          type="button"
          :class="chipClass(selectedSymbols.includes(symbol))"
          :aria-pressed="selectedSymbols.includes(symbol)"
          @click="toggleSymbol(symbol)"
        >{{ symbol }}</button>
        <button
          v-if="hiddenSymbols.length"
          type="button"
          class="inline-flex items-center gap-1.5"
          :class="chipClass(hiddenSelectedCount > 0)"
          :aria-label="t('moreHoldings', { n: hiddenSymbols.length })"
          :aria-expanded="moreOpen"
          v-tooltip.bottom="{ value: t('moreHoldings', { n: hiddenSymbols.length }), showDelay: 500 }"
          @click="morePopover?.toggle($event)"
        >
          <span v-if="hiddenSelectedCount">{{ hiddenSelectedCount }}</span>
          <i class="pi pi-chevron-down" :class="{ 'rotate-180': moreOpen }" />
        </button>
        <Popover ref="morePopover" @show="moreOpen = true" @hide="moreOpen = false">
          <div class="symbol-chips symbol-chips--popover">
            <button
              v-for="symbol in hiddenSymbols"
              :key="symbol"
              type="button"
              :class="chipClass(selectedSymbols.includes(symbol))"
              :aria-pressed="selectedSymbols.includes(symbol)"
              @click="toggleSymbol(symbol)"
            >{{ symbol }}</button>
          </div>
        </Popover>
      </div>

      <!-- 大螢幕：走勢圖在左、三張損益小卡疊在右欄；小螢幕維持小卡在上 -->
      <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_19rem] gap-4">
        <!-- 損益資訊小卡 -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 lg:auto-rows-fr lg:order-2 gap-4">
          <Card class="app-panel dashboard-metric-card h-full">
            <template #content>
              <p class="dashboard-kicker">{{ $t('unrealizedProfit') }}</p>
              <!-- 損益金額與未實現報酬率同一列，報酬率靠右 -->
              <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div v-if="totalProfit" class="inline-flex items-baseline text-[1.75rem] font-normal tracking-tight tabular-nums" :class="profitColor(totalProfit)">
                  <span>{{ totalProfit > 0 ? '+' : '' }}{{ splitAmountForEmphasis(totalProfit).main }}</span>
                  <span>{{ splitAmountForEmphasis(totalProfit).fraction }}</span>
                  <span class="ml-1.5 text-[0.4em] font-normal tracking-normal text-muted-color">{{ splitAmountForEmphasis(totalProfit).code }}</span>
                </div>
                <div v-else class="text-[1.75rem] font-normal tracking-tight tabular-nums">--</div>
                <span
                  v-if="holdingsStore.list.length"
                  class="asset-growth-pill asset-growth-pill--sm"
                  :class="totalReturn >= 0 ? 'asset-growth-pill--up' : 'asset-growth-pill--down'"
                  v-tooltip.top="$t('unrealizedReturn')"
                >{{ formatSignedNumber(totalReturn) }}%</span>
              </div>

              <!-- 獲利／虧損檔數比例條 -->
              <div v-if="holdingsStore.list.length" class="dashboard-winloss mt-3" :aria-label="$t('winLossValue', winLoss)">
                <span v-if="winLoss.up" class="dashboard-winloss__up" :style="{ flexGrow: winLoss.up }" />
                <span v-if="winLoss.down" class="dashboard-winloss__down" :style="{ flexGrow: winLoss.down }" />
              </div>

              <dl class="dashboard-metric-rows">
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
              <div v-if="realizedProfit" class="mt-2 inline-flex items-baseline text-[1.75rem] font-normal tracking-tight tabular-nums" :class="profitColor(realizedProfit)">
                <span>{{ realizedProfit > 0 ? '+' : '' }}{{ splitAmountForEmphasis(realizedProfit).main }}</span>
                <span>{{ splitAmountForEmphasis(realizedProfit).fraction }}</span>
                <span class="ml-1.5 text-[0.4em] font-normal tracking-normal text-muted-color">{{ splitAmountForEmphasis(realizedProfit).code }}</span>
              </div>
              <div v-else class="mt-2 text-[1.75rem] font-normal tracking-tight tabular-nums">--</div>

              <dl class="dashboard-metric-rows">
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
                <span class="text-[1.75rem] font-normal tracking-tight tabular-nums">{{ irr.toFixed(2) }}%</span>
                <span class="dashboard-footnote">{{ $t('annualizedReturn') }}</span>
              </div>
              <div v-else class="mt-2 text-[1.75rem] font-normal tracking-tight tabular-nums text-muted-color">--</div>

              <dl class="dashboard-metric-rows">
                <div v-for="row in irrRows" :key="row.label"><dt>{{ row.label }}</dt><dd>{{ row.value }}</dd></div>
              </dl>
            </template>
          </Card>
        </div>

        <!-- 走勢圖＋區間統計（另一張卡片）放在左欄 -->
        <div class="flex min-w-0 flex-col gap-4 lg:order-1">
          <!-- 總資產走勢圖 -->
          <!-- 走勢圖卡片撐滿左欄剩餘高度，與右欄三張小卡底部對齊；圖表跟著長高 -->
          <Card class="app-panel dashboard-panel--hero">
            <template #content>
              <div class="flex flex-1 flex-col">
                <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div class="flex flex-col mb-2">
                    <p class="dashboard-kicker">{{ $t('totalValue') }}</p>

                    <div class="mt-1 flex flex-wrap items-end gap-2">
                      <!-- 大數字用細字，靠字級撐場面；單位與數字基線對齊、約 0.4 倍字級 -->
                      <div v-if="totalValue" class="max-w-full truncate text-4xl font-light tracking-tight tabular-nums inline-flex items-baseline">
                        <span>{{ splitAmountForEmphasis(totalValue).main }}</span>
                        <span>{{ splitAmountForEmphasis(totalValue).fraction }}</span>
                        <span class="ml-1.5 text-[0.4em] font-normal tracking-normal text-muted-color">{{ splitAmountForEmphasis(totalValue).code }}</span>
                      </div>
                      <div v-else class="text-4xl font-light">--</div>

                      <div
                        v-if="growthRateNumber !== null"
                        class="inline-flex items-center gap-2 pb-1"
                      >
                        <span class="asset-growth-change" :class="growthRateNumber >= 0 ? 'text-up' : 'text-down'">
                          {{ formatSignedNumber(growthRateNumber) }}%
                          ({{ change >= 0 ? '+' : '-' }}{{ Math.abs(change).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }})
                        </span>
                      </div>

                      <div v-else class="inline-flex items-center gap-2 pb-1 text-lg text-muted-color">
                        <span>--</span>
                        <span>(--)</span>
                      </div>
                    </div>
                  </div>

                </div>

                <!-- 面積圖：圖例（Highcharts 左上）與時間範圍分頁同一列；手機寬度放不下，分頁改疊在圖上方 -->
                <div v-if="holdingsStore.list.length" class="relative mt-4 flex flex-1 flex-col">
                  <!-- 時間範圍：各區間漲跌放 tooltip，選中區間的漲跌已顯示在總價值旁 -->
                  <div class="range-tabs justify-end sm:absolute sm:right-0 sm:top-0 sm:z-10" role="group" :aria-label="$t('timeRange')">
                    <button
                      v-for="option in timeRangeOptionsWithGrowth"
                      :key="option.value"
                      type="button"
                      class="range-tabs__btn"
                      :class="{ 'is-active': selectedPeriod === option.value }"
                      :aria-pressed="selectedPeriod === option.value"
                      v-tooltip.top="{ value: option.growth === null ? '--' : `${formatSignedNumber(option.growth)}%`, showDelay: 300 }"
                      @click="selectedPeriod = option.value"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                  <!-- 圖表絕對定位，不把自己的高度回饋給版面（否則欄高會被圖表撐住）；Highcharts 以 ResizeObserver 跟著容器重繪 -->
                  <div class="relative min-h-[320px] flex-1">
                    <highcharts :options="areaChartOptions" class="absolute inset-0" />
                  </div>
                </div>

                <!-- 沒有交易時：引導新增 -->
                <div v-else class="dashboard-chart-empty mt-2">
                  <div class="dashboard-chart-empty__body">
                    <span class="dashboard-chart-empty__icon"><i class="pi pi-chart-line" /></span>
                    <h3 class="text-base font-medium">{{ $t('dashboardChartEmptyTitle') }}</h3>
                    <p class="text-xs sm:text-sm text-muted-color max-w-sm">{{ $t('dashboardChartEmptyDesc') }}</p>
                    <div class="mt-2 flex flex-wrap justify-center gap-2">
                      <Button :label="$t('addInvestment')" icon="pi pi-plus" size="small" @click="transactionDialogVisible = true" />
                      <Button :label="$t('importTransactions')" icon="pi pi-upload" size="small" severity="secondary" outlined @click="importDialogVisible = true" />
                    </div>
                  </div>
                </div>
                <TransactionDialog v-model="transactionDialogVisible" />
                <ImportDataDialog v-model="importDialogVisible" mode="transactions" />

                <!-- 區間統計：跟著選取的時間區間變動 -->
              </div>
            </template>
          </Card>

          <!-- 區間統計：最高、最低、最大回撤、距高點 -->
          <Card v-if="stats" class="app-panel">
            <template #content>
              <dl class="dashboard-period-stats">
                <div>
                  <dt>{{ $t('periodHigh') }}</dt>
                  <dd>{{ formatAmountWithCode(stats.high.y, { currency: displayCurrency }) }}</dd>
                  <dd class="dashboard-period-stats__sub">{{ formatShortDate(stats.high.x) }}</dd>
                </div>
                <div>
                  <dt>{{ $t('periodLow') }}</dt>
                  <dd>{{ formatAmountWithCode(stats.low.y, { currency: displayCurrency }) }}</dd>
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

            </div>
          </template>

          <template #content>
            <div v-if="holdingsStore.list.length > 0" class="dashboard-allocation-content py-2">
              <div class="dashboard-allocation-layout">
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

                <!-- 表格上方：資產／目標配置切換，樣式同走勢圖的時間範圍分頁 -->
                <div class="min-w-0">
                <div class="range-tabs mb-2 justify-end" role="group" :aria-label="$t('allocation')">
                  <!-- disabled 的按鈕收不到滑鼠事件，tooltip 掛在外層 span -->
                  <span
                    v-for="option in pieChartType"
                    :key="option.value"
                    v-tooltip.top="{ value: $t('noTargetAllocation'), disabled: !option.disabled }"
                  >
                    <button
                      type="button"
                      class="range-tabs__btn"
                      :class="{ 'is-active': selectedPieType === option.value }"
                      :aria-pressed="selectedPieType === option.value"
                      :disabled="option.disabled"
                      @click="selectedPieType = option.value"
                    >{{ option.label }}</button>
                  </span>
                </div>

                <DataTable :value="selectedAllocationBreakdown" dataKey="key" size="small" class="min-w-0 text-[0.8125rem]">
                  <Column :header="$t('currentAsset')">
                    <template #body="{ data: item }">
                      <div class="flex min-w-0 items-center gap-2.5">
                        <span class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: item.color }"></span>
                        <span v-if="item.key === 'others'" class="truncate">{{ item.name }}</span>
                        <RouterLink v-else :to="{ name: 'asset', params: { symbol: item.key } }" class="truncate underline-offset-4 hover:underline hover:text-primary">{{ item.name }}</RouterLink>
                      </div>
                    </template>
                  </Column>
                  <Column headerClass="num-col" bodyClass="num-col" :header="selectedPieType === 'actual' ? $t('holdingValue') : $t('targetAmount')">
                    <template #body="{ data: item }">{{ formatAmountWithCode(item.amount) }}</template>
                  </Column>
                  <Column headerClass="num-col" bodyClass="num-col" :header="$t('distribution')">
                    <template #body="{ data: item }">{{ formatPreciseAllocationPercentage(item.percentage) }}</template>
                  </Column>
                  <Column headerClass="num-col" bodyClass="num-col" v-if="selectedPieType === 'actual'" :header="$t('unrealizedProfit')">
                    <template #body="{ data: item }">
                      <span :class="item.profit >= 0 ? 'text-up' : 'text-down'">{{ formatAmountWithCode(item.profit) }}</span>
                    </template>
                  </Column>
                </DataTable>
                </div>
              </div>
            </div>

            <div v-else class="flex flex-col items-center text-center gap-3 py-8">
              <h2 class="text-base sm:text-lg font-medium">{{ $t('portfolioNoHoldingsTitle') }}</h2>
              <p class="text-xs sm:text-sm text-muted-color">{{ $t('portfolioNoHoldingsDesc') }}</p>
            </div>
          </template>
        </Card>
      </div>

      <!-- Holdings Table -->
      <Card class="app-panel dashboard-table-panel mb-8 p-4">
      <template #content>
        <h2 class="mb-4 text-lg font-normal">{{ $t('holdings') }}</h2>

        <DataTable :value="holdings" sortField="currentValue" :sortOrder="-1" dataKey="id" tableStyle="min-width: 50rem" rowHover>
          <Column field="name" :header="$t('currentAsset')">
            <template #body="{ data }">
              <RouterLink :to="{ name: 'asset', params: { symbol: data.symbol } }"
                  class="group flex items-center cursor-pointer p-2 rounded-md truncate"
                  :style="{ width: '300px', minWidth: '250px' }">
                <div class="truncate">
                  <div class="truncate font-medium underline-offset-4 group-hover:underline group-hover:text-primary">{{ data.symbol }}</div>
                  <div class="text-xs text-[var(--p-card-subtitle-color)] mt-1">{{ data.name }}</div>
                </div>
              </RouterLink>
            </template>
          </Column>

          <Column headerClass="num-col" bodyClass="num-col" field="currentPrice" :header="$t('currentPrice')" sortable>
            <template #body="{ data }">
              <div class="font-medium inline-flex items-end">
                <span>{{ splitDisplayAmount(data.nativeCurrentPrice, 'price', data.currency).main }}</span>
                <span>{{ splitDisplayAmount(data.nativeCurrentPrice, 'price', data.currency).fraction }}</span>
                <span class="ml-1 text-xs pb-0.5 font-normal text-[var(--p-text-muted-color)]">{{ splitDisplayAmount(data.nativeCurrentPrice, 'price', data.currency).code }}</span>
              </div>
            </template>
          </Column>

          <Column headerClass="num-col" bodyClass="num-col" field="shares" :header="$t('shares')" sortable>
            <template #body="{ data }">
              <span class="font-medium">{{ data.shares }}</span>
            </template>
          </Column>
          <Column headerClass="num-col" bodyClass="num-col" field="totalCost" :header="$t('totalCost')" sortable>
            <template #body="{ data }">
              <div
                v-tooltip.top="formatAvgCostTooltip(data.nativeAvgCost, data.currency)"
                class="font-medium inline-flex items-end cursor-help"
              >
                <span>{{ splitDisplayAmount(data.nativeTotalCost, 'amount', data.currency).main }}</span>
                <span>{{ splitDisplayAmount(data.nativeTotalCost, 'amount', data.currency).fraction }}</span>
                <span class="ml-1 text-xs pb-0.5 font-normal text-[var(--p-text-muted-color)]">{{ splitDisplayAmount(data.nativeTotalCost, 'amount', data.currency).code }}</span>
              </div>
            </template>
          </Column>

          <Column headerClass="num-col" bodyClass="num-col" field="currentValue" :header="$t('totalValue')" sortable>
            <template #body="{ data }">
              <div class="font-medium inline-flex items-end">
                <span>{{ splitDisplayAmount(data.nativeCurrentValue, 'amount', data.currency).main }}</span>
                <span>{{ splitDisplayAmount(data.nativeCurrentValue, 'amount', data.currency).fraction }}</span>
                <span class="ml-1 text-xs pb-0.5 font-normal text-[var(--p-text-muted-color)]">{{ splitDisplayAmount(data.nativeCurrentValue, 'amount', data.currency).code }}</span>
              </div>
            </template>
          </Column>

          <Column headerClass="num-col" bodyClass="num-col" field="profitPercentage" :header="$t('comparisonReturnRate')" sortable>
            <template #body="{ data }">
              <span class="font-medium" :class="{ 'text-up': data.profitPercentage >= 0, 'text-down': data.profitPercentage < 0 }">
                {{ formatSignedNumber(data.profitPercentage) }}%
              </span>
            </template>
          </Column>

          <Column field="currentValue" :header="$t('rate')">
            <template #body="{ data }">
              <div class="flex min-w-27 items-center gap-3">
                <ProgressBar :value="getHoldingWeightPercentage(data)" :showValue="false" class="!h-1.5 w-20 shrink-0" />
                <span class="min-w-11 text-right text-xs text-muted-color">{{ formatAllocationPercentage(getHoldingWeightPercentage(data)) }}</span>
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
import Popover from 'primevue/popover'
import api from '@/utils/api'
import { totalReturnPct, realizedProfit as calcRealizedProfit, portfolioXirr, twrChange, twrIndex, filterByPeriod, yAxisBounds, periodStats } from '@/utils/portfolioMetrics'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTransactionsStore } from '@/stores/transactions';
import { useHoldingsStore } from '@/stores/holdings'
import NoData from '@/components/NoData.vue'
import MarketStrip from '@/components/MarketStrip.vue'
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
const { formatAmount, formatAmountWithCode, formatPriceWithCode, splitDisplayAmount, convertAmountToUsd, convertAmountToUsdAt, currencySymbol } = useCurrency()
import { getCurrencyMeta } from '@/utils/currency'

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

// 只看部分持股：空陣列 = 全部。小卡、配置、持股表與走勢圖（後端 holdings-chart 的 symbols 參數）都跟著篩選
const selectedSymbols = ref([])
// 依市值由大到小，前 VISIBLE_CHIPS 檔直接顯示成標籤，其餘收進「更多」
const symbolOptions = computed(() => [...holdingsStore.list].sort((a, b) => b.currentValue - a.currentValue).map(h => h.symbol))
const VISIBLE_CHIPS = 8
const visibleSymbols = computed(() => symbolOptions.value.slice(0, VISIBLE_CHIPS))
const hiddenSymbols = computed(() => symbolOptions.value.slice(VISIBLE_CHIPS))
const hiddenSelectedCount = computed(() => hiddenSymbols.value.filter(s => selectedSymbols.value.includes(s)).length)
const morePopover = ref()
const moreOpen = ref(false)
// 與 SearchBox 的「全部／持有」標籤同樣式：選中以文字色當底，深淺色模式自動反轉
const chipClass = active => ['rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p-primary-color)]', active
  ? 'bg-[var(--p-text-color)] text-[var(--p-content-background)]'
  : 'bg-emphasis text-color hover:bg-[var(--p-content-hover-background)]']
const toggleSymbol = symbol => {
  selectedSymbols.value = selectedSymbols.value.includes(symbol)
    ? selectedSymbols.value.filter(s => s !== symbol)
    : [...selectedSymbols.value, symbol]
}
const isFiltered = computed(() => selectedSymbols.value.length > 0)
const pickSelected = list => (isFiltered.value ? list.filter(x => selectedSymbols.value.includes(x.symbol)) : list)
const holdings = computed(() => pickSelected(holdingsStore.list))
const trades = computed(() => pickSelected(transactionsStore.list))
const shownDividends = computed(() => pickSelected(dividends.value))
// 換投資組合或持股賣光時，拿掉已不存在的代號
watch(symbolOptions, opts => {
  const kept = selectedSymbols.value.filter(s => opts.includes(s))
  if (kept.length !== selectedSymbols.value.length) selectedSymbols.value = kept
})

// 目標配置是對整個投資組合設定的，金額用全部持股市值換算
const portfolioValue = computed(() => holdingsStore.list.reduce((sum, h) => sum + h.currentValue, 0))
const totalValue = computed(() => {
  return holdings.value.reduce((sum, h) => sum + h.currentValue, 0)
})
const totalProfit = computed(() => {
  return holdings.value.reduce((sum, h) => sum + (h.currentValue - h.totalCost), 0)
})
const selectedPieType = ref('actual')
const pieChartType = computed(() => ([
  { label: t('currentAsset'), value: 'actual' },
  { label: t('targetAllocation'), value: 'target', disabled: !hasTargetAllocation.value }
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
// 區間漲跌用時間加權報酬，扣掉期間買賣的資金進出
const periodChange = computed(() => twrChange(chartPoints.value))
const growthRateNumber = computed(() => periodChange.value.pct)
const change = computed(() => periodChange.value.amount)
// 投入基準線：期初市值＋期間累計淨投入，與市值線的差距就是區間損益（加碼造成的跳升不會被看成獲利）
const investedPoints = computed(() => {
  let base = chartPoints.value[0]?.y ?? 0
  return chartPoints.value.map((p, i) => [p.x.getTime(), i ? (base += p.flow ?? 0) : base])
})
// 最高／最低看帳戶金額；最大回撤、距高點看扣掉資金進出的報酬曲線，大筆買賣不會被當成漲跌
const stats = computed(() => {
  const base = periodStats(chartPoints.value)
  const perf = periodStats(twrIndex(chartPoints.value))
  return base && perf && { ...base, maxDrawdown: perf.maxDrawdown, fromHigh: perf.fromHigh }
})

const formatShortDate = d => d.toLocaleDateString(locale.value.startsWith('zh') ? 'zh-TW' : 'en-US')

/* =========================
 *  Utils / Formatters
 * =======================*/
// 小數位與拆解規則由 useCurrency 統一處理（各自實作會把千分位逗號誤判成小數）
function splitAmountForEmphasis(value) {
  return splitDisplayAmount(value)
}

function formatAvgCostTooltip(value, currency) {
  const formatted = formatPriceWithCode(value, currency)
  if (formatted === '--') {
    return '--'
  }

  return `${formatted} ${t('perShare')}`
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
    maximumFractionDigits: getCurrencyMeta(displayCurrency.value).fractionDigits === 0 ? 0 : 1,
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
  growth: twrChange(filterByPeriod(rawChartPoints.value, option.value, p => p.x)).pct,
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

  return buildAllocationBreakdown(holdings.value, holding => {
    const amount = Number(holding.currentValue)
    const percentage = total > 0 ? (amount / total) * 100 : 0
    const profit = amount - Number(holding.totalCost)

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
  const total = portfolioValue.value || 0

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
// 切到沒設目標配置的投資組合時退回資產分頁
watch(hasTargetAllocation, has => { if (!has) selectedPieType.value = 'actual' })

const selectedAllocationBreakdown = computed(() => {
  return selectedPieType.value === 'actual'
    ? actualAllocationBreakdown.value
    : targetAllocationBreakdown.value
})

const allocationItemCount = computed(() => {
  return selectedPieType.value === 'actual'
    ? holdings.value.length
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
        <div style="min-width: 120px; font-size: 12px; line-height: 1.5;">
          <div style="font-weight: 500; margin-bottom: 2px;">${this.point.name}</div>
          <div>${formatAllocationPercentage(percentage)}</div>
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
          fontWeight: '500',
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

const totalReturn = computed(() => totalReturnPct(holdings.value))
// 已實現損益與 XIRR 都是歷史現金流，用成交當時的匯率換算；
// 用今日匯率會讓早就結算完的損益每天跟著匯率變動
const realizedProfit = computed(() => calcRealizedProfit(trades.value, convertAmountToUsdAt))
const irr = computed(() => holdingsStore.list.length
  ? portfolioXirr(trades.value, shownDividends.value, totalValue.value, convertAmountToUsdAt)
  : null)

/* 損益小卡的明細列 */
const profitColor = v => (v >= 0 ? 'text-up' : 'text-down')
const winLoss = computed(() => {
  const up = holdings.value.filter(h => h.currentValue >= h.totalCost).length
  return { up, down: holdings.value.length - up }
})
// 股息表沒有幣別欄位，與 portfolioXirr 相同以該 symbol 交易的幣別換算；資料層一律用 USD，顯示時 formatAmount* 才轉幣別
const totalDividends = computed(() => {
  const currencyBySymbol = new Map(transactionsStore.list.map(tx => [tx.symbol, tx.currency]))
  return shownDividends.value.reduce((s, d) => s + convertAmountToUsd(d.amount, currencyBySymbol.get(d.symbol) ?? 'USD'), 0)
})
const firstTradeDate = computed(() => trades.value.reduce(
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
    { label: t('totalInvested'), value: formatAmountWithCode(trades.value
      .filter(tx => tx.transactionType === 'buy')
      .reduce((s, tx) => s + convertAmountToUsdAt(tx.price * tx.shares + tx.fee, tx.currency, tx.fxRate), 0)) },
  ]
})

/* =========================
 *  Charts (options & helpers)
 * =======================*/
const areaChartOptions = computed(() => {
  const lineColor = 'var(--p-primary-color)'
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
    legend: {
      enabled: true,
      align: 'left',
      verticalAlign: 'top',
      x: -8, // 抵掉 Highcharts 圖例的內距，與上方「總價值」左緣對齊
      itemStyle: { fontSize: '12px', fontWeight: '400', color: axisColor },
      itemHoverStyle: { color: tooltipFg },
    },
    xAxis: {
      type: 'datetime',
      labels: {
        formatter: function () {
          return chartDateFormatter.format(new Date(this.value))
        },
        style: { fontSize: '12px', color: axisColor }
      },
      lineWidth: 0,
      tickLength: 0,
      // Highcharts 預設 day 只有 [1, 2]，1M 區間會直接跳到每週一個刻度（只剩 4 個）；補 3、4 天讓 1M 約 8 個刻度
      units: [['day', [1, 2, 3, 4]], ['week', [1, 2]], ['month', [1, 2, 3, 4, 6]], ['year', null]],
    },
    yAxis: {
      title: { text: null },
      ...yAxisBounds([...chartPoints.value.map(d => Number(d.y)), ...investedPoints.value.map(d => d[1])]),
      startOnTick: false,
      endOnTick: false,
      labels: {
        // 縮寫成 1.4M；小數兩位，避免 1.35M、1.4M 這種相鄰刻度四捨五入成同一個字
        formatter: function () { return `${currencySymbol.value}${Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(this.value)}` },
        style: { fontSize: '12px', color: axisColor },
      },
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
      // 細線＋淡漸層（仿 Google 財經）：線下 18% 主色，往下淡到透明
      area: {
        threshold: null,
        softThreshold: false,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [[0, 'color-mix(in srgb, var(--p-primary-color) 18%, transparent)'], [1, 'color-mix(in srgb, var(--p-primary-color) 0%, transparent)']],
        },
        lineWidth: 1.5,
        marker: { enabled: false },
      },
    },
    series: [{
      type: 'area',
      name: t('totalPrice'),
      data: chartPoints.value.map(d => [d.x.getTime(), d.y]),
      color: lineColor,
    }, {
      type: 'line',
      name: t('investedBaseline'),
      data: investedPoints.value,
      step: 'center',
      color: axisColor,
      dashStyle: 'ShortDash',
      lineWidth: 1,
      marker: { enabled: false },
      enableMouseTracking: true,
    }],
  }
})

// 連續切換篩選時，只採用最後一次請求的結果，避免較慢的舊回應蓋掉新的
let chartRequestId = 0
async function fetchChartData() {
  const requestId = ++chartRequestId
  if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id || holdingsStore.list.length === 0) {
    rawChartPoints.value = []
    return
  }

  try {
    const symbols = isFiltered.value ? `&symbols=${encodeURIComponent(selectedSymbols.value.join(','))}` : ''
    const data = await api.get(`/api/yahoo/holdings-chart?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}&currency=${displayCurrency.value}${symbols}`)
    if (requestId !== chartRequestId) return
    rawChartPoints.value = data
      .map(item => ({ x: new Date(item.date), y: item.close, flow: item.flow ?? 0 }))
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

// 走勢圖由後端用歷史匯率換算，切換顯示幣別或持股篩選要重抓
watch([displayCurrency, selectedSymbols], () => {
  if (!isLoadingData) fetchChartData()
})
</script>

<style scoped>
/* 持股篩選標籤列（標籤本身的樣式見 chipClass） */
.symbol-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.symbol-chips--popover {
  max-width: 22rem;
}

.symbol-chips i {
  font-size: 0.7rem;
  transition: transform 0.15s ease;
}

.dashboard-panel--hero {
  overflow: hidden;
  flex: 1;
}

.dashboard-panel--hero :deep(.p-card-body),
.dashboard-panel--hero :deep(.p-card-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 小標：一般字重、不轉大寫不加字距，讓數字成為唯一重點 */
.dashboard-kicker {
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--p-text-muted-color);
}

.dashboard-footnote {
  font-size: 0.75rem;
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
  font-size: 0.75rem;
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
  font-size: 0.8125rem;
}

.dashboard-metric-rows > div {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.3rem 0; /* 不畫分隔線，靠行距區分 */
}

.dashboard-metric-rows dt {
  color: var(--p-text-muted-color);
}

.dashboard-metric-rows dd {
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.dashboard-period-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  font-size: 0.8125rem;
}

@media (min-width: 640px) {
  .dashboard-period-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

.dashboard-period-stats > div {
  padding: 0.25rem 0;
}

.dashboard-period-stats dt {
  color: var(--p-text-muted-color);
}

.dashboard-period-stats dd {
  margin-top: 0.15rem;
  font-size: 1rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.dashboard-period-stats .dashboard-period-stats__sub {
  margin-top: 0;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--p-text-muted-color);
}

.dashboard-winloss {
  display: flex;
  gap: 2px;
  height: 4px;
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

/* 卡片標題：18px 一般字重、主文字色，層次靠字級與顏色而非粗細 */
.dashboard-allocation-title {
  font-size: 1.125rem;
  font-weight: 400;
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
  font-weight: 300;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--p-text-color);
}

.dashboard-allocation-total-label {
  margin-top: 0.2rem;
  font-size: 0.75rem;
  font-weight: 400;
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
  font-size: 0.8125rem;
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
