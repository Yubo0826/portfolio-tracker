import { defineStore } from 'pinia'
import { ref, watch, type Ref } from 'vue'

export type DisplayCurrency = 'USD' | 'TWD'

interface ExchangeRateData {
  rate: number
  lastUpdated: string
  source: string
}

const STORAGE_KEY = 'portfolio-tracker-settings'
const EXCHANGE_RATE_CACHE_KEY = 'portfolio-tracker-exchange-rate'
const CACHE_DURATION = 1000 * 60 * 60 // 1 小時

// 從 localStorage 讀取設定
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Error loading settings from localStorage:', e)
  }
  return null
}

// 從 localStorage 讀取匯率快取
const loadExchangeRateCache = (): ExchangeRateData | null => {
  try {
    const stored = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      const lastUpdated = new Date(data.lastUpdated).getTime()
      const now = Date.now()
      
      // 檢查快取是否過期
      if (now - lastUpdated < CACHE_DURATION) {
        return data
      }
    }
  } catch (e) {
    console.error('Error loading exchange rate cache:', e)
  }
  return null
}

export const useSettingsStore = defineStore('settings', () => {
  // 載入儲存的設定
  const savedSettings = loadSettings()
  const cachedRate = loadExchangeRateCache()
  
  // State
  const displayCurrency: Ref<DisplayCurrency> = ref(savedSettings?.displayCurrency || 'USD')
  const exchangeRate: Ref<number> = ref(cachedRate?.rate || 31.5) // 預設匯率
  const lastRateUpdate: Ref<string> = ref(cachedRate?.lastUpdated || '')
  const isLoadingRate: Ref<boolean> = ref(false)
  const rateSource: Ref<string> = ref(cachedRate?.source || '')

  // 儲存設定到 localStorage
  const saveSettings = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        displayCurrency: displayCurrency.value
      }))
    } catch (e) {
      console.error('Error saving settings to localStorage:', e)
    }
  }

  // 儲存匯率快取
  const saveExchangeRateCache = () => {
    try {
      localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify({
        rate: exchangeRate.value,
        lastUpdated: lastRateUpdate.value,
        source: rateSource.value
      }))
    } catch (e) {
      console.error('Error saving exchange rate cache:', e)
    }
  }

  // 監聽設定變化，自動儲存
  watch(displayCurrency, () => {
    saveSettings()
  })

  // 設定顯示幣別
  const setDisplayCurrency = (currency: DisplayCurrency) => {
    displayCurrency.value = currency
  }

  // 切換幣別
  const toggleCurrency = () => {
    displayCurrency.value = displayCurrency.value === 'USD' ? 'TWD' : 'USD'
  }

  // 獲取即時匯率
  const fetchExchangeRate = async (): Promise<void> => {
    // 先檢查快取
    const cached = loadExchangeRateCache()
    if (cached) {
      exchangeRate.value = cached.rate
      lastRateUpdate.value = cached.lastUpdated
      rateSource.value = cached.source
      return
    }

    try {
      isLoadingRate.value = true
      
      // 使用免費的匯率 API (exchangerate-api.com 提供免費額度)
      // 備用方案：使用台灣央行的資料或其他 API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rate')
      }
      
      const data = await response.json()
      
      if (data.rates?.TWD) {
        exchangeRate.value = data.rates.TWD
        lastRateUpdate.value = new Date().toISOString()
        rateSource.value = 'exchangerate-api.com'
        saveExchangeRateCache()
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error)
      // 使用備用匯率
      if (!exchangeRate.value) {
        exchangeRate.value = 31.5
        rateSource.value = 'fallback'
      }
    } finally {
      isLoadingRate.value = false
    }
  }

  // 手動設定匯率
  const setExchangeRate = (rate: number) => {
    exchangeRate.value = rate
    lastRateUpdate.value = new Date().toISOString()
    rateSource.value = 'manual'
    saveExchangeRateCache()
  }

  // 格式化金額顯示的最後更新時間
  const getLastUpdateDisplay = (): string => {
    if (!lastRateUpdate.value) return ''
    
    const date = new Date(lastRateUpdate.value)
    return date.toLocaleString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return {
    // State
    displayCurrency,
    exchangeRate,
    lastRateUpdate,
    isLoadingRate,
    rateSource,
    
    // Actions
    setDisplayCurrency,
    toggleCurrency,
    fetchExchangeRate,
    setExchangeRate,
    getLastUpdateDisplay
  }
})
