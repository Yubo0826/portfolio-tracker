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
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: () => import('../views/TransactionsView.vue'),
    },
    {
      path: '/holdings',
      name: 'holdings',
      component: () => import('../views/HoldingsView.vue'),
    },
    {
      path: '/portfolios',
      name: 'portfolios',
      component: () => import('../views/PortfolioListView.vue'),
    },
    // 預設導到 holdings（可選，但建議）
    { path: '/portfolio', redirect: '/portfolio/holdings', component: () => import('../views/PortfolioView.vue') },

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
      path: '/dividends',
      name: 'dividends',
      component: () => import('../views/DividendsView.vue'),
    },
    {
      path: '/cash-flow',
      name: 'cash-flow',
      component: () => import('../views/CashFlowView.vue'),
    },
    {
      path: '/cash-flows',
      name: 'cash-flows',
      component: () => import('../views/CashFlowsListView.vue'),
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
