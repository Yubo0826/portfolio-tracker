<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- 現金帳戶選擇 -->
    <div>
      <label for="accountId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('cashFlow.selectAccount') }} *
      </label>
      <Dropdown
        id="accountId"
        v-model="form.accountId"
        :options="accounts"
        optionLabel="name"
        optionValue="id"
        :placeholder="$t('cashFlow.selectAccountPlaceholder')"
        class="w-full"
        :class="errors.accountId ? 'p-invalid' : ''"
        required
      >
        <template #option="slotProps">
          <div class="flex justify-between items-center w-full">
            <div>
              <span>{{ slotProps.option.name }}</span>
              <small class="text-gray-500 dark:text-gray-400 ml-2">({{ slotProps.option.currency }})</small>
            </div>
            <span class="font-semibold">
              ${{ slotProps.option.balance.toLocaleString() }}
            </span>
          </div>
        </template>
      </Dropdown>
      <small v-if="errors.accountId" class="p-error">{{ errors.accountId }}</small>
    </div>

    <!-- 現金流類型 -->
    <div>
      <label for="type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('cashFlow.flowType') }} *
      </label>
      <Dropdown
        id="type"
        v-model="form.type"
        :options="flowTypeOptions"
        optionLabel="label"
        optionValue="value"
        :placeholder="$t('cashFlow.selectFlowType')"
        class="w-full"
        :class="errors.type ? 'p-invalid' : ''"
        required
      />
      <small v-if="errors.type" class="p-error">{{ errors.type }}</small>
    </div>

    <!-- 金額 -->
    <div>
      <label for="amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('cashFlow.amount') }} *
      </label>
      <div class="flex gap-2">
        <Dropdown
          v-model="amountType"
          :options="amountTypeOptions"
          optionLabel="label"
          optionValue="value"
          class="w-24"
        />
        <InputNumber
          id="amount"
          v-model="form.amount"
          :placeholder="$t('cashFlow.amountPlaceholder')"
          class="flex-1"
          :class="errors.amount ? 'p-invalid' : ''"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          :min="0.01"
          required
        />
      </div>
      <small v-if="errors.amount" class="p-error">{{ errors.amount }}</small>
      <small class="text-gray-500 dark:text-gray-400">
        {{ amountType === 'income' ? $t('cashFlow.incomeHint') : $t('cashFlow.expenseHint') }}
      </small>
    </div>

    <!-- 描述 -->
    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('cashFlow.description') }} *
      </label>
      <Textarea
        id="description"
        v-model="form.description"
        :placeholder="$t('cashFlow.descriptionPlaceholder')"
        class="w-full"
        :class="{ 'p-invalid': errors.description }"
        rows="3"
        :maxlength="200"
        required
      />
      <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
      <small class="text-gray-500 dark:text-gray-400">
        {{ form.description?.length || 0 }}/200
      </small>
    </div>

    <!-- 關聯股票（可選） -->
    <div v-if="showStockRelation">
      <label for="relatedSymbol" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('cashFlow.relatedStock') }}
      </label>
      <InputText
        id="relatedSymbol"
        v-model="form.relatedSymbol"
        :placeholder="$t('cashFlow.relatedStockPlaceholder')"
        class="w-full"
      />
      <small class="text-gray-500 dark:text-gray-400">{{ $t('cashFlow.relatedStockHint') }}</small>
    </div>

    <!-- 日期時間 -->
    <div>
      <label for="createdAt" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('cashFlow.transactionDate') }}
      </label>
      <Calendar
        id="createdAt"
        v-model="transactionDate"
        dateFormat="yy/mm/dd"
        :placeholder="$t('cashFlow.selectDate')"
        class="w-full"
        showTime
        hourFormat="24"
      />
      <small class="text-gray-500 dark:text-gray-400">{{ $t('cashFlow.dateHint') }}</small>
    </div>

    <!-- 預覽 -->
    <div v-if="form.accountId && form.amount" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h4 class="font-medium text-gray-700 dark:text-gray-300 mb-2">{{ $t('cashFlow.preview') }}</h4>
      <div class="space-y-1 text-sm text-gray-700 dark:text-gray-300">
        <div class="flex justify-between">
          <span>{{ $t('cashFlow.account') }}:</span>
          <span>{{ selectedAccount?.name }}</span>
        </div>
        <div class="flex justify-between">
          <span>{{ $t('cashFlow.currentBalance') }}:</span>
          <span>${{ selectedAccount?.balance.toLocaleString() }}</span>
        </div>
        <div class="flex justify-between">
          <span>{{ $t('cashFlow.change') }}:</span>
          <span :class="finalAmount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
            {{ finalAmount > 0 ? '+' : '' }}${{ finalAmount.toLocaleString() }}
          </span>
        </div>
        <div class="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-600 pt-1">
          <span>{{ $t('cashFlow.newBalance') }}:</span>
          <span :class="newBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
            ${{ newBalance.toLocaleString() }}
          </span>
        </div>
      </div>
    </div>

    <!-- 按鈕 -->
    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
      <Button
        type="button"
        :label="$t('common.cancel')"
        severity="secondary"
        @click="$emit('cancel')"
      />
      <Button
        type="submit"
        :label="$t('common.save')"
        :loading="isSubmitting"
      />
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'

