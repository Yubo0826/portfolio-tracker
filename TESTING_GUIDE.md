# 測試指南 (Testing Guide)

## 🎯 測試策略

### 測試金字塔（由下而上）
```
        /\
       /E2E\         ← 少量端對端測試
      /------\
     /Integration\   ← 中等整合測試
    /------------\
   /  Unit Tests  \  ← 大量單元測試
  /----------------\
```

## 📦 已安裝的測試工具

- **Vitest**: 測試框架（Vite 原生支援）
- **@vue/test-utils**: Vue 組件測試工具
- **jsdom**: 模擬瀏覽器環境

## 🚀 開始測試的步驟

### Step 1: Utility Functions（最簡單）
先測試純函數，不依賴 Vue、Pinia 或外部 API。

**優先級**: ⭐⭐⭐
**難度**: 🟢 簡單

範例：
- `src/composables/useCurrency.ts` - 貨幣格式化
- `src/utils/api.js` - API 工具函數

### Step 2: Composables（中等）
測試 Vue Composables，需要模擬 Vue 的 reactivity。

**優先級**: ⭐⭐
**難度**: 🟡 中等

範例：
- `src/composables/useTheme.js`
- `src/composables/toast.js`
- `src/composables/loading.js`

### Step 3: Pinia Stores（重要）
測試狀態管理邏輯，需要模擬 API 和 Firebase。

**優先級**: ⭐⭐⭐
**難度**: 🟡 中等

範例：
- `src/stores/holdings.ts`
- `src/stores/transactions.ts`
- `src/stores/portfolio.ts`

### Step 4: Components（最複雜）
測試 Vue 組件，需要完整的測試環境。

**優先級**: ⭐
**難度**: 🔴 困難

範例：
- `src/components/TransactionDialog.vue`
- `src/components/SearchBox.vue`

### Step 5: Views（整合測試）
測試完整頁面，包含多個組件和 stores。

**優先級**: ⭐
**難度**: 🔴 困難

範例：
- `src/views/DashboardView.vue`
- `src/views/RebalancingView.vue`

## 📝 建議的測試優先順序

### 高優先級（最大 ROI）
1. **Rebalancing 邏輯** (`RebalancingView.vue` 的 `rebalanceAllocate` 函數)
   - 提取成純函數
   - 測試各種場景：deposit、withdraw、超標、不足
   
2. **Holdings Store** - 核心業務邏輯
   - 測試 CRUD 操作
   - 測試計算邏輯（totalCost, currentValue, profit）

3. **Transactions Store** - 交易處理
   - 測試買賣邏輯
   - 測試驗證規則

### 中優先級
4. **Currency Composable** - 貨幣轉換
5. **Portfolio Store** - 組合管理
6. **Allocation 計算** - 配置邏輯

### 低優先級
7. UI 組件測試
8. E2E 測試

## 🛠️ 測試範例架構

### 檔案結構
```
src/
  composables/
    __tests__/
      useCurrency.spec.ts
      useTheme.spec.js
  stores/
    __tests__/
      holdings.spec.ts
      transactions.spec.ts
  utils/
    __tests__/
      rebalance.spec.ts    # 提取純函數
  views/
    __tests__/
      DashboardView.spec.js
```

## 🎓 測試範例模板

詳見：
- `src/composables/__tests__/useCurrency.spec.ts`
- `src/stores/__tests__/holdings.spec.ts`
- `src/utils/__tests__/rebalance.spec.ts`

## 🏃 運行測試

```bash
# 運行所有測試
npm run test:unit

# Watch 模式（開發時使用）
npm run test:unit -- --watch

# 查看覆蓋率
npm run test:unit -- --coverage

# 運行特定測試檔案
npm run test:unit src/stores/__tests__/holdings.spec.ts
```

## 📊 測試覆蓋率目標

- **Critical Logic**: 80%+（Stores、Rebalancing）
- **Composables**: 60%+
- **Components**: 40%+
- **Overall**: 50%+

## 💡 最佳實踐

1. **AAA 模式**: Arrange（準備）→ Act（執行）→ Assert（斷言）
2. **描述性命名**: 測試名稱要清楚說明測試內容
3. **獨立測試**: 每個測試獨立運行，不依賴其他測試
4. **Mock 外部依賴**: API、Firebase、LocalStorage
5. **測試邊界情況**: 空值、極值、錯誤輸入
