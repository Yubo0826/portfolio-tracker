
<template>
<div>
    <div class="flex flex-col sm:flex-row w-full gap-4 mb-12">
        <!-- Total Value Card -->
        <Card class="w-full md:w-1/2 rounded-xl shadow-md">
            <template #title>
                <div class="text-sm font-semibold">{{ $t('totalValue') }}</div>
            </template>
            <template #content>
                <div class="flex justify-between items-center mt-2">
                <div class="text-2xl font-bold">{{ totalValue.toFixed(1) }}</div>
                <div class="text-lg font-bold">$</div>
                </div>
            </template>
        </Card>

        <!-- Total Profit Card -->
        <Card class="w-full md:w-1/2 rounded-xl shadow-md">
            <template #title>
                <div class="text-sm font-semibold">
                    {{ $t('totalProfit') }}
                    <i class="pi pi-question-circle" v-tooltip.bottom="'總收益 = 總市值 - 總成本'"></i>
                </div>
            </template>
            <template #content>
                <div class="flex justify-between items-center mt-2">
                    <!-- <div class="bg-[#5cd59b] text-sm px-2 py-1 rounded-md flex items-center gap-1">
                        <i class="pi pi-arrow-up text-xs"></i>
                        <span>4.2%</span>
                    </div> -->
                    <div class="text-2xl font-bold">{{ totalProfit.toFixed(1) }}</div>
                    <div class="text-lg font-bold">$</div>
                </div>
            </template>
        </Card>

        <!-- XIRR Card -->
        <Card class="w-full md:w-1/2 rounded-xl shadow-md">
            <template #title>
                <div class="text-sm font-semibold">IRR</div>
            </template>
            <template #content>
                <div class="flex justify-between items-center mt-2">
                <div class="text-2xl font-bold">{{ irr }}</div>
                <div class="text-lg font-bold">%</div>
                </div>
            </template>
        </Card>
    </div>

    <div class="flex flex-col sm:flex-row w-full gap-4 mb-12">
        <Card class="w-full md:w-1/2">
            <template #title>
                <div class="text-sm font-semibold">Holdings Overview</div>
            </template>
            <template #content>
                <div class="flex justify-between items-center mb-4">
                    <apexchart width="380" type="donut" :options="holdingsChart" :series="holdingsSeries"></apexchart>
                </div>
                <div class="text-sm text-gray-500 mb-4">各股占總值的比例</div>
            </template>
        </Card>
        <Card class="w-full md:w-1/2">
            <template #title>
                <div class="text-sm font-semibold">Allocation Overview</div>
            </template>
            <template #content>
                <div class="flex justify-between items-center mb-4">
                    <apexchart width="380" type="donut" :options="allocationChart" :series="allocationSeries"></apexchart>
                </div>
                <div class="text-sm text-gray-500 mb-4">各股目標配置的比例</div>
            </template>
        </Card>
    </div>

    <Card>
        <template #content>
            <DataTable :value="holdings" :loading="isLoading" sortField="currentValue" :sortOrder="-1" dataKey="id" tableStyle="min-width: 50rem">
                <!-- Name -->
                <Column field="name" header="現在資產" style="width: 40%">
                    <template #body="{ data }">
                        <div @click="() => $router.push({ name: 'asset', params: { symbol: data.symbol } })" class="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-md">
                            <StockIcon :symbol="data.symbol" class="mr-8"></StockIcon>                        
                            <div>
                                <span class="font-bold mr-4">{{ data.symbol }}</span>
                                <div>{{ data.name }}</div>
                            </div>
                        </div>
                    </template>
                </Column>
        
                <Column field="shares" header="持有股數"></Column>
                <Column field="totalCost" header="交易金額"></Column>
                <Column field="currentPrice" header="市值"></Column>
                <Column field="currentValue" header="總市值" sortable></Column>
                <Column field="target" header="配置比例">
                    <template #body="{ data }">
                        <span class="font-bold mr-4">{{  ((data.currentValue / totalValue) * 100).toFixed(1) }}%</span>
                        <div>{{ data.target || 0 }}%</div>
                    </template>
                </Column>

                <template #empty>
                    <div class="p-4 text-center text-gray-500">
                    <i class="pi pi-info-circle mr-2" />
                        現在並無資料。
                    </div>
                </template>
            </DataTable>
        </template>
    </Card>

</div>
</template>
<script setup>
import StockIcon from '@/components/StockIcon.vue';
import Card from 'primevue/card';
import { ref, watch, computed } from 'vue';
import api from '@/api';
import xirr from 'xirr';

import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';
const auth = useAuthStore();
const portfolioStore = usePortfolioStore();

const isLoading = ref(false);

const holdings = ref([]);

