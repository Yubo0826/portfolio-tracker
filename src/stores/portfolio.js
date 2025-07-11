import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'


export const usePortfolioStore = defineStore('portfolio', () => {
  const auth = useAuthStore()
  const currentPortfolio = ref(null)
  const portfolios = ref([])

  async function fetchPortfolios() {
    if (!auth.user) {
        console.warn('No user ID found, cannot fetch portfolios');
        return;
    }
    try {
        console.log('Fetching portfolios for user:', auth.user.uid);
        const data = await api.get(`http://localhost:3000/api/portfolio?uid=${auth.user.uid}`);
        console.log('Fetched portfolios:', data);
        portfolios.value = data.portfolios;
    } catch (error) {
        console.error('Error fetching portfolios:', error);
    }
  }

  function setPortfolios(portfoliosList) {
    if (!Array.isArray(portfoliosList)) {
      console.error('Invalid portfolios list:', portfoliosList);
      return;
    }
    portfolios.value = portfoliosList;
  }

  function setCurrentPortfolio(portfolio) {
    currentPortfolio.value = portfolio
  }

  async function addPortfolio(newPortfolio) {
    const { name, description } = newPortfolio;
    if (!name) {
        console.warn('Name are required to add a portfolio');
        return;
    }
    try {
        const data = await api.post('http://localhost:3000/api/portfolio', {
            uid: auth.user.uid,
            name,
            description,
        });
        portfolios.value.push(data.portfolio);
    } catch (error) {
        console.error('Error adding portfolio:', error);
    }
  }

  function removePortfolio(portfolioId) {
    portfolios.value = portfolios.value.filter(p => p.id !== portfolioId)
  }

  return {
    portfolios,
    currentPortfolio,
    fetchPortfolios,
    setPortfolios,
    addPortfolio,
    removePortfolio,
    setCurrentPortfolio,
  }
})
