<template>
  <div>
        <div class="flex flex-wrap items-center gap-2 mb-8">
          <FilterMenu v-model="filters" v-model:dateRange="dateRange" :groups="filterGroups" />

        </div>
        
        <DataTable
          :value="filteredDividends"
          sortField="date"
          :sortOrder="-1"
          :loading="store.isLoading && !store.list.length"
          dataKey="id"
          tableStyle="min-width: 50rem"
          rowHover 
          paginator :rows="15"
        >
          <Column field="symbol" sortable :header="$t('symbol')">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <RouterLink :to="{ name: 'asset', params: { symbol: data.symbol } }">
                  <Tag :value="data.symbol" severity="info" class="cursor-pointer hover:opacity-80" />
                </RouterLink>
                <span class="text-sm text-muted-color">{{ data.name }}</span>
              </div>
            </template>
          </Column>
          <Column field="shares" sortable :header="$t('shares')" />
          <Column field="amount" sortable :header="$t('dividendPerShare')">
            <template #body="{ data }">
              <div class="inline-flex items-end font-medium">
                <span>{{ splitDisplayAmount(data.amount, 'price', currencyOf(data.symbol)).main }}</span>
                <span>{{ splitDisplayAmount(data.amount, 'price', currencyOf(data.symbol)).fraction }}</span>
                <span class="ml-1 text-[10px] pb-0.5 font-semibold text-[var(--p-text-muted-color)]">{{ splitDisplayAmount(data.amount, 'price', currencyOf(data.symbol)).code }}</span>
              </div>
            </template>
          </Column>
          <Column field="totalAmount" sortable :header="$t('dividendTotal')">
            <template #body="{ data }">
              <div class="inline-flex items-end font-medium">
                <span>{{ splitDisplayAmount(data.totalAmount, 'amount', currencyOf(data.symbol)).main }}</span>
                <span>{{ splitDisplayAmount(data.totalAmount, 'amount', currencyOf(data.symbol)).fraction }}</span>
                <span class="ml-1 text-[10px] pb-0.5 font-semibold text-[var(--p-text-muted-color)]">{{ splitDisplayAmount(data.totalAmount, 'amount', currencyOf(data.symbol)).code }}</span>
              </div>
            </template>
          </Column>
          <Column field="date" sortable :header="$t('date')" />
    
          <template #empty>
            <NoData />
          </template>
        </DataTable>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import FilterMenu from '@/components/FilterMenu.vue';
import NoData from '@/components/NoData.vue';
import { useCurrency } from '@/composables/useCurrency';
import { useDividendsStore } from '@/stores/dividends';
import { useHoldingsStore } from '@/stores/holdings';
import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';

const store = useDividendsStore();
const holdingsStore = useHoldingsStore();
const auth = useAuthStore();
const portfolioStore = usePortfolioStore();

import { currencyOfSymbol } from '@/utils/symbol';

// 股息表沒有幣別欄位，原本以 USD 格式化會把台股股息當美金換算；改以標的原幣顯示
const { splitDisplayAmount } = useCurrency();

// 幣別以持股實際存的為準（Yahoo 報價回傳的幣別）；持股已賣光而查不到時才由代號推斷
const currencyBySymbol = computed(() =>
  Object.fromEntries(holdingsStore.list.map((h) => [h.symbol, h.currency]))
);
const currencyOf = (symbol) => currencyBySymbol.value[symbol] || currencyOfSymbol(symbol);

const { t } = useI18n();
const dateRange = ref(null);
const filters = ref({ symbol: [] });

const filterGroups = computed(() => [
  { key: 'symbol', label: t('symbol'), options: [...new Set(store.list.map((d) => d.symbol))].sort().map((v) => ({ label: v, value: v })) },
]);

const filteredDividends = computed(() => {
  let list = store.list;
  if (filters.value.symbol.length) {
    list = list.filter((item) => filters.value.symbol.includes(item.symbol));
  }
  if (dateRange.value) {
    const [start, end] = dateRange.value;
    list = list.filter((item) => {
      const d = new Date(`${item.date}T00:00:00`);
      if (Number.isNaN(d.getTime())) return false;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }
  return list;
});

watch(() => auth.user, (newUser) => {
  if (newUser && portfolioStore.currentPortfolio?.id) {
    store.fetchDividends();
  }
});

watch(() => portfolioStore.currentPortfolio, (newVal) => {
  if (newVal?.id && auth.user?.uid) {
    store.fetchDividends();
  }
});

onMounted(() => {
  if (auth.user?.uid && portfolioStore.currentPortfolio?.id) {
    store.fetchDividends();
  }
});
</script>
