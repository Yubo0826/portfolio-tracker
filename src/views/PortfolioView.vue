<script setup>
import { ref, watch } from 'vue';
import api from '../api.js';
import Textarea from 'primevue/textarea';
import FloatLabel from 'primevue/floatlabel';
import 'primeicons/primeicons.css'

const portfolios = ref([]);
const selectedPortfolios = ref([]);
const isLoading = ref(false);

import { useAuthStore } from '@/stores/auth';
const auth = useAuthStore();
const uid = ref(null);

const getPortfolios = async () => {
    if (!uid.value) {
        console.warn('No user ID found, cannot fetch portfolios');
        return;
    }
    try {
        isLoading.value = true;
        const data = await api.get(`http://localhost:3000/api/portfolio?uid=${uid.value}`);
        console.log('Fetched portfolios:', data);
        portfolios.value = data.portfolios.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description
        }));
    } catch (error) {
        console.error('Error fetching portfolios:', error);
    } finally {
        isLoading.value = false;
    }
};

// 如果有用戶登入，則設定 uid
if (auth.user) {
    uid.value = auth.user.uid; 
    getPortfolios();
    console.log('User is logged in:', auth.user.uid);
} else {
    console.log('No user is logged in');
}

watch(() => auth.user, (newUser) => {
  if (newUser) {
    uid.value = newUser.uid;
    getPortfolios();
  }
})

const addPortfolio = async () => {
    if (!newPortfolio.value.name || !newPortfolio.value.description) {
        console.warn('Name and description are required to add a portfolio');
        return;
    }
    try {
        isLoading.value = true;
        const data = await api.post('http://localhost:3000/api/portfolio', {
            uid: uid.value,
            name: newPortfolio.value.name,
            description: newPortfolio.value.description
        });
        portfolios.value.push(data);
        newPortfolio.value.name = '';
        newPortfolio.value.description = '';
    } catch (error) {
        console.error('Error adding portfolio:', error);
    } finally {
        isLoading.value = false;
        dialogVisible.value = false;
    }
};

const editingId = ref(null);
const updateSelectedPortfolios = (id) => {
    const portfolio = portfolios.value.find(p => p.id === id);
    console.log('Editing portfolio:', portfolio);
    editingId.value = id;
    dialogVisible.value = true;
    newPortfolio.value.name = portfolio.name;
    newPortfolio.value.description = portfolio.description;
};

const dialogVisible = ref(false);
const newPortfolio = ref({
    name: '',
    description: ''
});

</script>
<template>
<div>
    <Button label="Add Portfolio" icon="pi pi-plus" class="p-button-success mb-3" @click="dialogVisible = true" />

    <Dialog v-model:visible="dialogVisible" header="Add Portfolio" modal :style="{ width: '50vw' }">
        <span class="text-surface-500 dark:text-surface-400 block mb-8">Update your information.</span>
            <div class="flex items-center gap-4 mb-4">
                <label for="name" class="font-semibold w-24">Name</label>
                <InputText id="name" class="flex-auto" autocomplete="off" v-model="newPortfolio.name" />
            </div>
            <div class="flex items-center gap-4 mb-8">
                <label for="description" class="font-semibold w-24">Description</label>
                <InputTextarea id="description" class="flex-auto" v-model="newPortfolio.description" rows="3" />
                <FloatLabel variant="on">
                    <Textarea id="over_label" v-model="newPortfolio.description" rows="5" cols="30" style="resize: none" />
                    <label for="on_label">On Label</label>
                </FloatLabel>
            </div>
            <div class="flex justify-end gap-2">
                <Button type="button" label="Cancel" severity="secondary" @click="dialogVisible = false"></Button>
                <Button type="button" label="Save" @click="addPortfolio"></Button>
            </div>
    </Dialog>

    <DataTable v-model:selection="selectedPortfolios" :value="portfolios" :loading="isLoading" dataKey="id" tableStyle="min-width: 50rem">
        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
        <Column field="name" header="Name"></Column>
        <Column field="description" header="Description"></Column>
        <Column field="" header="Action">
            <template #body="slotProps">
                <Button icon="pi pi-pencil" class="p-button-rounded p-button-text" severity="info" @click="updateSelectedPortfolios(slotProps.data.id)" />
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
