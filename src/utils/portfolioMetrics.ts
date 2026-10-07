/**
 * Portfolio Metrics - Pure Function Version
 * 投資組合績效計算 - 純函數版本
 *
 * 從 DashboardView.vue / AssetProfileView.vue 提取出來，方便測試和重用
 */
// @ts-expect-error xirr 套件沒有附型別宣告
import xirr from 'xirr'

export interface Trade {
  id?: string | number      // 同一天多筆交易時依 id 排序（與後端 holdingCalc 一致）
  symbol: string
  transactionType: string   // 'buy' | 'sell'
  shares: number
  price: number
  fee: number
  currency: string
  date: string | Date
}

export interface Holding {
  currentValue: number
  avgCost: number
  shares: number
}

/** 把原幣金額換算成顯示幣別；測試時傳 (x) => x 即可 */
export type Convert = (amount: number, currency: string) => number

/**
 * 投資報酬率 (%) = (市值 - 成本) / 成本
 * 注意：這不是年化報酬，年化請用 portfolioXirr
 */
export function totalReturnPct(holdings: Holding[]): number {
  const cost = holdings.reduce((s, h) => s + h.avgCost * h.shares, 0)
  if (cost === 0) return 0
  const value = holdings.reduce((s, h) => s + h.currentValue, 0)
  return ((value - cost) / cost) * 100
}

/** 已實現損益：賣出收入 - 已賣出股數的平均成本（含手續費） */
export function realizedProfit(trades: Trade[], convert: Convert): number {
  const costBasisBySymbol = new Map<string, { shares: number; costBasis: number }>()
  let realizedGain = 0

  const sorted = [...trades].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime() || Number(a.id ?? 0) - Number(b.id ?? 0))

  for (const tx of sorted) {
    const shares = Number(tx.shares) || 0
    const state = costBasisBySymbol.get(tx.symbol) || { shares: 0, costBasis: 0 }

    if (tx.transactionType === 'buy') {
      state.shares += shares
      state.costBasis += convert(tx.price * shares + tx.fee, tx.currency)
    } else if (tx.transactionType === 'sell' && state.shares > 0) {
      const soldShares = Math.min(shares, state.shares)
      const costOfSoldShares = (state.costBasis / state.shares) * soldShares
      const proceeds = convert(tx.price * soldShares - tx.fee, tx.currency)

      realizedGain += proceeds - costOfSoldShares
      state.shares -= soldShares
      state.costBasis -= costOfSoldShares
    }

    costBasisBySymbol.set(tx.symbol, state)
  }

  return realizedGain
}

/**
 * 年化內部報酬率 XIRR (%)
 * 現金流：買入為流出、賣出與股息為流入，目前持倉市值視為今天的最後一筆流入
 * 股息表沒有幣別欄位，以該 symbol 交易的幣別換算
 * 無交易或無法收斂時回傳 null
 */
export function portfolioXirr(
  trades: Trade[],
  dividends: { symbol: string; amount: number; date: string | Date }[],
  currentValue: number,
  convert: Convert,
  now = new Date()
): number | null {
  if (!trades.length) return null

  const currencyBySymbol = new Map(trades.map(tx => [tx.symbol, tx.currency]))
  const cashflows = [
    ...trades.map(tx => ({
      amount: convert(
        tx.transactionType === 'buy' ? -(tx.price * tx.shares + tx.fee) : tx.price * tx.shares - tx.fee,
        tx.currency
      ),
      when: new Date(tx.date),
    })),
    ...dividends.map(d => ({ amount: convert(d.amount, currencyBySymbol.get(d.symbol) ?? 'USD'), when: new Date(d.date) })),
    { amount: currentValue, when: now },
  ]

  try {
    return xirr(cashflows) * 100
  } catch {
    return null
  }
}

/** 第一點到最後一點的漲跌幅 (%)，取到小數兩位；資料不足或起點為 0 時回傳 null */
export function percentChange(points: { y: number }[]): number | null {
  if (points.length < 2 || !points[0].y) return null
  const first = points[0].y
  const last = points[points.length - 1].y
  return Number((((last - first) / first) * 100).toFixed(2))
}

/** 本地時區的 YYYY-MM-DD（toISOString 是 UTC，台北早上 8 點前會變成昨天） */
export function toIsoDate(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

const PERIOD_DAYS: Record<string, number> = {
  '5d': 7, '7d': 7, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365, '2y': 730, '5y': 1825,
}

/** 時間區間代碼（'1mo'、'ytd'…）轉成 YYYY-MM-DD 起訖日；未知代碼視為 30 天 */
export function periodRange(range: string, today = new Date()) {
  let start: Date
  if (range === 'ytd') {
    start = new Date(today.getFullYear(), 0, 1)
  } else {
    start = new Date(today)
    start.setDate(start.getDate() - (PERIOD_DAYS[range] || 30))
  }
  return { period1: toIsoDate(start), period2: toIsoDate(today) }
}

/** 篩出落在時間區間內的資料（含訖日整天），日期無效的資料會被濾掉 */
export function filterByPeriod<T>(
  items: T[],
  range: string,
  getDate: (item: T) => Date | string,
  today = new Date()
): T[] {
  const { period1, period2 } = periodRange(range, today)
  const start = new Date(period1)
  const end = new Date(period2)
  end.setHours(23, 59, 59, 999)

  return items.filter(item => {
    const d = new Date(getDate(item))
    return d >= start && d <= end
  })
}

/** 圖表 y 軸範圍：上下各留 8% 空間；全部同值時留 2%，避免線貼邊 */
export function yAxisBounds(values: number[]): { min?: number; max?: number } {
  const finite = values.filter(Number.isFinite)
  if (!finite.length) return {}
  const min = Math.min(...finite)
  const max = Math.max(...finite)
  const pad = max > min ? (max - min) * 0.08 : Math.max(Math.abs(max), 1) * 0.02
  return { min: min - pad, max: max + pad }
}
