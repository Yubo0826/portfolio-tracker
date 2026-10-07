import { defineStore } from 'pinia'
import { ref, computed, type Ref } from 'vue'
import api from '@/utils/api.js'
import { useAuthStore } from '@/stores/auth'

export interface WatchlistItem {
  symbol: string
  name: string | null
  asset_type: string | null
  target_price: number | null
  alert_above: boolean | null
  regularMarketPrice: number | null
  regularMarketChange: number | null
  regularMarketChangePercent: number | null
  currency: string | null
}

// 後端用 token 認人，uid 不必帶
export const useWatchlistStore = defineStore('watchlist', () => {
  const items: Ref<WatchlistItem[]> = ref([])
  const isLoading = ref(false)

  const auth = useAuthStore()
  const isReadOnly = computed(() => !auth.user || auth.user.uid === 'demo-user')
  const symbolSet = computed(() => new Set(items.value.map(i => i.symbol)))

  const fetchWatchlist = async (): Promise<void> => {
    isLoading.value = true
    try {
      const data: WatchlistItem[] = await api.get('/api/watchlist')
      items.value = data.map(i => ({ ...i, target_price: i.target_price == null ? null : Number(i.target_price) }))
    } catch (error) {
      console.error('Error fetching watchlist:', error)
    } finally {
      isLoading.value = false
    }
  }

  const addSymbol = async (symbol: string, name?: string | null, assetType?: string | null): Promise<void> => {
    await api.post('/api/watchlist', { symbol, name, asset_type: assetType })
    await fetchWatchlist()
  }

  const removeSymbol = async (symbol: string): Promise<void> => {
    await api.delete(`/api/watchlist/${encodeURIComponent(symbol)}`)
    items.value = items.value.filter(i => i.symbol !== symbol)
  }

  // 方向依目前價格判斷：目標價高於現價就是「漲到」才通知
  const setTarget = async (symbol: string, targetPrice: number | null): Promise<void> => {
    const item = items.value.find(i => i.symbol === symbol)
    const alertAbove = targetPrice != null && targetPrice > (item?.regularMarketPrice ?? 0)
    await api.put(`/api/watchlist/${encodeURIComponent(symbol)}`, { target_price: targetPrice, alert_above: alertAbove })
    if (item) Object.assign(item, { target_price: targetPrice, alert_above: targetPrice == null ? null : alertAbove })
  }

  return { items, isLoading, isReadOnly, symbolSet, fetchWatchlist, addSymbol, removeSymbol, setTarget }
})
