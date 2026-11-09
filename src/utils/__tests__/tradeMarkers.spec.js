import { describe, expect, it } from 'vitest'
import { adjustedAvgCost, snapIndex, splitFactor, tradeMarkers } from '../tradeMarkers'

const splits = [{ date: '2024-06-10T13:30:00.000Z', numerator: 10, denominator: 1 }]
const tr = (id, date, transactionType, shares, price, fee = 0) => ({ id, date, transactionType, shares, price, fee })

describe('splitFactor', () => {
  it('分割當天起不再換算', () => {
    expect(splitFactor('2024-06-07', splits)).toBe(10)
    expect(splitFactor('2024-06-10', splits)).toBe(1)
  })
})

describe('tradeMarkers', () => {
  it('同日同方向合併、分割前價格換算、篩選日期範圍', () => {
    const out = tradeMarkers([
      tr(1, '2024-06-03', 'buy', 2, 1100),
      tr(2, '2024-06-03', 'buy', 1, 1000),
      tr(3, '2024-06-03', 'sell', 1, 1150),
      tr(4, '2024-07-01', 'buy', 10, 120),
      tr(5, '2020-01-01', 'buy', 1, 300),
    ], splits, { from: '2021-01-01' })
    expect(out.map((m) => [m.day, m.side, m.items.length])).toEqual([
      ['2024-06-03', 'buy', 2],
      ['2024-06-03', 'sell', 1],
      ['2024-07-01', 'buy', 1],
    ])
    expect(out[0].adjPrice).toBeCloseTo(3200 / 30) // (2×1100 + 1000) ÷ 30 股（換算後）
    expect(out[2].adjPrice).toBe(120)
  })
})

describe('adjustedAvgCost', () => {
  it('分割前後的買入換算到同一基準，賣出按比例扣成本', () => {
    const trades = [
      tr(1, '2024-01-02', 'buy', 10, 500, 10), // = 100 股 × 5，成本 5010
      tr(2, '2024-07-01', 'buy', 100, 120), // 成本 12000
      tr(3, '2024-08-01', 'sell', 100, 130),
    ]
    expect(adjustedAvgCost(trades, splits)).toBeCloseTo(17010 / 200)
  })
  it('清倉後回 null', () => {
    expect(adjustedAvgCost([tr(1, '2024-01-02', 'buy', 1, 10), tr(2, '2024-01-03', 'sell', 1, 11)])).toBeNull()
  })
})

describe('snapIndex', () => {
  it('對到當天或之前最近的 K 線', () => {
    const bars = ['2024-06-03', '2024-06-10', '2024-06-17']
    expect(snapIndex('2024-06-12', bars)).toBe(1)
    expect(snapIndex('2024-06-10', bars)).toBe(1)
    expect(snapIndex('2024-06-01', bars)).toBe(-1)
  })
})
