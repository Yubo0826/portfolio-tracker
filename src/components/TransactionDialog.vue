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

    <div class="mb-4">
      <label for="accountId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('cashFlow.account') }}
      </label>
      <Select
        id="accountId"
        v-model="form.accountId"
        :options="activeAccounts"
        optionLabel="name"
        optionValue="id"
        :placeholder="$t('cashFlow.selectAccount')"
        class="w-full"
        showClear
      />
    </div>

    <div class="mb-4">
      <label for="symbol" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('symbol') }} <span class="text-red-500">*</span>
      </label>
      <SymbolAutoComplete
        id="symbol"
        v-model="form.symbol"
        @update="onSymbolSelected"
        :disabled="!!editingId"
      />
    </div>

    <div class="mb-4">
      <label for="date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('transactionDate') }} <span class="text-red-500">*</span>
      </label>
      <DatePicker
        id="date"
        v-model="form.date"
        @date-select="onDateSelect"
        :maxDate="new Date()"
        showIcon
        fluid
        iconDisplay="input"
        class="w-full"
        :placeholder="$t('pleaseSelectDate')"
      />
    </div>

    <div class="mb-4">
      <label for="shares" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('share') }} <span class="text-red-500">*</span>
      </label>
      <InputNumber 
        id="shares"
        v-model="form.shares" 
        class="w-full" 
        showButtons 
        autocomplete="off" 
      />
    </div>

    <div class="mb-4">
      <label for="price" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('price') }} <span class="text-red-500">*</span>
      </label>
      <InputText 
        id="price"
        v-model="form.price" 
        class="w-full" 
        autocomplete="off" 
        :placeholder="$t('pleaseInputPrice')" 
      />
    </div>

    <div class="mb-4">
      <label for="fee" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('fee') }}
      </label>
      <InputNumber 
        id="fee"
        v-model="form.fee" 
        class="w-full" 
        showButtons 
        autocomplete="off" 
      />
    </div>

    <div class="mb-4">
      <label for="operation" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('type') }}
      </label>
      <SelectButton 
        id="operation"
        v-model="form.operation" 
        :options="transactionType" 
        optionLabel="name" 
        optionValue="code" 
        class="w-full"
      />
    </div>

    <div class="border-t border-gray-200 dark:border-gray-700 my-4"></div>

    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
      <div class="flex justify-between items-center">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('total') }}</label>
        <span class="text-lg font-bold text-gray-900 dark:text-gray-100">${{ totalPrice }} USD</span>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
import { useCashFlowStore } from '@/stores/cashflow';
import * as toast from '@/composables/toast';
import { useI18n } from 'vue-i18n';

import { useHoldingsStore } from '@/stores/holdings'
const holdingsStore = useHoldingsStore()

import { showLoading, hideLoading } from "@/composables/loading.js"

const { t } = useI18n();

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  editingId: { type: [Number, String, null], default: null },
  formData: { type: Object, default: null },
});
const emit = defineEmits(['update:modelValue', 'saved']);

const store = useTransactionsStore();
const portfolioStore = usePortfolioStore();
const cashFlowStore = useCashFlowStore();
const { activeAccounts } = cashFlowStore;

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
  accountId: null,
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
    console.log('儲存後的交易資料:', result);
    emit('saved', result);
    console.log('觸發 saved 事件');
    if (saveAnother) {
      form.value = emptyForm();
      console.log('重設後的 form 資料:', form.value);
    }
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
