<script setup>
import { ref, onMounted, computed } from 'vue'
import * as toast from '@/composables/toast'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { usePortfolioStore } from '@/stores/portfolio'
import { useAuthStore } from '@/stores/auth'

import { useConfirm } from "primevue/useconfirm";

import PortfolioFormDialog from '@/components/PortfolioFormDialog.vue'

const confirm = useConfirm();

const portfolioStore = usePortfolioStore()
const auth = useAuthStore()

const selectedPortfolios = ref([])
const isLoading = ref(false)
const dialogVisible = ref(false)

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
        message: t('portfolioDeletedConfirm'),
        header: t('warn'),
        icon: 'pi pi-info-circle',
        rejectLabel: t('cancel'),
        rejectProps: {
            label: t('cancel'),
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: t('delete'),
            severity: 'danger'
        },
        accept: () => {
            portfolioStore.removePortfolio(selectedPortfolios.value.map(p => p.id))
            toast.success(`${t('portfolioDeleted')}`)
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
      <div class="flex justify-end mb-8 mt-8">
          <Button icon="pi pi-plus" class="p-button-rounded p-button-text mr-2" @click="dialogVisible = true" size="small" />
          <Button @click="confirm2" :disabled="selectedPortfolios.length === 0" icon="pi pi-trash" class="p-button-rounded p-button-text mr-2" size="small" severity="danger" />
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
          <Column field="name" :header="$t('name')"></Column>
          <Column field="description" :header="$t('description')"></Column>
          <Column field="" :header="$t('action')">
              <template #body="slotProps">
                  <Button icon="pi pi-pencil" class="p-button-rounded p-button-text" severity="info" @click="updateSelectedPortfolios(slotProps.data.id)" />
              </template>  
          </Column>

          <template #empty>
              <div class="p-4 text-center text-gray-500">
              <i class="pi pi-info-circle mr-2" />
                {{ $t('noData') }}
              </div>
          </template>

      </DataTable>
  </div>
</template>
