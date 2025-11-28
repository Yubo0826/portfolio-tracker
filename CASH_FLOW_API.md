# 現金流功能 API 文件

## 概述

現金流功能提供了完整的現金帳戶管理和現金流記錄追蹤系統，支援手動記錄和自動追蹤股票交易及股利收入。

---

## 現金帳戶管理 (Cash Accounts)

### 1. 取得所有現金帳戶

**GET** `/api/cash-accounts`

**Query Parameters:**
- `uid` (required): 使用者 ID

**Response:**
```json
{
  "accounts": [
    {
      "id": 1,
      "uid": "user123",
      "name": "主要帳戶",
      "balance": 50000.00,
      "currency": "USD",
      "description": "我的主要投資帳戶",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z"
    }
  ],
  "totalBalance": 50000.00
}
```

---

### 2. 新增現金帳戶

**POST** `/api/cash-accounts`

**Request Body:**
```json
{
  "uid": "user123",
  "name": "儲蓄帳戶",
  "balance": 10000.00,
  "currency": "USD",
  "description": "長期儲蓄專用"
}
```

**Response:**
```json
{
  "message": "Cash account created successfully",
  "account": {
    "id": 2,
    "uid": "user123",
    "name": "儲蓄帳戶",
    "balance": 10000.00,
    "currency": "USD",
    "description": "長期儲蓄專用",
    "created_at": "2025-01-20T12:00:00.000Z",
    "updated_at": "2025-01-20T12:00:00.000Z"
  }
}
```

---

### 3. 更新現金帳戶

**PUT** `/api/cash-accounts/:id`

**Request Body:**
```json
{
  "uid": "user123",
  "name": "主要投資帳戶",
  "balance": 55000.00,
  "currency": "USD",
  "description": "更新後的描述"
}
```

**Response:**
```json
{
  "message": "Cash account updated successfully",
  "account": {
    "id": 1,
    "uid": "user123",
    "name": "主要投資帳戶",
    "balance": 55000.00,
    "currency": "USD",
    "description": "更新後的描述",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-20T13:00:00.000Z"
  }
}
```

---

### 4. 刪除現金帳戶

**DELETE** `/api/cash-accounts/:id?uid=user123`

**注意:** 如果帳戶有關聯的現金流記錄，將無法刪除。

**Response (成功):**
```json
{
  "message": "Cash account deleted successfully"
}
```

**Response (有關聯記錄):**
```json
{
  "message": "Cannot delete account with existing cash flow records",
  "relatedFlows": 15
}
```

---

### 5. 取得單一帳戶詳情

**GET** `/api/cash-accounts/:id?uid=user123`

**Response:**
```json
{
  "id": 1,
  "uid": "user123",
  "name": "主要帳戶",
  "balance": 50000.00,
  "currency": "USD",
  "description": "我的主要投資帳戶",
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z",
  "cash_flows": [
    {
      "id": 1,
      "amount": 5000.00,
      "flow_type": "salary",
      "description": "一月薪資",
      "date": "2025-01-15T00:00:00.000Z"
    }
  ]
}
```

---

## 現金流記錄 (Cash Flows)

### 1. 取得現金流記錄（支援分頁和篩選）

**GET** `/api/cash-flows`

**Query Parameters:**
- `uid` (required): 使用者 ID
- `portfolio_id` (optional): 投資組合 ID
- `account_id` (optional): 現金帳戶 ID
- `flow_type` (optional): 現金流類型
- `start_date` (optional): 開始日期 (YYYY-MM-DD)
- `end_date` (optional): 結束日期 (YYYY-MM-DD)
- `page` (optional): 頁碼，預設 1
- `limit` (optional): 每頁筆數，預設 50

**現金流類型 (flow_type):**
- `salary`: 薪資收入
- `transfer`: 帳戶轉帳
- `exchange`: 匯率調整
- `stock_buy`: 股票買入（自動生成）
- `stock_sell`: 股票賣出（自動生成）
- `dividend`: 股利收入（自動生成）
- `other`: 其他

