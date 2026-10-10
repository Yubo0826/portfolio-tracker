import { describe, it, expect } from 'vitest'
import { buildSymbolCandidates, isBareTaiwanSymbol, normalizeSymbol } from '../symbol'

describe('normalizeSymbol', () => {
  it('trims and uppercases', () => {
    expect(normalizeSymbol('  qqq ')).toBe('QQQ')
    expect(normalizeSymbol('0050.tw')).toBe('0050.TW')
  })

  it('handles empty input', () => {
    expect(normalizeSymbol(null)).toBe('')
    expect(normalizeSymbol(undefined)).toBe('')
  })
})

describe('isBareTaiwanSymbol', () => {
  it('recognises bare TW codes', () => {
    expect(isBareTaiwanSymbol('0050', 'TWD')).toBe(true)
    expect(isBareTaiwanSymbol('2330', 'TWD')).toBe(true)
    expect(isBareTaiwanSymbol('00830', 'TWD')).toBe(true)
    expect(isBareTaiwanSymbol('00631L', 'TWD')).toBe(true)
  })

  it('treats numeric codes without currency as TW codes', () => {
    expect(isBareTaiwanSymbol('0050')).toBe(true)
  })

  it('leaves codes that already carry a suffix alone', () => {
    expect(isBareTaiwanSymbol('0050.TW', 'TWD')).toBe(false)
    expect(isBareTaiwanSymbol('^TWII', 'TWD')).toBe(false)
    expect(isBareTaiwanSymbol('TWDUSD=X', 'TWD')).toBe(false)
  })

  it('does not touch US tickers', () => {
    expect(isBareTaiwanSymbol('QQQ', 'USD')).toBe(false)
    expect(isBareTaiwanSymbol('VOO', 'USD')).toBe(false)
  })

  it('does not treat numeric codes as TW when priced in another currency', () => {
    expect(isBareTaiwanSymbol('0700', 'HKD')).toBe(false)
  })
})

describe('buildSymbolCandidates', () => {
  it('expands bare TW codes to TWSE then TPEx', () => {
    expect(buildSymbolCandidates('0050', 'TWD')).toEqual(['0050.TW', '0050.TWO'])
    expect(buildSymbolCandidates('00830', 'TWD')).toEqual(['00830.TW', '00830.TWO'])
  })

  it('returns the symbol unchanged for everything else', () => {
    expect(buildSymbolCandidates('QQQ', 'USD')).toEqual(['QQQ'])
    expect(buildSymbolCandidates('0050.TW', 'TWD')).toEqual(['0050.TW'])
  })

  it('returns an empty list for blank input', () => {
    expect(buildSymbolCandidates('', 'USD')).toEqual([])
  })
})
