<template>
  <div class="set-page">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="set-intro">{{ $t('fxIntro') }}</p>
      <div class="flex items-center gap-2">
        <span v-if="isReadOnly" class="text-sm text-muted-color">{{ $t('fxSignInHint') }}</span>
        <Button :label="$t('fxAdd')" icon="pi pi-plus" size="small" :disabled="isReadOnly" @click="openForm()" />
      </div>
    </div>

    <!-- ============ 摘要 ============ -->
    <section v-if="summary" class="set-group">
      <div class="set-group__head">
        {{ $t('fxSummary') }}
        <SelectButton
          v-if="currencies.length > 1"
          v-model="selectedCurrency"
          :options="currencies"
          :allowEmpty="false"
          size="small"
        />
      </div>
      <div class="set-group__body bt-metrics bt-metrics--4">
        <div v-for="m in metrics" :key="m.label" class="bt-metric">
          <span class="bt-metric__label">
            {{ m.label }}
            <i v-if="m.hint" class="pi pi-info-circle" tabindex="0" :aria-label="m.hint" v-tooltip.bottom="{ value: m.hint, showDelay: 500 }" />
          </span>
          <span class="bt-metric__value"><span :class="m.class">{{ m.value }}</span></span>
          <span v-if="m.sub" class="text-xs text-muted-color">{{ m.sub }}</span>
        </div>
      </div>
    </section>

    <!-- ============ 明細 ============ -->
    <div class="card-table">
      <DataTable :value="rows" :loading="isLoading" dataKey="id" tableStyle="min-width: 56rem" rowHover paginator :rows="15">
        <Column field="date" sortable :header="$t('date')">
          <template #body="{ data }">{{ dayOf(data.date) }}</template>
        </Column>
        <Column field="side" :header="$t('operation')">
          <template #body="{ data }">
            <Tag :value="$t(data.side === 'buy' ? 'fxBuy' : 'fxSell', { currency: data.currency })" :severity="data.side === 'buy' ? 'info' : 'secondary'" />
          </template>
        </Column>
        <Column field="foreign_amount" sortable :header="$t('fxForeignAmount')">
          <template #body="{ data }">
            <span class="font-medium">{{ fmt(data.foreign_amount) }}</span>
            <span class="ml-1 text-[10px] font-semibold text-muted-color">{{ data.currency }}</span>
          </template>
        </Column>
        <Column field="twd_amount" sortable :header="$t('fxTwdAmount')">
          <template #body="{ data }">
            <span class="font-medium">{{ fmt(data.twd_amount, 0) }}</span>
            <span class="ml-1 text-[10px] font-semibold text-muted-color">TWD</span>
          </template>
        </Column>
        <Column :header="$t('fxRate')">
          <template #body="{ data }">
            <span class="inline-flex items-center gap-1.5">
              <span class="font-medium">{{ fmt(exchangeCost(data).rate, 4) }}</span>
              <i v-if="exchangeCost(data).market" class="pi pi-info-circle text-xs text-muted-color" tabindex="0"
                :aria-label="marketTip(data)" v-tooltip.top="{ value: marketTip(data), showDelay: 500 }"></i>
            </span>
          </template>
        </Column>
        <Column>
          <template #header>
            <span class="inline-flex items-center gap-1">
              {{ $t('fxCost') }}
              <i class="pi pi-info-circle text-xs text-muted-color" tabindex="0" :aria-label="$t('fxCostHint')" v-tooltip.top="{ value: $t('fxCostHint'), showDelay: 500 }"></i>
            </span>
          </template>
          <template #body="{ data }">
            <template v-if="exchangeCost(data).costTwd != null">
              <span class="font-medium">{{ fmt(exchangeCost(data).costTwd, 0) }}</span> <span class="text-[10px] font-semibold text-muted-color">TWD</span>
            </template>
            <span v-else class="text-muted-color">--</span>
          </template>
        </Column>
        <Column field="note" :header="$t('fxNote')">
          <template #body="{ data }"><span class="text-sm text-muted-color">{{ data.note }}</span></template>
        </Column>
        <Column headerStyle="width: 6rem">
          <template #body="{ data }">
            <Button icon="pi pi-pencil" text rounded severity="secondary" size="small" :disabled="isReadOnly"
              :aria-label="$t('edit')" v-tooltip.top="{ value: $t('edit'), showDelay: 500 }" @click="openForm(data)" />
            <Button icon="pi pi-trash" text rounded severity="secondary" size="small" :disabled="isReadOnly"
              :aria-label="$t('delete')" v-tooltip.top="{ value: $t('delete'), showDelay: 500 }" @click="confirmRemove(data)" />
          </template>
        </Column>

        <template #empty>
          <NoData />
        </template>
      </DataTable>
    </div>

    <!-- ============ 新增 / 編輯 ============ -->
    <Dialog v-model:visible="formVisible" :header="$t(form.id ? 'fxEdit' : 'fxAdd')" modal :style="{ width: '30rem' }" :breakpoints="{ '575px': '95vw' }">
      <div class="mb-4">
        <SelectButton v-model="form.side" :options="sideOptions" optionLabel="label" optionValue="value" :allowEmpty="false" fluid />
      </div>

      <!-- 外幣金額、匯率、台幣金額填任兩個，第三個自動算：銀行 app 通常只給匯率與外幣金額 -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label for="fx-date" class="block text-sm font-medium text-muted-color mb-2">{{ $t('date') }}</label>
          <DatePicker v-model="form.date" inputId="fx-date" :maxDate="new Date()" dateFormat="yy-mm-dd" showIcon iconDisplay="input" fluid />
        </div>
        <div>
          <label for="fx-currency" class="block text-sm font-medium text-muted-color mb-2">{{ $t('fxCurrency') }}</label>
          <Select v-model="form.currency" inputId="fx-currency" :options="FOREIGN_CURRENCIES" fluid />
        </div>
        <div>
          <label for="fx-foreign" class="block text-sm font-medium text-muted-color mb-2">
            {{ $t(form.side === 'buy' ? 'fxReceived' : 'fxPaid') }} {{ form.currency }} <span class="text-red-500">*</span><span v-if="autoField === 'foreign_amount'" class="ml-1 text-xs font-normal">（{{ $t('fxAuto') }}）</span>
          </label>
          <InputNumber :modelValue="form.foreign_amount" inputId="fx-foreign" :min="0" :maxFractionDigits="4" :suffix="` ${form.currency}`" fluid
            @input="onAmountInput('foreign_amount', $event.value)" @update:modelValue="onAmountInput('foreign_amount', $event)" />
        </div>
        <div>
          <label for="fx-rate" class="block text-sm font-medium text-muted-color mb-2">{{ $t('fxRate') }} <span class="text-red-500">*</span><span v-if="autoField === 'rate'" class="ml-1 text-xs font-normal">（{{ $t('fxAuto') }}）</span></label>
          <InputNumber :modelValue="form.rate" inputId="fx-rate" :min="0" :maxFractionDigits="6" fluid
            @input="onAmountInput('rate', $event.value)" @update:modelValue="onAmountInput('rate', $event)" />
        </div>
        <div>
          <label for="fx-twd" class="block text-sm font-medium text-muted-color mb-2">
            {{ $t(form.side === 'buy' ? 'fxPaid' : 'fxReceived') }} TWD <span class="text-red-500">*</span><span v-if="autoField === 'twd_amount'" class="ml-1 text-xs font-normal">（{{ $t('fxAuto') }}）</span>
          </label>
          <InputNumber :modelValue="form.twd_amount" inputId="fx-twd" :min="0" :maxFractionDigits="2" suffix=" TWD" fluid
            @input="onAmountInput('twd_amount', $event.value)" @update:modelValue="onAmountInput('twd_amount', $event)" />
        </div>
        <div>
          <label for="fx-fee" class="block text-sm font-medium text-muted-color mb-2">{{ $t('fee') }}</label>
          <InputNumber v-model="form.fee" inputId="fx-fee" :min="0" :maxFractionDigits="4" suffix=" TWD" fluid />
        </div>
      </div>

      <div class="mb-4">
        <label for="fx-note" class="block text-sm font-medium text-muted-color mb-2">{{ $t('fxNote') }}</label>
        <InputText v-model="form.note" id="fx-note" class="w-full" maxlength="255" :placeholder="$t('fxNotePlaceholder')" />
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-surface">
        <Button type="button" :label="$t('cancel')" severity="secondary" @click="formVisible = false" />
        <Button type="button" :label="$t('save')" :loading="saving" :disabled="!canSave" @click="save" />
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import NoData from '@/components/NoData.vue'
import api from '@/utils/api'
import * as toast from '@/composables/toast'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { SUPPORTED_CURRENCIES } from '@/utils/currency'
import { AMOUNT_FIELDS, deriveAmounts, exchangeCost, fxPositions } from '@/utils/fxExchange'

