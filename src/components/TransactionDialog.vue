<template>
  <Dialog v-model:visible="localVisible" @hide="onHide" modal :style="{ width: '30rem' }">
    <template #header>
      <div class="inline-flex items-center justify-center gap-2">
        <!-- 標題 -->
        <span v-if="editingId" class="font-bold whitespace-nowrap">{{ $t('editTransaction') }}</span>
        <!-- 選擇投資組合 -->
        <span class="font-bold" v-else>
          {{ $t('addTransactionTo') }}
          <Select
            v-model="selectedPortfolioId"
            size="small"
            ref="PortfolioSelect"
            :options="portfolioStore.portfolios"
            optionLabel="name"
            optionValue="id"
            checkmark
            :highlightOnSelect="false"
            class="m-2 font-normal"
            :pt="{
              root: {
                style: { border: '1px solid transparent', boxShadow: 'none' },
                class: 'custom-select-root'
              }
            }"
          >
            <template #dropdownicon>
              <i class="pi pi-pencil" style="font-size: .75rem"></i>
            </template>
          </Select>
        </span>
      </div>
    </template>

    <div class="flex items-center gap-4 mb-4">
      <label class="w-24">
        {{ $t('symbol') }} <span style="color:#f27362">*</span>
      </label>
      <SymbolAutoComplete
        v-model="form.symbol"
        @update="onSymbolSelected"
        :disabled="!!editingId"
      />
    </div>

    <div class="flex items-center gap-4 mb-4">
      <label class="w-24">
        {{ $t('transactionDate') }} <span style="color:#f27362">*</span>
      </label>
      <DatePicker
        v-model="form.date"
        @date-select="onDateSelect"
        :maxDate="new Date()"
        showIcon
        fluid
        iconDisplay="input"
        class="flex-auto"
        :placeholder="$t('pleaseSelectDate')"
      />
    </div>

    <div class="flex items-center gap-4 mb-4">
      <label class="w-24">
        {{ $t('share') }} <span style="color:#f27362">*</span>
      </label>
      <InputNumber v-model="form.shares" class="flex-auto" showButtons autocomplete="off" />
    </div>

    <div class="flex items-center gap-4 mb-4">
      <label class="w-24">
        {{ $t('price') }} <span style="color:#f27362">*</span>
      </label>
      <InputText v-model="form.price" class="flex-auto" autocomplete="off" :placeholder="$t('pleaseInputPrice')" />
    </div>

    <div class="flex items-center gap-4 mb-8">
      <label class="w-24">{{ $t('fee') }}</label>
      <InputNumber v-model="form.fee" class="flex-auto" showButtons autocomplete="off" />
    </div>

    <div class="flex items-center gap-4 mb-8">
      <label class="w-24">{{ $t('type') }}</label>
      <SelectButton v-model="form.operation" :options="transactionType" optionLabel="name" optionValue="code" />
    </div>

    <div style="border: .5px solid #eeee;"></div>

    <div class="flex items-center gap-4 my-8">
      <label class="w-24">{{ $t('total') }}</label>
      ${{ totalPrice }} USD
    </div>

    <div class="flex justify-end gap-2">
      <Button type="button" :label="$t('cancel')" severity="secondary" @click="close" />

      <span v-if="!editingId">
        <Button v-if="hasError" type="button" :label="$t('saveAndAddAnother')" v-tooltip.bottom="$t('completeInfo')" disabled />
        <Button v-else type="button" :label="$t('saveAndAddAnother')" @click="onSave(true)" />
      </span>

      <Button v-if="hasError" type="button" :label="$t('save')" v-tooltip.bottom="$t('completeInfo')" disabled />
      <Button v-else type="button" :label="$t('save')" @click="onSave(false)" />
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import SymbolAutoComplete from '@/components/SymbolAutoComplete.vue';
import { useTransactionsStore } from '@/stores/transactions';
import { usePortfolioStore } from '@/stores/portfolio';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';

import { useHoldingsStore } from '@/stores/holdings'
const holdingsStore = useHoldingsStore()

import { showLoading, hideLoading } from "@/composables/loading.js"

const toast = useToast();
const { t } = useI18n();

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  editingId: { type: [Number, String, null], default: null },
  formData: { type: Object, default: null },
});
const emit = defineEmits(['update:modelValue', 'saved']);

const store = useTransactionsStore();
const portfolioStore = usePortfolioStore();

