/*
  資產頁 K 線圖：K 線 + 成交量 + 技術指標（Highcharts 指標模組在 main.js 載入）。
  從 AssetProfileView 抽出，避免該檔再膨脹。指標選擇記在 localStorage。
*/
import { computed, ref, watch } from 'vue'

const UP = '#10b981'
const DOWN = '#ef4444'

/** pane: main 疊在 K 線上；sub 各自一個副圖 */
export const INDICATORS = [
  { id: 'sma20', pane: 'main', label: 'SMA 20', type: 'sma', params: { period: 20 }, color: '#f59e0b' },
  { id: 'sma50', pane: 'main', label: 'SMA 50', type: 'sma', params: { period: 50 }, color: '#3b82f6' },
  { id: 'sma200', pane: 'main', label: 'SMA 200', type: 'sma', params: { period: 200 }, color: '#a855f7' },
  { id: 'ema20', pane: 'main', label: 'EMA 20', type: 'ema', params: { period: 20 }, color: '#ec4899' },
  { id: 'bb', pane: 'main', label: 'BB (20, 2)', type: 'bb', params: { period: 20, standardDeviation: 2 }, color: '#64748b' },
  // VWAP 自行計算：Highcharts 的 vwap 從整串資料起點累計，這裡要從顯示區間起點算
  { id: 'vwap', pane: 'main', label: 'VWAP', type: 'line', color: '#14b8a6', needsVolume: true },
  { id: 'rsi', pane: 'sub', label: 'RSI 14', type: 'rsi', params: { period: 14 }, color: '#8b5cf6' },
  { id: 'macd', pane: 'sub', label: 'MACD (12, 26, 9)', type: 'macd', params: { shortPeriod: 12, longPeriod: 26, signalPeriod: 9 }, color: '#3b82f6' },
  // ponytail: Highcharts 的 slow stochastic 以 SMA 平滑，台灣常見 KD 用 1/3 權重遞迴平滑，數值略有差異；要完全一致需自行計算後以 line 系列畫
  { id: 'kd', pane: 'sub', label: 'KD (9, 3, 3)', type: 'slowstochastic', params: { periods: [9, 3, 3] }, color: '#3b82f6' },
]

const STORAGE_KEY = 'assetChartIndicators'
const loadSelection = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(saved) ? saved.filter((id) => INDICATORS.some((i) => i.id === id)) : []
  } catch {
    return []
  }
}

// 各區塊高度（px），換算成 plot 區百分比給 yAxis.top/height
const MAIN_H = 240
const VOLUME_H = 60
const SUB_H = 90
const GAP = 14
const X_LABELS_H = 40

const lineSeries = (indicator, yAxis, extra = {}) => ({
  type: indicator.type,
  id: indicator.id,
  name: indicator.label,
  linkedTo: 'main',
  yAxis,
  params: indicator.params,
  color: indicator.color,
  lineWidth: 1.25,
  marker: { enabled: false },
  states: { hover: { lineWidthPlus: 0 } },
  showInLegend: indicator.pane === 'main',
  ...extra,
})

/** 從 fromTs 起累計的 VWAP（典型價 (H+L+C)/3 × 量 ÷ 累計量） */
export const vwapFrom = (candles, fromTs = -Infinity) => {
  let pv = 0
  let vol = 0
  const out = []
  for (const c of candles) {
    const t = new Date(c.date).getTime()
    if (t < fromTs || !(c.volume > 0)) continue
    pv += ((c.high + c.low + c.close) / 3) * c.volume
    vol += c.volume
    out.push([t, Number((pv / vol).toFixed(2))])
  }
  return out
}

const MIN_BARS = 10 // 最多放大到畫面剩 10 根 K 線

/**
 * Ctrl／⌘＋滾輪以游標為中心縮放 x 軸；沒按 Ctrl 時不攔截，讓頁面照常捲動，並回呼 onPlainWheel 顯示提示。
 * Highcharts 內建的滾輪縮放沒有修飾鍵選項，所以自己接。macOS 觸控板雙指縮放也會帶 ctrlKey。
 */
