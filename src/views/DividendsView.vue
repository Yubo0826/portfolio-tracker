<template>
    <div>
      <div class="flex justify-end mb-4">
          <Button label="Refresh Prices" @click="refreshDividends" icon="pi pi-refresh" class="mr-2" />
      </div>
      <DataTable :value="dividends" :loading="isLoading" dataKey="id" tableStyle="min-width: 50rem">
          <Column field="symbol" header="Symbol"></Column>
          <Column field="name" header="Name"></Column>
          <Column field="shares" header="Shares"></Column>
          <Column field="amount" header="Amount"></Column>
          <Column field="totalAmount" header="Total Amount"></Column>
          <Column field="date" header="Date"></Column>
          <template #empty>
              <div class="p-4 text-center text-gray-500">
              <i class="pi pi-info-circle mr-2" />
                  現在並無資料。
              </div>
          </template>
      </DataTable>
    </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import api from '../api.js';

import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()

import { usePortfolioStore } from '@/stores/portfolio';
const portfolioStore = usePortfolioStore()

const isLoading = ref(false);
const dividends = ref([]);

const getDividends = async () => {
  isLoading.value = true;
  try {
    const data = await api.get(`http://localhost:3000/api/dividends?uid=${auth.user.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`);
    setDividends(data);
  } catch (error) {
    console.error('Error fetching dividends:', error);
  } finally {
    isLoading.value = false;
  }
};

const setDividends = (data) => {
  dividends.value = data.map(item => {
    return {
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      shares: item.total_shares,
      amount: item.amount,
      totalAmount: (item.shares * item.amount).toFixed(2),
      date: item.date,
    };
  });
};

const refreshDividends = async () => {
  isLoading.value = true;
  try {
    const payload = {
      uid: auth.user?.uid,
      portfolio_id: portfolioStore.currentPortfolio?.id
    };
    const data = await api.post(`http://localhost:3000/api/dividends/sync`, payload);
    setDividends(data);
  } catch (error) {
    console.error('Error fetching dividends:', error);
  } finally {
    isLoading.value = false;
  }
};

watch(() => auth.user, (newUser) => {
  if (newUser) {
    uid.value = newUser.uid;
    getDividends(); // 取得交易資料
  }
})

watch(() => portfolioStore.currentPortfolio, (newVal) => {
  if (newVal?.id) {
    getDividends();
  }
});

</script>