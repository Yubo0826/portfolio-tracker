// 收盤價陣列 → 72x28 viewBox 內的折線路徑（個股頁相關股票、儀表板大盤指數共用）
export function toSparkPath(closes) {
  if (!Array.isArray(closes) || closes.length < 2) return ''
  const min = Math.min(...closes)
  const span = Math.max(...closes) - min || 1
  return closes
    .map((close, index) => `${index ? 'L' : 'M'}${(index / (closes.length - 1) * 72).toFixed(2)},${(26 - (close - min) / span * 24).toFixed(2)}`)
    .join(' ')
}
