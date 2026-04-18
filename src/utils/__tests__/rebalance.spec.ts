import { describe, it, expect } from 'vitest'
import { rebalanceAllocate, type RebalanceParams } from '../rebalance'

describe('Rebalancing Algorithm', () => {
  describe('Deposit 場景', () => {
    it('應該正確處理存入資金並達到目標配置', () => {
      const params: RebalanceParams = {
        action: 'deposit',
        amount: 1000,
        totalValue: 10000,
        assets: [
          { symbol: 'AAPL', target: 50, shares: 100, currentPrice: 100 }, // 當前 10000 (100%)
          { symbol: 'GOOGL', target: 50, shares: 0, currentPrice: 200 },  // 當前 0 (0%)
        ]
      }

      const result = rebalanceAllocate(params)

      // 未來總資產 = 11000
      expect(result.futureTotal).toBe(11000)
      
      // AAPL: 當前 10000，目標 5500，應賣出 4500 (45股)
      const aapl = result.assets.find(a => a.symbol === 'AAPL')!
      expect(aapl.action).toBe('SELL')
      expect(aapl.sharesToSell).toBe(45)
      expect(aapl.targetValue).toBe(5500)
      
      // GOOGL: 當前 0，目標 5500，應買入 5500 (27股，剩100)
      const googl = result.assets.find(a => a.symbol === 'GOOGL')!
      expect(googl.action).toBe('BUY')
      expect(googl.sharesToBuy).toBe(27)
      
      // 剩餘現金應該很少（<200）
      expect(result.leftoverCash).toBeLessThan(200)
      expect(result.leftoverCash).toBeGreaterThanOrEqual(0)
    })

    it('應該處理所有資產都需要買入的情況', () => {
      const params: RebalanceParams = {
        action: 'deposit',
        amount: 3000,
        totalValue: 12000,
        assets: [
          { symbol: 'AAPL', target: 40, shares: 30, currentPrice: 100 },  // 3000 (25%)
          { symbol: 'GOOGL', target: 30, shares: 10, currentPrice: 200 }, // 2000 (16.67%)
          { symbol: 'TSLA', target: 30, shares: 35, currentPrice: 200 },  // 7000 (58.33%)
        ]
      }

      const result = rebalanceAllocate(params)

      // 未來總資產 = 15000
      expect(result.futureTotal).toBe(15000)
      
      const aapl = result.assets.find(a => a.symbol === 'AAPL')!
      const googl = result.assets.find(a => a.symbol === 'GOOGL')!
      const tsla = result.assets.find(a => a.symbol === 'TSLA')!
      
      // AAPL: 目標 6000，當前 3000，應買入
      expect(aapl.action).toBe('BUY')
      expect(aapl.targetValue).toBe(6000)
      
      // GOOGL: 目標 4500，當前 2000，應買入
      expect(googl.action).toBe('BUY')
      expect(googl.targetValue).toBe(4500)
      
      // TSLA: 目標 4500，當前 7000，應賣出
      expect(tsla.action).toBe('SELL')
      expect(tsla.targetValue).toBe(4500)
      expect(tsla.sharesToSell).toBeGreaterThan(0)
    })

    it('應該正確處理超標資產（需要賣出）', () => {
      const params: RebalanceParams = {
        action: 'deposit',
        amount: 1000,
        totalValue: 10000,
        assets: [
          { symbol: 'AAPL', target: 40, shares: 80, currentPrice: 100 }, // 8000 (80%)
          { symbol: 'GOOGL', target: 60, shares: 10, currentPrice: 200 }, // 2000 (20%)
        ]
      }

      const result = rebalanceAllocate(params)

      // 未來總資產 = 11000
      expect(result.futureTotal).toBe(11000)
      
      const aapl = result.assets.find(a => a.symbol === 'AAPL')!
      const googl = result.assets.find(a => a.symbol === 'GOOGL')!
      
      // AAPL: 超標，應賣出至 4400
      expect(aapl.action).toBe('SELL')
      expect(aapl.targetValue).toBe(4400)
      expect(aapl.sharesToSell).toBeGreaterThan(30)
      
      // GOOGL: 不足，應買入至 6600
      expect(googl.action).toBe('BUY')
      expect(googl.targetValue).toBe(6600)
      expect(googl.sharesToBuy).toBeGreaterThan(20)
    })
  })

  describe('Withdraw 場景', () => {
    it('應該正確處理提取資金', () => {
      const params: RebalanceParams = {
        action: 'withdraw',
        amount: 2000,
        totalValue: 10000,
        assets: [
          { symbol: 'AAPL', target: 50, shares: 50, currentPrice: 100 }, // 5000 (50%)
          { symbol: 'GOOGL', target: 50, shares: 25, currentPrice: 200 }, // 5000 (50%)
        ]
      }

      const result = rebalanceAllocate(params)

      // 未來總資產 = 8000
      expect(result.futureTotal).toBe(8000)
      
      const aapl = result.assets.find(a => a.symbol === 'AAPL')!
      const googl = result.assets.find(a => a.symbol === 'GOOGL')!
      
      // 目標都是 4000，都需要賣出
      expect(aapl.targetValue).toBe(4000)
      expect(googl.targetValue).toBe(4000)
      
      expect(aapl.action).toBe('SELL')
      expect(googl.action).toBe('SELL')
      
      // 總共賣出應該接近 2000
      const totalSold = aapl.sharesToSell * 100 + googl.sharesToSell * 200
      expect(totalSold).toBeGreaterThanOrEqual(1900)
      expect(totalSold).toBeLessThanOrEqual(2100)
    })

    it('應該處理提取金額大於目標調整的情況', () => {
      const params: RebalanceParams = {
        action: 'withdraw',
        amount: 5000,
        totalValue: 10000,
        assets: [
          { symbol: 'AAPL', target: 50, shares: 50, currentPrice: 100 },
          { symbol: 'GOOGL', target: 50, shares: 25, currentPrice: 200 },
        ]
      }

      const result = rebalanceAllocate(params)

      // 未來總資產 = 5000
      expect(result.futureTotal).toBe(5000)
      
      // 應該按比例額外賣出以湊足提取金額
      const totalSold = result.assets.reduce((sum, a) => 
        sum + a.sharesToSell * a.currentPrice, 0
      )
      
      expect(totalSold).toBeGreaterThanOrEqual(4900)
      expect(totalSold).toBeLessThanOrEqual(5100)
    })
  })

  describe('邊界情況', () => {
    it('應該處理零股價的資產', () => {
      const params: RebalanceParams = {
        action: 'deposit',
        amount: 1000,
        totalValue: 5000,
        assets: [
          { symbol: 'AAPL', target: 50, shares: 50, currentPrice: 100 },
          { symbol: 'DELISTED', target: 50, shares: 100, currentPrice: 0 }, // 下市股票
        ]
      }

      const result = rebalanceAllocate(params)

      // 應該跳過零股價的資產
      const delisted = result.assets.find(a => a.symbol === 'DELISTED')!
      expect(delisted.action).toBe('HOLD')
      expect(delisted.sharesToBuy).toBe(0)
      expect(delisted.sharesToSell).toBe(0)
    })

    it('應該處理總目標不等於 100% 的情況', () => {
      const params: RebalanceParams = {
        action: 'deposit',
        amount: 1000,
        totalValue: 10000,
        assets: [
          { symbol: 'AAPL', target: 30, shares: 50, currentPrice: 100 },   // 5000
          { symbol: 'GOOGL', target: 40, shares: 25, currentPrice: 200 },  // 5000
          // 總和只有 70%，應該自動標準化
        ]
      }

      const result = rebalanceAllocate(params)

      const aapl = result.assets.find(a => a.symbol === 'AAPL')!
      const googl = result.assets.find(a => a.symbol === 'GOOGL')!
      
      // 權重應該被標準化為 30/70 = 0.4286, 40/70 = 0.5714
      expect(aapl.weight).toBeCloseTo(3/7, 4)
      expect(googl.weight).toBeCloseTo(4/7, 4)
      
      // 權重總和應該為 1
      const totalWeight = result.assets.reduce((sum, a) => sum + a.weight, 0)
      expect(totalWeight).toBeCloseTo(1, 10)
    })

    it('應該處理容忍閾值內的小差異', () => {
      const params: RebalanceParams = {
        action: 'deposit',
        amount: 10,  // 很小的存入金額
        totalValue: 10000,
        assets: [
          { symbol: 'AAPL', target: 50, shares: 50, currentPrice: 100 },   // 5000 (50%)
          { symbol: 'GOOGL', target: 50, shares: 25, currentPrice: 200 },  // 5000 (50%)
        ]
      }

      const result = rebalanceAllocate(params)

      // 如果差異在容忍閾值內，可能只有很少或沒有交易
      const totalTrades = result.assets.reduce((sum, a) => 
        sum + a.sharesToBuy + a.sharesToSell, 0
      )
      
      // 應該有最少的交易
      expect(totalTrades).toBeLessThan(5)
    })

    it('應該處理空配置', () => {
      const params: RebalanceParams = {
        action: 'deposit',
        amount: 1000,
        totalValue: 0,
        assets: []
      }

      const result = rebalanceAllocate(params)

      // 不應該崩潰，應返回空結果
      expect(result.assets).toHaveLength(0)
      expect(result.leftoverCash).toBe(1000)
    })

    it('應該處理負的 totalValue（異常情況）', () => {
      const params: RebalanceParams = {
        action: 'deposit',
        amount: 1000,
        totalValue: -1000,
        assets: [
          { symbol: 'AAPL', target: 100, shares: 0, currentPrice: 100 },
        ]
      }

      const result = rebalanceAllocate(params)

      // futureTotal 應該被修正為非負數
      expect(result.futureTotal).toBeGreaterThanOrEqual(0)
    })

    it('應該處理所有目標為 0 的情況', () => {
      const params: RebalanceParams = {
        action: 'deposit',
        amount: 1000,
        totalValue: 5000,
        assets: [
          { symbol: 'AAPL', target: 0, shares: 50, currentPrice: 100 },
          { symbol: 'GOOGL', target: 0, shares: 10, currentPrice: 200 },
        ]
      }

      const result = rebalanceAllocate(params)

      // 應該平均分配權重
      result.assets.forEach(a => {
        expect(a.weight).toBeCloseTo(0.5, 10)
      })
    })
  })

  describe('精度和舍入', () => {
    it('應該正確處理股數舍入（向下取整）', () => {
      const params: RebalanceParams = {
        action: 'deposit',
        amount: 1500,
        totalValue: 10000,
        assets: [
          { symbol: 'AAPL', target: 50, shares: 45, currentPrice: 123.45 }, // 不規則股價
          { symbol: 'GOOGL', target: 50, shares: 25, currentPrice: 201.23 },
        ]
      }

      const result = rebalanceAllocate(params)

      // 所有股數應該是整數
      result.assets.forEach(a => {
        expect(a.sharesToBuy).toBe(Math.floor(a.sharesToBuy))
        expect(a.sharesToSell).toBe(Math.floor(a.sharesToSell))
        expect(Number.isInteger(a.sharesToBuy)).toBe(true)
        expect(Number.isInteger(a.sharesToSell)).toBe(true)
      })
    })

    it('應該最小化剩餘現金', () => {
      const params: RebalanceParams = {
        action: 'deposit',
        amount: 1000,
        totalValue: 10000,
        assets: [
          { symbol: 'AAPL', target: 60, shares: 40, currentPrice: 50 },
          { symbol: 'GOOGL', target: 40, shares: 20, currentPrice: 100 },
        ]
      }

      const result = rebalanceAllocate(params)

      // greedy 演算法應該盡可能把現金花掉
      // 剩餘現金應該小於最便宜的一股
      const minPrice = Math.min(...result.assets.map(a => a.currentPrice))
      expect(result.leftoverCash).toBeLessThan(minPrice)
    })
  })

  describe('實際案例測試', () => {
    it('案例 1: 用戶存入 $1000 到 60/40 配置', () => {
      // 當前持倉: AAPL $6000 (60%), GOOGL $4000 (40%)
      // 存入 $1000
      // 未來總資產 $11000
      // 目標: AAPL $6600 (60%), GOOGL $4400 (40%)
      const params: RebalanceParams = {
        action: 'deposit',
        amount: 1000,
        totalValue: 10000,
        assets: [
          { symbol: 'AAPL', target: 60, shares: 40, currentPrice: 150 },   // 6000
          { symbol: 'GOOGL', target: 40, shares: 20, currentPrice: 200 },  // 4000
        ]
      }

      const result = rebalanceAllocate(params)

      const aapl = result.assets.find(a => a.symbol === 'AAPL')!
      const googl = result.assets.find(a => a.symbol === 'GOOGL')!

      // AAPL 目標 6600，當前 6000，應買入約 600 (4股)
      expect(aapl.targetValue).toBe(6600)
      expect(aapl.action).toBe('BUY')
      
      // GOOGL 目標 4400，當前 4000，應買入約 400 (2股)
      expect(googl.targetValue).toBe(4400)
      expect(googl.action).toBe('BUY')
    })

    it('案例 2: 用戶提取 $2000 從平衡配置', () => {
      // 當前持倉: AAPL $5000 (50%), GOOGL $5000 (50%)
      // 提取 $2000
      // 未來總資產 $8000
      // 目標: AAPL $4000 (50%), GOOGL $4000 (50%)
      const params: RebalanceParams = {
        action: 'withdraw',
        amount: 2000,
        totalValue: 10000,
        assets: [
          { symbol: 'AAPL', target: 50, shares: 50, currentPrice: 100 },   // 5000
          { symbol: 'GOOGL', target: 50, shares: 25, currentPrice: 200 },  // 5000
        ]
      }

      const result = rebalanceAllocate(params)

      const aapl = result.assets.find(a => a.symbol === 'AAPL')!
      const googl = result.assets.find(a => a.symbol === 'GOOGL')!

      // 兩者都應賣出以維持 50/50 並提取 2000
      expect(aapl.action).toBe('SELL')
      expect(googl.action).toBe('SELL')
      
      // 總賣出金額應接近 2000
      const totalSold = aapl.sharesToSell * 100 + googl.sharesToSell * 200
      expect(totalSold).toBeGreaterThanOrEqual(1900)
      expect(totalSold).toBeLessThanOrEqual(2100)
    })

    it('案例 3: 嚴重失衡的配置', () => {
      // 當前: AAPL $9000 (90%), GOOGL $1000 (10%)
      // 目標: 50/50
      // 存入 $0（純再平衡）
      const params: RebalanceParams = {
        action: 'deposit',
        amount: 0,
        totalValue: 10000,
        assets: [
          { symbol: 'AAPL', target: 50, shares: 90, currentPrice: 100 },   // 9000
          { symbol: 'GOOGL', target: 50, shares: 5, currentPrice: 200 },   // 1000
        ]
      }

      const result = rebalanceAllocate(params)

      const aapl = result.assets.find(a => a.symbol === 'AAPL')!
      const googl = result.assets.find(a => a.symbol === 'GOOGL')!

      // AAPL 嚴重超標，應賣出至 5000
      expect(aapl.action).toBe('SELL')
      expect(aapl.targetValue).toBe(5000)
      expect(aapl.sharesToSell).toBeGreaterThan(35)
      
      // GOOGL 嚴重不足，應買入至 5000
      expect(googl.action).toBe('BUY')
      expect(googl.targetValue).toBe(5000)
      expect(googl.sharesToBuy).toBeGreaterThan(15)
    })

    it('案例 4: 三檔不同價格的資產', () => {
      const params: RebalanceParams = {
        action: 'deposit',
        amount: 3000,
        totalValue: 12000,
        assets: [
          { symbol: 'CHEAP', target: 33.33, shares: 100, currentPrice: 40 },   // 4000
          { symbol: 'MID', target: 33.33, shares: 40, currentPrice: 100 },     // 4000
          { symbol: 'EXPENSIVE', target: 33.34, shares: 20, currentPrice: 200 }, // 4000
        ]
      }

      const result = rebalanceAllocate(params)

      // 所有資產的目標值應該接近 15000 / 3 = 5000
      // 由於百分比的小數誤差，使用 1 作為容忍度
      result.assets.forEach(a => {
        expect(a.targetValue).toBeCloseTo(5000, -1)
      })

      // 權重總和應該為 1
      const totalWeight = result.assets.reduce((sum, a) => sum + a.weight, 0)
      expect(totalWeight).toBeCloseTo(1, 10)
    })
  })

  describe('效能測試', () => {
    it('應該在合理時間內處理大量資產', () => {
      const largeAllocation = Array.from({ length: 100 }, (_, i) => ({
        symbol: `STOCK${i}`,
        target: 1,
        shares: Math.floor(Math.random() * 100),
        currentPrice: Math.random() * 500 + 10
      }))

      const params: RebalanceParams = {
        action: 'deposit',
        amount: 10000,
        totalValue: 100000,
        assets: largeAllocation
      }

      const start = performance.now()
      const result = rebalanceAllocate(params)
      const end = performance.now()

      // 應該在 100ms 內完成
      expect(end - start).toBeLessThan(100)
      
      // 結果應該有效
      expect(result.assets).toHaveLength(100)
    })
  })
})

