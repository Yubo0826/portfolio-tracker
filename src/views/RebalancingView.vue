<script setup>
import { ref, watch, computed } from 'vue';
import api from '@/api';
import FloatLabel from 'primevue/floatlabel'
import Card from 'primevue/card';

import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';

const auth = useAuthStore();
const portfolioStore = usePortfolioStore();

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

  // Step 1: 計算每個資產的當前比例與差距
  const processed = allocation.value.map((a) => {
    const currentValue = (a.currentPrice || 0) * (a.shares || 0);
    const actualPctBefore = currentValue / totalValue.value;
    const gap = a.target / 100 - actualPctBefore;

    return {
      ...a,
      currentValue,
      actualPctBefore,
      gap
    };
  });

  console.log('Processed allocation:', processed);

  // Step 2: 計算總 gap，只考慮需要加碼的項目
  const totalGap = processed.reduce((sum, a) => a.gap > 0 ? sum + a.gap : sum, 0);

  // Step 3: 根據 gap 分配資金，考慮整股限制
  const result = processed.map((a) => {
    if (a.gap <= 0 || a.currentPrice <= 0) {
      return {
        ...a,
        gap: a.gap.toFixed(4),
        weight: "0.0000",
        amount: "0.00",
        sharesToBuy: "0",
        actualPctAfter: a.actualPctBefore.toFixed(4)
      };
    }

    const weight = a.gap / totalGap;
    const theoreticalAmount = depositAmount.value * weight;
    const sharesToBuy = Math.floor(theoreticalAmount / a.currentPrice);
    const actualAmount = sharesToBuy * a.currentPrice;
    const newValue = a.currentValue + actualAmount;
    const actualPctAfter = newValue / futureTotal;

    return {
      ...a,
      gap: a.gap.toFixed(4),
      weight: weight.toFixed(4),
      amount: actualAmount.toFixed(2),
      sharesToBuy: sharesToBuy.toFixed(0),
      actualPctAfter: actualPctAfter.toFixed(4)
    };
  });

  // Step 4: 可選 - 檢查總比重是否合理
  const totalAfter = result.reduce((sum, a) => sum + Number(a.actualPctAfter), 0);
  console.log("Total after allocation %:", (totalAfter * 100).toFixed(2));

  return result;
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

const depositAmount  = ref(10000);
</script>
<template>
    <div>
        <div class="flex items-center">
            <FloatLabel variant="on" class="mr-4">
                <InputNumber v-model="depositAmount " prefix="$" />
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

            <template #empty>
                <div class="p-4 text-center text-gray-500">
                <i class="pi pi-info-circle mr-2" />
                    現在並無資料。
                </div>
            </template>
        </DataTable>
    </div>
</template>