/**
 * Rebalancing Algorithm - Pure Function Version
 * 再平衡演算法 - 純函數版本
 * 
 * 從 RebalancingView.vue 提取出來，方便測試和重用
 */

export interface AssetInput {
  symbol: string
  name?: string
  target: number        // 目標配置百分比 (0-100 或 0-1)
  shares: number        // 目前持有股數
  currentPrice: number  // 當前股價
  assetType?: string
}

export interface RebalanceParams {
  action: 'deposit' | 'withdraw'  // 存入或提取
  amount: number                   // 存入/提取金額
  totalValue: number               // 當前總資產
  assets: AssetInput[]             // 資產配置
  tolerance?: number               // 容忍閾值（預設 0.0025 = 0.25%）
}

export interface AssetResult extends AssetInput {
  weight: number           // 標準化後的權重 (0-1)
  originalShares: number   // 原始股數
  currentValue: number     // 當前市值
  targetValue: number      // 目標市值
  actualPctBefore: number  // 再平衡前的實際百分比
  actualPctAfter: number   // 再平衡後的實際百分比
  sharesToBuy: number      // 需要買入的股數
  sharesToSell: number     // 需要賣出的股數
  amount: number           // 淨買入金額（正數=買入，負數=賣出）
  action: 'BUY' | 'SELL' | 'HOLD'
  executed?: boolean
}

export interface RebalanceResult {
  assets: AssetResult[]
  leftoverCash: number     // 剩餘現金
  futureTotal: number      // 未來總資產
}

/**
 * 再平衡演算法
 * 
 * @param params - 再平衡參數
 * @returns 再平衡結果
 */
