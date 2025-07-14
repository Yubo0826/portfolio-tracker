<script setup>
import { ref, watch } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import 'primeicons/primeicons.css'

const auth = useAuthStore()

const portfolioStore = usePortfolioStore()

// 如果有用戶登入，則設定 uid
if (auth.user) {
    getPortfolios()
    console.log('User is logged in:', auth.user);
} else {
    console.log('No user is logged in');
}

/*
    1. 監聽 auth.user 的變化，如果有用戶登入則取得交易資料
    2. 如果已在登入狀態下刷新瀏覽器 auth.user 會自動重新登入
*/

watch(() => auth.user, (newUser) => {
  if (newUser) {
    console.log('User is logged in:', newUser);
    getPortfolios();
  }
})

const selectedPortfolio = ref(null);

// Pinia → Local v-model 同步
watch(() => portfolioStore.currentPortfolio, (newVal) => {
  if (newVal?.id !== selectedPortfolio.value?.id) {
    selectedPortfolio.value = newVal
  }
})

// Local v-model → Pinia 同步
watch(selectedPortfolio, (newVal) => {
  if (newVal?.id !== portfolioStore.currentPortfolio?.id) {
    portfolioStore.setCurrentPortfolio(newVal)
  }
})

async function getPortfolios() {
    if (!auth.user?.uid) {
        console.warn('No user ID found, cannot fetch portfolios');
        return;
    }
    try {
        await portfolioStore.fetchPortfolios();
        selectedPortfolio.value = portfolioStore.currentPortfolio;
    } catch (error) {
        console.error('Error fetching portfolios:', error);
    }
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('my-app-dark');
}

</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/">
          <Button label="Home" severity="secondary" rounded class="m-1" />
        </RouterLink>
        <RouterLink to="/portfolio">
          <Button label="Portfolio" severity="secondary" rounded class="m-1" />
        </RouterLink>
        <RouterLink to="/dashboard">
          <Button label="Dashboard" severity="secondary" rounded class="m-1" />
        </RouterLink>
        <RouterLink to="/holdings">
          <Button label="Holdings" severity="secondary" rounded class="m-1" />
        </RouterLink>
        <RouterLink to="/transactions">
          <Button label="Transactions" severity="secondary" rounded class="m-1" />
        </RouterLink>
        <RouterLink to="/allocation">
          <Button label="Allocation" severity="secondary" rounded class="m-1" />
        </RouterLink>
        <RouterLink to="/rebalancing">
          <Button label="Rebalancing" severity="secondary" rounded class="m-1" />
        </RouterLink>
      </nav>

      <Button label="Toggle Dark Mode" @click="toggleDarkMode()" class="m-4" />

      <Select v-model="selectedPortfolio" :options="portfolioStore.portfolios" optionLabel="name" placeholder="Select a City" checkmark :highlightOnSelect="false" class="w-full md:w-56" />
      {{ portfolioStore.currentPortfolio?.name || 'No Portfolio Selected' }}
      <div>
        <h1>Google 登入</h1>
        <div v-if="auth.user">
          <p>歡迎，{{ auth.user.displayName }}（{{ auth.user.email }}）</p>
          <button @click="auth.logout">登出</button>
        </div>
        <div v-else>
          <button @click="auth.login">使用 Google 登入</button>
        </div>
      </div>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  text-align: center;
}
</style>
