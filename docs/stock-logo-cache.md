# 股票 Logo 圖片快取

**日期**：2026-07-26
**相關檔案**：[`src/utils/stockLogo.js`](../src/utils/stockLogo.js)、[`src/components/StockIcon.vue`](../src/components/StockIcon.vue)、[`src/components/SearchBox.vue`](../src/components/SearchBox.vue)

## 背景

`StockIcon` 沒有自己的圖片來源，是直接猜測第三方 CDN 的 URL：

```js
https://storage.googleapis.com/iex/api/logos/{SYMBOL}.png   // 來源 0
https://financialmodelingprep.com/image-stock/{SYMBOL}.png  // 來源 1
```

哪一個來源有這檔股票的圖，只能實際發請求試出來。

## 問題

搜尋下拉選單每次打開，圖示都是一張一張慢慢冒出來。三個原因疊加：

1. **來源探測結果沒有被記住。** 舊版的 `sourceIndex` 是元件內部 state，元件一重新掛載就歸零。來源 0 對相當多 symbol 回 404，而 **404 回應瀏覽器通常不會快取**，所以每次開搜尋都要重跑一次「打來源 0 → 404 → 換來源 1 → 才顯示」。
2. **`loading="lazy"`。** 下拉選單在 `overflow-auto` 容器內，捲動範圍外的項目要等進入視窗才開始下載。
3. **沒有預先載入。** 圖片要等 DOM 掛好、`<img>` 進場才開始下載，等於串在渲染後面。

## 解法

新增 `src/utils/stockLogo.js`，把「這個 symbol 該用哪個來源」這件事從元件內部 state 提升成跨元件的共用快取。

### 快取內容

存的是**來源索引**（`0`、`1`，或 `NOT_FOUND = -1` 代表都沒有），不是圖片本身。圖片本身交給瀏覽器的 HTTP 快取處理——我們只要避免那次註定 404 的請求，瀏覽器就能直接從快取吐出正確的圖。

- 記憶體 `Map`：同一次 session 內即時命中。
- `localStorage`（key `portfolio-tracker-logo-cache`）：跨頁面重整保留。
  - 成功 TTL 30 天、失敗 TTL 3 天（失敗較短，之後 CDN 可能補上圖）。
  - 上限 500 筆，寫入 debounce 500ms。
  - localStorage 讀寫失敗（無痕模式、配額滿）時靜默降級成純記憶體快取。
- `inflight` Map：同一個 symbol 被多處同時請求時只探測一次。

### 元件端

`StockIcon`：
- 快取命中時**同步**算出正確 URL 直接渲染，完全跳過 404 那一輪。
- 移除 `loading="lazy"`。
- 未知 symbol 探測期間 placeholder 留白，避免先閃出字母縮寫再換成 logo。
- 保留 `<img>` 的 `@error` 往下一個來源退——快取可能過期或 CDN 掉圖，這是自我修正的路徑。

`SearchBox`：`watch(flatItems)` 一拿到結果（含搜尋結果、歷史、熱門）就呼叫 `preloadStockLogos()`，讓下載和列表渲染同時進行。

## 效果

第一次遇到某批股票仍有一次探測成本；之後不論重開搜尋、切換頁面、重整瀏覽器，圖示都是整批立即顯示。Dashboard 與資產頁的 `StockIcon` 共用同一份快取。

## 已知限制與後續

- **快取的是索引不是圖片**，所以離線時仍然沒有圖。要真正離線可用得改存 blob 到 IndexedDB，目前沒有這個需求。
- **依賴第三方 CDN 的 URL 慣例**，對方改路徑就整批失效。真正的解法是後端提供 logo 端點（可順便處理台股等這兩個來源沒涵蓋的市場），屆時 `LOGO_SOURCES` 換成單一來源即可，快取層不用動。
- `clearStockLogoCache()` 可在需要時手動清空（例如 debug 或使用者回報圖不對）。

## 檢查

`src/utils/__tests__/stockLogo.spec.js`：驗證探測會依序試各來源、結果會被快取（第二次呼叫不再發請求）、全部失敗時回 `NOT_FOUND`，以及併發請求會被去重。
