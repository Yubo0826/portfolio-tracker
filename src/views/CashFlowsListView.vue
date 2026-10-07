<template>
  <div class="container mx-auto px-4 py-6">
    <!-- 頁面標題 -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">{{ $t('cashFlow.allCashFlows') }}</h1>
        <p class="text-sm text-surface-600 mt-1">{{ $t('cashFlow.allCashFlowsDesc') }}</p>
      </div>
      <Button 
        icon="pi pi-arrow-left" 
        :label="$t('cashFlow.backToOverview')"
        text
        @click="$router.push('/cash-flow')"
      />
    </div>

    <!-- 帳戶選擇和過濾器 -->
    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 帳戶選擇 -->
          <div>
            <label class="block text-sm font-medium mb-2">{{ $t('cashFlow.selectAccount') }}</label>
            <Select 
              v-model="selectedAccountId" 
              :options="accountOptions"
              optionLabel="label"
              optionValue="value"
              :placeholder="$t('cashFlow.allAccounts')"
              class="w-full"
              @change="handleAccountChange"
            />
          </div>

          <!-- 現金流類型過濾 -->
          <div>
            <label class="block text-sm font-medium mb-2">{{ $t('cashFlow.flowType') }}</label>
            <Select 
              v-model="selectedFlowType" 
              :options="flowTypeOptions"
              optionLabel="label"
              optionValue="value"
              :placeholder="$t('cashFlow.allTypes')"
              class="w-full"
              @change="handleFilterChange"
            />
          </div>

          <!-- 日期範圍 -->
          <div>
            <label class="block text-sm font-medium mb-2">{{ $t('cashFlow.dateRange') }}</label>
            <DatePicker 
              v-model="dateRange" 
              selectionMode="range"
              :placeholder="$t('cashFlow.selectDateRange')"
              dateFormat="yy/mm/dd"
              class="w-full"
              @date-select="handleFilterChange"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- 現金流統計卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <!-- 總收入 -->
      <Card>
        <template #content>
          <div class="flex items-center">
            <div class="rounded-full p-3 bg-green-50 mr-4">
              <i class="pi pi-arrow-down text-green-600 text-xl"></i>
            </div>
            <div>
              <div class="text-sm text-surface-600">{{ $t('cashFlow.totalIncome') }}</div>
              <div class="text-2xl font-bold text-green-600">
                {{ formatAmount(totalIncome) }}
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- 總支出 -->
      <Card>
        <template #content>
          <div class="flex items-center">
            <div class="rounded-full p-3 bg-red-50 mr-4">
              <i class="pi pi-arrow-up text-red-600 text-xl"></i>
            </div>
            <div>
              <div class="text-sm text-surface-600">{{ $t('cashFlow.totalExpense') }}</div>
              <div class="text-2xl font-bold text-red-600">
                {{ formatAmount(Math.abs(totalExpense)) }}
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- 淨現金流 -->
      <Card>
        <template #content>
          <div class="flex items-center">
            <div class="rounded-full p-3 bg-blue-50 mr-4">
              <i class="pi pi-chart-line text-blue-600 text-xl"></i>
            </div>
            <div>
              <div class="text-sm text-surface-600">{{ $t('cashFlow.netCashFlow') }}</div>
              <div 
                class="text-2xl font-bold"
                :class="netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ formatChange(netCashFlow) }}
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- 現金流列表 -->
    <Card>
      <template #header>
        <div class="flex justify-between items-center p-4 border-b border-[var(--p-overlay-modal-border-color)]">
          <h2 class="text-xl font-semibold">
            {{ selectedAccountId ? getAccountName(selectedAccountId) : $t('cashFlow.allCashFlows') }}
          </h2>
          <div class="flex items-center gap-2">
            <span class="text-sm text-surface-600">
              {{ $t('cashFlow.totalRecords', { count: filteredCashFlows.length }) }}
            </span>
            <Button 
              icon="pi pi-refresh" 
              text 
              rounded 
              @click="refreshData" 
              :loading="isLoading"
            />
          </div>
        </div>
      </template>
      
      <template #content>
        <div v-if="isLoading" class="text-center py-8">
          <ProgressSpinner />
        </div>
        
        <div v-else-if="filteredCashFlows.length === 0" class="text-center py-12">
          <i class="pi pi-inbox text-6xl text-surface-400 mb-4"></i>
          <p class="text-surface-600">{{ $t('cashFlow.noFlowsFound') }}</p>
        </div>

        <DataTable 
          v-else
          :value="filteredCashFlows" 
          :paginator="true" 
          :rows="20"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          dataKey="id"
          stripedRows
          :sortField="'createdAt'"
          :sortOrder="-1"
          responsiveLayout="scroll"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :currentPageReportTemplate="$t('cashFlow.paginationTemplate')"
        >
          <!-- 日期時間 -->
          <Column field="createdAt" :header="$t('cashFlow.dateTime')" sortable style="min-width: 150px">
            <template #body="{ data }">
              <div class="flex flex-col">
                <span class="font-medium">{{ formatDate(data.createdAt) }}</span>
                <span class="text-xs text-surface-500">{{ formatTime(data.createdAt) }}</span>
              </div>
            </template>
          </Column>

          <!-- 類型 -->
          <Column field="type" :header="$t('cashFlow.flowType')" sortable style="min-width: 120px">
            <template #body="{ data }">
              <Tag 
                :value="getCashFlowTypeLabel(data.type)"
                :severity="getFlowTypeSeverity(data.type)"
              />
            </template>
          </Column>

          <!-- 帳戶 -->
          <Column field="accountId" :header="$t('cashFlow.account')" sortable style="min-width: 150px">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <i class="pi pi-wallet text-surface-500"></i>
                <span>{{ getAccountName(data.accountId) }}</span>
              </div>
            </template>
          </Column>

          <!-- 描述 -->
          <Column field="description" :header="$t('cashFlow.description')" style="min-width: 200px">
            <template #body="{ data }">
              <div class="flex flex-col">
                <span>{{ data.description || '-' }}</span>
                <span v-if="data.relatedSymbol" class="text-xs text-surface-500">
                  <i class="pi pi-chart-line mr-1"></i>
                  {{ data.relatedSymbol }}
                </span>
              </div>
            </template>
          </Column>

          <!-- 金額 -->
          <Column field="amount" :header="$t('cashFlow.amount')" sortable style="min-width: 150px">
            <template #body="{ data }">
              <div 
                class="text-lg font-bold flex items-center justify-end gap-2"
                :class="data.amount > 0 ? 'text-green-600' : 'text-red-600'"
              >
                <i 
                  :class="data.amount > 0 ? 'pi pi-arrow-down' : 'pi pi-arrow-up'"
                  class="text-sm"
                ></i>
                <span>{{ formatChange(data.amount) }}</span>
              </div>
            </template>
          </Column>

          <!-- 餘額 -->
          <Column field="balanceAfter" :header="$t('cashFlow.balanceAfter')" style="min-width: 150px">
            <template #body="{ data }">
              <div class="text-right">
                <span class="font-medium">{{ formatAmount(data.balanceAfter || 0) }}</span>
              </div>
            </template>
          </Column>

          <!-- 操作 -->
          <Column :header="$t('action')" style="min-width: 100px">
            <template #body="{ data }">
              <div class="flex gap-2 justify-end">
                <Button 
                  icon="pi pi-eye" 
                  text 
                  rounded 
                  size="small"
                  @click="viewFlowDetail(data)"
                  v-tooltip.top="$t('cashFlow.viewDetail')"
                />
                <Button 
                  icon="pi pi-trash" 
                  text 
                  rounded 
                  severity="danger"
                  size="small"
                  @click="confirmDeleteFlow(data)"
                  v-tooltip.top="$t('delete')"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- 確認對話框 -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import ProgressSpinner from 'primevue/progressspinner'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Tag from 'primevue/tag'
