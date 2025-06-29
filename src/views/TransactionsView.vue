<script setup>
import { computed, ref } from 'vue';
import api from '../api.js';

import Button from 'primevue/button';
import Select from 'primevue/select';
import AutoComplete from 'primevue/autocomplete';


const visible = ref(false);

const operationType = ref([
    { name: 'Buy', code: 'buy' },
    { name: 'Sell', code: 'sell' }
]);


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

// Callback after selete item
const onItemSelect = async (event) => {
    console.log('Selected symbol:', event.value);
    const symbol = event.value.ticker
    const date = newDate.value || new Date().toISOString().split('T')[0]; // 使用選擇的日期或當前日期
    if (symbol) {
        api.get(`http://localhost:3000/api/search/price/${symbol}?date=${date}`)
        .then(data => {
            console.log('Search results:', data);
            filteredSymbols.value = data;
        })
        .catch(error => {
            console.error('Error fetching symbols:', error);
            filteredSymbols.value = [];
        });
    }
};

const newShare = ref(0);
const newDate = ref(null);
const selectedOperation = ref('buy');
const newPrice = computed(() => {
    
});

// 添加交易紀錄
const addTransaction = () => {
    console.log('Adding transaction...');
    const data = {
        userId: 'google-oauth2|yubo0826',
        symbol: 'AAPL',
        shares: 10,
        transactionType: 'buy',
        transactionDate: '2024-08-26',
        price: 150.00
    };
    
    api.post('http://localhost:3000/api/transactions', data)
    .then(response => {
        console.log('Transaction added:', response.data);
        visible.value = false; 
        // 可以在這裡更新 products 或其他狀態
    })
    .catch(error => {
        console.error('Error adding transaction:', error);
    });
}


</script>
<template>
    <div>
        <div class="tool-bar">
            <Button label="Add" @click="visible = true" />

            <Dialog v-model:visible="visible" modal header="Add transaction" :style="{ width: '25rem' }">
                <span class="text-surface-500 dark:text-surface-400 block mb-8">Update your information.</span>
                <div class="flex items-center gap-4 mb-4">
                    <label for="symbol" class="font-semibold w-24">Symbol</label>
                    <AutoComplete 
                        v-model="selectedSymbol" 
                        optionLabel="ticker" 
                        :suggestions="filteredSymbols" 
                        @complete="debouncedSearch" 
                        @item-select="onItemSelect"
                        :delay="600" />
                </div>
                <div class="flex items-center gap-4 mb-4">
                    <label for="shares" class="font-semibold w-24">Shares</label>
                    <InputNumber v-model="newShare" id="shares" class="flex-auto" showButtons autocomplete="off" />
                </div>
                <div class="flex items-center gap-4 mb-4">
                    <label for="date" class="font-semibold w-24">Date</label>
                    <DatePicker v-model="newDate" />
                </div>
                <div class="flex items-center gap-4 mb-4">
                    <label for="price" class="font-semibold w-24">Price</label>
                    <InputText v-model="newPrice" id="price" class="flex-auto" autocomplete="off" />
                </div>
                <div class="flex items-center gap-4 mb-8">
                    <label for="operation" class="font-semibold w-24">Operation</label>
                    <Select v-model="selectedOperation" :options="operationType" optionLabel="name" placeholder="Select a operation" class="w-full md:w-56" />
                </div>
                <div class="flex justify-end gap-2">
                    <Button type="button" label="Cancel" severity="secondary" @click="visible = false"></Button>
                    <Button type="button" label="Add" @click="addTransaction"></Button>
                </div>
            </Dialog>
        </div>

        <DataTable v-model:selection="selectedProducts" :value="products" dataKey="id" tableStyle="min-width: 50rem">
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="code" header="Code"></Column>
            <Column field="name" header="Name"></Column>
            <Column field="category" header="Category"></Column>
            <Column field="quantity" header="Quantity"></Column>
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