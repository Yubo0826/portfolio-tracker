<script setup>
import { computed, watch, ref } from 'vue';
import api from '../api.js';

import Button from 'primevue/button';
import Select from 'primevue/select';
import AutoComplete from 'primevue/autocomplete';
import 'primeicons/primeicons.css'

import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()


const visible = ref(false);

const assets = ref([]);
const selectedAssets = ref([]);

if (auth.user) {
  console.log('User is logged in:', auth.user);
} else {
  console.log('No user is logged in');
}


const uid = ref(null);

watch(() => auth.user, (newUser) => {
  if (newUser) {
    uid.value = newUser.uid;
    api.get('http://localhost:3000/api/transactions?uid=' + newUser.uid)
      .then(data => {
        console.log('Search results:', data);
        assets.value = data.map(item => ({
          id: item.id,
          symbol: item.symbol, // 股票代碼
          name: item.name, // 股票全名
          assetType: item.assetType, // 資產類型
          price: item.price, // 價格
          shares: parseInt(item.shares) || 0, // 股數
          transactionType: item.transaction_type, // 買入或賣出
          date: item.transaction_date // 交易日期
        }));
      })
      .catch(err => console.error(err))
  }
})

const getTransactions = async () => {
    if (!uid.value) {
        console.warn('No user ID found, cannot fetch transactions');
        return;
    }
    try {
        const data = await api.get(`http://localhost:3000/api/transactions?uid=${uid.value}`);
        console.log('Fetched transactions:', data);
        assets.value = data.map(item => ({
            id: item.id,
            symbol: item.symbol,
            name: item.name,
            assetType: item.assetType,
            price: item.price,
            shares: parseInt(item.shares) || 0,
            transactionType: item.transaction_type,
            date: item.transaction_date
        }));
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}

const addShare = (amount) => {
    if (newShare.value === null || newShare.value === undefined) {
        newShare.value = 0;
    }
    newShare.value += amount;
}

const deleteSelectedAssets = () => {
    console.log('Deleting selected assets:', selectedAssets.value);
    if (selectedAssets.value.length === 0) {
        console.warn('No assets selected for deletion');
        return;
    }
    const idsToDelete = selectedAssets.value.map(asset => asset.id);
    api.delete('http://localhost:3000/api/transactions', { ids: idsToDelete })
    .then(data => {
        console.log('Assets deleted:', data);
        // 更新本地 assets 列表
        assets.value = assets.value.filter(asset => !idsToDelete.includes(asset.id));
        selectedAssets.value = []; // 清空選擇的資產
    })
    .catch(error => {
        console.error('Error deleting assets:', error);
    });
}

const editingId = ref(null); // 如果有值表示目前在更新中

const updateSelectedAssets = (id) => {
    const assetToUpdate = assets.value.find(asset => asset.id === id);
    if (!assetToUpdate) return;

    visible.value = true;
    editingId.value = id; // 設定編輯 ID

    selectedSymbol.value = { 
        ticker: assetToUpdate.symbol,
        name: assetToUpdate.name,
        assetType: assetToUpdate.assetType
    };
    newShare.value = assetToUpdate.shares;
    newPrice.value = assetToUpdate.price;
    newDate.value = new Date(assetToUpdate.date);
    selectedOperation.value = transactionType.value.find(op => op.code === assetToUpdate.transactionType) || transactionType.value[0];
};

const newShare = ref(null);
const newDate = ref(null);
const selectedOperation = ref(null);

const saveTransaction = async () => {
    if (!selectedSymbol.value || !newShare.value || !newPrice.value || !newDate.value || !selectedOperation.value) {
        alert('Please fill in all fields');
        return;
    }

    const payload = {
        uid: uid.value,
        symbol: selectedSymbol.value.ticker,
        name: selectedSymbol.value.name,
        assetType: selectedSymbol.value.assetType,
        shares: newShare.value,
        price: newPrice.value,
        transaction_type: selectedOperation.value.code,
        transaction_date: newDate.value.toISOString().split('T')[0]
    };

    try {
        if (editingId.value !== null) {
            // 更新交易
            await api.put(`http://localhost:3000/api/transactions/${editingId.value}`, payload);
            // 更新本地資料
            const index = assets.value.findIndex(a => a.id === editingId.value);
            if (index !== -1) assets.value[index] = { id: editingId.value, ...payload };

        } else {
            // 新增交易
            const result = await api.post('http://localhost:3000/api/transactions', payload);
            assets.value.push(result); // 假設後端會回傳新增的資料（含 id）
        }

        visible.value = false;
        resetDialog();
    } catch (err) {
        console.error('Error saving transaction:', err);
    }
};

const resetDialog = () => {
    console.log('Resetting dialog');
    editingId.value = null;
    selectedSymbol.value = null;
    newShare.value = null;
    newPrice.value = null;
    newDate.value = null;
    selectedOperation.value = null;
};


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
        filteredSymbols.value = data;
    })
    .catch(error => {
        console.error('Error fetching symbols:', error);
        filteredSymbols.value = [];
    });
    
}

