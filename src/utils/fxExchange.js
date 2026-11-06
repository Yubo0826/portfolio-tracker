/*
  換匯紀錄的計算。匯率一律以「1 外幣 = ? TWD」表示（後端 fx_exchanges.market_rate 也是）。
  ponytail: 本國幣固定 TWD；要支援其他本國幣，後端加 home_currency 後把這裡的 TWD 換成該欄位
*/

/** 單筆：成交匯率、價差（不含手續費）與總成本（價差 + 手續費，TWD）。缺市場匯率時價差為 null */
export const exchangeCost = (row) => {
  const foreign = Number(row.foreign_amount)
  const twd = Number(row.twd_amount)
  const fee = Number(row.fee) || 0
  const market = Number(row.market_rate) || null
  const rate = twd / foreign

  if (!market) return { rate, market: null, spreadPct: null, costTwd: null }

  // 買外幣時成交匯率高於市場價就是虧；換回台幣則相反
  const sign = row.side === 'buy' ? 1 : -1
  const spreadTwd = sign * (rate - market) * foreign
  return { rate, market, spreadPct: (sign * (rate - market)) / market, costTwd: spreadTwd + fee }
}

/**
 * 依時間順序以移動平均法累計各外幣部位。
 * 換回台幣時按當下平均成本沖銷，差額計入已實現匯兌損益。
 * @param rows 換匯紀錄（任意順序）
 * @param currentRates { USD: 32.1 } 今日 1 外幣 = ? TWD
 * @returns { [currency]: { units, costTwd, avgRate, realized, unrealized, spreadCost, exchangedTwd } }
 */
export const fxPositions = (rows, currentRates = {}) => {
  const sorted = [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.id - b.id)
  const positions = {}

  for (const row of sorted) {
    const p = (positions[row.currency] ??= { units: 0, costTwd: 0, realized: 0, spreadCost: 0, exchangedTwd: 0 })
    const foreign = Number(row.foreign_amount)
    const twd = Number(row.twd_amount)
    const fee = Number(row.fee) || 0

    p.exchangedTwd += twd
    p.spreadCost += exchangeCost(row).costTwd ?? fee

    if (row.side === 'buy') {
      p.units += foreign
      p.costTwd += twd + fee
    } else {
      // 賣超過持有量（例如美金來自股息、沒記換匯）時，只沖銷有記錄的部分
      const matched = Math.min(foreign, p.units)
      const costOut = p.units > 0 ? (p.costTwd / p.units) * matched : 0
      p.realized += (twd - fee) * (matched / foreign) - costOut
      p.units -= matched
      p.costTwd -= costOut
    }
  }

  for (const [currency, p] of Object.entries(positions)) {
    const current = Number(currentRates[currency]) || null
    p.avgRate = p.units > 0 ? p.costTwd / p.units : null
    p.unrealized = current && p.units > 0 ? p.units * current - p.costTwd : null
  }
  return positions
}

/** 表單的三個連動欄位：外幣金額 × 匯率 = 台幣金額 */
export const AMOUNT_FIELDS = ['foreign_amount', 'rate', 'twd_amount']

/**
 * 以最近手動改過的兩格算出第三格，回傳要更新的欄位（算不出來回 {}）。
 * 台幣取到小數 2 位、外幣 4 位、匯率 6 位，與 DB／輸入框精度一致。
 */
export const deriveAmounts = (values, edited) => {
  if (edited.length < 2) return {}
  const target = AMOUNT_FIELDS.find((f) => !edited.includes(f))
  const { foreign_amount: f, rate: r, twd_amount: t } = values
  const round = (v, digits) => Number(v.toFixed(digits))

  if (target === 'twd_amount') return f > 0 && r > 0 ? { twd_amount: round(f * r, 2) } : {}
  if (target === 'rate') return f > 0 && t > 0 ? { rate: round(t / f, 6) } : {}
  return r > 0 && t > 0 ? { foreign_amount: round(t / r, 4) } : {}
}
