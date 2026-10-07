<template>
  <DatePicker
    v-model="model"
    selectionMode="range"
    :manualInput="false"
    :placeholder="$t('date')"
    dateFormat="yy/m/d"
    showIcon
    iconDisplay="input"
    showButtonBar
    size="small"
    class="w-60"
  >
    <template #footer>
      <div class="flex flex-wrap gap-1 pt-2 border-t border-surface">
        <Button
          v-for="preset in presets"
          :key="preset.value"
          :label="preset.label"
          size="small"
          text
          @click="model = computeRange(preset.value)"
        />
      </div>
    </template>
  </DatePicker>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// [start, end] at local midnight; callers compare against `${date}T00:00:00`, so end is inclusive.
const model = defineModel({ default: null });

const currentYear = new Date().getFullYear();

const presets = computed(() => [
  { label: t('today'), value: 'today' },
  { label: t('last7Days'), value: 'last7' },
  { label: t('last30Days'), value: 'last30' },
  { label: `${t('thisYear')} (${currentYear})`, value: 'thisYear' },
  { label: `${t('lastYear')} (${currentYear - 1})`, value: 'lastYear' },
]);

const computeRange = (preset) => {
  const now = new Date();
  const y = now.getFullYear();
  const today = new Date(y, now.getMonth(), now.getDate());
  const daysAgo = (n) => new Date(y, now.getMonth(), now.getDate() - n);
  switch (preset) {
    case 'today':
      return [today, today];
    case 'last7':
      return [daysAgo(7), today];
    case 'last30':
      return [daysAgo(30), today];
    case 'thisYear':
      return [new Date(y, 0, 1), new Date(y, 11, 31)];
    case 'lastYear':
      return [new Date(y - 1, 0, 1), new Date(y - 1, 11, 31)];
  }
};
</script>
