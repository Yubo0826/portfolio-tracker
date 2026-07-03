# 後端 API 端點文件

後端專案：`tiingo-proxy`（Express）
Base URL：本機開發 `http://localhost:3000`；正式環境使用 `VITE_API_URL_BASE`（部署於 Railway，對應 `https://stockbar.up.railway.app`）

---

## `/api/transactions`（`routes/transactions.js`）

| Method | Path | 說明 | 參數 |
|---|---|---|---|
| GET | `/api/transactions` | 取得指定使用者/投資組合的交易紀錄與持股 | query: `uid`, `portfolio_id` |
| POST | `/api/transactions` | 新增一筆交易，並更新持股（可自動建立對應現金流） | body: `uid, portfolio_id, symbol, name, asset_type, shares, price, currency, fee, transaction_type, transaction_date, cash_account_id` |
| POST | `/api/transactions/bulk` | 批次新增交易並更新持股 | body: `uid, portfolio_id, transactions[]` |
| PUT | `/api/transactions/:id` | 更新單筆交易並重算持股（含買賣方向切換） | params: `id`；body: `uid, portfolio_id, symbol, name, asset_type, shares, fee, price, currency, transaction_type, transaction_date` |
| DELETE | `/api/transactions` | 刪除交易、回沖相關現金流、重算受影響持股 | body: `ids[], uid, portfolio_id` |

## `/api/user`（`routes/users.js`）

| Method | Path | 說明 | 參數 |
|---|---|---|---|
| POST | `/api/user` | 使用者不存在時建立新使用者 | body: `uid, email, displayName` |
| GET | `/api/user/settings` | 取得使用者設定（漂移警示門檻） | query: `uid` |
| PUT | `/api/user/settings` | 更新使用者漂移門檻設定 | body: `uid, settings.drift_threshold` |
| POST | `/api/user/send-test-email` | 發送測試信件 | body: `to` |
| POST | `/api/user/send-drift-alert-test` | 手動觸發所有投資組合的漂移檢查（同每日排程邏輯） | — |

## `/api/search`（`routes/tiingo/search.js`）— 目前前端未呼叫

| Method | Path | 說明 | 參數 |
|---|---|---|---|
| GET | `/api/search/symbols` | 透過 Tiingo API 搜尋股票代號 | query: `query` |
| GET | `/api/search/price/:symbol` | 無日期時回傳 Yahoo 即時報價，有日期則回傳歷史資料 | params: `symbol`；query: `startDate, endDate` |

## `/api/holdings`（`routes/holdings.js`）

| Method | Path | 說明 | 參數 |
|---|---|---|---|
| GET | `/api/holdings` | 取得持股清單 | query: `uid, portfolio_id` |
| POST | `/api/holdings/refresh-prices` | 依 Yahoo 報價刷新各持股現價 | body: `uid, portfolio_id` |
| DELETE | `/api/holdings` | 刪除持股（連帶刪除相關交易） | body: `ids[], portfolio_id, uid` |

## `/api/portfolio`（`routes/portfolio.js`）

| Method | Path | 說明 | 參數 |
|---|---|---|---|
| GET | `/api/portfolio` | 取得投資組合清單 | query: `uid` |
| POST | `/api/portfolio` | 建立投資組合 | body: `uid, name, description, drift_threshold, enable_email_alert` |
| PUT | `/api/portfolio` | 更新投資組合 | body: `id, name, description, drift_threshold, enable_email_alert` |
| DELETE | `/api/portfolio` | 刪除投資組合（連帶刪除持股/交易/股利/配置） | body: `ids[], uid` |

## `/api/allocation`（`routes/allocation.js`）

| Method | Path | 說明 | 參數 |
|---|---|---|---|
| GET | `/api/allocation` | 取得目標資產配置 | query: `uid, portfolio_id` |
| POST | `/api/allocation` | 覆寫投資組合的目標配置，並同步持股的 `target_percentage` | body: `assets[], uid, portfolio_id` |

## `/api/dividends`（`routes/dividends.js`）

