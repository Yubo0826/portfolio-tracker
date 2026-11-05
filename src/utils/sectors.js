// Yahoo 產業 key 的固定色彩對應，讓同一產業在不同 ETF／頁面之間顏色一致
export const SECTOR_META = {
  technology: { labelKey: 'sectorTechnology', light: '#2a78d6', dark: '#3987e5' },
  healthcare: { labelKey: 'sectorHealthcare', light: '#1baf7a', dark: '#199e70' },
  financial_services: { labelKey: 'sectorFinancialServices', light: '#eda100', dark: '#c98500' },
  consumer_cyclical: { labelKey: 'sectorConsumerCyclical', light: '#008300', dark: '#008300' },
  industrials: { labelKey: 'sectorIndustrials', light: '#4a3aa7', dark: '#9085e9' },
  communication_services: { labelKey: 'sectorCommunicationServices', light: '#e34948', dark: '#e66767' },
  consumer_defensive: { labelKey: 'sectorConsumerDefensive', light: '#e87ba4', dark: '#d55181' },
  energy: { labelKey: 'sectorEnergy', light: '#eb6834', dark: '#d95926' },
  // 較少見的產業別權重通常很小，使用中性灰階以免和主要 8 色搶戲
  utilities: { labelKey: 'sectorUtilities', light: '#6b6b66', dark: '#9a9990' },
  realestate: { labelKey: 'sectorRealEstate', light: '#8f8d86', dark: '#b9b7ae' },
  basic_materials: { labelKey: 'sectorBasicMaterials', light: '#52514e', dark: '#7d7b74' },
  // 債券 ETF、加密貨幣、現金等沒有產業資料，以及 ETF 權重加總不足 100% 的部分
  other: { labelKey: 'sectorOther', light: '#c4c2bb', dark: '#4a4945' },
}

/**
 * 依持股市值把各標的的產業權重加總成整個組合的產業金額，由大到小排序。
 * holdings: [{ symbol, currentValue }]（同一幣別）；weightsBySymbol: { AAPL: [{ sector, weight }] }（/api/yahoo/sectors 的回傳）
 * 權重加總不足 1 的部分與不認得的產業都歸到 other。
 */
export function sectorBreakdown(holdings, weightsBySymbol) {
  const totals = {}
  const add = (sector, value) => { if (value > 0) totals[sector] = (totals[sector] || 0) + value }
  for (const { symbol, currentValue } of holdings) {
    const weights = weightsBySymbol[symbol] || []
    let assigned = 0
    for (const { sector, weight } of weights) {
      add(SECTOR_META[sector] ? sector : 'other', currentValue * weight)
      assigned += weight
    }
    add('other', currentValue * (1 - assigned))
  }
  return Object.entries(totals)
    .map(([sector, value]) => ({ sector, value }))
    .sort((a, b) => b.value - a.value)
}