const { t } = useI18n()
const confirm = useConfirm()
const auth = useAuthStore()
const settings = useSettingsStore()

const FOREIGN_CURRENCIES = SUPPORTED_CURRENCIES.filter((c) => c !== 'TWD')
const isReadOnly = computed(() => !auth.user || auth.user.uid === 'demo-user')

const rows = ref([])
const isLoading = ref(false)
const load = async () => {
  isLoading.value = true
  try {
    rows.value = await api.get('/api/fx-exchanges')
  } catch (error) {
    console.error('Error fetching fx exchanges:', error)
  } finally {
    isLoading.value = false
  }
}
load()

// ---------- 摘要 ----------
const currentRateOf = (code) => {
  const twd = settings.rateOf('TWD')
  const foreign = settings.rateOf(code)
  return twd > 0 && foreign > 0 ? twd / foreign : null
}
const positions = computed(() =>
  fxPositions(rows.value, Object.fromEntries(FOREIGN_CURRENCIES.map((c) => [c, currentRateOf(c)])))
)
const currencies = computed(() => Object.keys(positions.value))
const selectedCurrency = ref('USD')
watch(currencies, (list) => {
  if (list.length && !list.includes(selectedCurrency.value)) selectedCurrency.value = list[0]
}, { immediate: true })
const summary = computed(() => positions.value[selectedCurrency.value])

