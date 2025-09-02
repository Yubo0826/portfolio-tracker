<template>
  <Dialog v-model:visible="localVisible" @hide="onHide" modal :style="{ width: '30rem' }">
    <template #header>
      <div class="inline-flex items-center justify-center gap-2">
        <span v-if="editingId" class="font-bold whitespace-nowrap">更新交易明細</span>
        <span class="font-bold" v-else>
          新增交易至
          <!-- 選擇投資組合 -->
          <Select 
            v-model="selectedPortfolio"
            size="small" ref="PortfolioSelect" 
            :options="portfolioStore.portfolios" optionLabel="name" checkmark 
            :highlightOnSelect="false" class="m-2 font-normal"
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
        代號 <span style="color:#f27362">*</span>
      </label>
      <SymbolAutoComplete
        v-model="form.symbol"
        @update="onSymbolSelected"
        :disabled="!!editingId"
      />
    </div>

    <div class="flex items-center gap-4 mb-4">
      <label class="w-24">
        購買日期 <span style="color:#f27362">*</span>
      </label>
      <DatePicker
        v-model="form.date"
        @date-select="onDateSelect"
        :maxDate="new Date()"
        showIcon
        fluid
        iconDisplay="input"
        class="flex-auto"
        placeholder="交易的日期"
      />
    </div>

    <div class="flex items-center gap-4 mb-4">
      <label class="w-24">
        股數 <span style="color:#f27362">*</span>
      </label>
      <InputNumber v-model="form.shares" class="flex-auto" showButtons autocomplete="off" />
    </div>

    <!-- <div class="flex items-center gap-2 mb-4 p-2 text-xs">
      <label class="font-semibold w-24"></label>
      <Button @click="addShare(100)" label="+100" severity="secondary" rounded />
      <Button @click="addShare(500)" label="+500" severity="secondary" rounded />
      <Button @click="addShare(1000)" label="+1000" severity="secondary" rounded />
    </div> -->

    <div class="flex items-center gap-4 mb-4">
      <label class="w-24">
        購買價格 <span style="color:#f27362">*</span>
      </label>
      <InputText v-model="form.price" class="flex-auto" autocomplete="off" placeholder="請輸入交易當時的價格" />
    </div>

    <div class="flex items-center gap-4 mb-8">
      <label class="w-24">手續費</label>
      <InputNumber v-model="form.fee" class="flex-auto" showButtons autocomplete="off" />
    </div>

    <div class="flex items-center gap-4 mb-8">
      <label class="w-24">類型</label>
      <SelectButton v-model="form.operation" :options="transactionType" optionLabel="name" optionValue="code" />
    </div>

    <div style="border: .5px solid #eeee;"></div>

    <div class="flex items-center gap-4 my-8">
      <label class="w-24">總和</label>
      ${{ totalPrice }} USD
    </div>

    <div class="flex justify-end gap-2">
      <Button type="button" label="取消" severity="secondary" @click="close" />
      
      <!-- 儲存並新增額外項目 -->
      <span v-if="!editingId">
        <Button v-if="hasError" type="button" label="儲存並新增額外" v-tooltip.bottom="'請填入完整信息'" disabled />
        <Button v-else type="button" label="儲存並新增額外" @click="onSave(true)" />
      </span>

      <!-- 儲存後關閉視窗 -->
      <Button v-if="hasError" type="button" label="儲存" v-tooltip.bottom="'請填入完整信息'" disabled />
      <Button v-else type="button" label="儲存" @click="onSave(false)" />

    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, toRefs } from 'vue';
import SymbolAutoComplete from '@/components/SymbolAutoComplete.vue';
import { useTransactionsStore } from '@/stores/transactions';
import { usePortfolioStore } from '@/stores/portfolio';
import { useToast } from 'primevue/usetoast';
const toast = useToast();

const props = defineProps({
    modelValue: { type: Boolean, default: false }, // 控制顯示
    editingId: { type: [Number, String, null], default: null }, // 若有值＝編輯
});

const emit = defineEmits(['update:modelValue', 'saved']); // saved(result)

const store = useTransactionsStore();
const portfolioStore = usePortfolioStore();

const transactionType = ref([
  { name: '買入', code: 'buy' },
  { name: '賣出', code: 'sell' },
]);

const selectedPortfolio = ref(null);

watch(() => portfolioStore.currentPortfolio, (newVal) => {
  if (newVal?.id !== selectedPortfolio.value?.id) {
    selectedPortfolio.value = newVal
  }
})

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

const dialogHeader = computed(() => (props.editingId ? 'Update Transaction' : 'New Transaction'));

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

const addShare = (amount) => {
  if (!form.value.shares) form.value.shares = 0;
  form.value.shares += amount;
};

const onSymbolSelected = ({ symbol, name, assetType }) => {
  console.log('Selected symbol:', symbol, name, assetType);
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

const onSave = async (saveAnother = false) => {
  if (hasError.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Please fill in all required fields.', life: 3000 });
    return;
  }

  // 賣出數量檢查
  if (form.value.operation === 'sell') {
    const ok = store.canSell(form.value.symbol, form.value.shares);
    if (!ok) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Not enough shares to sell.', life: 3000 });
      return;
    }
  }

  if (Number(form.value.fee) < 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fee cannot be negative.', life: 3000 });
    return;
  }

  try {
    const result = await store.saveTransaction({ id: props.editingId, form: form.value, portfolioId: selectedPortfolio.value });
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: props.editingId ? 'Transaction updated.' : 'Transaction created.',
      life: 3000,
    });
    emit('saved', result);
    console.log('Transaction saved:', result);
    console.log('saveAnother:', saveAnother);
    if (saveAnother) {
      form.value = emptyForm();
    } else {
      close();
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Error saving transaction', life: 3000 });
  }
};

const onHide = () => {
  // Dialog 關閉時重置表單（由外部控制 visible 時不會觸發 close）
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
