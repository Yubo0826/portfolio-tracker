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
  /** 成交當天的匯率：1 USD = fxRate currency。沒有時 convert 會退回用當下匯率 */
  fxRate?: number | null
}

export interface Holding {
  currentValue: number
  avgCost: number
  shares: number
  /** 以成交當時匯率換算的美金總成本；有給就用它，avgCost * shares 只是反推後的近似值 */
  totalCost?: number
}

/**
 * 把原幣金額換算成顯示幣別；測試時傳 (x) => x 即可。
 * fxRate 是該筆交易成交當天的匯率，有給就該用它，而不是今天的匯率——
 * 否則 2024 年賣出的已實現損益會被今天的匯率重新評價，每天都在變。
 */
export type Convert = (amount: number, currency: string, fxRate?: number | null) => number

/**
 * 投資報酬率 (%) = (市值 - 成本) / 成本
 * 注意：這不是年化報酬，年化請用 portfolioXirr
 */
export function totalReturnPct(holdings: Holding[]): number {
  const cost = holdings.reduce((s, h) => s + (h.totalCost ?? h.avgCost * h.shares), 0)
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
      state.costBasis += convert(tx.price * shares + tx.fee, tx.currency, tx.fxRate)
    } else if (tx.transactionType === 'sell' && state.shares > 0) {
      const soldShares = Math.min(shares, state.shares)
      const costOfSoldShares = (state.costBasis / state.shares) * soldShares
      const proceeds = convert(tx.price * soldShares - tx.fee, tx.currency, tx.fxRate)

      realizedGain += proceeds - costOfSoldShares
      state.shares -= soldShares
      state.costBasis -= costOfSoldShares
    }

    costBasisBySymbol.set(tx.symbol, state)
  }

  return realizedGain
}

/**
 * 某 symbol 目前這輪持有的交易（股數最後一次歸零之後），依日期、id 排序
 * 後端用平均成本法，賣出不對應特定批次，所以只能列出這輪的買賣，無法只留「剩下的批次」
 */
export function currentLots<T extends Trade>(trades: T[], symbol: string): T[] {
  const sorted = trades.filter((t) => t.symbol === symbol).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime() || Number(a.id ?? 0) - Number(b.id ?? 0))
  let shares = 0
  let start = 0
  sorted.forEach((t, i) => {
    shares = Math.round((shares + (t.transactionType === 'sell' ? -t.shares : t.shares)) * 100) / 100
    if (shares <= 0) start = i + 1
  })
  return sorted.slice(start)
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
        tx.currency,
        tx.fxRate
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

export interface PeriodStats<X> {
  high: { x: X; y: number }
  low: { x: X; y: number }
  maxDrawdown: number   // 區間內從高點到後續低點的最大跌幅 (%)，正數
  fromHigh: number      // 最後一點距區間最高點 (%)，≤ 0
}

/** 走勢區間統計：最高、最低、最大回撤、距高點；不足兩點時回傳 null */
export function periodStats<X>(points: { x: X; y: number }[]): PeriodStats<X> | null {
  if (points.length < 2) return null
  let high = points[0], low = points[0], peak = points[0].y, maxDrawdown = 0
  for (const p of points) {
    if (p.y > high.y) high = p
    if (p.y < low.y) low = p
    peak = Math.max(peak, p.y)
    if (peak > 0) maxDrawdown = Math.max(maxDrawdown, (peak - p.y) / peak * 100)
  }
  const last = points[points.length - 1].y
  return { high, low, maxDrawdown, fromHigh: high.y ? (last - high.y) / high.y * 100 : 0 }
}

export interface InsightHolding {
  symbol: string
  assetType?: string
  currency: string
  currentValue: number
}

export interface Insight {
  key: 'concentrationHigh' | 'concentration' | 'singleAssetClass' | 'currencyConcentration' | 'targetDrift' | 'noTargets'
  severity: 'danger' | 'warn' | 'info'
  params: Record<string, string | number>
}

/** assetType 直接存 Yahoo 的 quoteType / typeDisp，寫法不一（Equity、stock、ETF…），先歸成固定幾類 */
export function normalizeAssetType(type?: string): 'stock' | 'etf' | 'crypto' | 'fund' | 'other' {
  const t = String(type || '').toLowerCase()
  if (t.includes('etf')) return 'etf'
  if (t.includes('equity') || t.includes('stock')) return 'stock'
  if (t.includes('crypto')) return 'crypto'
  if (t.includes('fund')) return 'fund'
  return 'other'
}

/**
 * 規則型洞察（不呼叫 AI）。門檻寫死：
 * 單一資產 > 30% / > 50%、單一幣別 > 80%、偏離目標 > 5 個百分點
 * 幣別集中只看顯示幣別以外的幣別：持有本國幣不算匯率風險
 */
export function portfolioInsights(
  holdings: InsightHolding[],
  targets: { symbol: string; target: number }[],
  homeCurrency: string,
): Insight[] {
  const total = holdings.reduce((s, h) => s + h.currentValue, 0)
  if (total <= 0) return []
  const pct = (v: number) => Math.round((v / total) * 1000) / 10
  const insights: Insight[] = []

  // 1. 單一資產集中
  const top = holdings.reduce((a, b) => (b.currentValue > a.currentValue ? b : a))
  const topPct = pct(top.currentValue)
  if (topPct > 50) insights.push({ key: 'concentrationHigh', severity: 'danger', params: { symbol: top.symbol, pct: topPct } })
  else if (topPct > 30) insights.push({ key: 'concentration', severity: 'warn', params: { symbol: top.symbol, pct: topPct } })

  // 4. 資產類別單一（全部歸不出類別時不判斷）
  const types = new Set(holdings.map(h => normalizeAssetType(h.assetType)))
  const [onlyType] = types
  if (types.size === 1 && onlyType !== 'other') insights.push({ key: 'singleAssetClass', severity: 'info', params: { type: onlyType } })

  // 6. 幣別集中
  const byCurrency = new Map<string, number>()
  holdings.forEach(h => byCurrency.set(h.currency, (byCurrency.get(h.currency) || 0) + h.currentValue))
  byCurrency.forEach((value, currency) => {
    if (currency !== homeCurrency && pct(value) > 80) insights.push({ key: 'currencyConcentration', severity: 'warn', params: { currency, pct: pct(value) } })
  })

  // 7 / 8. 目標配置：未設定，或實際與目標差超過 5 個百分點（有目標但沒持有的視為 0%）
  const activeTargets = targets.filter(t => Number(t.target) > 0)
  if (!activeTargets.length) {
    insights.push({ key: 'noTargets', severity: 'info', params: {} })
  } else {
    const actualBySymbol = new Map(holdings.map(h => [h.symbol, pct(h.currentValue)]))
    const drifts = activeTargets
      .map(t => ({ symbol: t.symbol, actual: actualBySymbol.get(t.symbol) || 0, target: Number(t.target) }))
      .filter(d => Math.abs(d.actual - d.target) > 5)
    if (drifts.length) {
      insights.push({ key: 'targetDrift', severity: 'warn', params: { list: drifts.map(d => `${d.symbol} ${d.actual}% → ${d.target}%`).join(', ') } })
    }
  }

  return insights
}
