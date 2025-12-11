import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCashFlowStore } from '../cashflow'
import { useAuthStore } from '../auth'
import api from '@/utils/api'
import type { CashAccount, CashFlow } from '@/types/global'
import { mockUser } from '@/utils/test-helpers'

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

describe('CashFlow Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // 設置基本的 auth 狀態
    const authStore = useAuthStore()
    authStore.user = mockUser()
  })

  describe('Computed Properties', () => {
    describe('totalCashBalance', () => {
      it('應該計算所有帳戶的總餘額', () => {
        const store = useCashFlowStore()
        
        store.cashAccounts = [
          { id: '1', name: 'Account 1', currency: 'TWD', balance: 10000, portfolioId: 'p1', createdAt: '', updatedAt: '' },
          { id: '2', name: 'Account 2', currency: 'USD', balance: 5000, portfolioId: 'p1', createdAt: '', updatedAt: '' },
          { id: '3', name: 'Account 3', currency: 'TWD', balance: 3000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
        ]

        expect(store.totalCashBalance).toBe(18000)
      })

      it('空帳戶時應該返回 0', () => {
        const store = useCashFlowStore()
        expect(store.totalCashBalance).toBe(0)
      })
    })

    describe('balanceByCurrency', () => {
      it('應該依貨幣分組計算餘額', () => {
        const store = useCashFlowStore()
        
        store.cashAccounts = [
          { id: '1', name: 'TWD Account 1', currency: 'TWD', balance: 10000, portfolioId: 'p1', createdAt: '', updatedAt: '' },
          { id: '2', name: 'USD Account', currency: 'USD', balance: 5000, portfolioId: 'p1', createdAt: '', updatedAt: '' },
          { id: '3', name: 'TWD Account 2', currency: 'TWD', balance: 3000, portfolioId: 'p1', createdAt: '', updatedAt: '' },
          { id: '4', name: 'USD Account 2', currency: 'USD', balance: 2000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
        ]

        const balances = store.balanceByCurrency

        expect(balances.TWD).toBe(13000)
        expect(balances.USD).toBe(7000)
      })

      it('空帳戶時應該返回空對象', () => {
        const store = useCashFlowStore()
        expect(store.balanceByCurrency).toEqual({})
      })
    })
  })

  describe('fetchCashAccounts', () => {
    it('應該成功獲取現金帳戶列表', async () => {
      const store = useCashFlowStore()
      
      const mockResponse = {
        accounts: [
          {
            id: 1,
            name: 'My Cash Account',
            currency: 'TWD',
            balance: '10000.00',
            portfolio_id: 17,
            description: 'Test account',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-02T00:00:00Z'
          }
        ]
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await store.fetchCashAccounts()

      expect(api.get).toHaveBeenCalledWith('/api/cash-accounts?uid=demo-user')
      expect(store.cashAccounts).toHaveLength(1)
      expect(store.cashAccounts[0]).toMatchObject({
        id: '1',
        name: 'My Cash Account',
        currency: 'TWD',
        balance: 10000,
        portfolioId: '17',
        description: 'Test account'
      })
    })

    it('應該自動選擇第一個帳戶', async () => {
      const store = useCashFlowStore()
      
      const mockResponse = {
        accounts: [
          {
            id: 1,
            name: 'Account 1',
            currency: 'TWD',
            balance: '10000',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-02T00:00:00Z'
          }
        ]
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await store.fetchCashAccounts()

      expect(store.selectedAccount).toBeDefined()
      expect(store.selectedAccount?.id).toBe('1')
    })

    it('沒有登入時應該顯示錯誤', async () => {
      const authStore = useAuthStore()
      authStore.user = null

      const store = useCashFlowStore()
      await store.fetchCashAccounts()

      expect(api.get).not.toHaveBeenCalled()
    })

    it('應該設置 loading 狀態', async () => {
      const store = useCashFlowStore()
      
      vi.mocked(api.get).mockImplementation(() => {
        expect(store.isLoading).toBe(true)
        return Promise.resolve({ accounts: [] })
      })

      await store.fetchCashAccounts()
      expect(store.isLoading).toBe(false)
    })
  })

  describe('addCashAccount', () => {
    it('應該成功新增現金帳戶', async () => {
      const store = useCashFlowStore()
      
      const mockResponse = {
        account: {
          id: 1,
          name: 'New Account',
          currency: 'USD',
          balance: '5000.00',
          portfolio_id: 17,
          description: 'Test',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const newAccount = {
        name: 'New Account',
        currency: 'USD',
        balance: 5000,
        description: 'Test'
      }

      await store.addCashAccount(newAccount)

      expect(api.post).toHaveBeenCalledWith('/api/cash-accounts', {
        uid: 'demo-user',
        name: 'New Account',
        balance: 5000,
        currency: 'USD',
        description: 'Test'
      })
      expect(store.cashAccounts).toHaveLength(1)
      expect(store.cashAccounts[0].name).toBe('New Account')
    })
  })

  describe('updateCashAccount', () => {
    it('應該成功更新現金帳戶', async () => {
      const store = useCashFlowStore()
      
      store.cashAccounts = [
        { id: '1', name: 'Old Name', currency: 'TWD', balance: 10000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
      ]

      const mockResponse = {
        account: {
          id: 1,
          name: 'Updated Name',
          currency: 'TWD',
          balance: '15000.00',
          portfolio_id: 17,
          description: 'Updated',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
        }
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const updatedAccount = {
        id: '1',
        name: 'Updated Name',
        currency: 'TWD',
        balance: 15000,
        description: 'Updated'
      }

      await store.updateCashAccount(updatedAccount)

      expect(api.put).toHaveBeenCalledWith('/api/cash-accounts/1', {
        uid: 'demo-user',
        name: 'Updated Name',
        balance: 15000,
        currency: 'TWD',
        description: 'Updated'
      })
      expect(store.cashAccounts[0].name).toBe('Updated Name')
      expect(store.cashAccounts[0].balance).toBe(15000)
    })
  })

  describe('deleteCashAccount', () => {
    it('應該成功刪除現金帳戶', async () => {
      const store = useCashFlowStore()
      
      store.cashAccounts = [
        { id: '1', name: 'Account 1', currency: 'TWD', balance: 10000, portfolioId: 'p1', createdAt: '', updatedAt: '' },
        { id: '2', name: 'Account 2', currency: 'USD', balance: 5000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
      ]

      vi.mocked(api.delete).mockResolvedValue({ success: true })

      await store.deleteCashAccount('1')

      expect(api.delete).toHaveBeenCalledWith('/api/cash-accounts/1?uid=demo-user')
      expect(store.cashAccounts).toHaveLength(1)
      expect(store.cashAccounts[0].id).toBe('2')
    })

    it('應該移除相關的現金流記錄', async () => {
      const store = useCashFlowStore()
      
      store.cashAccounts = [
        { id: '1', name: 'Account 1', currency: 'TWD', balance: 10000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
      ]
      store.cashFlows = [
        { id: 'cf-1', accountId: '1', portfolioId: 'p1', type: 'DEPOSIT', amount: 1000, description: 'Test', createdAt: '', updatedAt: '' },
        { id: 'cf-2', accountId: '2', portfolioId: 'p1', type: 'DEPOSIT', amount: 2000, description: 'Test', createdAt: '', updatedAt: '' }
      ]

      vi.mocked(api.delete).mockResolvedValue({ success: true })

      await store.deleteCashAccount('1')

      expect(store.cashFlows).toHaveLength(1)
      expect(store.cashFlows[0].id).toBe('cf-2')
    })

    it('刪除選中的帳戶時應該重新選擇', async () => {
      const store = useCashFlowStore()
      
      store.cashAccounts = [
        { id: '1', name: 'Account 1', currency: 'TWD', balance: 10000, portfolioId: 'p1', createdAt: '', updatedAt: '' },
        { id: '2', name: 'Account 2', currency: 'USD', balance: 5000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
      ]
      store.selectedAccount = store.cashAccounts[0]

      vi.mocked(api.delete).mockResolvedValue({ success: true })

      await store.deleteCashAccount('1')

      expect(store.selectedAccount?.id).toBe('2')
    })
  })

  describe('fetchCashFlows', () => {
    it('應該成功獲取現金流記錄', async () => {
      const store = useCashFlowStore()
      
      const mockResponse = {
        cashFlows: [
          {
            id: 1,
            account_id: 1,
            portfolio_id: 17,
            flow_type: 'salary',
            amount: '5000.00',
            description: 'Monthly salary',
            balance_after: '15000.00',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }
        ]
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await store.fetchCashFlows()

      expect(api.get).toHaveBeenCalled()
      expect(store.cashFlows).toHaveLength(1)
      expect(store.cashFlows[0]).toMatchObject({
        id: '1',
        accountId: '1',
        type: 'DEPOSIT',
        amount: 5000,
        description: 'Monthly salary',
        balanceAfter: 15000
      })
    })

    it('應該正確轉換查詢參數', async () => {
      const store = useCashFlowStore()
      
      vi.mocked(api.get).mockResolvedValue({ cashFlows: [] })

      await store.fetchCashFlows({
        accountId: '1',
        type: 'DEPOSIT',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        limit: 50,
        offset: 50
      })

      const callUrl = vi.mocked(api.get).mock.calls[0][0]
      expect(callUrl).toContain('account_id=1')
      expect(callUrl).toContain('flow_type=salary')
      expect(callUrl).toContain('start_date=2025-01-01')
      expect(callUrl).toContain('end_date=2025-01-31')
      expect(callUrl).toContain('limit=50')
      expect(callUrl).toContain('page=2')
    })

    it('應該正確對照現金流類型', async () => {
      const store = useCashFlowStore()
      
      const mockResponse = {
        cashFlows: [
          { id: 1, account_id: 1, flow_type: 'salary', amount: '1000', description: '', created_at: '', updated_at: '' },
          { id: 2, account_id: 1, flow_type: 'stock_buy', amount: '-500', description: '', created_at: '', updated_at: '' },
          { id: 3, account_id: 1, flow_type: 'dividend', amount: '100', description: '', created_at: '', updated_at: '' },
          { id: 4, account_id: 1, flow_type: 'transfer', amount: '200', description: '', created_at: '', updated_at: '' },
          { id: 5, account_id: 1, flow_type: 'exchange', amount: '50', description: '', created_at: '', updated_at: '' }
        ]
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await store.fetchCashFlows()

      expect(store.cashFlows[0].type).toBe('DEPOSIT')
      expect(store.cashFlows[1].type).toBe('STOCK_BUY')
      expect(store.cashFlows[2].type).toBe('DIVIDEND')
      expect(store.cashFlows[3].type).toBe('TRANSFER_IN')
      expect(store.cashFlows[4].type).toBe('ADJUSTMENT')
    })
  })

  describe('addCashFlow', () => {
    it('應該成功新增現金流記錄', async () => {
      const store = useCashFlowStore()
      
      store.cashAccounts = [
        { id: '1', name: 'Account 1', currency: 'TWD', balance: 10000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
      ]

      const mockResponse = {
        cashFlow: {
          id: 1,
          account_id: 1,
          portfolio_id: null,
          flow_type: 'salary',
          amount: '5000.00',
          description: 'Salary',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        newBalance: '15000.00'
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const newCashFlow = {
        accountId: '1',
        type: 'DEPOSIT' as const,
        amount: 5000,
        description: 'Salary'
      }

      await store.addCashFlow(newCashFlow)

      expect(api.post).toHaveBeenCalledWith('/api/cash-flows', expect.objectContaining({
        uid: 'demo-user',
        account_id: 1,
        portfolio_id: null,
        amount: 5000,
        flow_type: 'salary',
        description: 'Salary'
      }))
      expect(store.cashFlows).toHaveLength(1)
      expect(store.cashAccounts[0].balance).toBe(15000)
    })

    it('沒有 accountId 時應該顯示錯誤', async () => {
      const store = useCashFlowStore()

      const newCashFlow = {
        accountId: '',
        type: 'DEPOSIT' as const,
        amount: 5000,
        description: 'Test'
      }

      await store.addCashFlow(newCashFlow)

      expect(api.post).not.toHaveBeenCalled()
    })

    it('應該使用提供的日期', async () => {
      const store = useCashFlowStore()
      
      const mockResponse = {
        cashFlow: {
          id: 1,
          account_id: 1,
          flow_type: 'salary',
          amount: '5000',
          description: 'Test',
          created_at: '2025-01-15T00:00:00Z',
          updated_at: '2025-01-15T00:00:00Z'
        },
        newBalance: '15000'
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const newCashFlow = {
        accountId: '1',
        type: 'DEPOSIT' as const,
        amount: 5000,
        description: 'Test',
        date: '2025-01-15'
      }

      await store.addCashFlow(newCashFlow)

      expect(api.post).toHaveBeenCalledWith('/api/cash-flows', expect.objectContaining({
        date: '2025-01-15'
      }))
    })
  })

  describe('deleteCashFlow', () => {
    it('應該成功刪除現金流記錄', async () => {
      const store = useCashFlowStore()
      
      store.cashAccounts = [
        { id: '1', name: 'Account 1', currency: 'TWD', balance: 15000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
      ]
      store.cashFlows = [
        { id: '1', accountId: '1', portfolioId: 'p1', type: 'DEPOSIT', amount: 5000, description: 'Test', createdAt: '', updatedAt: '' }
      ]

      const mockResponse = {
        success: true,
        newBalance: '10000.00'
      }

      vi.mocked(api.delete).mockResolvedValue(mockResponse)

      await store.deleteCashFlow('1')

      expect(api.delete).toHaveBeenCalledWith('/api/cash-flows/1?uid=demo-user')
      expect(store.cashFlows).toHaveLength(0)
      expect(store.cashAccounts[0].balance).toBe(10000)
    })

    it('找不到記錄時應該顯示錯誤', async () => {
      const store = useCashFlowStore()
      
      await store.deleteCashFlow('non-existent')

      expect(api.delete).not.toHaveBeenCalled()
    })
  })

  describe('adjustAccountBalance', () => {
    it('應該成功調整帳戶餘額', async () => {
      const store = useCashFlowStore()
      
      store.cashAccounts = [
        { id: '1', name: 'Account 1', currency: 'TWD', balance: 10000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
      ]

      const mockResponse = {
        cashFlow: {
          id: 1,
          account_id: 1,
          flow_type: 'exchange',
          amount: '1000.00',
          description: '餘額增加',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        newBalance: '11000.00'
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      await store.adjustAccountBalance('1', 1000, '餘額增加')

      expect(api.post).toHaveBeenCalledWith('/api/cash-flows', expect.objectContaining({
        flow_type: 'exchange',
        amount: 1000,
        description: '餘額增加'
      }))
    })

    it('負數金額應該使用"餘額減少"描述', async () => {
      const store = useCashFlowStore()
      
      store.cashAccounts = [
        { id: '1', name: 'Account 1', currency: 'TWD', balance: 10000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
      ]

      vi.mocked(api.post).mockResolvedValue({
        cashFlow: { id: 1, account_id: 1, flow_type: 'exchange', amount: '-500', description: '餘額減少', created_at: '', updated_at: '' },
        newBalance: '9500'
      })

      await store.adjustAccountBalance('1', -500, '')

      expect(api.post).toHaveBeenCalledWith('/api/cash-flows', expect.objectContaining({
        description: '餘額減少'
      }))
    })
  })

  describe('transferBetweenAccounts', () => {
    it('應該成功在帳戶間轉帳', async () => {
      const store = useCashFlowStore()
      
      store.cashAccounts = [
        { id: '1', name: 'Account 1', currency: 'TWD', balance: 10000, portfolioId: 'p1', createdAt: '', updatedAt: '' },
        { id: '2', name: 'Account 2', currency: 'TWD', balance: 5000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
      ]

      vi.mocked(api.post)
        .mockResolvedValueOnce({
          cashFlow: { id: 1, account_id: 1, flow_type: 'transfer', amount: '-2000', description: 'Transfer out', created_at: '', updated_at: '' },
          newBalance: '8000'
        })
        .mockResolvedValueOnce({
          cashFlow: { id: 2, account_id: 2, flow_type: 'transfer', amount: '2000', description: 'Transfer in', created_at: '', updated_at: '' },
          newBalance: '7000'
        })

      await store.transferBetweenAccounts('1', '2', 2000, '測試轉帳')

      expect(api.post).toHaveBeenCalledTimes(2)
    })

    it('金額為 0 或負數時應該顯示錯誤', async () => {
      const store = useCashFlowStore()
      
      store.cashAccounts = [
        { id: '1', name: 'Account 1', currency: 'TWD', balance: 10000, portfolioId: 'p1', createdAt: '', updatedAt: '' },
        { id: '2', name: 'Account 2', currency: 'TWD', balance: 5000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
      ]

      await store.transferBetweenAccounts('1', '2', 0)
      expect(api.post).not.toHaveBeenCalled()

      await store.transferBetweenAccounts('1', '2', -100)
      expect(api.post).not.toHaveBeenCalled()
    })

    it('餘額不足時應該顯示錯誤', async () => {
      const store = useCashFlowStore()
      
      store.cashAccounts = [
        { id: '1', name: 'Account 1', currency: 'TWD', balance: 1000, portfolioId: 'p1', createdAt: '', updatedAt: '' },
        { id: '2', name: 'Account 2', currency: 'TWD', balance: 5000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
      ]

      await store.transferBetweenAccounts('1', '2', 2000)

      expect(api.post).not.toHaveBeenCalled()
    })

    it('找不到帳戶時應該顯示錯誤', async () => {
      const store = useCashFlowStore()
      
      store.cashAccounts = [
        { id: '1', name: 'Account 1', currency: 'TWD', balance: 10000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
      ]

      await store.transferBetweenAccounts('1', 'non-existent', 2000)

      expect(api.post).not.toHaveBeenCalled()
    })
  })

  describe('Utility Functions', () => {
    describe('setSelectedAccount', () => {
      it('應該設置選中的帳戶', () => {
        const store = useCashFlowStore()
        
        const account: CashAccount = {
          id: '1',
          name: 'Test Account',
          currency: 'TWD',
          balance: 10000,
          portfolioId: 'p1',
          createdAt: '',
          updatedAt: ''
        }

      store.setSelectedAccount(account)

      expect(store.selectedAccount).toStrictEqual(account)
      })

      it('應該可以設置為 null', () => {
        const store = useCashFlowStore()
        
        store.selectedAccount = {
          id: '1',
          name: 'Test',
          currency: 'TWD',
          balance: 10000,
          portfolioId: 'p1',
          createdAt: '',
          updatedAt: ''
        }

        store.setSelectedAccount(null)

        expect(store.selectedAccount).toBeNull()
      })
    })

    describe('getAccountById', () => {
      it('應該找到指定的帳戶', () => {
        const store = useCashFlowStore()
        
        store.cashAccounts = [
          { id: '1', name: 'Account 1', currency: 'TWD', balance: 10000, portfolioId: 'p1', createdAt: '', updatedAt: '' },
          { id: '2', name: 'Account 2', currency: 'USD', balance: 5000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
        ]

        const account = store.getAccountById('2')

        expect(account).toBeDefined()
        expect(account?.name).toBe('Account 2')
      })

      it('找不到時應該返回 undefined', () => {
        const store = useCashFlowStore()
        
        store.cashAccounts = [
          { id: '1', name: 'Account 1', currency: 'TWD', balance: 10000, portfolioId: 'p1', createdAt: '', updatedAt: '' }
        ]

        const account = store.getAccountById('999')

        expect(account).toBeUndefined()
      })
    })

    describe('getCashFlowTypeLabel', () => {
      it('應該返回正確的中文標籤', () => {
        const store = useCashFlowStore()

        expect(store.getCashFlowTypeLabel('DEPOSIT')).toBe('存款')
        expect(store.getCashFlowTypeLabel('WITHDRAWAL')).toBe('提款')
        expect(store.getCashFlowTypeLabel('STOCK_BUY')).toBe('買入股票')
        expect(store.getCashFlowTypeLabel('STOCK_SELL')).toBe('賣出股票')
        expect(store.getCashFlowTypeLabel('DIVIDEND')).toBe('股利收入')
        expect(store.getCashFlowTypeLabel('FEE')).toBe('手續費')
        expect(store.getCashFlowTypeLabel('TRANSFER_IN')).toBe('轉入')
        expect(store.getCashFlowTypeLabel('TRANSFER_OUT')).toBe('轉出')
        expect(store.getCashFlowTypeLabel('ADJUSTMENT')).toBe('餘額調整')
        expect(store.getCashFlowTypeLabel('OTHER')).toBe('其他')
      })
    })
  })

  describe('Type Mapping', () => {
    it('應該正確對照前端到後端的現金流類型', () => {
      const store = useCashFlowStore()
      
      // 透過 addCashFlow 測試類型轉換
      vi.mocked(api.post).mockResolvedValue({
        cashFlow: { id: 1, account_id: 1, flow_type: 'salary', amount: '1000', description: '', created_at: '', updated_at: '' },
        newBalance: '11000'
      })

      const testMappings = [
        { frontend: 'DEPOSIT', backend: 'salary' },
        { frontend: 'WITHDRAWAL', backend: 'other' },
        { frontend: 'STOCK_BUY', backend: 'stock_buy' },
        { frontend: 'STOCK_SELL', backend: 'stock_sell' },
        { frontend: 'DIVIDEND', backend: 'dividend' },
        { frontend: 'TRANSFER_IN', backend: 'transfer' },
        { frontend: 'ADJUSTMENT', backend: 'exchange' }
      ]

      testMappings.forEach(async ({ frontend }) => {
        await store.addCashFlow({
          accountId: '1',
          type: frontend as any,
          amount: 1000,
          description: 'Test'
        })
      })
    })
  })
})