const transactionType = ref([
  { name: t('buy'), code: 'buy' },
  { name: t('sell'), code: 'sell' },
]);

const selectedPortfolioId = ref(null);

watch(
  () => portfolioStore.currentPortfolio,
  (newVal) => {
    if (newVal?.id !== selectedPortfolioId.value) {
      selectedPortfolioId.value = newVal?.id || null;
    }
  },
  { immediate: true }
);

const localVisible = ref(false);
watch(
  () => props.modelValue,
  (v) => (localVisible.value = v),
  { immediate: true }
);

const emptyForm = () => ({
  date: new Date(),
  symbol: null,
  name: '',
  assetType: '',
  shares: null,
  price: null,
  fee: 0,
  operation: 'buy',
});

const form = ref(emptyForm());

console.log('初始 form 資料:', form.value);

const hasError = computed(() => {
  const e = {
    date: !form.value.date,
    symbol: !form.value.symbol,
    shares: !form.value.shares || Number(form.value.shares) <= 0,
    price: !form.value.price || Number(form.value.price) <= 0,
    operation: !form.value.operation,
  };
  return Object.values(e).some(Boolean);
});

const totalPrice = computed(() => {
  const s = Number(form.value.shares) || 0;
  const p = Number(form.value.price) || 0;
  return Number((s * p).toFixed(2)) || 0;
});

const onSymbolSelected = ({ symbol, name, assetType }) => {
  form.value.name = name;
  form.value.assetType = assetType;
  const date = form.value.date?.toISOString().split('T')[0];
  if (symbol && date) {
    store.searchPrice(symbol, date).then((price) => {
      form.value.price = price ?? null;
    });
  }
};

const onDateSelect = (d) => {
  form.value.date = d;
  if (form.value.symbol) {
    const date = d.toISOString().split('T')[0];
    store.searchPrice(form.value.symbol, date).then((price) => {
      form.value.price = price ?? null;
    });
  }
};

const loadEditing = () => {
  const item = store.getTransactionById(props.editingId);
  if (!item) return;
  form.value = {
    date: new Date(item.date),
    symbol: item.symbol,
    name: item.name,
    assetType: item.assetType,
    shares: item.shares,
    price: item.price,
    fee: item.fee,
    operation: item.transactionType,
  };
};

watch(
  () => props.editingId,
  (id) => {
    if (id) loadEditing();
    else form.value = emptyForm();
  },
  { immediate: true }
);

watch(
  () => props.formData,
  (newForm) => {
    form.value = emptyForm();
    form.value = {
      date: new Date(newForm.date),
      symbol: newForm.symbol,
      name: newForm.name,
      assetType: newForm.assetType,
      shares: newForm.shares,
      price: newForm.price,
      fee: newForm.fee,
      operation: newForm.transactionType,
    }
  }
);

const onSave = async (saveAnother = false) => {
  if (hasError.value) {
    // 請填寫所有必填欄位。
    toast.error(t('fillAllRequiredFields'), '');
    return;
  }

  if (form.value.operation === 'sell') {
    const ok = store.canSell(form.value.symbol, form.value.shares);
    if (!ok) {
      // 無法賣出超過持有的股數。
      toast.error(t('notEnoughSharesToSell'), '');
      return;
    }
  }

  if (Number(form.value.fee) < 0) {
    // 手續費不能為負數。
    toast.error(t('feeCannotBeNegative'), '');
    return;
  }

  try {
    console.log('現在的 portfolio id:', selectedPortfolioId.value);
    showLoading(t('updatingHoldings'));
    const result = await store.saveTransaction({
      id: props.editingId,
      form: form.value,
      portfolioId: selectedPortfolioId.value,
    });
    // 如果加入的是買入交易，則更新持有資料的價格。
    if (form.value.operation === 'buy') {
      await holdingsStore.refreshPrices();
    }
    hideLoading();
    toast.success(t('transactionSavedSuccessfully'), '');
    emit('saved', result);
    if (saveAnother) form.value = emptyForm();
    else close();
  } catch (err) {
    toast.error(t('errorSavingTransaction'), '');
  }
};

const onHide = () => {
  emit('update:modelValue', false);
  form.value = emptyForm();
};

const close = () => {
  emit('update:modelValue', false);
};
</script>

<style scoped>
:deep(.p-autocomplete) {
  flex: 1 1 auto;
}
:deep(.p-autocomplete-input) {
  flex: 1 1 auto;
}
</style>
