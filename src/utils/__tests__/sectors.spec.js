import { describe, it, expect } from 'vitest'
import { sectorBreakdown } from '../sectors'

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
