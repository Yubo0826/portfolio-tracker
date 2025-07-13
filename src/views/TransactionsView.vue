<script setup>
import { computed, watch, ref } from 'vue';
import api from '../api.js';

import AutoComplete from 'primevue/autocomplete';
import { useToast } from "primevue/usetoast";
const toast = useToast();

import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()

import { usePortfolioStore } from '@/stores/portfolio';
const portfolioStore = usePortfolioStore()

const transactionType = ref([
    { name: 'Buy', code: 'buy' },
    { name: 'Sell', code: 'sell' }
]);

const transactions = ref([]);
const holdings = ref([]);
const selectedAssets = ref([]);
const visible = ref(false);
const isLoading = ref(false);

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
}

const setHoldings = (data) => {
    holdings.value = data.map(item => ({
        symbol: item.symbol,
        name: item.name,
        total_shares: parseInt(item.total_shares) || 0,
    }));
}


// 根據 google 登入的用戶 ID 取得交易資料
const uid = ref(null);

const getTransactions = async () => {
    if (!uid.value) {
        console.warn('No user ID found, cannot fetch transactions');
        return;
    }
    try {
        isLoading.value = true;
        const data = await api.get(`http://localhost:3000/api/transactions?uid=${uid.value}`);
        console.log('Fetched data:', data);
        setTransactions(data.transactions);
        setHoldings(data.holdings);
    } catch (error) {
        console.error('Error fetching transactions:', error);
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

/*
    1. 監聽 auth.user 的變化，如果有用戶登入則取得交易資料
    2. 如果已在登入狀態下刷新瀏覽器 auth.user 會自動重新登入
*/
watch(() => auth.user, (newUser) => {
  if (newUser) {
    uid.value = newUser.uid;
    getTransactions(); // 取得交易資料
  }
})

const addShare = (amount) => {
    if (newShare.value === null || newShare.value === undefined) {
        newShare.value = 0;
    }
    newShare.value += amount;
}

const deleteSelectedAssets = () => {
    console.log('Deleting selected transactions:', selectedAssets.value);
    if (selectedAssets.value.length === 0) {
        console.warn('No transactions selected for deletion');
        return;
    }
    const idsToDelete = selectedAssets.value.map(asset => asset.id);
    const payload = {
        uid: uid.value,
        portfolio_id: portfolioStore.currentPortfolio?.id,
        ids: idsToDelete
    };
    api.delete(`http://localhost:3000/api/transactions`, payload)
    .then(data => {
        console.log('Assets deleted:', data);
        // 更新本地 transactions 列表
        transactions.value = transactions.value.filter(asset => !idsToDelete.includes(asset.id));
        selectedAssets.value = []; // 清空選擇的資產
    })
    .catch(error => {
        console.error('Error deleting transactions:', error);
    });
}

const editingId = ref(null); // 如果有值表示目前在更新中

const updateSelectedAssets = (id) => {
    const assetToUpdate = transactions.value.find(asset => asset.id === id);
    if (!assetToUpdate) return;

    visible.value = true;
    editingId.value = id; // 設定編輯 ID

    selectedSymbol.value = { 
        symbol: assetToUpdate.symbol,
        name: assetToUpdate.name,
        assetType: assetToUpdate.assetType
    };
    oldShare.value = assetToUpdate.shares;
    newShare.value = assetToUpdate.shares;
    newFee.value = assetToUpdate.fee || 0;
    newPrice.value = assetToUpdate.price;
    newDate.value = new Date(assetToUpdate.date);
    selectedOperation.value = transactionType.value.find(op => op.code === assetToUpdate.transactionType) || transactionType.value[0];
};

const oldShare = ref(null);
const newShare = ref(null);
const newFee = ref(0);
const newDate = ref(null);
const selectedOperation = ref(transactionType.value[0]); // 預設為買入

const errors = ref({
  date: false,
  symbol: false,
  shares: false,
  price: false,
  operation: false
})

// 檢查新增 & 更新資產欄位是否有錯誤
const hasError = computed(() => {
    errors.value = {
        date: !newDate.value,
        symbol: !selectedSymbol.value,
        shares: !newShare.value || newShare.value <= 0,
        price: !newPrice.value || newPrice.value <= 0,
        operation: !selectedOperation.value
    }
    return Object.values(errors.value).some(Boolean);
});

const saveTransaction = async () => {
    if (hasError.value) {
        console.warn('欄位未填寫完整')
        return
    }

    /* 
        如果更新資料且類型是賣出，檢查：
        新的 shares 是否會超出原本的持有量
    */
   
    if (editingId.value !== null && selectedOperation.value.code === 'sell') {
        const holding = holdings.value.find(h => h.symbol === selectedSymbol.value.symbol.toUpperCase());
        if (newShare.value > holding.total_shares + oldShare.value) {
            toast.add({
                severity: 'error',
                summary: 'Error Message',
                detail: 'Not enough shares to sell.',
                life: 3000
            });
            return;
        }
    }
    
    /* 
        如果新增資料且類型是賣出，檢查：
        1. 股票必須已存在於資產中
        2. shares 必須小於在資產已存在的 shares
    */

    if (editingId.value === null && selectedOperation.value.code === 'sell') {
        const holding = holdings.value.find(h => h.symbol === selectedSymbol.value.symbol.toUpperCase());
        console.log('Holding for sell check:', holding);
        if (!holding) {
            toast.add({
                severity: 'error',
                summary: 'Error Message',
                detail: `You don't own any shares of ${selectedSymbol.value.symbol}`,
                life: 3000
            });
            return;
        }
        if (newShare.value > holding.total_shares) {
            toast.add({
                severity: 'error',
                summary: 'Error Message',
                detail: `Not enough shares to sell. You only have ${holding.total_shares} shares of ${selectedSymbol.value.symbol}`,
                life: 3000
            });
            return;
        }
    }

    if (newFee.value < 0) {
        toast.add({
            severity: 'error',
            summary: 'Error Message',
            detail: 'Fee cannot be negative.',
            life: 3000
        });
        return;
    }

    const payload = {
        uid: uid.value,
        symbol: selectedSymbol.value.symbol.toUpperCase(),
        name: selectedSymbol.value.name,
        asset_type: selectedSymbol.value.assetType,
        shares: newShare.value,
        fee: newFee.value || 0,
        price: newPrice.value,
        transaction_type: selectedOperation.value.code,
        transaction_date: newDate.value.toISOString().split('T')[0]
    };

    console.log('Saving transaction payload:', payload);

    try {
        if (editingId.value !== null) {
            // 更新交易
            const result = await api.put(`http://localhost:3000/api/transactions/${editingId.value}`, payload);
            // 更新本地資料
            // const index = transactions.value.findIndex(a => a.id === editingId.value);
            // if (index !== -1) transactions.value[index] = { id: editingId.value, ...payload };
            console.log('Transaction updated:', result);
            if (result.message === 'No changes detected, transaction not updated') {
                toast.add({
                    severity: 'warn',
                    summary: 'Warn Message',
                    detail: 'No changes detected, transaction not updated.',
                    life: 3000
                });
                return;
            }

            setTransactions(result.transactions);
            setHoldings(result.holdings);

            toast.add({
                severity: 'success',
                summary: 'Success Message',
                detail: 'Transaction updated successfully.',
                life: 3000
            });
        } else {
            // 新增交易
            const result = await api.post('http://localhost:3000/api/transactions', payload);
            setTransactions(result.transactions);
            setHoldings(result.holdings);
        }

        visible.value = false;
        resetDialog();
    } catch (err) {
        console.error(err);
        if (err.message === 'Not enough shares to sell') {
            alert(`Not enough shares to sell. Please check your holdings.`);
        } else {
            alert(err.message || 'An error occurred while saving the transaction');
        }
    }
};

const resetDialog = () => {
    console.log('Reset dialog');
    editingId.value = null;
    selectedSymbol.value = null;
    oldShare.value = null;
    newShare.value = null;
    newPrice.value = null;
    newDate.value = null;
    newFee.value = 0;
    selectedOperation.value = transactionType.value[0]; // 預設為買入
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

// Callback：查詢選擇的股票當天的價格 (根據選擇的日期)
const newPrice = ref(null);

const onItemSelect = async (event) => {
    console.log('Selected symbol:', event.value);
    const symbol = event.value.symbol
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

const totalPrice = computed(() => {
    return Number((newShare.value * newPrice.value).toFixed(2));
});

const dialogHeader = computed(() => {
    return editingId.value !== null ? 'Update Transaction' : 'New Transaction';
});


</script>
<template>
    <div>
        <Toast />
        <div class="tool-bar">
            <Button label="Delete" @click="deleteSelectedAssets" icon="pi pi-trash" class="mr-2" severity="danger" />
            <Button label="Add" @click="visible = true" icon="pi pi-plus" />
            
            <!-- Dialog for adding or updating transactions -->
            <Dialog v-model:visible="visible" @hide="resetDialog" modal :style="{ width: '30rem' }">
                <template #header>
                    <div class="inline-flex items-center justify-center gap-2">
                        <span class="font-bold whitespace-nowrap">{{ dialogHeader }}</span>
                    </div>    
                </template>
                <span class="text-surface-500 dark:text-surface-400 block mb-8">
                    <span v-if="!editingId">
                        先選擇日期，然後填入股票代碼，系統會自動查詢當天的價格。<br />
                    </span>
                </span>
                <div class="flex items-center gap-4 mb-4">
                    <label for="date" class="font-semibold w-24">
                        Date
                        <span style="color: #f27362;">*</span>
                    </label>
                    <DatePicker v-model="newDate" showIcon fluid iconDisplay="input" placeholder="交易的日期" />
                </div>
                <div class="flex items-center gap-4 mb-4">
                    <label for="symbol" class="font-semibold w-24">
                        Symbol
                        <span style="color: #f27362;">*</span>
                    </label>
                    <AutoComplete 
                        v-model="selectedSymbol" 
                        optionLabel="symbol" 
                        :suggestions="filteredSymbols" 
                        @complete="debouncedSearch" 
                        @item-select="onItemSelect"
                        :delay="600" 
                        :disabled="editingId" 
                        />
                </div>
                <div class="flex items-center gap-4 mb-4">
                    <label for="shares" class="font-semibold w-24">
                        Shares
                        <span style="color: #f27362;">*</span>
                    </label>
                    <InputNumber v-model="newShare" id="shares" class="flex-auto" autocomplete="off" />
                </div>
                <div class="flex items-center gap-2 mb-4 p-2 text-xs">
                    <label for="" class="font-semibold w-24"></label>
                    <Button @click="addShare(100)" label="+100" severity="secondary" rounded />
                    <Button @click="addShare(500)" label="+500" severity="secondary" rounded />
                    <Button @click="addShare(1000)" label="+1000" severity="secondary" rounded />
                </div>
                <div class="flex items-center gap-4 mb-4">
                    <label for="price" class="font-semibold w-24">
                        Price
                        <span style="color: #f27362;">*</span>
                    </label>
                    <InputText v-model="newPrice" id="price" class="flex-auto" autocomplete="off" placeholder="請輸入交易當時的價格" />
                </div>
                <div class="flex items-center gap-4 mb-8">
                    <label for="operation" class="font-semibold w-24">Operation</label>
                    <Select v-model="selectedOperation" :options="transactionType" :disabled="editingId" optionLabel="name" placeholder="Select a operation" class="w-full md:w-56" />
                </div>
                <div class="flex items-center gap-4 mb-8">
                    <label for="fee" class="font-semibold w-24">Fee</label>
                    <InputNumber v-model="newFee" id="fee" class="flex-auto" showButtons autocomplete="off" />
                </div>
                <div class="flex items-center gap-4 mb-8">
                    <label for="operation" class="font-semibold w-24">Total</label>
                    ${{ totalPrice }} USD
                </div>
                <div class="flex justify-end gap-2">
                    <Button type="button" label="Cancel" severity="secondary" @click="resetDialog(), visible = false"></Button>
                    <Button v-if="hasError" type="button" label="Add" v-tooltip.bottom="'請填入完整信息'" bottom @click="saveTransaction" disabled></Button>
                    <Button v-else type="button" label="Add" bottom @click="saveTransaction"></Button>
                </div>
            </Dialog>
        </div>

        <DataTable v-model:selection="selectedAssets" :value="transactions" :loading="isLoading" dataKey="id" tableStyle="min-width: 50rem">
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="symbol" header="Symbol"></Column>
            <Column field="name" header="Name"></Column>
            <Column field="shares" header="Shares"></Column>
            <Column field="price" header="Price"></Column>
            <Column field="fee" header="Fee"></Column>
            <Column field="" header="Operation">
                <template #body="slotProps">
                    <div>
                        <span 
                            v-if="slotProps.data.transactionType === 'buy'"
                            class="bg-green-400 text-green-800 rounded-full px-4 py-1.5 text-white font-bold text-xs"
                            >
                            Buy
                        </span>
                        <span v-else class="bg-red-400 text-red-800 rounded-full px-4 py-1.5 text-white font-bold text-xs">Sell</span>
                    </div>
                </template> 
            </Column>
            <Column field="date" header="Date"></Column>
            <Column field="" header="Action">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-text" severity="info" @click="updateSelectedAssets(slotProps.data.id)" />
                </template>  
            </Column>

            <template #empty>
                <div class="p-4 text-center text-gray-500">
                <i class="pi pi-info-circle mr-2" />
                    現在並無資料。
                </div>
            </template>
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