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
    allocation.value = allocationData;
    
    await getHoldings();
    setData(allocationData);

    console.log('Fetched allocation:', allocationData);
    console.log('Fetched holdings:', holdings.value);
  } catch (error) {
    console.error('Error fetching allocation:', error);
  } finally {
    isLoading.value = false;
  }
};

const totalValue = ref(0);

const setData = (data) => {
    allocation.value = data.map(item => {
        // 根據 item.symbol 找到 holdings 中的對應項目，並加入 allocation 中 
        const holding = holdings.value.find(h => h.symbol === item.symbol);
        if (holding) {
            item.shares = holding.total_shares;
            item.avgCost = holding.avg_cost;
        }
        return item;
    })
};

const getHoldings = async () => {
    try {
        const holdings = await api.get(`http://localhost:3000/api/holdings/refresh?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}&get_current_prices=true`);
        console.log('Holdings prices refreshed:', holdings);
        holdings.value = holdings.map(item => ({
            id: item.id,
            symbol: item.symbol,
            name: item.name,
            assetType: item.asset_type,
            avgCost: parseFloat(item.avg_cost) || 0,
            shares: parseInt(item.total_shares) || 0,
            lastUpdated: item.last_updated.split('T')[0]
        }));
    } catch (error) {
        console.error('Error fetching current prices:', error);
    }
}

const futureValue = computed(() => {
  return totalValue.value + depositAmount.value;
});

function rebalanceAllocate(assets, depositAmount, priceMap) {
  const totalCurrentValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const futureTotal = totalCurrentValue + depositAmount;

  // 找出所有需要加碼的資產（目標比例 > 實際比例）
  const underAllocated = assets
    .map((a) => {
      const actualPct = a.currentValue / totalCurrentValue;
      const gap = a.targetPercentage - actualPct;
      return { ...a, gap, actualPct };
    })
    .filter((a) => a.gap > 0);

  const totalGap = underAllocated.reduce((sum, a) => sum + a.gap, 0);

  // 根據 gap 分配資金
  const allocationResult = underAllocated.map((a) => {
    const weight = a.gap / totalGap;
    const allocatedAmount = depositAmount * weight;
    const currentPrice = priceMap[a.symbol];
    const sharesToBuy = allocatedAmount / currentPrice;

    return {
      symbol: a.symbol,
      gap: a.gap.toFixed(4),
      weight: weight.toFixed(4),
      amount: allocatedAmount.toFixed(2),
      currentPrice,
      sharesToBuy: sharesToBuy.toFixed(4)
    };
  });

  return allocationResult;
};

const searchCurrentPrice = async (symbol) => {
  try {
    const data = await api.get(`http://localhost:3000/api/search/price/${symbol}`);
    console.log(`Search ${symbol} results:`, data);
    if (data.length === 1) {
        return data[0].close;
    } else {
        console.warn('No data found for symbol:', symbol);
        return null;
    }
  } catch (error) {
    console.error('Error fetching current price:', error);
    return null;
  }
};

const rebalancePortfolio = () => {
    // 取得各股票最新的股價
};

// 如果有用戶登入，則設定 uid
if (auth.user) {
    getData(); // 取得交易資料
} else {
    console.log('No user is logged in');
}

// 監聽 auth.user 的變化，如果有用戶變化則取得交易資料
watch(() => auth.user, (newUser) => {
    if (newUser) {
        getData();
    }
})

const depositAmount  = ref(null);
</script>
<template>
    <div class="flex items-center">
        <FloatLabel variant="on" class="mr-4">
            <InputNumber v-model="depositAmount " prefix="$" />
            <label for="on_label">Deposit Amount</label>
        </FloatLabel>
        <Button label="Rebalance" @click="rebalancePortfolio" />
        <Card>
            <template #title>Total Value</template>
            <template #content>
                <p class="m-0">
                    {{ totalValue }}
                </p>
            </template>
        </Card>
    </div>
</template>