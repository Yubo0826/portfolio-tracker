import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

export const useCurrency = () => {
  const settingsStore = useSettingsStore()
  const { displayCurrency, exchangeRate, isLoadingRate, lastRateUpdate, rateSource } = storeToRefs(settingsStore)
  const { toggleCurrency, fetchExchangeRate, setExchangeRate, getLastUpdateDisplay } = settingsStore

  // 當前幣別符號
  const currencySymbol = computed(() => {
    return displayCurrency.value === 'TWD' ? 'NT$' : '$'
  })

  // 當前幣別代碼
  const currencyCode = computed(() => {
    return displayCurrency.value
  })

  // 是否顯示台幣
  const isTWD = computed(() => displayCurrency.value === 'TWD')

  /**
   * 轉換金額（USD -> 當前幣別）
   * @param usdAmount 美金金額
   * @returns 轉換後的金額數字
   */
  const convertAmount = (usdAmount: number | null | undefined): number => {
    if (usdAmount == null || isNaN(usdAmount)) return 0
    
    if (displayCurrency.value === 'TWD') {
      return usdAmount * exchangeRate.value
    }
    return usdAmount
  }

  /**
   * 格式化金額顯示（包含幣別符號）
   * @param usdAmount 美金金額
   * @param options 格式化選項
   * @returns 格式化後的字串
   */
  const formatAmount = (
    usdAmount: number | null | undefined,
    options: {
      showSymbol?: boolean
      minimumFractionDigits?: number
      maximumFractionDigits?: number
      compact?: boolean
    } = {}
  ): string => {
    const {
      showSymbol = true,
      minimumFractionDigits,
      maximumFractionDigits,
      compact = false
    } = options

    if (usdAmount == null || isNaN(usdAmount)) {
      return showSymbol ? `${currencySymbol.value}--` : '--'
    }

    const converted = convertAmount(usdAmount)
    
    // 根據幣別設定預設小數位數
    const defaultMinDigits = displayCurrency.value === 'TWD' ? 0 : 2
    const defaultMaxDigits = displayCurrency.value === 'TWD' ? 0 : 2

    // 確保 min 不大於 max
    let minDigits = minimumFractionDigits ?? defaultMinDigits
    let maxDigits = maximumFractionDigits ?? defaultMaxDigits
    
    // 如果明確指定了 max，確保 min 不超過 max
    if (maximumFractionDigits !== undefined && minDigits > maxDigits) {
      minDigits = maxDigits
    }
    // 如果明確指定了 min，確保 max 不小於 min
    if (minimumFractionDigits !== undefined && maxDigits < minDigits) {
      maxDigits = minDigits
    }

    const formatOptions: Intl.NumberFormatOptions = {
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits
    }

    if (compact && Math.abs(converted) >= 10000) {
      // 使用緊湊格式顯示大數字
      const formatted = new Intl.NumberFormat(
        displayCurrency.value === 'TWD' ? 'zh-TW' : 'en-US',
        { ...formatOptions, notation: 'compact', compactDisplay: 'short' }
      ).format(converted)
      
      return showSymbol ? `${currencySymbol.value}${formatted}` : formatted
    }

    const formatted = converted.toLocaleString(
      displayCurrency.value === 'TWD' ? 'zh-TW' : 'en-US',
      formatOptions
    )

    if (!showSymbol) return formatted

    // 處理負數：將負號放在幣別符號前面
    if (converted < 0) {
      return `-${currencySymbol.value}${formatted.replace('-', '')}`
    }

    return `${currencySymbol.value}${formatted}`
  }

  /**
   * 格式化金額變化（帶正負號）
   * @param usdAmount 美金金額
   * @param options 格式化選項
   * @returns 格式化後的字串
   */
  const formatChange = (
    usdAmount: number | null | undefined,
    options: {
      showSymbol?: boolean
      minimumFractionDigits?: number
      maximumFractionDigits?: number
    } = {}
  ): string => {
    if (usdAmount == null || isNaN(usdAmount)) {
      return '--'
    }

    const formatted = formatAmount(usdAmount, options)
    
    if (usdAmount > 0) {
      return `+${formatted}`
    }
    return formatted
  }

  /**
   * 格式化價格（股價等，通常需要更多小數位）
   * @param usdPrice 美金價格
   * @returns 格式化後的字串
   */
  const formatPrice = (usdPrice: number | null | undefined): string => {
    return formatAmount(usdPrice, {
      showSymbol: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  /**
   * 取得匯率顯示文字
   * @returns 匯率資訊字串
   */
  const getRateInfo = (): string => {
    if (displayCurrency.value === 'USD') return ''
    
    const lastUpdate = getLastUpdateDisplay()
    const sourceText = rateSource.value === 'manual' ? '手動設定' : '自動更新'
    
    return `1 USD = ${exchangeRate.value.toFixed(2)} TWD (${sourceText}${lastUpdate ? `, ${lastUpdate}` : ''})`
  }

  return {
    // State
    displayCurrency,
    exchangeRate,
    isLoadingRate,
    lastRateUpdate,
    currencySymbol,
    currencyCode,
    isTWD,
    
    // Methods
    convertAmount,
    formatAmount,
    formatChange,
    formatPrice,
    toggleCurrency,
    fetchExchangeRate,
    setExchangeRate,
    getRateInfo,
    getLastUpdateDisplay
  }
}
