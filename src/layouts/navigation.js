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
      // 上方導覽列時，整個區段收合成單一「分析」下拉選單
      collapseInHeaderNav: true,
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

/*
  頂部導覽列的項目，直接由 buildSidebarSections 攤平而來，
  讓兩種導覽版面（側邊欄 / 標題列）永遠顯示相同的頁面清單。
  - 一般區段 -> 每個項目各自一個連結
  - collapseInHeaderNav -> 整個區段變成一個帶下拉選單的連結（點擊時前往第一個項目）
*/
export function buildHeaderNavItems(t) {
  return buildSidebarSections(t).flatMap((section) => {
    if (section.collapseInHeaderNav) {
      return [
        {
          key: section.key,
          label: section.label,
          to: section.items[0].to,
          activePaths: section.items.flatMap((item) => item.activePaths),
          hasMenu: true,
          menuItems: section.items,
        },
      ]
    }

    return section.items.map((item) => ({
      key: item.key,
      label: item.label,
      to: item.to,
      activePaths: item.activePaths,
      hasMenu: false,
    }))
  })
}
