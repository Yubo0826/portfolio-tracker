<script setup>
import { ref, watch, computed } from 'vue';
import api from '@/api';
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

const getData = async () => {
  try {
    isLoading.value = true;
    if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
    const allocationData  = await api.get(`http://localhost:3000/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`);
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

const totalValue = ref(0);

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
        // 根據 item.symbol 找到 holdings 中的對應項目，並加入 allocation 中 
        const holding = holdings.value.find(h => h.symbol === item.symbol);
        if (holding) {
            console.log('Found holding for symbol:', holding);
            item.shares = holding.shares || 0;
            item.currentPrice = holding.currentPrice || 0;
        }
        return item;
    })

    // 計算 totalValue
    totalValue.value = allocation.value.reduce((sum, item) => {
        const currentValue = (item.currentPrice || 0) * (item.shares || 0);
        return sum + currentValue;
    }, 0);
};

const rebalanceResult = ref([]);
const depositAmount  = ref(10000);

const clickRebalance = () => {
    if (depositAmount.value <= 0) {
        console.warn('Deposit amount must be greater than zero');
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
    const requiredValue = targetValue - currentValue;  // 需要補的金額

    return {
      ...a,
      currentValue,
      actualPctBefore,
      requiredValue
    };
  });

  console.log('Rebalance result:', result);

  // 計算總需求值（只算需要補的）
  const totalRequired = result.reduce((sum, a) => a.requiredValue > 0 ? sum + a.requiredValue : sum, 0);

  // 分配資金（整股邏輯）
  const allocationResult = result.map((a) => {
    if (a.requiredValue <= 0 || a.currentPrice <= 0) {
      return {
        ...a,
        weight: 0,
        amount: 0,
        sharesToBuy: 0,
        actualPctAfter: (a.currentValue / futureTotal).toFixed(4)
      };
    }

    const weight = a.requiredValue / totalRequired;
    const amount = depositAmount.value * weight;
    const sharesToBuy = Math.floor(amount / a.currentPrice);
    const actualAmount = sharesToBuy * a.currentPrice;
    const newValue = a.currentValue + actualAmount;
    const actualPctAfter = newValue / futureTotal;

    return {
      ...a,
      weight: weight.toFixed(4),
      amount: actualAmount.toFixed(2),
      sharesToBuy: sharesToBuy.toFixed(0),
      actualPctAfter: actualPctAfter.toFixed(4)
    };
  });

  // 可選：列出剩餘現金
  const used = allocationResult.reduce((sum, a) => sum + Number(a.amount), 0);
  const leftover = depositAmount.value - used;
  console.log("Unused Cash:", leftover.toFixed(2));

  return allocationResult;
}



