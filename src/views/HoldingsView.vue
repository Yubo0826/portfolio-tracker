<template>
  <div>
        <div class="flex flex-wrap items-center gap-2 mb-8">
          <MultiSelect
            v-model="selectedSymbols"
            :options="symbolOptions"
            display="chip"
            :placeholder="$t('symbol')"
            class="w-60"
          />
          <Button
            v-if="hasActiveFilters"
            icon="pi pi-filter-slash"
            :aria-label="$t('clearFilters')"
            severity="secondary"
            size="small"
            @click="clearFilters"
          />
          <div class="flex items-center gap-2 ml-auto">
          <Button
            :label="$t('delete')"
            @click="deleteConfirm"
            :disabled="selectedHoldings.length === 0"
            class="mr-2"
            icon="pi pi-trash"
            severity="secondary"
            size="small"
          />
          </div>
        </div>

        <DataTable
          v-model:selection="selectedHoldings"
          selectionMode="multiple"
          :metaKeySelection="false"
          :value="filteredHoldings"
          :loading="store.isLoading"
          sortField="currentValue"
          :sortOrder="-1"
          dataKey="id"
          tableStyle="min-width: 50rem"
          rowHover
          paginator :rows="15"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem" />
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
          <!-- <Column field="name" sortable :header="$t('name')" /> -->
          <Column field="shares" sortable :header="$t('shares')" />
          <Column field="totalCost" sortable :header="$t('totalCost')">
            <template #body="{ data }">
              <div class="inline-flex items-end font-medium">
                <span>{{ splitDisplayAmount(data.totalCost).main }}</span>
                <span>{{ splitDisplayAmount(data.totalCost).fraction }}</span>
                <span class="ml-1 text-[10px] pb-0.5 font-semibold text-[var(--p-text-muted-color)]">{{ splitDisplayAmount(data.totalCost).code }}</span>
              </div>
            </template>
          </Column>
          <Column field="currentPrice" sortable :header="$t('currentPrice')">
            <template #body="{ data }">
              <div class="inline-flex items-end font-medium">
                <span>{{ splitNativePrice(data.nativeCurrentPrice, data.currency).main }}</span>
                <span>{{ splitNativePrice(data.nativeCurrentPrice, data.currency).fraction }}</span>
                <span class="ml-1 text-[10px] pb-0.5  text-[var(--p-text-muted-color)]">{{ splitNativePrice(data.nativeCurrentPrice, data.currency).code }}</span>
              </div>
            </template>
          </Column>
          <Column field="currentValue" sortable :header="$t('currentValue')">
            <template #body="{ data }">
              <div class="inline-flex items-end font-medium">
                <span>{{ splitDisplayAmount(data.currentValue).main }}</span>
                <span>{{ splitDisplayAmount(data.currentValue).fraction }}</span>
                <span class="ml-1 text-[10px] pb-0.5  text-[var(--p-text-muted-color)]">{{ splitDisplayAmount(data.currentValue).code }}</span>
              </div>
            </template>
          </Column>
          <Column field="totalProfit" sortable :header="$t('totalProfit')">
            <template #body="{ data }">
                <span
                  v-tooltip.top="formatSignedAmountWithCode(data.totalProfit)"
                  class="mr-4 cursor-help whitespace-nowrap"
                  :class="{
                  'text-emerald-600': data.totalProfit >= 0,
                  'text-rose-600': data.totalProfit < 0,
                }"
                >
                  <!-- <i v-if="data.profitPercentage >= 0" class="pi pi-arrow-right -rotate-90"></i>
                  <i v-else class="pi pi-arrow-right rotate-90"></i> -->
                  <span v-if="data.profitPercentage >= 0">+</span>
                  <span v-else>-</span>
                  <span>
                    {{ Math.abs(data.profitPercentage) }}%
                  </span>
                </span>
            </template>
          </Column>
          <Column field="profitWithDividends" sortable :header="$t('returnWithDividends')">
            <template #body="{ data }">
              <span
                v-tooltip.top="formatSignedAmountWithCode(data.profitWithDividends)"
                class="cursor-help whitespace-nowrap"
                :class="data.profitWithDividends >= 0 ? 'text-emerald-600' : 'text-rose-600'"
              >{{ data.profitWithDividends >= 0 ? '+' : '-' }}{{ Math.abs(data.returnWithDividends).toFixed(2) }}%</span>
            </template>
          </Column>

          <template #empty>
            <NoData />
          </template>
        </DataTable>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
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
const { formatAmountWithCode, formatPriceWithCode, convertAmountToUsd } = useCurrency();

import { useDividendsStore } from '@/stores/dividends';
const dividendsStore = useDividendsStore();

const loadData = () => {
  store.fetchHoldings();
  dividendsStore.fetchDividends();
};

// 股息表沒有幣別欄位，以持股幣別換算成美金（與 holdings 金額同單位）
// ponytail: 加總該代號全部股息，含已清倉又重新買進前領的，分母只用目前持股的成本
const holdingsWithDividends = computed(() => {
  const dividendBySymbol = new Map();
  for (const d of dividendsStore.list) {
    dividendBySymbol.set(d.symbol, (dividendBySymbol.get(d.symbol) ?? 0) + d.shares * d.amount);
  }
  return store.list.map((h) => {
    const profitWithDividends = h.totalProfit + convertAmountToUsd(dividendBySymbol.get(h.symbol) ?? 0, h.currency);
    return { ...h, profitWithDividends, returnWithDividends: h.totalCost ? (profitWithDividends / h.totalCost) * 100 : 0 };
  });
});

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

const splitNativePrice = (value, currency) => {
  const amount = Number(value)
  const code = String(currency || 'USD').toUpperCase()

  if (value == null || Number.isNaN(amount)) {
    return { main: '--', fraction: '', code }
  }

  const formatted = amount.toLocaleString(code === 'TWD' ? 'zh-TW' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const match = formatted.match(/^(.*?)([.,]\d+)?$/)
  if (!match) {
    return { main: formatted, fraction: '', code }
  }

  return {
    main: match[1] || formatted,
    fraction: match[2] || '',
    code,
  }
}

const formatSignedAmountWithCode = (value) => {
  const formatted = formatAmountWithCode(value)
  if (formatted === '--' || value == null || Number.isNaN(Number(value))) {
    return '--'
  }

  if (Number(value) > 0) {
    return `+${formatted}`
  }

  return formatted
}

const selectedHoldings = ref([]);
const selectedSymbols = ref([]);

const symbolOptions = computed(() =>
  [...new Set(store.list.map((h) => h.symbol))].sort()
);

const hasActiveFilters = computed(() => selectedSymbols.value.length > 0);

const clearFilters = () => {
  selectedSymbols.value = [];
};

const filteredHoldings = computed(() => {
  if (!selectedSymbols.value.length) return holdingsWithDividends.value;
  return holdingsWithDividends.value.filter((h) => selectedSymbols.value.includes(h.symbol));
});

// 初始化＆監聽登入/投組變化後自動載入
if (auth.user && portfolioStore.currentPortfolio?.id) {
  loadData();
}

watch(
  () => auth.user,
  (u) => {
    if (u && portfolioStore.currentPortfolio?.id) loadData();
  }
);

watch(
  () => portfolioStore.currentPortfolio,
  (p) => {
    if (p?.id && auth.user) loadData();
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
