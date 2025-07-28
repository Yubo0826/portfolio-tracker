<script setup>
import { ref, watch, onMounted } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar';
import Menu from 'primevue/menu';
import 'primeicons/primeicons.css';

const router = useRouter()

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

const isDark = ref(false);

const toggleDarkMode = () => {
  isDark.value = !isDark.value;

  if (isDark.value) {
    document.documentElement.classList.add('my-app-dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('my-app-dark');
    localStorage.setItem('theme', 'light');
  }
};

// 初始載入：套用 localStorage 的偏好
onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    isDark.value = true;
    document.documentElement.classList.add('my-app-dark');
  }
});

// 登入會員相關

const menu = ref();

const toggleMenu = (event) => {
  menu.value.toggle(event);
};

const menuItems = [
  {
    label: '個人頁面',
    icon: 'pi pi-user',
    command: () => {
      router.push('/profile');
    },
  },
  {
    label: '設定',
    icon: 'pi pi-cog',
    command: () => {
      router.push('/settings');
    },
  },
  {
    separator: true,
  },
  {
    label: '登出',
    icon: 'pi pi-sign-out',
    command: () => {
      auth.logout();
    },
  },
];

const selectVisible = ref(false);
const PortfolioSelect = ref(null);

const goToPortfolio = () => {
  selectVisible.value = false; // 關閉選擇器
  router.push('/portfolio');
  PortfolioSelect.value.hide();
};

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

      <div class="flex justify-center items-center mb-4">

        <Select v-model="selectedPortfolio" ref="PortfolioSelect" v-model:visible="selectVisible" :options="portfolioStore.portfolios" optionLabel="name" placeholder="Select a City" checkmark :highlightOnSelect="false" class="no-border">
          <template #header>
              <div class="p-3">
                  <span class="font-bold">選擇投資組合</span>
              </div>
          </template>
          <template #footer>
              <div class="p-3">
                  <Button label="New Portfolio" fluid severity="secondary" text size="small" icon="pi pi-plus text-left" />
              </div>
              <div class="p-3 border-t-1 border-gray-200">
                  <Button label="Manage Portfolio" @click="goToPortfolio" fluid severity="secondary" text size="small" icon="pi pi-cog" />
              </div>
          </template>
        </Select>

        <Button
          :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
          @click="toggleDarkMode"
          class="m-4 p-button-rounded p-button-text"
          aria-label="Toggle Dark Mode"
        />
        
        <!-- 有登入 -->
        <template v-if="auth.user">
          <Avatar :image="auth.user.photoURL" @click="toggleMenu" shape="circle" class="mr-2 cursor-pointer" />
          <Menu ref="menu" :model="menuItems" :popup="true" />
        </template>
        <!-- 沒登入 -->
        <template v-else>
          <Avatar  @click="auth.login" icon="pi pi-user" shape="circle" class="mr-2 cursor-pointer" />
        </template>
  
        
      </div>


    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  text-align: center;
}

.no-border .p-dropdown {
  border: none !important;
  box-shadow: none !important;
}
</style>
