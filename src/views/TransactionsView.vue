<template>
  <ConfirmDialog></ConfirmDialog>
  <div>
    <Card>
      <template #content>
        <div class="flex flex-wrap items-center gap-2 mb-8">
          <!-- showClear -->
          <MultiSelect
            v-model="selectedSymbols"
            :options="symbolOptions"
            :placeholder="$t('symbol')"
            display="chip"
            filter
            class="w-60"
          />
          <MultiSelect
            v-model="selectedTypes"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            :placeholder="$t('operation')"
            class="w-30"
          />
          <DateRangeFilter v-model="dateRange" />
          <Button
            v-if="hasActiveFilters"
            icon="pi pi-filter-slash"
            severity="secondary"
            size="small"
            @click="clearFilters"
          />
          <div class="flex items-center gap-2 ml-auto">
            <Button
              :label="$t('delete')"
              @click="deleteConfirm"
              :disabled="selectedAssets.length === 0"
              icon="pi pi-trash"
              severity="secondary"
              size="small"
            />
            <Button
              :label="$t('export')"
              @click="exportCsv"
              icon="pi pi-download"
              severity="secondary"
              size="small"
            />
            <TransactionDialog
              v-model="dialogVisible"
              :editingId="editingId"
              @saved="onSaved"
            />
          </div>
        </div>

        <DataTable
          v-model:selection="selectedAssets"
          :value="filteredTransactions"
          sortField="date"
          :sortOrder="-1"
          :loading="store.isLoading"
          dataKey="id"
          tableStyle="min-width: 50rem"
          paginator :rows="15"
          rowHover 
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem" />
          <Column field="symbol" sortable :header="$t('symbol')">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold tracking-wide">{{ data.symbol }}</span>
                <span class="text-sm text-[var(--p-text-color)]">{{ data.name }}</span>
              </div>
            </template>
          </Column>
          <Column field="shares" sortable :header="$t('shares')" />
          <Column field="price" sortable :header="$t('price')">
            <template #body="{ data }">
              <div class="inline-flex items-end font-medium">
                <span>{{ splitDisplayAmount(data.price, 'price').main }}</span>
                <span>{{ splitDisplayAmount(data.price, 'price').fraction }}</span>
                <span class="ml-1 text-[10px] pb-0.5 font-semibold text-[var(--p-text-muted-color)]">{{ splitDisplayAmount(data.price, 'price').code }}</span>
              </div>
            </template>
          </Column>
          <Column field="fee" sortable :header="$t('fee')">
            <template #body="{ data }">
              <div class="inline-flex items-end font-medium">
                <span>{{ splitDisplayAmount(data.fee).main }}</span>
                <span>{{ splitDisplayAmount(data.fee).fraction }}</span>
                <span class="ml-1 text-[10px] pb-0.5 font-semibold text-[var(--p-text-muted-color)]">{{ splitDisplayAmount(data.fee).code }}</span>
              </div>
            </template>
          </Column>
          <Column field="" sortable :header="$t('operation')">
            <template #body="slotProps">
              <div>
                <span
                  v-if="slotProps.data.transactionType === 'buy'"
                  class="bg-[#10b981] rounded-full px-4 py-1.5 text-white font-bold text-xs whitespace-nowrap"
                >
                  {{ $t('buy') }}
                </span>
                <span
                  v-else
                  class="bg-red-400 rounded-full px-4 py-1.5 text-white font-bold text-xs whitespace-nowrap"
                >
                  {{ $t('sell') }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="date" sortable :header="$t('date')" />
          <Column field="" :header="$t('action')">
            <template #body="slotProps">
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-text"
                severity="info"
                @click="openEdit(slotProps.data.id)"
              />
            </template>
          </Column>
    
          <template #empty>
            <NoData />
          </template>
        </DataTable>
      </template>
    </Card>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import TransactionDialog from '@/components/TransactionDialog.vue';
import DateRangeFilter from '@/components/DateRangeFilter.vue';
import { useTransactionsStore } from '@/stores/transactions';
import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';
import { useCurrency } from '@/composables/useCurrency';
const portfolioStore = usePortfolioStore();

import NoData from '@/components/NoData.vue';

const store = useTransactionsStore();
const auth = useAuthStore();
const toast = useToast();
const { formatAmountWithCode, formatPriceWithCode } = useCurrency();

const splitDisplayAmount = (value, mode = 'amount') => {
  const formatted = mode === 'price' ? formatPriceWithCode(value) : formatAmountWithCode(value)
  if (formatted === '--') {
    return { main: '--', fraction: '', code: '' }
  }

  const match = formatted.match(/^(.*?)([.,]\d+)?\s([A-Z]{3})$/)
  if (!match) {
    return { main: formatted, fraction: '', code: '' }
  }

  return {
    main: match[1] || formatted,
    fraction: match[2] || '',
    code: match[3] || ''
  }
}

const dialogVisible = ref(false);
const editingId = ref(null);
const selectedAssets = ref([]);

const selectedSymbols = ref([]);
const selectedTypes = ref([]);
const dateRange = ref(null);

const symbolOptions = computed(() =>
  [...new Set(store.list.map((r) => r.symbol))].sort()
);

const typeOptions = computed(() => [
  { label: t('buy'), value: 'buy' },
  { label: t('sell'), value: 'sell' },
]);

const hasActiveFilters = computed(
  () =>
    selectedSymbols.value.length > 0 ||
    selectedTypes.value.length > 0 ||
    !!dateRange.value
);

const clearFilters = () => {
  selectedSymbols.value = [];
  selectedTypes.value = [];
  dateRange.value = null;
};

const filteredTransactions = computed(() => {
  let list = store.list;
  if (selectedSymbols.value.length) {
    list = list.filter((r) => selectedSymbols.value.includes(r.symbol));
  }
  if (selectedTypes.value.length) {
    list = list.filter((r) => selectedTypes.value.includes(r.transactionType));
  }
  if (dateRange.value) {
    const [start, end] = dateRange.value;
    list = list.filter((r) => {
      const d = new Date(`${r.date}T00:00:00`);
      if (Number.isNaN(d.getTime())) return false;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }
  return list;
});

const load = () => store.fetchTransactions();

onMounted(() => {
  if (auth.user && portfolioStore.currentPortfolio?.id) load();
});

watch(() => auth.user, (u) => { if (u && portfolioStore.currentPortfolio?.id) load(); });
watch(() => portfolioStore.currentPortfolio, (p) => { if (p?.id && auth.user) load(); });

const openCreate = () => {
  editingId.value = null;
  dialogVisible.value = true;
};

const openEdit = (id) => {
  editingId.value = id;
  dialogVisible.value = true;
};

const onDelete = async () => {
  if (!selectedAssets.value.length) return;
  const ids = selectedAssets.value.map((r) => r.id);
  try {
    await store.deleteTransactions(ids);
    selectedAssets.value = [];
    toast.add({ severity: 'success', summary: t('success'), detail: t('transactionsDeleteSuccess'), life: 3000 });
  } catch (e) {
    toast.add({ severity: 'error', summary: t('error'), detail: e?.message || t('deleteFailed'), life: 3000 });
  }
};

const onSaved = () => {
  // store.saveTransaction 已更新列表，這裡通常不需要再做事
};

/** 匯出 CSV 功能 **/
const exportCsv = () => {
  if (!store.list.length) {
    toast.add({ severity: 'info', summary: t('info'), detail: t('noDataToExport'), life: 3000 });
    return;
  }

  const headers = ['Symbol', 'Name', 'Shares', 'Price', 'Fee', 'Type', 'Date'];
  const rows = store.list.map(item => [
    item.symbol,
    item.name,
    item.shares,
    item.price,
    item.fee,
    item.transactionType,
    item.date
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const fileName = `transactions_${new Date().toISOString().slice(0,10)}.csv`;
  link.download = fileName;
  link.click();
};


import { useConfirm } from "primevue/useconfirm";
const confirm = useConfirm();

const deleteConfirm = () => {
    confirm.require({
        message: t('deleteConfirm'),
        header: t('warning'),
        icon: 'pi pi-info-circle',
        rejectLabel: t('cancel'),
        rejectProps: {
            label: t('cancel'),
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: t('delete'),
            severity: 'danger'
        },
        accept: () => {
            onDelete();
        }
    });
};
</script>
