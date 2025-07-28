
<template>
<div>
    <div class="flex flex-col sm:flex-row w-full gap-4 mb-12">
        <!-- Total Value Card -->
        <Card class="w-full md:w-1/2 rounded-xl shadow-md">
            <template #title>
                <div class="text-sm font-semibold">Total Value</div>
            </template>
            <template #content>
                <div class="flex justify-between items-center mt-2">
                <div class="text-2xl font-bold">$3879.76</div>
                <div class="text-lg font-bold">$</div>
                </div>
            </template>
        </Card>

        <!-- Total Profit Card -->
        <Card class="w-full md:w-1/2 rounded-xl shadow-md">
            <template #title>
                <div class="text-sm font-semibold">Total Profit
                    <i class="pi pi-question-circle" v-tooltip.bottom="'總收益 = 總市值 - 總成本'"></i>
                </div>
            </template>
            <template #content>
                <div class="flex justify-between items-center mt-2">
                <div class="text-2xl font-bold">$843.64</div>
                <div class="text-lg font-bold">$</div>
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
                    <apexchart width="380" type="donut" :options="holdingsChart" :series="allocationSeries"></apexchart>
                </div>
                <div class="text-sm text-gray-500 mb-4">各股目標配置的比例</div>
            </template>
        </Card>
    </div>

    <Card>
        <template #content>
            <DataTable :value="holdings" :loading="isLoading" dataKey="id" tableStyle="min-width: 50rem">
                <!-- Name -->
                <Column field="name" header="資產" style="width: 40%">
                    <template #body="{ data }">
                        <div>
                            <!-- <img :src="data.icon" class="w-5 h-5 mr-2" /> -->
                            <span class="font-bold mr-4">{{ data.symbol }}</span>
                            <div class="">{{ data.name }}</div>
                        </div>
                    </template>
                </Column>
        
                <Column field="shares" header="持有股數"></Column>
                <Column field="avgCost" header="平均成本"></Column>
                <Column field="totalCost" header="交易金額"></Column>
                <Column field="currentPrice" header="市值"></Column>
                <Column field="currentValue" header="總市值"></Column>
                <Column field="target" header="配置比例">
                    <template #body="{ data }">
                        <span class="font-bold mr-4">{{ data.target }}%</span>
                        <div>{{ ((data.currentValue / totalValue) * 100).toFixed(1) }}%</div>
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
import Card from 'primevue/card';
import { ref, watch, computed } from 'vue';
import api from '@/api';

import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';
const auth = useAuthStore();
const portfolioStore = usePortfolioStore();

const holdings = ref([]);
const isLoading = ref(false);
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
            totalCost: parseFloat(item.avg_cost) * (parseInt(item.total_shares) || 0) || 0,
            shares: parseInt(item.total_shares) || 0,
            lastUpdated: item.last_updated.split('T')[0],
            currentValue: parseFloat(item.current_price) * (parseInt(item.total_shares) || 0) || 0,
            target: parseFloat(item.target_percentage) || 0
        }));
        setChartData();
    } catch (error) {
        console.error('Error fetching current prices:', error);
    }
}

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

const holdingsSeries = computed(() => {
    return holdings.value.map(holding => holding.currentValue);
});

const allocationSeries = computed(() => {
    return holdings.value.map(holding => holding.target);
});

// 如果有用戶登入，則設定 uid
if (auth.user) {
    getHoldings(); // 取得交易資料
} else {
    console.log('No user is logged in');
}

watch(
  () => [auth.user?.uid, portfolioStore.currentPortfolio?.id],
  ([uid, pid]) => {
    if (uid && pid) getHoldings();
  },
  { immediate: true }
);
</script>