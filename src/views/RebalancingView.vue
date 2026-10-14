<template>
  <div class="set-page">
    <p class="set-intro">{{ $t('rebalanceAmountHint') }}</p>

    <!-- ============ 存入 / 提取 + 金額 + 模式 ============ -->
    <section class="set-group">
      <div class="set-group__head">{{ $t('rebalanceCashGroup') }}</div>
      <div class="set-group__body">
        <div class="set-row">
          <label class="set-label" for="rebalance-amount">{{ $t('amountLabel') }}</label>
          <div class="flex flex-wrap items-center gap-3">
            <SelectButton v-model="cashAction" :options="cashActionOptions" optionLabel="name" optionValue="code" :allowEmpty="false" />
            <InputNumber v-model="depositAmount" inputId="rebalance-amount" :prefix="currencySymbol" :suffix="` ${currencyCode}`" :min="0" />
          </div>
        </div>
        <div class="set-row">
          <span class="set-label">{{ $t('rebalanceMode') }}</span>
          <div class="flex flex-wrap items-center gap-4">
            <SelectButton v-model="sellMode" :options="sellModeOptions" optionLabel="name" optionValue="code" :allowEmpty="false" />
            <label class="flex items-center gap-2 text-sm">
              <ToggleSwitch v-model="buyOnly" :disabled="cashAction === 'withdraw'" />
              {{ $t('buyOnly') }}
            </label>
          </div>
          <p class="set-help">{{ $t('rebalanceModeHelp', { band }) }}</p>
        </div>
      </div>
    </section>

    <Message v-if="targetSumOff" severity="warn">
      {{ $t('targetSumWarning', { sum: targetSum.toFixed(2) }) }}
      <RouterLink :to="{ name: 'allocation' }" class="underline ml-1">{{ $t('allocation') }}</RouterLink>
    </Message>

    <!-- ============ 再平衡結果 ============ -->
    <section class="set-group">
      <div class="set-group__head">{{ $t('rebalanceTable') }}</div>
      <div class="card-table">
    <DataTable :value="rows" :loading="isLoading" dataKey="symbol" tableStyle="min-width: 50rem" rowHover>
      <Column field="symbol" :header="$t('symbol')">
        <!-- 與資產明細相同：代號 Tag 連到資產頁，名稱放旁邊 -->
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <RouterLink :to="{ name: 'asset', params: { symbol: data.symbol } }">
              <Tag :value="data.symbol" severity="info" class="cursor-pointer hover:opacity-80" />
            </RouterLink>
            <span class="text-sm text-muted-color">{{ data.name }}</span>
            <i v-if="executed.has(data.symbol)" class="pi pi-check text-green-600"></i>
          </div>
        </template>
      </Column>
      <Column field="shares" :header="$t('shares')"></Column>
      <Column field="currentValue" :header="$t('currentValue')">
        <template #body="{ data }">{{ formatAmount(data.currentValue) }}</template>
      </Column>
      <Column field="currentPct" :header="$t('currentPct')">
        <template #body="{ data }">{{ data.currentPct.toFixed(2) }}%</template>
      </Column>
      <Column field="target" :header="$t('targetPct')">
        <template #body="{ data }">{{ data.target.toFixed(2) }}%</template>
      </Column>
      <!-- 偏離 = 目前 − 目標（百分點），超過組合的偏離閾值才上色 -->
      <Column field="drift" :header="$t('drift')">
        <template #body="{ data }">
          <span :class="{ 'text-orange-500 font-semibold': Math.abs(data.drift) > band }">
            {{ data.drift > 0 ? '+' : '' }}{{ data.drift.toFixed(2) }}
            <i
              v-if="Math.abs(data.drift) > band"
              class="pi pi-exclamation-triangle text-xs"
              :aria-label="$t('overDriftThreshold', { band })"
              v-tooltip.bottom="{ value: $t('overDriftThreshold', { band }), showDelay: 500 }"
            ></i>
          </span>
        </template>
      </Column>
      <Column v-if="result" field="actualPctAfter" :header="$t('afterPct')">
        <template #body="{ data }">{{ (data.actualPctAfter * 100).toFixed(2) }}%</template>
      </Column>

      <!-- 建議交易：買賣合併一欄，按鈕放同欄 -->
      <Column v-if="result" :header="$t('suggestedTrade')">
        <template #body="{ data }">
          <div v-if="data.action !== 'HOLD'" class="flex items-center justify-between gap-2">
            <div :class="data.action === 'BUY' ? 'text-up' : 'text-down'">
              <div>{{ data.action === 'BUY' ? '+' : '−' }}{{ $t('sharesCount', { n: data.sharesToBuy || data.sharesToSell }) }}</div>
              <div class="text-xs">{{ formatChange(data.amount) }}</div>
            </div>
            <Button
              v-if="!auth.isDemo && !executed.has(data.symbol)"
              :icon="data.action === 'BUY' ? 'pi pi-plus' : 'pi pi-minus'"
              :aria-label="$t(data.action === 'BUY' ? 'buy' : 'sell')"
              class="p-button-rounded p-button-text"
              :severity="data.action === 'BUY' ? 'success' : 'danger'"
              v-tooltip.bottom="{ value: $t(data.action === 'BUY' ? 'buy' : 'sell'), showDelay: 500 }"
              @click="addTransaction(data)"
            />
          </div>
          <span v-else class="text-muted-color">—</span>
        </template>
      </Column>
    </DataTable>
      </div>
    </section>

    <!-- 摘要：總市值變化、買賣合計、剩餘現金 -->
    <div v-if="result" class="flex flex-wrap gap-x-6 gap-y-1 text-sm">
      <span>{{ $t('totalValue') }}：{{ formatAmount(totalValue) }} → <b>{{ formatAmount(result.futureTotal) }}</b></span>
      <span class="text-up">{{ $t('buy') }}：{{ formatAmount(tradeTotal('BUY')) }}</span>
      <span class="text-down">{{ $t('sell') }}：{{ formatAmount(tradeTotal('SELL')) }}</span>
      <span>{{ $t('unusedCash') }}：<b>{{ formatAmount(result.leftoverCash) }}</b></span>
    </div>

    <div class="flex justify-end">
      <!-- disabled 的按鈕收不到 hover，tooltip 掛在外層 span -->
      <span v-tooltip.top="{ value: noAllocation ? $t('rebalanceNoAllocation') : null, showDelay: 500 }">
        <Button :label="$t('rebalanceBtn')" :disabled="noAllocation" @click="clickRebalance" />
      </span>
    </div>
  </div>

  <TransactionDialog v-model="transactionDialog" :formData="newTransaction" @saved="executed.add(newTransaction.symbol)" />
