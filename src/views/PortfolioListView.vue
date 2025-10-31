
<template>
  <div>
      <ConfirmDialog></ConfirmDialog>

      <div class="text-xl font-semibold mt-16">
        {{ t('portfolios') }}
      </div>

      <div class="flex justify-end mb-8 mt-4">
          <Button
            :label="$t('addPortfolio')"
            @click="dialogVisible = true"
            class="mr-2"
            icon="pi pi-plus"
            severity="secondary"
            size="small"
          />
          <Button
            :label="$t('delete')"
            @click="showDeleteConfirm"
            :disabled="selectedPortfolios.length === 0"
            class="mr-2"
            icon="pi pi-trash"
            severity="secondary"
            size="small"
          />
          <!-- <Button icon="pi pi-plus" class="p-button-rounded p-button-text mr-2" @click="dialogVisible = true" size="small" />
          <Button @click="confirm2" :disabled="selectedPortfolios.length === 0" icon="pi pi-trash" class="p-button-rounded p-button-text mr-2" size="small" severity="danger" /> -->
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
          <Column field="drift_threshold" :header="$t('driftThreshold') + ' (%)'">
            <template #body="slotProps">
              {{ (slotProps.data.drift_threshold) }}
            </template>
          </Column>
          <Column field="enable_email_alert">
            <template #header>
              {{ $t('emailAlert') }}
              <i class="pi pi-info-circle ml-1"  v-tooltip.bottom="$t('emailAlertHint')" />
            </template>
            <template #body="slotProps">
              {{ slotProps.data.enable_email_alert ? $t('enabled') : $t('disabled') }}
            </template>
          </Column>
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

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as toast from '@/composables/toast'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { usePortfolioStore } from '@/stores/portfolio'
import { useAuthStore } from '@/stores/auth'

import PortfolioFormDialog from '@/components/PortfolioFormDialog.vue'

import { useConfirm } from "primevue/useconfirm";
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
    drift_threshold: 5,
    enable_email_alert: true
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
    drift_threshold: p.drift_threshold,
    enable_email_alert: p.enable_email_alert
  }
  dialogVisible.value = true
}

// 刪除確認倒數計時

const countdown = ref(5);
const disabled = ref(true);
let interval;

const showDeleteConfirm = () => {
    countdown.value = 5;
    disabled.value = true;

    confirm.require({
        message: t('portfolioDeletedConfirm'),
        header: t('warn'),
        icon: 'pi pi-info-circle',
        rejectProps: {
            label: t('cancel'),
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: `${t('delete')} (${countdown.value})`,
            severity: 'danger',
            disabled: disabled.value
        },
        reject: () => {
            clearInterval(interval);
        }
    });

    interval = setInterval(() => {
        countdown.value--;
        if (countdown.value > 0) {
            // 每秒更新 label
            confirm.require({
                message: t('portfolioDeletedConfirm'),
                header: t('warn'),
                icon: 'pi pi-info-circle',
                rejectProps: {
                    label: t('cancel'),
                    severity: 'secondary',
                    outlined: true
                },
                acceptProps: {
                    label: `${t('delete')} (${countdown.value})`,
                    severity: 'danger',
                    disabled: true
                },
                reject: () => {
                    clearInterval(interval);
                }
            });
        } else {
            clearInterval(interval);
            disabled.value = false;
            confirm.require({
                message: t('portfolioDeletedConfirm'),
                header: t('warn'),
                icon: 'pi pi-info-circle',
                rejectProps: {
                    label: t('cancel'),
                    severity: 'secondary',
                    outlined: true
                },
                acceptProps: {
                    label: t('delete'),
                    severity: 'danger',
                    disabled: false
                },
                accept: () => {
                    portfolioStore.removePortfolio(selectedPortfolios.value.map(p => p.id));
                    toast.success(t('portfolioDeleted'));
                    clearInterval(interval);
                },
                reject: () => {
                    clearInterval(interval);
                }
            });
        }
    }, 1000);
};

onUnmounted(() => {
    clearInterval(interval);
});

</script>