**Response:**
```json
{
  "cashFlows": [
    {
      "id": 1,
      "uid": "user123",
      "account_id": 1,
      "portfolio_id": 1,
      "related_transaction_id": null,
      "related_dividend_id": null,
      "related_symbol": null,
      "amount": 5000.00,
      "flow_type": "salary",
      "description": "一月薪資",
      "date": "2025-01-15T00:00:00.000Z",
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T10:00:00.000Z",
      "cash_accounts": {
        "id": 1,
        "name": "主要帳戶",
        "currency": "USD"
      },
      "portfolios": {
        "id": 1,
        "name": "我的投資組合"
      }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "totalPages": 2
  }
}
```

---

### 2. 手動新增現金流記錄

**POST** `/api/cash-flows`

**Request Body:**
```json
{
  "uid": "user123",
  "account_id": 1,
  "portfolio_id": 1,
  "amount": 5000.00,
  "flow_type": "salary",
  "description": "一月薪資",
  "date": "2025-01-15"
}
```

**注意:** 
- `amount` 為正數代表收入，負數代表支出
- 會自動更新現金帳戶餘額

**Response:**
```json
{
  "message": "Cash flow created successfully",
  "cashFlow": {
    "id": 1,
    "uid": "user123",
    "account_id": 1,
    "portfolio_id": 1,
    "amount": 5000.00,
    "flow_type": "salary",
    "description": "一月薪資",
    "date": "2025-01-15T00:00:00.000Z",
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z",
    "cash_accounts": {
      "id": 1,
      "name": "主要帳戶",
      "currency": "USD"
    }
  },
  "newBalance": 55000.00
}
```

---

### 3. 刪除現金流記錄

**DELETE** `/api/cash-flows/:id?uid=user123`

**注意:** 
- 自動生成的現金流記錄（有 `related_transaction_id` 或 `related_dividend_id`）無法直接刪除
- 需刪除對應的交易或股利記錄
- 刪除時會自動調整帳戶餘額

**Response (成功):**
```json
{
  "message": "Cash flow deleted successfully",
  "newBalance": 50000.00
}
```

**Response (自動生成記錄):**
```json
{
  "message": "Cannot delete auto-generated cash flow records. Delete the related transaction or dividend instead."
}
```

---

### 4. 取得現金流統計

**GET** `/api/cash-flows/stats`

**Query Parameters:**
- `uid` (required): 使用者 ID
- `portfolio_id` (optional): 投資組合 ID
- `account_id` (optional): 現金帳戶 ID
- `start_date` (optional): 開始日期 (YYYY-MM-DD)
- `end_date` (optional): 結束日期 (YYYY-MM-DD)

**Response:**
```json
{
  "total_inflow": 15000.00,
  "total_outflow": 8000.00,
  "net_flow": 7000.00,
  "by_type": {
    "salary": {
      "count": 2,
      "total": 10000.00
    },
    "stock_buy": {
      "count": 3,
      "total": -8000.00
    },
    "dividend": {
      "count": 5,
      "total": 5000.00
    }
  }
}
```

---

## 自動現金流生成

### 1. 股票交易自動生成

當建立股票交易時，如果提供 `cash_account_id`，系統會自動：
1. 建立對應的現金流記錄
2. 更新現金帳戶餘額

**交易 API 範例:**

```json
POST /api/transactions
{
  "uid": "user123",
  "portfolio_id": 1,
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "asset_type": "stock",
  "shares": 10,
  "price": 150.00,
  "fee": 5.00,
  "transaction_type": "buy",
  "transaction_date": "2025-01-20",
  "cash_account_id": 1  // 指定現金帳戶
}
```

**自動生成的現金流:**
- `flow_type`: "stock_buy"
- `amount`: -1505.00 (10 * 150 + 5)
- `related_transaction_id`: (交易 ID)
- `related_symbol`: "AAPL"

---

### 2. 股利收入自動生成

當同步股利時，可以選擇性提供 `cash_account_id`：

```json
POST /api/dividends/sync
{
  "uid": "user123",
  "portfolio_id": 1,
  "cash_account_id": 1  // 可選，如果不提供會使用第一個帳戶
}
```

