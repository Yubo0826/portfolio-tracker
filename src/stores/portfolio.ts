import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/utils/api.js'
import { useAuthStore } from '@/stores/auth'

interface Portfolio {
  id: string
  name: string
  description?: string
  drift_threshold?: number
  enable_email_alert?: boolean
}

interface NewPortfolio {
  name: string
  description?: string
  drift_threshold?: number
  enable_email_alert?: boolean
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

  async function fetchPortfolios(): Promise<void> {
    if (!auth.user) {
      console.warn('No user ID found, cannot fetch portfolios')
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
    localStorage.setItem('currentPortfolio', JSON.stringify(portfolio))
    console.log('Current portfolio set to localstorage:', portfolio)
  }
  
  // 之後後端or前端可能要卡重複名稱
  async function addPortfolio(newPortfolio: NewPortfolio): Promise<void> {
    const { name, description, drift_threshold, enable_email_alert } = newPortfolio
    if (!name) {
      console.warn('Name are required to add a portfolio')
      return
    }
    try {
      const data = await api.post('/api/portfolio', {
        uid: auth.user.uid,
        name,
        description,
        drift_threshold,
        enable_email_alert
      })
      portfolios.value.push(data.portfolio)
    } catch (error) {
      console.error('Error adding portfolio:', error)
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
        portfolios.value[index] = data.portfolio
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
    fetchPortfolios,
    setPortfolios,
    addPortfolio,
    editPortfolio,
    removePortfolio,
    setCurrentPortfolio,
  }
})