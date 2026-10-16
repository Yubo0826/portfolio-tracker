import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { getCurrencyMeta, getCurrencySymbol, getDecimalSeparator, normalizeCurrency } from '@/utils/currency'

export const useCurrency = () => {
  const settingsStore = useSettingsStore()
  const { displayCurrency, rates, exchangeRate, isLoadingRate, lastRateUpdate, rateSource } = storeToRefs(settingsStore)
  const { rateOf, toggleCurrency, fetchExchangeRate, setExchangeRate, getLastUpdateDisplay } = settingsStore

  // 當前幣別符號
  const currencySymbol = computed(() => getCurrencySymbol(displayCurrency.value))

  // 當前幣別代碼
  const currencyCode = computed(() => {
    return displayCurrency.value
  })

  // 是否顯示台幣
  const isTWD = computed(() => displayCurrency.value === 'TWD')

  /**
   * 依來源幣別轉成目前顯示幣別（一律經過 USD 這個基準幣中轉）。
   */
  const convertAmountFromCurrency = (
    amount: number | null | undefined,
    sourceCurrency: string | null | undefined = 'USD'
  ): number => {
    if (amount == null || isNaN(amount)) return 0

    const fromCurrency = normalizeCurrency(sourceCurrency)
    const toCurrency = displayCurrency.value

    if (fromCurrency === toCurrency) {
      return amount
    }

    const usd = convertAmountToUsd(amount, fromCurrency)
    const targetRate = rateOf(toCurrency)

    // 匯率表還沒載到該幣別時寧可原樣顯示，也不要乘上錯誤的倍率
    return targetRate > 0 ? usd * targetRate : amount
  }

  /**
   * 依來源幣別轉成 USD。
   *
   * 資料層（store / computed）一律以美金保存金額，顯示時才由 formatAmount* 系列
   * 轉成使用者的顯示幣別。若在資料層就轉成顯示幣別，之後再餵給 formatAmount*
   * 會被轉第二次（formatAmount 內部會呼叫 convertAmount）。
   */
  const convertAmountToUsd = (
    amount: number | null | undefined,
    sourceCurrency: string | null | undefined = 'USD'
  ): number => {
    if (amount == null || isNaN(amount)) return 0

    const fromCurrency = normalizeCurrency(sourceCurrency)
    if (fromCurrency === 'USD') return amount

    const sourceRate = rateOf(fromCurrency)

    // 匯率表沒有這個幣別（API 尚未回來，或非支援幣別）時原樣回傳，
    // 寧可讓加總偏少也不要把 100 JPY 當成 100 USD 灌爆投組總值
    return sourceRate > 0 ? amount / sourceRate : amount
  }

  /**
   * 依「成交當時的匯率」把原幣金額換算成 USD。
   *
   * 成本用這個、市值用 convertAmountToUsd（今日匯率），兩者相減才分得出
   * 股價損益與匯兌損益，歷史成本也不會每天跟著匯率變。
   * fxRate 缺漏（後端抓不到、或加這個欄位之前的舊資料）時退回用當下匯率。
   */
  const convertAmountToUsdAt = (
    amount: number | null | undefined,
    sourceCurrency: string | null | undefined,
    fxRate: number | null | undefined
  ): number => {
    if (amount == null || isNaN(amount)) return 0
    if (!(Number(fxRate) > 0)) return convertAmountToUsd(amount, sourceCurrency)
    return amount / Number(fxRate)
  }

  /**
   * 轉換金額（USD -> 當前幣別）
   * @param usdAmount 美金金額
   * @returns 轉換後的金額數字
   */
  const convertAmount = (usdAmount: number | null | undefined): number => {
    return convertAmountFromCurrency(usdAmount, 'USD')
  }

  /**
   * 格式化金額顯示（包含幣別符號）
   * @param usdAmount 美金金額；有給 options.currency 時視為該幣別的原幣金額，不換算
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
      currency?: string | null
    } = {}
  ): string => {
    const {
      showSymbol = true,
      minimumFractionDigits,
      maximumFractionDigits,
      compact = false
    } = options

    // 個別標的以原幣顯示；沒指定時才換成偏好設定的顯示幣別
    const code = options.currency ? normalizeCurrency(options.currency) : displayCurrency.value
    const meta = getCurrencyMeta(code)
    const symbol = getCurrencySymbol(code)

    if (usdAmount == null || isNaN(usdAmount)) {
      return showSymbol ? `${symbol}--` : '--'
    }

    const converted = options.currency ? usdAmount : convertAmount(usdAmount)

    // 根據幣別設定預設小數位數（JPY / KRW / TWD 習慣不顯示小數）
    const defaultMinDigits = meta.fractionDigits
    const defaultMaxDigits = meta.fractionDigits

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
        meta.locale,
        { ...formatOptions, notation: 'compact', compactDisplay: 'short' }
      ).format(converted)

      return showSymbol ? `${symbol}${formatted}` : formatted
    }

    const formatted = converted.toLocaleString(meta.locale, formatOptions)

    if (!showSymbol) return formatted

    // 處理負數：將負號放在幣別符號前面
    if (converted < 0) {
      return `-${symbol}${formatted.replace('-', '')}`
    }

    return `${symbol}${formatted}`
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
      currency?: string | null
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
   * 格式化金額顯示（數字在前 + 幣別代碼在後）
   * 例如：1,234.56 USD / 35,000 TWD
   */
  const formatAmountWithCode = (
    usdAmount: number | null | undefined,
    options: {
      minimumFractionDigits?: number
      maximumFractionDigits?: number
      compact?: boolean
      currency?: string | null
    } = {}
  ): string => {
    const formatted = formatAmount(usdAmount, { ...options, showSymbol: false })
    if (formatted === '--') return '--'
    return `${formatted} ${options.currency ? normalizeCurrency(options.currency) : currencyCode.value}`
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
      maximumFractionDigits: 3
    })
  }

  const formatPriceWithCode = (usdPrice: number | null | undefined, currency?: string | null): string => {
    // 無小數幣別（JPY / KRW / TWD）的股價不該補成 1,234.00
    const digits = getCurrencyMeta(currency ?? displayCurrency.value).fractionDigits
    return formatAmountWithCode(usdPrice, {
      minimumFractionDigits: digits === 0 ? 0 : 2,
      maximumFractionDigits: digits === 0 ? 2 : 3,
      currency
    })
  }

  /**
   * 把「數字 + 幣別代碼」拆成三段，讓表格能把小數與幣別代碼用較小字級排版。
   * 例如 1,234.56 USD -> { main: '1,234', fraction: '.56', code: 'USD' }
   * @param value 美金金額；有給 currency 時視為該幣別的原幣金額，不換算
   * @param mode 'amount' 走 formatAmountWithCode，'price' 走 formatPriceWithCode（小數位較多）
   */
  const splitDisplayAmount = (
    value: number | null | undefined,
    mode: 'amount' | 'price' = 'amount',
    currency?: string | null
  ): { main: string; fraction: string; code: string } => {
    const formatted = mode === 'price' ? formatPriceWithCode(value, currency) : formatAmountWithCode(value, { currency })
    if (formatted === '--') {
      return { main: '--', fraction: '', code: '' }
    }

    const match = formatted.match(/^(.+)\s([A-Z]{3})$/)
    if (!match) {
      return { main: formatted, fraction: '', code: '' }
    }

    const [, numberPart, code] = match

    // 不能直接用 /[.,]\d+$/ 比對：zh-TW 的 562,750 會把千分位當成小數，
    // 要依 locale 取得真正的小數分隔符號（de-DE 是逗號，en-US 是點）
    const separator = getDecimalSeparator(getCurrencyMeta(currency ?? displayCurrency.value).locale)
    const index = numberPart.lastIndexOf(separator)
    const hasFraction = index > -1 && /^\d+$/.test(numberPart.slice(index + 1))

    return {
      main: hasFraction ? numberPart.slice(0, index) : numberPart,
      fraction: hasFraction ? numberPart.slice(index) : '',
      code
    }
  }

  /**
   * 取得匯率顯示文字
   * @returns 匯率資訊字串
   */
  const getRateInfo = (): string => {
    if (displayCurrency.value === 'USD') return ''

    const rate = rateOf(displayCurrency.value)
    if (!(rate > 0)) return ''

    const lastUpdate = getLastUpdateDisplay()
    const sourceText = rateSource.value === 'manual' ? '手動設定' : '自動更新'

    return `1 USD = ${rate.toFixed(2)} ${displayCurrency.value} (${sourceText}${lastUpdate ? `, ${lastUpdate}` : ''})`
  }

  return {
    // State
    displayCurrency,
    rates,
    exchangeRate,
    isLoadingRate,
    lastRateUpdate,
    currencySymbol,
    currencyCode,
    isTWD,
    
    // Methods
    rateOf,
    convertAmount,
    convertAmountToUsdAt,
    convertAmountFromCurrency,
    convertAmountToUsd,
    formatAmount,
    formatAmountWithCode,
    formatChange,
    formatPrice,
    formatPriceWithCode,
    splitDisplayAmount,
    toggleCurrency,
    fetchExchangeRate,
    setExchangeRate,
    getRateInfo,
    getLastUpdateDisplay
  }
}
