<template>
  <ConfirmDialog></ConfirmDialog>
  <div>
    <div class="flex justify-end mb-8">
      <!-- p-button-rounded p-button-text -->
      <Button
        :label="$t('delete')"
        @click="deleteConfirm"
        :disabled="selectedHoldings.length === 0"
        class="mr-2"
        icon="pi pi-trash"
        severity="secondary"
        size="small"
      />
      <Button
        :label="$t('refresh')"
        @click="store.refreshPrices"
        icon="pi pi-refresh"
        class="mr-2"
        severity="secondary"
        size="small"
      />
    </div>

    <DataTable
      v-model:selection="selectedHoldings"
      :value="store.list"
      :loading="store.isLoading"
      dataKey="id"
      tableStyle="min-width: 50rem"
      rowHover
      paginator :rows="15"
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
      <!-- <Column field="name" sortable :header="$t('name')" /> -->
      <Column field="shares" sortable :header="$t('shares')" />
      <Column field="totalCost" sortable :header="$t('totalCost')">
        <template #body="{ data }">
          {{ formatAmount(data.totalCost) }}
        </template>
      </Column>
      <Column field="currentPrice" sortable :header="$t('currentPrice')">
        <template #body="{ data }">
          {{ formatPrice(data.currentPrice) }}
        </template>
      </Column>
      <Column field="currentValue" sortable :header="$t('currentValue')">
        <template #body="{ data }">
          {{ formatAmount(data.currentValue) }}
        </template>
      </Column>
      <Column field="totalProfit" sortable :header="$t('totalProfit')">
        <template #body="{ data }">
          <div
            :class="{
              'text-emerald-600': data.totalProfit >= 0,
              'text-[#f27362]': data.totalProfit < 0
            }"
          >
            <span class="font-bold mr-4 whitespace-nowrap">
              {{ formatChange(data.totalProfit) }}
            </span>
            <div class="flex items-center gap-1">
              <i v-if="data.profitPercentage >= 0" class="pi pi-sort-up-fill"></i>
              <i v-else class="pi pi-sort-down-fill"></i>
              <span class="font-bold">{{ Math.abs(data.profitPercentage) }}%</span>
            </div>
          </div>
        </template>
      </Column>

      <template #empty>
        <NoData />
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import NoData from '@/components/NoData.vue';
import * as toast from '@/composables/toast'
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { useHoldingsStore } from '@/stores/holdings';
const store = useHoldingsStore();

import { useAuthStore } from '@/stores/auth';
const auth = useAuthStore();

import { usePortfolioStore } from '@/stores/portfolio';
const portfolioStore = usePortfolioStore();

import { useCurrency } from '@/composables/useCurrency';
const { formatAmount, formatChange, formatPrice } = useCurrency();

const selectedHoldings = ref([]);

// 初始化＆監聽登入/投組變化後自動載入
if (auth.user && portfolioStore.currentPortfolio?.id) {
  store.fetchHoldings();
}

watch(
  () => auth.user,
  (u) => {
    if (u && portfolioStore.currentPortfolio?.id) store.fetchHoldings();
  }
);

watch(
  () => portfolioStore.currentPortfolio,
  (p) => {
    if (p?.id && auth.user) store.fetchHoldings();
  }
);

const onDelete = async () => {
  if (!selectedHoldings.value.length) return;
  try {
    const ids = selectedHoldings.value.map((h) => h.id);
    await store.deleteHoldings(ids);
    selectedHoldings.value = [];
    toast.success(t('deletedSuccess'));
  } catch (error) {
    toast.error(t('deleteFailed'));
  }
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
