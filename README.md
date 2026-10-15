# Portfolio Tracker

投資組合追蹤工具：記錄交易、查看持股與配息、設定目標配置、再平衡試算與回測。

## 功能

- **儀表板**：總資產走勢、資產配置、報酬率（含 IRR）
- **投資組合**：持股、交易、配息明細，支援 CSV / Excel 匯入
- **資產頁**：個股與 ETF 走勢、產業配置、前十大持股
- **目標配置 / 再平衡 / 回測**
- **關注清單**
- 多幣別顯示、中英文介面、明暗主題、Google 登入

## 技術

Vue 3 · Vite · Pinia · Vue Router · PrimeVue 4 · Tailwind CSS 4 · Highcharts · Firebase Auth · vue-i18n · Vitest

## 開始使用

```sh
npm install
npm run dev        # 只啟動前端
npm run dev:all    # 同時啟動前端與後端（後端放在 ../portfolio-backend）
```

API 位址用環境變數 `VITE_API_URL_BASE` 設定，可以寫在 `.env.local`：

```
VITE_API_URL_BASE=http://localhost:3000
```

## 指令

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 打包正式版 |
| `npm run preview` | 預覽打包結果 |
| `npm run test:unit` | 執行單元測試 |

## 文件

- [API_ENDPOINTS.md](API_ENDPOINTS.md)：後端 API 說明
- [docs/design-system.md](docs/design-system.md)：設計規範
