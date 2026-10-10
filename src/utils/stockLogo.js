// Shared logo resolution cache for StockIcon.
//
// Probing a logo URL is expensive because the first source 404s for many
// symbols and browsers do not cache those failures. Without a cache every
// dropdown / list remount repeats the same 404 -> fallback source dance,
// which is why icons trickle in one by one. Here we remember, per symbol,
// which source actually worked (or that none did) in memory and in
// localStorage so subsequent renders resolve synchronously.

// Tried in order; on load error we advance to the next source before giving up.
export const LOGO_SOURCES = [
  (symbol) => `https://storage.googleapis.com/iex/api/logos/${symbol}.png`,
  (symbol) => `https://financialmodelingprep.com/image-stock/${symbol}.png`,
]

const STORAGE_KEY = 'portfolio-tracker-logo-cache'
const OK_TTL = 30 * 24 * 60 * 60 * 1000
const FAIL_TTL = 3 * 24 * 60 * 60 * 1000
const MAX_ENTRIES = 500
const NOT_FOUND = -1

// symbol -> source index (NOT_FOUND when every source failed)
const memoryCache = new Map()
// symbol -> Promise<number>, dedupes concurrent probes of the same symbol
const inflight = new Map()

let storageLoaded = false

function normalize(symbol) {
  return String(symbol || '').trim().toUpperCase()
}

function isFresh(entry) {
  if (!entry || typeof entry.i !== 'number' || typeof entry.t !== 'number') return false
  const ttl = entry.i === NOT_FOUND ? FAIL_TTL : OK_TTL
  return Date.now() - entry.t < ttl && (entry.i === NOT_FOUND || entry.i < LOGO_SOURCES.length)
}

function loadStorage() {
  if (storageLoaded) return
  storageLoaded = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return
    for (const [symbol, entry] of Object.entries(parsed)) {
      if (isFresh(entry)) memoryCache.set(symbol, entry.i)
    }
  } catch (err) {
    // Corrupt or unavailable storage: fall back to memory-only caching.
  }
}

let persistTimer = null

function persist() {
  if (persistTimer) return
  persistTimer = setTimeout(() => {
    persistTimer = null
    try {
      const now = Date.now()
      const entries = [...memoryCache.entries()].slice(-MAX_ENTRIES)
      const payload = {}
      for (const [symbol, index] of entries) payload[symbol] = { i: index, t: now }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch (err) {
      // Quota or private mode: keep the in-memory cache only.
    }
  }, 500)
}

function probe(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.decoding = 'async'
    img.src = src
  })
}

/**
 * Returns the cached source index for a symbol, or undefined when unknown.
 * NOT_FOUND (-1) means every source has been tried and failed.
 */
export function getCachedSourceIndex(symbol) {
  loadStorage()
  return memoryCache.get(normalize(symbol))
}

export function getCachedLogoUrl(symbol) {
  const index = getCachedSourceIndex(symbol)
  if (index === undefined || index === NOT_FOUND) return null
  return LOGO_SOURCES[index](normalize(symbol))
}

export function hasNoLogo(symbol) {
  return getCachedSourceIndex(symbol) === NOT_FOUND
}

/**
 * Resolves which source serves this symbol's logo, caching the answer.
 * Resolves to the source index, or NOT_FOUND when no source has it.
 */
export function resolveStockLogo(symbol) {
  const key = normalize(symbol)
  if (!key) return Promise.resolve(NOT_FOUND)

  const cached = getCachedSourceIndex(key)
  if (cached !== undefined) return Promise.resolve(cached)

  const existing = inflight.get(key)
  if (existing) return existing

  const task = (async () => {
    for (let i = 0; i < LOGO_SOURCES.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      if (await probe(LOGO_SOURCES[i](key))) return i
    }
    return NOT_FOUND
  })()
    .then((index) => {
      memoryCache.set(key, index)
      persist()
      return index
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, task)
  return task
}

/** Warms the cache for a batch of symbols (e.g. incoming search results). */
export function preloadStockLogos(symbols) {
  if (!Array.isArray(symbols)) return
  for (const symbol of symbols) {
    const key = normalize(symbol)
    if (key && getCachedSourceIndex(key) === undefined) resolveStockLogo(key)
  }
}

export function clearStockLogoCache() {
  memoryCache.clear()
  inflight.clear()
  storageLoaded = false
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    // noop
  }
}

export { NOT_FOUND }
