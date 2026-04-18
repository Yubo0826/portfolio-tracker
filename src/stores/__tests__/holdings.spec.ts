import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHoldingsStore } from '../holdings'
import { useAuthStore } from '../auth'
import { usePortfolioStore } from '../portfolio'
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

describe('Holdings Store', () => {
  beforeEach(() => {
    // 每次測試前重置 Pinia 和 mocks
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // 設置基本的 auth 和 portfolio 狀態
    const authStore = useAuthStore()
    const portfolioStore = usePortfolioStore()
    
    authStore.user = mockUser()
    portfolioStore.currentPortfolio = mockPortfolio()
  })

  describe('setHoldings', () => {
    it('應該正確轉換後端數據格式', () => {
      const store = useHoldingsStore()
      
      const mockData = [
        {
          id: '1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          asset_type: 'stock',
          total_shares: '100',
          avg_cost: '150.50',
          current_price: '180.00',
          target_percentage: '30',
          last_updated: '2025-01-01T00:00:00Z'
        }
      ]

      // 手動調用 setHoldings（通常由 fetchHoldings 內部調用）
      store.setHoldings(mockData)

      expect(store.list).toHaveLength(1)
      expect(store.list[0]).toMatchObject({
        id: '1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        shares: 100,
        avgCost: 150.50,
        currentPrice: 180.00,
        target: 30,
        totalCost: 15050, // 150.50 * 100
        currentValue: 18000, // 180 * 100
        totalProfit: 2950, // 18000 - 15050
      })
    })

    it('應該計算正確的獲利百分比', () => {
      const store = useHoldingsStore()
      
      const mockData = [
        {
          id: '1',
          symbol: 'TSLA',
          name: 'Tesla',
          asset_type: 'stock',
          total_shares: '50',
          avg_cost: '200',
          current_price: '250',
          target_percentage: '40',
          last_updated: '2025-01-01T00:00:00Z'
        }
      ]

      store.setHoldings(mockData)

      // 獲利率 = (250 - 200) / 200 * 100 = 25%
      expect(store.list[0].profitPercentage).toBe('25.00')
    })

    it('應該計算總市值和實際配置比例', () => {
      const store = useHoldingsStore()
      
      const mockData = [
        {
          id: '1',
          symbol: 'AAPL',
          name: 'Apple',
          asset_type: 'stock',
          total_shares: '100',
          avg_cost: '150',
          current_price: '180',
          target_percentage: '60',
          last_updated: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          symbol: 'GOOGL',
          name: 'Google',
          asset_type: 'stock',
          total_shares: '50',
          avg_cost: '100',
          current_price: '120',
          target_percentage: '40',
          last_updated: '2025-01-01T00:00:00Z'
        }
      ]

      store.setHoldings(mockData)

      // 總市值 = (180 * 100) + (120 * 50) = 18000 + 6000 = 24000
      expect(store.list.totalValue).toBe(24000)

      // AAPL 實際比例 = 18000 / 24000 = 75%
      expect(store.list[0].actualRatio).toBe('75.00')
      
      // GOOGL 實際比例 = 6000 / 24000 = 25%
      expect(store.list[1].actualRatio).toBe('25.00')
    })
  })

  describe('fetchHoldings', () => {
    it('應該成功獲取持倉數據', async () => {
      const store = useHoldingsStore()
      
      const mockResponse = [
        {
          id: '1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          asset_type: 'stock',
          total_shares: '100',
          avg_cost: '150',
          current_price: '180',
          target_percentage: '50',
          last_updated: '2025-01-01T00:00:00Z'
        }
      ]

      vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

      await store.fetchHoldings()

      expect(api.get).toHaveBeenCalledWith(
        '/api/holdings?uid=demo-user&portfolio_id=17'
      )
      expect(store.list).toHaveLength(1)
      expect(store.isLoading).toBe(false)
    })

    it('當沒有用戶時不應該調用 API', async () => {
      const authStore = useAuthStore()
      authStore.user = null

      const store = useHoldingsStore()
      await store.fetchHoldings()

      expect(api.get).not.toHaveBeenCalled()
    })

    it('應該處理 API 錯誤', async () => {
      const store = useHoldingsStore()
      
      vi.mocked(api.get).mockRejectedValueOnce(new Error('API Error'))

      await store.fetchHoldings()

      expect(store.isLoading).toBe(false)
      // 錯誤應該被捕獲，不會拋出
    })
  })

  describe('computed values', () => {
    it('應該計算正確的總市值', () => {
      const store = useHoldingsStore()
      
      store.list = [
        {
          id: '1',
          symbol: 'AAPL',
          currentValue: 10000,
          // ... 其他必要字段
        },
        {
          id: '2',
          symbol: 'GOOGL',
          currentValue: 5000,
          // ... 其他必要字段
        }
      ] as any

      expect(store.totalValue).toBe(15000)
    })

    it('應該計算正確的總獲利', () => {
      const store = useHoldingsStore()
      
      store.list = [
        {
          id: '1',
          symbol: 'AAPL',
          totalProfit: 2000,
          // ... 其他必要字段
        },
        {
          id: '2',
          symbol: 'GOOGL',
          totalProfit: -500,
          // ... 其他必要字段
        }
      ] as any

      expect(store.totalProfit).toBe(1500)
    })
  })

  describe('deleteHoldings', () => {
    it('應該刪除指定的持倉', async () => {
      const store = useHoldingsStore()
      
      vi.mocked(api.delete).mockResolvedValueOnce({ success: true })
      vi.mocked(api.get).mockResolvedValueOnce([]) // fetchHoldings 的回應

      await store.deleteHoldings(['98'])

      expect(api.delete).toHaveBeenCalledWith(
        '/api/holdings?uid=demo-user',
        {
          uid: 'demo-user',
          portfolio_id: '17',
          ids: ['98']
        }
      )
    })
  })
})
