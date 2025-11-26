import { defineStore } from 'pinia'
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { success, error as errorToast } from '@/composables/toast'
import type { 
  CashAccount, 
  CashFlow, 
  NewCashAccount, 
  UpdateCashAccount, 
  NewCashFlow, 
  CashFlowQuery, 
  CashFlowType 
} from '@/types/global'

// 模擬數據
const mockCashAccounts: CashAccount[] = [
  {
    id: '1',
    name: 'Interactive Brokers',
    currency: 'USD',
    balance: 12500,
    portfolioId: 'demo-portfolio',
    description: 'US Stock Trading Account',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-11-26T00:00:00Z'
  },
  {
    id: '2',
    name: 'TD Ameritrade',
    currency: 'USD',
    balance: 8300,
    portfolioId: 'demo-portfolio',
    description: 'Options Trading Account',
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-11-25T00:00:00Z'
  }
]

const mockCashFlows: CashFlow[] = [
  {
    id: '1',
    accountId: '1',
    portfolioId: 'demo-portfolio',
    type: 'DEPOSIT',
    amount: 5000,
    description: 'Wire Transfer Deposit',
    createdAt: '2024-11-25T09:00:00Z',
    updatedAt: '2024-11-25T09:00:00Z'
  },
  {
    id: '2',
    accountId: '1',
    portfolioId: 'demo-portfolio',
    type: 'STOCK_BUY',
    amount: -2500,
    description: 'Buy AAPL Shares',
    relatedSymbol: 'AAPL',
    createdAt: '2024-11-24T14:30:00Z',
    updatedAt: '2024-11-24T14:30:00Z'
  },
  {
    id: '3',
    accountId: '2',
    portfolioId: 'demo-portfolio',
    type: 'DIVIDEND',
    amount: 320,
    description: 'AAPL Dividend Income',
    relatedSymbol: 'AAPL',
    createdAt: '2024-11-23T10:00:00Z',
    updatedAt: '2024-11-23T10:00:00Z'
  },
  {
    id: '4',
    accountId: '1',
    portfolioId: 'demo-portfolio',
    type: 'FEE',
    amount: -5,
    description: 'Trading Commission',
    createdAt: '2024-11-24T14:30:00Z',
    updatedAt: '2024-11-24T14:30:00Z'
  },
  {
    id: '5',
    accountId: '2',
    portfolioId: 'demo-portfolio',
    type: 'STOCK_SELL',
    amount: 3500,
    description: 'Sell TSLA Shares',
    relatedSymbol: 'TSLA',
    createdAt: '2024-11-22T11:00:00Z',
    updatedAt: '2024-11-22T11:00:00Z'
  },
  {
    id: '6',
    accountId: '1',
    portfolioId: 'demo-portfolio',
    type: 'DIVIDEND',
    amount: 180,
    description: 'MSFT Dividend Income',
    relatedSymbol: 'MSFT',
    createdAt: '2024-11-21T10:00:00Z',
    updatedAt: '2024-11-21T10:00:00Z'
  }
]