const debouncedSearch = debounce(search, 300);

// Callback：查詢選擇的股票當天的價格 (根據選擇的日期)
const newPrice = ref(null);

const onItemSelect = async (event) => {
    console.log('Selected symbol:', event.value);
    const symbol = event.value.ticker
    const date = newDate.value?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]; // 使用選擇的日期或當前日期
    if (symbol) {
        api.get(`http://localhost:3000/api/search/price/${symbol}?startDate=${date}&endDate=${date}`)
        .then(data => {
            console.log('Search results:', data);
            if (data.length === 1) {
                newPrice.value = data[0].close; // close 屬性是當天的收盤價
            }
        })
        .catch(error => {
            console.error('Error fetching symbols:', error);
        });
    }
};

const transactionType = ref([
    { name: 'Buy', code: 'buy' },
    { name: 'Sell', code: 'sell' }
]);

const totalPrice = computed(() => {
    return newShare.value * newPrice.value;
});

const dialogHeader = computed(() => {
    return editingId.value !== null ? 'Update Transaction' : 'New Transaction';
});


</script>
<template>
    <div>
        <div class="tool-bar">
            <Button label="Delete" @click="deleteSelectedAssets" icon="pi pi-trash" class="mr-2" severity="danger" />
            <Button label="Add" @click="visible = true" icon="pi pi-plus" />
            
            <!-- Dialog for adding or updating transactions -->
            <Dialog v-model:visible="visible" modal :style="{ width: '30rem' }">
                <template #header>
                    <div class="inline-flex items-center justify-center gap-2">
                        <span class="font-bold whitespace-nowrap">{{ dialogHeader }}</span>
                    </div>    
                </template>
                <span class="text-surface-500 dark:text-surface-400 block mb-8">
                    先填入股票代碼，然後選擇日期，系統會自動查詢當天的價格。<br />
                </span>
                <div class="flex items-center gap-4 mb-4">
                    <label for="date" class="font-semibold w-24">Date</label>
                    <DatePicker v-model="newDate" />
                </div>
                <div class="flex items-center gap-4 mb-4">
                    <label for="symbol" class="font-semibold w-24">Symbol</label>
                    <AutoComplete 
                        v-model="selectedSymbol" 
                        optionLabel="ticker" 
                        :suggestions="filteredSymbols" 
                        @complete="debouncedSearch" 
                        @item-select="onItemSelect"
                        :delay="600" 
                        />
                </div>
                <div class="flex items-center gap-4 mb-4">
                    <label for="shares" class="font-semibold w-24">Shares</label>
                    <InputNumber v-model="newShare" id="shares" class="flex-auto" showButtons autocomplete="off" />
                </div>
                <div class="flex items-center gap-2 mb-4 p-2 text-xs">
                    <label for="" class="font-semibold w-24"></label>
                    <Button @click="addShare(100)" label="+100" severity="secondary" rounded />
                    <Button @click="addShare(500)" label="+500" severity="secondary" rounded />
                    <Button @click="addShare(1000)" label="+1000" severity="secondary" rounded />
                </div>
                <div class="flex items-center gap-4 mb-4">
                    <label for="price" class="font-semibold w-24">Price</label>
                    <InputText v-model="newPrice" id="price" class="flex-auto" autocomplete="off" />
                </div>
                <div class="flex items-center gap-4 mb-8">
                    <label for="operation" class="font-semibold w-24">Operation</label>
                    <Select v-model="selectedOperation" :options="transactionType" optionLabel="name" placeholder="Select a operation" class="w-full md:w-56" />
                </div>
                <div class="flex items-center gap-4 mb-8">
                    <label for="operation" class="font-semibold w-24">Total</label>
                    ${{ totalPrice }} USD
                </div>
                <div class="flex justify-end gap-2">
                    <Button type="button" label="Cancel" severity="secondary" @click="resetDialog(), visible = false"></Button>
                    <Button type="button" label="Add" @click="saveTransaction"></Button>
                </div>
            </Dialog>
        </div>

        <DataTable v-model:selection="selectedAssets" :value="assets" dataKey="id" tableStyle="min-width: 50rem">
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="symbol" header="Symbol"></Column>
            <Column field="name" header="Name"></Column>
            <Column field="shares" header="Shares"></Column>
            <Column field="price" header="Price"></Column>
            <Column field="transactionType" header="Operation"></Column>
            <Column field="date" header="Date"></Column>
            <Column field="" header="Action">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-text" severity="info" @click="updateSelectedAssets(slotProps.data.id)" />
                </template>  
            </Column>
        </DataTable>


    </div>
</template>
<style scoped>
.tool-bar {
    display: flex;
    justify-content: flex-end;
    margin: 20px 0;
}
</style>