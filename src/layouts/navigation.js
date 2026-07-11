export function buildPrimaryNavigation(t, currentPortfolioName) {
  return [
    {
      key: 'dashboard',
      label: t('dashboard'),
      to: '/dashboard',
      icon: 'dashboard',
      activePaths: ['/dashboard'],
      hasMenu: false,
    },
    {
      key: 'portfolio',
      label: t('portfolio'),
      to: '/portfolio/holdings',
      icon: 'pi pi-briefcase',
      activePaths: ['/portfolio', '/portfolio/holdings', '/portfolio/transactions', '/portfolio/dividends', '/portfolios'],
      hasMenu: true,
      menuGroups: [
        {
          label: t('portfolio'),
          items: [
            { label: t('assetDetails'), to: '/portfolio/holdings', icon: 'detail' },
          ],
        },
        {
          label: t('portfolios'),
          noDivider: true,
          items: [
            {
              label: t('portfolioManagement'),
              to: '/portfolios',
              icon: 'pi pi-folder',
              sub: currentPortfolioName || undefined,
            },
          ],
        },
      ],
    },
    {
      key: 'tools',
      label: t('functions'),
      to: '/allocation',
      icon: 'pi pi-chart-pie',
      activePaths: ['/allocation', '/rebalancing', '/backtesting'],
      hasMenu: true,
      menuGroups: [
        {
          label: t('functions'),
          items: [
            { label: t('rebalance'), to: '/rebalancing', icon: 'pi pi-sync' },
            { label: t('backtesting'), to: '/backtesting', icon: 'pi pi-chart-line' },
          ],
        },
        {
          label: t('setTargets'),
          noDivider: true,
          items: [
            { label: t('setTargets'), to: '/allocation', icon: 'pi pi-cog' },
          ],
        },
      ],
    },
  ]
}

export function buildSidebarSections(t) {
  return [
    {
      key: 'main',
      items: [
        {
          key: 'dashboard',
          label: t('dashboard'),
          to: '/dashboard',
          icon: 'dashboard',
          activePaths: ['/dashboard'],
        },
        {
          key: 'asset-details',
          label: t('assetDetails'),
          to: '/portfolio/holdings',
          icon: 'detail',
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
          icon: 'analysis',
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
          icon: 'folder',
          activePaths: ['/portfolios'],
        },
      ],
    },
  ]
}