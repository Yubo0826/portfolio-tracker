/**
 * 股票代號正規化工具（與後端 portfolio-backend/utils/symbol.js 規則一致）。
 *
 * 台股代號在 Yahoo Finance 必須帶交易所後綴才查得到：
 *   - 上市（TWSE） -> `.TW`
 *   - 上櫃（TPEx） -> `.TWO`
 * 匯入 CSV/Excel 時若讓裸代號（0050、00830）直接進資料庫，之後所有查價都會失敗，
 * 圖表也會把該檔的市值算成 0，因此在匯入前就要補上後綴。
 */

// 台股代號：4~6 位數字，部分槓桿/反向 ETF 會多一個英文字尾（如 00631L、00632R）
const TW_SYMBOL_PATTERN = /^\d{4,6}[A-Z]?$/

const TW_SUFFIXES = ['.TW', '.TWO']

/** 已經帶後綴、指數（^）或匯率（=X）的代號不再處理 */
const hasExplicitSuffix = (symbol) => /[.=^]/.test(symbol)

/** 只做 trim + uppercase，不猜測交易所 */
export const normalizeSymbol = (symbol) => String(symbol ?? '').trim().toUpperCase()

/**
 * 判斷是否為「缺少交易所後綴的台股代號」。
 * currency 有值時以 currency 為準；沒有 currency 時，純數字代號在美股不存在，
 * 因此仍視為台股（不會誤傷 AAPL / QQQ 之類的代號）。
 */
export const isBareTaiwanSymbol = (symbol, currency) => {
  const normalized = normalizeSymbol(symbol)
  if (hasExplicitSuffix(normalized)) return false
  if (!TW_SYMBOL_PATTERN.test(normalized)) return false

  const normalizedCurrency = String(currency ?? '').trim().toUpperCase()
  return normalizedCurrency === 'TWD' || normalizedCurrency === ''
}

/**
 * 產生查詢 Yahoo Finance 時要依序嘗試的代號清單。
 * 例：('0050', 'TWD') -> ['0050.TW', '0050.TWO']
 *     ('QQQ',  'USD') -> ['QQQ']
 */
export const buildSymbolCandidates = (symbol, currency) => {
  const normalized = normalizeSymbol(symbol)
  if (!normalized) return []
  if (!isBareTaiwanSymbol(normalized, currency)) return [normalized]
  return TW_SUFFIXES.map((suffix) => `${normalized}${suffix}`)
}
