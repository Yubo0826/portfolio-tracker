<script setup>
import { RouterLink, RouterView } from 'vue-router'
import Button from 'primevue/button'

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
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  text-align: center;
}
</style>
