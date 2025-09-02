import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/utils/api.js';
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

        const data = await api.get(`http://localhost:3000/api/portfolio?uid=${auth.user.uid}`);
        console.log('Fetched portfolios:', data);
        portfolios.value = data.portfolios;
        if (data.portfolios.length > 0) {
            currentPortfolio.value = data.portfolios[0];
        } else {
            currentPortfolio.value = null;
        }
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

  async function editPortfolio(portfolioId, updatedPortfolio) {
    const { name, description } = updatedPortfolio;
    if (!name) {
        console.warn('Name is required to edit a portfolio');
        return;
    }
    try {
        const data = await api.put(`http://localhost:3000/api/portfolio/`, {
            uid: auth.user.uid,
            id: portfolioId,
            name,
            description,
        });
        const index = portfolios.value.findIndex(p => p.id === portfolioId);
        if (index !== -1) {
            portfolios.value[index] = data.portfolio;
        }
    } catch (error) {
        console.error('Error editing portfolio:', error);
    }
  }

  async function removePortfolio(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
        console.warn('No portfolio IDs provided for removal');
        return;
    }
    try {
      console.log('Removing portfolios with IDs:', ids);
        await api.delete(`http://localhost:3000/api/portfolio`, {
          uid: auth.user.uid,
          ids,
      });
        portfolios.value = portfolios.value.filter(p => !ids.includes(p.id));
    } catch (error) {
        console.error('Error removing portfolio:', error);
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
