# 🚀 快速開始測試

## 1️⃣ 立即可運行的測試

```bash
# 運行所有測試（72 個測試）
npm run test:unit

# 運行特定測試套件
npm run test:unit src/stores/__tests__/
npm run test:unit src/utils/__tests__/rebalance.spec.ts
npm run test:unit src/composables/__tests__/useCurrency.spec.ts
npm run test:unit src/stores/__tests__/transactions.spec.ts

# Watch 模式（自動重跑）
npm run test:watch

# 覆蓋率報告
npm run test:coverage
```

## 2️⃣ 現有測試概覽

### ✅ 已完成的測試（72 個測試全部通過）

#### Composables 測試
- `src/composables/__tests__/useCurrency.spec.ts` - 貨幣格式化功能

#### Pinia Stores 測試
- `src/stores/__tests__/holdings.spec.ts` (9 tests) - 持倉數據管理
- `src/stores/__tests__/transactions.spec.ts` (30 tests) - 交易記錄 CRUD
- `src/stores/__tests__/cashflow.spec.ts` (33 tests) - 現金帳戶與現金流管理

#### Utils 測試
- `src/utils/__tests__/rebalance.spec.ts` - 資產再平衡演算法

### 📦 測試輔助工具

所有測試使用統一的 Mock 數據工廠函數（位於 `src/utils/test-helpers.ts`）：
- `mockUser()` - 模擬用戶資料
- `mockPortfolio()` - 模擬投資組合
- `mockTransaction()` - 模擬交易記錄
- `mockCashAccount()` - 模擬現金帳戶
- `mockCashFlow()` - 模擬現金流記錄

## 3️⃣ 編寫新測試的步驟

### 測試 Pinia Store

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useYourStore } from '@/stores/your-store'
import { mockUser, mockPortfolio } from '@/utils/test-helpers'
import * as api from '@/utils/api'

// Mock API
vi.mock('@/utils/api')

describe('Your Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    
    // 設置 auth mock
    const authStore = useAuthStore()
    authStore.user = mockUser()
  })

  it('should do something', async () => {
    const store = useYourStore()
    // 測試邏輯...
  })
})
```

### 測試純函數

```javascript
import { describe, it, expect } from 'vitest'
import { yourFunction } from '@/utils/your-util'

describe('yourFunction', () => {
  it('應該正確計算結果', () => {
    const result = yourFunction(input)
    expect(result).toBe(expected)
  })

  it('應該處理邊界情況', () => {
    expect(yourFunction(null)).toBe(defaultValue)
  })
})
```

## 4️⃣ 測試範例速查

### 測試 Computed Property
```javascript
it('應該計算總市值', () => {
  const store = useHoldingsStore()
  store.list = [
    { currentValue: 1000, profitPercent: 10 },
    { currentValue: 2000, profitPercent: 5 }
  ]
  expect(store.totalValue).toBe(3000)
})
```

### 測試 API 調用（Async）
```javascript
it('應該成功獲取數據', async () => {
  const mockData = [mockTransaction()]
  vi.mocked(api.get).mockResolvedValueOnce({ transactions: mockData })
  
  const store = useTransactionsStore()
  await store.fetchTransactions()
  
  expect(api.get).toHaveBeenCalledWith('/transactions', expect.any(Object))
  expect(store.transactions).toHaveLength(1)
  expect(store.isLoading).toBe(false)
})
```

### 測試錯誤處理
```javascript
it('應該處理 API 錯誤', async () => {
  vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'))
  
  const store = useTransactionsStore()
  await store.fetchTransactions()
  
  expect(store.isLoading).toBe(false)
  expect(store.transactions).toHaveLength(0)
})
```

### 測試數據轉換
```javascript
it('應該正確轉換後端數據格式', () => {
  const store = useHoldingsStore()
  const backendData = {
    holdings: [
      { symbol: 'AAPL', shares: 100, avg_cost: '150.00' }
    ]
  }
  
  store.setHoldings(backendData)
  
  expect(store.list[0]).toMatchObject({
    symbol: 'AAPL',
    shares: 100,
    avgCost: 150
  })
})
```

### 使用 Mock 工廠函數
```javascript
it('應該處理自定義數據', () => {
  // 使用預設值
  const user = mockUser()
  expect(user.uid).toBe('demo-user')
  
  // 覆寫特定欄位
  const customUser = mockUser({ uid: 'custom-123', email: 'test@example.com' })
  expect(customUser.uid).toBe('custom-123')
  
  // 測試多筆資料
  const account1 = mockCashAccount({ id: '1', currency: 'TWD' })
  const account2 = mockCashAccount({ id: '2', currency: 'USD' })
})
```

### 測試數值精度
```javascript
it('應該在容許誤差內', () => {
  const result = calculateProfit(100, 105)
  // 使用 toBeCloseTo 處理浮點數誤差
  expect(result).toBeCloseTo(5, -1) // 容許 ±5 的誤差
})
```

## 5️⃣ 常見問題與解決方案

### Q: 測試失敗：Cannot find module '@/...'
**解決方案**：檢查 `vitest.config.js` 中的路徑別名配置
```javascript
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url))
  }
}
```

### Q: Pinia store 測試報錯
**解決方案**：每個測試前初始化 Pinia
```javascript
beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})
```

### Q: API mock 沒有生效
**解決方案**：確保在測試檔案最上方 mock
```javascript
import * as api from '@/utils/api'
vi.mock('@/utils/api')

