import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
const uid = computed(() => auth.user ? auth.user.uid : null)

export const usePortfolioStore = defineStore('portfolio', () => {
  const currentPortfolio = ref(null)
  const portfolios = ref([])

  async function getPortfolios() {
    if (!uid.value) {
        console.warn('No user ID found, cannot fetch portfolios');
        return;
    }
    try {
        const data = await api.get(`/portfolios?uid=${uid.value}`);
        portfolios.value = data.portfolios;
    } catch (error) {
        console.error('Error fetching portfolios:', error);
    }
  }

  function setCurrentPortfolio(portfolio) {
    currentPortfolio.value = portfolio
  }

  function addPortfolio(portfolio) {
    portfolios.value.push(portfolio)
  }

  function removePortfolio(portfolioId) {
    portfolios.value = portfolios.value.filter(p => p.id !== portfolioId)
  }

  return { portfolios, getPortfolios, setCurrentPortfolio, addPortfolio, removePortfolio }
})
