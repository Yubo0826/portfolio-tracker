<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- 帳戶名稱 -->
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('cashFlow.accountName') }} *
      </label>
      <InputText
        id="name"
        v-model="form.name"
        :placeholder="$t('cashFlow.accountNamePlaceholder')"
        class="w-full"
        :class="errors.name ? 'p-invalid' : ''"
        required
      />
      <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
    </div>

    <!-- 貨幣類型 (固定為 USD) -->
    <div>
      <label for="currency" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('cashFlow.currency') }}
      </label>
      <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
        <i class="pi pi-lock text-gray-400"></i>
        <span class="font-medium text-gray-700 dark:text-gray-200">USD (美元)</span>
        <Tag value="Fixed" severity="info" class="text-xs" />
      </div>
      <small class="text-gray-500 dark:text-gray-400">{{ $t('cashFlow.currencyFixedHint') }}</small>
    </div>

    <!-- 初始餘額 -->
    <div>
      <label for="balance" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('cashFlow.initialBalance') }}
      </label>
      <InputNumber
        id="balance"
        v-model="form.balance"
        :placeholder="$t('cashFlow.initialBalancePlaceholder')"
        class="w-full"
        :class="errors.balance ? 'p-invalid' : ''"
        :minFractionDigits="2"
        :maxFractionDigits="2"
        :min="0"
      />
      <small v-if="errors.balance" class="p-error">{{ errors.balance }}</small>
      <small class="text-gray-500 dark:text-gray-400">{{ $t('cashFlow.initialBalanceHint') }}</small>
    </div>

    <!-- 帳戶描述 -->
    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('cashFlow.accountDescription') }}
      </label>
      <!-- :placeholder="$t('cashFlow.accountDescriptionPlaceholder')" -->
      <Textarea
        id="description"
        v-model="form.description"
        class="w-full"
        rows="3"
        :maxlength="200"
      />
      <small class="text-gray-500 dark:text-gray-400">
        {{ form.description?.length || 0 }}/200
      </small>
    </div>

    <!-- 啟用狀態 -->
    <!-- <div class="flex items-center">
      <Checkbox
        id="isActive"
        v-model="form.isActive"
        :binary="true"
      />
      <label for="isActive" class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ $t('cashFlow.activeAccount') }}
      </label>
    </div>
    <small class="text-gray-500 dark:text-gray-400 block">{{ $t('cashFlow.activeAccountHint') }}</small> -->

    <!-- 按鈕 -->
    <div class="flex justify-end gap-3 pt-4 border-t">
      <Button
        type="button"
        :label="$t('common.cancel')"
        severity="secondary"
        @click="$emit('cancel')"
      />
      <Button
        type="submit"
        :label="account ? $t('common.update') : $t('common.create')"
        :loading="isSubmitting"
      />
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'

// Props & Emits
const props = defineProps({
  account: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['save', 'cancel'])

// Composables
const { t } = useI18n()

// 表單數據
const form = reactive({
  name: '',
  currency: 'USD',  // 固定為 USD
  balance: 0,
  description: '',
  isActive: true
})

// 表單錯誤
const errors = reactive({
  name: '',
  currency: '',
  balance: ''
})

// 狀態
const isSubmitting = ref(false)

// 重置表單
const resetForm = () => {
  form.name = ''
  form.currency = 'USD'  // 固定為 USD
  form.balance = 0
  form.description = ''
  form.isActive = true
  
  // 清空錯誤
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

// 監聽 props 變化，填充表單
watch(
  () => props.account,
  (account) => {
    if (account) {
      form.name = account.name
      form.currency = account.currency
      form.balance = account.balance
      form.description = account.description || ''
      form.isActive = account.isActive
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// 表單驗證
const validateForm = () => {
  let isValid = true
  
  // 重置錯誤
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })

  // 驗證帳戶名稱
  if (!form.name.trim()) {
    errors.name = t('validation.required')
    isValid = false
  } else if (form.name.trim().length < 2) {
    errors.name = t('validation.minLength', { min: 2 })
    isValid = false
  } else if (form.name.trim().length > 50) {
    errors.name = t('validation.maxLength', { max: 50 })
    isValid = false
  }

  // 驗證餘額
  if (form.balance < 0) {
    errors.balance = t('validation.minValue', { min: 0 })
    isValid = false
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
    
    const accountData = {
      name: form.name.trim(),
      currency: form.currency,
      balance: form.balance || 0,
      description: form.description?.trim() || undefined,
      isActive: form.isActive
    }

    emit('save', accountData)
  } catch (error) {
    console.error('Form submission error:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>