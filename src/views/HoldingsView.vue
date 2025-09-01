<template>
  <div>
    <div class="flex justify-end mb-8">
      <Button
        :label="t('delete')"
        @click="onDelete"
        icon="pi pi-trash"
        class="mr-2"
        severity="danger"
        size="small"
      />
      <Button
        :label="t('refreshPrices')"
        @click="store.refreshPrices"
        icon="pi pi-refresh"
        class="mr-2"
        size="small"
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
      <Column field="symbol" :header="t('symbol')"></Column>
      <Column field="name" :header="t('name')"></Column>
      <Column field="shares" :header="t('shares')"></Column>
      <Column field="totalCost" :header="t('totalCost')"></Column>
      <Column field="currentPrice" :header="t('currentPrice')"></Column>
      <Column field="currentValue" :header="t('currentValue')"></Column>
      <Column field="totalProfit" :header="t('totalProfit')">
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
          {{ t('noDataAvailable') }}
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n'
import { useHoldingsStore } from '@/stores/holdings';
import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';

const store = useHoldingsStore();
const auth = useAuthStore();
const portfolioStore = usePortfolioStore();
const { t } = useI18n()

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
