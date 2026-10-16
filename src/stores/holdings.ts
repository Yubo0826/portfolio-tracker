// src/stores/holdings.js
import { defineStore } from 'pinia'
import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import api from '@/utils/api.js'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'
import { useCurrency } from '@/composables/useCurrency'

interface HoldingData {
  id: string
  symbol: string
  name: string
  asset_type: string
  total_shares: string | number
  avg_cost: string | number
  current_price: string | number
  total_cost_usd?: string | number | null
  currency?: string
  target_percentage: string | number
  last_updated?: string
}

interface Holding {
  id: string
  symbol: string
  name: string
  assetType: string
  currency: string
  shares: number
  nativeCurrentPrice: number
  nativeAvgCost: number
  nativeTotalCost: number
  nativeCurrentValue: number
  nativeTotalProfit: number
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
  const rawList: Ref<HoldingData[]> = ref([])
  const list: Ref<HoldingsList> = ref([])          // holdings array（view model）
  const isLoading: Ref<boolean> = ref(false)

  const auth = useAuthStore()
  const portfolioStore = usePortfolioStore()
  const { rates, convertAmountToUsd } = useCurrency()

  const uid: ComputedRef<string | null> = computed(() => auth.user?.uid || null)
  const portfolioId: ComputedRef<string | null> = computed(() => portfolioStore.currentPortfolio?.id || null)

  const roundAmount = (value: number): number => Math.round(value * 100) / 100

  const recalculateHoldings = (): void => {
    list.value = rawList.value.map(item => {
      const shares = parseFloat(String(item.total_shares)) || 0
      const avgCostRaw = parseFloat(String(item.avg_cost)) || 0
      const currentPriceRaw = parseFloat(String(item.current_price)) || 0
      const currency = String(item.currency || 'USD').toUpperCase()
      const target = parseFloat(String(item.target_percentage)) || 0
      const lastUpdated = item.last_updated?.split('T')[0] || ''
      // 後端已用各筆買入「當時的匯率」算好美金成本；舊資料沒有這個值時才退回用當下匯率，
      // 退回時成本會隨匯率浮動（也就是加 fx_rate 之前的行為）
      const storedCostUsd = item.total_cost_usd == null ? null : Number(item.total_cost_usd)

      // 一律換算成美金保存；顯示端由 formatAmount* 再轉成使用者的顯示幣別。
      // 這裡若直接轉成顯示幣別，畫面上會被 formatAmount* 轉第二次。
      // native* 為原幣金額，給單一標的的欄位以原幣顯示；加總與排序用美金欄位
      const nativeTotalCost = roundAmount(avgCostRaw * shares)
      const nativeCurrentValue = roundAmount(currentPriceRaw * shares)
      const currentPrice = roundAmount(convertAmountToUsd(currentPriceRaw, currency))
      const totalCost = roundAmount(
        storedCostUsd != null && storedCostUsd > 0
          ? storedCostUsd
          : convertAmountToUsd(avgCostRaw * shares, currency)
      )
      const avgCost = shares > 0 ? roundAmount(totalCost / shares) : 0
      const currentValue = roundAmount(convertAmountToUsd(currentPriceRaw * shares, currency))
      const totalProfit = roundAmount(currentValue - totalCost)
      const profitPercentage = ((currentValue / (totalCost || 1)) * 100 - 100).toFixed(2)

      return {
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        assetType: item.asset_type,
        currency,
        shares,
        nativeCurrentPrice: currentPriceRaw,
        nativeAvgCost: avgCostRaw,
        nativeTotalCost,
        nativeCurrentValue,
        nativeTotalProfit: roundAmount(nativeCurrentValue - nativeTotalCost),
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

    list.value.totalValue = list.value.reduce((sum, h) => sum + h.currentValue, 0)

    list.value.forEach(h => {
      h.actualRatio = list.value.totalValue ? ((h.currentValue / list.value.totalValue) * 100).toFixed(2) : '0.00'
    })
  }

  // 將後端資料轉成前端需要的格式
  const setHoldings = (data: HoldingData[] = []): void => {
    rawList.value = data
    recalculateHoldings()
  }

  // 金額以美金保存，切換顯示幣別不需要重算；但非美金持股的美金值會隨匯率變動
  watch(rates, () => {
    recalculateHoldings()
  }, { deep: true })

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
    rawList,
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