const attachWheelZoom = (chart, onPlainWheel) => {
  chart.container.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey) {
      onPlainWheel()
      return
    }
    e.preventDefault() // 同時擋掉瀏覽器的 Ctrl+滾輪整頁縮放
    const axis = chart.xAxis[0]
    const { min, max, dataMin, dataMax } = axis.getExtremes()
    const points = chart.get('main')?.points?.length || 1
    const minSpan = ((max - min) / points) * MIN_BARS
    const center = Math.min(max, Math.max(min, axis.toValue(chart.pointer.normalize(e).chartX)))
    const factor = e.deltaY > 0 ? 1.25 : 0.8
    let nextMin = center - (center - min) * factor
    let nextMax = center + (max - center) * factor
    if (factor < 1 && nextMax - nextMin < minSpan) return
    nextMin = Math.max(dataMin, nextMin)
    nextMax = Math.min(dataMax, nextMax)
    axis.setExtremes(nextMin, nextMax, true, false)
  }, { passive: false })
}

/**
 * @param source 回傳 { candles, xMin, xMax, palette, formatPrice, formatDate, xDateFormat, labels: { price, volume, vwap } } 的 getter
 *   candles 是要畫的全部 K 線（含顯示區間之前的資料，讓均線在區間起點就有值），xMin/xMax 決定顯示範圍
 */
