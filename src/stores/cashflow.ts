import { defineStore } from 'pinia'
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { success, error as errorToast } from '@/composables/toast'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api.js'
import type { 
  CashAccount, 
  CashFlow, 
  NewCashAccount, 
  UpdateCashAccount, 
  NewCashFlow, 
  CashFlowQuery, 
  CashFlowType 
} from '@/types/global'

export const useCashFlowStore = defineStore('cashflow', () => {
  // Get auth store for uid
  const authStore = useAuthStore()
  
  // State
  const cashAccounts: Ref<CashAccount[]> = ref([])
  const cashFlows: Ref<CashFlow[]> = ref([])
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

  // === 現金帳戶管理 ===

  // 獲取現金帳戶列表
  const fetchCashAccounts = async (): Promise<void> => {
    try {
      isLoading.value = true
      
      const uid = authStore.user?.uid
      if (!uid) {
        errorToast('錯誤', '請先登入')
        return
      }
      
      const response = await api.get(`/api/cash-accounts?uid=${uid}`)

      console.log('Fetched cash accounts:', response)
      
      // 將後端格式轉換為前端格式
      cashAccounts.value = response.accounts.map((account: any) => ({
        id: account.id.toString(),
        name: account.name,
        currency: account.currency,
        balance: parseFloat(account.balance),
        portfolioId: account.portfolio_id?.toString() || '',
        description: account.description || '',
        createdAt: account.created_at,
        updatedAt: account.updated_at
      }))
      
      // 如果沒有選擇的帳戶且有可用帳戶，選擇第一個帳戶
      if (!selectedAccount.value && cashAccounts.value.length > 0) {
        selectedAccount.value = cashAccounts.value[0]
      }
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
      
      const uid = authStore.user?.uid
      if (!uid) {
        errorToast('錯誤', '請先登入')
        return
      }

      console.log('Adding cash account:', account)
      
      const response = await api.post('/api/cash-accounts', {
        uid,
        name: account.name,
        balance: account.balance || 0,
        currency: account.currency,
        description: account.description || ''
      })
      
      // 將新增的帳戶加入列表
      const newAccount: CashAccount = {
        id: response.account.id.toString(),
        name: response.account.name,
        currency: response.account.currency,
        balance: parseFloat(response.account.balance),
        portfolioId: response.account.portfolio_id?.toString() || '',
        description: response.account.description || '',
        createdAt: response.account.created_at,
        updatedAt: response.account.updated_at
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
      
      const uid = authStore.user?.uid
      if (!uid) {
        errorToast('錯誤', '請先登入')
        return
      }
      
      const response = await api.put(`/api/cash-accounts/${account.id}`, {
        uid,
        name: account.name,
        balance: account.balance || 0,
        currency: account.currency,
        description: account.description || ''
      })
      
      // 更新本地數據
      const index = cashAccounts.value.findIndex(a => a.id === account.id)
      if (index !== -1) {
        cashAccounts.value[index] = {
          id: response.account.id.toString(),
          name: response.account.name,
          currency: response.account.currency,
          balance: parseFloat(response.account.balance),
          portfolioId: response.account.portfolio_id?.toString() || '',
          description: response.account.description || '',
          createdAt: response.account.created_at,
          updatedAt: response.account.updated_at
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
      
      const uid = authStore.user?.uid
      if (!uid) {
        errorToast('錯誤', '請先登入')
        return
      }
      
      const index = cashAccounts.value.findIndex(a => a.id === accountId)
      if (index === -1) {
        errorToast('錯誤', '找不到指定的帳戶')
        return
      }
      
      const accountName = cashAccounts.value[index].name
      
      await api.delete(`/api/cash-accounts/${accountId}?uid=${uid}`)
      
      // 從本地列表移除
      cashAccounts.value.splice(index, 1)
      
      // 同時移除相關的現金流記錄
      cashFlows.value = cashFlows.value.filter(cf => cf.accountId !== accountId)
      
      // 如果刪除的是選中的帳戶，重新選擇
      if (selectedAccount.value?.id === accountId) {
        selectedAccount.value = cashAccounts.value[0] || null
      }
      
      success('成功', `現金帳戶 "${accountName}" 已刪除`)
    } catch (error: any) {
      console.error('Error deleting cash account:', error)
      if (error.message?.includes('existing cash flow records')) {
        errorToast('錯誤', '此帳戶有相關現金流記錄，無法刪除')
      } else {
        errorToast('錯誤', '刪除現金帳戶失敗')
      }
    } finally {
      isLoading.value = false
    }
  }

  // === 現金流管理 ===

  // 後端到前端的現金流類型對照
  const mapBackendFlowType = (backendType: string): CashFlowType => {
    const typeMap: Record<string, CashFlowType> = {
      'salary': 'DEPOSIT',
      'transfer': 'TRANSFER_IN',
      'exchange': 'ADJUSTMENT',
      'stock_buy': 'STOCK_BUY',
      'stock_sell': 'STOCK_SELL',
      'dividend': 'DIVIDEND',
      'other': 'OTHER'
    }
    return typeMap[backendType] || 'OTHER'
  }

  // 前端到後端的現金流類型對照
  const mapFrontendFlowType = (frontendType: CashFlowType): string => {
    const typeMap: Record<CashFlowType, string> = {
      'DEPOSIT': 'salary',
      'WITHDRAWAL': 'other',
      'STOCK_BUY': 'stock_buy',
      'STOCK_SELL': 'stock_sell',
      'DIVIDEND': 'dividend',
      'FEE': 'other',
      'TRANSFER_IN': 'transfer',
      'TRANSFER_OUT': 'transfer',
      'ADJUSTMENT': 'exchange',
      'OTHER': 'other'
    }
    return typeMap[frontendType] || 'other'
  }

  // 獲取現金流記錄
  const fetchCashFlows = async (query?: CashFlowQuery): Promise<void> => {
    try {
      isLoading.value = true
      
      const uid = authStore.user?.uid
      if (!uid) {
        errorToast('錯誤', '請先登入')
        return
      }
      
      // 組裝查詢參數
      const params = new URLSearchParams({ uid })
      if (query?.accountId) params.append('account_id', query.accountId)
      if (query?.type) params.append('flow_type', mapFrontendFlowType(query.type))
      if (query?.startDate) params.append('start_date', query.startDate)
      if (query?.endDate) params.append('end_date', query.endDate)
      if (query?.limit) params.append('limit', query.limit.toString())
      if (query?.offset) params.append('page', ((query.offset / (query.limit || 50)) + 1).toString())
      
      const response = await api.get(`/api/cash-flows?${params.toString()}`)
      
      // 將後端格式轉換為前端格式
      cashFlows.value = response.cashFlows.map((flow: any) => ({
        id: flow.id.toString(),
        accountId: flow.account_id.toString(),
        portfolioId: flow.portfolio_id?.toString() || '',
        type: mapBackendFlowType(flow.flow_type),
        amount: parseFloat(flow.amount),
        description: flow.description,
        relatedTransactionId: flow.related_transaction_id?.toString(),
        relatedSymbol: flow.related_symbol,
        createdAt: flow.created_at,
        updatedAt: flow.updated_at
      }))

      console.log('Fetched cash flows:', cashFlows.value)
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
      
      const uid = authStore.user?.uid
      if (!uid) {
        errorToast('錯誤', '請先登入')
        return
      }

      // 驗證 accountId
      if (!cashFlow.accountId) {
        errorToast('錯誤', '請選擇現金帳戶')
        return
      }

      console.log('addCashFlow input:', cashFlow)
      
      const payload = {
        uid,
        account_id: parseInt(cashFlow.accountId),
        portfolio_id: null, // 可選，如需要可從其他地方獲取
        amount: cashFlow.amount,
        flow_type: mapFrontendFlowType(cashFlow.type),
        description: cashFlow.description,
        date: cashFlow.date || new Date().toISOString().split('T')[0] // YYYY-MM-DD 格式
      }

      console.log('addCashFlow payload:', payload)
      
      const response = await api.post('/api/cash-flows', payload)
      
      // 將新增的現金流加入列表
      const newCashFlow: CashFlow = {
        id: response.cashFlow.id.toString(),
        accountId: response.cashFlow.account_id.toString(),
        portfolioId: response.cashFlow.portfolio_id?.toString() || '',
        type: mapBackendFlowType(response.cashFlow.flow_type),
        amount: parseFloat(response.cashFlow.amount),
        description: response.cashFlow.description,
        relatedTransactionId: response.cashFlow.related_transaction_id?.toString(),
        relatedSymbol: response.cashFlow.related_symbol,
        createdAt: response.cashFlow.created_at,
        updatedAt: response.cashFlow.updated_at
      }
      
      cashFlows.value.unshift(newCashFlow)
      
      // 更新對應帳戶餘額（使用後端返回的新餘額）
      const account = cashAccounts.value.find(a => a.id === cashFlow.accountId)
      if (account && response.newBalance !== undefined) {
        account.balance = parseFloat(response.newBalance)
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
      
      const uid = authStore.user?.uid
      if (!uid) {
        errorToast('錯誤', '請先登入')
        return
      }
      
      // 先找到要刪除的現金流記錄
      const cashFlow = cashFlows.value.find(cf => cf.id === cashFlowId)
      if (!cashFlow) {
        errorToast('錯誤', '找不到指定的現金流記錄')
        return
      }
      
      const response = await api.delete(`/api/cash-flows/${cashFlowId}?uid=${uid}`)
      
      // 從列表中移除
      const index = cashFlows.value.findIndex(cf => cf.id === cashFlowId)
      if (index !== -1) {
        cashFlows.value.splice(index, 1)
      }
      
      // 更新帳戶餘額（使用後端返回的新餘額）
      const account = cashAccounts.value.find(a => a.id === cashFlow.accountId)
      if (account && response.newBalance !== undefined) {
        account.balance = parseFloat(response.newBalance)
        account.updatedAt = new Date().toISOString()
      }
      
      success('成功', '現金流記錄已刪除')
    } catch (error: any) {
      console.error('Error deleting cash flow:', error)
      if (error.message?.includes('auto-generated')) {
        errorToast('錯誤', '自動生成的記錄無法刪除，請刪除對應的交易或股利')
      } else {
        errorToast('錯誤', '刪除現金流記錄失敗')
      }
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