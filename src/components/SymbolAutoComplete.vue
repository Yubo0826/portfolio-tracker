<template>
    <AutoComplete
        :modelValue="modelValue"
        @update:modelValue="(val) => emit('update:modelValue', val)"
        optionLabel="symbol"
        :suggestions="filteredSymbols"
        @complete="debouncedSearch"
        :disabled="disabled"
        @item-select="onItemSelect"
        :placeholder="$t('inputSymbol')"
        class="w-full"
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
    }
});
const emit = defineEmits(['update:modelValue', 'update']);

const filteredSymbols = ref([]);

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
</script>