</template>
<script setup>
import { ref, computed, watch, reactive } from 'vue';
import api from '@/utils/api';
import TransactionDialog from '@/components/TransactionDialog.vue';
import Message from 'primevue/message';
import ToggleSwitch from 'primevue/toggleswitch';
import { rebalanceAllocate } from '@/utils/rebalance';
import { useCurrency } from '@/composables/useCurrency';

import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';
import { useHoldingsStore } from '@/stores/holdings';
const auth = useAuthStore();
const portfolioStore = usePortfolioStore();
const holdingsStore = useHoldingsStore();
const { currencySymbol, currencyCode, formatAmount, formatChange, convertAmountToUsd } = useCurrency();

const allocation = ref([]);
const isLoading = ref(false);
const depositAmount = ref(1000);
const result = ref(null);
// 已新增交易的代號（TransactionDialog 存檔後打勾）
const executed = reactive(new Set());

// 存入/提取模式
const cashAction = ref('deposit');
const cashActionOptions = computed(() => [
  { name: t('deposit'), code: 'deposit' },
  { name: t('withdraw'), code: 'withdraw' }
]);

// 賣出規則：精確 = 超標就賣；門檻 = 偏離超過組合的 drift_threshold 才賣
const sellMode = ref('exact');
const band = computed(() => Number(portfolioStore.currentPortfolio?.drift_threshold ?? 5));
const sellModeOptions = computed(() => [
  { name: t('rebalanceModeExact'), code: 'exact' },
  { name: t('rebalanceModeBand', { band: band.value }), code: 'band' }
]);
const buyOnly = ref(false);

