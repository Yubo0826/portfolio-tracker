<template>
    <Dialog v-model:visible="visible" @hide="onHide" modal :style="{ width: '30rem' }">
        <template #header>
            <div class="inline-flex items-center justify-center gap-2">
                <span class="font-bold whitespace-nowrap">{{ dialogHeader }}</span>
            </div>
        </template>

        <span class="text-surface-500 dark:text-surface-400 block mb-8" v-if="!editingId">
            先選擇日期，然後填入股票代碼，系統會自動查詢當天的價格。<br />
        </span>

        <div class="flex items-center gap-4 mb-4">
            <label class="font-semibold w-24">Date<span class="text-red-500">*</span></label>
            <DatePicker v-model="form.date" @date-select="onDateSelect" :maxDate="new Date()" showIcon fluid iconDisplay="input" class="flex-auto" placeholder="交易的日期" />
        </div>

        <div class="flex items-center gap-4 mb-4">
            <label class="font-semibold w-24">Symbol<span class="text-red-500">*</span></label>
            <SymbolAutoComplete
                v-model="form.symbol"
                @update="onSymbolUpdate"
                :disabled="editingId ? true : false"
            />
        </div>

        <div class="flex items-center gap-4 mb-4">
            <label class="font-semibold w-24">Shares<span class="text-red-500">*</span></label>
            <InputNumber v-model="form.shares" class="flex-auto" autocomplete="off" />
        </div>

        <div class="flex items-center gap-2 mb-4 p-2 text-xs">
            <label class="font-semibold w-24"></label>
            <Button @click="addShare(100)" label="+100" severity="secondary" rounded />
            <Button @click="addShare(500)" label="+500" severity="secondary" rounded />
            <Button @click="addShare(1000)" label="+1000" severity="secondary" rounded />
        </div>

        <div class="flex items-center gap-4 mb-4">
            <label class="font-semibold w-24">Price<span class="text-red-500">*</span></label>
            <InputText v-model="form.price" class="flex-auto" autocomplete="off" placeholder="請輸入交易當時的價格" />
        </div>

        <div class="flex items-center gap-4 mb-8">
            <label class="font-semibold w-24">Operation</label>
            <SelectButton v-model="form.operation" :options="transactionType" optionLabel="name" optionValue="code" />
        </div>

        <div class="flex items-center gap-4 mb-8">
            <label class="font-semibold w-24">Fee</label>
            <InputNumber v-model="form.fee" class="flex-auto" showButtons autocomplete="off" />
        </div>

        <div class="flex items-center gap-4 mb-8">
            <label class="font-semibold w-24">Total</label>
            ${{ totalPrice }} USD
        </div>

        <div class="flex justify-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="onCancel"></Button>
            <Button v-if="hasError" type="button" label="Save" v-tooltip.bottom="'請填入完整信息'" disabled />
            <Button v-else type="button" label="Save" @click="onSave" />
        </div>
    </Dialog>
</template>

<script setup>
import { computed, watch, ref } from 'vue';
import SymbolAutoComplete from '@/components/SymbolAutoComplete.vue';
import api from '@/api.js';

const props = defineProps({
    visible: Boolean,
    modelValue: Object,
    editingId: Number,
    holdings: Array,
});

const emit = defineEmits(['update:visible', 'save', 'cancel']);

const transactionType = ref([
    { name: 'Buy', code: 'buy' },
    { name: 'Sell', code: 'sell' }
]);

const form = ref({ ...props.modelValue });

watch(() => props.modelValue, (newVal) => {
    form.value = { ...newVal };
});

const totalPrice = computed(() => {
    return Number((form.value.shares * form.value.price).toFixed(2)) || 0;
});

const hasError = computed(() => {
    return !form.value.date || !form.value.symbol || !form.value.shares || !form.value.price;
});

const dialogHeader = computed(() => props.editingId !== null ? 'Update Transaction' : 'New Transaction');

const onSymbolUpdate = ({ symbol, name, assetType }) => {
    form.value.name = name;
    form.value.assetType = assetType;
    const date = form.value.date?.toISOString().split('T')[0];
    if (symbol && date) {
        searchPrice(symbol, date);
    }
};

const onDateSelect = (event) => {
    form.value.date = event;
    if (form.value.symbol) {
        const date = event.toISOString().split('T')[0];
        searchPrice(form.value.symbol, date);
    }
};

const searchPrice = async (symbol, date) => {
    const nextDay = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    try {
        const data = await api.get(`http://localhost:3000/api/yahoo/chart/?symbol=${symbol}&period1=${date}&period2=${nextDay}`);
        if (data.quotes?.length) {
            form.value.price = data.quotes[0].close.toFixed(2);
        } else {
            form.value.price = null;
        }
    } catch {
        form.value.price = null;
    }
};

const addShare = (amount) => {
    if (!form.value.shares) form.value.shares = 0;
    form.value.shares += amount;
};

const onSave = () => {
    emit('save', { ...form.value });
};

const onCancel = () => {
    emit('cancel');
    emit('update:visible', false);
};

const onHide = () => {
    emit('cancel');
};
</script>

<style scoped>
:deep(.p-autocomplete) {
    flex: 1 1 auto;
}
:deep(.p-autocomplete-input) {
    flex: 1 1 auto;
}
</style>
