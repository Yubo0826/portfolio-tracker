<template>
  <div class="set-page">
    <p class="set-intro">{{ $t('viewResultsDesc') }}</p>

    <!-- ============ 設定參數 ============ -->
    <section class="set-group">
      <div class="set-group__head">{{ $t('setParams') }}</div>
      <div class="set-group__body">
        <div class="set-row grid gap-4 md:grid-cols-2">
          <div>
            <label class="set-label">{{ $t('startDate') }}</label>
            <DatePicker
              v-model="form.startDate"
              :maxDate="new Date()"
              showIcon
              fluid
              iconDisplay="input"
              :placeholder="$t('selectDatePlaceholder')"
            />
          </div>
          <div>
            <label class="set-label">{{ $t('endDate') }}</label>
            <DatePicker
              v-model="form.endDate"
              :maxDate="new Date()"
              showIcon
              fluid
              iconDisplay="input"
              :placeholder="$t('selectDatePlaceholder')"
            />
          </div>
          <div>
            <label class="set-label">{{ $t('initialCapital') }}</label>
            <InputNumber
              v-model="form.initialCapital"
              mode="currency"
              currency="USD"
              locale="en-US"
              :min="1000"
              fluid
            />
          </div>
          <div>
            <label class="set-label">{{ $t('rebalanceStrategy') }}</label>
            <Select
              v-model="form.rebalance"
              :options="rebalanceOptions"
              optionLabel="label"
              optionValue="value"
              :placeholder="$t('selectStrategy')"
              fluid
            />
          </div>
          <div class="md:col-span-2 flex justify-center mt-2">
            <Button :label="$t('runBacktest')" @click="runBacktest" :loading="isLoading" />
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 回測結果 ============ -->
    <section v-if="result" class="set-group">
      <div class="set-group__head">{{ $t('resultTitle') }}</div>
      <div class="set-group__body bt-metrics">
        <div v-for="m in metrics" :key="m.label" class="bt-metric">
          <span class="bt-metric__label">
            {{ m.label }}
            <i
              v-if="m.hint"
              class="pi pi-info-circle"
              v-tooltip.bottom="{ value: m.hint, showDelay: 500 }"
            />
          </span>
          <span class="bt-metric__value">{{ m.value }}</span>
        </div>
      </div>
    </section>

    <!-- ============ 資產走勢圖 ============ -->
    <section v-if="lineData.length" class="set-group">
      <div class="set-group__head">{{ $t('chartTitle') }}</div>
      <div class="set-group__body">
        <div class="set-row">
          <p class="set-help" style="margin: 0 0 0.5rem">{{ $t('chartSubtitle') }}</p>
          <highcharts :options="highLineOptions" style="width: 100%; height: 400px;" />
        </div>
      </div>
    </section>

    <!-- ============ 年度報酬率圖 ============ -->
    <section v-if="annualReturnsData.length" class="set-group">
      <div class="set-group__head">{{ $t('annualReturnChart') }}</div>
      <div class="set-group__body">
        <div class="set-row">
          <p class="set-help" style="margin: 0 0 0.5rem">{{ $t('annualReturnHint') }}</p>
          <highcharts :options="highBarOptions" style="width: 100%; height: 400px;" />
        </div>
      </div>
    </section>
  </div>
</template>


<script setup>
import { computed, ref } from "vue";
import * as toast from '@/composables/toast'
import api from "@/utils/api";
import { toIsoDate } from "@/utils/portfolioMetrics";
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { useAuthStore } from "@/stores/auth";
import { usePortfolioStore } from "@/stores/portfolio";

import { useTheme } from '@/composables/useTheme.js'
const { chartPalette } = useTheme()

const auth = useAuthStore();
const portfolioStore = usePortfolioStore();

const form = ref({
  startDate: new Date("2020-01-01"),
  endDate: new Date("2024-12-25"),
  initialCapital: 10000,
  rebalance: "quarterly",
});

