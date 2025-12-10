/**
 * 測試輔助函數
 * 提供常用的 mock 數據和工具函數
 */

import { vi } from 'vitest'

/**
 * Mock Firebase Auth User
 */
export const mockUser = (overrides = {}) => ({
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  ...overrides
})

/**
 * Mock Portfolio
 */
export const mockPortfolio = (overrides = {}) => ({
  id: 'portfolio-123',
  name: 'Test Portfolio',
  user_id: 'test-user-123',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
})

/**
 * Mock Holding
 */
export const mockHolding = (overrides = {}) => ({
  id: '1',
  symbol: 'AAPL',
  name: 'Apple Inc.',
  asset_type: 'stock',
  total_shares: '100',
  avg_cost: '150.00',
  current_price: '180.00',
  target_percentage: '50',
  last_updated: '2025-01-01T00:00:00Z',
  ...overrides
})

/**
 * Mock Transaction
 */
export const mockTransaction = (overrides = {}) => ({
  id: '1',
  symbol: 'AAPL',
  name: 'Apple Inc.',
  assetType: 'stock',
  price: '150.00',
  fee: '5.00',
  shares: '10',
  transaction_type: 'buy',
  transaction_date: '2025-01-01',
  cash_account_id: null,
  ...overrides
})

/**
 * Mock API Response
 */
export const mockApiResponse = (data: any, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

/**
 * Mock API Error
 */
export const mockApiError = (message = 'API Error', delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay)
  })
}

/**
 * 等待 nextTick (用於等待 Vue reactivity 更新)
 */
export const flushPromises = () => {
  return new Promise((resolve) => setImmediate(resolve))
}

/**
 * Mock LocalStorage
 */
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key]
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    }),
    get length() {
      return Object.keys(storage).length
    },
    key: vi.fn((index: number) => Object.keys(storage)[index] || null)
  }
}

/**
 * Mock Firebase
 */
export const mockFirebase = () => ({
  auth: {
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn((callback) => {
      callback(mockUser())
      return vi.fn() // unsubscribe function
    })
  },
  firestore: {
    collection: vi.fn(),
    doc: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    deleteDoc: vi.fn()
  }
})

/**
 * 創建測試用的 Pinia Store 工廠函數
 */
export const createTestStore = (storeFn: any, initialState = {}) => {
  const store = storeFn()
  Object.assign(store.$state, initialState)
  return store
}

/**
 * 等待指定時間
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Mock 日期
 */
export const mockDate = (isoString: string) => {
  const RealDate = Date
  const mockDate = new RealDate(isoString)
  
  global.Date = class extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        return mockDate
      }
      return new RealDate(...args)
    }
    
    static now() {
      return mockDate.getTime()
    }
  } as any

  return () => {
    global.Date = RealDate
  }
}

/**
 * 驗證數字近似相等（用於浮點數比較）
 */
export const expectApprox = (actual: number, expected: number, tolerance = 0.01) => {
  const diff = Math.abs(actual - expected)
  if (diff > tolerance) {
    throw new Error(
      `Expected ${actual} to be approximately ${expected} (tolerance: ${tolerance}), but difference is ${diff}`
    )
  }
}
