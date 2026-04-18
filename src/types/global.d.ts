declare module '@/utils/api.js' {
  const api: {
    get: (url: string, params?: any) => Promise<any>
    post: (url: string, data?: any) => Promise<any>
    put: (url: string, data?: any) => Promise<any>
    delete: (url: string, data?: any) => Promise<any>
  }
  export default api
}

declare module '@/firebase' {
  export const auth: any
  export const provider: any
}

// 現金帳戶相關類型
export interface CashAccount {
  id: string
  name: string           // 帳戶名稱
  currency: string       // 貨幣類型（TWD, USD 等）
  balance: number        // 目前餘額
  portfolioId: string    // 所屬投資組合
  description?: string   // 帳戶描述
  createdAt: string
  updatedAt: string
}

// 現金流記錄類型
export interface CashFlow {
  id: string
  accountId: string      // 現金帳戶 ID
  portfolioId: string    // 投資組合 ID
  type: CashFlowType     // 現金流類型
  amount: number         // 金額（正數為流入，負數為流出）
  description: string    // 描述
  relatedTransactionId?: string  // 關聯的交易 ID
  relatedSymbol?: string // 關聯的股票代號
  balanceAfter?: number  // 交易後餘額
  createdAt: string
  updatedAt: string
}

// 現金流類型枚舉
export type CashFlowType = 
  | 'DEPOSIT'           // 存款
  | 'WITHDRAWAL'        // 提款
  | 'STOCK_BUY'         // 買入股票
  | 'STOCK_SELL'        // 賣出股票
  | 'DIVIDEND'          // 股利收入
  | 'FEE'               // 手續費
  | 'TRANSFER_IN'       // 轉入
  | 'TRANSFER_OUT'      // 轉出
  | 'ADJUSTMENT'        // 餘額調整
  | 'OTHER'             // 其他

// 新增/編輯現金帳戶表單
export interface NewCashAccount {
  name: string
  currency: string
  balance: number
  description?: string
  isActive?: boolean
}

export interface UpdateCashAccount extends NewCashAccount {
  id: string
}

// 新增現金流表單
export interface NewCashFlow {
  accountId: string
  type: CashFlowType
  amount: number
  description: string
  date?: string  // YYYY-MM-DD 格式
  relatedTransactionId?: string
  relatedSymbol?: string
}

// 現金流查詢參數
export interface CashFlowQuery {
  accountId?: string
  type?: CashFlowType
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}