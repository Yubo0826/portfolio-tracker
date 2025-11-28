<template>
  <div class="container mx-auto px-4 py-6">
    <!-- 頁面標題 -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">{{ $t('cashFlow.title') }}</h1>
      <div class="flex gap-3">
        <Button 
          icon="pi pi-plus" 
          :label="$t('cashFlow.addAccount')"
          @click="showAddAccountDialog = true"
        />
        <Button 
          icon="pi pi-credit-card" 
          :label="$t('cashFlow.addCashFlow')"
          severity="secondary"
          @click="showAddCashFlowDialog = true"
          :disabled="cashAccounts.length === 0"
        />
      </div>
    </div>

    <!-- 現金總覽卡片（只顯示總資金和帳戶數量） -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <!-- 總現金餘額 -->
      <Card>
        <template #content>
          <div class="flex items-center">
            <div class="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 mr-4">
              <i class="pi pi-wallet text-blue-600 dark:text-blue-400 text-xl"></i>
            </div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-400">{{ $t('cashFlow.totalBalance') }}</div>
              <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${{ totalCashBalance.toLocaleString() }}
              </div>
            </div>
          </div>
        </template>
      </Card>
      <!-- 帳戶數量 -->
      <Card>
        <template #content>
          <div class="flex items-center">
            <div class="bg-purple-100 dark:bg-purple-900/30 rounded-full p-3 mr-4">
              <i class="pi pi-building text-purple-600 dark:text-purple-400 text-xl"></i>
            </div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-400">{{ $t('cashFlow.accountCount') }}</div>
              <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ cashAccounts.length }}</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- 新版現金帳戶管理區塊：左側卡片+帳戶列表，右側現金流列表 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左半邊：卡片+帳戶列表 -->
      <div class="space-y-6">
        <!-- 卡片（總資金和帳戶數量）已在上方顯示 -->
        <Card>
          <template #header>
            <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{{ $t('cashFlow.accounts') }}</h2>
              <Button 
                icon="pi pi-refresh" 
                text 
                rounded 
                @click="fetchCashAccounts" 
                :loading="isLoading"
              />
            </div>
          </template>
          <template #content>
            <div v-if="isLoading" class="text-center py-4">
              <ProgressSpinner />
            </div>
            <div v-else-if="cashAccounts.length === 0" class="text-center py-8">
              <i class="pi pi-wallet text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
              <p class="text-gray-500 dark:text-gray-400">{{ $t('cashFlow.noAccounts') }}</p>
              <Button 
                :label="$t('cashFlow.createFirstAccount')"
                class="mt-4"
                @click="showAddAccountDialog = true"
              />
            </div>
            <div v-else class="space-y-3">
              <div 
                v-for="account in cashAccounts" 
                :key="account.id"
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200 hover:shadow-md"
                :class="{ 
                  'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-sm': selectedAccount?.id === account.id,
                  'bg-white dark:bg-gray-900': selectedAccount?.id !== account.id
                }"
                @click="handleAccountSelection(account)"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h3 class="font-semibold text-gray-800 dark:text-gray-100">{{ account.name }}</h3>
                      <Tag 
                        :value="account.currency" 
                        severity="info" 
                        class="text-xs"
                      />
                    </div>
                    <p v-if="account.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {{ account.description }}
                    </p>
                    <div class="text-lg font-bold mt-2" :class="account.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                      {{ account.currency === 'TWD' ? 'NT$' : '$' }}{{ account.balance.toLocaleString() }}
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <Button 
                      icon="pi pi-pencil" 
                      text 
                      rounded 
                      size="small"
                      @click.stop="editAccount(account)"
                    />
                    <Button 
                      icon="pi pi-trash" 
                      text 
                      rounded 
                      severity="danger"
                      size="small"
                      @click.stop="confirmDeleteAccount(account)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
      <!-- 右半邊：現金流列表 -->
      <div>
        <Card>
          <template #header>
            <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{{ $t('cashFlow.recentFlows') }}</h2>
              <Button 
                :label="$t('cashFlow.viewAll')"
                text 
                @click="$router.push('/cash-flows')"
              />
            </div>
          </template>
          <template #content>
            <div v-if="isLoading" class="text-center py-4">
              <ProgressSpinner />
            </div>
            <div v-else-if="recentCashFlows.length === 0" class="text-center py-8">
              <i class="pi pi-clock text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
              <p class="text-gray-500 dark:text-gray-400">{{ $t('cashFlow.noRecentFlows') }}</p>
            </div>
            <div v-else class="space-y-3">
              <div 
                v-for="flow in recentCashFlows" 
                :key="flow.id"
                class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div class="flex items-center gap-3">
                  <div 
                    class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs"
                    :class="flow.amount > 0 ? 'bg-green-500 dark:bg-green-600' : 'bg-red-500 dark:bg-red-600'"
                  >
                    <i :class="flow.amount > 0 ? 'pi pi-arrow-down' : 'pi pi-arrow-up'"></i>
                  </div>
                  <div>
                    <div class="font-medium text-gray-900 dark:text-gray-100">
                      {{ getFlowDisplayLabel(flow) }}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">{{ flow.description }}</div>
                    <div class="text-xs text-gray-400 dark:text-gray-500">
                      {{ formatDate(flow.createdAt) }}
                    </div>
                  </div>
                </div>
                <div 
                  class="font-semibold text-lg"
                  :class="flow.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                >
                  {{ flow.amount > 0 ? '+' : '' }}${{ Math.abs(flow.amount).toLocaleString() }}
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- 對話框 -->
    <!-- 新增/編輯帳戶對話框 -->
    <Dialog 
      v-model:visible="showAddAccountDialog" 
      modal 
      :closable="false"
      :header="editingAccount ? $t('cashFlow.editAccount') : $t('cashFlow.addAccount')"
      class="w-full max-w-md mx-4 sm:mx-auto"
    >
      <CashAccountForm
        :account="editingAccount"
        @save="handleAccountSubmit"
        @cancel="handleAccountCancel"
      />
    </Dialog>

    <!-- 新增現金流對話框 -->
    <Dialog 
      v-model:visible="showAddCashFlowDialog" 
      modal 
      :closable="false"
      :header="$t('cashFlow.addCashFlow')"
      class="w-full max-w-lg mx-4 sm:mx-auto"
    >
      <CashFlowForm
        :accounts="cashAccounts"
        @save="handleCashFlowSubmit"
        @cancel="handleCashFlowCancel"
      />
    </Dialog>

    <!-- 確認對話框 -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import ProgressSpinner from 'primevue/progressspinner'