const rebalanceOptions = [
  { label: t('monthly'), value: "monthly" },
  { label: t('quarterly'), value: "quarterly" },
  { label: t('yearly'), value: "yearly" },
  { label: t('threshold'), value: "threshold" },
];

const result = ref(null);

const pct = (v) => `${(v * 100).toFixed(2)}%`;
const metrics = computed(() => {
  const r = result.value;
  if (!r) return [];
  return [
    { label: t('cumulativeReturn'), value: pct(r.cumulativeReturn) },
    { label: t('annualizedReturn'), value: pct(r.annualizedReturn) },
    { label: 'Sharpe Ratio', value: r.sharpeRatio.toFixed(2), hint: t('sharpeRatioHint') },
    { label: t('maxDrawdown'), value: pct(r.maxDrawdown), hint: t('maxDrawdownHint') },
    { label: t('volatility'), value: pct(r.volatility), hint: t('volatilityHint') },
    { label: t('winRate'), value: pct(r.winRate), hint: t('winRateHint') },
  ];
});
const isLoading = ref(false);
const lineData = ref([]);
const highLineOptions = computed(() => {
  const { axis: axisColor, grid: gridColor, tooltipBg, tooltipFg, legend: legendColor } =
    chartPalette.value
  return {
    chart: { type: 'line', backgroundColor: 'transparent', animation: { duration: 300 } },
    title: { text: null },
    credits: { enabled: false },
    legend: { itemStyle: { color: legendColor } },
    xAxis: {
      type: 'datetime',
      labels: { datetimeUTC: false, style: { color: axisColor } },
      lineColor: gridColor,
      tickColor: gridColor,
    },
    yAxis: {
      labels: {
        formatter: function () { return `$${this.value.toFixed(0)}` },
        style: { color: axisColor },
      },
      gridLineColor: gridColor,
    },
    tooltip: {
      xDateFormat: '%Y-%m-%d',
      valuePrefix: '$',
      backgroundColor: tooltipBg,
      style: { color: tooltipFg },
    },
    colors: ['#3B82F6', '#EF4444'],
    series: lineData.value.map((s, i) => ({
      type: 'line',
      name: s.name,
      data: s.data,
      color: ['#3B82F6', '#EF4444'][i],
    })),
  }
})

/** Sharpe Ratio */
function calculateSharpeRatio(portfolioValues, riskFreeRate = 0) {
  if (portfolioValues.length < 2) return 0;
  const dailyReturns = portfolioValues
    .slice(1)
    .map((v, i) => (v - portfolioValues[i]) / portfolioValues[i]);
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const excessReturn = avgReturn - riskFreeRate / 252;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    (dailyReturns.length - 1);
  const stdDev = Math.sqrt(variance);
  return (excessReturn / stdDev) * Math.sqrt(252);
}

/** 最大回撤 */
function calculateMaxDrawdown(portfolioValues) {
  let peak = portfolioValues[0];
  let maxDrawdown = 0;
  for (let value of portfolioValues) {
    if (value > peak) peak = value;
    const drawdown = (peak - value) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  return maxDrawdown;
}

/** 波動率 */
function calculateVolatility(portfolioValues) {
  if (portfolioValues.length < 2) return 0;
  const dailyReturns = portfolioValues
    .slice(1)
    .map((v, i) => (v - portfolioValues[i]) / portfolioValues[i]);
  const avg = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) /
    (dailyReturns.length - 1);
  const stdDev = Math.sqrt(variance);
  return stdDev * Math.sqrt(252);
}

/** 勝率 */
function calculateWinRate(portfolioValues) {
  if (portfolioValues.length < 2) return 0;
  const dailyReturns = portfolioValues
    .slice(1)
    .map((v, i) => (v - portfolioValues[i]) / portfolioValues[i]);
  const wins = dailyReturns.filter((r) => r > 0).length;
  return wins / dailyReturns.length;
}

