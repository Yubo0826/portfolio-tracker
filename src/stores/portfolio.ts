import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/utils/api.js'
import { useAuthStore } from '@/stores/auth'

// 列表頁計算持有檔數與市值所需的最小持股欄位（由 GET /api/portfolio 一併帶回）
interface PortfolioHoldingSummary {
  currency?: string
  current_price?: string | number | null
  total_shares?: string | number | null
}

interface Portfolio {
  id: string
  name: string
  description?: string
  drift_threshold?: number
  enable_email_alert?: boolean
  holdings?: PortfolioHoldingSummary[]
}

interface NewPortfolio {
  name: string
  description?: string
  drift_threshold?: number
  enable_email_alert?: boolean
  source_id?: string // 製作副本：後端一併複製來源組合的交易、持股、目標配置與股息
}

interface UpdatePortfolio {
  name: string
  description?: string
  drift_threshold?: number
  enable_email_alert?: boolean
}

export const usePortfolioStore = defineStore('portfolio', () => {
  const auth = useAuthStore()
  const currentPortfolio: Ref<Portfolio | null> = ref(null)
  const portfolios: Ref<Portfolio[]> = ref([])
  // 首次 fetchPortfolios 完成前為 true，讓畫面得以區分「尚未確認 portfolio」與「確認沒有 portfolio」
  const isInitializing: Ref<boolean> = ref(true)

  async function fetchPortfolios(): Promise<void> {
    if (!auth.user) {
      console.warn('No user ID found, cannot fetch portfolios')
      isInitializing.value = false
      return
    }
    try {
      const data = await api.get(`/api/portfolio?uid=${auth.user.uid}`)
      console.log('Fetched portfolios:', data)
      portfolios.value = data.portfolios
      if (data.portfolios.length > 0) {
        const localStoragePortfolio = JSON.parse(localStorage.getItem('currentPortfolio') || 'null')
        console.log('Local storage portfolio:', localStoragePortfolio)
        // 判斷 localStoragePortfolio 是否在 data.portfolios 中存在
        if (localStoragePortfolio && data.portfolios.some((p: Portfolio) => p.id === localStoragePortfolio.id)) {
          setCurrentPortfolio(localStoragePortfolio)
        } else {
          setCurrentPortfolio(data.portfolios[0])
        }
      } else {
        setCurrentPortfolio(null)
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error)
    } finally {
      isInitializing.value = false
    }
  }

  // 直接設定整個 portfolios 陣列
  function setPortfolios(portfoliosList: Portfolio[]): void {
    if (!Array.isArray(portfoliosList)) {
      console.error('Invalid portfolios list:', portfoliosList)
      return
    }
    portfolios.value = portfoliosList
  }

  // 設定目前使用的投資組合
  function setCurrentPortfolio(portfolio: Portfolio | null): void {
    currentPortfolio.value = portfolio
    // holdings 只給列表頁算彙總用，不寫進 localStorage —— 否則每次切換組合都會把整份持股塞進去
    const persisted = portfolio ? { ...portfolio, holdings: undefined } : null
    localStorage.setItem('currentPortfolio', JSON.stringify(persisted))
    console.log('Current portfolio set to localstorage:', persisted)
  }
  
  // 之後後端or前端可能要卡重複名稱
  async function addPortfolio(newPortfolio: NewPortfolio): Promise<Portfolio | null> {
    const { name, description, drift_threshold, enable_email_alert, source_id } = newPortfolio
    if (!name) {
      throw new Error('Name are required to add a portfolio')
    }
    try {
      const data = await api.post('/api/portfolio', {
        uid: auth.user.uid,
        name,
        description,
        drift_threshold,
        enable_email_alert,
        source_id
      })
      portfolios.value.push(data.portfolio)
      return data.portfolio
    } catch (error) {
      console.error('Error adding portfolio:', error)
      throw error
    }
  }

  async function editPortfolio(portfolioId: string, updatedPortfolio: UpdatePortfolio): Promise<void> {
    const { name, description, drift_threshold, enable_email_alert } = updatedPortfolio
    if (!name) {
      console.warn('Name is required to edit a portfolio')
      return
    }
    try {
      const data = await api.put(`/api/portfolio/`, {
        uid: auth.user.uid,
        id: portfolioId,
        name,
        description,
        drift_threshold,
        enable_email_alert
      })
      const index = portfolios.value.findIndex(p => p.id === portfolioId)
      if (index !== -1) {
        // PUT 回應不含 holdings，直接覆蓋會讓列表頁的檔數／市值欄位變空白
        portfolios.value[index] = { ...data.portfolio, holdings: portfolios.value[index].holdings }
      }
      // 編輯的若是目前選取的投資組合，同步更新（含 localStorage），否則標題仍顯示舊名稱
      if (currentPortfolio.value?.id === portfolioId) {
        setCurrentPortfolio(data.portfolio)
      }
    } catch (error) {
      console.error('Error editing portfolio:', error)
    }
  }

  async function removePortfolio(ids: string[]): Promise<void> {
    if (!Array.isArray(ids) || ids.length === 0) {
      console.warn('No portfolio IDs provided for removal')
      return
    }
    try {
      console.log('Removing portfolios with IDs:', ids)
      await api.delete(`/api/portfolio`, {
        uid: auth.user.uid,
        ids,
      })
      portfolios.value = portfolios.value.filter(p => !ids.includes(p.id))
      // 如果刪除的是當前投資組合，則切換到第一個或 null
      if (currentPortfolio.value && ids.includes(currentPortfolio.value.id)) {
        currentPortfolio.value = portfolios.value.length > 0 ? portfolios.value[0] : null
        localStorage.setItem('currentPortfolio', JSON.stringify(currentPortfolio.value))
      }
    } catch (error) {
      console.error('Error removing portfolio:', error)
    }
  }

  return {
    portfolios,
    currentPortfolio,
    isInitializing,
    fetchPortfolios,
    setPortfolios,
    addPortfolio,
    editPortfolio,
    removePortfolio,
    setCurrentPortfolio,
  }
})