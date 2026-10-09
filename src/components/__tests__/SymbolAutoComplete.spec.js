import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import AutoComplete from 'primevue/autocomplete'
import SymbolAutoComplete from '../SymbolAutoComplete.vue'

vi.mock('@/utils/api.js', () => ({ default: { get: vi.fn().mockResolvedValue([]) } }))

const mountIt = (modelValue = '') =>
  mount(SymbolAutoComplete, {
    props: { modelValue },
    global: { plugins: [PrimeVue], mocks: { $t: k => k } },
  })

describe('SymbolAutoComplete', () => {
  it('沒從選單選取就 blur（change）時清空代號', async () => {
    const w = mountIt('AAP')
    const input = w.find('input')
    input.element.value = 'AAP'
    await input.trigger('change')
    expect(w.emitted('update:modelValue').at(-1)).toEqual([null])
  })

  it('同一個選項重複觸發 item-select 只送出一次 update', async () => {
    const w = mountIt()
    const ac = w.findComponent(AutoComplete)
    const value = { symbol: 'AAPL', name: 'Apple', assetType: 'Equity' }
    ac.vm.$emit('item-select', { value })
    await w.setProps({ modelValue: 'AAPL' })
    ac.vm.$emit('item-select', { value })
    expect(w.emitted('update')).toHaveLength(1)
  })
})
