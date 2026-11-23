import { describe, it, expect } from 'vitest'
import { sectorBreakdown, companyBreakdown } from '../sectors'

describe('sectorBreakdown', () => {
  it('依市值加權個股與 ETF 的產業，缺資料與不足 100% 的部分歸 other', () => {
    const result = sectorBreakdown(
      [
        { symbol: 'AAPL', currentValue: 100 },
        { symbol: 'QQQ', currentValue: 200 },
        { symbol: 'BND', currentValue: 50 },
      ],
      {
        AAPL: [{ sector: 'technology', weight: 1 }],
        QQQ: [{ sector: 'technology', weight: 0.5 }, { sector: 'healthcare', weight: 0.4 }],
        BND: [],
      },
    )
    expect(result).toEqual([
      { sector: 'technology', value: 200 },
      { sector: 'healthcare', value: 80 },
      { sector: 'other', value: 70 },
    ])
  })
})

describe('companyBreakdown', () => {
  it('ETF 依前十大穿透、個股算自己，同代號合併並記錄來源；沒資料的不算進涵蓋', () => {
    const { rows, covered, total } = companyBreakdown(
      [
        { symbol: 'AAPL', name: 'Apple Inc.', currentValue: 100 },
        { symbol: 'QQQ', name: 'Invesco QQQ', currentValue: 200 },
        { symbol: 'BND', name: 'Bond', currentValue: 50 },
      ],
      {
        AAPL: [{ symbol: 'AAPL', name: '', weight: 1 }],
        QQQ: [{ symbol: 'NVDA', name: 'NVIDIA', weight: 0.1 }, { symbol: 'AAPL', name: 'Apple', weight: 0.05 }],
        BND: [],
      },
    )
    expect(rows).toEqual([
      { symbol: 'AAPL', name: 'Apple Inc.', value: 110, sources: [{ symbol: 'AAPL', value: 100 }, { symbol: 'QQQ', value: 10 }] },
      { symbol: 'NVDA', name: 'NVIDIA', value: 20, sources: [{ symbol: 'QQQ', value: 20 }] },
    ])
    expect(covered).toBe(130)
    expect(total).toBe(350)
  })
})
