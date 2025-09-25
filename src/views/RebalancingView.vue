<script setup>
import { ref, watch, computed } from 'vue';
import api from '@/utils/api';
import FloatLabel from 'primevue/floatlabel'

import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';
const auth = useAuthStore();
const portfolioStore = usePortfolioStore();

import { useToast } from "primevue/usetoast";
const toast = useToast();

const allocation = ref([]);
const holdings = ref([]);
const isLoading = ref(false);

const totalValue = ref(0);
const rebalanceResult = ref([]);
const depositAmount  = ref(10000);

const getData = async () => {
  try {
    isLoading.value = true;
    if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
    const allocationData  = await api.get(
      `http://localhost:3000/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`
    );
    allocation.value = allocationData.map(item => ({
      symbol: item.symbol,
      name: item.name,
      target: Number(item.target) || 0,
    }));
    
    await getHoldings();
    setData(allocationData);

    console.log('Fetched allocation:', allocationData);
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
    const data = await api.post(`http://localhost:3000/api/holdings/refresh-prices`, payload);
    console.log('Holdings prices refreshed:', data);
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
};

const clickRebalance = () => {
  if (depositAmount.value < 0) {
    console.warn('Deposit amount must be >= 0');
    return;
  }
  const newAllocation = rebalanceAllocate();
  console.log('Rebalance allocation:', newAllocation);
  rebalanceResult.value = newAllocation;
};

function rebalanceAllocate() {
  const futureTotal = totalValue.value + depositAmount.value;

  const result = allocation.value.map((a) => {
    const currentValue = (a.currentPrice || 0) * (a.shares || 0);
    const actualPctBefore = currentValue / totalValue.value || 0;
    const targetValue = (a.target / 100) * futureTotal;
    const requiredValue = targetValue - currentValue; // 正：要補，負：要減

    return {
      ...a,
      currentValue,
      actualPctBefore,
      targetValue,
      requiredValue
    };
  });

  console.log('Rebalance result (raw):', result);

  const allocationResult = result.map((a) => {
    if (a.currentPrice <= 0) {
      return {
        ...a,
        sharesToBuy: 0,
        sharesToSell: 0,
        action: "HOLD",
        amount: 0,
        actualPctAfter: (a.currentValue / futureTotal).toFixed(4)
      };
    }

    let sharesToBuy = 0;
    let sharesToSell = 0;
    let actualAmount = 0;

    if (a.requiredValue > 0) {
      sharesToBuy = Math.floor(a.requiredValue / a.currentPrice);
      actualAmount = sharesToBuy * a.currentPrice;
    } else if (a.requiredValue < 0) {
      sharesToSell = Math.floor(Math.abs(a.requiredValue) / a.currentPrice);
      sharesToSell = Math.min(sharesToSell, a.shares || 0);
      actualAmount = -(sharesToSell * a.currentPrice);
    }

    const newValue = a.currentValue + actualAmount;
    const actualPctAfter = newValue / futureTotal;

    return {
      ...a,
      sharesToBuy,
      sharesToSell,
      action: sharesToBuy > 0 ? "BUY" : (sharesToSell > 0 ? "SELL" : "HOLD"),
      amount: actualAmount.toFixed(2),
      actualPctAfter: actualPctAfter.toFixed(4)
    };
  });

  const used = allocationResult.reduce((sum, a) => sum + Number(a.amount), 0);
  const leftover = depositAmount.value - used;
  console.log("Unused Cash:", leftover.toFixed(2));

  return allocationResult;
}

// 初始載入
if (auth.user) {
  getData();
} else {
  console.log('No user is logged in');
}

watch(
  () => [auth.user?.uid, portfolioStore.currentPortfolio?.id],
  ([uid, pid]) => {
    if (uid && pid) getData();
  },
  { immediate: true }
);

// ------------------------交易邏輯------------------------

const transactionDialog = ref(false);

const newTransaction = ref({
  symbol: '',
  shares: 0,
  price: 0,
  fee: 0,
  date: new Date(),
  type: 'buy'
});

const addTransaction = (data) => {
  console.log('Adding transaction:', data);
  newTransaction.value = {
    symbol: data.symbol,
    name: data.name,
    shares: data.sharesToBuy > 0 ? Number(data.sharesToBuy) : Number(data.sharesToSell),
    price: Number(data.currentPrice) || 0,
    fee: 0,
    date: new Date(),
    type: data.action.toLowerCase()
  };
  transactionDialog.value = true;
};

const hasError = computed(() => {
  return !newTransaction.value.symbol || !newTransaction.value.shares || !newTransaction.value.price;
});

const saveTransaction = async () => {
  if (hasError.value) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please fill in all required fields.',
      life: 3000
    });
    return;
  }

  if (newTransaction.value.fee < 0) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Fee cannot be negative.',
      life: 3000
    });
    return;
  }

  const payload = {
    uid: auth.user.uid,
    portfolio_id: portfolioStore.currentPortfolio.id,
    symbol: newTransaction.value.symbol,
    shares: newTransaction.value.shares,
    name: newTransaction.value.name,
    asset_type: newTransaction.value.asset_type,
    fee: newTransaction.value.fee || 0,
    price: newTransaction.value.price,
    transaction_type: newTransaction.value.type,
    transaction_date: newTransaction.value.date.toISOString().split('T')[0]
  };

  console.log('Saving transaction payload:', payload);

  try {
    const result = await api.post('http://localhost:3000/api/transactions', payload);
    console.log('Transaction saved:', result);
    resetDialog();
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Transaction added successfully.',
      life: 3000
    });
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Error saving transaction',
      life: 3000
    });
  }
  finally {
    transactionDialog.value = false;
  }
};