系統會自動：
1. 檢查上次同步後新增的股利記錄
2. 為每筆新股利建立現金流記錄
3. 更新現金帳戶餘額

**自動生成的現金流:**
- `flow_type`: "dividend"
- `amount`: (股利金額 * 持股數)
- `related_dividend_id`: (股利 ID)
- `related_symbol`: (股票代碼)
- `description`: "AAPL 股利收入 (100 股 × $0.24)"

---

### 3. 刪除交易時的現金流處理

當刪除交易時，系統會自動：
1. 找到相關的現金流記錄
2. 扣回現金流金額（更新帳戶餘額）
3. 刪除現金流記錄

```json
DELETE /api/transactions
{
  "ids": [1, 2, 3],
  "uid": "user123",
  "portfolio_id": 1
}
```

---

## 資料庫 Schema

### cash_accounts 表

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INT | 主鍵 |
| uid | VARCHAR(255) | 使用者 ID |
| name | VARCHAR(255) | 帳戶名稱 |
| balance | DECIMAL(15,2) | 帳戶餘額 |
| currency | VARCHAR(10) | 貨幣類型，預設 "USD" |
| description | VARCHAR(255) | 帳戶描述 |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間（自動更新） |

### cash_flows 表

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INT | 主鍵 |
| uid | VARCHAR(255) | 使用者 ID |
| account_id | INT | 現金帳戶 ID |
| portfolio_id | INT | 投資組合 ID（可選） |
| related_transaction_id | INT | 關聯交易 ID（自動生成） |
| related_dividend_id | INT | 關聯股利 ID（自動生成） |
| related_symbol | VARCHAR(10) | 關聯股票代碼 |
| amount | DECIMAL(15,2) | 金額（正數=收入，負數=支出） |
| flow_type | VARCHAR(20) | 現金流類型 |
| description | VARCHAR(255) | 描述 |
| date | DATE | 現金流日期 |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間（自動更新） |

---

## 使用範例

### 完整流程範例

1. **建立現金帳戶**
```javascript
const response = await fetch('/api/cash-accounts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: 'user123',
    name: '投資帳戶',
    balance: 50000,
    currency: 'USD'
  })
});
```

2. **手動新增薪資收入**
```javascript
const response = await fetch('/api/cash-flows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: 'user123',
    account_id: 1,
    amount: 5000,
    flow_type: 'salary',
    description: '一月薪資',
    date: '2025-01-15'
  })
});
```

3. **買入股票（自動生成現金流）**
```javascript
const response = await fetch('/api/transactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: 'user123',
    portfolio_id: 1,
    symbol: 'AAPL',
    shares: 10,
    price: 150,
    fee: 5,
    transaction_type: 'buy',
    cash_account_id: 1  // 會自動建立現金流並扣款
  })
});
```

4. **同步股利（自動生成現金流）**
```javascript
const response = await fetch('/api/dividends/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: 'user123',
    portfolio_id: 1,
    cash_account_id: 1  // 會自動建立股利現金流
  })
});
```

5. **查看現金流統計**
```javascript
const response = await fetch('/api/cash-flows/stats?uid=user123&start_date=2025-01-01&end_date=2025-01-31');
```

---

## 注意事項

1. **餘額自動更新**: 所有現金流的新增和刪除都會自動更新帳戶餘額，無需手動計算。

2. **自動生成記錄**: 股票交易和股利相關的現金流記錄會自動生成，無法直接刪除，必須刪除對應的交易或股利。

3. **帳戶刪除限制**: 有現金流記錄的帳戶無法刪除，需先清空相關記錄。

4. **日期篩選**: 所有日期參數使用 ISO 格式 (YYYY-MM-DD)。

5. **貨幣支援**: 目前支援多種貨幣類型，預設為 USD。

6. **分頁建議**: 現金流記錄較多時建議使用分頁，預設每頁 50 筆。

---

## 錯誤處理

所有 API 都會返回適當的 HTTP 狀態碼：

- `200`: 成功
- `201`: 建立成功
- `400`: 請求參數錯誤
- `404`: 資源不存在
- `500`: 伺服器錯誤

錯誤回應格式：
```json
{
  "message": "錯誤訊息描述"
}
```
