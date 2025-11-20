// src/stores/transactions.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/utils/api.js';
import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';
import { useHoldingsStore } from '@/stores/holdings';

export interface Transaction {
    id: string;
    symbol: string;
    name: string;
    assetType: string;
    price: number;
    fee: number;
    shares: number;
    transactionType: 'buy' | 'sell';
    date: string;
    // Backend fields might differ, mapped in setTransactions
    transaction_type?: string;
    transaction_date?: string;
}

export interface TransactionForm {
    symbol: string;
    name?: string;
    assetType?: string;
    shares: number | string;
    fee: number | string;
    price: number | string;
    operation?: 'buy' | 'sell'; // for single save
    transactionType?: 'buy' | 'sell'; // for bulk save
    date: Date | string;
}

export const useTransactionsStore = defineStore('transactions', () => {
    const list = ref<Transaction[]>([]);
    const isLoading = ref(false);

    const auth = useAuthStore();
    const portfolioStore = usePortfolioStore();
    const holdingsStore = useHoldingsStore();

    const uid = computed(() => auth.user?.uid || null);
    const portfolioId = computed(() => portfolioStore.currentPortfolio?.id || null);

    const setTransactions = (data: any[] = []) => {
        console.log('setTransactions', data);
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
            const data: any = await api.get(
                `/api/transactions?uid=${uid.value}&portfolio_id=${portfolioId.value}`
            );
            setTransactions(data.transactions);
            holdingsStore.fetchHoldings();
        } finally {
            isLoading.value = false;
        }
    };

    const deleteTransactions = async (ids: string[] = []) => {
        if (!ids.length || !uid.value || !portfolioId.value) return;
        const payload = {
            uid: uid.value,
            portfolio_id: portfolioId.value,
            ids,
        };
        const result: any = await api.delete(`/api/transactions`, payload);
        // 後端回傳最新清單時，直接覆蓋；若沒有就本地移除
        if (result?.transactions) {
            setTransactions(result.transactions);
            holdingsStore.fetchHoldings();
        } else {
            list.value = list.value.filter((t) => !ids.includes(t.id));
        }
    };

    const canSell = (symbol: string, shares: number | string) => {
        const h = holdingsStore.list.find((x) => x.symbol === String(symbol).toUpperCase());
        // Note: holdingsStore.list is Ref<Holding[]>, so .value access is needed if outside store, 
        // but inside store usage of other store's state:
        // Pinia stores return reactive state. holdingsStore.list is the state property.
        // Wait, in setup stores, `list` is a ref. When accessed via `useHoldingsStore()`, it is unwrapped?
        // Yes, Pinia unwraps refs in the returned object.
        // So `holdingsStore.list` is the array itself.

        // However, looking at holdings.ts: `return { list, ... }`. 
        // In Options API or when consuming, it's unwrapped. 
        // But inside another setup store? 
        // `const holdingsStore = useHoldingsStore()` returns the store instance.
        // Accessing `holdingsStore.list` gives the array (unwrapped).

        return (Number(h?.shares) || 0) >= (Number(shares) || 0);
    };

    const getTransactionById = (id: string) => {
        return list.value.find((t) => t.id === id) || null;
    };

    // 儲存單一交易紀錄
    const saveTransaction = async ({ id = null, form, portfolioId: pid = portfolioId.value }: { id?: string | null, form: TransactionForm, portfolioId?: string | null }) => {
        if (!uid.value || !pid) {
            throw new Error('No user or portfolio selected');
        }

        const payload = {
            uid: uid.value,
            portfolio_id: pid,
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

        let result: any;
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
    const saveTransactionBulk = async (transactions: TransactionForm[] = [], pid: string | null = portfolioId.value) => {
        console.log('saveTransactionBulk', transactions, pid);
        if (!transactions.length || !uid.value || !pid) {
            throw new Error('No user or portfolio selected');
        }

        const payload = {
            uid: uid.value,
            portfolio_id: pid,
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
        const result: any = await api.post(`/api/transactions/bulk`, payload);
        isLoading.value = false;

        // 後端回傳最新 transactions / holdings
        if (result?.transactions) setTransactions(result.transactions);
        await holdingsStore.refreshPrices();
        await holdingsStore.fetchHoldings();
        return result;
    }

    const searchPrice = async (symbol: string, dateYYYYMMDD: string) => {
        if (!symbol || !dateYYYYMMDD) return null;
        const nextDay = new Date(new Date(dateYYYYMMDD).getTime() + 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];
        try {
            const data: any = await api.get(
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