describe('Rebalancing Algorithm', () => {
  describe('Deposit 場景', () => {
    it('應該正確處理存入資金並達到目標配置', () => {
      const input = {
        action: 'deposit',
        depositAmount: 1000,
        totalValue: 10000,
        allocation: [
          { symbol: 'AAPL', target: 50, shares: 100, currentPrice: 100 }, // 當前 100 * 100 = 10000 (100%)
          { symbol: 'GOOGL', target: 50, shares: 0, currentPrice: 200 },  // 當前 0 (0%)
        ]
      }

      // TODO: 調用 rebalanceAllocate(input)
      // const result = rebalanceAllocate(input)

      // 預期結果：
      // - 未來總資產 = 11000
      // - AAPL 目標 = 5500 (50%)，當前 = 10000，應賣出 4500
      // - GOOGL 目標 = 5500 (50%)，當前 = 0，應買入 5500
      
      // expect(result.leftoverCash).toBeLessThan(200) // 零頭現金應該很少
      // expect(result.assets.find(a => a.symbol === 'AAPL').action).toBe('SELL')
      // expect(result.assets.find(a => a.symbol === 'GOOGL').action).toBe('BUY')
    })

    it('應該處理所有資產都需要買入的情況', () => {
      const input = {
        action: 'deposit',
        depositAmount: 3000,
        totalValue: 12000,
        allocation: [
          { symbol: 'AAPL', target: 40, shares: 30, currentPrice: 100 },  // 3000 (25%) → 6000 (40%)
          { symbol: 'GOOGL', target: 30, shares: 10, currentPrice: 200 }, // 2000 (16.67%) → 4500 (30%)
          { symbol: 'TSLA', target: 30, shares: 35, currentPrice: 200 },  // 7000 (58.33%) → 4500 (30%)
        ]
      }

      // TODO: 調用並驗證
      // - AAPL 應買入 30 股 (3000)
      // - GOOGL 應買入 12.5 → 12 股 (2500)
      // - TSLA 應賣出 12.5 → 12 股 (2500)
    })

    it('應該正確處理超標資產（需要賣出）', () => {
      const input = {
        action: 'deposit',
        depositAmount: 1000,
        totalValue: 10000,
        allocation: [
          { symbol: 'AAPL', target: 40, shares: 80, currentPrice: 100 }, // 8000 (80%) → 4400 (40%)
          { symbol: 'GOOGL', target: 60, shares: 10, currentPrice: 200 }, // 2000 (20%) → 6600 (60%)
        ]
      }

      // 預期：
      // - AAPL 超標，應賣出 36 股 (3600)
      // - GOOGL 不足，應買入 23 股 (4600)
    })
  })

  describe('Withdraw 場景', () => {
    it('應該正確處理提取資金', () => {
      const input = {
        action: 'withdraw',
        depositAmount: 2000,
        totalValue: 10000,
        allocation: [
          { symbol: 'AAPL', target: 50, shares: 50, currentPrice: 100 }, // 5000 (50%)
          { symbol: 'GOOGL', target: 50, shares: 25, currentPrice: 200 }, // 5000 (50%)
        ]
      }

      // 預期：
      // - 未來總資產 = 8000
      // - 每個都應賣出一些以維持 50/50 配置
      // - AAPL 目標 = 4000，應賣出 10 股
      // - GOOGL 目標 = 4000，應賣出 5 股
    })

    it('應該處理提取金額大於目標調整的情況', () => {
      const input = {
        action: 'withdraw',
        depositAmount: 5000,
        totalValue: 10000,
        allocation: [
          { symbol: 'AAPL', target: 50, shares: 50, currentPrice: 100 },
          { symbol: 'GOOGL', target: 50, shares: 25, currentPrice: 200 },
        ]
      }

      // 需要提取 5000，但按目標配置只能賣出部分
      // 應該按比例額外賣出以湊足提取金額
    })
  })

  describe('邊界情況', () => {
    it('應該處理零股價的資產', () => {
      const input = {
        action: 'deposit',
        depositAmount: 1000,
        totalValue: 5000,
        allocation: [
          { symbol: 'AAPL', target: 50, shares: 50, currentPrice: 100 },
          { symbol: 'DELISTED', target: 50, shares: 100, currentPrice: 0 }, // 下市股票
        ]
      }

      // 應該跳過零股價的資產
    })

    it('應該處理總目標不等於 100% 的情況', () => {
      const input = {
        action: 'deposit',
        depositAmount: 1000,
        totalValue: 10000,
        allocation: [
          { symbol: 'AAPL', target: 30, shares: 50, currentPrice: 100 },
          { symbol: 'GOOGL', target: 40, shares: 25, currentPrice: 200 },
          // 總和只有 70%，應該自動標準化
        ]
      }

      // 應該標準化為 AAPL=42.86%, GOOGL=57.14%
    })

    it('應該處理容忍閾值內的小差異', () => {
      const input = {
        action: 'deposit',
        depositAmount: 100,
        totalValue: 10000,
        allocation: [
          { symbol: 'AAPL', target: 50, shares: 51, currentPrice: 100 }, // 5100 (50.5%)，接近目標
          { symbol: 'GOOGL', target: 50, shares: 24, currentPrice: 200 }, // 4800 (47.5%)，接近目標
        ]
      }

      // 如果差異在容忍閾值內（0.25%），可能不需要交易
    })

    it('應該處理空配置', () => {
      const input = {
        action: 'deposit',
        depositAmount: 1000,
        totalValue: 0,
        allocation: []
      }

      // 不應該崩潰，應返回空結果
    })

    it('應該處理負的 totalValue（異常情況）', () => {
      const input = {
        action: 'deposit',
        depositAmount: 1000,
        totalValue: -1000,
        allocation: [
          { symbol: 'AAPL', target: 100, shares: 0, currentPrice: 100 },
        ]
      }

      // 應該安全處理，可能視為 totalValue = 0
    })
  })

  describe('精度和舍入', () => {
    it('應該正確處理股數舍入', () => {
      // 買入時應該向下取整（不能買半股）
      // 賣出時應該向下取整（不能賣不存在的股份）
    })

    it('應該最小化剩餘現金', () => {
      // greedy 演算法應該盡可能把現金花掉
      // 剩餘現金應該小於最便宜的一股
    })
  })

  describe('效能測試', () => {
    it('應該在合理時間內處理大量資產', () => {
      const largeAllocation = Array.from({ length: 100 }, (_, i) => ({
        symbol: `STOCK${i}`,
        target: 1,
        shares: Math.floor(Math.random() * 100),
        currentPrice: Math.random() * 500 + 10
      }))

      const input = {
        action: 'deposit',
        depositAmount: 10000,
        totalValue: 100000,
        allocation: largeAllocation
      }

      const start = performance.now()
      // const result = rebalanceAllocate(input)
      const end = performance.now()

      // 應該在 100ms 內完成
      expect(end - start).toBeLessThan(100)
    })
  })
})

describe('實際案例測試', () => {
  it('案例 1: 用戶存入 $1000 到 60/40 配置', () => {
    // 當前持倉: AAPL $6000 (60%), GOOGL $4000 (40%)
    // 存入 $1000
    // 未來總資產 $11000
    // 目標: AAPL $6600, GOOGL $4400
    // 操作: 買入 AAPL $600, 買入 GOOGL $400
  })

  it('案例 2: 用戶提取 $2000 從平衡配置', () => {
    // 當前持倉: AAPL $5000 (50%), GOOGL $5000 (50%)
    // 提取 $2000
    // 未來總資產 $8000
    // 目標: AAPL $4000, GOOGL $4000
    // 操作: 賣出 AAPL $1000, 賣出 GOOGL $1000
  })

  it('案例 3: 嚴重失衡的配置', () => {
    // 當前: AAPL $9000 (90%), GOOGL $1000 (10%)
    // 目標: 50/50
    // 存入 $0（純再平衡）
    // 操作: 賣出 AAPL $4000, 買入 GOOGL $4000
  })
})
