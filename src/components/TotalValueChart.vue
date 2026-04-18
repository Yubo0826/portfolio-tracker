<script setup>
import { ref, computed, onMounted } from 'vue';

const transactions = ref([]);
const quotes = ref([]); // 假設 quotes 是一個以 symbol 分群的物件 { AAPL: [...], TSLA: [...] }

const seriesData = ref([]);

const highChartOptions = computed(() => ({
  chart: { type: 'line', backgroundColor: 'transparent', animation: { duration: 300 } },
  title: { text: '總資產走勢圖', align: 'center' },
  credits: { enabled: false },
  legend: { enabled: false },
  xAxis: { type: 'datetime' },
  yAxis: {
    title: { text: '總資產' },
    labels: { formatter: function () { return `$${this.value.toFixed(2)}` } },
  },
  tooltip: { xDateFormat: '%Y/%m/%d', valuePrefix: '$', valueDecimals: 2 },
  series: [{ type: 'line', name: '資產總值', data: seriesData.value }],
}))

onMounted(() => {
  // 請自行載入 transactions.value 和 quotes.value
  const portfolioHistory = computePortfolioValue(transactions.value, quotes.value);
  seriesData.value = portfolioHistory.map(d => [new Date(d.date).getTime(), d.value]);
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
  <highcharts :options="highChartOptions" style="width: 100%; height: 400px;" />
</template>
