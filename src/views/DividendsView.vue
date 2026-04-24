<template>
  <div>
    
    <Card>
      <template #content>
        <div class="flex flex-wrap items-center gap-2 mb-8">
          <MultiSelect
            v-model="selectedSymbols"
            :options="symbolOptions"
            :placeholder="$t('symbol')"
            display="chip"
            filter
            class="w-60"
          />
          <DateRangeFilter v-model="dateRange" />
          <Button
            v-if="hasActiveFilters"
            icon="pi pi-filter-slash"
            severity="secondary"
            size="small"
            @click="clearFilters"
          />

        </div>
        
        <DataTable
          :value="filteredDividends"
          sortField="date"
          :sortOrder="-1"
          :loading="store.isLoading"
          dataKey="id"
          tableStyle="min-width: 50rem"
          rowHover 
          paginator :rows="15"
        >
          <Column field="symbol" sortable :header="$t('symbol')">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold tracking-wide">{{ data.symbol }}</span>
                <span class="text-sm text-[var(--p-text-color)]">{{ data.name }}</span>
              </div>
            </template>
          </Column>
          <Column field="shares" sortable :header="$t('shares')" />
          <Column field="amount" sortable :header="$t('dividendPerShare')">
            <template #body="{ data }">
              <div class="inline-flex items-end font-medium">
                <span>{{ splitDisplayAmount(data.amount, 'price').main }}</span>
                <span>{{ splitDisplayAmount(data.amount, 'price').fraction }}</span>
                <span class="ml-1 text-[10px] pb-0.5 font-semibold text-[var(--p-text-muted-color)]">{{ splitDisplayAmount(data.amount, 'price').code }}</span>
              </div>
            </template>
          </Column>
          <Column field="totalAmount" sortable :header="$t('dividendTotal')">
            <template #body="{ data }">
              <div class="inline-flex items-end font-medium">
                <span>{{ splitDisplayAmount(data.totalAmount).main }}</span>
                <span>{{ splitDisplayAmount(data.totalAmount).fraction }}</span>
                <span class="ml-1 text-[10px] pb-0.5 font-semibold text-[var(--p-text-muted-color)]">{{ splitDisplayAmount(data.totalAmount).code }}</span>
              </div>
            </template>
          </Column>
          <Column field="date" sortable :header="$t('date')" />
    
          <template #empty>
            <NoData />
          </template>
        </DataTable>
      </template>
    </Card>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import DateRangeFilter from '@/components/DateRangeFilter.vue';
import NoData from '@/components/NoData.vue';
import { useCurrency } from '@/composables/useCurrency';
import { useDividendsStore } from '@/stores/dividends';
import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';

const store = useDividendsStore();
const auth = useAuthStore();
const portfolioStore = usePortfolioStore();

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

const dateRange = ref(null);
const selectedSymbols = ref([]);

const symbolOptions = computed(() =>
  [...new Set(store.list.map((d) => d.symbol))].sort()
);

const hasActiveFilters = computed(
  () => selectedSymbols.value.length > 0 || !!dateRange.value
);

const clearFilters = () => {
  selectedSymbols.value = [];
  dateRange.value = null;
};

const filteredDividends = computed(() => {
  let list = store.list;
  if (selectedSymbols.value.length) {
    list = list.filter((item) => selectedSymbols.value.includes(item.symbol));
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
