<template>
  <div class="p-6 min-h-90">
    <h2 class="text-xl font-semibold mb-16">{{ $t('rebalanceTitle') }}</h2>

    <!-- 存入 / 提取 + 金額輸入 -->
    <div class="flex justify-center items-center mb-4 gap-4">
      <SelectButton v-model="cashAction" :options="cashActionOptions" optionLabel="name" optionValue="code" />
      <FloatLabel variant="on">
        <InputNumber v-model="depositAmount" prefix="$" />
        <label for="on_label">{{ $t('amountLabel') }}</label>
      </FloatLabel>
      <Button :label="$t('rebalanceBtn')" @click="clickRebalance" />
    </div>

    <!-- 再平衡結果表格 -->
    <DataTable v-if="isRebalancing" :value="rebalanceResult" :loading="isLoading" dataKey="id" tableStyle="min-width: 50rem">
      <Column field="symbol" :header="$t('symbol')">
        <template #body="slotProps">
          <div :class="slotProps.data.executed ? 'bg-gray-100 p-1 rounded flex items-center' : ''">
            {{ slotProps.data.symbol }}
            <i v-if="slotProps.data.executed" class="pi pi-check ml-2 text-green-600"></i>
          </div>
        </template>
      </Column>
      <Column field="name" :header="$t('name')"></Column>
      <Column field="shares" :header="$t('currentShares')"></Column>
      <Column field="target" :header="$t('targetPct')">
        <template #body="slotProps">
          <div>
            <span>{{ (slotProps.data.actualPctBefore * 100).toFixed(2) }}</span>
            <i v-if="isRebalancing" class="pi pi-arrow-right mx-2" />
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
    <div v-if="isRebalancing" class="mt-4 flex justify-between items-center">
      <div class="text-sm text-gray-600">
        {{ $t('unusedCash') }}：
        <span class="font-semibold">${{ leftoverCash.toFixed(2) }}</span>
      </div>
      <Button
        :label="$t('rebalance.executeAll')"
        icon="pi pi-check"
        @click="executeAllTransactions"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import api from '@/utils/api';
import * as toast from '@/composables/toast';
import FloatLabel from 'primevue/floatlabel'

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
const depositAmount  = ref(1000);
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
    const allocationData  = await api.get(
      `/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`
    );
    allocation.value = allocationData.map(item => ({
      symbol: item.symbol,
      name: item.name,
      target: Number(item.target) || 0,
    }));
    
    await getHoldings();
    setData(allocationData);
    console.log('Allocation data fetched and set:', allocation.value);
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
}

const setData = (data) => {
  allocation.value = data.map(item => {
    const holding = holdings.value.find(h => h.symbol === item.symbol);
    if (holding) {
      item.shares = holding.shares || 0;
      item.currentPrice = holding.currentPrice || 0;
    }
    return item;
  })

  totalValue.value = allocation.value.reduce((sum, item) => {
    const currentValue = (item.currentPrice || 0) * (item.shares || 0);
    return sum + currentValue;
  }, 0);

  // 預設顯示目前持有 (尚未 Rebalance)
  rebalanceResult.value = allocation.value.map((a) => {
    const currentValue = (a.currentPrice || 0) * (a.shares || 0);
    const actualPct = currentValue / totalValue.value || 0;
    return {
      ...a,
      currentValue,
      actualPctBefore: actualPct,
      actualPctAfter: actualPct, // 尚未 rebalance → 前後一樣
      sharesToBuy: 0,
      sharesToSell: 0,
      amount: 0,
      action: "HOLD",
      executed: false
    };
  });
};


// -------------------- 再平衡邏輯 --------------------
const clickRebalance = () => {
  if (depositAmount.value <= 0) {
    toast.error(t('amountGreaterThanZero'), '')
    return;
  }
  const newAllocation = rebalanceAllocate();
  rebalanceResult.value = newAllocation;
  isRebalancing.value = true;

  // 把剩餘現金滾動到下一次的 deposit
  depositAmount.value = leftoverCash.value;
};

