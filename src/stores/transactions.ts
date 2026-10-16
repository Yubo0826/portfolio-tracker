// src/stores/transactions.js
import { defineStore } from 'pinia'
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import api from '@/utils/api.js'
import { toIsoDate } from '@/utils/portfolioMetrics'
import { currencyOfSymbol } from '@/utils/symbol'
import { fromQuoteCurrency, normalizeQuoteCurrency } from '@/utils/currency'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'
import { useHoldingsStore } from '@/stores/holdings'
import { useDividendsStore } from '@/stores/dividends'

interface TransactionData {
  id: string
  symbol: string
  name: string
  assetType: string
  price: string | number
  currency?: string
  fee: string | number
  shares: string | number
  transaction_type: string
  transaction_date?: string
  date?: string
  fx_rate?: string | number | null
}

interface Transaction {
  id: string
  symbol: string
  name: string
  assetType: string
  price: number
  currency: string
  fee: number
  shares: number
  transactionType: string
  date: string
  /** 成交當天的匯率：1 USD = fxRate currency；舊資料沒有這個值時為 null */
  fxRate: number | null
}

interface TransactionForm {
  symbol: string
  name: string
  assetType: string
  shares: number
  fee: number
  price: number
  currency: string
  operation: string
  date: Date | string
}

interface BulkTransactionForm {
  symbol: string
  name: string
  assetType: string
  shares: number
  fee: number
  price: number
  currency?: string
  transactionType: string
  date: Date | string
}

interface PriceSearchResult {
  price: number | null
  currency: string
}

interface SaveTransactionParams {
  id?: string | null
  form: TransactionForm
  portfolioId?: string | null
}