export const useCashFlowStore = defineStore('cashflow', () => {
  // State
  const cashAccounts: Ref<CashAccount[]> = ref([...mockCashAccounts])
  const cashFlows: Ref<CashFlow[]> = ref([...mockCashFlows])
  const isLoading: Ref<boolean> = ref(false)
  const selectedAccount: Ref<CashAccount | null> = ref(null)

  // 總現金餘額
  const totalCashBalance: ComputedRef<number> = computed(() => 
    cashAccounts.value.reduce((total, account) => total + account.balance, 0)
  )

  // 依貨幣分組的現金餘額
  const balanceByCurrency: ComputedRef<Record<string, number>> = computed(() => {
    const balances: Record<string, number> = {}
    cashAccounts.value.forEach(account => {
      if (!balances[account.currency]) {
        balances[account.currency] = 0
      }
      balances[account.currency] += account.balance
    })
    return balances
  })

  // 啟用的現金帳戶
  const activeAccounts: ComputedRef<CashAccount[]> = computed(() => 
    cashAccounts.value.filter(account => account.isActive)
  )

  // === 現金帳戶管理 ===

  // 獲取現金帳戶列表
  const fetchCashAccounts = async (): Promise<void> => {
    // 使用模擬數據，不調用API
    try {
      isLoading.value = true
      
      // 模擬網路延遲
      await new Promise(resolve => setTimeout(resolve, 500))
      
      cashAccounts.value = [...mockCashAccounts]
      
      // 如果沒有選擇的帳戶且有可用帳戶，選擇第一個啟用的帳戶
      if (!selectedAccount.value && activeAccounts.value.length > 0) {
        selectedAccount.value = activeAccounts.value[0]
      }
      
      success('成功', '現金帳戶載入完成')
    } catch (error) {
      console.error('Error fetching cash accounts:', error)
      errorToast('錯誤', '獲取現金帳戶失敗')
    } finally {
      isLoading.value = false
    }
  }

  // 新增現金帳戶
  const addCashAccount = async (account: NewCashAccount): Promise<void> => {
    try {
      isLoading.value = true
      
      // 模擬網路延遲
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const newAccount: CashAccount = {
        id: Date.now().toString(),
        name: account.name,
        currency: account.currency,
        balance: account.balance || 0,
        portfolioId: 'demo-portfolio',
        description: account.description,
        isActive: account.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      cashAccounts.value.push(newAccount)
      success('成功', `現金帳戶 "${account.name}" 已新增`)
    } catch (error) {
      console.error('Error adding cash account:', error)
      errorToast('錯誤', '新增現金帳戶失敗')
    } finally {
      isLoading.value = false
    }
  }

  // 編輯現金帳戶
  const updateCashAccount = async (account: UpdateCashAccount): Promise<void> => {
    try {
      isLoading.value = true
      
      // 模擬網路延遲
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const index = cashAccounts.value.findIndex(a => a.id === account.id)
      if (index !== -1) {
        cashAccounts.value[index] = {
          ...cashAccounts.value[index],
          name: account.name,
          currency: account.currency,
          balance: account.balance || 0,
          description: account.description,
          isActive: account.isActive ?? true,
          updatedAt: new Date().toISOString()
        }
      }
      
      success('成功', `現金帳戶 "${account.name}" 已更新`)
    } catch (error) {
      console.error('Error updating cash account:', error)
      errorToast('錯誤', '更新現金帳戶失敗')
    } finally {
      isLoading.value = false
    }
  }

  // 刪除現金帳戶
  const deleteCashAccount = async (accountId: string): Promise<void> => {
    try {
      isLoading.value = true
      
      // 模擬網路延遲
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const index = cashAccounts.value.findIndex(a => a.id === accountId)
      if (index !== -1) {
        const accountName = cashAccounts.value[index].name
        cashAccounts.value.splice(index, 1)
        
        // 刪除相關的現金流記錄
        cashFlows.value = cashFlows.value.filter(cf => cf.accountId !== accountId)
        
        // 如果刪除的是選中的帳戶，重新選擇
        if (selectedAccount.value?.id === accountId) {
          selectedAccount.value = activeAccounts.value[0] || null
        }
        
        success('成功', `現金帳戶 "${accountName}" 已刪除`)
      }
    } catch (error) {
      console.error('Error deleting cash account:', error)
      errorToast('錯誤', '刪除現金帳戶失敗')
    } finally {
      isLoading.value = false
    }
  }

  // === 現金流管理 ===

  // 獲取現金流記錄
  const fetchCashFlows = async (query?: CashFlowQuery): Promise<void> => {
    try {
      isLoading.value = true
      
      // 模擬網路延遲
      await new Promise(resolve => setTimeout(resolve, 300))
      
      let filteredFlows = [...mockCashFlows]
      
      if (query) {
        if (query.accountId) {
          filteredFlows = filteredFlows.filter(cf => cf.accountId === query.accountId)
        }
        if (query.type) {
          filteredFlows = filteredFlows.filter(cf => cf.type === query.type)
        }
        if (query.limit) {
          filteredFlows = filteredFlows.slice(0, query.limit)
        }
      }
      
      // 按時間排序（最新的在前）
      filteredFlows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      cashFlows.value = filteredFlows
    } catch (error) {
      console.error('Error fetching cash flows:', error)
      errorToast('錯誤', '獲取現金流記錄失敗')
    } finally {
      isLoading.value = false
    }
  }

  // 新增現金流記錄
  const addCashFlow = async (cashFlow: NewCashFlow): Promise<void> => {
    try {
      isLoading.value = true
      
      // 模擬網路延遲
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const newCashFlow: CashFlow = {
        id: Date.now().toString(),
        accountId: cashFlow.accountId,
        portfolioId: 'demo-portfolio',
        type: cashFlow.type,
        amount: cashFlow.amount,
        description: cashFlow.description,
        relatedTransactionId: cashFlow.relatedTransactionId,
        relatedSymbol: cashFlow.relatedSymbol,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      cashFlows.value.unshift(newCashFlow)
      
      // 更新對應帳戶餘額
      const account = cashAccounts.value.find(a => a.id === cashFlow.accountId)
      if (account) {
        account.balance += cashFlow.amount
        account.updatedAt = new Date().toISOString()
      }
      
      const actionText = cashFlow.amount > 0 ? '收入' : '支出'
      success('成功', `現金流${actionText}記錄已新增`)
    } catch (error) {
      console.error('Error adding cash flow:', error)
      errorToast('錯誤', '新增現金流記錄失敗')
    } finally {
      isLoading.value = false
    }
  }

  // 刪除現金流記錄
  const deleteCashFlow = async (cashFlowId: string): Promise<void> => {
    try {
      isLoading.value = true
      
      // 模擬網路延遲
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 先找到要刪除的現金流記錄
      const cashFlow = cashFlows.value.find(cf => cf.id === cashFlowId)
      if (!cashFlow) {
        errorToast('錯誤', '找不到指定的現金流記錄')
        return
      }
      
      // 從列表中移除
      const index = cashFlows.value.findIndex(cf => cf.id === cashFlowId)
      if (index !== -1) {
        cashFlows.value.splice(index, 1)
      }
      
      // 回復帳戶餘額
      const account = cashAccounts.value.find(a => a.id === cashFlow.accountId)
      if (account) {
        account.balance -= cashFlow.amount
        account.updatedAt = new Date().toISOString()
      }
      
      success('成功', '現金流記錄已刪除')
    } catch (error) {
      console.error('Error deleting cash flow:', error)
      errorToast('錯誤', '刪除現金流記錄失敗')
    } finally {
      isLoading.value = false
    }
  }

  // === 帳戶餘額操作 ===

  // 調整帳戶餘額
  const adjustAccountBalance = async (
    accountId: string, 
    amount: number, 
    description: string
  ): Promise<void> => {
    const account = cashAccounts.value.find(a => a.id === accountId)
    if (!account) {
      errorToast('錯誤', '找不到指定的現金帳戶')
      return
    }

    await addCashFlow({
      accountId,
      type: 'ADJUSTMENT',
      amount,
      description: description || (amount > 0 ? '餘額增加' : '餘額減少')
    })
  }

  // 帳戶間轉帳
  const transferBetweenAccounts = async (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string = '帳戶轉帳'
  ): Promise<void> => {
    if (amount <= 0) {
      errorToast('錯誤', '轉帳金額必須大於 0')
      return
    }

    const fromAccount = cashAccounts.value.find(a => a.id === fromAccountId)
    const toAccount = cashAccounts.value.find(a => a.id === toAccountId)

    if (!fromAccount || !toAccount) {
      errorToast('錯誤', '找不到指定的現金帳戶')
      return
    }

    if (fromAccount.balance < amount) {
      errorToast('錯誤', '餘額不足')
      return
    }

    try {
      isLoading.value = true

      // 創建轉出記錄
      await addCashFlow({
        accountId: fromAccountId,
        type: 'TRANSFER_OUT',
        amount: -amount,
        description: `轉出至 ${toAccount.name}: ${description}`
      })

      // 創建轉入記錄
      await addCashFlow({
        accountId: toAccountId,
        type: 'TRANSFER_IN',
        amount: amount,
        description: `由 ${fromAccount.name} 轉入: ${description}`
      })

      success('成功', `已成功從 ${fromAccount.name} 轉帳 $${amount.toLocaleString()} 至 ${toAccount.name}`)
    } catch (error) {
      console.error('Error transferring between accounts:', error)
      errorToast('錯誤', '轉帳失敗')
    } finally {
      isLoading.value = false
    }
  }

  // === 工具函數 ===

  // 設定選中的帳戶
  const setSelectedAccount = (account: CashAccount | null): void => {
    selectedAccount.value = account
  }

  // 根據 ID 獲取帳戶
  const getAccountById = (accountId: string): CashAccount | undefined => {
    return cashAccounts.value.find(account => account.id === accountId)
  }

  // 獲取現金流類型的中文描述
  const getCashFlowTypeLabel = (type: CashFlowType): string => {
    const typeLabels: Record<CashFlowType, string> = {
      DEPOSIT: '存款',
      WITHDRAWAL: '提款',
      STOCK_BUY: '買入股票',
      STOCK_SELL: '賣出股票',
      DIVIDEND: '股利收入',
      FEE: '手續費',
      TRANSFER_IN: '轉入',
      TRANSFER_OUT: '轉出',
      ADJUSTMENT: '餘額調整',
      OTHER: '其他'
    }
    return typeLabels[type] || type
  }

  return {
    // State
    cashAccounts,
    cashFlows,
    isLoading,
    selectedAccount,
    
    // Computed
    totalCashBalance,
    balanceByCurrency,
    activeAccounts,
    
    // Actions - 現金帳戶
    fetchCashAccounts,
    addCashAccount,
    updateCashAccount,
    deleteCashAccount,
    
    // Actions - 現金流
    fetchCashFlows,
    addCashFlow,
    deleteCashFlow,
    
    // Actions - 餘額操作
    adjustAccountBalance,
    transferBetweenAccounts,
    
    // Utils
    setSelectedAccount,
    getAccountById,
    getCashFlowTypeLabel
  }
})