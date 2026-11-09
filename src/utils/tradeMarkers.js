/*
  把使用者的交易畫到價格圖上：同日同方向合成一個旗標、依股票分割換算價格、算平均成本線。
  Yahoo 的 K 線價格已按分割調整，交易紀錄存的是當時實際成交價，不換算的話分割前的買點會畫到圖外。
*/

const dayOf = (date) => String(date).slice(0, 10)

/** 交易日之後（不含當天，分割從當天開盤生效）發生的分割倍數連乘 */
export const splitFactor = (day, splits = []) =>
  splits.reduce((factor, s) => (dayOf(s.date) > day && s.numerator > 0 && s.denominator > 0 ? factor * (s.numerator / s.denominator) : factor), 1)

/**
 * @param trades 同一代號的交易 { id, date: 'YYYY-MM-DD', transactionType: 'buy'|'sell', shares, price }
 * @param splits Yahoo chart events.splits [{ date, numerator, denominator }]
 * @param range { from, to } 只保留這段日期內的交易（YYYY-MM-DD，含頭尾），避免旗標把 x 軸撐到資料外
 * @returns 依日期排序的 [{ day, side, items: [{ shares, price, adjPrice }], adjPrice }]，adjPrice 為該組依股數加權的調整後均價
 */
export const tradeMarkers = (trades, splits = [], range = {}) => {
  const groups = new Map()
  for (const tr of trades) {
    const day = dayOf(tr.date)
    if ((range.from && day < range.from) || (range.to && day > range.to)) continue
    const key = `${day}|${tr.transactionType}`
    const factor = splitFactor(day, splits)
    if (!groups.has(key)) groups.set(key, { day, side: tr.transactionType, items: [] })
    groups.get(key).items.push({ shares: Number(tr.shares), price: Number(tr.price), adjPrice: Number(tr.price) / factor, factor })
  }
  return [...groups.values()]
    .map((g) => {
      const adjShares = g.items.reduce((sum, i) => sum + i.shares * i.factor, 0)
      const adjPrice = g.items.reduce((sum, i) => sum + i.shares * i.price, 0) / adjShares
      return { ...g, adjPrice }
    })
    .sort((a, b) => a.day.localeCompare(b.day) || a.side.localeCompare(b.side))
}

/**
 * 依分割換算後的平均成本（與後端 computeHolding 同一套：買入含手續費、賣出按比例扣成本、清倉重算）。
 * 沒有持股時回 null。
 * ponytail: 分割資料只有圖表抓的 5 年內；更早的分割之前買的股票，平均成本會偏高。要更準需另抓完整分割歷史
 */
export const adjustedAvgCost = (trades, splits = []) => {
  const sorted = [...trades].sort((a, b) => dayOf(a.date).localeCompare(dayOf(b.date)) || String(a.id).localeCompare(String(b.id), undefined, { numeric: true }))
  let shares = 0
  let cost = 0
  for (const tr of sorted) {
    const s = Number(tr.shares) * splitFactor(dayOf(tr.date), splits)
    if (tr.transactionType === 'buy') {
      shares += s
      cost += Number(tr.shares) * Number(tr.price) + (Number(tr.fee) || 0)
    } else if (tr.transactionType === 'sell' && shares > 0) {
      const out = Math.min(s, shares)
      cost -= (cost * out) / shares
      shares -= out
      if (shares < 1e-9) { shares = 0; cost = 0 }
    }
  }
  return shares > 0 ? cost / shares : null
}

/** 把日期對到 bars（已排序的 'YYYY-MM-DD' 陣列）中「當天或之前最近」的那根，回傳索引；都在之後回 -1 */
export const snapIndex = (day, bars) => {
  let lo = 0
  let hi = bars.length - 1
  let found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (bars[mid] <= day) { found = mid; lo = mid + 1 } else hi = mid - 1
  }
  return found
}
