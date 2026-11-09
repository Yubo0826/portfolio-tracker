import { describe, expect, it } from 'vitest'
import { aggregateCandles } from '../candles'

const q = (date, open, high, low, close, volume) => ({ date: `${date}T14:30:00.000Z`, open, high, low, close, volume })

// 2026-01-02 是週五，01-05～01-07 是下一週
const days = [
  q('2026-01-06', 12, 14, 11, 13, 300),
  q('2026-01-02', 10, 11, 9, 10.5, 100),
  q('2026-01-05', 10.5, 12, 10, 12, 200),
  q('2026-01-07', 13, 13.5, 8, 9, 400),
  { date: '2026-01-08T14:30:00.000Z', open: null, high: null, low: null, close: null, volume: null },
  q('2026-02-02', 9, 10, 9, 10, 50),
]

describe('aggregateCandles', () => {
  it('週 K：週一為界，開收取首尾、高低取極值、量加總', () => {
    const weeks = aggregateCandles(days, 'week')
    expect(weeks.map(({ open, high, low, close, volume }) => [open, high, low, close, volume])).toEqual([
      [10, 11, 9, 10.5, 100],
      [10.5, 14, 8, 9, 900],
      [9, 10, 9, 10, 50],
    ])
    expect(weeks[1].date).toBe(days[2].date)
  })

  it('月 K', () => {
    const months = aggregateCandles(days, 'month')
    expect(months.map(({ open, high, low, close, volume }) => [open, high, low, close, volume])).toEqual([
      [10, 14, 8, 9, 1000],
      [9, 10, 9, 10, 50],
    ])
  })

  it('日 K 只排序並去掉缺值', () => {
    expect(aggregateCandles(days, 'day').map((d) => d.close)).toEqual([10.5, 12, 13, 9, 10])
  })
})

describe('vwapFrom', () => {
  it('從指定時間起累計典型價 × 量，略過無量的 K 線', async () => {
    const { vwapFrom } = await import('../../composables/useCandleChart')
    const from = new Date(days[2].date).getTime() // 01-05 起
    const out = vwapFrom(aggregateCandles(days, 'day'), from)
    expect(out.map(([t]) => t)).toEqual([days[2], days[0], days[3], days[5]].map((d) => new Date(d.date).getTime()))
    expect(out[0][1]).toBeCloseTo((12 + 10 + 12) / 3)
    expect(out[1][1]).toBeCloseTo(((34 / 3) * 200 + ((14 + 11 + 13) / 3) * 300) / 500, 2)
  })
})