import { useCashFlowStore } from '@/stores/cashflow'
import { useCurrency } from '@/composables/useCurrency'
import { useAuthStore } from '@/stores/auth'

// Composables
const { t } = useI18n()
const confirm = useConfirm()
const cashFlowStore = useCashFlowStore()
const { formatAmount, formatChange } = useCurrency()
const auth = useAuthStore()

// Destructure store
const {
  cashAccounts,
  cashFlows,
  isLoading,
} = storeToRefs(cashFlowStore)

const {
  fetchCashAccounts,
  fetchCashFlows,
  getCashFlowTypeLabel,
  deleteCashFlow
} = cashFlowStore

// 響應式數據
const selectedAccountId = ref(null)
const selectedFlowType = ref(null)
const dateRange = ref(null)

// 帳戶選項
const accountOptions = computed(() => {
  return [
    { label: t('cashFlow.allAccounts'), value: null },
    ...cashAccounts.value.map(account => ({
      label: `${account.name} (${formatAmount(account.balance)})`,
      value: account.id
    }))
  ]
})

// 現金流類型選項
const flowTypeOptions = computed(() => {
  return [
    { label: t('cashFlow.allTypes'), value: null },
    { label: t('cashFlow.types.deposit'), value: 'DEPOSIT' },
    { label: t('cashFlow.types.withdrawal'), value: 'WITHDRAWAL' },
    { label: t('cashFlow.types.dividend'), value: 'DIVIDEND' },
    { label: t('cashFlow.types.fee'), value: 'FEE' },
    { label: t('cashFlow.types.transfer'), value: 'TRANSFER' },
    { label: t('cashFlow.buy'), value: 'STOCK_BUY' },
    { label: t('cashFlow.sell'), value: 'STOCK_SELL' },
    { label: t('cashFlow.types.other'), value: 'OTHER' }
  ]
})