const metrics = computed(() => {
  const p = summary.value
  const code = selectedCurrency.value
  const current = currentRateOf(code)
  const pnl = (p.unrealized ?? 0) + p.realized
  return [
    { label: t('fxHolding'), value: `${fmt(p.units)} ${code}`, hint: t('fxHoldingHint') },
    { label: t('fxAvgRate'), value: fmt(p.avgRate, 4), sub: current ? t('fxTodayRate', { rate: fmt(current, 4) }) : null },
    {
      label: t('fxTotalCost'),
      value: `${fmt(p.spreadCost, 0)} TWD`,
      sub: p.exchangedTwd ? t('fxTotalCostSub', { pct: fmt((p.spreadCost / p.exchangedTwd) * 100, 2) }) : null,
      hint: t('fxCostHint'),
    },
    {
      label: t('fxPnl'),
      value: `${fmtSigned(pnl, 0)} TWD`,
      class: pnl >= 0 ? 'text-up' : 'text-down',
      sub: t('fxPnlSub', { unrealized: fmtSigned(p.unrealized ?? 0, 0), realized: fmtSigned(p.realized, 0) }),
      hint: t('fxPnlHint'),
    },
  ]
})

// ---------- 表單 ----------
const sideOptions = computed(() => [
  { label: t('fxBuy', { currency: form.value.currency }), value: 'buy' },
  { label: t('fxSell', { currency: form.value.currency }), value: 'sell' },
])
const emptyForm = () => ({ id: null, side: 'buy', date: new Date(), currency: 'USD', foreign_amount: null, rate: null, twd_amount: null, fee: 0, note: '' })
const form = ref(emptyForm())
const formVisible = ref(false)
const saving = ref(false)

