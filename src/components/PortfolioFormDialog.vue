<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import Textarea from 'primevue/textarea'
import FloatLabel from 'primevue/floatlabel'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast';
const toast = useToast();

const { t } = useI18n()

const props = defineProps({
  visible: Boolean,
  action: String,
  editPortfolio: {
    type: Object,
    default: () => ({
      id: null,
      name: '',
      description: '',
    }),
  },
})

const newPortfolio = ref({
  name: '',
  description: '',
})

watch(
  () => props.editPortfolio,
  (val) => {
    newPortfolio.value = {
      name: val.name || '',
      description: val.description || '',
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

const addPortfolio = async () => {
  const { name, description } = newPortfolio.value
  if (!name) {
    console.warn(t('nameRequired'))
    return
  }

  try {
    await portfolioStore.addPortfolio({ name, description })
    newPortfolio.value = { name: '', description: '' }
    toast.add({
      type: 'success',
      summary: 'Portfolio Added',
      detail: '',
      severity: 'custom',
      group: 'standard',
      life: 3000,
    })

  } catch (error) {
    console.error('Error adding portfolio:', error)
  } finally {
    emit('update:loading', false)
    emit('update:visible', false)
  }
}

const updatePortfolio = async () => {
  if (!props.editPortfolio.name) {
    console.warn(t('nameRequired'))
    return
  }

  const { name, description } = newPortfolio.value

  try {
    emit('update:loading', true)
    await portfolioStore.editPortfolio(props.editPortfolio.id, { name, description })
    emit('clear:editPortfolio')
    newPortfolio.value = { name: '', description: '' }
  } catch (error) {
    console.error('Error updating portfolio:', error)
  } finally {
    emit('update:loading', false)
    emit('update:visible', false)
  }
}
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="emit('update:visible', $event)"
    :header="dialogTitle"
    modal
    :style="{ width: '30rem' }"
  >
    <span class="text-surface-500 dark:text-surface-400 block mb-8">
      {{ $t('updateYourInfo') }}
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

    <div class="flex justify-end gap-2">
      <Button type="button" :label="$t('cancel')" severity="secondary" @click="emit('update:visible', false)" />
      <Button type="button" :label="$t('save')" @click="clickSave" />
    </div>
  </Dialog>
</template>
