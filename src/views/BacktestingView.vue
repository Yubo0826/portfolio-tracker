<template>
  <div class="p-6">
    <h2 class="text-xl font-bold mb-4">投資組合回測設定</h2>

    <!-- 設定表單 -->
    <div class="grid gap-4 mb-6 md:grid-cols-2">
      <div>
        <label class="font-semibold block mb-1">Start Date</label>
        <Calendar v-model="form.startDate" dateFormat="yy-mm-dd" showIcon />
      </div>
      <div>
        <label class="font-semibold block mb-1">End Date</label>
        <Calendar v-model="form.endDate" dateFormat="yy-mm-dd" showIcon />
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
        <Dropdown
          v-model="form.rebalance"
          :options="rebalanceOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select strategy"
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
import { Card } from "primevue/card";
import { Calendar } from "primevue/calendar";
import { InputNumber } from "primevue/inputnumber";
import { Dropdown } from "primevue/dropdown";

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
  { label: "Threshold", value: "threshold" },
];

const result = ref(null);

// Sharpe Ratio 計算
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

// 模擬回測
function runBacktest() {
  console.log("回測設定:", form.value);

  // 假設模擬 portfolio values
  const portfolioValues = [form.value.initialCapital, 101200, 102800, 101500, 103000, 105000, 104500];

  const initial = portfolioValues[0];
  const final = portfolioValues[portfolioValues.length - 1];
  const cumulativeReturn = (final - initial) / initial;
  const annualizedReturn = Math.pow(1 + cumulativeReturn, 252 / portfolioValues.length) - 1;
  const sharpeRatio = calculateSharpeRatio(portfolioValues);

  result.value = {
    cumulativeReturn,
    annualizedReturn,
    sharpeRatio,
  };
}
</script>
