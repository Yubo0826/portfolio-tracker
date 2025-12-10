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
  })

  describe('formatPrice', () => {
    it('應該格式化股價（2位小數）', () => {
      const { formatPrice } = useCurrency()
      
      expect(formatPrice(123.456)).toBe('$123.46')
      expect(formatPrice(0.01)).toBe('$0.01')
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
      expect(currencySymbol.value).toBe('USD')
    })
  })
})