// 取得持股資料
const getHoldings = async () => {
    try {
        const data = await api.get(`http://localhost:3000/api/holdings/?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`);
        console.log('Holdings prices refreshed:', data);
        setHoldings(data);
    } catch (error) {
        console.error('Error fetching current prices:', error);
    }
}

const setHoldings = (data) => {
  holdings.value = data.map(item => {
    const shares = parseInt(item.total_shares) || 0;
    const avgCost = parseFloat(item.avg_cost) || 0;
    const currentPrice = parseFloat(item.current_price) || 0;
    const target = parseFloat(item.target_percentage) || 0;
    const lastUpdated = item.last_updated?.split('T')[0] || '';

    const totalCost = avgCost * shares;
    const currentValue = Math.round(currentPrice * shares * 100) / 100;

    return {
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      assetType: item.asset_type,
      shares,
      avgCost,
      currentPrice,
      totalCost,
      currentValue,
      target,
      lastUpdated
    };
  });

  setChartData();
};

const allocation = ref([]);

// 取得資產配置資料
const getAllocation = async () => {
  try {
    if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
    const data = await api.get(`http://localhost:3000/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`);
    console.log('Fetched allocation:', data);
    allocation.value = data;
  } catch (error) {
    console.error('Error fetching allocation:', error);
  }
};

const transactions = ref([]);

// 取得交易資料
const getTransactions = async () => {
    try {
        if (portfolioStore.currentPortfolio) {
            const data = await api.get(`http://localhost:3000/api/transactions?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`);
            setTransactions(data.transactions);
        }
    } catch (error) {
        console.error(error);
    }
};

const setTransactions = (data) => {
    transactions.value = data.map(item => ({
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        assetType: item.assetType,
        price: parseFloat(item.price) || 0,
        fee: parseFloat(item.fee) || 0,
        shares: parseInt(item.shares) || 0,
        transactionType: item.transaction_type,
        date: item.transaction_date.split('T')[0]
    }));
};

const dividends = ref([]);

const getDividends = async () => {
  try {
    const data = await api.get(`http://localhost:3000/api/dividends?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`);
    console.log('Dividends data:', data);
    setDividends(data);
  } catch (error) {
    console.error('Error fetching dividends:', error);
  }
};

const setDividends = (data) => {
  dividends.value = data.map(item => {
    return {
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      shares: item.shares,
      amount: item.amount,
      totalAmount: (item.shares * item.amount).toFixed(2),
      date: item.date.slice(0, 10) // 格式化日期為 YYYY-MM-DD
    };
  });
};

const totalValue = ref(0);
const totalProfit = ref(0);

const setChartData = () => {
    totalValue.value = holdings.value.reduce((sum, holding) => sum + holding.currentValue, 0);
    totalProfit.value = holdings.value.reduce((sum, holding) => sum + (holding.currentValue - holding.avgCost * holding.shares), 0);
}

// 各股占總值的比例
const holdingsChart = computed(() => ({
  chart: {
    type: 'donut',
  },
  labels: holdings.value.map(holding => holding.symbol),
  responsive: [
    {
      breakpoint: 480,
      options: {
        legend: {
          position: 'bottom'
        }
      }
    }
  ]
}));

// 各股目標配置的比例
const allocationChart = computed(() => ({
  chart: {
    type: 'donut',
  },
  labels: allocation.value.map(a => a.symbol),
  responsive: [
    {
      breakpoint: 480,
      options: {
        legend: {
          position: 'bottom'
        }
      }
    }
  ]
}));


const holdingsSeries = computed(() => {
    return holdings.value.map(holding => holding.currentValue);
});

const allocationSeries = computed(() => {
    return allocation.value.map(a => a.target);
});

const irr = computed(() => {
  if (!transactions.value.length || !holdings.value.length) return null;

  const cashflows = [];

  // 處理所有交易紀錄
  transactions.value.forEach(tx => {
    const amount = (tx.price * tx.shares + tx.fee) * (tx.transactionType === 'buy' ? -1 : 1);
    cashflows.push({
      amount,
      when: new Date(tx.date),
    });
  });

  dividends.value.forEach(d => {
    cashflows.push({
        amount: parseFloat(d.totalAmount),
        when: new Date(d.date),
    });
  });

  // 加入當前總市值作為最後一筆現金流入
  cashflows.push({
    amount: holdings.value.reduce((sum, h) => sum + h.currentValue, 0),
    when: new Date(),
  });

  console.log('Cashflows for XIRR:', cashflows);

  try {
    const rate = xirr(cashflows);
    return (rate * 100).toFixed(2); // 轉成百分比顯示
  } catch (error) {
    console.error('Error calculating XIRR:', error);
    return 'N/A';
  }
});

const getData = async () => {
    isLoading.value = true;
    try {
        await getHoldings();
        await getAllocation();
        await getTransactions();
        await getDividends();
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        isLoading.value = false;
    }
};

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


</script>