| Method | Path | 說明 | 參數 |
|---|---|---|---|
| GET | `/api/dividends` | 取得股利紀錄 | query: `uid, portfolio_id` |
| POST | `/api/dividends/sync` | 依持股同步 Yahoo 股利歷史，並自動建立對應現金流 | body: `uid, portfolio_id, cash_account_id` |

## `/api/cash-accounts`（`routes/cashAccounts.js`）

| Method | Path | 說明 | 參數 |
|---|---|---|---|
| GET | `/api/cash-accounts` | 取得現金帳戶清單與總餘額 | query: `uid` |
| POST | `/api/cash-accounts` | 建立現金帳戶 | body: `uid, name, balance, currency, description` |
| PUT | `/api/cash-accounts/:id` | 更新現金帳戶 | params: `id`；body: `uid, name, balance, currency, description` |
| DELETE | `/api/cash-accounts/:id` | 刪除現金帳戶（若有相關現金流則擋下） | params: `id`；query: `uid` |
| GET | `/api/cash-accounts/:id` | 取得帳戶詳情與最近 10 筆現金流 | params: `id`；query: `uid` |

## `/api/cash-flows`（`routes/cashFlows.js`）

| Method | Path | 說明 | 參數 |
|---|---|---|---|
| GET | `/api/cash-flows` | 分頁/篩選現金流列表 | query: `uid, portfolio_id, account_id, flow_type, start_date, end_date, page, limit` |
| POST | `/api/cash-flows` | 手動建立現金流並更新帳戶餘額 | body: `uid, account_id, portfolio_id, amount, flow_type, description, date` |
| DELETE | `/api/cash-flows/:id` | 刪除手動現金流（自動產生者不可刪） | params: `id`；query: `uid` |
| GET | `/api/cash-flows/stats` | 依 `flow_type` 分組回傳收入/支出/淨額統計 | query: `uid, portfolio_id, account_id, start_date, end_date` |

## `/api/yahoo`（`routes/yahooFinance.js`）

| Method | Path | 說明 | 參數 |
|---|---|---|---|
| GET | `/api/yahoo/symbol` | 股票代號搜尋（自動完成） | query: `query` |
| GET | `/api/yahoo/quote` | 即時報價 | query: `symbol` |
| GET | `/api/yahoo/chart` | 歷史 K 線資料 | query: `symbol, period1, period2, interval` |
| GET | `/api/yahoo/holdings-chart` | 依交易紀錄與歷史價格計算每日投組總市值時序（Dashboard 成長圖） | query: `uid, portfolio_id, interval, period1, period2` |
| GET | `/api/yahoo/allocation-chart` | 回傳目標配置中各標的歷史收盤價 | query: `uid, portfolio_id, period1, period2, interval` |
| GET | `/api/yahoo/summary` | Yahoo quoteSummary（公司概況/財務資料等） | query: `symbol` |
| GET | `/api/yahoo/trending` | 熱門漲幅股（前 5 名） | query: `region, lang` — *前端未呼叫* |
| GET | `/api/yahoo/recommend` | Yahoo 原始推薦結果 | query: `symbol` — *前端未呼叫* |
| GET | `/api/yahoo/recommend/cards` | 推薦卡片（含報價與漲跌） | query: `symbol, limit`（上限 10） |
| GET | `/api/yahoo/recommend/symbols` | 跨多檔持股的投組擴展推薦 | query: `symbols`（逗號分隔）, `limit` — *前端未呼叫* |
| GET | `/api/yahoo/screener/presets` | 取得 Yahoo 篩選器預設清單 | — *前端未呼叫* |
| GET | `/api/yahoo/screener` | 執行 Yahoo 篩選器查詢 | query: `scrIds, count, region, lang` — *前端未呼叫* |

---

## 備註

- 標示「前端未呼叫」的端點目前在 `asset-allocation-vue` 程式碼中找不到呼叫來源，可能是舊功能或預留給未來功能，建議與團隊確認後再決定是否移除。
- 每日排程 `jobs/dailyPortfolioCheck.js` 會呼叫 `services/portfolioService.js` 的 `checkAllPortfolios()`，非 HTTP 端點，用於每日漂移警示信件。
