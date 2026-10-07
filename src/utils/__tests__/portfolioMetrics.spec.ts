import { describe, it, expect } from 'vitest'
import {
  totalReturnPct,
  realizedProfit,
  portfolioXirr,
  percentChange,
  periodRange,
  filterByPeriod,
  yAxisBounds,
  type Trade,
} from '../portfolioMetrics'

const same = (x: number) => x
const trade = (t: Partial<Trade>): Trade => ({ symbol: 'AAPL', transactionType: 'buy', shares: 0, price: 0, fee: 0, currency: 'USD', date: '2025-01-01', ...t })

describe('totalReturnPct', () => {
  it('(市值 - 成本) / 成本', () => {
    expect(totalReturnPct([{ avgCost: 100, shares: 10, currentValue: 1200 }])).toBe(20)
  })

  it('沒有成本時回傳 0', () => {
    expect(totalReturnPct([])).toBe(0)
  })
})

describe('realizedProfit', () => {
  it('用平均成本計算，並依日期排序後再處理', () => {
    const trades = [
      trade({ transactionType: 'sell', shares: 5, price: 300, fee: 10, date: '2025-03-01' }),
      trade({ shares: 10, price: 100, date: '2025-01-01' }),
      trade({ shares: 10, price: 200, date: '2025-02-01' }),
    ]
    // 平均成本 150，賣 5 股成本 750；收入 5 * 300 - 10 = 1490
    expect(realizedProfit(trades, same)).toBe(740)
  })

  it('同一天的交易依 id 排序，不受 API 回傳順序影響', () => {
    const trades = [
      trade({ id: 2, transactionType: 'sell', shares: 10, price: 120, date: '2025-05-01' }),
      trade({ id: 1, shares: 10, price: 100, date: '2025-05-01' }),
    ]
    expect(realizedProfit(trades, same)).toBe(200)
  })

  it('沒有持股時的賣出不計入', () => {
    expect(realizedProfit([trade({ transactionType: 'sell', shares: 5, price: 300 })], same)).toBe(0)
  })

  it('金額會經過幣別換算', () => {
    const trades = [
      trade({ shares: 1, price: 100 }),
      trade({ transactionType: 'sell', shares: 1, price: 150, date: '2025-02-01' }),
    ]
    expect(realizedProfit(trades, x => x * 30)).toBe(1500)
  })
})

describe('portfolioXirr', () => {
  it('一年前投入 1000、現值 1100 → 10%', () => {
    const rate = portfolioXirr(
      [trade({ shares: 10, price: 100, date: '2025-01-01T00:00:00Z' })],
      [],
      1100,
      same,
      new Date('2026-01-01T00:00:00Z')
    )
    expect(rate).toBeCloseTo(10, 4)
  })

  it('股息算現金流入', () => {
    const rate = portfolioXirr(
      [trade({ shares: 10, price: 100, date: '2025-01-01T00:00:00Z' })],
      [{ symbol: 'AAPL', amount: 100, date: '2026-01-01T00:00:00Z' }],
      1000,
      same,
      new Date('2026-01-01T00:00:00Z')
    )
    expect(rate).toBeCloseTo(10, 4)
  })

  it('股息依該 symbol 交易的幣別換算', () => {
    // USD→TWD 匯率 30：投入 30000、股息 100 USD = 3000、現值 30000 → 10%
    const toTwd = (x: number, c: string) => (c === 'USD' ? x * 30 : x)
    const rate = portfolioXirr(
      [trade({ shares: 10, price: 100, date: '2025-01-01T00:00:00Z' })],
      [{ symbol: 'AAPL', amount: 100, date: '2026-01-01T00:00:00Z' }],
      30000,
      toTwd,
      new Date('2026-01-01T00:00:00Z')
    )
    expect(rate).toBeCloseTo(10, 4)
  })

  it('沒有交易或無法計算時回傳 null', () => {
    expect(portfolioXirr([], [], 1000, same)).toBeNull()
    // 全部同一天，xirr 會丟錯
    const now = new Date('2025-01-01T00:00:00Z')
    expect(portfolioXirr([trade({ shares: 1, price: 100, date: now })], [], 100, same, now)).toBeNull()
  })
})

describe('percentChange', () => {
  it('第一點到最後一點的漲跌幅，取兩位小數', () => {
    expect(percentChange([{ y: 100 }, { y: 50 }, { y: 112.3456 }])).toBe(12.35)
  })

  it('資料不足或起點為 0 回傳 null', () => {
    expect(percentChange([{ y: 100 }])).toBeNull()
    expect(percentChange([{ y: 0 }, { y: 5 }])).toBeNull()
  })
})

describe('periodRange / filterByPeriod', () => {
  const today = new Date('2026-10-07T12:00:00Z')

  it('1mo = 往前 30 天', () => {
    expect(periodRange('1mo', today)).toEqual({ period1: '2026-09-07', period2: '2026-10-07' })
  })

  it('用本地日期：台北早上 7 點仍是今天', () => {
    const tz = process.env.TZ
    process.env.TZ = 'Asia/Taipei'
    try {
      expect(periodRange('1mo', new Date('2026-10-07T07:00:00+08:00')).period2).toBe('2026-10-07')
    } finally {
      if (tz === undefined) delete process.env.TZ
      else process.env.TZ = tz
    }
  })

  it('未知代碼視為 30 天', () => {
    expect(periodRange('???', today)).toEqual(periodRange('1mo', today))
  })

  it('只留下區間內且日期有效的資料', () => {
    const items = [{ d: '2026-09-01' }, { d: '2026-09-20' }, { d: '2026-10-07' }, { d: 'oops' }]
    expect(filterByPeriod(items, '1mo', i => i.d, today).map(i => i.d)).toEqual(['2026-09-20', '2026-10-07'])
  })
})

describe('yAxisBounds', () => {
  it('上下各留 8%', () => {
    const { min, max } = yAxisBounds([10, 20, NaN])
    expect(min).toBeCloseTo(9.2)
    expect(max).toBeCloseTo(20.8)
  })

  it('全部同值時留 2%，沒資料時回傳空物件', () => {
    expect(yAxisBounds([5, 5])).toEqual({ min: 4.9, max: 5.1 })
    expect(yAxisBounds([])).toEqual({})
  })
})
