<template>
  <div>
    <div class="flex justify-end mb-8">
      <Button
        :label="$t('delete')"
        @click="onDelete"
        icon="pi pi-trash"
        class="mr-2"
        severity="danger"
        size="small"
      />
      <Button
        :label="$t('add')"
        @click="openCreate"
        icon="pi pi-plus"
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
    >
      <Column selectionMode="multiple" headerStyle="width: 3rem" />
      <Column field="symbol" sortable :header="$t('symbol')" />
      <Column field="name" sortable :header="$t('name')" />
      <Column field="shares" sortable :header="$t('shares')" />
      <Column field="price" sortable :header="$t('price')" />
      <Column field="fee" sortable :header="$t('fee')" />
      <Column field="" sortable :header="$t('operation')">
        <template #body="slotProps">
          <div>
            <span
              v-if="slotProps.data.transactionType === 'buy'"
              class="bg-green-400 text-green-800 rounded-full px-4 py-1.5 text-white font-bold text-xs"
            >
              {{ $t('buy') }}
            </span>
            <span
              v-else
              class="bg-red-400 text-red-800 rounded-full px-4 py-1.5 text-white font-bold text-xs"
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
        <div class="p-4 text-center text-gray-500">
          <i class="pi pi-info-circle mr-2" />
          {{ $t('noData') }}
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
import TransactionDialog from '@/components/TransactionDialog.vue';
import { useTransactionsStore } from '@/stores/transactions';
import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';

const store = useTransactionsStore();
const auth = useAuthStore();
const portfolioStore = usePortfolioStore();
const toast = useToast();
const { t } = useI18n();

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
</script>