// 過濾後的現金流
const filteredCashFlows = computed(() => {
  let flows = [...cashFlows.value]

  // 按帳戶過濾
  if (selectedAccountId.value) {
    flows = flows.filter(flow => flow.accountId === selectedAccountId.value)
  }

  // 按類型過濾
  if (selectedFlowType.value) {
    flows = flows.filter(flow => flow.type === selectedFlowType.value)
  }

  // 按日期範圍過濾
  if (dateRange.value && dateRange.value[0]) {
    const startDate = new Date(dateRange.value[0])
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = dateRange.value[1] ? new Date(dateRange.value[1]) : new Date()
    endDate.setHours(23, 59, 59, 999)

    flows = flows.filter(flow => {
      const flowDate = new Date(flow.createdAt)
      return flowDate >= startDate && flowDate <= endDate
    })
  }

  return flows
})

// 統計數據
const totalIncome = computed(() => {
  return filteredCashFlows.value
    .filter(flow => flow.amount > 0)
    .reduce((sum, flow) => sum + flow.amount, 0)
})

const totalExpense = computed(() => {
  return filteredCashFlows.value
    .filter(flow => flow.amount < 0)
    .reduce((sum, flow) => sum + flow.amount, 0)
})

const netCashFlow = computed(() => {
  return totalIncome.value + totalExpense.value
})

// 方法
const getAccountName = (accountId) => {
  const account = cashAccounts.value.find(a => a.id === accountId)
  return account ? account.name : '-'
}

const getFlowTypeSeverity = (type) => {
  const severityMap = {
    'DEPOSIT': 'success',
    'WITHDRAWAL': 'danger',
    'DIVIDEND': 'info',
    'FEE': 'warn',
    'TRANSFER': 'secondary',
    'STOCK_BUY': 'danger',
    'STOCK_SELL': 'success',
    'OTHER': 'contrast'
  }
  return severityMap[type] || 'contrast'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleAccountChange = () => {
  // 帳戶變更時可以做額外處理
}

const handleFilterChange = () => {
  // 過濾器變更時可以做額外處理
}

const refreshData = async () => {
  await Promise.all([
    fetchCashAccounts(),
    fetchCashFlows({ limit: 1000 }) // 獲取更多記錄用於過濾
  ])
}

const viewFlowDetail = (flow) => {
  // TODO: 實作查看詳情功能
  console.log('View flow detail:', flow)
}

const confirmDeleteFlow = (flow) => {
  confirm.require({
    message: t('cashFlow.confirmDeleteFlow'),
    header: t('cashFlow.deleteFlow'),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: t('cancel'),
      severity: 'secondary'
    },
    acceptProps: {
      label: t('delete'),
      severity: 'danger'
    },
    accept: async () => {
      await deleteCashFlow(flow.id)
      await refreshData()
    }
  })
}

// 生命週期
onMounted(async () => {
  await refreshData()
})

watch(() => auth.user, async (newUser) => {
  if (newUser) {
    await refreshData()
  }
})
</script>
