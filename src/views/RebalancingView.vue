<template>
  <Card class="mt-4 p-6 min-h-90">
    <template #content>
    <h2 class="text-xl font-semibold mb-8">{{ $t('rebalanceTitle') }}</h2>

    <!-- 存入 / 提取 + 金額輸入 -->
    <div class="flex justify-center items-center mb-8 gap-4">
      <SelectButton v-model="cashAction" :options="cashActionOptions" optionLabel="name" optionValue="code" />
      <FloatLabel variant="on">
        <InputNumber v-model="depositAmount" prefix="$" />
        <label for="on_label">USD</label>
      </FloatLabel>
      <Button :label="$t('rebalanceBtn')" @click="clickRebalance" />
    </div>

    <!-- 再平衡結果表格 -->
    <DataTable v-if="isRebalancing" :value="rebalanceResult" :loading="isLoading" dataKey="id" tableStyle="min-width: 50rem">
      <Column field="symbol" :header="$t('symbol')">

        <template #body="slotProps">
          <!-- :class="slotProps.data.executed ? 'bg-gray-100 p-1 rounded flex items-center' : ''" -->
          <div>
            <span class="font-medium">{{ slotProps.data.symbol }}</span>
            <div class="text-sm text-[var(--p-card-subtitle-color)] mt-1">{{ slotProps.data.name }}</div>
            <i v-if="slotProps.data.executed" class="pi pi-check ml-2 text-green-600"></i>
          </div>
        </template>
      </Column>
      <!-- <Column field="name" :header="$t('name')"></Column> -->
      <Column field="shares" :header="$t('currentShares')"></Column>
      <Column field="target" :header="$t('targetPct')">
        <template #body="slotProps">
          <div>
            <span>{{ (slotProps.data.actualPctBefore * 100).toFixed(2) }}</span>
            <!-- <i v-if="isRebalancing" class="pi pi-arrow-right mx-2" /> -->
            <span v-if="isRebalancing">&nbsp;→&nbsp;</span>
            <span v-if="isRebalancing">{{ (Number(slotProps.data.actualPctAfter) * 100).toFixed(2) }}</span>
            <br />
            <span class="text-xs text-gray-500">
              ({{ $t('target') }}: {{ slotProps.data.target }})
            </span>
          </div>
        </template>
      </Column>
      <Column field="amount" :header="$t('amount')"></Column>
      <Column field="sharesToBuy" :header="$t('buy')"></Column>
      <Column field="sharesToSell" :header="$t('sell')"></Column>

      <!-- 動作按鈕 -->
      <Column header="">
        <template #body="slotProps">
          <div class="flex justify-end">
            <Button
              v-if="slotProps.data.action === 'BUY' && !slotProps.data.executed"
              icon="pi pi-plus"
              class="p-button-rounded p-button-text"
              severity="success"
              v-tooltip.bottom="$t('buy')"
              @click="addTransaction(slotProps.data, slotProps.index)"
            />
            <Button
              v-else-if="slotProps.data.action === 'SELL' && !slotProps.data.executed"
              icon="pi pi-minus"
              class="p-button-rounded p-button-text"
              severity="danger"
              v-tooltip.bottom="$t('sell')"
              @click="addTransaction(slotProps.data, slotProps.index)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Unused Cash & Execute All -->
    <!-- <div v-if="isRebalancing" class="mt-4 flex justify-between items-center">
      <div class="text-sm">
        {{ $t('unusedCash') }}：
        <span class="font-semibold">${{ leftoverCash.toFixed(2) }}</span>
      </div>
      <Button
        :label="$t('rebalance.executeAll')"
        icon="pi pi-check"
        @click="executeAllTransactions"
      />
    </div> -->
  </template>
</Card>

  <TransactionDialog v-model="transactionDialog" :formData="newTransaction" />
</template>
<script setup>
import { ref, watch } from 'vue';
import api from '@/utils/api';
import TransactionDialog from '@/components/TransactionDialog.vue';
import * as toast from '@/composables/toast';
import FloatLabel from 'primevue/floatlabel';
import { rebalanceAllocate } from '@/utils/rebalance';

import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';
const auth = useAuthStore();
const portfolioStore = usePortfolioStore();

const allocation = ref([]);
const holdings = ref([]);
const isLoading = ref(false);

const totalValue = ref(0);
const rebalanceResult = ref([]);
const depositAmount = ref(1000);
const leftoverCash = ref(0);

const isRebalancing = ref(false);

// 存入/提取模式
const cashAction = ref('deposit');
const cashActionOptions = [
  { name: t('deposit'), code: 'deposit' },
  { name: t('withdraw'), code: 'withdraw' }
];

