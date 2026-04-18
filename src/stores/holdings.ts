// src/stores/holdings.js
import { defineStore } from 'pinia'
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import api from '@/utils/api.js'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'

interface HoldingData {
  id: string
  symbol: string
  name: string
  asset_type: string
  total_shares: string | number
  avg_cost: string | number
  current_price: string | number
  target_percentage: string | number
  last_updated?: string
}

interface Holding {
  id: string
  symbol: string
  name: string
  assetType: string
  shares: number
  avgCost: number
  currentPrice: number
  target: number
  lastUpdated: string
  totalCost: number
  currentValue: number
  totalProfit: number
  profitPercentage: string
  actualRatio?: string
}

interface HoldingsList extends Array<Holding> {
  totalValue?: number
}

export const useHoldingsStore = defineStore('holdings', () => {
  const list: Ref<HoldingsList> = ref([])          // holdings array（view model）
  const isLoading: Ref<boolean> = ref(false)

  const auth = useAuthStore()
  const portfolioStore = usePortfolioStore()

  const uid: ComputedRef<string | null> = computed(() => auth.user?.uid || null)
  const portfolioId: ComputedRef<string | null> = computed(() => portfolioStore.currentPortfolio?.id || null)

  // 將後端資料轉成前端需要的格式
  const setHoldings = (data: HoldingData[] = []): void => {
    list.value = data.map(item => {
      const shares = parseInt(String(item.total_shares)) || 0
      const avgCost = parseFloat(String(item.avg_cost)) || 0
      const currentPrice = parseFloat(String(item.current_price)) || 0
      const target = parseFloat(String(item.target_percentage)) || 0
      const lastUpdated = item.last_updated?.split('T')[0] || ''

      const totalCost = Math.round(avgCost * shares * 100) / 100
      const currentValue = Math.round(currentPrice * shares * 100) / 100
      const totalProfit = Math.round((currentValue - totalCost) * 100) / 100
      const profitPercentage = ((currentValue / (totalCost || 1)) * 100 - 100).toFixed(2)

      return {
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        assetType: item.asset_type,
        shares,
        avgCost,
        currentPrice,
        totalCost,
        currentValue,
        target,
        lastUpdated,
        totalProfit,
        profitPercentage,
      }
    })

    // 計算總市值
    list.value.totalValue = list.value.reduce((sum, h) => sum + h.currentValue, 0)

    // 計算各持股的實際比例
    list.value.forEach(h => {
      h.actualRatio = list.value.totalValue ? ((h.currentValue / list.value.totalValue) * 100).toFixed(2) : '0.00'
    })
  }

  // 取得 holdings
  const fetchHoldings = async (): Promise<void> => {
    if (!uid.value || !portfolioId.value) return
    try {
      isLoading.value = true
      const data = await api.get(
        `/api/holdings?uid=${uid.value}&portfolio_id=${portfolioId.value}`
      )
      setHoldings(data)
    } catch (error) {
      console.error('Error fetching holdings:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 刪除多筆 holdings
  const deleteHoldings = async (ids: string[] = []): Promise<void> => {
    if (!ids.length || !uid.value || !portfolioId.value) return
    try {
      isLoading.value = true
      const payload = {
        uid: uid.value,
        portfolio_id: portfolioId.value,
        ids,
      }
      await api.delete(`/api/holdings?uid=${uid.value}`, payload)
      // 刪除後重新抓取
      await fetchHoldings()
    } finally {
      isLoading.value = false
    }
  }

  // 更新最近價格到資料庫
  const refreshPrices = async (): Promise<void> => {
    if (!uid.value || !portfolioId.value) return
    try {
      isLoading.value = true
      const payload = {
        uid: uid.value,
        portfolio_id: portfolioId.value,
      }
      const data = await api.post(`/api/holdings/refresh-prices`, payload)
      // 後端若回傳 holdings，直接覆蓋；否則再 fetch 一次
      if (data?.holdings) {
        setHoldings(data.holdings)
      } else {
        await fetchHoldings()
      }
    } finally {
      isLoading.value = false
    }
  }

  // 一些方便的彙總值（可選）
  const totalValue: ComputedRef<number> = computed(() =>
    list.value.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0)
  )
  const totalProfit: ComputedRef<number> = computed(() =>
    list.value.reduce((sum, h) => sum + (Number(h.totalProfit) || 0), 0)
  )

  return {
    // state
    list,
    isLoading,
    // computed
    uid,
    portfolioId,
    totalValue,
    totalProfit,
    // actions
    fetchHoldings,
    deleteHoldings,
    refreshPrices,
    setHoldings // for testing purposes
  }
})