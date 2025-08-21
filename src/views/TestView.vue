<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router'
import AutoComplete from 'primevue/autocomplete';
import debounce from 'lodash/debounce';
import api from '@/api';

const router = useRouter()

const props = defineProps({
  modelValue: String,
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const filteredSymbols = ref([]);
const loading = ref(false);

const search = async (event) => {
  if (!event.query.trim().length) return;
  loading.value = true;
  try {
    const data = await api.get('http://localhost:3000/api/yahoo/symbol?query=' + event.query);
    filteredSymbols.value = data
      .filter(item => ['EQUITY', 'ETF'].includes(item.quoteType))
      .map(item => ({
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
  emit('close');
  router.push({ name: 'asset', params: { symbol: event.value.symbol } });
};

const acRef = ref(null)

onMounted(async () => {
  await nextTick()
  console.log(acRef.value)
  // 方式 A：透過 DOM 找到內部 input
  // acRef.value?.$el?.querySelector('input')?.focus()
  // 方式 B：若版本支援，也可試試組件方法
})

</script>

<template>
  <div class="relative max-w-xl w-full mx-auto">
    <AutoComplete
      :modelValue="modelValue"
      :suggestions="filteredSymbols"
      field="symbol"
      @complete="debouncedSearch"
      :disabled="disabled"
      @item-select="onItemSelect"
      placeholder="Enter symbol or name of asset"
      class="w-full rounded-xl shadow-md border border-gray-300"
      inputClass="w-full pl-10 pr-16 py-2 outline-none text-gray-800"
      :loading="loading"
      ref="acRef"
    >

      <!-- 🔽 搜尋結果 -->
      <template #option="slotProps">
        <div @click="onItemSelect(slotProps.option)" class="flex items-center space-x-2">
          <i class="pi pi-search" />
          <div class="flex flex-col py-2 px-4">
            <span class="text-base font-semibold text-black">{{ slotProps.option.symbol }}</span>
            <span class="text-sm text-gray-500">
              {{ slotProps.option.name }}
              <template v-if="slotProps.option.assetType">
                ({{ slotProps.option.assetType }})
              </template>
            </span>
          </div>
        </div>
      </template>

      <!-- ❌ 無結果時 -->
      <template #empty>
        <div class="py-4 px-4 text-center text-gray-400">No matching symbols</div>
      </template>

      <!-- 📌 Footer -->
      <!-- <template #footer>
        <div class="py-2 px-4 text-right text-xs text-gray-400 border-t border-gray-100">
          Data from Yahoo Finance
        </div>
      </template> -->
    </AutoComplete>
  </div>
</template>
