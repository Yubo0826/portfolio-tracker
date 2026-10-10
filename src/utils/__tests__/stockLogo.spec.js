import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  LOGO_SOURCES,
  NOT_FOUND,
  clearStockLogoCache,
  getCachedSourceIndex,
  resolveStockLogo,
} from '../stockLogo'

// 記錄每次探測的 URL，並依 okUrls 決定 onload / onerror。
let probedUrls = []
let okUrls = new Set()
const RealImage = globalThis.Image

function mockImage(okList) {
  probedUrls = []
  okUrls = new Set(okList)
  globalThis.Image = class {
    set src(value) {
      probedUrls.push(value)
      // 非同步觸發，模擬真實圖片載入
      setTimeout(() => (okUrls.has(value) ? this.onload?.() : this.onerror?.()), 0)
    }
  }
}

const url = (index, symbol) => LOGO_SOURCES[index](symbol)

describe('stockLogo 快取', () => {
  beforeEach(() => {
    clearStockLogoCache()
    localStorage.clear()
  })

  afterEach(() => {
    globalThis.Image = RealImage
    vi.useRealTimers()
  })

  it('第一個來源成功時就不再試第二個', async () => {
    mockImage([url(0, 'AAPL')])

    expect(await resolveStockLogo('AAPL')).toBe(0)
    expect(probedUrls).toEqual([url(0, 'AAPL')])
  })

  it('第一個來源失敗時會退到第二個', async () => {
    mockImage([url(1, 'TSM')])

    expect(await resolveStockLogo('TSM')).toBe(1)
    expect(probedUrls).toEqual([url(0, 'TSM'), url(1, 'TSM')])
  })

  it('全部來源都失敗時回 NOT_FOUND', async () => {
    mockImage([])

    expect(await resolveStockLogo('NOPE')).toBe(NOT_FOUND)
    expect(probedUrls).toHaveLength(LOGO_SOURCES.length)
  })

  it('結果會被快取，第二次不再發任何請求', async () => {
    mockImage([url(1, 'TSM')])
    await resolveStockLogo('TSM')

    const before = probedUrls.length
    expect(await resolveStockLogo('TSM')).toBe(1)
    expect(probedUrls).toHaveLength(before)
    // 快取命中時可同步取得，元件才能直接渲染而不閃 placeholder
    expect(getCachedSourceIndex('tsm')).toBe(1)
  })

  it('併發請求同一個 symbol 只探測一次', async () => {
    mockImage([url(0, 'MSFT')])

    const results = await Promise.all([
      resolveStockLogo('MSFT'),
      resolveStockLogo('MSFT'),
      resolveStockLogo('msft'),
    ])

    expect(results).toEqual([0, 0, 0])
    expect(probedUrls).toEqual([url(0, 'MSFT')])
  })
})
