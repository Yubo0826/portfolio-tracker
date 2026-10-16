import { defineStore } from 'pinia'
import { computed, ref, watch, type Ref, type WritableComputedRef } from 'vue'
import { PRIMARY_CURRENCIES, SUPPORTED_CURRENCIES, getCurrencySymbol, normalizeCurrency } from '@/utils/currency'

/**
 * 顯示幣別。持股本身可以是任何幣別（由報價決定），這裡只限制「總覽要換算成哪一種」，
 * 選項太多反而難選，所以只開放常用的幾種。
 */
export type DisplayCurrency = string

// 可選幣別（供 header 設定彈窗與偏好設定頁共用）
export const CURRENCY_OPTIONS: { value: DisplayCurrency; code: string; symbol: string }[] =
  PRIMARY_CURRENCIES.map((code) => ({ value: code, code, symbol: getCurrencySymbol(code) }))

/**
 * 以 USD 為基準的匯率表：rates[code] = 1 USD 可換得多少 code。
 * 舊版只存單一 TWD 匯率（rate），載入時自動升級成 rates。
 */
export type ExchangeRates = Record<string, number>

interface ExchangeRateData {
  rates: ExchangeRates
  lastUpdated: string
  source: string
}

const DEFAULT_RATES: ExchangeRates = { USD: 1, TWD: 31.5 }

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
        // 舊版快取只有單一 TWD 匯率，補成 rates 表避免讀到 undefined
        const rates: ExchangeRates = data.rates || { ...DEFAULT_RATES, TWD: data.rate }
        return { ...data, rates: { ...rates, USD: 1 } }
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
  const rates: Ref<ExchangeRates> = ref(cachedRate?.rates || { ...DEFAULT_RATES })

  /** 1 USD 可換多少 currency；查不到時回 0，由呼叫端決定不換算 */
  const rateOf = (currency: string | null | undefined): number => {
    const code = normalizeCurrency(currency)
    if (code === 'USD') return 1
    return Number(rates.value[code]) || 0
  }

  // 相容舊介面：全站仍有多處直接讀寫美金兌台幣匯率
  const exchangeRate: WritableComputedRef<number> = computed({
    get: () => rateOf('TWD') || DEFAULT_RATES.TWD,
    set: (rate: number) => { rates.value = { ...rates.value, TWD: rate } },
  })
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
        rates: rates.value,
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
  // 快速切換只在美金與台幣之間來回；其他幣別到偏好設定頁選
  const toggleCurrency = () => {
    displayCurrency.value = displayCurrency.value === 'USD' ? 'TWD' : 'USD'
  }

  // 獲取即時匯率
  const fetchExchangeRate = async (): Promise<void> => {
    // 先檢查快取
    const cached = loadExchangeRateCache()
    if (cached) {
      rates.value = cached.rates
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
      
      // 回應含 160+ 種幣別，只留下會用到的，避免 localStorage 塞一堆用不到的值
      if (data.rates?.TWD) {
        const next: ExchangeRates = { USD: 1 }
        SUPPORTED_CURRENCIES.forEach((code) => {
          const rate = Number(data.rates[code])
          if (rate > 0) next[code] = rate
        })
        rates.value = next
        lastRateUpdate.value = new Date().toISOString()
        rateSource.value = 'exchangerate-api.com'
        saveExchangeRateCache()
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error)
      // 使用備用匯率
      if (!rateOf('TWD')) {
        rates.value = { ...rates.value, ...DEFAULT_RATES }
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
    rates,
    exchangeRate,
    lastRateUpdate,
    isLoadingRate,
    rateSource,
    
    // Actions
    rateOf,
    setDisplayCurrency,
    toggleCurrency,
    fetchExchangeRate,
    setExchangeRate,
    getLastUpdateDisplay
  }
})
