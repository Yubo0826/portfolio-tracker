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
        >
        <!-- forceSelection -->
        <template #option="slotProps">
            <div class="flex flex-col">
                <span class="text-base font-semibold">{{ slotProps.option.symbol }}</span>
                <span class="text-sm text-gray-500">
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

const onItemSelect = (event) => {
    emit('update:modelValue', event.value.symbol);
    emit('update', {
        symbol: event.value.symbol,
        name: event.value.name,
        assetType: event.value.assetType
    });
};
</script>