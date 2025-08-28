<template>
  <div>
    <div class="flex justify-end mb-4">
      <Button
        label="Delete"
        @click="onDelete"
        icon="pi pi-trash"
        class="mr-2"
        severity="danger"
      />
      <Button
        label="Refresh Prices"
        @click="store.refreshPrices"
        icon="pi pi-refresh"
        class="mr-2"
      />
    </div>

    <DataTable
      v-model:selection="selectedHoldings"
      :value="store.list"
      :loading="store.isLoading"
      dataKey="id"
      tableStyle="min-width: 50rem"
    >
      <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
      <Column field="symbol" header="Symbol"></Column>
      <Column field="name" header="Name"></Column>
      <Column field="shares" header="Shares"></Column>
      <Column field="totalCost" header="Total Cost"></Column>
      <Column field="currentPrice" header="Current Price"></Column>
      <Column field="currentValue" header="Current Value"></Column>
      <Column field="totalProfit" header="Total Profit">
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
        <div class="p-4 text-center text-gray-500">
          <i class="pi pi-info-circle mr-2" />
          現在並無資料。
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useHoldingsStore } from '@/stores/holdings';
import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';

const store = useHoldingsStore();
const auth = useAuthStore();
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
