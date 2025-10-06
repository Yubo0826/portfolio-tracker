<template>
  <div class="p-6">
    <h2 class="text-xl font-bold mb-4">投資組合回測設定</h2>

    <!-- 設定表單 -->
    <div class="grid gap-4 mb-6 md:grid-cols-2">
      <div>
        <label class="font-semibold block mb-1">Start Date</label>
        <DatePicker
          v-model="form.startDate"
          :maxDate="new Date()"
          showIcon
          fluid
          iconDisplay="input"
          class="flex-auto"
          placeholder="交易的日期"
        />
      </div>
      <div>
        <label class="font-semibold block mb-1">End Date</label>
        <DatePicker
          v-model="form.endDate"
          :maxDate="new Date()"
          showIcon
          fluid
          iconDisplay="input"
          class="flex-auto"
          placeholder="交易的日期"
        />
      </div>
      <div>
        <label class="font-semibold block mb-1">Initial Capital</label>
        <InputNumber
          v-model="form.initialCapital"
          mode="currency"
          currency="USD"
          locale="en-US"
          :min="1000"
        />
      </div>
      <div>
        <label class="font-semibold block mb-1">Rebalance</label>
        <Select 
          v-model="form.rebalance" 
          :options="rebalanceOptions" 
          optionLabel="label" 
          optionValue="value"
          placeholder="Select a strategy" 
          class="w-full md:w-56" 
        />
      </div>
    </div>

    <!-- 執行按鈕 -->
    <Button label="開始回測" @click="runBacktest" :loading="isLoading" class="mb-4" />

    <!-- 結果 -->
    <Card v-if="result">
      <template #title>回測結果</template>
      <template #content>
        <div class="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <p><strong>累積報酬率:</strong> {{ (result.cumulativeReturn * 100).toFixed(2) }}%</p>
            <p><strong>年化報酬率:</strong> {{ (result.annualizedReturn * 100).toFixed(2) }}%</p>
            <p><strong>Sharpe Ratio:</strong> {{ result.sharpeRatio.toFixed(2) }}</p>
          </div>
          <div>
            <p><strong>最大回撤:</strong> {{ (result.maxDrawdown * 100).toFixed(2) }}%</p>
            <p><strong>波動率:</strong> {{ (result.volatility * 100).toFixed(2) }}%</p>
            <p><strong>勝率:</strong> {{ (result.winRate * 100).toFixed(2) }}%</p>
          </div>
        </div>

      </template>
    </Card>
    
    <!-- 資產走勢圖 -->
    <Card class="my-6" v-if="chartSeries.length">
      <template #title>資產走勢圖</template>
      <template #content>
        <p class="text-sm text-gray-500 mb-2">藍線代表投資組合總價值</p>
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
      <template #title>年度報酬率</template>
      <template #content>
        <p class="text-sm text-gray-500 mb-2">藍色代表正報酬，紅色代表負報酬</p>
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
import { useAuthStore } from "@/stores/auth";
import { usePortfolioStore } from "@/stores/portfolio";

const auth = useAuthStore();
const portfolioStore = usePortfolioStore();

const form = ref({
  startDate: new Date("2020-01-01"),
  endDate: new Date("2025-01-01"),
  initialCapital: 100000,
  rebalance: "quarterly",
});

const rebalanceOptions = [
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
  { label: "Threshold (5%)", value: "threshold" },
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

  const allDates = new Set();
  for (let symbol in prices) prices[symbol].forEach((p) => allDates.add(p.date));
  const sortedDates = Array.from(allDates).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  const alignedPrices = {};
  for (let symbol in prices) {
    const dailyMap = new Map(prices[symbol].map((p) => [p.date, p.close]));
    let lastPrice = prices[symbol][0].close;
    alignedPrices[symbol] = sortedDates.map((date) => {
      if (dailyMap.has(date)) lastPrice = dailyMap.get(date);
      return { date, close: lastPrice };
    });
  }

  let portfolioValues = [];
  let holdings = {};

  for (let asset of validAssets) {
    const weight = asset.target / 100;
    const startPrice = alignedPrices[asset.symbol][0].close;
    holdings[asset.symbol] = (initialCapital * weight) / startPrice;
  }

  sortedDates.forEach((dateStr, i) => {
    const date = new Date(dateStr);
    let total = 0;

    for (let asset of validAssets) {
      const price = alignedPrices[asset.symbol][i].close;
      total += holdings[asset.symbol] * price;
    }
    portfolioValues.push(total);

    const doRebalance =
      (rebalance === "monthly" && date.getDate() === 1) ||
      (rebalance === "quarterly" &&
        date.getMonth() % 3 === 0 &&
        date.getDate() === 1) ||
      (rebalance === "yearly" &&
        date.getMonth() === 0 &&
        date.getDate() === 1);

    if (rebalance === "threshold") {
      const weightsNow = {};
      for (let asset of validAssets) {
        const price = alignedPrices[asset.symbol][i].close;
        weightsNow[asset.symbol] = (holdings[asset.symbol] * price) / total;
      }
      const needRebalance = validAssets.some(
        (asset) =>
          Math.abs(weightsNow[asset.symbol] - asset.target / 100) > 0.05
      );
      if (needRebalance)
        rebalancePortfolio(validAssets, holdings, alignedPrices, i, total);
    } else if (doRebalance) {
      rebalancePortfolio(validAssets, holdings, alignedPrices, i, total);
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
      `http://localhost:3000/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`
    );
    const prices = await api.get(
      `http://localhost:3000/api/yahoo/allocation-chart?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}&period1=${form.value.startDate
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
    const annualizedReturn =
      Math.pow(1 + cumulativeReturn, 252 / portfolioValues.length) - 1;
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
