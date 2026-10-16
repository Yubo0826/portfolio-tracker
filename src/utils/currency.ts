/**
 * 幣別工具：代碼正規化與顯示用 metadata。
 *
 * 全站以 USD 為基準幣（pivot currency）：資料層一律先換成 USD 再加總，
 * 顯示層才轉成使用者的顯示幣別。這裡提供「某個幣別該怎麼顯示」與
 * 「Yahoo 回傳的幣別代碼該怎麼修正」兩件事。
 */

export interface CurrencyMeta {
  /** 顯示用符號 */
  symbol: string
  /** 預設小數位數（日圓、韓元、台幣等沒有輔幣單位的習慣上不顯示小數） */
  fractionDigits: number
  /** Intl 格式化用的 locale */
  locale: string
}

/**
 * 沒列在這裡的幣別仍可換算，只是會退回 DEFAULT_CURRENCY_META（以代碼當符號）。
 */
export const CURRENCY_META: Record<string, CurrencyMeta> = {
  USD: { symbol: '$', fractionDigits: 2, locale: 'en-US' },
  TWD: { symbol: 'NT$', fractionDigits: 0, locale: 'zh-TW' },
  JPY: { symbol: '¥', fractionDigits: 0, locale: 'ja-JP' },
  HKD: { symbol: 'HK$', fractionDigits: 2, locale: 'zh-HK' },
  CNY: { symbol: '¥', fractionDigits: 2, locale: 'zh-CN' },
  KRW: { symbol: '₩', fractionDigits: 0, locale: 'ko-KR' },
  GBP: { symbol: '£', fractionDigits: 2, locale: 'en-GB' },
  EUR: { symbol: '€', fractionDigits: 2, locale: 'de-DE' },
  SGD: { symbol: 'S$', fractionDigits: 2, locale: 'en-SG' },
  AUD: { symbol: 'A$', fractionDigits: 2, locale: 'en-AU' },
  CAD: { symbol: 'C$', fractionDigits: 2, locale: 'en-CA' },
  CHF: { symbol: 'CHF ', fractionDigits: 2, locale: 'de-CH' },
  INR: { symbol: '₹', fractionDigits: 2, locale: 'en-IN' },
}

const DEFAULT_CURRENCY_META: CurrencyMeta = { symbol: '', fractionDigits: 2, locale: 'en-US' }

/** 需要向匯率 API 取得的幣別（寫入 localStorage 快取，不必整包 160 種都存） */
export const SUPPORTED_CURRENCIES: string[] = Object.keys(CURRENCY_META)

/** 下拉選單置頂的常用幣別 */
export const PRIMARY_CURRENCIES: string[] = ['TWD', 'USD', 'JPY', 'HKD']

/**
 * Yahoo 對部分交易所回的是「輔幣」代碼，數值是主幣的 100 倍：
 *   - GBp（倫敦，便士）、ZAc（約翰尼斯堡，分）、ILA（特拉維夫，agorot）
 * 這類代碼大小寫有意義（GBp ≠ GBP），因此比對前不能先 toUpperCase。
 */
const MINOR_UNIT_CURRENCIES: Record<string, { currency: string; multiplier: number }> = {
  GBp: { currency: 'GBP', multiplier: 0.01 },
  ZAc: { currency: 'ZAR', multiplier: 0.01 },
  ILA: { currency: 'ILS', multiplier: 0.01 },
}

/** 只做 trim + uppercase，給「已知是主幣代碼」的場合用 */
export const normalizeCurrency = (currency: string | null | undefined): string =>
  String(currency || 'USD').trim().toUpperCase()

/**
 * 把 Yahoo 回傳的幣別代碼與金額一起正規化成主幣。
 * 例：fromQuoteCurrency(1250, 'GBp') -> { amount: 12.5, currency: 'GBP' }
 */
export const fromQuoteCurrency = (
  amount: number | null | undefined,
  rawCurrency: string | null | undefined
): { amount: number | null; currency: string } => {
  const raw = String(rawCurrency ?? '').trim()
  const minor = MINOR_UNIT_CURRENCIES[raw]

  if (!minor) {
    return { amount: amount ?? null, currency: normalizeCurrency(raw) }
  }

  return {
    amount: amount == null || isNaN(amount) ? null : amount * minor.multiplier,
    currency: minor.currency,
  }
}

/** 只正規化代碼，不動金額（已知金額另外處理時用） */
export const normalizeQuoteCurrency = (rawCurrency: string | null | undefined): string =>
  fromQuoteCurrency(null, rawCurrency).currency

export const getCurrencyMeta = (currency: string | null | undefined): CurrencyMeta =>
  CURRENCY_META[normalizeCurrency(currency)] ?? DEFAULT_CURRENCY_META

/**
 * 取得某個 locale 的小數分隔符號（en-US 是 '.'，de-DE 是 ','）。
 * 拆解已格式化字串時必須用它，否則 zh-TW 的千分位逗號會被誤判成小數。
 */
export const getDecimalSeparator = (locale: string): string =>
  new Intl.NumberFormat(locale)
    .formatToParts(1.1)
    .find((part) => part.type === 'decimal')?.value ?? '.'

/**
 * 顯示用符號；未知幣別沒有通用符號，退回代碼加空白（例：'BRL 1,234.00'）。
 */
export const getCurrencySymbol = (currency: string | null | undefined): string => {
  const code = normalizeCurrency(currency)
  const meta = CURRENCY_META[code]
  return meta ? meta.symbol : `${code} `
}