// Props & Emits
const props = defineProps({
  accounts: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['save', 'cancel'])

// Composables
const { t } = useI18n()

// 表單數據
const form = reactive({
  accountId: '',
  type: '',
  amount: null,
  description: '',
  relatedSymbol: ''
})

// 表單錯誤
const errors = reactive({
  accountId: '',
  type: '',
  amount: '',
  description: ''
})

// 狀態
const isSubmitting = ref(false)
const amountType = ref('income') // 'income' 或 'expense'
const transactionDate = ref(new Date())

// 現金流類型選項
const flowTypeOptions = [
  { label: t('cashFlow.types.deposit'), value: 'DEPOSIT' },
  { label: t('cashFlow.types.withdrawal'), value: 'WITHDRAWAL' },
  { label: t('cashFlow.types.dividend'), value: 'DIVIDEND' },
  { label: t('cashFlow.types.fee'), value: 'FEE' },
  { label: t('cashFlow.types.transfer'), value: 'TRANSFER_IN' },
  { label: t('cashFlow.types.adjustment'), value: 'ADJUSTMENT' },
  { label: t('cashFlow.types.other'), value: 'OTHER' }
]

// 金額類型選項
const amountTypeOptions = [
  { label: '收入 +', value: 'income' },
  { label: '支出 -', value: 'expense' }
]

// 計算屬性
const selectedAccount = computed(() => {
  return props.accounts.find(account => account.id === form.accountId)
})

const finalAmount = computed(() => {
  const baseAmount = form.amount || 0
  return amountType.value === 'income' ? baseAmount : -baseAmount
})

const newBalance = computed(() => {
  if (!selectedAccount.value || !form.amount) return 0
  return selectedAccount.value.balance + finalAmount.value
})

const showStockRelation = computed(() => {
  return ['STOCK_BUY', 'STOCK_SELL', 'DIVIDEND'].includes(form.type)
})

// 監聽金額類型變化，自動調整現金流類型
watch(amountType, (newType) => {
  if (newType === 'expense' && ['DEPOSIT', 'DIVIDEND', 'TRANSFER_IN'].includes(form.type)) {
    form.type = 'WITHDRAWAL'
  } else if (newType === 'income' && ['WITHDRAWAL', 'FEE', 'TRANSFER_OUT'].includes(form.type)) {
    form.type = 'DEPOSIT'
  }
})

// 重置表單
const resetForm = () => {
  form.accountId = ''
  form.type = ''
  form.amount = null
  form.description = ''
  form.relatedSymbol = ''
  amountType.value = 'income'
  transactionDate.value = new Date()
  
  // 清空錯誤
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

// 表單驗證
const validateForm = () => {
  let isValid = true
  
  // 重置錯誤
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })

  // 驗證帳戶
  if (!form.accountId) {
    errors.accountId = t('validation.required')
    isValid = false
  }

  // 驗證類型
  if (!form.type) {
    errors.type = t('validation.required')
    isValid = false
  }

  // 驗證金額
  if (!form.amount || form.amount <= 0) {
    errors.amount = t('validation.required')
    isValid = false
  }

  // 驗證描述
  if (!form.description?.trim()) {
    errors.description = t('validation.required')
    isValid = false
  } else if (form.description.trim().length < 2) {
    errors.description = t('validation.minLength', { min: 2 })
    isValid = false
  }

  // 檢查餘額（如果是支出）
  if (amountType.value === 'expense' && selectedAccount.value) {
    if (selectedAccount.value.balance < form.amount) {
      errors.amount = t('cashFlow.insufficientBalance')
      isValid = false
    }
  }

  return isValid
}

// 提交表單
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  try {
    isSubmitting.value = true
    
    const cashFlowData = {
      accountId: form.accountId,
      type: form.type,
      amount: finalAmount.value,
      description: form.description.trim(),
      date: transactionDate.value ? 
        new Date(transactionDate.value).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0],
      relatedSymbol: form.relatedSymbol?.trim() || undefined
    }

    emit('save', cashFlowData)
    resetForm()
  } catch (error) {
    console.error('Form submission error:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>