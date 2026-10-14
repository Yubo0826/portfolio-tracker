import { describe, it, expect } from 'vitest'
import {
  totalReturnPct,
  realizedProfit,
  portfolioXirr,
  percentChange,
  periodRange,
  filterByPeriod,
  yAxisBounds,
  periodStats,
  portfolioInsights,
  currentLots,
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

describe('periodStats', () => {
  it('最高、最低、最大回撤取高點之後的低點，距高點用最後一點', () => {
    const pts = [{ x: 1, y: 100 }, { x: 2, y: 200 }, { x: 3, y: 150 }, { x: 4, y: 50 }, { x: 5, y: 180 }]
    // 低點 50 在高點 200 之後：回撤 75%；最後 180 距高點 -10%
    expect(periodStats(pts)).toEqual({ high: { x: 2, y: 200 }, low: { x: 4, y: 50 }, maxDrawdown: 75, fromHigh: -10 })
  })

  it('回撤只看高點之後：先跌後漲不算', () => {
    expect(periodStats([{ x: 1, y: 50 }, { x: 2, y: 100 }])!.maxDrawdown).toBe(0)
  })

  it('不足兩點回傳 null', () => {
    expect(periodStats([{ x: 1, y: 1 }])).toBeNull()
  })
})

describe('portfolioInsights', () => {
  const h = (symbol: string, currentValue: number, assetType = 'ETF', currency = 'USD') => ({ symbol, currentValue, assetType, currency })
  const keys = (list: { key: string }[]) => list.map(i => i.key)

  it('單一資產 > 50% 強烈警告、> 30% 警告', () => {
    expect(keys(portfolioInsights([h('VT', 86), h('NVDA', 14)], [], 'USD'))).toContain('concentrationHigh')
    expect(keys(portfolioInsights([h('VT', 40), h('A', 30), h('B', 30)], [], 'USD'))).toContain('concentration')
    expect(keys(portfolioInsights([h('A', 25), h('B', 25), h('C', 25), h('D', 25)], [], 'USD'))).not.toContain('concentration')
  })

  it('資產類別正規化後只有一類才提示，歸不出類別不提示', () => {
    expect(keys(portfolioInsights([h('VT', 50, 'ETF'), h('VOO', 50, 'etf')], [], 'USD'))).toContain('singleAssetClass')
    expect(keys(portfolioInsights([h('VT', 50, 'ETF'), h('NVDA', 50, 'Equity')], [], 'USD'))).not.toContain('singleAssetClass')
    expect(keys(portfolioInsights([h('X', 50, ''), h('Y', 50, '')], [], 'USD'))).not.toContain('singleAssetClass')
  })

  it('非本國幣別 > 80% 才提示', () => {
    const list = [h('VT', 90), h('0050.TW', 10, 'ETF', 'TWD')]
    expect(keys(portfolioInsights(list, [], 'TWD'))).toContain('currencyConcentration')
    expect(keys(portfolioInsights(list, [], 'USD'))).not.toContain('currencyConcentration')
  })

  it('未設定目標 / 偏離目標超過 5 個百分點（含有目標但沒持有）', () => {
    const list = [h('VT', 80), h('BND', 20)]
    expect(keys(portfolioInsights(list, [], 'USD'))).toContain('noTargets')
    const drift = portfolioInsights(list, [{ symbol: 'VT', target: 60 }, { symbol: 'BND', target: 22 }, { symbol: 'GLD', target: 18 }], 'USD')
      .find(i => i.key === 'targetDrift')!
    expect(drift.params.list).toBe('VT 80% → 60%, GLD 0% → 18%')
  })

  it('沒有市值時不產生洞察', () => {
    expect(portfolioInsights([], [], 'USD')).toEqual([])
  })
})

describe('currentLots', () => {
  it('只留股數最後一次歸零之後的交易，並依日期排序', () => {
    const trades = [
      trade({ id: 4, shares: 6, date: '2025-07-03' }),
      trade({ id: 1, shares: 5, date: '2024-01-01' }),
      trade({ id: 2, transactionType: 'sell', shares: 5, date: '2024-06-01' }),
      trade({ id: 3, shares: 7, date: '2025-07-01' }),
      trade({ id: 9, symbol: 'VT', shares: 1, date: '2025-07-02' }),
    ]
    expect(currentLots(trades, 'AAPL').map((t) => t.id)).toEqual([3, 4])
  })
})
