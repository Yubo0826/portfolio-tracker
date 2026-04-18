import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTransactionsStore } from '../transactions'
import { useAuthStore } from '../auth'
import { usePortfolioStore } from '../portfolio'
import { useHoldingsStore } from '../holdings'
import { useCashFlowStore } from '../cashflow'
import api from '@/utils/api'
import { mockUser, mockPortfolio } from '@/utils/test-helpers'

// Mock API module
vi.mock('@/utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}))

// Mock toast composable
vi.mock('@/composables/toast', () => ({
  success: vi.fn(),
  error: vi.fn(),
}))

describe('Transactions Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // 設置基本的 auth 和 portfolio 狀態
    const authStore = useAuthStore()
    const portfolioStore = usePortfolioStore()
    
    authStore.user = mockUser()
    portfolioStore.currentPortfolio = mockPortfolio({ id: 'portfolio-1', name: 'Test Portfolio' })
  })

  describe('fetchTransactions', () => {
    it('應該成功獲取交易記錄', async () => {
      const store = useTransactionsStore()
      
      const mockResponse = {
        transactions: [
          {
            id: 'tx-1',
            symbol: 'AAPL',
            name: 'Apple',
            assetType: 'stock',
            price: '150',
            fee: '10',
            shares: '100',
            transaction_type: 'buy',
            transaction_date: '2025-01-15T00:00:00Z'
          }
        ]
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await store.fetchTransactions()

      expect(api.get).toHaveBeenCalledWith(
        '/api/transactions?uid=demo-user&portfolio_id=portfolio-1'
      )
      expect(store.list).toHaveLength(1)
      expect(store.isLoading).toBe(false)
    })

    it('當沒有 uid 時不應該發送請求', async () => {
      const authStore = useAuthStore()
      authStore.user = null

      const store = useTransactionsStore()
      await store.fetchTransactions()

      expect(api.get).not.toHaveBeenCalled()
    })

    it('當沒有 portfolioId 時不應該發送請求', async () => {
      const portfolioStore = usePortfolioStore()
      portfolioStore.currentPortfolio = null

      const store = useTransactionsStore()
      await store.fetchTransactions()

      expect(api.get).not.toHaveBeenCalled()
    })

    it('應該設置 loading 狀態', async () => {
      const store = useTransactionsStore()
      
      vi.mocked(api.get).mockImplementation(() => {
        expect(store.isLoading).toBe(true)
        return Promise.resolve({ transactions: [] })
      })

      await store.fetchTransactions()
      expect(store.isLoading).toBe(false)
    })

    it('應該在成功後觸發 holdings 更新', async () => {
      const store = useTransactionsStore()
      const holdingsStore = useHoldingsStore()
      
      vi.spyOn(holdingsStore, 'fetchHoldings').mockResolvedValue()
      vi.mocked(api.get).mockResolvedValue({ transactions: [] })

      await store.fetchTransactions()

      expect(holdingsStore.fetchHoldings).toHaveBeenCalled()
    })
  })

  describe('deleteTransactions', () => {
    it('應該成功刪除交易記錄', async () => {
      const store = useTransactionsStore()
      
      store.list = [
        {
          id: 'tx-1',
          symbol: 'AAPL',
          name: 'Apple',
          assetType: 'stock',
          price: 150,
          fee: 10,
          shares: 100,
          transactionType: 'buy',
          date: '2025-01-15'
        },
        {
          id: 'tx-2',
          symbol: 'GOOGL',
          name: 'Google',
          assetType: 'stock',
          price: 120,
          fee: 5,
          shares: 50,
          transactionType: 'buy',
          date: '2025-01-16'
        }
      ]

      const mockResponse = {
        transactions: [
          {
            id: 'tx-2',
            symbol: 'GOOGL',
            name: 'Google',
            assetType: 'stock',
            price: '120',
            fee: '5',
            shares: '50',
            transaction_type: 'buy',
            transaction_date: '2025-01-16T00:00:00Z'
          }
        ]
      }

      vi.mocked(api.delete).mockResolvedValue(mockResponse)

      const holdingsStore = useHoldingsStore()
      vi.spyOn(holdingsStore, 'fetchHoldings').mockResolvedValue()

      await store.deleteTransactions(['tx-1'])

      expect(api.delete).toHaveBeenCalledWith('/api/transactions', {
        uid: 'demo-user',
        portfolio_id: 'portfolio-1',
        ids: ['tx-1']
      })
      expect(store.list).toHaveLength(1)
      expect(store.list[0].id).toBe('tx-2')
      expect(holdingsStore.fetchHoldings).toHaveBeenCalled()
    })

    it('應該在後端不返回 transactions 時本地移除', async () => {
      const store = useTransactionsStore()
      
      store.list = [
        { id: 'tx-1', symbol: 'AAPL', name: 'Apple', assetType: 'stock', price: 150, fee: 10, shares: 100, transactionType: 'buy', date: '2025-01-15' },
        { id: 'tx-2', symbol: 'GOOGL', name: 'Google', assetType: 'stock', price: 120, fee: 5, shares: 50, transactionType: 'buy', date: '2025-01-16' }
      ]

      vi.mocked(api.delete).mockResolvedValue({ success: true })

      await store.deleteTransactions(['tx-1'])

      expect(store.list).toHaveLength(1)
      expect(store.list[0].id).toBe('tx-2')
    })

    it('當 ids 為空時不應該發送請求', async () => {
      const store = useTransactionsStore()
      await store.deleteTransactions([])
      expect(api.delete).not.toHaveBeenCalled()
    })

    it('應該能刪除多筆交易', async () => {
      const store = useTransactionsStore()
      
      store.list = [
        { id: 'tx-1', symbol: 'AAPL', name: 'Apple', assetType: 'stock', price: 150, fee: 10, shares: 100, transactionType: 'buy', date: '2025-01-15' },
        { id: 'tx-2', symbol: 'GOOGL', name: 'Google', assetType: 'stock', price: 120, fee: 5, shares: 50, transactionType: 'buy', date: '2025-01-16' },
        { id: 'tx-3', symbol: 'TSLA', name: 'Tesla', assetType: 'stock', price: 200, fee: 8, shares: 25, transactionType: 'buy', date: '2025-01-17' }
      ]

      vi.mocked(api.delete).mockResolvedValue({ success: true })

      await store.deleteTransactions(['tx-1', 'tx-2'])

      expect(store.list).toHaveLength(1)
      expect(store.list[0].id).toBe('tx-3')
    })
  })

  describe('canSell', () => {
    it('應該在持股足夠時返回 true', () => {
      const store = useTransactionsStore()
      const holdingsStore = useHoldingsStore()
      
      holdingsStore.list = [
        { symbol: 'AAPL', shares: 100, avgCost: 150, currentPrice: 180, target: 50 }
      ]

      expect(store.canSell('AAPL', 50)).toBe(true)
      expect(store.canSell('AAPL', 100)).toBe(true)
    })

    it('應該在持股不足時返回 false', () => {
      const store = useTransactionsStore()
      const holdingsStore = useHoldingsStore()
      
      holdingsStore.list = [
        { symbol: 'AAPL', shares: 100, avgCost: 150, currentPrice: 180, target: 50 }
      ]

      expect(store.canSell('AAPL', 150)).toBe(false)
    })

    it('應該在沒有該股票時返回 false', () => {
      const store = useTransactionsStore()
      const holdingsStore = useHoldingsStore()
      
      holdingsStore.list = [
        { symbol: 'AAPL', shares: 100, avgCost: 150, currentPrice: 180, target: 50 }
      ]

      expect(store.canSell('GOOGL', 10)).toBe(false)
    })

    it('應該忽略大小寫', () => {
      const store = useTransactionsStore()
      const holdingsStore = useHoldingsStore()
      
      holdingsStore.list = [
        { symbol: 'AAPL', shares: 100, avgCost: 150, currentPrice: 180, target: 50 }
      ]

      expect(store.canSell('aapl', 50)).toBe(true)
    })
  })

  describe('getTransactionById', () => {
    it('應該找到指定的交易', () => {
      const store = useTransactionsStore()
      
      store.list = [
        { id: 'tx-1', symbol: 'AAPL', name: 'Apple', assetType: 'stock', price: 150, fee: 10, shares: 100, transactionType: 'buy', date: '2025-01-15' },
        { id: 'tx-2', symbol: 'GOOGL', name: 'Google', assetType: 'stock', price: 120, fee: 5, shares: 50, transactionType: 'buy', date: '2025-01-16' }
      ]

      const transaction = store.getTransactionById('tx-1')

      expect(transaction).toBeDefined()
      expect(transaction?.symbol).toBe('AAPL')
    })

    it('找不到時應該返回 null', () => {
      const store = useTransactionsStore()
      
      store.list = [
        { id: 'tx-1', symbol: 'AAPL', name: 'Apple', assetType: 'stock', price: 150, fee: 10, shares: 100, transactionType: 'buy', date: '2025-01-15' }
      ]

      const transaction = store.getTransactionById('tx-999')

      expect(transaction).toBeNull()
    })
  })

  describe('saveTransaction', () => {
    it('應該成功新增交易（POST）', async () => {
      const store = useTransactionsStore()
      const holdingsStore = useHoldingsStore()
      
      vi.spyOn(holdingsStore, 'fetchHoldings').mockResolvedValue()

      const mockResponse = {
        transactions: [
          {
            id: 'tx-new',
            symbol: 'AAPL',
            name: 'Apple Inc.',
            assetType: 'stock',
            price: '150',
            fee: '10',
            shares: '100',
            transaction_type: 'buy',
            transaction_date: '2025-01-15T00:00:00Z'
          }
        ]
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const form = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        assetType: 'stock',
        shares: 100,
        fee: 10,
        price: 150,
        operation: 'buy',
        date: '2025-01-15'
      }

      await store.saveTransaction({ form })

      expect(api.post).toHaveBeenCalledWith('/api/transactions', {
        uid: 'demo-user',
        portfolio_id: 'portfolio-1',
        cash_account_id: null,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        asset_type: 'stock',
        shares: 100,
        fee: 10,
        price: 150,
        transaction_type: 'buy',
        transaction_date: '2025-01-15'
      })
      expect(store.list).toHaveLength(1)
      expect(holdingsStore.fetchHoldings).toHaveBeenCalled()
    })

    it('應該成功更新交易（PUT）', async () => {
      const store = useTransactionsStore()
      const holdingsStore = useHoldingsStore()
      
      vi.spyOn(holdingsStore, 'fetchHoldings').mockResolvedValue()

      const mockResponse = {
        transactions: [
          {
            id: 'tx-1',
            symbol: 'AAPL',
            name: 'Apple Inc.',
            assetType: 'stock',
            price: '160',
            fee: '12',
            shares: '120',
            transaction_type: 'buy',
            transaction_date: '2025-01-15T00:00:00Z'
          }
        ]
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const form = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        assetType: 'stock',
        shares: 120,
        fee: 12,
        price: 160,
        operation: 'buy',
        date: '2025-01-15'
      }

      await store.saveTransaction({ id: 'tx-1', form })

      expect(api.put).toHaveBeenCalledWith('/api/transactions/tx-1', expect.objectContaining({
        shares: 120,
        price: 160,
        fee: 12
      }))
    })

    it('應該將 Date 對象轉換為 YYYY-MM-DD 格式', async () => {
      const store = useTransactionsStore()
      
      vi.mocked(api.post).mockResolvedValue({ transactions: [] })

      const form = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        assetType: 'stock',
        shares: 100,
        fee: 10,
        price: 150,
        operation: 'buy',
        date: new Date('2025-01-15T10:30:00Z')
      }

      await store.saveTransaction({ form })

      expect(api.post).toHaveBeenCalledWith('/api/transactions', expect.objectContaining({
        transaction_date: '2025-01-15'
      }))
    })

    it('應該將 symbol 轉為大寫', async () => {
      const store = useTransactionsStore()
      
      vi.mocked(api.post).mockResolvedValue({ transactions: [] })

      const form = {
        symbol: 'aapl',
        name: 'Apple Inc.',
        assetType: 'stock',
        shares: 100,
        fee: 10,
        price: 150,
        operation: 'buy',
        date: '2025-01-15'
      }

      await store.saveTransaction({ form })

      expect(api.post).toHaveBeenCalledWith('/api/transactions', expect.objectContaining({
        symbol: 'AAPL'
      }))
    })

    it('應該在有 accountId 時更新現金帳戶', async () => {
      const store = useTransactionsStore()
      const cashFlowStore = useCashFlowStore()
      
      vi.spyOn(cashFlowStore, 'fetchCashAccounts').mockResolvedValue()
      vi.mocked(api.post).mockResolvedValue({ transactions: [] })

      const form = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        assetType: 'stock',
        shares: 100,
        fee: 10,
        price: 150,
        operation: 'buy',
        date: '2025-01-15',
        accountId: 'acc-1'
      }

      await store.saveTransaction({ form })

      expect(cashFlowStore.fetchCashAccounts).toHaveBeenCalled()
    })

    it('沒有 uid 時應該拋出錯誤', async () => {
      const authStore = useAuthStore()
      authStore.user = null

      const store = useTransactionsStore()

      const form = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        assetType: 'stock',
        shares: 100,
        fee: 10,
        price: 150,
        operation: 'buy',
        date: '2025-01-15'
      }

      await expect(store.saveTransaction({ form })).rejects.toThrow('No user or portfolio selected')
    })
  })

  describe('saveTransactionBulk', () => {
    it('應該成功批次新增交易', async () => {
      const store = useTransactionsStore()
      const holdingsStore = useHoldingsStore()
      
      vi.spyOn(holdingsStore, 'fetchHoldings').mockResolvedValue()
      vi.spyOn(holdingsStore, 'refreshPrices').mockResolvedValue()

      const mockResponse = {
        transactions: [
          {
            id: 'tx-1',
            symbol: 'AAPL',
            name: 'Apple',
            assetType: 'stock',
            price: '150',
            fee: '10',
            shares: '100',
            transaction_type: 'buy',
            transaction_date: '2025-01-15T00:00:00Z'
          },
          {
            id: 'tx-2',
            symbol: 'GOOGL',
            name: 'Google',
            assetType: 'stock',
            price: '120',
            fee: '5',
            shares: '50',
            transaction_type: 'buy',
            transaction_date: '2025-01-16T00:00:00Z'
          }
        ]
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const transactions = [
        {
          symbol: 'AAPL',
          name: 'Apple',
          assetType: 'stock',
          shares: 100,
          fee: 10,
          price: 150,
          transactionType: 'buy',
          date: '2025-01-15'
        },
        {
          symbol: 'GOOGL',
          name: 'Google',
          assetType: 'stock',
          shares: 50,
          fee: 5,
          price: 120,
          transactionType: 'buy',
          date: '2025-01-16'
        }
      ]

      await store.saveTransactionBulk(transactions)

      expect(api.post).toHaveBeenCalledWith('/api/transactions/bulk', expect.objectContaining({
        uid: 'demo-user',
        portfolio_id: 'portfolio-1'
      }))
      
      const callPayload = vi.mocked(api.post).mock.calls[0][1]
      expect(callPayload.transactions).toHaveLength(2)
      expect(callPayload.transactions[0]).toMatchObject({ symbol: 'AAPL', shares: 100 })
      expect(callPayload.transactions[1]).toMatchObject({ symbol: 'GOOGL', shares: 50 })
      expect(store.list).toHaveLength(2)
      expect(holdingsStore.refreshPrices).toHaveBeenCalled()
      expect(holdingsStore.fetchHoldings).toHaveBeenCalled()
    })

    it('當有 accountId 時應該更新現金帳戶', async () => {
      const store = useTransactionsStore()
      const cashFlowStore = useCashFlowStore()
      
      vi.spyOn(cashFlowStore, 'fetchCashAccounts').mockResolvedValue()
      vi.mocked(api.post).mockResolvedValue({ transactions: [] })

      const transactions = [
        {
          symbol: 'AAPL',
          name: 'Apple',
          assetType: 'stock',
          shares: 100,
          fee: 10,
          price: 150,
          transactionType: 'buy',
          date: '2025-01-15',
          accountId: 'acc-1'
        }
      ]

      await store.saveTransactionBulk(transactions)

      expect(cashFlowStore.fetchCashAccounts).toHaveBeenCalled()
    })

    it('空數組時應該拋出錯誤', async () => {
      const store = useTransactionsStore()

      await expect(store.saveTransactionBulk([])).rejects.toThrow('No user or portfolio selected')
    })
  })

  describe('searchPrice', () => {
    it('應該成功獲取歷史價格', async () => {
      const store = useTransactionsStore()
      
      const mockResponse = {
        quotes: [{ close: 150.50 }]
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const price = await store.searchPrice('AAPL', '2025-01-15')

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/yahoo/chart/?symbol=AAPL&period1=2025-01-15&period2=2025-01-16')
      )
      expect(price).toBe(150.50)
    })

    it('沒有數據時應該返回 null', async () => {
      const store = useTransactionsStore()
      
      vi.mocked(api.get).mockResolvedValue({ quotes: [] })

      const price = await store.searchPrice('AAPL', '2025-01-15')

      expect(price).toBeNull()
    })

    it('API 錯誤時應該返回 null', async () => {
      const store = useTransactionsStore()
      
      vi.mocked(api.get).mockRejectedValue(new Error('API Error'))

      const price = await store.searchPrice('AAPL', '2025-01-15')

      expect(price).toBeNull()
    })

    it('參數為空時應該返回 null', async () => {
      const store = useTransactionsStore()

      expect(await store.searchPrice('', '2025-01-15')).toBeNull()
      expect(await store.searchPrice('AAPL', '')).toBeNull()
    })
  })

  describe('Computed Properties', () => {
    it('uid 應該從 authStore 獲取', () => {
      const store = useTransactionsStore()
      expect(store.uid).toBe('demo-user')

      const authStore = useAuthStore()
      authStore.user = null
      expect(store.uid).toBeNull()
    })

    it('portfolioId 應該從 portfolioStore 獲取', () => {
      const store = useTransactionsStore()
      expect(store.portfolioId).toBe('portfolio-1')

      const portfolioStore = usePortfolioStore()
      portfolioStore.currentPortfolio = null
      expect(store.portfolioId).toBeNull()
    })
  })
})
