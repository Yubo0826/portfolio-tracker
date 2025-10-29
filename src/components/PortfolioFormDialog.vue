<template>
  <Dialog
    :visible="props.visible"
    @update:visible="emit('update:visible', $event)"
    :header="dialogTitle"
    modal
    :style="{ width: '30rem' }"
  >
    <span class="text-surface-500 dark:text-surface-400 block mb-8">
      <!-- {{ $t('updateYourInfo') }} -->
    </span>

    <div class="flex items-center gap-4 mb-4">
      <label for="name" class="font-semibold w-24">{{ $t('name') }}</label>
      <InputText id="name" class="flex-auto" autocomplete="off" v-model="newPortfolio.name" />
    </div>

    <div class="flex items-center gap-4 mb-8">
      <label for="description" class="font-semibold w-24">{{ $t('description') }}</label>
      <FloatLabel variant="on">
        <Textarea
          id="over_label"
          class="flex-auto"
          v-model="newPortfolio.description"
          rows="5"
          cols="30"
          style="resize: none"
        />
      </FloatLabel>
    </div>

    <div class="flex items-center gap-4 mb-8">
      <label for="driftThreshold" class="font-semibold w-24">{{ $t('driftThreshold') }}</label>
      <InputNumber id="driftThreshold" class="flex-auto" autocomplete="off" max="100" min="0" v-model="newPortfolio.drift_threshold" />
    </div>

    <div class="flex items-center gap-4 mb-8">
      <label for="enableEmailAlert">Email通知</label>
      <ToggleSwitch id="enableEmailAlert" v-model="newPortfolio.enable_email_alert" />
    </div>

    <div class="flex items-center gap-4 mb-8">
      <label for="applyNewPortfolio">{{ $t('applyNewPortfolioImmediately') }}</label>
      <ToggleSwitch id="applyNewPortfolio" v-model="isApplyNewPortfolio" />
    </div>

    <div class="flex justify-end gap-2">
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
import FloatLabel from 'primevue/floatlabel';

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