export function useCandleChart(source) {
  const selected = ref(loadSelection())
  // 沒按 Ctrl 就滾輪時短暫顯示「按住 Ctrl 縮放」
  const wheelHint = ref(false)
  let hintTimer
  const flashWheelHint = () => {
    wheelHint.value = true
    clearTimeout(hintTimer)
    hintTimer = setTimeout(() => { wheelHint.value = false }, 1200)
  }
  watch(selected, (ids) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)) } catch { /* 無痕模式等，忽略 */ }
  })

  const layout = computed(() => {
    const { candles } = source()
    const hasVolume = candles.some((c) => c.volume > 0)
    const active = INDICATORS.filter((i) => selected.value.includes(i.id) && (hasVolume || !i.needsVolume))
    const subs = active.filter((i) => i.pane === 'sub')
    const panesH = MAIN_H + (hasVolume ? GAP + VOLUME_H : 0) + subs.length * (GAP + SUB_H)
    const hasOverlay = active.some((i) => i.pane === 'main') // 有疊加指標時頂端多留一行圖例
    return { hasVolume, hasOverlay, active, subs, panesH, height: panesH + X_LABELS_H + (hasOverlay ? 18 : 0) }
  })

  const options = computed(() => {
    const { candles, xMin, xMax, palette, formatPrice, formatDate, xDateFormat, labels } = source()
    const { hasVolume, hasOverlay, active, subs, panesH, height } = layout.value
    const { axis, grid, tooltipBg, tooltipFg } = palette
    const pct = (px) => `${(px / panesH) * 100}%`
    // stockChart 的 y 軸預設在右側且不顯示最上面的刻度，改回與面積圖一致
    const axisBase = { title: { text: null }, gridLineColor: grid, labels: { style: { color: axis } }, opposite: false, showLastLabel: true }
    // 副圖名稱放在該區左上角
    const paneTitle = (text) => ({ text, align: 'high', rotation: 0, offset: 0, x: 4, y: 12, textAlign: 'left', style: { color: axis, fontSize: '11px', fontWeight: '600' } })

    let cursor = 0
    const pane = (h, extra = {}) => {
      const yAxis = { ...axisBase, top: pct(cursor), height: pct(h), offset: 0, ...extra }
      cursor += h + GAP
      return yAxis
    }

    const yAxes = [pane(MAIN_H, { labels: { ...axisBase.labels, formatter() { return formatPrice(this.value) } } })]
    if (hasVolume) {
      yAxes.push(pane(VOLUME_H, {
        title: paneTitle(labels.volume),
        gridLineWidth: 0,
        labels: { ...axisBase.labels, formatter() { return Intl.NumberFormat('en', { notation: 'compact' }).format(this.value) } },
      }))
    }

    const ts = (c) => new Date(c.date).getTime()
    const round = (v) => Number(Number(v).toFixed(2))
    const series = [{
      type: 'candlestick',
      id: 'main',
      name: labels.price,
      data: candles.map((c) => [ts(c), round(c.open), round(c.high), round(c.low), round(c.close)]),
      color: DOWN,
      upColor: UP,
      lineColor: DOWN,
      upLineColor: UP,
      showInLegend: false,
    }]

    if (hasVolume) {
      series.push({
        type: 'column',
        id: 'volume',
        name: labels.volume,
        yAxis: 1,
        data: candles.map((c) => ({ x: ts(c), y: c.volume || 0, color: c.close >= c.open ? `${UP}80` : `${DOWN}80` })),
        borderWidth: 0,
        groupPadding: 0,
        pointPadding: 0.1,
        tooltip: { valueDecimals: 0 },
        showInLegend: false,
      })
    }

    for (const indicator of active) {
      if (indicator.pane === 'main') {
        if (indicator.id === 'vwap') {
          series.push({ ...lineSeries(indicator, 0), linkedTo: undefined, params: undefined, name: labels.vwap, data: vwapFrom(candles, xMin) })
        } else {
          series.push(lineSeries(indicator, 0, indicator.type === 'bb' ? { topLine: { styles: { lineColor: indicator.color } }, bottomLine: { styles: { lineColor: indicator.color } } } : {}))
        }
      }
    }

    subs.forEach((indicator) => {
      const yAxis = yAxes.length
      if (indicator.type === 'rsi') {
        yAxes.push(pane(SUB_H, { title: paneTitle(indicator.label), tickPositions: [0, 30, 70, 100], plotLines: [30, 70].map((value) => ({ value, color: axis, width: 1, dashStyle: 'Dash' })) }))
        series.push(lineSeries(indicator, yAxis))
      } else if (indicator.type === 'macd') {
        yAxes.push(pane(SUB_H, { title: paneTitle(indicator.label) }))
        series.push(lineSeries(indicator, yAxis, {
          zones: [{ value: 0, color: `${DOWN}99` }, { color: `${UP}99` }],
          macdLine: { styles: { lineColor: '#3b82f6', lineWidth: 1.25 } },
          signalLine: { styles: { lineColor: '#f59e0b', lineWidth: 1.25 } },
        }))
      } else {
        yAxes.push(pane(SUB_H, { title: paneTitle(indicator.label), tickPositions: [0, 20, 80, 100], plotLines: [20, 80].map((value) => ({ value, color: axis, width: 1, dashStyle: 'Dash' })) }))
        series.push(lineSeries(indicator, yAxis, { smoothedLine: { styles: { lineColor: '#f59e0b', lineWidth: 1.25 } } }))
      }
    })

    return {
      // 以 stockChart 建立：x 軸 ordinal 跳過休市日、可拖曳平移、手機兩指縮放；滾輪縮放改由 attachWheelZoom 處理
      chart: {
        backgroundColor: 'transparent',
        height,
        animation: { duration: 400 },
        spacingTop: hasOverlay ? 24 : 6,
        zooming: { mouseWheel: { enabled: false } },
        panning: { enabled: true, type: 'x' },
        events: { load() { attachWheelZoom(this, flashWheelHint) } },
      },
      navigator: { enabled: false },
      rangeSelector: { enabled: false },
      scrollbar: { enabled: false },
      title: { text: null },
      credits: { enabled: false },
      // 只列出疊加在主圖的指標，讓使用者對得上線的顏色
      legend: { enabled: hasOverlay, align: 'left', verticalAlign: 'top', floating: true, x: 0, y: -22, margin: 0, padding: 2, symbolWidth: 12, itemDistance: 12, itemStyle: { color: axis, fontSize: '11px', fontWeight: '500' }, itemHoverStyle: { color: tooltipFg } },
      xAxis: {
        type: 'datetime',
        min: xMin,
        max: xMax,
        crosshair: { color: grid },
        lineColor: grid,
        labels: { formatter() { return formatDate(this.value) }, style: { color: axis } },
      },
      yAxis: yAxes,
      tooltip: { split: false, shared: true, xDateFormat, backgroundColor: tooltipBg, style: { color: tooltipFg }, valueDecimals: 2 },
      plotOptions: { series: { animation: false, dataGrouping: { enabled: false } } },
      series,
    }
  })

  // 副圖組成改變時給新 key 讓圖重建：Highcharts update 以索引合併 yAxis，舊副圖的刻度、參考線會殘留到別的副圖
  const paneKey = computed(() => [layout.value.hasVolume, ...layout.value.subs.map((i) => i.id)].join('-'))

  return { selectedIndicators: selected, candleOptions: options, candleHeight: computed(() => layout.value.height), hasVolume: computed(() => layout.value.hasVolume), paneKey, wheelHint }
}
