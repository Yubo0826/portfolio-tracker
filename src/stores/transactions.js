// src/stores/transactions.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api.js';
import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';

export const useTransactionsStore = defineStore('transactions', () => {
  const transactions = ref([]);
  const holdings = ref([]);
  const isLoading = ref(false);

  const auth = useAuthStore();
  const portfolioStore = usePortfolioStore();

  const uid = computed(() => auth.user?.uid || null);
  const portfolioId = computed(() => portfolioStore.currentPortfolio?.id || null);

  const setTransactions = (data = []) => {
    transactions.value = data.map((item) => ({
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      assetType: item.assetType,
      price: parseFloat(item.price) || 0,
      fee: parseFloat(item.fee) || 0,
      shares: parseInt(item.shares) || 0,
      transactionType: item.transaction_type,
      date: item.transaction_date?.split('T')[0] || item.date,
    }));
  };

  const setHoldings = (data = []) => {
    holdings.value = data.map((item) => ({
      symbol: item.symbol,
      name: item.name,
      total_shares: parseInt(item.total_shares) || 0,
    }));
  };

  const fetchTransactions = async () => {
    if (!uid.value || !portfolioId.value) return;
    try {
      isLoading.value = true;
      const data = await api.get(
        `http://localhost:3000/api/transactions?uid=${uid.value}&portfolio_id=${portfolioId.value}`
      );
      setTransactions(data.transactions);
      setHoldings(data.holdings);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteTransactions = async (ids = []) => {
    if (!ids.length || !uid.value || !portfolioId.value) return;
    const payload = {
      uid: uid.value,
      portfolio_id: portfolioId.value,
      ids,
    };
    const result = await api.delete(`http://localhost:3000/api/transactions`, payload);
    // 後端回傳最新清單時，直接覆蓋；若沒有就本地移除
    if (result?.transactions && result?.holdings) {
      setTransactions(result.transactions);
      setHoldings(result.holdings);
    } else {
      transactions.value = transactions.value.filter((t) => !ids.includes(t.id));
    }
  };

  const canSell = (symbol, shares) => {
    const h = holdings.value.find((x) => x.symbol === String(symbol).toUpperCase());
    return (h?.total_shares || 0) >= (Number(shares) || 0);
  };

  const getTransactionById = (id) => {
    return transactions.value.find((t) => t.id === id) || null;
  };

  const saveTransaction = async ({ id = null, form }) => {
    if (!uid.value || !portfolioId.value) {
      throw new Error('No user or portfolio selected');
    }

    const payload = {
      uid: uid.value,
      portfolio_id: portfolioId.value,
      symbol: String(form.symbol || '').toUpperCase(),
      name: form.name || '',
      asset_type: form.assetType || '',
      shares: Number(form.shares) || 0,
      fee: Number(form.fee) || 0,
      price: Number(form.price),
      transaction_type: form.operation, // 'buy' | 'sell'
      transaction_date: form.date instanceof Date
        ? form.date.toISOString().split('T')[0]
        : form.date, // 允許事先就是 'YYYY-MM-DD'
    };

    let result;
    if (id) {
      result = await api.put(`http://localhost:3000/api/transactions/${id}`, payload);
    } else {
      result = await api.post(`http://localhost:3000/api/transactions`, payload);
    }

    // 後端回傳最新 transactions / holdings
    if (result?.transactions) setTransactions(result.transactions);
    if (result?.holdings) setHoldings(result.holdings);

    return result;
  };

  const searchPrice = async (symbol, dateYYYYMMDD) => {
    if (!symbol || !dateYYYYMMDD) return null;
    const nextDay = new Date(new Date(dateYYYYMMDD).getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    try {
      const data = await api.get(
        `http://localhost:3000/api/yahoo/chart/?symbol=${symbol}&period1=${dateYYYYMMDD}&period2=${nextDay}`
      );
      if (data?.quotes?.length > 0) {
        return Number(data.quotes[0].close.toFixed(2));
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  return {
    /* state */
    transactions,
    holdings,
    isLoading,
    /* getters-like */
    uid,
    portfolioId,
    getTransactionById,
    canSell,
    /* actions */
    fetchTransactions,
    deleteTransactions,
    saveTransaction,
    searchPrice,
  };
});
