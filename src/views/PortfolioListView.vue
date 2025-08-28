<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAuthStore } from '@/stores/auth'
import Textarea from 'primevue/textarea'
import FloatLabel from 'primevue/floatlabel'

import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";

import PortfolioFormDialog from '@/components/PortfolioFormDialog.vue'

const confirm = useConfirm();
const toast = useToast();

const portfolioStore = usePortfolioStore()
const auth = useAuthStore()

const selectedPortfolios = ref([])
const isLoading = ref(false)
const dialogVisible = ref(false)

const newPortfolio = ref({
  name: '',
  description: '',
})

const editPortfolio = ref({
    id: null,
    name: '',
    description: '',
})

const getPortfolios = async () => {
  if (!auth.user?.uid) {
    console.warn('No user ID found, cannot fetch portfolios')
    return
  }
  try {
    isLoading.value = true
    await portfolioStore.fetchPortfolios()
  } catch (error) {
    console.error('Error fetching portfolios:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  getPortfolios()
})


const updateSelectedPortfolios = (id) => {
  const p = portfolioStore.portfolios.find(p => p.id === id)
  if (!p) return
  editPortfolio.value = {
    id: p.id,
    name: p.name,
    description: p.description,
  }
  dialogVisible.value = true
}

const confirm2 = () => {
    confirm.require({
        message: 'Do you want to delete this record?',
        header: 'Danger Zone',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Cancel',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Delete',
            severity: 'danger'
        },
        accept: () => {
            portfolioStore.removePortfolio(selectedPortfolios.value.map(p => p.id))
            toast.add({ severity: 'info', summary: 'Confirmed', detail: 'Record deleted', life: 3000 });
        },
        // reject: () => {
        //     toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
        // }
    });
};

</script>

<template>
<div>
    <ConfirmDialog></ConfirmDialog>
    <div class="flex justify-end mb-4">
        <Button label="Add Portfolio" icon="pi pi-plus" class="p-button-success mr-2" @click="dialogVisible = true" />
        <Button label="Delete" @click="confirm2" icon="pi pi-trash" class="mr-2" severity="danger" />
    </div>

    <PortfolioFormDialog 
        :visible="dialogVisible"
        :editPortfolio="editPortfolio"
        @update:loading="isLoading = $event"
        @update:visible="dialogVisible = $event"
        @clear:editPortfolio="editPortfolio = { id: null, name: '', description: '' }"
        />

    <DataTable v-model:selection="selectedPortfolios" :value="portfolioStore.portfolios" :loading="isLoading" dataKey="id" tableStyle="min-width: 50rem">
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
