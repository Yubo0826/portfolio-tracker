import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useCurrency } from '../useCurrency'

describe('useCurrency', () => {
  beforeEach(() => {
    // 每次測試前創建新的 Pinia 實例
    setActivePinia(createPinia())
  })

  describe('formatAmount', () => {
    it('應該格式化美元金額', () => {
      const { formatAmount } = useCurrency()
      
      expect(formatAmount(1234.56)).toBe('$1,234.56')
      expect(formatAmount(0)).toBe('$0.00')
      expect(formatAmount(1000000)).toBe('$1,000,000.00')
    })

    it('應該處理負數', () => {
      const { formatAmount } = useCurrency()
      
      expect(formatAmount(-1234.56)).toBe('-$1,234.56')
    })

    it('應該使用自訂選項', () => {
      const { formatAmount } = useCurrency()
      
      expect(formatAmount(1234.567, { maximumFractionDigits: 0 })).toBe('$1,235')
      expect(formatAmount(1234.567, { minimumFractionDigits: 3 })).toBe('$1,234.567')
    })

    it('指定 currency 時以原幣顯示，不受顯示幣別與匯率影響', () => {
      const { formatAmountWithCode, splitDisplayAmount, displayCurrency, setExchangeRate } = useCurrency()

      displayCurrency.value = 'USD'
      setExchangeRate(32)

      // 台股持股在顯示幣別為 USD 時仍顯示台幣，不能被貼上 USD 標籤
      expect(formatAmountWithCode(562750, { currency: 'TWD' })).toBe('562,750 TWD')
      expect(splitDisplayAmount(34.15, 'price', 'TWD')).toEqual({ main: '34', fraction: '.15', code: 'TWD' })
      // 千分位逗號不是小數：562,750 TWD 不能被拆成 562 + ,750
      expect(splitDisplayAmount(562750, 'amount', 'TWD')).toEqual({ main: '562,750', fraction: '', code: 'TWD' })
      // 沒指定 currency 的加總值照舊依顯示幣別換算
      displayCurrency.value = 'TWD'
      expect(formatAmountWithCode(100)).toBe('3,200 TWD')
      expect(formatAmountWithCode(300.13, { currency: 'USD' })).toBe('300.13 USD')
      displayCurrency.value = 'USD' // 顯示幣別會存進 localStorage，還原避免影響其他測試
    })
  })

  describe('formatPrice', () => {
    it('應該格式化股價（2~3 位小數，對應 DB 的 Decimal(10,3)）', () => {
      const { formatPrice } = useCurrency()
      
      expect(formatPrice(123.456)).toBe('$123.456')
      expect(formatPrice(123.4)).toBe('$123.40')
      expect(formatPrice(0.01)).toBe('$0.01')
    })
  })

  describe('多幣別（日股 / 港股）', () => {
    // 1 USD = 31.5 TWD / 150 JPY / 7.8 HKD
    const useRates = () => {
      const currency = useCurrency()
      currency.rates.value = { USD: 1, TWD: 31.5, JPY: 150, HKD: 7.8 }
      return currency
    }

    it('非美金持股換算成基準幣 USD', () => {
      const { convertAmountToUsd } = useRates()

      expect(convertAmountToUsd(15000, 'JPY')).toBe(100)
      expect(convertAmountToUsd(780, 'HKD')).toBe(100)
      expect(convertAmountToUsd(100, 'USD')).toBe(100)
    })

    it('匯率表沒有的幣別原樣回傳，不會被當成美金灌爆總值', () => {
      const { convertAmountToUsd } = useRates()

      expect(convertAmountToUsd(1000, 'BRL')).toBe(1000)
    })

    it('跨幣別經由 USD 中轉到顯示幣別', () => {
      const { convertAmountFromCurrency, displayCurrency } = useRates()

      displayCurrency.value = 'TWD'
      // 15,000 JPY = 100 USD = 3,150 TWD
      expect(convertAmountFromCurrency(15000, 'JPY')).toBe(3150)
      displayCurrency.value = 'USD'
    })

    it('原幣顯示用該幣別的符號與小數位（日圓不補小數）', () => {
      const { formatAmount, formatAmountWithCode, splitDisplayAmount } = useRates()

      expect(formatAmount(3094, { currency: 'JPY' })).toBe('¥3,094')
      expect(formatAmount(417.4, { currency: 'HKD' })).toBe('HK$417.40')
      expect(formatAmountWithCode(3094, { currency: 'JPY' })).toBe('3,094 JPY')
      expect(splitDisplayAmount(3094, 'price', 'JPY')).toEqual({ main: '3,094', fraction: '', code: 'JPY' })
    })
  })

  describe('convertAmountToUsdAt（成交當時匯率）', () => {
    it('有 fxRate 就用它，不受今日匯率影響', () => {
      const { convertAmountToUsdAt, rates } = useCurrency()
      rates.value = { USD: 1, JPY: 150 }

      // 2024 年買進時 1 USD = 100 JPY，今天是 150，成本仍是 100 USD
      expect(convertAmountToUsdAt(10000, 'JPY', 100)).toBe(100)
    })

    it('沒有 fxRate 的舊資料退回用今日匯率', () => {
      const { convertAmountToUsdAt, rates } = useCurrency()
      rates.value = { USD: 1, JPY: 150 }

      expect(convertAmountToUsdAt(15000, 'JPY', null)).toBe(100)
      expect(convertAmountToUsdAt(15000, 'JPY', 0)).toBe(100)
    })
  })

  describe('convertAmountFromCurrency', () => {
    it('應該把 USD 轉成 TWD', () => {
      const { convertAmountFromCurrency, displayCurrency, setExchangeRate } = useCurrency()

      displayCurrency.value = 'TWD'
      setExchangeRate(32)

      expect(convertAmountFromCurrency(100, 'USD')).toBe(3200)
    })

    it('應該把 TWD 轉成 USD', () => {
      const { convertAmountFromCurrency, displayCurrency, setExchangeRate } = useCurrency()

      displayCurrency.value = 'USD'
      setExchangeRate(32)

      expect(convertAmountFromCurrency(3200, 'TWD')).toBe(100)
    })
  })

  describe('formatChange', () => {
    it('應該格式化正數變化', () => {
      const { formatChange } = useCurrency()
      
      expect(formatChange(123.45)).toBe('+$123.45')
    })

    it('應該格式化負數變化', () => {
      const { formatChange } = useCurrency()
      
      expect(formatChange(-123.45)).toBe('-$123.45')
    })

    it('應該處理零', () => {
      const { formatChange } = useCurrency()
      
      expect(formatChange(0)).toBe('$0.00')
    })
  })

  describe('貨幣切換', () => {
    it('應該在 USD 和 TWD 之間切換', () => {
      const { displayCurrency, currencySymbol } = useCurrency()
      
      // 預設應該是 USD
      expect(displayCurrency.value).toBe('USD')
      expect(currencySymbol.value).toBe('$')
    })
  })
})
