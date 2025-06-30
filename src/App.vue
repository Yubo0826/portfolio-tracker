<script setup>
import { RouterLink, RouterView } from 'vue-router'
import Button from 'primevue/button'

import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()

</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/">
          <Button label="Home" severity="secondary" rounded />
        </RouterLink>
        <RouterLink to="/dashboard">
          <Button label="Dashboard" severity="secondary" rounded />
        </RouterLink>
        <RouterLink to="/transactions">
          <Button label="Transactions" severity="secondary" rounded />
        </RouterLink>
        <!-- <RouterLink to="/test">
          <Button label="Test" severity="secondary" rounded />
        </RouterLink> -->
      </nav>

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
