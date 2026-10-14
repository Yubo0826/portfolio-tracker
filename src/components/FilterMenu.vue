<template>
  <Button
    :label="$t('filter')"
    icon="pi pi-filter"
    :badge="activeCount ? String(activeCount) : undefined"
    severity="secondary"
    size="small"
    aria-haspopup="true"
    @click="popover.toggle($event)"
  />
  <Popover ref="popover" :pt="{ content: { class: '!p-0' } }">
    <div class="w-72 py-1">
      <button
        type="button"
        class="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-emphasis disabled:opacity-50 disabled:cursor-default"
        :disabled="!activeCount"
        @click="clearAll"
      >
        <i class="pi pi-filter-slash" />{{ $t('clearFilters') }}
      </button>
      <div v-for="g in groups" :key="g.key" class="border-t border-surface">
        <button
          type="button"
          class="flex items-center justify-between w-full px-3 py-2 bg-emphasis font-medium"
          :aria-expanded="!!open[g.key]"
          @click="open[g.key] = !open[g.key]"
        >
          {{ g.label }}
          <i :class="open[g.key] ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-sm" />
        </button>
        <!-- ponytail: 代號一多就靠 max-h 捲動，不做組內搜尋；真的太長再加 InputText 過濾 -->
        <div v-show="open[g.key]" class="max-h-60 overflow-y-auto py-1">
          <label
            v-for="o in g.options"
            :key="o.value"
            class="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-emphasis"
          >
            <Checkbox
              :modelValue="model[g.key]"
              :value="o.value"
              @update:modelValue="(v) => (model = { ...model, [g.key]: v })"
            />
            {{ o.label }}
          </label>
        </div>
      </div>
      <div v-if="dateRange !== undefined" class="border-t border-surface">
        <button
          type="button"
          class="flex items-center justify-between w-full px-3 py-2 bg-emphasis font-medium"
          :aria-expanded="!!open.date"
          @click="open.date = !open.date"
        >
          {{ $t('date') }}
          <i :class="open.date ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-sm" />
        </button>
        <!-- appendTo self：月曆掛在 Popover 內，點月曆才不會被當成點外面而關掉 -->
        <div v-show="open.date" class="px-3 py-2">
          <DateRangeFilter v-model="dateRange" appendTo="self" />
        </div>
      </div>
    </div>
  </Popover>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import Popover from 'primevue/popover';
import Checkbox from 'primevue/checkbox';
import DateRangeFilter from '@/components/DateRangeFilter.vue';

// groups: [{ key, label, options: [{ label, value }] }]；v-model: { [key]: value[] }
const props = defineProps({ groups: { type: Array, required: true } });
const model = defineModel({ type: Object, required: true });
// 選填：父層有傳 v-model:dateRange（初始 null）才顯示日期區塊；沒傳就是 undefined
const dateRange = defineModel('dateRange', { default: undefined });

const popover = ref();
const open = reactive({ [props.groups[0]?.key]: true });

const activeCount = computed(
  () => Object.values(model.value).reduce((n, arr) => n + arr.length, 0) + (dateRange.value ? 1 : 0)
);

const clearAll = () => {
  model.value = Object.fromEntries(Object.keys(model.value).map((k) => [k, []]));
  if (dateRange.value) dateRange.value = null;
};
</script>