const resetDialog = () => {
  newTransaction.value = {
    symbol: '',
    shares: 0,
    price: 0,
    fee: 0,
    date: new Date(),
    type: 'buy'
  };
  transactionDialog.value = false;
};

const transactionType = ref([
  { name: 'Buy', code: 'buy' },
  { name: 'Sell', code: 'sell' }
]);

</script>

<template>
  <div>
    <div class="flex justify-center items-center mb-4">
      <FloatLabel variant="on" class="mr-4">
        <InputNumber v-model="depositAmount" prefix="$" />
        <label for="on_label">Deposit Amount</label>
      </FloatLabel>
      <Button label="Rebalance" @click="clickRebalance" />
    </div>

    <!-- Dialog -->
    <Dialog v-model:visible="transactionDialog" @hide="resetDialog" modal :style="{ width: '30rem' }">
      <template #header>
        <div class="inline-flex items-center justify-center gap-2">
          <span class="font-bold whitespace-nowrap">New Transaction</span>
        </div>    
      </template>

      <div class="flex items-center gap-4 mb-4">
        <label for="date" class="font-semibold w-24">Date*</label>
        <DatePicker v-model="newTransaction.date" showIcon fluid iconDisplay="input" placeholder="交易日期" />
      </div>
      <div class="flex items-center gap-4 mb-4">
        <label for="symbol" class="font-semibold w-24">Symbol*</label>
        <InputText v-model="newTransaction.symbol" disabled></InputText>
      </div>
      <div class="flex items-center gap-4 mb-4">
        <label for="shares" class="font-semibold w-24">Shares*</label>
        <InputNumber v-model="newTransaction.shares" class="flex-auto" />
      </div>
      <div class="flex items-center gap-4 mb-4">
        <label for="price" class="font-semibold w-24">Price*</label>
        <InputText v-model="newTransaction.price" class="flex-auto" placeholder="交易當時價格" />
      </div>
      <div class="flex items-center gap-4 mb-8">
        <label for="operation" class="font-semibold w-24">Operation</label>
        <SelectButton v-model="newTransaction.type" :options="transactionType" disabled optionLabel="name" optionValue="code" />
      </div>
      <div class="flex items-center gap-4 mb-8">
        <label for="fee" class="font-semibold w-24">Fee</label>
        <InputNumber v-model="newTransaction.fee" class="flex-auto" showButtons />
      </div>
      <div class="flex items-center gap-4 mb-8">
        <label for="operation" class="font-semibold w-24">Total</label>
        $ {{ Math.round((newTransaction.shares * newTransaction.price + newTransaction.fee) * 100) / 100 }} USD
      </div>
      <div class="flex justify-end gap-2">
        <Button type="button" label="Cancel" severity="secondary" @click="resetDialog()" />
        <Button v-if="hasError" type="button" label="Add" disabled />
        <Button v-else type="button" label="Add" @click="saveTransaction" />
      </div>
    </Dialog>
        
    <DataTable :value="rebalanceResult" :loading="isLoading" dataKey="id" tableStyle="min-width: 50rem">
      <Column field="symbol" header="Symbol"></Column>
      <Column field="name" header="Name"></Column>
      <Column field="shares" header="Current Shares"></Column>
      <Column field="target" header="Target (%)">
        <template #body="slotProps">
          <div>
            <span>
              {{ (slotProps.data.actualPctBefore * 100).toFixed(2) }} %
            </span>
            <span>
              <i class="pi pi-arrow-right mx-2" />
              {{ (Number(slotProps.data.actualPctAfter) * 100).toFixed(2) }} %
            </span>
            <br />
            <span class="text-xs text-gray-500">
              (Target: {{ slotProps.data.target }}%)
            </span>
          </div>
        </template>
      </Column>
      <Column field="amount" header="Amount ($)"></Column>
      <Column field="sharesToBuy" header="Buy"></Column>
      <Column field="sharesToSell" header="Sell"></Column>
      <Column field="action" header="Action"></Column>
      <Column header="">
        <template #body="slotProps">
          <div class="flex justify-end" v-if="slotProps.data.action !== 'HOLD'">
            <Button icon="pi pi-plus" class="p-button-rounded p-button-text" severity="success" @click="addTransaction(slotProps.data)" />
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
