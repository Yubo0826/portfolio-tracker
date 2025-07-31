<script setup>
import { computed, watch, ref } from 'vue';
import api from '../api.js';

import AutoComplete from 'primevue/autocomplete';
import { useToast } from "primevue/usetoast";
const toast = useToast();

import { useAuthStore } from '@/stores/auth';
const auth = useAuthStore();

import { usePortfolioStore } from '@/stores/portfolio';
const portfolioStore = usePortfolioStore();

const transactionType = ref([
    { name: 'Buy', code: 'buy' },
    { name: 'Sell', code: 'sell' }
]);

const transactions = ref([]);
const holdings = ref([]);
const selectedAssets = ref([]);
const visible = ref(false);
const isLoading = ref(false);

const transactionForm = ref({
    date: new Date(),
    symbol: null,
    name: '',
    assetType: '',
    shares: null,
    price: null,
    fee: 0,
    operation: 'buy'
});

const errors = ref({
    date: false,
    symbol: false,
    shares: false,
    price: false,
    operation: false
});

const hasError = computed(() => {
    errors.value = {
        date: !transactionForm.value.date,
        symbol: !transactionForm.value.symbol,
        shares: !transactionForm.value.shares || transactionForm.value.shares <= 0,
        price: !transactionForm.value.price || transactionForm.value.price <= 0,
        operation: !transactionForm.value.operation
    };
    return Object.values(errors.value).some(Boolean);
});

const uid = ref(null);

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

const setHoldings = (data) => {
    holdings.value = data.map(item => ({
        symbol: item.symbol,
        name: item.name,
        total_shares: parseInt(item.total_shares) || 0
    }));
};

const getTransactions = async () => {
    if (!uid.value) return;
    try {
        isLoading.value = true;
        if (portfolioStore.currentPortfolio) {
            const data = await api.get(`http://localhost:3000/api/transactions?uid=${uid.value}&portfolio_id=${portfolioStore.currentPortfolio.id}`);
            setTransactions(data.transactions);
            setHoldings(data.holdings);
        }
    } catch (error) {
        console.error(error);
    } finally {
        isLoading.value = false;
    }
};

if (auth.user) {
    uid.value = auth.user.uid;
    getTransactions();
}

watch(() => auth.user, (newUser) => {
    if (newUser) {
        uid.value = newUser.uid;
        getTransactions();
    }
});

watch(() => portfolioStore.currentPortfolio, (newVal) => {
    if (newVal?.id) getTransactions();
});

const resetDialog = () => {
    editingId.value = null;
    transactionForm.value = {
        date: new Date(),
        symbol: null,
        name: '',
        assetType: '',
        shares: null,
        price: null,
        fee: 0,
        operation: 'buy'
    };
};

const addShare = (amount) => {
    if (!transactionForm.value.shares) transactionForm.value.shares = 0;
    transactionForm.value.shares += amount;
};

const deleteSelectedAssets = () => {
    if (selectedAssets.value.length === 0) return;
    const idsToDelete = selectedAssets.value.map(asset => asset.id);
    const payload = {
        uid: uid.value,
        portfolio_id: portfolioStore.currentPortfolio?.id,
        ids: idsToDelete
    };
    api.delete(`http://localhost:3000/api/transactions`, payload)
    .then(data => {
        transactions.value = transactions.value.filter(asset => !idsToDelete.includes(asset.id));
        selectedAssets.value = [];
    }).catch(console.error);
};

const editingId = ref(null);

const updateSelectedAssets = (id) => {
    const asset = transactions.value.find(asset => asset.id === id);
    if (!asset) return;
    visible.value = true;
    editingId.value = id;
    transactionForm.value = {
        date: new Date(asset.date),
        symbol: asset.symbol,
        name: asset.name,
        assetType: asset.assetType,
        shares: asset.shares,
        price: asset.price,
        fee: asset.fee,
        operation: asset.transactionType
    };
};

import debounce from 'lodash/debounce';
const filteredSymbols = ref([]);

const search = async (event) => {
    if (!event.query.trim().length) return;
    api.get('http://localhost:3000/api/search/symbols?query=' + event.query)
    .then(data => {
        filteredSymbols.value = data.map(item => ({
            symbol: item.ticker,
            name: item.name,
            assetType: item.assetType
        }));
    }).catch(() => filteredSymbols.value = []);
};

const debouncedSearch = debounce(search, 100);

const onItemSelect = async (event) => {
    const selected = event.value;
    transactionForm.value.symbol = selected.symbol;
    transactionForm.value.name = selected.name;
    transactionForm.value.assetType = selected.assetType;
    const date = transactionForm.value.date?.toISOString().split('T')[0];
    searchPrice(selected.symbol, date);
};

const onDateSelect = async (event) => {
    transactionForm.value.date = event;
    if (transactionForm.value.symbol) {
        const date = event.toISOString().split('T')[0];
        searchPrice(transactionForm.value.symbol, date);
    }
};

