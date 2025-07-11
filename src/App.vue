<script setup>
import { watch } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'

const auth = useAuthStore()

const portfolioStore = usePortfolioStore()

// 如果有用戶登入，則設定 uid
if (auth.user) {
    portfolioStore.fetchPortfolios()
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
    portfolioStore.fetchPortfolios();
  }
})


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
      </nav>

      <Button label="Toggle Dark Mode" @click="toggleDarkMode()" class="m-4" />

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
