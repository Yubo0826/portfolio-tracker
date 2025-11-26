<template>
  <div class="container mx-auto mt-4 max-w-screen-xl">
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
          :disabled="activeAccounts.length === 0"
        />
      </div>
    </div>

    <!-- 現金總覽卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- 總現金餘額 -->
      <Card class="rounded-xl shadow-md">
        <template #title>
          <div class="flex items-center">
            <Button icon="pi pi-wallet" severity="secondary" rounded size="small" disabled />
            <div class="text-sm ml-2">{{ $t('cashFlow.totalBalance') }}</div>
          </div>
        </template>
        <template #content>
          <div class="flex justify-between items-center mt-2">
            <div class="text-2xl font-bold">
              ${{ totalCashBalance.toLocaleString() }}
            </div>
          </div>
        </template>
        <template #footer>
          <div class="text-sm mt-2 opacity-75">
            {{ Object.keys(balanceByCurrency).join(', ') }}
          </div>
        </template>
      </Card>

      <!-- 按貨幣顯示餘額 -->
      <Card v-for="(balance, currency) in balanceByCurrency" :key="currency" class="rounded-xl shadow-md">
        <template #title>
          <div class="flex items-center">
            <Button icon="pi pi-dollar" severity="secondary" rounded size="small" disabled />
            <div class="text-sm ml-2">{{ currency }}</div>
          </div>
        </template>
        <template #content>
          <div class="flex justify-between items-center mt-2">
            <div class="text-2xl font-bold">
              {{ currency === 'TWD' ? 'NT$' : '$' }}{{ balance.toLocaleString() }}
            </div>
          </div>
        </template>
        <template #footer>
          <div class="text-sm mt-2 opacity-75">
            {{ $t('cashFlow.balance') }}
          </div>
        </template>
      </Card>

      <!-- 帳戶數量 -->
      <Card class="rounded-xl shadow-md">
        <template #title>
          <div class="flex items-center">
            <Button icon="pi pi-building" severity="secondary" rounded size="small" disabled />
            <div class="text-sm ml-2">{{ $t('cashFlow.accountCount') }}</div>
          </div>
        </template>
        <template #content>
          <div class="flex justify-between items-center mt-2">
            <div class="text-2xl font-bold">{{ activeAccounts.length }}</div>
          </div>
        </template>
        <template #footer>
          <div class="text-sm mt-2 opacity-75">
            {{ $t('cashFlow.activeAccounts') }}
          </div>
        </template>
      </Card>
    </div>

    <!-- 現金帳戶管理 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 現金帳戶列表 -->
      <Card>
        <template #title>
          <div class="flex justify-between items-center">
            <span>{{ $t('cashFlow.accounts') }}</span>
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
              @click="setSelectedAccount(account)"
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
                    <Tag 
                      v-if="!account.isActive" 
                      value="停用" 
                      severity="warning" 
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

      <!-- 最近現金流 -->
      <Card>
        <template #title>
          <div class="flex justify-between items-center">
            <span>{{ $t('cashFlow.recentFlows') }}</span>
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
                  <div class="font-medium text-gray-900 dark:text-gray-100">{{ getCashFlowTypeLabel(flow.type) }}</div>
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
                {{ flow.amount > 0 ? '+' : '' }}${{ flow.amount.toLocaleString() }}
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- 新增現金帳戶對話框 -->
    <Dialog 
      v-model:visible="showAddAccountDialog" 
      :header="editingAccount ? $t('cashFlow.editAccount') : $t('cashFlow.addAccount')"
      modal 
      :style="{ width: '500px' }"
    >
      <CashAccountForm 
        :account="editingAccount"
        @save="handleSaveAccount"
        @cancel="cancelAccountForm"
      />
    </Dialog>

    <!-- 新增現金流對話框 -->
    <Dialog 
      v-model:visible="showAddCashFlowDialog" 
      :header="$t('cashFlow.addCashFlow')"
      modal 
      :style="{ width: '600px' }"
    >
      <CashFlowForm 
        :accounts="activeAccounts"
        @save="handleSaveCashFlow"
        @cancel="showAddCashFlowDialog = false"
      />
    </Dialog>

    <!-- 刪除確認對話框 -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import { useCashFlowStore } from '@/stores/cashflow'
import CashAccountForm from '@/components/CashAccountForm.vue'
import CashFlowForm from '@/components/CashFlowForm.vue'

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
  balanceByCurrency,
  activeAccounts
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
const recentCashFlows = computed(() => 
  (cashFlows.value || []).slice(0, 5)
)

// 方法
const editAccount = (account) => {
  editingAccount.value = { ...account }
  showAddAccountDialog.value = true
}

const handleSaveAccount = async (accountData) => {
  if (editingAccount.value) {
    await updateCashAccount({
      ...accountData,
      id: editingAccount.value.id
    })
  } else {
    await addCashAccount(accountData)
  }
  
  cancelAccountForm()
  await fetchCashAccounts()
}

const cancelAccountForm = () => {
  showAddAccountDialog.value = false
  editingAccount.value = null
}

const confirmDeleteAccount = (account) => {
  confirm.require({
    message: `確定要刪除現金帳戶「${account.name}」嗎？這將同時刪除相關的所有現金流記錄。`,
    header: '刪除確認',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteCashAccount(account.id)
  })
}

const handleSaveCashFlow = async (cashFlowData) => {
  await addCashFlow(cashFlowData)
  showAddCashFlowDialog.value = false
  await fetchCashFlows({ limit: 10 })
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 生命週期
onMounted(async () => {
  await fetchCashAccounts()
  await fetchCashFlows({ limit: 10 })
})
</script>