const searchPrice = async (symbol, date) => {
    if (!symbol || !date) return;
    try {
        const data = await api.get(`http://localhost:3000/api/search/price/${symbol}?startDate=${date}&endDate=${date}`);
        if (data.length > 0) {
            transactionForm.value.price = data[0].close;
        } else {
            transactionForm.value.price = null;
        }
    } catch (e) {
        transactionForm.value.price = null;
    }
};

const totalPrice = computed(() => {
    return Number((transactionForm.value.shares * transactionForm.value.price).toFixed(2)) || 0;
});

const dialogHeader = computed(() => editingId.value !== null ? 'Update Transaction' : 'New Transaction');

const saveTransaction = async () => {
    if (hasError.value) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Please fill in all required fields.', life: 3000 });
        return;
    }

    if (editingId.value !== null && transactionForm.value.operation === 'sell') {
        const holding = holdings.value.find(h => h.symbol === transactionForm.value.symbol.toUpperCase());
        if (transactionForm.value.shares > (holding?.total_shares || 0)) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Not enough shares to sell.', life: 3000 });
            return;
        }
    }

    if (editingId.value === null && transactionForm.value.operation === 'sell') {
        const holding = holdings.value.find(h => h.symbol === transactionForm.value.symbol.toUpperCase());
        if (!holding || transactionForm.value.shares > holding.total_shares) {
            toast.add({ severity: 'error', summary: 'Error', detail: `Not enough shares to sell.`, life: 3000 });
            return;
        }
    }

    if (transactionForm.value.fee < 0) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fee cannot be negative.', life: 3000 });
        return;
    }

    const payload = {
        uid: uid.value,
        portfolio_id: portfolioStore.currentPortfolio?.id,
        symbol: transactionForm.value.symbol.toUpperCase(),
        name: transactionForm.value.name,
        asset_type: transactionForm.value.assetType,
        shares: transactionForm.value.shares,
        fee: transactionForm.value.fee || 0,
        price: transactionForm.value.price,
        transaction_type: transactionForm.value.operation,
        transaction_date: transactionForm.value.date.toISOString().split('T')[0]
    };

    try {
        if (editingId.value !== null) {
            const result = await api.put(`http://localhost:3000/api/transactions/${editingId.value}`, payload);
            setTransactions(result.transactions);
            setHoldings(result.holdings);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Transaction updated.', life: 3000 });
        } else {
            const result = await api.post('http://localhost:3000/api/transactions', payload);
            setTransactions(result.transactions);
            setHoldings(result.holdings);
        }
        visible.value = false;
        resetDialog();
    } catch (err) {
        alert(err.message || 'Error saving transaction');
    }
};
</script>
<template>
    <div>
        <Toast />
        <div class="flex justify-end mb-4">
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
                    <DatePicker v-model="transactionForm.date" @date-select="onDateSelect" :maxDate="new Date()" showIcon fluid iconDisplay="input" class="flex-auto" placeholder="交易的日期" />
                </div>
                <div class="flex items-center gap-4 mb-4">
                    <label for="symbol" class="font-semibold w-24">
                        Symbol
                        <span style="color: #f27362;">*</span>
                    </label>
                    <AutoComplete 
                        v-model="transactionForm.symbol" 
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
                    <InputNumber v-model="transactionForm.shares" id="shares" class="flex-auto" autocomplete="off" />
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
                    <InputText v-model="transactionForm.price" id="price" class="flex-auto" autocomplete="off" placeholder="請輸入交易當時的價格" />
                </div>
                <div class="flex items-center gap-4 mb-8">
                    <label for="operation" class="font-semibold w-24">Operation</label>
                    <SelectButton v-model="transactionForm.operation" :options="transactionType" optionLabel="name" optionValue="code" />
                </div>
                <div class="flex items-center gap-4 mb-8">
                    <label for="fee" class="font-semibold w-24">Fee</label>
                    <InputNumber v-model="transactionForm.fee" id="fee" class="flex-auto" showButtons autocomplete="off" />
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

        <DataTable v-model:selection="selectedAssets" :value="transactions" sortField="date" :sortOrder="-1" :loading="isLoading" dataKey="id" tableStyle="min-width: 50rem">
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="symbol" sortable header="Symbol">
                <!-- <template #sorticon="{ sorted, sortOrder }">
                    <i
                        v-show="sorted"
                        :class="sortOrder === 1 ? 'pi pi-sort-amount-down' : 'pi pi-sort-amount-up'"
                    ></i>
                </template> -->
            </Column>
            <Column field="name" sortable header="Name"></Column>
            <Column field="shares" sortable header="Shares"></Column>
            <Column field="price" sortable header="Price"></Column>
            <Column field="fee" sortable header="Fee"></Column>
            <Column field="" sortable header="Operation">
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
            <Column field="date" sortable header="Date"></Column>
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
:deep(.p-autocomplete) {
    flex: 1 1 auto;
}
:deep(.p-autocomplete-input) {
    flex: 1 1 auto;
}
</style>