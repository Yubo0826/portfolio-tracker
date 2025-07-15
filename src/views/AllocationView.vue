<script setup>
import { ref, watch } from 'vue';
import api from '@/api';
import AutoComplete from 'primevue/autocomplete';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import debounce from 'lodash/debounce';

import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';

const auth = useAuthStore();
const portfolioStore = usePortfolioStore();

const isLoading = ref(true);
const assets = ref([]);
const selectedSymbol = ref(null);
const filteredSymbols = ref([]);
const inputVisible = ref(false);
const newTarget = ref(0);
const newAssetRow = ref(null);

const getAllocation = async () => {
  try {
    isLoading.value = true;
    if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
    const data = await api.get(`http://localhost:3000/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`);
    console.log('Fetched allocation:', data);
    assets.value = data;
  } catch (error) {
    console.error('Error fetching allocation:', error);
  } finally {
    isLoading.value = false;
  }
};

// 如果有用戶登入，則設定 uid
if (auth.user) {
    getAllocation(); // 取得交易資料
} else {
    console.log('No user is logged in');
}

// 監聽 auth.user 的變化，如果有用戶變化則取得交易資料
watch(() => auth.user, (newUser) => {
    if (newUser) {
        getAllocation();
    }
})

watch(() => portfolioStore.currentPortfolio, (newVal) => {
  if (newVal?.id) {
    getAllocation();
  }
});

const search = async (event) => {
  if (!event.query.trim().length) return;
  try {
    const data = await api.get('http://localhost:3000/api/search/symbols?query=' + event.query);
    console.log('Fetched symbols:', data);
    filteredSymbols.value = data.map(item => ({
      symbol: item.ticker,
      name: item.name,
      icon: item.icon || `https://logo.clearbit.com/${item.ticker}.com`
    }));
  } catch (error) {
    console.error('Error fetching symbols:', error);
    filteredSymbols.value = [];
  }
};

const debouncedSearch = debounce(search, 300);

const onItemSelect = (event) => {
  newAssetRow.value = {
    symbol: event.value.symbol,
    name: event.value.name,
    icon: event.value.icon,
  };
};

const confirmAddAsset = async () => {
    if (!newAssetRow.value?.symbol || !newAssetRow.value?.name) return;
    assets.value.push(
        {
            ...newAssetRow.value,
            target: newTarget.value
        }
    );
    newAssetRow.value = null;
    selectedSymbol.value = null;
    newTarget.value = 0;
    inputVisible.value = false;
};

const removeAsset = (data) => {
  assets.value = assets.value.filter(a => a.symbol !== data.symbol);
};

const saveAllocation = async () => {
  if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
  try {
    const data = await api.post('http://localhost:3000/api/allocation/', {
      uid: auth.user.uid,
      portfolio_id: portfolioStore.currentPortfolio.id,
      assets: assets.value
    });
    console.log('Allocation saved successfully', data);
  } catch (error) {
    console.error('Error saving allocation:', error);
  }
};



</script>

<template>
  <div>
    <div class="flex justify-end mb-4">
        <Button label="Save" @click="saveAllocation" />
    </div>

    <DataTable :value="assets" editMode="row" dataKey="symbol">
        <!-- Name -->
        <Column field="name" header="Asset" style="width: 40%">
            <template #body="{ data }">
                <div>
                    <!-- <img :src="data.icon" class="w-5 h-5 mr-2" /> -->
                    <span class="font-bold mr-4">{{ data.symbol }}</span>
                    <div class="">{{ data.name }}</div>
                </div>
            </template>

            <template #footer>
                <div v-if="!inputVisible">
                    <Button icon="pi pi-plus" text label="Add Asset" @click="inputVisible = true" />
                </div>
                <div v-else class="flex flex-col gap-2">
                    <AutoComplete v-model="selectedSymbol" optionLabel="symbol" :suggestions="filteredSymbols"
                    @complete="debouncedSearch" @item-select="onItemSelect" placeholder="Search ticker or name" />
                </div>
            </template>
        </Column>

        <!-- Target -->
        <Column field="target" header="Target (%)" style="width: 30%">
            <template #body="{ data }">
                <InputNumber v-model="data.target" suffix="%" showButtons :min="0" :max="100" />
            </template>

            <template #footer>
            <InputNumber v-if="inputVisible" v-model="newTarget" suffix="%" showButtons :min="0" :max="100" />
            </template>
        </Column>

        <!-- Action -->
        <Column style="width: 10%">
            <template #body="{ data }">
                <Button icon="pi pi-times" text severity="danger" @click="removeAsset(data)" />
            </template>

            <template #footer>
                <Button v-if="inputVisible" @click="confirmAddAsset" icon="pi pi-check" rounded variant="outlined" aria-label="Filter" />
            </template>
        </Column>
    </DataTable>
  </div>
</template>
