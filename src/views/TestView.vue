<script setup>
import { ref } from 'vue';
import AutoComplete from 'primevue/autocomplete';
import debounce from 'lodash/debounce';
import api from '@/api';

const props = defineProps({
  modelValue: String,
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'update']);

const filteredSymbols = ref([]);
const loading = ref(false);

const search = async (event) => {
  if (!event.query.trim().length) return;
  loading.value = true;
  try {
    const data = await api.get('http://localhost:3000/api/yahoo/symbol?query=' + event.query);
    filteredSymbols.value = data.map(item => ({
      symbol: item.symbol,
      name: item.longname,
      assetType: item.typeDisp,
    }));
  } catch (e) {
    filteredSymbols.value = [];
  } finally {
    loading.value = false;
  }
};

const debouncedSearch = debounce(search, 150);

const onItemSelect = (event) => {
  if (!event.value) return;
  emit('update:modelValue', event.value.symbol);
  emit('update', {
    symbol: event.value.symbol,
    name: event.value.name,
    assetType: event.value.assetType
  });
};
</script>

<template>
  <div class="w-full max-w-2xl mx-auto rounded-xl border border-gray-300 bg-white shadow-lg overflow-hidden">
    <!-- 搜尋輸入框 -->
    <div class="relative">
      <i class="pi pi-search absolute left-4 top-3 text-gray-400 text-xl" />
      <AutoComplete
        :modelValue="modelValue"
        @update:modelValue="val => emit('update:modelValue', val)"
        :suggestions="filteredSymbols"
        field="symbol"
        @complete="debouncedSearch"
        :disabled="disabled"
        @item-select="onItemSelect"
        placeholder="Search docs"
        class="w-full"
        inputClass="w-full py-3 pl-12 pr-4 text-lg placeholder-gray-400 focus:outline-none"
        panelClass="rounded-none border-t border-gray-200"
        :loading="loading"
      >
        <!-- 結果項目 -->
        <template #option="slotProps">
          <div class="flex flex-col px-4 py-2 hover:bg-gray-50">
            <span class="text-base font-semibold text-gray-900">{{ slotProps.option.symbol }}</span>
            <span class="text-sm text-gray-500">
              {{ slotProps.option.name }}
              <template v-if="slotProps.option.assetType">
                ({{ slotProps.option.assetType }})
              </template>
            </span>
          </div>
        </template>

        <!-- 無結果 -->
        <template #empty>
          <div class="px-4 py-6 text-center text-gray-500 text-sm">No recent searches</div>
        </template>

        <!-- 鍵盤操作提示 -->
        <template #footer>
          <div class="flex items-center justify-between border-t border-gray-200 text-sm text-gray-500 px-4 py-2">
            <div class="flex gap-4">
              <div><span class="inline-block bg-gray-100 rounded px-1 font-mono">↵</span> to select</div>
              <div><span class="inline-block bg-gray-100 rounded px-1 font-mono">↑↓</span> to navigate</div>
              <div><span class="inline-block bg-gray-100 rounded px-1 font-mono">esc</span> to close</div>
            </div>
            <div class="text-right text-xs">
              Search by <span class="font-bold">Yahoo Finance</span>
            </div>
          </div>
        </template>
      </AutoComplete>
    </div>
  </div>
</template>