// 改外幣金額或匯率 -> 重算台幣；改台幣 -> 重算匯率。台幣取到小數 2 位（DB 精度內，銀行實際多為整數）
// 外幣金額、匯率、台幣三格：最近手動改過的兩格當依據，第三格自動算。
// 逐字的 input 事件之外也接 update:modelValue（blur 時觸發），中文輸入法等不送逐字事件的情況也算得到
const edited = ref([])
const autoField = computed(() => (edited.value.length === 2 ? AMOUNT_FIELDS.find((f) => !edited.value.includes(f)) : null))
const onAmountInput = (field, value) => {
  if (form.value[field] === value) return // blur 時沒改值不算手動編輯，避免把自動算的那格當成依據
  form.value[field] = value
  edited.value = [field, ...edited.value.filter((f) => f !== field)].slice(0, 2)
  Object.assign(form.value, deriveAmounts(form.value, edited.value))
}
const canSave = computed(() => !!form.value.date && form.value.foreign_amount > 0 && form.value.twd_amount > 0 && (form.value.fee ?? 0) >= 0)

const openForm = (row) => {
  form.value = row
    ? { ...row, date: new Date(`${dayOf(row.date)}T00:00:00`), foreign_amount: Number(row.foreign_amount), twd_amount: Number(row.twd_amount), rate: Number((row.twd_amount / row.foreign_amount).toFixed(6)), fee: Number(row.fee), note: row.note || '' }
    : emptyForm()
  edited.value = row ? ['foreign_amount', 'rate'] : []
  formVisible.value = true
}

const save = async () => {
  const { id, rate, ...data } = form.value
  // 用本地日期送出，避免 toISOString 轉 UTC 後在台灣早上變成前一天
  const payload = { ...data, date: data.date.toLocaleDateString('sv-SE'), fee: data.fee ?? 0 }
  saving.value = true
  try {
    if (id) await api.put(`/api/fx-exchanges/${id}`, payload)
    else await api.post('/api/fx-exchanges', payload)
    formVisible.value = false
    toast.success(t('fxSaved'))
    await load()
  } catch (error) {
    toast.error(t('saveFailed'), error.message)
  } finally {
    saving.value = false
  }
}

const confirmRemove = (row) => {
  confirm.require({
    message: t('deleteConfirm'),
    header: t('warning'),
    icon: 'pi pi-info-circle',
    rejectProps: { label: t('cancel'), severity: 'secondary', outlined: true },
    acceptProps: { label: t('delete'), severity: 'danger' },
    accept: async () => {
      try {
        await api.delete(`/api/fx-exchanges/${row.id}`)
        rows.value = rows.value.filter((r) => r.id !== row.id)
        toast.success(t('deletedSuccess'))
      } catch {
        toast.error(t('deleteFailed'))
      }
    },
  })
}

// ---------- 格式 ----------
const dayOf = (date) => String(date).slice(0, 10)
const fmt = (v, digits = 2) =>
  v == null || Number.isNaN(Number(v)) ? '--' : Number(v).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
// 成交匯率旁的提示：當天市場匯率，以及比市場好／差幾 %（spreadPct > 0 代表被多收）
const marketTip = (row) => {
  const { market, spreadPct } = exchangeCost(row)
  return t(spreadPct > 0 ? 'fxMarketTipWorse' : 'fxMarketTipBetter', { rate: fmt(market, 4), pct: fmt(Math.abs(spreadPct) * 100, 2) })
}
const fmtSigned =(v, digits = 2) => (v == null ? '--' : `${v > 0 ? '+' : ''}${fmt(v, digits)}`)
</script>