import { useCashFlowStore } from '@/stores/cashflow'
import CashAccountForm from '@/components/CashAccountForm.vue'
import CashFlowForm from '@/components/CashFlowForm.vue'
import { showLoading, hideLoading } from '@/composables/loading.js'

import { useAuthStore } from '@/stores/auth';
const auth = useAuthStore();

// Composables
const { t } = useI18n()
const confirm = useConfirm()
const cashFlowStore = useCashFlowStore()

// Destructure store with storeToRefs for reactivity
const {
  cashAccounts,
  cashFlows,
  isLoading,
  selectedAccount,
  totalCashBalance,
  balanceByCurrency
} = storeToRefs(cashFlowStore)

// Store actions (these don't need storeToRefs)
const {
  fetchCashAccounts,
  fetchCashFlows,
  addCashAccount,
  updateCashAccount,
  deleteCashAccount,
  addCashFlow,
  setSelectedAccount,
  getCashFlowTypeLabel
} = cashFlowStore

// 響應式數據
const showAddAccountDialog = ref(false)
const showAddCashFlowDialog = ref(false)
const editingAccount = ref(null)

// 計算屬性
const recentCashFlows = computed(() => {
  if (!cashFlows.value) return []
  
  // 如果有選擇的帳戶，只顯示該帳戶的現金流
  if (selectedAccount.value) {
    return cashFlows.value
      .filter(flow => flow.accountId === selectedAccount.value.id)
      .slice(0, 5)
  }
  
  // 否則顯示所有現金流
  return cashFlows.value.slice(0, 5)
})

// 方法
const handleAccountSelection = async (account) => {
  try {
    showLoading()
    setSelectedAccount(account)
    // 獲取選中帳戶的現金流
    await fetchCashFlows({ accountId: account.id, limit: 10 })
  } finally {
    hideLoading()
  }
}

const editAccount = (account) => {
  editingAccount.value = { ...account }
  showAddAccountDialog.value = true
}

const handleAccountSubmit = async (accountData) => {
  try {
    if (editingAccount.value) {
      await updateCashAccount({ ...accountData, id: editingAccount.value.id })
    } else {
      await addCashAccount(accountData)
    }
    handleAccountCancel()
  } catch (error) {
    console.error('Error saving account:', error)
  }
}

const handleAccountCancel = () => {
  showAddAccountDialog.value = false
  editingAccount.value = null
}

const handleCashFlowSubmit = async (cashFlowData) => {
  try {
    await addCashFlow(cashFlowData)
    handleCashFlowCancel()
  } catch (error) {
    console.error('Error saving cash flow:', error)
  }
}

const handleCashFlowCancel = () => {
  showAddCashFlowDialog.value = false
}

const confirmDeleteAccount = (account) => {
  confirm.require({
    message: `確定要刪除帳戶「${account.name}」嗎？`,
    header: '確認刪除',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: '取消',
      severity: 'secondary'
    },
    acceptProps: {
      label: '刪除',
      severity: 'danger'
    },
    accept: async () => {
      await deleteCashAccount(account.id)
    }
  })
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 獲取現金流顯示標籤（股票買賣會顯示股票代號）
const getFlowDisplayLabel = (flow) => {
  const baseLabel = getCashFlowTypeLabel(flow.type)
  
  if (flow.type === 'STOCK_BUY' && flow.relatedSymbol) {
    return `${t('cashFlow.buy')} ${flow.relatedSymbol}`
  }
  if (flow.type === 'STOCK_SELL' && flow.relatedSymbol) {
    return `${t('cashFlow.sell')} ${flow.relatedSymbol}`
  }
  if (flow.type === 'DIVIDEND' && flow.relatedSymbol) {
    return `${baseLabel} (${flow.relatedSymbol})`
  }
  
  return baseLabel
}

// 生命週期
onMounted(async () => {
  await fetchCashAccounts()
  await fetchCashFlows({ limit: 10 })
})

watch(() => auth.user, async (newUser) => {
  if (newUser) {
    await fetchCashAccounts()
    await fetchCashFlows({ limit: 10 })
  }
})
</script>