function rebalanceAllocate() {
  // 提取時 futureTotal 需要減掉金額
  const futureTotal = cashAction.value === 'withdraw'
    ? totalValue.value - depositAmount.value
    : totalValue.value + depositAmount.value;

  const result = allocation.value.map((a) => {
    const currentValue = (a.currentPrice || 0) * (a.shares || 0);
    const actualPctBefore = currentValue / totalValue.value || 0;
    const targetValue = (a.target / 100) * futureTotal;
    const requiredValue = targetValue - currentValue;

    return {
      ...a,
      currentValue,
      actualPctBefore,
      targetValue,
      requiredValue
    };
  });

  // step1: 收集賣出金額
  const sellPool = result.reduce((sum, a) => {
    if (a.requiredValue < 0 && a.currentPrice > 0) {
      const sharesToSell = Math.min(
        Math.floor(Math.abs(a.requiredValue) / a.currentPrice),
        a.shares || 0
      );
      return sum + sharesToSell * a.currentPrice;
    }
    return sum;
  }, 0);

  // step2: 計算資金池
  let cashPool = sellPool;

  if (cashAction.value === 'deposit') {
    cashPool += depositAmount.value;
  } else if (cashAction.value === 'withdraw') {
    cashPool -= depositAmount.value;

    if (cashPool < 0) {
      console.warn("提取金額超過資金池，將強制賣出更多資產！");
    }
  }

  // step3: 分配給需要補的標的
  const positiveNeeds = result.filter(a => a.requiredValue > 0 && a.currentPrice > 0);
  const totalRequired = positiveNeeds.reduce((sum, a) => sum + a.requiredValue, 0);

  const allocationResult = result.map((a) => {
    if (a.currentPrice <= 0) {
      return { ...a, action: "HOLD", sharesToBuy: 0, sharesToSell: 0, amount: 0, actualPctAfter: (a.currentValue / futureTotal).toFixed(4), executed: false };
    }

    let sharesToBuy = 0;
    let sharesToSell = 0;
    let actualAmount = 0;

    if (a.requiredValue < 0 || cashAction.value === 'withdraw') {
      // 賣出
      const sellNeed = cashAction.value === 'withdraw'
        ? Math.ceil(depositAmount.value / a.currentPrice) // withdraw 情境下要更多賣出
        : Math.floor(Math.abs(a.requiredValue) / a.currentPrice);

      sharesToSell = Math.min(sellNeed, a.shares || 0);
      actualAmount = -(sharesToSell * a.currentPrice);
    } else if (a.requiredValue > 0 && totalRequired > 0) {
      // 從 cashPool 分配
      const weight = a.requiredValue / totalRequired;
      const amount = cashPool * weight;
      sharesToBuy = Math.floor(amount / a.currentPrice);
      actualAmount = sharesToBuy * a.currentPrice;
    }

    const newValue = a.currentValue + actualAmount;
    const actualPctAfter = newValue / futureTotal;

    return {
      ...a,
      sharesToBuy,
      sharesToSell,
      action: sharesToBuy > 0 ? "BUY" : (sharesToSell > 0 ? "SELL" : "HOLD"),
      amount: actualAmount.toFixed(2),
      actualPctAfter: actualPctAfter.toFixed(4),
      executed: false
    };
  });

  // step4: 計算剩餘現金
  const used = allocationResult.reduce((sum, a) => sum + Number(a.amount), 0);
  leftoverCash.value = cashAction.value === 'deposit'
    ? depositAmount.value + sellPool - used
    : -depositAmount.value + sellPool - used;

  return allocationResult;
}

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
    shares: data.sharesToBuy > 0 ? Number(data.sharesToBuy) : Number(data.sharesToSell),
    price: Number(data.currentPrice) || 0,
    fee: 0,
    date: new Date(),
    type: data.action.toLowerCase(),
    rowIndex: index
  };
  transactionDialog.value = true;
};

const executeAllTransactions = async () => {
  for (let i = 0; i < rebalanceResult.value.length; i++) {
    const item = rebalanceResult.value[i];
    if (item.action === "HOLD" || item.executed) continue;

    const payload = {
      uid: auth.user.uid,
      portfolio_id: portfolioStore.currentPortfolio.id,
      symbol: item.symbol,
      shares: item.sharesToBuy > 0 ? Number(item.sharesToBuy) : Number(item.sharesToSell),
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

  toast.add({ severity: 'success', summary: 'Success', detail: 'All transactions executed.', life: 3000 });
};


</script>