export const useTransactionsStore = defineStore('transactions', () => {
  const list: Ref<Transaction[]> = ref([])
  const isLoading: Ref<boolean> = ref(false)

  const auth = useAuthStore()
  const portfolioStore = usePortfolioStore()
  const holdingsStore = useHoldingsStore()
  const dividendsStore = useDividendsStore()

  const uid: ComputedRef<string | null> = computed(() => auth.user?.uid || null)
  const portfolioId: ComputedRef<string | null> = computed(() => portfolioStore.currentPortfolio?.id || null)

  const setTransactions = (data: TransactionData[] = []): void => {
    console.log('setTransactions', data)
    list.value = data.map((item) => ({
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      assetType: item.assetType,
      price: parseFloat(String(item.price)) || 0,
      currency: item.currency || 'USD',
      fee: parseFloat(String(item.fee)) || 0,
      shares: parseFloat(String(item.shares)) || 0,
      transactionType: item.transaction_type,
      date: item.transaction_date?.split('T')[0] || item.date || '',
      fxRate: Number(item.fx_rate) > 0 ? Number(item.fx_rate) : null,
    }))
  }

  const fetchTransactions = async (): Promise<void> => {
    if (!uid.value || !portfolioId.value) return
    try {
      isLoading.value = true
      const data = await api.get(
        `/api/transactions?uid=${uid.value}&portfolio_id=${portfolioId.value}`
      )
      setTransactions(data.transactions)
      holdingsStore.fetchHoldings()
    } finally {
      isLoading.value = false
    }
  }

  const deleteTransactions = async (ids: string[] = []): Promise<void> => {
    if (!ids.length || !uid.value || !portfolioId.value) return
    const payload = {
      uid: uid.value,
      portfolio_id: portfolioId.value,
      ids,
    }
    const result = await api.delete(`/api/transactions`, payload)
    // 後端回傳最新清單時，直接覆蓋；若沒有就本地移除
    if (result?.transactions) {
      setTransactions(result.transactions)
      holdingsStore.fetchHoldings()
    } else {
      list.value = list.value.filter((t) => !ids.includes(t.id))
    }
  }

  // 檢查是否能賣出這麼多股；編輯舊的賣出交易時，目前持股已扣過它，要先加回來
  // ponytail: 只看目前持股，不依日期重算；改日期造成的中途賣超由後端 computeHolding 把關
  const canSell = (symbol: string, shares: number, editingId: string | null = null): boolean => {
    const sym = String(symbol).toUpperCase()
    const h = holdingsStore.list.find((x: any) => x.symbol === sym)
    const old = editingId ? getTransactionById(editingId) : null
    const back = old?.transactionType === 'sell' && old.symbol === sym ? Number(old.shares) : 0
    return (h?.shares || 0) + back >= (Number(shares) || 0)
  }

  const getTransactionById = (id: string): Transaction | null => {
    return list.value.find((t) => t.id === id) || null
  }

  // 儲存單一交易紀錄
  const saveTransaction = async ({ 
    id = null, 
    form, 
    portfolioId: customPortfolioId = portfolioId.value || ''
  }: SaveTransactionParams): Promise<any> => {
    if (!uid.value || !customPortfolioId) {
      throw new Error('No user or portfolio selected')
    }

    const payload = {
      uid: uid.value,
      portfolio_id: Number(customPortfolioId),
      symbol: String(form.symbol || '').toUpperCase(),
      name: form.name || '',
      asset_type: form.assetType || '',
      shares: Number(form.shares) || 0,
      fee: Number(form.fee) || 0,
      price: Number(form.price),
      currency: form.currency || 'USD',
      transaction_type: form.operation, // 'buy' | 'sell'
      transaction_date: form.date instanceof Date
        ? toIsoDate(form.date)
        : form.date, // 允許事先就是 'YYYY-MM-DD'
    }

    console.log('saveTransaction payload', payload)

    let result: any
    if (id) {
      result = await api.put(`/api/transactions/${id}`, payload)
    } else {
      result = await api.post(`/api/transactions`, payload)
    }

    // 後端回傳最新 transactions / holdings
    if (result?.transactions) setTransactions(result.transactions)
    holdingsStore.fetchHoldings()

    return result
  }

  // 儲存多筆(批次匯入)交易紀錄
  const saveTransactionBulk = async (
    transactions: BulkTransactionForm[] = [], 
    customPortfolioId: string = portfolioId.value || ''
  ): Promise<any> => {
    console.log('saveTransactionBulk', transactions, customPortfolioId)
    if (!transactions.length || !uid.value || !customPortfolioId) {
      throw new Error('No user or portfolio selected')
    }

    const payload = {
      uid: uid.value,
      portfolio_id: Number(customPortfolioId),
      transactions: transactions.map((form) => ({
        symbol: String(form.symbol || '').toUpperCase(),
        name: form.name || '',
        asset_type: form.assetType || '',
        shares: Number(form.shares) || 0,
        fee: Number(form.fee) || 0,
        price: Number(form.price),
        currency: form.currency || 'USD',
        transaction_type: form.transactionType, // 'buy' | 'sell'
        transaction_date: form.date instanceof Date
          ? toIsoDate(form.date)
          : form.date, // 允許事先就是 'YYYY-MM-DD'
      })),
    }

    console.log('saveTransactionBulk payload', payload)

    isLoading.value = true
    const result = await api.post(`/api/transactions/bulk`, payload)
    isLoading.value = false

    // 後端回傳最新 transactions / holdings
    if (result?.transactions) setTransactions(result.transactions)
    await holdingsStore.refreshPrices()
    await holdingsStore.fetchHoldings()
    await dividendsStore.fetchDividends()

    return result
  }

  const searchPrice = async (symbol: string, dateYYYYMMDD: string): Promise<PriceSearchResult | null> => {
    if (!symbol || !dateYYYYMMDD) return null
    const nextDay = new Date(new Date(dateYYYYMMDD).getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    try {
      const data = await api.get(
        `/api/yahoo/chart/?symbol=${symbol}&period1=${dateYYYYMMDD}&period2=${nextDay}`
      )
      if (data?.quotes?.length > 0) {
        // 倫敦等交易所 Yahoo 回的是輔幣（GBp = 便士），要連同價格一起換回主幣
        const quoted = fromQuoteCurrency(data.quotes[0].close, data?.meta?.currency)
        return {
          price: quoted.amount == null ? null : Number(quoted.amount.toFixed(2)),
          currency: data?.meta?.currency ? quoted.currency : currencyOfSymbol(symbol),
        }
      }
    } catch (e) {
      // ignore
    }
    return {
      price: null,
      currency: currencyOfSymbol(symbol),
    }
  }

  /**
   * 取得標的的計價幣別。
   *
   * Yahoo 的 symbol 搜尋結果沒有 currency 欄位，只有 chart 的 meta 有，
   * 因此匯入時要另外查一次 chart（取最近區間，真正用到的只有 meta）。
   * 查不到時退回由代號推斷，只保證台股/美股正確。
   */
  const fetchSymbolCurrency = async (symbol: string): Promise<string> => {
    if (!symbol) return 'USD'
    const period2 = new Date()
    const period1 = new Date(period2.getTime() - 14 * 24 * 60 * 60 * 1000)
    try {
      const data = await api.get(
        `/api/yahoo/chart/?symbol=${encodeURIComponent(symbol)}` +
          `&period1=${period1.toISOString().split('T')[0]}&period2=${period2.toISOString().split('T')[0]}`
      )
      if (data?.meta?.currency) return normalizeQuoteCurrency(data.meta.currency)
    } catch (e) {
      // ignore，走下面的代號推斷
    }
    return currencyOfSymbol(symbol)
  }

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
    fetchSymbolCurrency,
    fetchTransactions,
    deleteTransactions,
    saveTransaction,
    saveTransactionBulk,
    searchPrice,
  }
})