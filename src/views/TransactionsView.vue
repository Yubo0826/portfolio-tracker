<template>
  <ConfirmDialog></ConfirmDialog>
  <div>
    <div class="flex justify-end mb-8">
      <Button
        :label="$t('delete')"
        @click="deleteConfirm"
        :disabled="selectedAssets.length === 0"
        icon="pi pi-trash"
        class="mr-2"
        severity="secondary"
        size="small"
      />
      <Button
        :label="$t('export')"
        @click="exportCsv"
        icon="pi pi-download"
        class="mr-2"
        severity="secondary"
        size="small"
      />
      <TransactionDialog
        v-model="dialogVisible"
        :editingId="editingId"
        @saved="onSaved"
      />
    </div>

    <DataTable
      v-model:selection="selectedAssets"
      :value="store.list"
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
          <div>
            <span class="font-medium">{{ data.symbol }}</span>
            <div class="text-sm text-[var(--p-card-subtitle-color)] mt-1">{{ data.name }}</div>
          </div>
        </template>
      </Column>
      <Column field="shares" sortable :header="$t('shares')" />
      <Column field="price" sortable :header="$t('price')">
        <template #body="{ data }">
          {{ formatPrice(data.price) }}
        </template>
      </Column>
      <Column field="fee" sortable :header="$t('fee')">
        <template #body="{ data }">
          {{ formatAmount(data.fee) }}
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import TransactionDialog from '@/components/TransactionDialog.vue';
import { useTransactionsStore } from '@/stores/transactions';
import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';
import { useCurrency } from '@/composables/useCurrency';
const portfolioStore = usePortfolioStore();

import NoData from '@/components/NoData.vue';

const store = useTransactionsStore();
const auth = useAuthStore();
const toast = useToast();
const { formatAmount, formatPrice } = useCurrency();

const dialogVisible = ref(false);
const editingId = ref(null);
const selectedAssets = ref([]);

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