export function rebalanceAllocate(params: RebalanceParams): RebalanceResult {
  const {
    action,
    amount,
    totalValue,
    assets: inputAssets,
    tolerance = 0.0025  // 預設容忍閾值 0.25%
  } = params

  const isWithdraw = action === 'withdraw'

  // --- 標準化目標權重（自動辨識是 0–1 或 0–100） ---
  const rawTargets = inputAssets.map(a => Number(a.target) || 0)
  const isPercent = rawTargets.some(v => v > 1.0001)
  let weights = rawTargets.map(v => (isPercent ? v / 100 : v))
  const wSum = weights.reduce((s, w) => s + w, 0)
  
  if (wSum <= 0) {
    // 目標全為 0 的安全防護：平均分配
    weights = inputAssets.map(() => 1 / inputAssets.length)
  } else {
    weights = weights.map(w => w / wSum)
  }

  // --- 未來總資產、現金池 ---
  const deltaCash = isWithdraw ? -Number(amount || 0) : Number(amount || 0)
  const futureTotal = Math.max(totalValue + deltaCash, 0)
  let cashPool = deltaCash

  // 建立工作陣列
  const assets: AssetResult[] = inputAssets.map((a, idx) => {
    const currentValue = (a.currentPrice || 0) * (a.shares || 0)
    const targetValue = weights[idx] * futureTotal
    const actualPctBefore = totalValue > 0 ? currentValue / totalValue : 0
    
    return {
      ...a,
      weight: weights[idx],
      originalShares: a.shares || 0,
      currentValue,
      targetValue,
      actualPctBefore,
      sharesToBuy: 0,
      sharesToSell: 0,
      amount: 0,
      action: 'HOLD' as const,
      executed: false
    }
  })

  // 邊界：總市值或 futureTotal 非正 → 不動
  if (totalValue <= 0 || futureTotal <= 0) {
    return {
      assets: assets.map(a => ({
        ...a,
        actualPctAfter: a.actualPctBefore,
        amount: 0,
        sharesToBuy: 0,
        sharesToSell: 0,
        action: 'HOLD' as const
      })),
      leftoverCash: isWithdraw ? -Number(amount || 0) : Number(amount || 0),
      futureTotal
    }
  }

  // -----------------------------
  // STEP 1：處理賣出（withdraw 和 deposit 都需要處理超標資產）
  // -----------------------------
  for (const a of assets) {
    if (!a.currentPrice || a.currentPrice <= 0) continue
    
    // 只在顯著超標才賣
    if (a.currentValue > a.targetValue * (1 + tolerance)) {
      const needToReduce = a.currentValue - a.targetValue
      const maxSellableShares = Math.max(a.originalShares - a.sharesToSell, 0)
      const sharesToSell = Math.min(Math.floor(needToReduce / a.currentPrice), maxSellableShares)
      
      if (sharesToSell > 0) {
        const sellValue = sharesToSell * a.currentPrice
        a.sharesToSell += sharesToSell
        a.currentValue -= sellValue
        a.action = 'SELL'
        cashPool += sellValue
      }
    }
  }

  // 如果是 withdraw 且現金仍不足 → 按比例再賣
  if (isWithdraw && cashPool < 0) {
    let needMore = Math.abs(cashPool)
    const totalValueAfterStep1 = assets.reduce((s, a) => s + a.currentValue, 0)
    
    for (const a of assets) {
      if (needMore <= 0) break
      if (!a.currentPrice || a.currentPrice <= 0 || a.currentValue <= 0) continue
      
      const weight = totalValueAfterStep1 > 0 ? a.currentValue / totalValueAfterStep1 : 0
      const sellAmount = Math.min(needMore * weight, a.currentValue)
      const maxSellableShares = Math.max(a.originalShares - a.sharesToSell, 0)
      const sharesToSell = Math.min(Math.floor(sellAmount / a.currentPrice), maxSellableShares)
      
      if (sharesToSell > 0) {
        const sellValue = sharesToSell * a.currentPrice
        a.sharesToSell += sharesToSell
        a.currentValue -= sellValue
        a.action = 'SELL'
        needMore -= sellValue
        cashPool += sellValue
      }
    }
  }

  // -----------------------------
  // STEP 2：買入（deposit 與 withdraw 都可能進入）
  // -----------------------------
  const underweights = () =>
    assets.filter(a =>
      a.currentPrice > 0 &&
      a.currentValue < a.targetValue * (1 - tolerance)
    )

  const positiveAssets = underweights()
  const totalNeed = positiveAssets.reduce((sum, a) => sum + (a.targetValue - a.currentValue), 0)

  // 2-1 比例分配
  if (cashPool > 0 && totalNeed > 0) {
    for (const a of positiveAssets) {
      if (cashPool <= 0) break
      
      const need = a.targetValue - a.currentValue
      const weight = need / totalNeed
      const buyBudget = Math.min(cashPool * weight, need)
      const sharesToBuy = Math.floor(buyBudget / a.currentPrice)
      
      if (sharesToBuy > 0) {
        const buyValue = sharesToBuy * a.currentPrice
        a.sharesToBuy += sharesToBuy
        a.currentValue += buyValue
        a.action = 'BUY'
        cashPool -= buyValue
      }
    }
  }

  // 2-2 greedy 逐股補（把零頭花掉）
  if (cashPool > 0) {
    let guard = 10000 // 安全閥避免意外死循環
    
    while (guard-- > 0) {
      const candidates = underweights()
        .filter(a => a.currentPrice <= cashPool + 1e-9)

      if (!candidates.length) break

      // 排序：缺口/股價大的優先，同分時優先便宜的
      candidates.sort((x, y) => {
        const rx = (x.targetValue - x.currentValue) / x.currentPrice
        const ry = (y.targetValue - y.currentValue) / y.currentPrice
        if (ry !== rx) return ry - rx
        return x.currentPrice - y.currentPrice
      })

      const pick = candidates[0]
      pick.sharesToBuy += 1
      pick.currentValue += pick.currentPrice
      pick.action = 'BUY'
      cashPool -= pick.currentPrice

      // 若現金不足以買任何一檔，結束
      const underweightAssets = underweights()
      if (underweightAssets.length === 0) break
      
      const minPrice = Math.min(...underweightAssets.map(a => a.currentPrice))
      if (!isFinite(minPrice) || cashPool < minPrice - 1e-9) break
    }
  }

  // -----------------------------
  // STEP 3：更新 actualPctAfter / amount / action
  // -----------------------------
  for (const a of assets) {
    const buyValue = (a.sharesToBuy || 0) * (a.currentPrice || 0)
    const sellValue = (a.sharesToSell || 0) * (a.currentPrice || 0)
    const netFlow = buyValue - sellValue

    a.amount = Math.round(netFlow * 100) / 100
    a.actualPctAfter = futureTotal > 0 ? a.currentValue / futureTotal : 0

    // 決定最終 action
    if (a.sharesToBuy > 0 && a.sharesToSell > 0) {
      a.action = netFlow > 0 ? 'BUY' : netFlow < 0 ? 'SELL' : 'HOLD'
    } else if (a.sharesToBuy > 0) {
      a.action = 'BUY'
    } else if (a.sharesToSell > 0) {
      a.action = 'SELL'
    } else {
      a.action = 'HOLD'
    }
  }

  // 剩餘現金（四捨五入避免浮點數殘值）
  const leftoverCash = Math.round(cashPool * 100) / 100

  return {
    assets,
    leftoverCash,
    futureTotal
  }
}
