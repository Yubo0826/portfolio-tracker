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
          placeholder="Select a strategy" 
          class="w-full md:w-56" 
        />
      </div>
    </div>

    <!-- 執行按鈕 -->
    <Button label="開始回測" @click="runBacktest" class="mb-4" />

    <!-- 結果 -->
    <Card v-if="result">
      <template #title>回測結果</template>
      <template #content>
        <p><strong>累積報酬率:</strong> {{ (result.cumulativeReturn * 100).toFixed(2) }}%</p>
        <p><strong>年化報酬率:</strong> {{ (result.annualizedReturn * 100).toFixed(2) }}%</p>
        <p><strong>Sharpe Ratio:</strong> {{ result.sharpeRatio.toFixed(2) }}</p>
      </template>
    </Card>

    
  </div>
</template>

<script setup>
import { ref } from "vue";
import api from "@/utils/api"; // 你現有的 api wrapper
import { useAuthStore } from "@/stores/auth";
import { usePortfolioStore } from "@/stores/portfolio";

const auth = useAuthStore();
const portfolioStore = usePortfolioStore();

const form = ref({
  startDate: new Date("2024-01-01"),
  endDate: new Date("2025-01-01"),
  initialCapital: 100000,
  rebalance: "monthly",
});

const rebalanceOptions = [
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
  { label: "Threshold (5%)", value: "threshold" },
];

const result = ref(null);
const isLoading = ref(false);

/** 計算 Sharpe Ratio */
function calculateSharpeRatio(portfolioValues, riskFreeRate = 0) {
  if (portfolioValues.length < 2) return 0;
  const dailyReturns = [];
  for (let i = 1; i < portfolioValues.length; i++) {
    const ret = (portfolioValues[i] - portfolioValues[i - 1]) / portfolioValues[i - 1];
    dailyReturns.push(ret);
  }
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const excessReturn = avgReturn - riskFreeRate / 252;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    (dailyReturns.length - 1);
  const stdDev = Math.sqrt(variance);
  return (excessReturn / stdDev) * Math.sqrt(252);
}

/** 簡易回測模擬器 */
function simulateBacktest(allocation, prices, { initialCapital, rebalance }) {
  // 1. 過濾 allocation，只保留在 prices 有資料的股票
  const validAssets = allocation.filter(asset => prices[asset.symbol]);
  if (validAssets.length === 0) {
    console.warn("simulateBacktest: no matching price data found");
    return [];
  }

  // 2. 取得共有的日期序列（假設每支股票日期相同）
  const dates = prices[validAssets[0].symbol].map(p => new Date(p.date));

  let portfolioValues = [];
  let holdings = {};

  // 3. 初始持倉（根據 target 比例）
  for (let asset of validAssets) {
    const weight = asset.target / 100;
    const startPrice = prices[asset.symbol][0].close;
    holdings[asset.symbol] = (initialCapital * weight) / startPrice;
  }

  // 4. 逐日模擬
  dates.forEach((date, i) => {
    // 計算當天總資產
    let total = 0;
    for (let asset of validAssets) {
      const priceData = prices[asset.symbol][i];
      if (!priceData) continue; // 若資料缺失就跳過
      total += holdings[asset.symbol] * priceData.close;
    }

    portfolioValues.push(total);

    // ----- 再平衡邏輯 -----
    const doRebalance =
      (rebalance === "monthly" && date.getDate() === 1) ||
      (rebalance === "quarterly" &&
        date.getMonth() % 3 === 0 &&
        date.getDate() === 1) ||
      (rebalance === "yearly" &&
        date.getMonth() === 0 &&
        date.getDate() === 1);

    if (rebalance === "threshold") {
      // 檢查偏離超過 5%
      const weightsNow = {};
      for (let asset of validAssets) {
        const price = prices[asset.symbol][i].close;
        weightsNow[asset.symbol] = (holdings[asset.symbol] * price) / total;
      }
      const needRebalance = validAssets.some(
        asset => Math.abs(weightsNow[asset.symbol] - asset.target / 100) > 0.05
      );
      if (needRebalance) rebalancePortfolio(validAssets, holdings, prices, i, total);
    } else if (doRebalance) {
      rebalancePortfolio(validAssets, holdings, prices, i, total);
    }
  });

  return portfolioValues;
}

/** 再平衡執行：根據 target 權重重新計算持股數 */
function rebalancePortfolio(validAssets, holdings, prices, i, total) {
  for (let asset of validAssets) {
    const price = prices[asset.symbol][i].close;
    holdings[asset.symbol] = (total * (asset.target / 100)) / price;
  }
}


/** 執行回測 */
async function runBacktest() {
  if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
  isLoading.value = true;
  try {
    // 1. 拿投資組合配置
    const allocation = await api.get(
      `http://localhost:3000/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`
    );

    console.log("Allocation:", allocation);

    // 2. 拿歷史股價
    const prices = await api.get(
      `http://localhost:3000/api/yahoo/allocation-chart?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}&period1=${form.value.startDate.toISOString().split("T")[0]}&period2=${form.value.endDate.toISOString().split("T")[0]}`
    );

    console.log("Prices:", prices);

    // 假設回傳格式:
    // prices = { "AAPL": [{date:"2024-01-01", close:192}, ...], "MSFT": [...] }

    // 3. 模擬回測
    const portfolioValues = simulateBacktest(allocation, prices, form.value);

    // 4. 計算績效
    const initial = portfolioValues[0];
    const final = portfolioValues[portfolioValues.length - 1];
    const cumulativeReturn = (final - initial) / initial;
    const annualizedReturn = Math.pow(1 + cumulativeReturn, 252 / portfolioValues.length) - 1;
    const sharpeRatio = calculateSharpeRatio(portfolioValues);

    result.value = { cumulativeReturn, annualizedReturn, sharpeRatio };
  } catch (e) {
    console.error("回測失敗:", e);
  } finally {
    isLoading.value = false;
  }
}
</script>
