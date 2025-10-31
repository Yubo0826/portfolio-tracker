<template>
  <div class="p-6">
    <h2 class="text-xl font-semibold mb-4">{{ $t('backtestTitle') }}</h2>

    <!-- 設定表單 -->
    <div class="grid gap-4 mb-6 md:grid-cols-2">
      <div>
        <label class="font-semibold block mb-1">{{ $t('startDate') }}</label>
        <DatePicker
          v-model="form.startDate"
          :maxDate="new Date()"
          showIcon
          fluid
          iconDisplay="input"
          class="flex-auto"
          :placeholder="$t('selectDatePlaceholder')"
        />
      </div>
      <div>
        <label class="font-semibold block mb-1">{{ $t('endDate') }}</label>
        <DatePicker
          v-model="form.endDate"
          :maxDate="new Date()"
          showIcon
          fluid
          iconDisplay="input"
          class="flex-auto"
          :placeholder="$t('selectDatePlaceholder')"
        />
      </div>
      <div>
        <label class="font-semibold block mb-1">{{ $t('initialCapital') }}</label>
        <InputNumber
          v-model="form.initialCapital"
          mode="currency"
          currency="USD"
          locale="en-US"
          :min="1000"
        />
      </div>
      <div>
        <label class="font-semibold block mb-1">{{ $t('rebalanceStrategy') }}</label>
        <Select 
          v-model="form.rebalance" 
          :options="rebalanceOptions" 
          optionLabel="label" 
          optionValue="value"
          :placeholder="$t('selectStrategy')" 
          class="w-full md:w-56" 
        />
      </div>
    </div>

    <!-- 執行按鈕 -->
    <div class="flex justify-center my-16">
      <Button :label="$t('runBacktest')" @click="runBacktest" :loading="isLoading" size="large" class="mb-4" />
    </div>

    <!-- 結果 -->
    <Card v-if="result">
      <template #title>{{ $t('resultTitle') }}</template>
      <template #content>
        <div class="grid md:grid-cols-2 gap-4 mb-6">
          <div class="result">
            <p>
              <span>{{ $t('cumulativeReturn') }}</span>
              {{ (result.cumulativeReturn * 100).toFixed(2) }}%
            </p>
            <p>
              <span>{{ $t('annualizedReturn') }}</span>
              {{ (result.annualizedReturn * 100).toFixed(2) }}%
            </p>
            <p>
              <span>
                Sharpe Ratio 
                <i class="pi pi-info-circle ml-1" v-tooltip.bottom="$t('sharpeRatioHint')"></i>
              </span>
              {{ result.sharpeRatio.toFixed(2) }}
            </p>
          </div>
          <div class="result">
            <p>
              <span>
                {{ $t('maxDrawdown') }}
                <i class="pi pi-info-circle ml-1" v-tooltip.bottom="$t('maxDrawdownHint')"></i>
              </span>
              {{ (result.maxDrawdown * 100).toFixed(2) }}%
            </p>
            <p>
              <span>
                {{ $t('volatility') }}
                <i class="pi pi-info-circle ml-1" v-tooltip.bottom="$t('volatilityHint')"></i>
              </span>
              {{ (result.volatility * 100).toFixed(2) }}%
            </p>
            <p>
              <span>
                {{ $t('winRate') }}
                <i class="pi pi-info-circle ml-1" v-tooltip.bottom="$t('winRateHint')"></i>
              </span>
              {{ (result.winRate * 100).toFixed(2) }}%
            </p>
          </div>
        </div>
      </template>
    </Card>

    <!-- 資產走勢圖 -->
    <Card class="my-6" v-if="chartSeries.length">
      <template #title>{{ $t('chartTitle') }}</template>
      <template #content>
        <p class="text-sm text-gray-500 mb-2">{{ $t('chartSubtitle') }}</p>
        <apexchart
          width="100%"
          height="400"
          type="line"
          :options="chartOptions"
          :series="chartSeries"
        />
      </template>
    </Card>

    <!-- 年度報酬率圖 -->
    <Card class="my-6" v-if="annualChartSeries.length">
      <template #title>{{ $t('annualReturnChart') }}</template>
      <template #content>
        <p class="text-sm text-gray-500 mb-2">{{ $t('annualReturnHint') }}</p>
        <apexchart
          width="100%"
          height="400"
          type="bar"
          :options="annualChartOptions"
          :series="annualChartSeries"
        />
      </template>
    </Card>
  </div>
