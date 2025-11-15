<template>
  <div class="p-6 min-h-90">
    <h2 class="text-xl font-semibold mb-8">{{ $t('rebalanceTitle') }}</h2>

    <!-- 存入 / 提取 + 金額輸入 -->
    <div class="flex justify-center items-center mb-4 gap-4">
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
  </div>

  <TransactionDialog v-model="transactionDialog" :formData="newTransaction" />
</template>
<script setup>
import { ref, watch } from 'vue';
import api from '@/utils/api';
import TransactionDialog from '@/components/TransactionDialog.vue';
import * as toast from '@/composables/toast';
import FloatLabel from 'primevue/floatlabel';

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
  const newAllocation = rebalanceAllocate();
  rebalanceResult.value = newAllocation;
  isRebalancing.value = true;

  // 把剩餘現金滾動到下一次的 deposit
  depositAmount.value = leftoverCash.value;
};

function rebalanceAllocate() {
  const isWithdraw = cashAction.value === 'withdraw';

  // --- 標準化目標權重（自動辨識是 0–1 或 0–100） ---
  const rawTargets = allocation.value.map(a => Number(a.target) || 0);
  const isPercent = rawTargets.some(v => v > 1.0001);
  let weights = rawTargets.map(v => (isPercent ? v / 100 : v));
  const wSum = weights.reduce((s, w) => s + w, 0);
  if (wSum <= 0) {
    // 目標全為 0 的安全防護：平均分配
    weights = allocation.value.map(() => 1 / allocation.value.length);
  } else {
    weights = weights.map(w => w / wSum);
  }

  // --- 未來總資產、現金池 ---
  const deltaCash = isWithdraw ? -Number(depositAmount.value || 0) : Number(depositAmount.value || 0);
  const futureTotal = Math.max(totalValue.value + deltaCash, 0);
  let cashPool = deltaCash;

  // 建立工作陣列
  const assets = allocation.value.map((a, idx) => {
    const currentValue = (a.currentPrice || 0) * (a.shares || 0);
    const targetValue = weights[idx] * futureTotal;
    const actualPctBefore = totalValue.value > 0 ? currentValue / totalValue.value : 0;
    return {
      ...a,
      weight: weights[idx],
      originalShares: a.shares || 0,
      currentValue,
      targetValue,
      actualPctBefore,
      sharesToBuy: 0,
      sharesToSell: 0,
      amount: 0,
      action: 'HOLD',
      executed: false
    };
  });

  // 邊界：總市值或 futureTotal 非正 → 不動
  if (totalValue.value <= 0 || futureTotal <= 0) {
    leftoverCash.value = isWithdraw ? -Number(depositAmount.value || 0) : Number(depositAmount.value || 0);
    return assets.map(a => ({
      ...a,
      actualPctAfter: a.actualPctBefore,
      amount: 0,
      sharesToBuy: 0,
      sharesToSell: 0,
      action: 'HOLD'
    }));
  }

  // 容忍閾值（避免小額噪音交易）
  const TOL = 0.0025; // 0.25%

  // -----------------------------
  // STEP 1：處理 withdraw 情境的賣出（deposit 時完全略過）
  // -----------------------------
  if (isWithdraw) {
    for (const a of assets) {
      if (!a.currentPrice || a.currentPrice <= 0) continue;
      // 只在顯著超標才賣
      if (a.currentValue > a.targetValue * (1 + TOL)) {
        const needToReduce = a.currentValue - a.targetValue;
        const maxSellableShares = Math.max(a.originalShares - a.sharesToSell, 0);
        const sharesToSell = Math.min(Math.floor(needToReduce / a.currentPrice), maxSellableShares);
        if (sharesToSell > 0) {
          const sellValue = sharesToSell * a.currentPrice;
          a.sharesToSell += sharesToSell;
          a.currentValue -= sellValue;
          a.action = 'SELL';
          cashPool += sellValue;
        }
      }
    }

    // 如果現金仍不足以提領 → 按比例再賣
    if (cashPool < 0) {
      let needMore = Math.abs(cashPool);
      const totalValueAfterStep1 = assets.reduce((s, a) => s + a.currentValue, 0);
      for (const a of assets) {
        if (needMore <= 0) break;
        if (!a.currentPrice || a.currentPrice <= 0 || a.currentValue <= 0) continue;
        const weight = totalValueAfterStep1 > 0 ? a.currentValue / totalValueAfterStep1 : 0;
        const sellAmount = Math.min(needMore * weight, a.currentValue);
        const maxSellableShares = Math.max(a.originalShares - a.sharesToSell, 0);
        const sharesToSell = Math.min(Math.floor(sellAmount / a.currentPrice), maxSellableShares);
        if (sharesToSell > 0) {
          const sellValue = sharesToSell * a.currentPrice;
          a.sharesToSell += sharesToSell;
          a.currentValue -= sellValue;
          a.action = 'SELL';
          needMore -= sellValue;
          cashPool += sellValue;
        }
      }
    }
  }

  // -----------------------------
  // STEP 2：買入（deposit 與 withdraw 都可能進入）
  //   2-1 先按「缺口比例」買一輪
  //   2-2 再用 greedy 逐股把零頭現金花掉
  // -----------------------------
  const underweights = () =>
    assets.filter(a =>
      a.currentPrice > 0 &&
      a.currentValue < a.targetValue * (1 - TOL)
    );

  const positiveAssets = underweights();
  const totalNeed = positiveAssets.reduce((sum, a) => sum + (a.targetValue - a.currentValue), 0);

  // 2-1 比例分配
  if (cashPool > 0 && totalNeed > 0) {
    for (const a of positiveAssets) {
      if (cashPool <= 0) break;
      const need = a.targetValue - a.currentValue;
      const weight = need / totalNeed;
      const buyBudget = Math.min(cashPool * weight, need);
      const sharesToBuy = Math.floor(buyBudget / a.currentPrice);
      if (sharesToBuy > 0) {
        const buyValue = sharesToBuy * a.currentPrice;
        a.sharesToBuy += sharesToBuy;
        a.currentValue += buyValue;
        a.action = 'BUY';
        cashPool -= buyValue;
      }
    }
  }

  // 2-2 greedy 逐股補（把零頭花掉）
  //    依「缺口/股價」由大到小優先（買得起者），同分時優先便宜的
  if (cashPool > 0) {
    let guard = 10000; // 安全閥避免意外死循環
    while (guard-- > 0) {
      const candidates = underweights()
        .filter(a => a.currentPrice <= cashPool + 1e-9);

      if (!candidates.length) break;

      candidates.sort((x, y) => {
        const rx = (x.targetValue - x.currentValue) / x.currentPrice;
        const ry = (y.targetValue - y.currentValue) / y.currentPrice;
        if (ry !== rx) return ry - rx;     // 缺口/股價大的優先
        return x.currentPrice - y.currentPrice; // 同分先買便宜的
      });

      const pick = candidates[0];
      pick.sharesToBuy += 1;
      pick.currentValue += pick.currentPrice;
      pick.action = 'BUY';
      cashPool -= pick.currentPrice;

      // 若現金不足以買任何一檔，結束
      const minPrice = Math.min(...underweights().map(a => a.currentPrice));
      if (!isFinite(minPrice) || cashPool < minPrice - 1e-9) break;
    }
  }

  // -----------------------------
  // STEP 3：更新 actualPctAfter / amount / action
  // -----------------------------
  for (const a of assets) {
    const buyValue = (a.sharesToBuy || 0) * (a.currentPrice || 0);
    const sellValue = (a.sharesToSell || 0) * (a.currentPrice || 0);
    const netFlow = buyValue - sellValue;

    a.amount = Math.round(netFlow * 100) / 100; // 數值型（非字串）
    a.actualPctAfter = a.currentValue / futureTotal;

    if (a.sharesToBuy > 0 && a.sharesToSell > 0) {
      a.action = netFlow > 0 ? 'BUY' : netFlow < 0 ? 'SELL' : 'HOLD';
    } else if (a.sharesToBuy > 0) {
      a.action = 'BUY';
    } else if (a.sharesToSell > 0) {
      a.action = 'SELL';
    } else {
      a.action = 'HOLD';
    }
  }

  // -----------------------------
  // STEP 4：紀錄剩餘現金（四捨五入避免 0.0000001 殘值）
  // -----------------------------
  leftoverCash.value = Math.round(cashPool * 100) / 100;

  return assets;
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
