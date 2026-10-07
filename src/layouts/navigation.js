export function buildSidebarSections(t) {
  return [
    {
      key: 'main',
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
            '/holdings',
            '/transactions',
            '/dividends',
          ],
        },
        {
          key: 'analysis',
          label: t('analysis'),
          icon: 'pi pi-chart-bar',
          type: 'group',
          children: [
            {
              key: 'allocation',
              label: t('setTargets'),
              to: '/allocation',
              activePaths: ['/allocation'],
            },
            {
              key: 'rebalancing',
              label: t('rebalance'),
              to: '/rebalancing',
              activePaths: ['/rebalancing'],
            },
            {
              key: 'backtesting',
              label: t('backtesting'),
              to: '/backtesting',
              activePaths: ['/backtesting'],
            },
          ],
        },
      ],
    },
    {
      key: 'manage',
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