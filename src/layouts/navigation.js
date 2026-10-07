export function buildSidebarSections(t) {
  return [
    {
      key: 'main',
      label: t('navOverview'),
      items: [
        {
          key: 'dashboard',
          label: t('dashboard'),
          to: '/dashboard',
          icon: 'pi pi-th-large',
          activePaths: ['/dashboard'],
        },
        {
          key: 'asset-details',
          label: t('assetDetails'),
          to: '/portfolio/holdings',
          icon: 'pi pi-list',
          activePaths: [
            '/portfolio/holdings',
            '/portfolio/transactions',
            '/portfolio/dividends',
          ],
        },
        {
          key: 'cash-flow',
          label: t('cashFlowNav'),
          to: '/cash-flow',
          icon: 'pi pi-wallet',
          activePaths: ['/cash-flow', '/cash-flows'],
        },
        {
          key: 'watchlist',
          label: t('watchlist'),
          to: '/watchlist',
          icon: 'pi pi-star',
          activePaths: ['/watchlist'],
        },
      ],
    },
    {
      key: 'analysis',
      label: t('analysis'),
      items: [
        {
          key: 'allocation',
          label: t('setTargets'),
          to: '/allocation',
          icon: 'pi pi-chart-pie',
          activePaths: ['/allocation'],
        },
        {
          key: 'rebalancing',
          label: t('rebalance'),
          to: '/rebalancing',
          icon: 'pi pi-sliders-h',
          activePaths: ['/rebalancing'],
        },
        {
          key: 'backtesting',
          label: t('backtesting'),
          to: '/backtesting',
          icon: 'pi pi-history',
          activePaths: ['/backtesting'],
        },
      ],
    },
    {
      key: 'manage',
      label: t('navManage'),
      items: [
        {
          key: 'portfolios',
          label: t('portfolioManagement'),
          to: '/portfolios',
          icon: 'pi pi-folder',
          activePaths: ['/portfolios'],
        },
      ],
    },
  ]
}
