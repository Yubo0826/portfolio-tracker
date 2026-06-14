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
            { label: t('holdings'), to: '/portfolio/holdings', icon: 'bank' },
            { label: t('transactions'), to: '/portfolio/transactions', icon: 'receipt' },
            { label: t('dividends'), to: '/portfolio/dividends', icon: 'pi pi-wallet' },
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
      key: 'cashflow',
      label: t('cashFlowNav'),
      to: '/cash-flow',
      icon: 'pi pi-wallet',
      activePaths: ['/cash-flow', '/cash-flows'],
      hasMenu: false,
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
      ],
    },
    {
      key: 'portfolio',
      label: t('portfolio'),
      items: [
        {
          key: 'holdings',
          label: t('holdings'),
          to: '/portfolio/holdings',
          icon: 'bank',
          activePaths: ['/portfolio/holdings', '/holdings'],
        },
        {
          key: 'transactions',
          label: t('transactions'),
          to: '/portfolio/transactions',
          icon: 'receipt',
          activePaths: ['/portfolio/transactions', '/transactions'],
        },
        {
          key: 'dividends',
          label: t('dividends'),
          to: '/portfolio/dividends',
          icon: 'savings',
          activePaths: ['/portfolio/dividends', '/dividends'],
        },
        {
          key: 'cashflow',
          label: t('cashFlowNav'),
          to: '/cash-flow',
          icon: 'cash',
          activePaths: ['/cash-flow', '/cash-flows'],
        },
      ],
    },
    {
      key: 'tools',
      label: t('functions'),
      items: [
        {
          key: 'allocation',
          label: t('setTargets'),
          to: '/allocation',
          icon: 'pie-chart',
          activePaths: ['/allocation'],
        },
        {
          key: 'rebalancing',
          label: t('rebalance'),
          to: '/rebalancing',
          icon: 'piechart',
          activePaths: ['/rebalancing'],
        },
        {
          key: 'backtesting',
          label: t('backtesting'),
          to: '/backtesting',
          icon: 'history',
          activePaths: ['/backtesting'],
        },
      ],
    },
    {
      key: 'manage',
      label: t('portfolios'),
      items: [
        {
          key: 'portfolios',
          label: t('portfolioManagement'),
          to: '/portfolios',
          icon: 'folder',
          activePaths: ['/portfolios'],
        },
        {
          key: 'guide',
          label: t('userGuide'),
          to: '/user-guide',
          icon: 'book',
          activePaths: ['/user-guide'],
        },
      ],
    },
  ]
}