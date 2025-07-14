<script setup>
import { ref, onMounted } from 'vue';
import api from '@/api';
import AutoComplete from 'primevue/autocomplete';

import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()

import { usePortfolioStore } from '@/stores/portfolio';
const portfolioStore = usePortfolioStore()

const isLoading = ref(true);
const assets = ref([]);
const selectedAssets = ref([]);

const getAllocation = async () => {
    try {
        isLoading.value = true;
        if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) {
            console.warn('No user ID found, cannot fetch allocation');
            return;
        }
        const data = await api.get(`http://localhost:3000/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`);
        console.log('Fetched allocation:', data);
        // assets.value = data.map(item => ({
        //     id: item.id,
        //     symbol: item.symbol,
        //     name: item.name,
        //     assetType: item.asset_type,
        //     avgCost: parseFloat(item.avg_cost) || 0,
        //     shares: parseInt(item.total_shares) || 0,
        //     transactionType: item.transaction_type,
        //     lastUpdated: item.last_updated.split('T')[0]
        // }));
    } catch (error) {
        console.error('Error fetching allocation:', error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    getAllocation();
});

const updateAllocation = async () => {
    if (assets.value.length === 0) {
        console.warn('No assets to save');
        return;
    }
    try {
        isLoading.value = true;
        const data = assets.value.map(asset => ({
            symbol: asset.symbol,
            name: asset.name,
            rate: asset.rate,
            // 其他需要更新的字段
        }));
        console.log('Saving allocation:', data);
        const newAllocation = await api.post('http://localhost:3000/api/allocation', {
            uid: auth.user?.uid,
            portfolioId: portfolioStore.currentPortfolio?.id,
            assets: data
         });
        assets.value = newAllocation;
    } catch (error) {
        console.error('Error saving allocation:', error);
    } finally {
        isLoading.value = false;
    }
}


// Auto complete symbol search
import debounce from 'lodash/debounce';
const selectedSymbol = ref(null);
const filteredSymbols = ref([]);

const search = async (event) => {
    console.log('Searching for symbols:', event.query);
    if (!event.query.trim().length) return;
    api.get('http://localhost:3000/api/search/symbols?query=' + event.query)
    .then(data => {
        console.log('Search results:', data);
        filteredSymbols.value = data.map(item => ({
            symbol: item.ticker,
            name: item.name,
            assetType: item.assetType
        }));
    })
    .catch(error => {
        console.error('Error fetching symbols:', error);
        filteredSymbols.value = [];
    });
    
}

const debouncedSearch = debounce(search, 100);

// Callback
const newAsset = ref({
    symbol: '',
    name: '',
    rate: 0 // 預設值
});
const onItemSelect = async (event) => {
    console.log('Selected stock:', event.value);
    newAsset.value = {
        symbol: event.value.symbol,
        name: event.value.name,
        rate: 0 // 預設值
    };
};

const addAsset = async () => {
    if (!newAsset.value.symbol || !newAsset.value.name) {
        console.warn('Symbol and name are required');
        return;
    }
    try {
        isLoading.value = true;
        // 假設有一個 API 可以新增資產
        const addedAsset = await api.post('http://localhost:3000/api/allocation/', {
            uid: auth.user?.uid,
            portfolioId: portfolioStore.currentPortfolio?.id,
            symbol: newAsset.value.symbol,
            name: newAsset.value.name,
            rate: newAsset.value.rate
        });
        assets.value.push(addedAsset);
        newAsset.value = { symbol: '', name: '', rate: 0 }; // 重置輸入框
    } catch (error) {
        console.error('Error adding asset:', error);
    } finally {
        isLoading.value = false;
    }
};

</script>
<template>
    <div>
        <Button>Save</Button>
        <DataTable v-model:selection="selectedAssets" :value="assets" :loading="isLoading" dataKey="id" tableStyle="min-width: 50rem">
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="symbol" header="Symbol"></Column>
            <Column field="name" header="Name"></Column>
            <Column field="">
                <template #header>
                    123
                </template>
                <!-- <template #body="slotProps">
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-text" severity="info" @click="updateSelectedPortfolios(slotProps.data.id)" />
                </template>   -->
            </Column>

            <template #footer>
                <AutoComplete 
                    v-model="selectedSymbol" 
                    optionLabel="symbol" 
                    :suggestions="filteredSymbols" 
                    @complete="debouncedSearch" 
                    @item-select="onItemSelect"
                    :delay="600"  
                    />

                    <Button icon="pi pi-check" variant="text" rounded aria-label="Filter" />
            </template>

            <!-- <template #empty>
                <div class="p-4 text-center text-gray-500">
                <i class="pi pi-info-circle mr-2" />
                    現在並無資料。
                </div>
            </template> -->

        </DataTable>
    </div>
</template>