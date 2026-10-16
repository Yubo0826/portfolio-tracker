import { describe, it, expect } from 'vitest'
import {
  fromQuoteCurrency,
  getCurrencyMeta,
  getCurrencySymbol,
  normalizeCurrency,
  normalizeQuoteCurrency,
} from '../currency'

describe('normalizeCurrency', () => {
  it('缺值時視為美金', () => {
    expect(normalizeCurrency(null)).toBe('USD')
    expect(normalizeCurrency('')).toBe('USD')
    expect(normalizeCurrency(' jpy ')).toBe('JPY')
  })
})

describe('fromQuoteCurrency', () => {
  it('主幣代碼原樣通過', () => {
    expect(fromQuoteCurrency(3094, 'JPY')).toEqual({ amount: 3094, currency: 'JPY' })
    expect(fromQuoteCurrency(417.4, 'HKD')).toEqual({ amount: 417.4, currency: 'HKD' })
  })

  it('輔幣代碼要連金額一起換回主幣（GBp 是便士，不是英鎊）', () => {
    expect(fromQuoteCurrency(605.7, 'GBp')).toEqual({ amount: 6.057, currency: 'GBP' })
    expect(fromQuoteCurrency(1000, 'ZAc')).toEqual({ amount: 10, currency: 'ZAR' })
  })

  it('輔幣比對大小寫有意義：GBP 是英鎊，不該被除以 100', () => {
    expect(fromQuoteCurrency(605.7, 'GBP')).toEqual({ amount: 605.7, currency: 'GBP' })
  })

  it('只要代碼時不需要金額', () => {
    expect(normalizeQuoteCurrency('GBp')).toBe('GBP')
    expect(normalizeQuoteCurrency('JPY')).toBe('JPY')
  })
})

describe('getCurrencyMeta / getCurrencySymbol', () => {
  it('無輔幣單位的幣別預設不顯示小數', () => {
    expect(getCurrencyMeta('JPY').fractionDigits).toBe(0)
    expect(getCurrencyMeta('TWD').fractionDigits).toBe(0)
    expect(getCurrencyMeta('HKD').fractionDigits).toBe(2)
  })

  it('未知幣別退回以代碼當符號，不會錯標成 $', () => {
    expect(getCurrencySymbol('JPY')).toBe('¥')
    expect(getCurrencySymbol('HKD')).toBe('HK$')
    expect(getCurrencySymbol('BRL')).toBe('BRL ')
  })
})
