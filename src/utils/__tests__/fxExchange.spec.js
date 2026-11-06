import { describe, expect, it } from 'vitest'
import { deriveAmounts, exchangeCost, fxPositions } from '../fxExchange'

const buy = (id, date, foreign, twd, market, fee = 0) =>
  ({ id, date, side: 'buy', currency: 'USD', foreign_amount: foreign, twd_amount: twd, fee, market_rate: market })
const sell = (id, date, foreign, twd, market, fee = 0) =>
  ({ ...buy(id, date, foreign, twd, market, fee), side: 'sell' })

describe('exchangeCost', () => {
  it('買外幣：成交價高於市場價為成本', () => {
    const r = exchangeCost(buy(1, '2026-01-01', 1000, 32100, 32, 50))
    expect(r.rate).toBeCloseTo(32.1)
    expect(r.spreadPct).toBeCloseTo(0.1 / 32)
    expect(r.costTwd).toBeCloseTo(150)
  })

  it('換回台幣：成交價低於市場價為成本', () => {
    expect(exchangeCost(sell(1, '2026-01-01', 1000, 31900, 32)).costTwd).toBeCloseTo(100)
  })

  it('沒有市場匯率時價差為 null', () => {
    expect(exchangeCost(buy(1, '2026-01-01', 1000, 32000, null)).costTwd).toBeNull()
  })
})

describe('fxPositions', () => {
  it('移動平均成本、已實現與未實現損益', () => {
    const rows = [
      sell(3, '2026-03-01', 1000, 33000, 33),
      buy(1, '2026-01-01', 1000, 30000, 30),
      buy(2, '2026-02-01', 1000, 32000, 32, 100),
    ]
    const usd = fxPositions(rows, { USD: 34 }).USD
    // 平均成本 (30000 + 32100) / 2000 = 31.05；賣 1000 沖銷 31050
    expect(usd.realized).toBeCloseTo(33000 - 31050)
    expect(usd.units).toBe(1000)
    expect(usd.avgRate).toBeCloseTo(31.05)
    expect(usd.unrealized).toBeCloseTo(34000 - 31050)
    expect(usd.spreadCost).toBeCloseTo(100)
  })

  it('賣超過有紀錄的部位只沖銷有紀錄的部分', () => {
    const usd = fxPositions([buy(1, '2026-01-01', 100, 3000, 30), sell(2, '2026-02-01', 200, 6400, 32)]).USD
    expect(usd.units).toBe(0)
    expect(usd.realized).toBeCloseTo(3200 - 3000)
    expect(usd.avgRate).toBeNull()
  })
})

describe('deriveAmounts', () => {
  it('填外幣與匯率 -> 算台幣', () => {
    expect(deriveAmounts({ foreign_amount: 3224.02, rate: 32.01 }, ['rate', 'foreign_amount'])).toEqual({ twd_amount: 103200.88 })
  })
  it('填外幣與台幣 -> 算匯率', () => {
    expect(deriveAmounts({ foreign_amount: 10000, twd_amount: 321500, rate: 32 }, ['twd_amount', 'foreign_amount'])).toEqual({ rate: 32.15 })
  })
  it('填匯率與台幣 -> 算外幣', () => {
    expect(deriveAmounts({ rate: 32.15, twd_amount: 321500 }, ['twd_amount', 'rate'])).toEqual({ foreign_amount: 10000 })
  })
  it('只填一格或依據為空時不動', () => {
    expect(deriveAmounts({ foreign_amount: 100 }, ['foreign_amount'])).toEqual({})
    expect(deriveAmounts({ foreign_amount: 100, rate: null }, ['rate', 'foreign_amount'])).toEqual({})
  })
})