// -------------------- 資料 --------------------
// 目標配置 × 持股（holdings store 已把價格換算成 USD，台美股才能相加）
const baseRows = computed(() =>
  allocation.value.map(a => {
    const h = holdingsStore.list.find(h => h.symbol === a.symbol);
    return {
      symbol: a.symbol,
      name: a.name,
      target: Number(a.target) || 0,
      shares: h?.shares || 0,
      currentPrice: h?.currentPrice || 0,
      nativeCurrentPrice: h?.nativeCurrentPrice || 0,
      currency: h?.currency || 'USD',
      assetType: h?.assetType,
      currentValue: h?.currentValue || 0
    };
  })
);
const totalValue = computed(() => baseRows.value.reduce((s, r) => s + r.currentValue, 0));
const targetSum = computed(() => baseRows.value.reduce((s, r) => s + r.target, 0));
const noAllocation = computed(() => !isLoading.value && baseRows.value.length === 0);
const targetSumOff = computed(() => baseRows.value.length > 0 && Math.abs(targetSum.value - 100) > 0.01);

// 目前 % / 偏離跟著持股即時更新；再平衡結果依代號併入
const rows = computed(() => {
  const bySymbol = new Map(result.value?.assets.map(a => [a.symbol, a]));
  return baseRows.value.map(r => {
    const currentPct = totalValue.value > 0 ? (r.currentValue / totalValue.value) * 100 : 0;
    const res = bySymbol.get(r.symbol);
    return {
      ...r,
      currentPct,
      drift: currentPct - r.target,
      actualPctAfter: res?.actualPctAfter ?? 0,
      sharesToBuy: res?.sharesToBuy ?? 0,
      sharesToSell: res?.sharesToSell ?? 0,
      amount: res?.amount ?? 0,
      action: res?.action ?? 'HOLD'
    };
  });
});

const tradeTotal = action =>
  rows.value.filter(r => r.action === action).reduce((s, r) => s + Math.abs(r.amount), 0);

const getData = async () => {
  if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
  try {
    isLoading.value = true;
    result.value = null;
    executed.clear();
    const [allocationData] = await Promise.all([
      api.get(`/api/allocation?uid=${auth.user.uid}&portfolio_id=${portfolioStore.currentPortfolio.id}`),
      holdingsStore.refreshPrices()
    ]);
    allocation.value = allocationData;
  } catch (error) {
    console.error('Error fetching allocation:', error);
  } finally {
    isLoading.value = false;
  }
};

// -------------------- 再平衡邏輯 --------------------
const clickRebalance = () => {
  executed.clear();
  result.value = rebalanceAllocate({
    action: cashAction.value,
    // 金額 0（或清空）= 純再平衡：賣超標、買不足
    amount: convertAmountToUsd(depositAmount.value || 0, currencyCode.value),
    totalValue: totalValue.value,
    assets: baseRows.value,
    allowSell: cashAction.value === 'withdraw' || !buyOnly.value,
    sellBand: sellMode.value === 'band' ? band.value / 100 : undefined
  });
};

watch(
  () => [auth.user?.uid, portfolioStore.currentPortfolio?.id],
  ([uid, pid]) => {
    if (uid && pid) getData();
  },
  { immediate: true }
);

// -------------------- 交易 --------------------
const transactionDialog = ref(false);
const newTransaction = ref(null);

const addTransaction = data => {
  newTransaction.value = {
    symbol: data.symbol,
    name: data.name,
    assetType: data.assetType,
    shares: data.sharesToBuy || data.sharesToSell,
    // 交易以原幣別記錄（台股用台幣價）
    price: data.nativeCurrentPrice,
    currency: data.currency,
    fee: 0,
    date: new Date(),
    transactionType: data.action.toLowerCase()
  };
  transactionDialog.value = true;
};
</script>
