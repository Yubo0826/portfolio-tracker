<template>
  <!-- Trigger — mimics PrimeVue Select/MultiSelect appearance -->
  <div
    class="inline-flex items-center justify-between gap-2 px-3 cursor-pointer select-none
           rounded-[var(--p-select-border-radius,var(--p-border-radius-md))]
           border border-[var(--p-select-border-color)] bg-[var(--p-select-background)]
           text-[var(--p-select-color)] text-sm
           hover:border-[var(--p-select-hover-border-color)]
           transition-colors duration-200 w-30 h-[2.565rem]"
    :class="{ 'border-[var(--p-select-focus-border-color)]': hasValue }"
    @click="toggle"
  >
    <span :class="!hasValue ? 'text-[var(--p-select-placeholder-color)]' : ''">{{ buttonLabel }}</span>
    <i class="pi pi-chevron-down text-[var(--p-multiselect-dropdown-color)] text-xs" />
  </div>
  <Popover ref="popoverRef">
    <div class="flex">
      <!-- Preset list -->
      <div class="flex flex-col w-50">
        <div
          v-for="preset in presets"
          :key="preset.value"
          class="flex items-center justify-between px-3 py-2 rounded text-sm cursor-pointer select-none transition-colors"
          :class="
            pendingPreset === preset.value
              ? 'text-[var(--p-primary-color)] font-medium bg-[var(--p-primary-50)] dark:bg-[var(--p-primary-950)]'
              : 'text-[var(--p-text-color)] hover:bg-gray-100 dark:hover:bg-gray-800'
          "
          @click="selectPreset(preset.value)"
        >
          <span>{{ preset.label }}</span>
          <i v-if="preset.value === 'custom'" class="pi pi-angle-right text-xs opacity-60" />
        </div>
        <div class="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 flex items-center justify-between">
          <Button :label="$t('clearAll')" text size="small" @click="clearAll" />
          <div class="flex">
            <Button :label="$t('cancel')" text size="small" @click="cancel" />
            <Button :label="$t('apply')" size="small" @click="applyFilter" />
          </div>
        </div>
      </div>

      <!-- Custom date inputs (shown when custom preset is selected) -->
      <div
        v-if="pendingPreset === 'custom'"
        class="border-l border-gray-200 dark:border-gray-700 ml-3 pl-4 flex flex-col gap-4 w-52 py-1"
      >
        <div class="flex flex-col gap-1.5">
          <span class="text-xs text-[var(--p-text-muted-color)] font-medium">{{ $t('dateAfter') }}</span>
          <DatePicker v-model="pendingStart" showIcon fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <span class="text-xs text-[var(--p-text-muted-color)] font-medium">{{ $t('dateBefore') }}</span>
          <DatePicker v-model="pendingEnd" showIcon fluid />
        </div>
      </div>
    </div>
  </Popover>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Popover from 'primevue/popover';

const { t } = useI18n();

const props = defineProps({
  modelValue: { default: null },
});
const emit = defineEmits(['update:modelValue']);

const popoverRef = ref();
const pendingPreset = ref(null);
const pendingStart = ref(null);
const pendingEnd = ref(null);
const appliedLabel = ref(null);

const currentYear = new Date().getFullYear();

const presets = computed(() => [
  { label: t('today'), value: 'today' },
  { label: t('last7Days'), value: 'last7' },
  { label: t('last30Days'), value: 'last30' },
  { label: `${t('thisYear')} (${currentYear})`, value: 'thisYear' },
  { label: `${t('lastYear')} (${currentYear - 1})`, value: 'lastYear' },
  { label: t('customDateRange'), value: 'custom' },
]);

const hasValue = computed(() => !!props.modelValue);
const buttonLabel = computed(() => appliedLabel.value ?? t('date'));

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const computeRange = (preset) => {
  const now = new Date();
  const y = now.getFullYear();
  switch (preset) {
    case 'today':
      return [startOfDay(now), endOfDay(now)];
    case 'last7': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return [startOfDay(d), endOfDay(now)];
    }
    case 'last30': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return [startOfDay(d), endOfDay(now)];
    }
    case 'thisYear':
      return [new Date(y, 0, 1, 0, 0, 0, 0), new Date(y, 11, 31, 23, 59, 59, 999)];
    case 'lastYear':
      return [new Date(y - 1, 0, 1, 0, 0, 0, 0), new Date(y - 1, 11, 31, 23, 59, 59, 999)];
    default:
      return null;
  }
};

const toggle = (event) => {
  popoverRef.value.toggle(event);
};

const selectPreset = (value) => {
  pendingPreset.value = value;
  if (value !== 'custom') {
    pendingStart.value = null;
    pendingEnd.value = null;
  }
};

const applyFilter = () => {
  if (pendingPreset.value === 'custom') {
    if (pendingStart.value || pendingEnd.value) {
      const s = pendingStart.value ? startOfDay(pendingStart.value) : null;
      const e = pendingEnd.value ? endOfDay(pendingEnd.value) : null;
      emit('update:modelValue', [s, e]);
      const fmt = (d) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
      appliedLabel.value = `${s ? fmt(s) : '...'} – ${e ? fmt(e) : '...'}`;
    }
  } else if (pendingPreset.value) {
    emit('update:modelValue', computeRange(pendingPreset.value));
    appliedLabel.value = presets.value.find((p) => p.value === pendingPreset.value)?.label ?? null;
  }
  popoverRef.value.hide();
};

const clearAll = () => {
  pendingPreset.value = null;
  pendingStart.value = null;
  pendingEnd.value = null;
  appliedLabel.value = null;
  emit('update:modelValue', null);
  popoverRef.value.hide();
};

const cancel = () => {
  popoverRef.value.hide();
};

// Sync internal state when parent resets modelValue to null
watch(
  () => props.modelValue,
  (val) => {
    if (!val) {
      pendingPreset.value = null;
      pendingStart.value = null;
      pendingEnd.value = null;
      appliedLabel.value = null;
    }
  }
);
</script>
