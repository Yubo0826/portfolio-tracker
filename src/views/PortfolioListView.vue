
<template>
  <div>

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

      <DataTable v-model:selection="selectedPortfolios" selectionMode="multiple" :metaKeySelection="false" :value="rows" :loading="isLoading" dataKey="id" tableStyle="min-width: 60rem">
          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          <Column field="name" :header="$t('name')"></Column>
          <Column field="description" :header="$t('description')"></Column>
          <Column field="holdingsCount" sortable :header="$t('holdingsCount')"></Column>
          <Column field="marketValueSort" sortable :header="$t('currentValue')">
            <template #body="{ data }">
              <span
                v-if="data.marketValue === null"
                class="text-muted-color cursor-help"
                v-tooltip.bottom="$t('mixedCurrencyHint')"
              >--</span>
              <span v-else class="font-mono text-[13px]">{{ formatAmountWithCode(data.marketValue) }}</span>
            </template>
          </Column>
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
                  <Button icon="pi pi-pencil" :aria-label="$t('updatePortfolio')" v-tooltip.bottom="$t('updatePortfolio')" class="p-button-rounded p-button-text" severity="info" @click="updateSelectedPortfolios(slotProps.data.id)" />
                  <Button icon="pi pi-copy" :aria-label="$t('duplicatePortfolio')" v-tooltip.bottom="$t('duplicatePortfolio')" class="p-button-rounded p-button-text" severity="secondary" @click="duplicatePortfolio(slotProps.data.id)" />
              </template>  
          </Column>

          <template #empty>
              <div class="p-4 text-center text-muted-color">
              <i class="pi pi-info-circle mr-2" />
                {{ $t('noData') }}
              </div>
          </template>

      </DataTable>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useCurrency } from '@/composables/useCurrency'
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
const { convertAmountToUsd, formatAmountWithCode } = useCurrency()

// convertAmountToUsd 目前只認得 USD / TWD，其餘幣別會原封不動回傳（useCurrency.ts）。
// 含不支援幣別的組合寧可不顯示市值，也不要給出一個會參與排序的錯誤數字。
const SUPPORTED_CURRENCIES = new Set(['USD', 'TWD'])

// 市值以美金加總，顯示時才由 formatAmountWithCode 轉成使用者的顯示幣別
const rows = computed(() =>
  portfolioStore.portfolios.map((p) => {
    const hs = p.holdings || []
    const hasUnsupported = hs.some(
      (h) => !SUPPORTED_CURRENCIES.has(String(h.currency || 'USD').toUpperCase())
    )
    const marketValue = hasUnsupported
      ? null
      : hs.reduce(
          (sum, h) =>
            sum + convertAmountToUsd((Number(h.current_price) || 0) * (Number(h.total_shares) || 0), h.currency),
          0
        )

    return {
      ...p,
      holdingsCount: hs.length,
      marketValue,
      // 無法計算的組合固定排在最小端（市值不會是負數）
      marketValueSort: marketValue ?? -1,
    }
  })
)
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

// 製作副本：複製投資組合設定與交易紀錄，不影響目前選取的投資組合
const duplicatePortfolio = async (id) => {
  const p = portfolioStore.portfolios.find(p => p.id === id)
  if (!p) return

  try {
    isLoading.value = true
    const created = await portfolioStore.addPortfolio({
      name: t('portfolioCopyName', { name: p.name }),
      description: p.description || '',
      drift_threshold: p.drift_threshold ?? 5,
      enable_email_alert: p.enable_email_alert ?? true,
      source_id: p.id,
    })
    toast.success(t('portfolioDuplicated', { name: created?.name || '' }))
  } catch (error) {
    console.error('Error duplicating portfolio:', error)
    toast.error(t('errorOccurred'), error.message || '')
  } finally {
    isLoading.value = false
  }
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

<style scoped>
/* 圓角對齊 PortfolioView 內的表格（Aura card 用 border.radius.xl） */
:deep(.p-datatable) {
  border-radius: var(--p-border-radius-xl);
  overflow: hidden;
}
</style>
