# 設計系統

App 的外觀建立在 **PrimeVue 4（Aura preset）+ Tailwind v4** 上，沒有另一層自訂 token。
色票、級數一律看原始碼，這份文件只記錄**在哪裡**和**為什麼這樣選**，不複製數值。

| 要改什麼 | 去哪裡 |
| --- | --- |
| 主色、淺／深色的 surface、content、文字色 | [`src/themes/customPreset.js`](../src/themes/customPreset.js) |
| 三種深色風格的 surface 覆寫 | [`src/assets/dark-variants.css`](../src/assets/dark-variants.css) |
| 主題、深色風格、強調色的切換邏輯與圖表配色 | [`src/composables/useTheme.js`](../src/composables/useTheme.js) |
| 字體、body 底色、共用卡片與漲跌箭頭 | [`src/assets/base.css`](../src/assets/base.css) |
| 漲跌色、設定頁版面、卡片式表格 | [`src/assets/main.css`](../src/assets/main.css) |
| App shell、DataTable 排序圖示、頁面轉場 | [`src/App.vue`](../src/App.vue) 的全域 `<style>` |

## 一律透過 PrimeVue 的 CSS 變數

元件裡要用顏色時，引用 `--p-*` 變數（`--p-text-color`、`--p-text-muted-color`、
`--p-content-background`、`--p-content-border-color`、`--p-surface-*`），不要寫死 hex。
這樣淺／深色、三種深色風格、使用者選的強調色都會自動跟著走。

例外：Highcharts 吃字串不吃 CSS 變數，圖表色要從 `useTheme.js` 的 `chartPalette` 拿；
偏好設定頁的預覽色塊也是寫死的（因為要同時顯示非目前模式的顏色）。
**改 `customPreset.js` 或 `dark-variants.css` 的色票時，這兩處要一起對。**

## 主題的三個軸

都存在 localStorage，由 `useTheme.js` 套到 `<html>` 上：

- **theme**：`light` / `dark` / `system`。深色時掛 `.dark`——Tailwind 的 `dark:`
  （`main.css` 的 `@custom-variant`）與 PrimeVue 的 `darkModeSelector` 都認它。
- **darkVariant**：`default`（Knowt 配色，畫布 `#0d0d0d`、卡片 `#1d1e1e`）、
  `dim`（GitHub Dimmed）、`standard`（GitHub Dark）。只用
  `.dark[data-dark-variant='…']` 覆寫 surface ramp，不重新產生 PrimeVue theme，切換不閃色。
- **accentColor**：預設藍 `#316dca`（`customPreset.js` 的 primary），
  其餘選項在執行期用 `updatePrimaryPalette` 換成 Tailwind 色盤。

## 主要按鈕不用主色

實心 primary 按鈕被覆寫成 **contrast 配色**：淺色黑底白字、深色白底黑字
（`customPreset.js` 的 `components.button`）。主色留給連結、焦點、選取狀態等次要互動，
這樣不論使用者選哪個強調色，主要動作按鈕都長一樣，Header 的「新增交易」也和頁內按鈕一致。

## 漲跌色

全站統一用 `.text-up` / `.text-down`（`main.css`），**綠漲紅跌**。
淺色用較深的 `#16a34a` / `#dc2626`，因為粉綠、粉紅在白底對比不足；深色才用亮的粉色系。

總資產、現價旁的漲跌用 `.asset-growth-change`（`base.css`）：實心圓箭頭＋同色文字，
圓底吃 `currentColor`，所以只要外層套 `.text-up/down` 就會自動上色。新增顯示漲跌的地方請沿用，不要再各頁自己寫。

漲跌色目前是寫死的，沒有「紅漲綠跌」切換。

## 字體與數字

字體是 `'Segoe UI', sans-serif`（`base.css` 的 `--font-family-base`），body 基準 12px。
單一標的的價格、成本、市值、損益、股息以**原幣**顯示（台股 TWD、美股 USD），
金額拆分用 `useCurrency` 的 `splitDisplayAmount`，代號推斷幣別用 `utils/symbol.js` 的 `currencyOfSymbol`，不要各頁另寫。

## 版面慣例

- **卡片**：Dashboard 與資產頁用 `.app-panel`，無外框、靠漸層底和陰影浮起。
- **表格**：資產明細、再平衡用 `.card-table`——表頭與內容同底，分隔線用頁面底色做出凹槽感。
  已排序的表頭不變色，只靠排序圖示（自訂的 `pi-chevron-down`）表示狀態。
- **設定頁**：`.set-page` / `.set-group` / `.set-row`，GitLab 風格的灰底標題列＋內嵌白卡＋sticky 底部操作列。
- **搜尋**：Google 財經風格，代號為主、名稱與交易所為輔；Header 搜尋欄是無框膠囊。
- **icon-only 按鈕**一律加 `v-tooltip`，`showDelay: 500`。

## 動態

只有短的狀態轉場：頁面切換（`.page-main-*`）、搜尋視窗淡入淡出（`.search-fade-*`）、排序圖示翻轉。
每一個都有 `prefers-reduced-motion` 的關閉分支，新增動畫時照做。

## 未採用的提案：帳與板（Ledger & Board）

[`src/assets/tokens.css`](../src/assets/tokens.css) 與 [`docs/design-system.html`](design-system.html)
是一套沒有接進 app 的設計提案（綠條會計紙／行情看板、黃銅品牌色、`data-polarity` 切換紅漲綠跌、
IBM Plex Mono 數字字體、條帶表格）。`tokens.css` 沒有被任何地方 import，app 後來走了上面描述的方向。
保留作參考；如果要重拾其中的點子（例如漲跌極性切換），要改接到 PrimeVue 變數上，而不是整套搬進來。
