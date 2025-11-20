import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import HomeView from '../views/HomeView.vue'
import DashboardView from '../views/DashboardView.vue'
import PortfolioView from '../views/PortfolioView.vue'
import PortfolioListView from '../views/PortfolioListView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import HoldingsView from '../views/HoldingsView.vue'
import DividendsView from '../views/DividendsView.vue'
import AllocationView from '../views/AllocationView.vue'
import RebalancingView from '../views/RebalancingView.vue'
import BacktestingView from '../views/BacktestingView.vue'
import UserSettingView from '../views/UserSettingView.vue'
import AssetProfileView from '../views/AssetProfileView.vue'
import UserGuideView from '../views/UserGuideView.vue'

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'home',
        component: HomeView
    },
    {
        path: '/about',
        name: 'about',
        // route level code-splitting
        // this generates a separate chunk (About.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import('../views/AboutView.vue')
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: DashboardView,
        meta: { requiresAuth: true }
    },
    {
        path: '/portfolio',
        name: 'portfolio',
        component: PortfolioView,
        meta: { requiresAuth: true }
    },
    {
        path: '/portfolios',
        name: 'portfolios',
        component: PortfolioListView,
        meta: { requiresAuth: true }
    },
    {
        path: '/transactions',
        name: 'transactions',
        component: TransactionsView,
        meta: { requiresAuth: true }
    },
    {
        path: '/holdings',
        name: 'holdings',
        component: HoldingsView,
        meta: { requiresAuth: true }
    },
    {
        path: '/dividends',
        name: 'dividends',
        component: DividendsView,
        meta: { requiresAuth: true }
    },
    {
        path: '/allocation',
        name: 'allocation',
        component: AllocationView,
        meta: { requiresAuth: true }
    },
    {
        path: '/rebalancing',
        name: 'rebalancing',
        component: RebalancingView,
        meta: { requiresAuth: true }
    },
    {
        path: '/backtesting',
        name: 'backtesting',
        component: BacktestingView,
        meta: { requiresAuth: true }
    },
    {
        path: '/settings',
        name: 'settings',
        component: UserSettingView,
        meta: { requiresAuth: true }
    },
    {
        path: '/asset/:symbol',
        name: 'asset',
        component: AssetProfileView,
        props: true,
        meta: { requiresAuth: true }
    },
    {
        path: '/user-guide',
        name: 'user-guide',
        component: UserGuideView,
        meta: { requiresAuth: false }
    },
    {
        path: '/test',
        name: 'test',
        component: () => import('../views/TestView.vue')
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // 等待 Firebase 初始化完成 (如果需要)
    // await authStore.init() 

    if (to.meta.requiresAuth && !authStore.user) {
        next({ name: 'home' })
    } else {
        next()
    }
})

export default router
