import { defineStore } from 'pinia'
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import api from '@/utils/api.js'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'

interface DividendData {
  id: string
  symbol: string
  name: string
  shares: number | string
  amount: number | string
  date: string
}

interface Dividend {
  id: string
  symbol: string
  name: string
  shares: number
  amount: number
  totalAmount: string
  date: string
}

export const useDividendsStore = defineStore('dividends', () => {
  const list: Ref<Dividend[]> = ref([])
  const isLoading: Ref<boolean> = ref(false)

  const auth = useAuthStore()
  const portfolioStore = usePortfolioStore()

  const uid: ComputedRef<string | null> = computed(() => auth.user?.uid || null)
  const portfolioId: ComputedRef<string | null> = computed(() => portfolioStore.currentPortfolio?.id || null)

  const setDividends = (data: DividendData[] = []): void => {
    list.value = data.map(item => ({
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      shares: Number(item.shares),
      amount: Number(item.amount),
      totalAmount: (Number(item.shares) * Number(item.amount)).toFixed(2),
      date: item.date.slice(0, 10),
    }))
  }

  const fetchDividends = async (): Promise<void> => {
    if (!uid.value || !portfolioId.value) return
    isLoading.value = true
    try {
      const data = await api.get(`/api/dividends?uid=${uid.value}&portfolio_id=${portfolioId.value}`)
      setDividends(data)
    } catch (error) {
      console.error('Error fetching dividends:', error)
    } finally {
      isLoading.value = false
    }
  }

  const refreshDividends = async (): Promise<void> => {
    if (!uid.value || !portfolioId.value) return
    isLoading.value = true
    try {
      const payload = { uid: uid.value, portfolio_id: portfolioId.value }
      const data = await api.post('/api/dividends/sync', payload)
      setDividends(data.dividends)
    } catch (error) {
      console.error('Error refreshing dividends:', error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    list,
    isLoading,
    fetchDividends,
    refreshDividends,
    setDividends,
  }
})
