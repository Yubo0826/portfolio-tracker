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
    <div class="w-72">
      <section v-for="g in groups" :key="g.key" class="px-3 py-3 border-b border-surface">
        <h3 class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-color">{{ g.label }}</h3>
        <!-- ponytail: 代號一多就靠 max-h 捲動，不做組內搜尋；真的太長再加 InputText 過濾 -->
        <div class="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
          <!-- 「全部」= 該組沒選任何值；其餘 chip 可複選 -->
          <button
            type="button"
            :class="chipClass(!model[g.key].length)"
            :aria-pressed="!model[g.key].length"
            @click="setGroup(g.key, [])"
          >
            {{ $t('all') }}
          </button>
          <button
            v-for="o in g.options"
            :key="o.value"
            type="button"
            :class="chipClass(model[g.key].includes(o.value))"
            :aria-pressed="model[g.key].includes(o.value)"
            @click="toggle(g.key, o.value)"
          >
            {{ o.label }}
          </button>
        </div>
      </section>
      <section v-if="dateRange !== undefined" class="px-3 py-3 border-b border-surface">
        <h3 class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-color">{{ $t('date') }}</h3>
        <!-- appendTo self：月曆掛在 Popover 內，點月曆才不會被當成點外面而關掉 -->
        <DateRangeFilter v-model="dateRange" appendTo="self" />
      </section>
      <button
        type="button"
        class="flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm hover:bg-emphasis disabled:opacity-50 disabled:cursor-default"
        :disabled="!activeCount"
        @click="clearAll"
      >
        <i class="pi pi-refresh text-xs" />{{ $t('clearFilters') }}
      </button>
    </div>
  </Popover>
</template>

<script setup>
import { computed, ref } from 'vue';
import Popover from 'primevue/popover';
import DateRangeFilter from '@/components/DateRangeFilter.vue';

// groups: [{ key, label, options: [{ label, value }] }]；v-model: { [key]: value[] }
defineProps({ groups: { type: Array, required: true } });
const model = defineModel({ type: Object, required: true });
// 選填：父層有傳 v-model:dateRange（初始 null）才顯示日期區塊；沒傳就是 undefined
const dateRange = defineModel('dateRange', { default: undefined });

const popover = ref();

// 選中：反白（文字色當底、卡片底色當字）；未選：淡灰底
const chipClass = (on) => [
  'px-2.5 py-1 rounded-md text-sm font-medium transition-colors',
  on ? 'bg-[var(--p-text-color)] text-[var(--p-content-background)]' : 'bg-emphasis text-muted-color hover:text-color',
];
const setGroup = (key, v) => (model.value = { ...model.value, [key]: v });
const toggle = (key, v) => {
  const cur = model.value[key];
  setGroup(key, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
};

const activeCount = computed(
  () => Object.values(model.value).reduce((n, arr) => n + arr.length, 0) + (dateRange.value ? 1 : 0)
);

const clearAll = () => {
  model.value = Object.fromEntries(Object.keys(model.value).map((k) => [k, []]));
  if (dateRange.value) dateRange.value = null;
};
</script>
