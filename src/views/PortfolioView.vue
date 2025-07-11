<script setup>
import { ref, onMounted } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAuthStore } from '@/stores/auth'

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