// 如果有用戶登入，則設定 uid
if (auth.user) {
    getData(); // 取得交易資料
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

// 以下是交易相關的邏輯

const transactionDialog = ref(false);

const newTransaction = ref({
    symbol: '',
    shares: 0,
    price: 0,
    fee: 0,
    date: new Date(),
    type: 'buy' // 預設為買入
});

// 添加交易
const addTransaction = (data) => {
    console.log('Adding transaction:', data);
    // 在這裡處理添加交易的邏輯
    newTransaction.value = {
        symbol: data.symbol,
        name: data.name,
        shares: Number(data.sharesToBuy) || 0,
        price: Number(data.currentPrice) || 0,
        fee: 0,
        date: new Date(),  // 資料庫要存current date
        type: 'buy'
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
            summary: 'Error Message',
            detail: 'Please fill in all required fields.',
            life: 3000
        });
        return;
    }

    if (newTransaction.value.fee < 0) {
        toast.add({
            severity: 'error',
            summary: 'Error Message',
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
        // 新增交易
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
            summary: 'Error Message',
            detail: err.message || 'An error occurred while saving the transaction',
            life: 3000
        });
    }
    finally {
        transactionDialog.value = false;
        // getHoldings();
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
        <Toast />
        <div class="flex items-center mb-4">
            <FloatLabel variant="on" class="mr-4">
                <InputNumber v-model="depositAmount" prefix="$" />
                <label for="on_label">Deposit Amount</label>
            </FloatLabel>
            <Button label="Rebalance" @click="clickRebalance" />

            <!-- <Card>
                <template #title>Total Value</template>
                <template #content>
                    <p class="m-0">
                        {{ totalValue }}
                    </p>
                </template>
            </Card> -->
    
    
        </div>

        <!-- Dialog for transaction -->
        <Dialog v-model:visible="transactionDialog" @hide="resetDialog" modal :style="{ width: '30rem' }">
            <template #header>
                <div class="inline-flex items-center justify-center gap-2">
                    <span class="font-bold whitespace-nowrap">New Transaction</span>
                </div>    
            </template>
            <span class="text-surface-500 dark:text-surface-400 block mb-8">
                <span>
                    先選擇日期，然後填入股票代碼，系統會自動查詢當天的價格。<br />
                </span>
            </span>
            <div class="flex items-center gap-4 mb-4">
                <label for="date" class="font-semibold w-24">
                    Date
                    <span style="color: #f27362;">*</span>
                </label>
                <DatePicker v-model="newTransaction.date" showIcon fluid iconDisplay="input" placeholder="交易的日期" />
            </div>
            <div class="flex items-center gap-4 mb-4">
                <label for="symbol" class="font-semibold w-24">
                    Symbol
                    <span style="color: #f27362;">*</span>
                </label>
                <InputText v-model="newTransaction.symbol" disabled></InputText>
                <!-- <AutoComplete
                    v-model="selectedSymbol"
                    optionLabel="symbol"
                    :suggestions="filteredSymbols"
                    @complete="debouncedSearch"
                    @item-select="onItemSelect"
                    :delay="600" 
                    /> -->
            </div>
            <div class="flex items-center gap-4 mb-4">
                <label for="shares" class="font-semibold w-24">
                    Shares
                    <span style="color: #f27362;">*</span>
                </label>
                <InputNumber v-model="newTransaction.shares" id="shares" class="flex-auto" autocomplete="off" />
            </div>
            <div class="flex items-center gap-4 mb-4">
                <label for="price" class="font-semibold w-24">
                    Price
                    <span style="color: #f27362;">*</span>
                </label>
                <InputText v-model="newTransaction.price" id="price" class="flex-auto" autocomplete="off" placeholder="請輸入交易當時的價格" />
            </div>
            <div class="flex items-center gap-4 mb-8">
                <label for="operation" class="font-semibold w-24">Operation</label>
                <SelectButton v-model="newTransaction.type" :options="transactionType" disabled optionLabel="name" optionValue="code" />
            </div>
            <div class="flex items-center gap-4 mb-8">
                <label for="fee" class="font-semibold w-24">Fee</label>
                <InputNumber v-model="newTransaction.fee" id="fee" class="flex-auto" showButtons autocomplete="off" />
            </div>
            <div class="flex items-center gap-4 mb-8">
                <label for="operation" class="font-semibold w-24">Total</label>
                ${{ newTransaction.shares * newTransaction.price + newTransaction.fee }} USD
            </div>
            <div class="flex justify-end gap-2">
                <Button type="button" label="Cancel" severity="secondary" @click="resetDialog()"></Button>
                <Button v-if="hasError" type="button" label="Add" v-tooltip.bottom="'請填入完整信息'" bottom disabled></Button>
                <Button v-else type="button" label="Add" bottom @click="saveTransaction"></Button>
            </div>
        </Dialog>
        
        <DataTable :value="rebalanceResult" :loading="isLoading" dataKey="id" tableStyle="min-width: 50rem">
            <Column field="symbol" header="Symbol"></Column>
            <Column field="name" header="Name"></Column>
            <Column field="shares" header="Shares"></Column>
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
            <Column field="amount" header="To Cost"></Column>
            <Column field="sharesToBuy" header="To Buy Shares"></Column>
            <Column field="" header="">
                <template #body="slotProps">
                    <div class="flex justify-end" v-if="slotProps.data && slotProps.data.sharesToBuy > 0">
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