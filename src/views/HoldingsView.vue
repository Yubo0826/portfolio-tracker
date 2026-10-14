<template>
  <div>
        <div class="flex flex-wrap items-center gap-2 mb-8">
          <FilterMenu v-model="filters" :groups="filterGroups" />
          <div class="flex items-center gap-2 ml-auto">
          <Button
            v-if="!auth.isDemo"
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
          v-model:expandedRows="expandedRows"
          :pt="{
            rowExpansion: { class: 'hover:!bg-[var(--p-datatable-row-background)] hover:!text-[var(--p-datatable-row-color)]' },
            rowExpansionCell: { class: '!p-0' },
          }"
          selectionMode="multiple"
          :metaKeySelection="false"
          :value="filteredHoldings"
          :loading="store.isLoading && !store.list.length"
          sortField="currentValue"
          :sortOrder="-1"
          dataKey="id"
          tableStyle="min-width: 50rem"
          rowHover
          paginator :rows="15"
        >
          <Column v-if="!auth.isDemo" selectionMode="multiple" headerStyle="width: 3rem" />
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
                  'text-up': data.totalProfit >= 0,
                  'text-down': data.totalProfit < 0,
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
                :class="data.profitWithDividends >= 0 ? 'text-up' : 'text-down'"
              >{{ data.profitWithDividends >= 0 ? '+' : '-' }}{{ Math.abs(data.returnWithDividends).toFixed(2) }}%</span>
            </template>
          </Column>

          <Column headerStyle="width: 3rem">
            <template #body="{ data }">
              <Button
                :icon="expandedRows[data.id] && !closing[data.id] ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                v-tooltip.top="{ value: $t(expandedRows[data.id] && !closing[data.id] ? 'collapse' : 'expand'), showDelay: 500 }"
                :aria-label="$t(expandedRows[data.id] && !closing[data.id] ? 'collapse' : 'expand')"
                text rounded severity="secondary" size="small"
                @click="toggleRow(data.id)"
              />
            </template>
          </Column>

          <template #expansion="{ data }">
            <div class="lot-expand" :class="{ closing: closing[data.id] }" @animationend="onExpandAnimEnd(data.id)">
            <div class="min-h-0 overflow-hidden px-4">
            <table class="w-full text-sm my-2">
              <thead class="text-muted-color">
                <tr>
                  <th class="text-left font-medium py-2">{{ $t('date') }}</th>
                  <th class="text-left font-medium py-2">{{ $t('type') }}</th>
                  <th class="text-right font-medium py-2">{{ $t('price') }}</th>
                  <th class="text-right font-medium py-2">{{ $t('shares') }}</th>
                  <th class="text-right font-medium py-2">{{ $t('totalProfit') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="lot in lotsOf(data)" :key="lot.id" class="border-t border-surface">
                  <td class="py-2">{{ lot.date }}</td>
                  <td class="py-2">{{ $t(lot.transactionType) }}</td>
                  <td class="py-2 text-right">{{ splitNativePrice(lot.price, lot.currency).main }}{{ splitNativePrice(lot.price, lot.currency).fraction }}</td>
                  <td class="py-2 text-right">{{ lot.shares }}</td>
                  <td class="py-2 text-right whitespace-nowrap">
                    <span v-if="lot.profit != null" :class="lot.profit >= 0 ? 'text-up' : 'text-down'">
                      {{ formatSignedAmountWithCode(lot.profit) }} ({{ lot.profit >= 0 ? '+' : '' }}{{ lot.profitPct.toFixed(2) }}%)
                    </span>
                    <span v-else class="text-muted-color">--</span>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
            </div>
          </template>

          <template #empty>
            <NoData />
          </template>
        </DataTable>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import NoData from '@/components/NoData.vue';
import FilterMenu from '@/components/FilterMenu.vue';
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

import { useTransactionsStore } from '@/stores/transactions';
const transactionsStore = useTransactionsStore();

import { currentLots } from '@/utils/portfolioMetrics';

// fetchTransactions 內會一併重抓 holdings
const loadData = () => {
  transactionsStore.fetchTransactions();
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
const expandedRows = ref({});
// PrimeVue 收合會直接移除展開列，所以收合時先標記 closing 播完動畫，再從 expandedRows 移除
const closing = ref({});
const toggleRow = (id) => {
  if (!expandedRows.value[id]) expandedRows.value = { ...expandedRows.value, [id]: true };
  else closing.value = { ...closing.value, [id]: true };
};
const onExpandAnimEnd = (id) => {
  if (!closing.value[id]) return;
  const { [id]: _, ...rest } = expandedRows.value;
  expandedRows.value = rest;
  const { [id]: __, ...restClosing } = closing.value;
  closing.value = restClosing;
};

// 買入批次以現價算損益（含手續費），換成美金交給 formatAmount* 轉顯示幣別；賣出不算
const lotsOf = (h) => currentLots(transactionsStore.list, h.symbol).map((lot) => {
  if (lot.transactionType !== 'buy') return { ...lot, profit: null };
  const cost = lot.price * lot.shares + lot.fee;
  const profit = h.nativeCurrentPrice * lot.shares - cost;
  return { ...lot, profit: convertAmountToUsd(profit, lot.currency), profitPct: cost ? (profit / cost) * 100 : 0 };
});
const filters = ref({ symbol: [] });

const filterGroups = computed(() => [
  { key: 'symbol', label: t('symbol'), options: [...new Set(store.list.map((h) => h.symbol))].sort().map((v) => ({ label: v, value: v })) },
]);

const filteredHoldings = computed(() => {
  if (!filters.value.symbol.length) return holdingsWithDividends.value;
  return holdingsWithDividends.value.filter((h) => filters.value.symbol.includes(h.symbol));
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

<style scoped>
/* grid-template-rows 0fr↔1fr 可以從 0 動畫到內容實際高度 */
.lot-expand {
  display: grid;
  animation: lot-open 0.2s ease-out;
}
.lot-expand.closing {
  animation: lot-close 0.2s ease-in forwards;
}
@keyframes lot-open {
  from { grid-template-rows: 0fr; opacity: 0; }
  to { grid-template-rows: 1fr; opacity: 1; }
}
@keyframes lot-close {
  from { grid-template-rows: 1fr; opacity: 1; }
  to { grid-template-rows: 0fr; opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .lot-expand, .lot-expand.closing { animation-duration: 1ms; }
}
</style>