function rebalancePortfolio(validAssets, holdings, prices, i, total) {
  for (let asset of validAssets) {
    const price = prices[asset.symbol][i].close;
    holdings[asset.symbol] = (total * (asset.target / 100)) / price;
  }
}

function simulateBacktest(allocation, prices, { initialCapital, rebalance }) {
  const validAssets = allocation.filter((asset) => prices[asset.symbol]);
  if (validAssets.length === 0) {
    console.warn("simulateBacktest: no matching price data found");
    return { portfolioValues: [], dates: [] };
  }

  /** 1. 只取所有資產的共同日期 (intersection) */
  const assetDates = Object.values(prices).map(arr => arr.map(p => p.date));
  const commonDates = assetDates.reduce((acc, dates) =>
    acc.filter((d) => dates.includes(d))
  );

  const sortedDates = commonDates.sort((a, b) => new Date(a) - new Date(b));

  /** 建立對齊後價格資料 */
  const alignedPrices = {};
  for (let symbol in prices) {
    const dailyMap = new Map(prices[symbol].map((p) => [p.date, p.close]));
    alignedPrices[symbol] = sortedDates.map((date) => {
      const price = dailyMap.get(date);
      return { date, close: price };
    });
  }

  /** 初始化持倉 */
  let holdings = {};
  const firstDate = sortedDates[0];
  for (let asset of validAssets) {
    const startPrice =
      alignedPrices[asset.symbol].find((p) => p.date === firstDate)?.close || 1;
    const weight = asset.target / 100;
    holdings[asset.symbol] = (initialCapital * weight) / startPrice;
  }

  const portfolioValues = [];

  /** 主模擬迴圈 */
  sortedDates.forEach((dateStr, i) => {
    const date = new Date(dateStr);
    let total = 0;

    // 計算當日總價值
    for (let asset of validAssets) {
      const price = alignedPrices[asset.symbol][i].close;
      total += holdings[asset.symbol] * price;
    }
    portfolioValues.push(total);

    /** 2. 月末、季末、年末 再平衡判斷 */
    const nextDate = sortedDates[i + 1] ? new Date(sortedDates[i + 1]) : null;
    const isMonthEnd =
      !nextDate || date.getMonth() !== nextDate.getMonth();
    const isQuarterEnd = isMonthEnd && (date.getMonth() + 1) % 3 === 0;
    const isYearEnd = isMonthEnd && date.getMonth() === 11;

    // 閾值：任一資產實際比例偏離目標超過 5 個百分點（與選項標籤「閾值（5%）」一致）
    const isDrifted = () => validAssets.some((asset) => {
      const weight = (holdings[asset.symbol] * alignedPrices[asset.symbol][i].close / total) * 100;
      return Math.abs(weight - asset.target) > 5;
    });

    const doRebalance =
      (rebalance === "monthly" && isMonthEnd) ||
      (rebalance === "quarterly" && isQuarterEnd) ||
      (rebalance === "yearly" && isYearEnd) ||
      (rebalance === "threshold" && isDrifted());

    if (doRebalance && i < sortedDates.length - 1) {
      for (let asset of validAssets) {
        const price = alignedPrices[asset.symbol][i].close;
        holdings[asset.symbol] = (total * (asset.target / 100)) / price;
      }
    }
  });

  return { portfolioValues, dates: sortedDates };
}


/** 執行回測 */

// 年度報酬率圖表設定
const annualReturnsData = ref([]);
const highBarOptions = computed(() => {
  const { axis: axisColor, grid: gridColor, tooltipBg, tooltipFg, legend: legendColor } =
    chartPalette.value
  return {
    chart: { type: 'column', backgroundColor: 'transparent' },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      categories: annualReturnsData.value.map(r => r.year.toString()),
      title: { text: t('year'), style: { color: axisColor } },
      labels: { style: { fontWeight: '600', color: legendColor } },
    },
    yAxis: {
      labels: {
        formatter: function () { return `${(this.value * 100).toFixed(1)}%` },
        style: { color: axisColor },
      },
      title: { text: t('annualReturnChart'), style: { color: axisColor } },
      gridLineColor: gridColor,
    },
    tooltip: {
      formatter: function () { return `<b>${this.x}</b>: ${(this.y * 100).toFixed(2)}%` },
      backgroundColor: tooltipBg,
      style: { color: tooltipFg },
    },
    plotOptions: {
      column: { borderRadius: 4 },
    },
    series: [{
      type: 'column',
      name: t('annualReturnChart'),
      data: annualReturnsData.value.map(r => ({
        y: r.value,
        color: r.value >= 0 ? '#2563EB' : '#DC2626',
      })),
    }],
  }
});


