# 🚀 快速開始測試

## 1️⃣ 立即可運行的測試

```bash
# 運行現有的測試範例
npm run test:unit src/composables/__tests__/useCurrency.spec.ts

# Watch 模式（自動重跑）
npm run test:watch

# UI 模式（需安裝 @vitest/ui）
npm run test:ui
```

## 2️⃣ 建議的測試順序

### 第一步：測試 Composables（10分鐘）
```bash
npm run test:unit src/composables/__tests__/useCurrency.spec.ts
```

**下一步**：為其他 composables 編寫類似測試
- `src/composables/useTheme.js`
- `src/composables/toast.js`

### 第二步：測試 Pinia Stores（30分鐘）
```bash
npm run test:unit src/stores/__tests__/holdings.spec.ts
```

**下一步**：為關鍵 stores 編寫測試
- `src/stores/transactions.ts`
- `src/stores/portfolio.ts`

### 第三步：提取並測試 Rebalancing 邏輯（1小時）

**重構步驟**：
1. 在 `src/utils/rebalance.ts` 創建新文件
2. 從 `RebalancingView.vue` 複製 `rebalanceAllocate` 函數
3. 改為純函數（移除 Vue 依賴）
4. 在 `RebalancingView.vue` 中導入使用
5. 運行測試：`npm run test:unit src/utils/__tests__/rebalance.spec.ts`

## 3️⃣ 測試範例速查

### 測試 Computed Property
```javascript
it('should calculate total value', () => {
  const store = useHoldingsStore()
  store.list = [
    { currentValue: 1000 },
    { currentValue: 2000 }
  ]
  expect(store.totalValue).toBe(3000)
})
```

### 測試 Async Function with Mock
```javascript
it('should fetch data', async () => {
  vi.mocked(api.get).mockResolvedValueOnce([{ id: 1 }])
  
  await store.fetchData()
  
  expect(api.get).toHaveBeenCalled()
  expect(store.list).toHaveLength(1)
})
```

### 測試錯誤處理
```javascript
it('should handle errors', async () => {
  vi.mocked(api.get).mockRejectedValueOnce(new Error('Failed'))
  
  await store.fetchData()
  
  expect(store.isLoading).toBe(false)
  expect(store.error).toBeTruthy()
})
```

## 4️⃣ 常見問題

### Q: 測試失敗：Cannot find module
```bash
# 確保路徑別名在 vitest.config.js 中正確配置
```

### Q: Pinia store 未定義
```javascript
// 每個測試前都要設置
beforeEach(() => {
  setActivePinia(createPinia())
})
```

### Q: 需要 mock Firebase
```javascript
vi.mock('@/firebase', () => ({
  auth: mockFirebase().auth,
  db: mockFirebase().firestore
}))
```

## 5️⃣ 覆蓋率目標

運行覆蓋率報告：
```bash
npm run test:coverage
```

**目標**：
- ✅ 純函數/工具函數: 80%+
- ✅ Pinia Stores: 70%+
- ⚠️ Vue 組件: 40%+（可選）

## 6️⃣ 持續改進

- [ ] 每次新增功能都編寫測試
- [ ] 修 bug 前先寫失敗的測試
- [ ] 定期檢視覆蓋率報告
- [ ] 重構時保持測試通過

## 📚 延伸閱讀

- [Vitest 文檔](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Pinia](https://pinia.vuejs.org/cookbook/testing.html)