// 然後在測試中使用
vi.mocked(api.get).mockResolvedValueOnce(mockData)
```

### Q: 測試中需要 auth 用戶
**解決方案**：使用 `mockUser()` 設置 auth store
```javascript
beforeEach(() => {
  const authStore = useAuthStore()
  authStore.user = mockUser()
})
```

### Q: 浮點數比較失敗
**解決方案**：使用 `toBeCloseTo()` 處理精度問題
```javascript
// ❌ 可能失敗
expect(result).toBe(100.5)

// ✅ 正確做法
expect(result).toBeCloseTo(100.5, 1) // 小數點後 1 位精度
expect(result).toBeCloseTo(100, -1)  // 容許 ±5 誤差
```

### Q: 需要測試多個相關的 store
**解決方案**：在同一個測試中使用多個 store
```javascript
it('應該同步更新相關 store', async () => {
  const transactionStore = useTransactionsStore()
  const holdingsStore = useHoldingsStore()
  const cashflowStore = useCashFlowStore()
  
  await transactionStore.saveTransaction(mockTransaction())
  
  // 驗證相關 store 的變化
  expect(holdingsStore.list).toHaveLength(1)
  expect(cashflowStore.flows).toHaveLength(1)
})
```

## 6️⃣ 測試最佳實踐

### ✅ DO（建議）
- ✅ 使用 `mockUser()`, `mockPortfolio()` 等工廠函數
- ✅ 每個測試獨立，不依賴執行順序
- ✅ 測試描述使用中文，清楚說明測試目的
- ✅ 使用 `beforeEach` 重置狀態
- ✅ Mock 外部依賴（API、Firebase）
- ✅ 測試邊界情況和錯誤處理

### ❌ DON'T（避免）
- ❌ 不要在測試中硬編碼大量 mock 數據
- ❌ 不要測試 Pinia 內部實現（如 `setTransactions`）
- ❌ 不要忘記 `vi.clearAllMocks()`
- ❌ 不要使用 `toBe()` 比較浮點數
- ❌ 不要在沒有 `setActivePinia` 時使用 store

## 7️⃣ 下一步建議

### 尚未測試的模組（按優先級）

#### 高優先級 🔴
- [ ] `src/stores/portfolio.ts` - 投資組合管理
- [ ] `src/stores/settings.ts` - 用戶設定
- [ ] `src/stores/auth.ts` - 身份驗證

#### 中優先級 🟡
- [ ] `src/composables/useTheme.js` - 主題切換
- [ ] `src/composables/toast.js` - 通知系統
- [ ] `src/composables/loading.js` - 載入狀態

#### 低優先級 🟢
- [ ] Vue 組件測試（可選）
- [ ] E2E 測試（未來考慮）

### 執行覆蓋率檢查
```bash
npm run test:coverage

# 查看詳細報告（會在瀏覽器開啟）
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

## 8️⃣ 持續改進策略

1. **新功能開發**
   - 先寫測試（TDD）或同時寫測試
   - 確保新代碼有測試覆蓋

2. **Bug 修復**
   - 先寫失敗的測試重現 bug
   - 修復後測試應該通過

3. **重構**
   - 重構前確保測試通過
   - 重構後測試仍應通過

4. **定期檢查**
   - 每週檢視覆蓋率報告
   - 識別未測試的關鍵路徑

## 📚 參考資源

- [Vitest 官方文檔](https://vitest.dev/)
- [Testing Pinia](https://pinia.vuejs.org/cookbook/testing.html)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Vitest UI](https://vitest.dev/guide/ui.html) - 視覺化測試介面
