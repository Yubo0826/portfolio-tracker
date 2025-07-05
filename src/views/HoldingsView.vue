<script setup>
import { ref, onMounted } from 'vue';
import api from '../api.js';

import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()

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
        assetType: item.assetType,
        price: parseFloat(item.price) || 0,
        fee: parseFloat(item.fee) || 0,
        shares: parseInt(item.shares) || 0,
        transactionType: item.transaction_type,
        date: item.transaction_date.split('T')[0]
    }));
}

const getHoldings = async () => {
    if (!uid.value) {
        console.warn('No user ID found, cannot fetch holdings');
        return;
    }
    try {
        isLoading.value = true;
        const data = await api.get(`http://localhost:3000/api/holdings?uid=${uid.value}`);
        console.log('Fetched holdings:', data);
        setHoldings(data);
    } catch (error) {
        console.error('Error fetching holdings:', error);
    }
    finally {
        isLoading.value = false;
    }
}

// 如果有用戶登入，則設定 uid
if (auth.user) {
    uid.value = auth.user.uid; 
    getTransactions(); // 取得交易資料
    console.log('User is logged in:', auth.user);
} else {
    console.log('No user is logged in');
}
</script>
<template>
  <div>
    <h1>持有資產</h1>
    <p>這裡將顯示您的持有資產列表。</p>
    <DataTable v-model:selection="selectedAssets" :value="holdings" :loading="isLoading" dataKey="id" tableStyle="min-width: 50rem">
        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
        <Column field="symbol" header="Symbol"></Column>
        <Column field="name" header="Name"></Column>
        <Column field="shares" header="Shares"></Column>
        <Column field="avg_cost" header="Averge Cost"></Column>
        <Column field="last_updated" header="Lastest Date"></Column>

        <template #empty>
            <div class="p-4 text-center text-gray-500">
            <i class="pi pi-info-circle mr-2" />
                現在並無資料。
            </div>
        </template>
    </DataTable>
  </div>
</template>