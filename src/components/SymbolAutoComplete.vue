<template>
    <AutoComplete
        :modelValue="modelValue"
        @update:modelValue="(val: any) => emit('update:modelValue', val)"
        optionLabel="symbol"
        :suggestions="filteredSymbols"
        @complete="debouncedSearch"
        :disabled="disabled"
        @item-select="onItemSelect"
        :placeholder="$t('inputSymbol')"
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
<script setup lang="ts">
import { ref } from 'vue';
import AutoComplete from 'primevue/autocomplete';
import debounce from 'lodash/debounce';
import api from '@/utils/api';

const props = withDefaults(defineProps<{
    modelValue?: string,
    disabled?: boolean
}>(), {
    disabled: false
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'update', value: any): void;
}>();

interface SymbolData {
    symbol: string;
    name: string;
    assetType: string;
}

const filteredSymbols = ref<SymbolData[]>([]);

const search = async (event: any) => {
    if (!event.query.trim().length) return;
    try {
        const data: any = await api.get('/api/yahoo/symbol?query=' + event.query);
        console.log('Search results:', data);
        filteredSymbols.value = data.map((item: any) => ({
            symbol: item.symbol,
            name: item.longname,
            assetType: item.typeDisp,
        }));
    } catch (e) {
        filteredSymbols.value = [];
    }
};

const debouncedSearch = debounce(search, 50);

const onItemSelect = (event: any) => {
    emit('update:modelValue', event.value.symbol);
    emit('update', {
        symbol: event.value.symbol,
        name: event.value.name,
        assetType: event.value.assetType
    });
};
</script>