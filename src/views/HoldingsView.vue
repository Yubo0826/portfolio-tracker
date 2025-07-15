<script setup>
import { ref, watch } from 'vue';
import api from '../api.js';

import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()

import { usePortfolioStore } from '@/stores/portfolio';
const portfolioStore = usePortfolioStore()

const holdings = ref([]);
const selectedHoldings = ref([]);
const isLoading = ref(true);

// 根據 google 登入的用戶 ID 取得資料
const uid = ref(null);


const setHoldings = (data) => {
    holdings.value = data.map(item => ({
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        assetType: item.asset_type,
        avgCost: parseFloat(item.avg_cost) || 0,
        shares: parseInt(item.total_shares) || 0,
        transactionType: item.transaction_type,
        lastUpdated: item.last_updated.split('T')[0]
    }));
}

const getHoldings = async () => {
    if (!uid.value) {
        console.warn('No user ID found, cannot fetch holdings');
        return;
    }
    try {
        isLoading.value = true;
        const data = await api.get(`http://localhost:3000/api/holdings?uid=${uid.value}&portfolio_id=${portfolioStore.currentPortfolio?.id}`);
        console.log('Fetched holdings:', data);
        setHoldings(data);
    } catch (error) {
        console.error('Error fetching holdings:', error);
    }
    finally {
        isLoading.value = false;
    }
}

const deleteSelectedHoldings = async () => {
    if (selectedHoldings.value.length === 0) {
        console.warn('No holdings selected for deletion');
        return;
    }
    try {
        isLoading.value = true;
        const idsToDelete = selectedHoldings.value.map(item => item.id);
        console.log('Deleted holdings:', idsToDelete);
        const payload = {
            uid: uid.value,
            portfolio_id: portfolioStore.currentPortfolio?.id,
            ids: idsToDelete
        }
        await api.delete(`http://localhost:3000/api/holdings?uid=${uid.value}`, payload);
        getHoldings(); // 重新取得交易資料
    } catch (error) {
        console.error('Error deleting holdings:', error);
    } finally {
        isLoading.value = false;
    }
}



// 如果有用戶登入，則設定 uid
if (auth.user) {
    uid.value = auth.user.uid; 
    getHoldings(); // 取得交易資料
    console.log('User is logged in:', auth.user);
} else {
    console.log('No user is logged in');
}

/*
    1. 監聽 auth.user 的變化，如果有用戶登入則取得交易資料
    2. 如果已在登入狀態下刷新瀏覽器 auth.user 會自動重新登入
*/

watch(() => auth.user, (newUser) => {
  if (newUser) {
    uid.value = newUser.uid;
    getHoldings(); // 取得交易資料
  }
})

</script>
<template>
  <div>
    <div class="flex justify-end mb-4">
        <Button label="Delete" @click="deleteSelectedHoldings" icon="pi pi-trash" class="mr-2" severity="danger" />
    </div>
    <DataTable v-model:selection="selectedHoldings" :value="holdings" :loading="isLoading" dataKey="id" tableStyle="min-width: 50rem">
        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
        <Column field="symbol" header="Symbol"></Column>
        <Column field="name" header="Name"></Column>
        <Column field="shares" header="Shares"></Column>
        <Column field="avgCost" header="Averge Cost"></Column>
        <Column field="lastUpdated" header="Lastest Date"></Column>

        <template #empty>
            <div class="p-4 text-center text-gray-500">
            <i class="pi pi-info-circle mr-2" />
                現在並無資料。
            </div>
        </template>
    </DataTable>
  </div>
</template>