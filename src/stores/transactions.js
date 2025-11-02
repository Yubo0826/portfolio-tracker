// src/stores/transactions.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/utils/api.js';
import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';
import { useHoldingsStore } from '@/stores/holdings';

export const useTransactionsStore = defineStore('transactions', () => {
  const list = ref([]);
  const isLoading = ref(false);

  const auth = useAuthStore();
  const portfolioStore = usePortfolioStore();
  const holdingsStore = useHoldingsStore();

  const uid = computed(() => auth.user?.uid || null);
  const portfolioId = computed(() => portfolioStore.currentPortfolio?.id || null);

  const setTransactions = (data = []) => {
    list.value = data.map((item) => ({
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

  const fetchTransactions = async () => {
    if (!uid.value || !portfolioId.value) return;
    try {
      isLoading.value = true;
      const data = await api.get(
        `/api/transactions?uid=${uid.value}&portfolio_id=${portfolioId.value}`
      );
      setTransactions(data.transactions);
      holdingsStore.fetchHoldings();
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
    const result = await api.delete(`/api/transactions`, payload);
    // 後端回傳最新清單時，直接覆蓋；若沒有就本地移除
    if (result?.transactions) {
      setTransactions(result.transactions);
      holdingsStore.fetchHoldings();
    } else {
      list.value = list.value.filter((t) => !ids.includes(t.id));
    }
  };

  const canSell = (symbol, shares) => {
    const h = holdingsStore.holdings.find((x) => x.symbol === String(symbol).toUpperCase());
    return (h?.total_shares || 0) >= (Number(shares) || 0);
  };

  const getTransactionById = (id) => {
    return list.value.find((t) => t.id === id) || null;
  };

  // 儲存單一交易紀錄
  const saveTransaction = async ({ id = null, form, portfolioId = portfolioId.value }) => {
    if (!uid.value || !portfolioId) {
      throw new Error('No user or portfolio selected');
    }

    const payload = {
      uid: uid.value,
      portfolio_id: portfolioId,
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

    console.log('saveTransaction payload', payload);

    let result;
    if (id) {
      result = await api.put(`/api/transactions/${id}`, payload);
    } else {
      result = await api.post(`/api/transactions`, payload);
    }

    // 後端回傳最新 transactions / holdings
    if (result?.transactions) setTransactions(result.transactions);
    holdingsStore.fetchHoldings();

    return result;
  };

  // 儲存多筆(批次匯入)交易紀錄
  const saveTransactionBulk = async (transactions = [], portfolioId = portfolioId.value) => {
    console.log('saveTransactionBulk', transactions, portfolioId);
    if (!transactions.length || !uid.value || !portfolioId) {
      throw new Error('No user or portfolio selected');
    }

    const payload = {
      uid: uid.value,
      portfolio_id: portfolioId,
      transactions: transactions.map((form) => ({
        symbol: String(form.symbol || '').toUpperCase(),
        name: form.name || '',
        asset_type: form.assetType || '',
        shares: Number(form.shares) || 0,
        fee: Number(form.fee) || 0,
        price: Number(form.price),
        transaction_type: form.transactionType, // 'buy' | 'sell'
        transaction_date: form.date instanceof Date
          ? form.date.toISOString().split('T')[0]
          : form.date, // 允許事先就是 'YYYY-MM-DD'
      })),
    };

    console.log('saveTransactionBulk payload', payload);

    isLoading.value = true;
    const result = await api.post(`/api/transactions/bulk`, payload);

    // 後端回傳最新 transactions / holdings
    if (result?.transactions) setTransactions(result.transactions);
    holdingsStore.fetchHoldings();
    toast.success(t('importedSuccess'));
    return result;
  }

  const searchPrice = async (symbol, dateYYYYMMDD) => {
    if (!symbol || !dateYYYYMMDD) return null;
    const nextDay = new Date(new Date(dateYYYYMMDD).getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    try {
      const data = await api.get(
        `/api/yahoo/chart/?symbol=${symbol}&period1=${dateYYYYMMDD}&period2=${nextDay}`
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
    list,
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
    saveTransactionBulk,
    searchPrice,
  };
});
