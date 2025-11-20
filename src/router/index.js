import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
      path: '/asset/:symbol',
      name: 'asset',
      component: () => import('../views/AssetProfileView.vue'),
    },
    {
      path: '/test',
      name: 'test',
      component: () => import('../views/TestView.vue'),
    },
    {
      path: '/user-settings',
      name: 'user-settings',
      component: () => import('../views/UserSettingView.vue'),
    },
    {
      path: '/user-guide',
      name: 'user-guide',
      component: () => import('../views/UserGuideView.vue'),
    }
  ],
})

export default router
