<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAuthStore } from '@/stores/auth'
import Textarea from 'primevue/textarea'
import FloatLabel from 'primevue/floatlabel'

import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";

const confirm = useConfirm();
const toast = useToast();

const portfolioStore = usePortfolioStore()
const auth = useAuthStore()

const selectedPortfolios = ref([])
const isLoading = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)

const newPortfolio = ref({
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


const addPortfolio = async () => {
  const { name, description } = newPortfolio.value
  if (!name) {
    console.warn('Name are required')
    return
  }

  try {
    isLoading.value = true
    await portfolioStore.addPortfolio({ name, description })
    newPortfolio.value = { name: '', description: '' }
  } catch (error) {
    console.error('Error adding portfolio:', error)
  } finally {
    isLoading.value = false
    dialogVisible.value = false
  }
}


const updateSelectedPortfolios = (id) => {
  const p = portfolioStore.portfolios.find(p => p.id === id)
  if (!p) return
  editingId.value = id
  dialogVisible.value = true
  newPortfolio.value = { name: p.name, description: p.description }
}

const updatePortfolio = async () => {
  const { name, description } = newPortfolio.value
  if (!name) {
    console.warn('Name are required')
    return
  }

  try {
    isLoading.value = true
    await portfolioStore.editPortfolio(editingId.value, { name, description })
    newPortfolio.value = { name: '', description: '' }
  } catch (error) {
    console.error('Error updating portfolio:', error)
  } finally {
    editingId.value = null
    isLoading.value = false
    dialogVisible.value = false
  }
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
        reject: () => {
            toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
        }
    });
};

const clickSave = () => {
  if (editingId.value) {
    updatePortfolio()
  } else {
    addPortfolio()
  }
}

const dialogTitle = computed(() => {
  return editingId.value ? 'Update Portfolio' : 'Add Portfolio'
})

</script>

<template>
<div>
    <Toast />
    <ConfirmDialog></ConfirmDialog>
    <div class="flex justify-end mb-4">
        <Button label="Add Portfolio" icon="pi pi-plus" class="p-button-success mr-2" @click="dialogVisible = true" />
        <Button label="Delete" @click="confirm2" icon="pi pi-trash" class="mr-2" severity="danger" />
    </div>

    <Dialog v-model:visible="dialogVisible" :header="dialogTitle" modal :style="{ width: '50vw' }">
        <span class="text-surface-500 dark:text-surface-400 block mb-8">Update your information.</span>
            <div class="flex items-center gap-4 mb-4">
                <label for="name" class="font-semibold w-24">Name</label>
                <InputText id="name" class="flex-auto" autocomplete="off" v-model="newPortfolio.name" />
            </div>
            <div class="flex items-center gap-4 mb-8">
                <label for="description" class="font-semibold w-24">Description</label>
                <FloatLabel variant="on">
                    <Textarea id="over_label" v-model="newPortfolio.description" rows="5" cols="30" style="resize: none" />
                    <label for="on_label">On Label</label>
                </FloatLabel>
            </div>
            <div class="flex justify-end gap-2">
                <Button type="button" label="Cancel" severity="secondary" @click="dialogVisible = false"></Button>
                <Button type="button" label="Save" @click="clickSave"></Button>
            </div>
    </Dialog>

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
