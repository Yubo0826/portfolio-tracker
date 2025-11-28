# 現金流 API 整合完成說明

## 已完成的整合

### 1. Store 層 (`src/stores/cashflow.ts`)

#### 已實現的 API 調用：

**現金帳戶管理**
- ✅ `fetchCashAccounts()` - GET /api/cash-accounts
- ✅ `addCashAccount()` - POST /api/cash-accounts
- ✅ `updateCashAccount()` - PUT /api/cash-accounts/:id
- ✅ `deleteCashAccount()` - DELETE /api/cash-accounts/:id

**現金流管理**
- ✅ `fetchCashFlows()` - GET /api/cash-flows (支援篩選、分頁)
- ✅ `addCashFlow()` - POST /api/cash-flows
- ✅ `deleteCashFlow()` - DELETE /api/cash-flows/:id

#### 資料轉換

**後端到前端的現金流類型對照：**
```typescript
'salary' → 'DEPOSIT'
'transfer' → 'TRANSFER_IN'
'exchange' → 'ADJUSTMENT'
'stock_buy' → 'STOCK_BUY'
'stock_sell' → 'STOCK_SELL'
'dividend' → 'DIVIDEND'
'other' → 'OTHER'
```

**前端到後端的現金流類型對照：**
```typescript
'DEPOSIT' → 'salary'
'WITHDRAWAL' → 'other'
'STOCK_BUY' → 'stock_buy'
'STOCK_SELL' → 'stock_sell'
'DIVIDEND' → 'dividend'
'FEE' → 'other'
'TRANSFER_IN' → 'transfer'
'TRANSFER_OUT' → 'transfer'
'ADJUSTMENT' → 'exchange'
'OTHER' → 'other'
```

### 2. 認證整合

- 使用 `useAuthStore` 獲取當前使用者的 `uid`
- 所有 API 請求都包含 `uid` 參數進行身份驗證
- Demo 模式使用 `uid: 'demo-user'`

### 3. 資料格式轉換

**CashAccount 格式轉換：**
- 後端 `id` (number) → 前端 `id` (string)
- 後端 `balance` (decimal) → 前端 `balance` (number)
- 後端 `portfolio_id` → 前端 `portfolioId`
- 自動補充前端需要的 `isActive: true`

**CashFlow 格式轉換：**
- 後端 `account_id` → 前端 `accountId`
- 後端 `portfolio_id` → 前端 `portfolioId`
- 後端 `flow_type` → 前端 `type` (使用類型對照函數)
- 後端 `related_transaction_id` → 前端 `relatedTransactionId`
- 後端 `related_symbol` → 前端 `relatedSymbol`

### 4. 錯誤處理

- 統一錯誤訊息顯示
- 針對特定錯誤提供友善提示：
  - 刪除有現金流記錄的帳戶時提示
  - 刪除自動生成的現金流記錄時提示
  - 未登入時提示

### 5. UI 元件更新

**CashFlowForm.vue：**
- ✅ 加入日期選擇功能
- ✅ 提交時轉換日期為 YYYY-MM-DD 格式
- ✅ 支援傳遞 `date` 參數到 API

**TransactionDialog.vue：**
- ✅ 加入帳戶選擇下拉選單（非必填）
- ✅ 使用 `activeAccounts` 作為選項來源

### 6. 類型定義更新

**global.d.ts：**
- ✅ `NewCashFlow` 介面加入 `date?: string` 欄位

## 待整合功能

### 交易自動生成現金流

當在 `TransactionDialog` 中新增/編輯交易時，如果選擇了帳戶，需要：

1. 在 `transactions` store 的 `saveTransaction` 函數中：
   ```typescript
   // 如果有選擇帳戶，傳遞 cash_account_id
   const requestBody = {
     ...transactionData,
     cash_account_id: form.accountId ? parseInt(form.accountId) : undefined
   }
   ```

2. 後端會自動：
   - 建立對應的現金流記錄
   - 更新帳戶餘額
   - 連結 `related_transaction_id`

### 股利自動同步

在股利同步功能中加入帳戶選擇：

```typescript
// 在 dividends store 或相關 API 調用中
await api.post('/api/dividends/sync', {
  uid,
  portfolio_id,
  cash_account_id: selectedAccountId  // 新增此參數
})
```

## 測試檢查清單

- [ ] 新增現金帳戶
- [ ] 編輯現金帳戶
- [ ] 刪除現金帳戶（無現金流）
- [ ] 刪除現金帳戶（有現金流，應失敗）
- [ ] 手動新增現金流（收入）
- [ ] 手動新增現金流（支出）
- [ ] 刪除手動現金流
- [ ] 查看現金流列表
- [ ] 按帳戶篩選現金流
- [ ] 切換帳戶時更新現金流列表
- [ ] 餘額自動更新
- [ ] 日期選擇功能
- [ ] 在交易中選擇帳戶（待後續整合測試）

## API Base URL 設定

開發環境：`http://localhost:3000`
生產環境：使用環境變數 `VITE_API_URL_BASE`

設定於 `src/utils/api.js`

## 注意事項

1. **ID 類型轉換**：後端使用 number，前端使用 string，需要適當轉換
2. **日期格式**：統一使用 YYYY-MM-DD 格式傳遞給後端
3. **餘額更新**：依賴後端返回的 `newBalance`，不在前端手動計算
4. **Demo 模式**：使用 `demo-user` 作為 uid
5. **分頁支援**：fetchCashFlows 支援分頁參數，但前端暫未使用

## 相關檔案

- `src/stores/cashflow.ts` - 現金流 Pinia store
- `src/components/CashFlowForm.vue` - 現金流表單
- `src/components/CashAccountForm.vue` - 現金帳戶表單
- `src/components/TransactionDialog.vue` - 交易對話框（已加入帳戶選擇）
- `src/views/CashFlowView.vue` - 現金流管理頁面
- `src/types/global.d.ts` - TypeScript 類型定義
- `CASH_FLOW_API.md` - 後端 API 文件