</template>


<script setup>
import { ref } from "vue";
import api from "@/utils/api";
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { useAuthStore } from "@/stores/auth";
import { usePortfolioStore } from "@/stores/portfolio";

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
const isLoading = ref(false);
const chartSeries = ref([]);
const chartOptions = ref({
  chart: {
    type: "line",
    zoom: { enabled: false },
    toolbar: { show: false },
  },
  
  stroke: { curve: "smooth", width: 2 },
  xaxis: { type: "datetime", labels: { datetimeUTC: false } },
  yaxis: { labels: { formatter: (val) => `$${val.toFixed(0)}` } },
  tooltip: { x: { format: "yyyy-MM-dd" } },
  colors: ["#3B82F6", "#EF4444"],
});

/** 📊 Sharpe Ratio */
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

/** 📉 最大回撤 */
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

/** 📈 波動率 */
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

/** 🟢 勝率 */
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

  /** ✅ 1. 只取所有資產的共同日期 (intersection) */
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

    /** ✅ 2. 月末、季末、年末 再平衡判斷 */
    const nextDate = sortedDates[i + 1] ? new Date(sortedDates[i + 1]) : null;
    const isMonthEnd =
      !nextDate || date.getMonth() !== nextDate.getMonth();
    const isQuarterEnd = isMonthEnd && (date.getMonth() + 1) % 3 === 0;
    const isYearEnd = isMonthEnd && date.getMonth() === 11;

    const doRebalance =
      (rebalance === "monthly" && isMonthEnd) ||
      (rebalance === "quarterly" && isQuarterEnd) ||
      (rebalance === "yearly" && isYearEnd);

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

// 🔵 年度報酬率圖表設定（含負報酬顏色）
const annualChartSeries = ref([]);
const annualChartOptions = ref({
  chart: { type: "bar", height: 350, toolbar: { show: false } },
  plotOptions: {
    bar: {
      borderRadius: 4,
      horizontal: false,
      columnWidth: "55%",
      distributed: true, // 讓每個柱子能自訂顏色
    },
  },
  dataLabels: { enabled: false },
  xaxis: {
    title: { text: "Year" },
    categories: [],
    labels: { style: { fontWeight: 600 } },
  },
  yaxis: {
    labels: {
      formatter: (val) => `${(val * 100).toFixed(1)}%`,
    },
    title: { text: "Annual Return" },
  },
  tooltip: {
    y: {
      formatter: (val) => `${(val * 100).toFixed(2)}%`,
    },
  },
});


// 📅 年報酬率計算
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


// 🔵 原有 runBacktest() 內修改部分
async function runBacktest() {
  if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
  isLoading.value = true;
  try {
    const allocation = await api.get(
      `/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`
    );

    // 取得價格(adjClose)資料
    const prices = await api.get(
      `/api/yahoo/allocation-chart?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}&period1=${form.value.startDate
        .toISOString()
        .split("T")[0]}&period2=${form.value.endDate
        .toISOString()
        .split("T")[0]}`
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

    // 📊 更新走勢圖
    chartSeries.value = [
      {
        name: "Portfolio Value",
        data: dates.map((d, i) => [new Date(d).getTime(), portfolioValues[i]]),
      },
    ];

    const annualReturns = calculateAnnualReturns(portfolioValues, dates);
    annualChartSeries.value = [
      {
        name: "Annual Return",
        data: annualReturns.map((r) => r.value),
      },
    ];
    annualChartOptions.value.xaxis.categories = annualReturns.map((r) => r.year);

    // 根據正負報酬設定顏色
    annualChartOptions.value.colors = annualReturns.map((r) =>
      r.value >= 0 ? "#2563EB" : "#DC2626"
    );

  } catch (e) {
    console.error("回測失敗:", e);
  } finally {
    isLoading.value = false;
  }
}
</script>
<style scoped>
.result > p {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-left: 4px solid #6ce6b6;
  /* box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); */
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  padding-left: 1rem;
  padding-right: 1rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.result > p > span {
  display: flex;
  align-items: center;
  font-weight: 700;
}

.result > p > span i {
  font-size: 0.75rem;
  color: #6b7280;
  margin-left: 0.25rem;
}
</style>