// -------------------- 取數據 --------------------
const getData = async () => {
  try {
    isLoading.value = true;
    if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;

    const allocationData = await api.get(
      `/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`
    );

    allocation.value = allocationData.map(item => ({
      symbol: item.symbol,
      name: item.name,
      target: Number(item.target) || 0
    }));

    await getHoldings();
    setData(allocationData);
  } catch (error) {
    console.error('Error fetching allocation:', error);
  } finally {
    isLoading.value = false;
  }
};

const getHoldings = async () => {
  try {
    const payload = {
      uid: auth.user?.uid,
      portfolio_id: portfolioStore.currentPortfolio?.id
    };
    const data = await api.post(`/api/holdings/refresh-prices`, payload);
    holdings.value = data.holdings.map(item => ({
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      assetType: item.asset_type,
      currentPrice: parseFloat(item.current_price) || 0,
      avgCost: parseFloat(item.avg_cost) || 0,
      shares: parseInt(item.total_shares) || 0,
      lastUpdated: item.last_updated.split('T')[0]
    }));
  } catch (error) {
    console.error('Error fetching current prices:', error);
  }
};

const setData = data => {
  allocation.value = data.map(item => {
    const holding = holdings.value.find(h => h.symbol === item.symbol);
    if (holding) {
      item.shares = holding.shares || 0;
      item.currentPrice = holding.currentPrice || 0;
    }
    return item;
  });

  totalValue.value = allocation.value.reduce((sum, item) => {
    const currentValue = (item.currentPrice || 0) * (item.shares || 0);
    return sum + currentValue;
  }, 0);

  // 預設顯示目前持有 (尚未 Rebalance)
  rebalanceResult.value = allocation.value.map(a => {
    const currentValue = (a.currentPrice || 0) * (a.shares || 0);
    const actualPct = totalValue.value > 0 ? currentValue / totalValue.value : 0;
    return {
      ...a,
      currentValue,
      actualPctBefore: actualPct,
      actualPctAfter: actualPct, // 尚未 rebalance → 前後一樣
      sharesToBuy: 0,
      sharesToSell: 0,
      amount: 0,
      action: 'HOLD',
      executed: false
    };
  });
};

// -------------------- 再平衡邏輯 --------------------
const clickRebalance = () => {
  if (depositAmount.value <= 0) {
    toast.error(t('amountGreaterThanZero'), '');
    return;
  }

  // 使用純函數版本的 rebalanceAllocate
  const result = rebalanceAllocate({
    action: cashAction.value,
    amount: depositAmount.value,
    totalValue: totalValue.value,
    assets: allocation.value.map(a => ({
      symbol: a.symbol,
      name: a.name,
      target: a.target,
      shares: a.shares || 0,
      currentPrice: a.currentPrice || 0,
      assetType: a.assetType
    }))
  });

  rebalanceResult.value = result.assets;
  leftoverCash.value = result.leftoverCash;
  isRebalancing.value = true;

  // 把剩餘現金滾動到下一次的 deposit
  depositAmount.value = leftoverCash.value;
};


// -------------------- 初始載入 --------------------
if (auth.user) {
  getData();
}

watch(
  () => [auth.user?.uid, portfolioStore.currentPortfolio?.id],
  ([uid, pid]) => {
    if (uid && pid) getData();
  },
  { immediate: true }
);

// -------------------- 交易邏輯 --------------------
const transactionDialog = ref(false);

const newTransaction = ref({
  symbol: '',
  shares: 0,
  price: 0,
  fee: 0,
  date: new Date(),
  type: 'buy',
  rowIndex: null
});

const addTransaction = (data, index) => {
  newTransaction.value = {
    symbol: data.symbol,
    name: data.name,
    shares:
      data.sharesToBuy > 0
        ? Number(data.sharesToBuy)
        : Number(data.sharesToSell),
  price: Number(data.currentPrice) || 0,
    fee: 0,
    date: new Date(),
    operation: data.action.toLowerCase(),
    rowIndex: index
  };
  transactionDialog.value = true;
};

const executeAllTransactions = async () => {
  for (let i = 0; i < rebalanceResult.value.length; i++) {
    const item = rebalanceResult.value[i];
    if (item.action === 'HOLD' || item.executed) continue;

    const payload = {
      uid: auth.user.uid,
      portfolio_id: portfolioStore.currentPortfolio.id,
      symbol: item.symbol,
      shares:
        item.sharesToBuy > 0
          ? Number(item.sharesToBuy)
          : Number(item.sharesToSell),
      name: item.name,
      asset_type: item.asset_type,
      fee: 0,
      price: item.currentPrice,
      transaction_type: item.action.toLowerCase(),
      transaction_date: new Date().toISOString().split('T')[0]
    };

    try {
      await api.post('/api/transactions', payload);
      rebalanceResult.value[i].executed = true;
    } catch (err) {
      console.error(`Failed to execute ${item.symbol}`, err);
    }
  }

  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'All transactions executed.',
    life: 3000
  });
};
</script>
