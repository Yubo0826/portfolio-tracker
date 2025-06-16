<script setup>
import { ref } from 'vue';
import { request } from '../api.js';

const visible = ref(false);

request('http://localhost:3000/api/tiingo/vt?date=2024-08-26')
.then(response => {
    console.log('Response:', response);
})
.catch(error => {
    console.error('Error:', error);
});

import Button from 'primevue/button';
</script>
<template>
    <div>
        <div class="tool-bar">
            <Button label="Add" @click="visible = true" />

            <Dialog v-model:visible="visible" modal header="Add transaction" :style="{ width: '25rem' }">
            <span class="text-surface-500 dark:text-surface-400 block mb-8">Update your information.</span>
            <div class="flex items-center gap-4 mb-4">
                <label for="username" class="font-semibold w-24">Symbol</label>
                <InputText id="username" class="flex-auto" autocomplete="off" />
            </div>
            <div class="flex items-center gap-4 mb-4">
                <label for="shares" class="font-semibold w-24">Shares</label>
                <InputNumber id="shares" class="flex-auto" showButtons autocomplete="off" />
            </div>
            <div class="flex items-center gap-4 mb-4">
                <label for="date" class="font-semibold w-24">Date</label>
                <DatePicker />
            </div>
            <div class="flex items-center gap-4 mb-8">
                <label for="price" class="font-semibold w-24">price</label>
                <InputText id="price" class="flex-auto" autocomplete="off" />
            </div>
            <div class="flex justify-end gap-2">
                <Button type="button" label="Cancel" severity="secondary" @click="visible = false"></Button>
                <Button type="button" label="Add" @click="visible = false"></Button>
            </div>
        </Dialog>
        </div>

    </div>
</template>
<style scoped>
.tool-bar {
    display: flex;
    justify-content: flex-end;
    margin: 20px 0;
}
</style>