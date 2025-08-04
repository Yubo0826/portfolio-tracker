<script setup>
import { ref, computed, onMounted } from 'vue';
import VueApexCharts from 'vue3-apexcharts';

const transactions = ref([]);
const quotes = ref([]); // 假設 quotes 是一個以 symbol 分群的物件 { AAPL: [...], TSLA: [...] }

const chartOptions = {
  chart: {
    type: 'line',
    zoom: { enabled: false }
  },
  xaxis: {
    type: 'datetime'
  },
  title: {
    text: '總資產走勢圖',
    align: 'center'
  }
};

const series = ref([]);

onMounted(() => {
  // 請自行載入 transactions.value 和 quotes.value
  
  const portfolioHistory = computePortfolioValue(transactions.value, quotes.value);
  series.value = [{
    name: '資產總值',
    data: portfolioHistory.map(d => [new Date(d.date).getTime(), d.value])
  }];
});

/**
 * 主邏輯：產生每日資產價值
 */
function computePortfolioValue(transactions, quotesBySymbol) {
  const historyMap = new Map(); // key: 日期, value: { date, holdings: {}, cash, value }

  let holdings = {};
  let cash = 0;

  const sortedTx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

  // 整理出所有用到的日期（交易日期 + quotes 日期）
  const allDates = new Set();
  Object.values(quotesBySymbol).forEach(quotes => {
    quotes.forEach(q => allDates.add(q.date.split('T')[0]));
  });

  sortedTx.forEach(tx => allDates.add(tx.date));
  const sortedDates = [...allDates].sort();

  for (const date of sortedDates) {
    // 處理今天的交易
    while (sortedTx.length && sortedTx[0].date <= date) {
      const tx = sortedTx.shift();
      const symbol = tx.symbol;

      if (!holdings[symbol]) holdings[symbol] = 0;

      const cost = tx.price * tx.shares + tx.fee;

      if (tx.transactionType === 'buy') {
        holdings[symbol] += tx.shares;
        cash -= cost;
      } else if (tx.transactionType === 'sell') {
        holdings[symbol] -= tx.shares;
        cash += tx.price * tx.shares - tx.fee;
      }
    }

    // 計算今天總資產價值
    let total = cash;
    for (const [symbol, shares] of Object.entries(holdings)) {
      if (shares <= 0) continue;
      const quote = quotesBySymbol[symbol]?.find(q => q.date.startsWith(date));
      if (quote) total += quote.adjclose * shares;
    }

    historyMap.set(date, { date, value: parseFloat(total.toFixed(2)) });
  }

  return Array.from(historyMap.values());
}
</script>

<template>
  <VueApexCharts type="line" height="400" :options="chartOptions" :series="series" />
</template>
