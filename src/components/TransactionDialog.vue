<template>
  <Dialog v-model:visible="localVisible" @hide="onHide" modal :style="{ width: '50rem' }" :breakpoints="{ '640px': '95vw' }">
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

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
      <!-- Symbol - full width -->
      <div class="mb-4 sm:col-span-2">
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

      <!-- Date -->
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

      <!-- Shares -->
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

      <!-- Price -->
      <div class="mb-4">
        <label for="price" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ $t('pleaseInputPrice') }} <span class="text-red-500">*</span>
        </label>
        <div class="flex items-stretch rounded-lg">
          <InputNumber
            id="price"
            v-model="form.price"
            class="w-full"
            autocomplete="off"
            showButtons
            mode="currency"
            :currency="form.currency || 'USD'"
            :currencyDisplay="'code'"
            :minFractionDigits="0"
            :maxFractionDigits="3"
            :placeholder="form.currency || 'USD'"
          />
          <!-- <span class="inline-flex min-w-16 items-center justify-center rounded-r-lg border border-l-0 border-surface-300 bg-surface-100 px-3 text-sm font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
            {{ form.currency || 'USD' }}
          </span> -->
        </div>
      </div>

      <!-- Fee -->
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
          mode="currency"
          :currency="form.currency || 'USD'"
          :currencyDisplay="'code'"
          :placeholder="form.currency || 'USD'" 
        />
      </div>

      <!-- Operation -->
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

      <!-- Total - full width -->
      <div class="sm:col-span-2 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-center">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('total') }}</label>
          <div>
            <span class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ totalPrice.toLocaleString() }}</span>
            <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{{ form.currency || 'USD' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-4 ">
      <Button type="button" :label="$t('cancel')" severity="secondary" @click="close" />

      
      <Button v-if="hasError" type="button" :label="$t('save')" v-tooltip.bottom="$t('completeInfo')" disabled />
      <Button v-else type="button" :label="$t('save')" @click="onSave(false)" />

      <span v-if="!editingId">
        <Button v-if="hasError" type="button" :label="$t('saveAndAddAnother')" v-tooltip.bottom="$t('completeInfo')" disabled />
        <Button v-else type="button" :label="$t('saveAndAddAnother')" @click="onSave(true)" />
      </span>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import SymbolAutoComplete from '@/components/SymbolAutoComplete.vue';
import { useTransactionsStore } from '@/stores/transactions';
import { usePortfolioStore } from '@/stores/portfolio';
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

const transactionType = computed(() => [
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
  currency: 'USD',
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

const applyQuoteData = async (symbol, date) => {
  const quoteData = await store.searchPrice(symbol, date);
  if (!quoteData) {
    form.value.currency = 'USD';
    return;
  }

  form.value.price = quoteData.price ?? null;
  form.value.currency = quoteData.currency || 'USD';
};

const onSymbolSelected = ({ symbol, name, assetType }) => {
  form.value.name = name;
  form.value.assetType = assetType;
  const date = form.value.date?.toISOString().split('T')[0];
  if (symbol && date) {
    applyQuoteData(symbol, date);
  }
};

const onDateSelect = (d) => {
  form.value.date = d;
  if (form.value.symbol) {
    const date = d.toISOString().split('T')[0];
    applyQuoteData(form.value.symbol, date);
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
    currency: item.currency || 'USD',
    fee: item.fee,
    operation: item.transactionType,
    accountId: item.accountId || null,
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
    if (!newForm) return;
    form.value = emptyForm();
    form.value = {
      date: new Date(newForm.date),
      symbol: newForm.symbol,
      name: newForm.name,
      assetType: newForm.assetType,
      shares: newForm.shares,
      price: newForm.price,
      currency: newForm.currency || 'USD',
      fee: newForm.fee,
      operation: newForm.transactionType,
      accountId: newForm.accountId || null,
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
