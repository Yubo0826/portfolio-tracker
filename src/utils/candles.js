/*
  K 線週期合併：由日 K 合成週 K／月 K，不必另外向 Yahoo 抓。
  quotes 為 Yahoo chart 的格式 { date, open, high, low, close, volume }。
*/

// 以 UTC 日期分組：Yahoo 日 K 的時間是開盤時刻，換成 UTC 不會跨日
const bucketKey = (date, period) => {
  const d = new Date(date)
  if (period === 'month') return `${d.getUTCFullYear()}-${d.getUTCMonth()}`
  const monday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return String(monday)
}

/**
 * @param quotes 日 K（任意順序，缺值的會略過）
 * @param period 'day' | 'week' | 'month'；'day' 原樣回傳排序後的有效資料
 * @returns 合併後的 K 線：開盤取第一天、收盤取最後一天、高低取極值、量加總，date 為該段第一天
 */
export const aggregateCandles = (quotes, period) => {
  const valid = quotes
    .filter((q) => q?.date && [q.open, q.high, q.low, q.close].every(Number.isFinite))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  if (period !== 'week' && period !== 'month') return valid

  const out = []
  let key = null
  for (const q of valid) {
    const k = bucketKey(q.date, period)
    const last = out.at(-1)
    if (k !== key) {
      out.push({ date: q.date, open: q.open, high: q.high, low: q.low, close: q.close, volume: q.volume || 0 })
      key = k
    } else {
      last.high = Math.max(last.high, q.high)
      last.low = Math.min(last.low, q.low)
      last.close = q.close
      last.volume += q.volume || 0
    }
  }
  return out
}
