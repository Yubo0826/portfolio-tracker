import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TransactionDialog from '../TransactionDialog.vue'

vi.mock('@/utils/api.js', () => ({
  default: { get: vi.fn().mockResolvedValue([
    { symbol: 'QQQ', longname: 'Invesco QQQ', typeDisp: 'ETF' },
    { symbol: 'QQQM', longname: 'Invesco NASDAQ 100 ETF', typeDisp: 'ETF' },
  ]) },
}))
vi.mock('@/stores/transactions', () => ({
  useTransactionsStore: () => ({ searchPrice: vi.fn().mockResolvedValue({ price: 300.13, currency: 'USD' }) }),
}))
vi.mock('@/stores/portfolio', () => ({ usePortfolioStore: () => ({ currentPortfolio: null, portfolios: [] }) }))
vi.mock('@/stores/holdings', () => ({ useHoldingsStore: () => ({}) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: k => k }) }))

describe('TransactionDialog', () => {
  it('只帶代號的 formData 會補上名稱、類型、價格與幣別', async () => {
    const w = mount(TransactionDialog, { shallow: true, global: { mocks: { $t: k => k }, directives: { tooltip: {} }, stubs: ['Dialog', 'Select', 'DatePicker', 'InputNumber', 'SelectButton', 'Button'] } })
    await w.setProps({ formData: { symbol: 'QQQM', date: new Date(), transactionType: 'buy' } })
    await flushPromises()
    expect(w.vm.form).toMatchObject({
      symbol: 'QQQM', name: 'Invesco NASDAQ 100 ETF', assetType: 'ETF', price: 300.13, currency: 'USD', operation: 'buy',
    })
  })
})
