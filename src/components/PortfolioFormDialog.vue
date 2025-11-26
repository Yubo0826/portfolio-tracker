<template>
  <Dialog
    :visible="props.visible"
    @update:visible="emit('update:visible', $event)"
    :header="dialogTitle"
    modal
    :style="{ width: '30rem' }"
  >
    <div class="mb-4">
      <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('name') }} <span class="text-red-500">*</span>
      </label>
      <InputText id="name" class="w-full" autocomplete="off" v-model="newPortfolio.name" />
    </div>

    <div class="mb-4">
      <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('description') }}
      </label>
      <Textarea
        id="description"
        class="w-full"
        v-model="newPortfolio.description"
        rows="5"
        cols="30"
        style="resize: none"
      />
    </div>

    <div class="mb-4">
      <label for="driftThreshold" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('driftThreshold') }}
        <i class="pi pi-info-circle ml-1 text-gray-400" v-tooltip.bottom="$t('emailAlertHint')" />
      </label>
      <InputNumber 
        id="driftThreshold" 
        class="w-full" 
        autocomplete="off" 
        :max="100" 
        :min="0" 
        suffix="%" 
        v-model="newPortfolio.drift_threshold" 
      />
    </div>

    <div class="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <label for="enableEmailAlert" class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ $t('emailAlert') }}
      </label>
      <ToggleSwitch id="enableEmailAlert" v-model="newPortfolio.enable_email_alert" />
    </div>

    <div class="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <label for="applyNewPortfolio" class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ $t('applyNewPortfolioImmediately') }}
      </label>
      <ToggleSwitch id="applyNewPortfolio" v-model="isApplyNewPortfolio" />
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
      <Button type="button" :label="$t('cancel')" severity="secondary" @click="emit('update:visible', false)" />
      <Button type="button" :label="$t('save')" @click="clickSave" :disabled="saveDisabled" />
    </div>
  </Dialog>
</template>
<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch';

import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import * as toast from '@/composables/toast'

const props = defineProps({
  visible: Boolean,
  action: String,
  editPortfolio: {
    type: Object,
    default: () => ({
      id: null,
      name: '',
      description: '',
      drift_threshold: 5,
      enable_email_alert: true,
    }),
  },
})

const initializePortfolio = () => {
  return {
    name: '',
    description: '',
    drift_threshold: 5,
    enable_email_alert: true,
  }
}

const newPortfolio = ref(initializePortfolio())

watch(
  () => props.editPortfolio,
  (val) => {
    newPortfolio.value = {
      name: val.name || '',
      description: val.description || '',
      drift_threshold: val.drift_threshold || 5,
      enable_email_alert: val.enable_email_alert || true,
    }
  },
  { immediate: true }
)

const emit = defineEmits(['update:loading', 'update:visible', 'clear:editPortfolio'])

const portfolioStore = usePortfolioStore()

const dialogTitle = computed(() =>
  props.editPortfolio.id ? t('updatePortfolio') : t('addPortfolio')
)

const clickSave = () => {
  if (props.editPortfolio.id) {
    updatePortfolio()
  } else {
    addPortfolio()
  }
}

// 新增新的portfolio後立即套用
const isApplyNewPortfolio = ref(true);

const addPortfolio = async () => {
  const { name, description, drift_threshold, enable_email_alert } = newPortfolio.value

  try {
    await portfolioStore.addPortfolio({ name, description, drift_threshold, enable_email_alert })
    newPortfolio.value = initializePortfolio()

    // 立即套用新建立的投資組合
    if (isApplyNewPortfolio.value) {
      const portfolios = portfolioStore.portfolios
      if (portfolios.length > 0) {
        const latestPortfolio = portfolios[portfolios.length - 1]
        emit('update:loading', true)
        portfolioStore.setCurrentPortfolio(latestPortfolio)
        toast.success(t('portfolioSwitched', { name: latestPortfolio.name }))
        return
      }
    }
    
    // 沒有立即套用新建立的投資組合 的訊息
    toast.success(t('portfolioAdded', { name }))
  } catch (error) {
    console.error('Error adding portfolio:', error)
    toast.error(t('errorOccurred'), error.message || '')
  } finally {
    emit('update:loading', false)
    emit('update:visible', false)
  }
}

const updatePortfolio = async () => {
  const { name, description, drift_threshold, enable_email_alert } = newPortfolio.value

  try {
    emit('update:loading', true)
    await portfolioStore.editPortfolio(props.editPortfolio.id, { name, description, drift_threshold, enable_email_alert })
    emit('clear:editPortfolio')
    newPortfolio.value = initializePortfolio()
    toast.success(`${t('portfolioModified')}「${name}」`, '')
  } catch (error) {
    console.error('Error updating portfolio:', error)
    toast.error(t('errorOccurred'), error.message || '')
  } finally {
    emit('update:loading', false)
    emit('update:visible', false)
  }
}

const saveDisabled = computed(() => {
  return !newPortfolio.value.name.trim()
})

</script>