// 年報酬率計算
function calculateAnnualReturns(portfolioValues, dates) {
  if (!portfolioValues?.length || !dates?.length) return [];

  const yearly = {};
  for (let i = 1; i < portfolioValues.length; i++) {
    const year = new Date(dates[i]).getFullYear();
    const prev = portfolioValues[i - 1];
    const curr = portfolioValues[i];
    const dailyReturn = (curr - prev) / prev;

    if (!yearly[year]) yearly[year] = [];
    yearly[year].push(dailyReturn);
  }

  const results = Object.entries(yearly).map(([year, dailyReturns]) => {
    const total = dailyReturns.reduce((acc, r) => acc * (1 + r), 1) - 1;
    return { year: Number(year), value: total };
  });

  return results;
}


// 原有 runBacktest() 內修改部分
async function runBacktest() {
  if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
  isLoading.value = true;
  try {
    const allocation = await api.get(
      `/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`
    );

    // 取得價格(adjClose)資料
    const prices = await api.get(
      `/api/yahoo/allocation-chart?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}&period1=${toIsoDate(form.value.startDate)}&period2=${toIsoDate(form.value.endDate)}`
    );

    const { portfolioValues, dates } = simulateBacktest(
      allocation,
      prices,
      form.value
    );

    const initial = portfolioValues[0];
    const final = portfolioValues[portfolioValues.length - 1];
    const cumulativeReturn = (final - initial) / initial;
    const totalDays = (new Date(form.value.endDate) - new Date(form.value.startDate)) / (1000 * 60 * 60 * 24);
    const annualizedReturn = Math.pow(1 + cumulativeReturn, 365 / totalDays) - 1;
    const sharpeRatio = calculateSharpeRatio(portfolioValues);
    const maxDrawdown = calculateMaxDrawdown(portfolioValues);
    const volatility = calculateVolatility(portfolioValues);
    const winRate = calculateWinRate(portfolioValues);

    result.value = {
      cumulativeReturn,
      annualizedReturn,
      sharpeRatio,
      maxDrawdown,
      volatility,
      winRate,
    };

    // 更新走勢圖
    lineData.value = [
      {
        name: t('totalPrice'),
        data: dates.map((d, i) => [new Date(d).getTime(), portfolioValues[i]]),
      },
    ];

    annualReturnsData.value = calculateAnnualReturns(portfolioValues, dates);

  } catch (e) {
    if (e?.message) {
      toast.error(t('allocationNoSettings'));
    }

  } finally {
    isLoading.value = false;
  }
}
</script>
<style scoped>
/* 指標格：三欄網格，格與格之間用細線分隔（沿用 set-group 線條） */
.bt-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
}
@media (max-width: 768px) {
  .bt-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.bt-metric {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 1rem;
  /* ponytail: 每格畫右、下線，外框多出的線被 .set-group__body 的 overflow 與 -1px 位移吃掉 */
  border-right: 1px solid var(--p-content-border-color);
  border-bottom: 1px solid var(--p-content-border-color);
  margin: 0 -1px -1px 0;
}
.bt-metric__label {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--p-text-muted-color);
}
.bt-metric__label i {
  font-size: 0.75rem;
  cursor: help;
}
.bt-metric__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--p-text-color);
  font-variant-numeric: tabular-nums;
}
</style>
