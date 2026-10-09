import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/portfolios',
      name: 'portfolios',
      component: () => import('../views/PortfolioListView.vue'),
    },
    { path: '/portfolio', redirect: '/portfolio/holdings' },
    // 舊網址導到 PortfolioView 的對應分頁，保留書籤可用
    { path: '/:tab(holdings|transactions|dividends)', redirect: (to) => `/portfolio/${to.params.tab}` },

    // 用路由參數承載分頁值，只允許三種
    {
      path: '/portfolio/:tab(holdings|transactions|dividends)',
      name: 'portfolio',
      component: () => import('../views/PortfolioView.vue'),
    },
    {
      path: '/allocation',
      name: 'allocation',
      component: () => import('../views/AllocationView.vue'),
    },
    {
      path: '/rebalancing',
      name: 'rebalancing',
      component: () => import('../views/RebalancingView.vue'),
    },
    {
      path: '/backtesting',
      name: 'backtesting',
      component: () => import('../views/BacktestingView.vue'),
    },
    {
      path: '/watchlist',
      name: 'watchlist',
      component: () => import('../views/WatchlistView.vue'),
    },
    {
      path: '/asset/:symbol',
      name: 'asset',
      component: () => import('../views/AssetProfileView.vue'),
    },
    {
      path: '/user-settings',
      name: 'user-settings',
      component: () => import('../views/UserSettingView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/user-guide',
      name: 'user-guide',
      component: () => import('../views/UserGuideView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    }
  ],
})

// 未登入以 demo-user 瀏覽（首頁「試用 Demo」），只擋需要真實帳號的頁面
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.whenReady()
  if (to.meta.requiresAuth && auth.user.uid === 'demo-user') return { name: 'home' }
})

export default router
