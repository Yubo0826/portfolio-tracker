<template>
  <div>
    <div class="flex justify-end mb-8">
      <Button
        :label="$t('refresh')"
        @click="refreshDividends"
        icon="pi pi-refresh"
        class="mr-2"
        severity="secondary"
      />
    </div>

    <DataTable
      :value="dividends"
      sortField="date"
      :sortOrder="-1"
      :loading="isLoading"
      dataKey="id"
      tableStyle="min-width: 50rem"
      stripedRows 
      paginator :rows="15"
    >
      <Column field="" :header="$t('symbol')" style="width: 40%" sortable sortField="symbol">
        <template #body="{ data }">
          <div>
            <span class="font-bold mr-4">{{ data.symbol }}</span>
            <div class="text-sm">{{ data.name }}</div>
          </div>
        </template>
      </Column>
      <Column field="shares" sortable :header="$t('shares')" />
      <Column field="amount" sortable :header="$t('dividendPerShare')" />
      <Column field="totalAmount" sortable :header="$t('dividendTotal')" />
      <Column field="date" sortable :header="$t('date')" />

      <template #empty>
        <NoData />
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import api from '../utils/api.js';
import NoData from '@/components/NoData.vue';

import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()

import { usePortfolioStore } from '@/stores/portfolio';
const portfolioStore = usePortfolioStore()

const isLoading = ref(false);
const dividends = ref([]);

const getDividends = async () => {
  isLoading.value = true;
  try {
    console.log('Fetching dividends for user:', auth.user?.uid, 'and portfolio:', portfolioStore.currentPortfolio?.id);
    const data = await api.get(`/api/dividends?uid=${auth.user.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`);
    console.log('Dividends data:', data);
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
      shares: item.shares,
      amount: item.amount, // 每股股利
      totalAmount: (item.shares * item.amount).toFixed(2), // 總股利
      date: item.date.slice(0, 10) // YYYY-MM-DD
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
    const data = await api.post(`/api/dividends/sync`, payload);
    console.log('Dividends sync response:', data);
    setDividends(data.dividends);
  } catch (error) {
    console.error('Error fetching dividends:', error);
  } finally {
    isLoading.value = false;
  }
};

watch(() => auth.user, (newUser) => {
  if (newUser && portfolioStore.currentPortfolio?.id) {
    getDividends();
  }
})

watch(() => portfolioStore.currentPortfolio, (newVal) => {
  if (newVal?.id && auth.user?.uid) {
    getDividends();
  }
});

onMounted(() => {
  if (auth.user?.uid && portfolioStore.currentPortfolio?.id) {
    getDividends();
  } else {
    console.log('No user is logged in or portfolio is not selected');
  }
});
</script>
