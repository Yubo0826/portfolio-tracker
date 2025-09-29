<template>
  <div>
    <div class="flex justify-end mb-8">
      <!-- p-button-rounded p-button-text -->
      <Button
        :label="$t('delete')"
        @click="onDelete"
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
        size="small"
        severity="secondary"
      />
    </div>

    <DataTable
      v-model:selection="selectedHoldings"
      :value="store.list"
      :loading="store.isLoading"
      dataKey="id"
      tableStyle="min-width: 50rem"
    >
      <Column selectionMode="multiple" headerStyle="width: 3rem" />
      <Column field="symbol" :header="$t('symbol')" />
      <Column field="name" :header="$t('name')" />
      <Column field="shares" :header="$t('shares')" />
      <Column field="totalCost" :header="$t('totalCost')" />
      <Column field="currentPrice" :header="$t('currentPrice')" />
      <Column field="currentValue" :header="$t('currentValue')" />
      <Column field="totalProfit" :header="$t('totalProfit')">
        <template #body="{ data }">
          <div
            :class="{
              'text-[#5cd59b]': data.totalProfit >= 0,
              'text-[#f27362]': data.totalProfit < 0
            }"
          >
            <span class="font-bold mr-4 whitespace-nowrap">
              {{ data.totalProfit > 0 ? '+' : '-' }}${{ Math.abs(data.totalProfit).toFixed(2) }}
            </span>
            <div class="flex items-center gap-2">
              <i v-if="data.profitPercentage >= 0" class="pi pi-sort-up-fill"></i>
              <i v-else class="pi pi-sort-down-fill"></i>
              <span>{{ Math.abs(data.profitPercentage) }}%</span>
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

import { useHoldingsStore } from '@/stores/holdings';
const store = useHoldingsStore();

import { useAuthStore } from '@/stores/auth';
const auth = useAuthStore();

import { usePortfolioStore } from '@/stores/portfolio';
const portfolioStore = usePortfolioStore();

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
  const ids = selectedHoldings.value.map((h) => h.id);
  await store.deleteHoldings(ids);
  selectedHoldings.value = [];
};
</script>
