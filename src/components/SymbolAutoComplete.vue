<template>
    <div ref="root" class="relative w-full">
    <AutoComplete
        :modelValue="modelValue"
        @update:modelValue="(val) => emit('update:modelValue', val?.symbol ?? val)"
        optionLabel="symbol"
        :suggestions="filteredSymbols"
        @complete="debouncedSearch"
        :disabled="disabled"
        @item-select="onItemSelect"
        :placeholder="$t('inputSymbol')"
        class="w-full"
        :inputClass="clearable ? '!pr-9' : undefined"
        forceSelection
        >
        <template #option="slotProps">
            <div class="flex flex-col">
                <span class="text-base font-semibold">{{ slotProps.option.symbol }}</span>
                <span class="text-sm text-muted-color">
                {{ slotProps.option.name }}
                <template v-if="slotProps.option.assetType">
                    ({{ slotProps.option.assetType }})
                </template>
                </span>
            </div>
        </template>
    </AutoComplete>
    <button
        v-if="clearable && modelValue && !disabled"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full text-muted-color hover:text-color hover:bg-emphasis cursor-pointer"
        :aria-label="$t('clear')"
        v-tooltip.top="{ value: $t('clear'), showDelay: 500 }"
        @click="clear"
    >
        <i class="pi pi-times text-xs" />
    </button>
    </div>
</template>
<script setup>
import { ref } from 'vue';
import AutoComplete from 'primevue/autocomplete';
import debounce from 'lodash/debounce';
import api from '@/utils/api.js';

const props = defineProps({
    modelValue: String,
    disabled: {
        type: Boolean,
        default: false
    },
    // 在輸入框右側顯示清除按鈕
    clearable: {
        type: Boolean,
        default: false
    }
});
const emit = defineEmits(['update:modelValue', 'update']);

const filteredSymbols = ref([]);
const root = ref(null);

const search = async (event) => {
    if (!event.query.trim().length) return;
    try {
        const data = await api.get('/api/yahoo/symbol?query=' + event.query);
        console.log('Search results:', data);
        filteredSymbols.value = data.map(item => ({
            symbol: item.symbol,
            name: item.longname,
            assetType: item.typeDisp,
        }));
    } catch (e) {
        filteredSymbols.value = [];
    }
};

const debouncedSearch = debounce(search, 50);

// forceSelection 在 blur 時若文字剛好等於選項 label 會再觸發一次 item-select（modelValue 是字串、選項是物件，PrimeVue 判斷不出已選），這裡擋掉重複
// 重複那次 PrimeVue 會先送出整個選項物件給 update:modelValue，上方 template 已轉回 symbol 字串，否則 v-model 會變成物件
let lastSelected = null;
const onItemSelect = (event) => {
    if (event.value.symbol === lastSelected && props.modelValue === lastSelected) return;
    lastSelected = event.value.symbol;
    emit('update:modelValue', event.value.symbol);
    emit('update', {
        symbol: event.value.symbol,
        name: event.value.name,
        assetType: event.value.assetType
    });
};

// 清空後重設 lastSelected，否則重新選回同一檔時會被上方的防重複判斷擋掉、不會帶入報價
const clear = () => {
    lastSelected = null;
    filteredSymbols.value = [];
    emit('update:modelValue', null);
    root.value?.querySelector('input')?.focus();
};
</script>