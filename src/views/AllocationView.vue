<script setup>
import { computed, ref, watch } from 'vue';
import api from '@/api';
import SymbolAutoComplete from '@/components/SymbolAutoComplete.vue';
import { useToast } from "primevue/usetoast";
const toast = useToast();

import { useAuthStore } from '@/stores/auth';
import { usePortfolioStore } from '@/stores/portfolio';

const auth = useAuthStore();
const portfolioStore = usePortfolioStore();

const isLoading = ref(true);
const assets = ref([]);
const oldAssets = ref([]);
const selectedSymbol = ref(null);
const inputVisible = ref(false);
const newTarget = ref(0);
const newAssetRow = ref(null);

const getAllocation = async () => {
  try {
    isLoading.value = true;
    if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
    const data = await api.get(`http://localhost:3000/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`);
    console.log('Fetched allocation:', data);
    assets.value = data;
    oldAssets.value = JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error('Error fetching allocation:', error);
  } finally {
    isLoading.value = false;
  }
};

// 如果有用戶登入，則設定 uid
if (auth.user) {
    getAllocation(); // 取得交易資料
} else {
    console.log('No user is logged in');
}

// 監聽 auth.user 的變化，如果有用戶變化則取得交易資料
watch(() => auth.user, (newUser) => {
    if (newUser) {
        getAllocation();
    }
})

watch(() => portfolioStore.currentPortfolio, (newVal) => {
  if (newVal?.id) {
    getAllocation();
  }
});

const confirmAddAsset = async () => {
    if (!newAssetRow.value?.symbol || !newAssetRow.value?.name) {
        toast.add({
            severity: 'error',
            summary: 'Error Message',
            detail: '請重新輸入後選擇下拉選單中的資產',
            life: 3000
        });
        return;
    }

    // 檢查是否已存在相同的資產
    const existingAsset = assets.value.find(asset => asset.symbol === newAssetRow.value.symbol);
    if (existingAsset) {
        toast.add({
            severity: 'error',
            summary: 'Error Message',
            detail: '此資產已存在，請勿重複添加',
            life: 3000
        });
        return;
    }

    assets.value.push(
        {
            ...newAssetRow.value,
            target: newTarget.value
        }
    );
    newAssetRow.value = null;
    selectedSymbol.value = null;
    newTarget.value = 0;
    inputVisible.value = false;
};

const removeAsset = (data) => {
  assets.value = assets.value.filter(a => a.symbol !== data.symbol);
};

const saveButtonDisabled = computed(() => {
  return JSON.stringify(assets.value) === JSON.stringify(oldAssets.value);
});

const saveAllocation = async () => {
  if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
  if (assets.value.length > 0 && totalTarget.value !== 100) {
    toast.add({
        severity: 'error',
        summary: 'Error Message',
        detail: 'Total target must equal 100%',
        life: 3000
    });
    return;
  }
  try {
    const data = await api.post('http://localhost:3000/api/allocation/', {
      uid: auth.user.uid,
      portfolio_id: portfolioStore.currentPortfolio.id,
      assets: assets.value
    });
    console.log('Allocation saved successfully', data);
    oldAssets.value = JSON.parse(JSON.stringify(assets.value)); // 更新舊的資產數據
    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Allocation saved successfully',
        life: 3000
    });
  } catch (error) {
    console.error('Error saving allocation:', error);
  }
};

const totalTarget = computed(() => {
  return assets.value.reduce((sum, asset) => sum + (Number(asset.target) || 0), 0);
});

const close = () => {
  inputVisible.value = false;
  selectedSymbol.value = null;
  newTarget.value = 0;
  newAssetRow.value = null;
};

</script>

<template>
  <div>
    <Toast position="top-center" />
    <div class="flex justify-end mb-4">
        <Button label="Save" @click="saveAllocation" :disabled="saveButtonDisabled" />
    </div>
    <DataTable :value="assets" editMode="row" dataKey="symbol">
        <!-- Name -->
        <Column field="name" header="Asset" style="width: 40%">
            <template #body="{ data }">
                <div>
                    <!-- <img :src="data.icon" class="w-5 h-5 mr-2" /> -->
                    <span class="font-bold mr-4">{{ data.symbol }}</span>
                    <div class="">{{ data.name }}</div>
                </div>
            </template>

            <template #footer>
                <div v-if="!inputVisible">
                    <Button icon="pi pi-plus" text label="Add Asset" @click="inputVisible = true" />
                </div>
                <div v-else class="flex flex-col gap-2">
                    <SymbolAutoComplete 
                      v-model="selectedSymbol"
                      @update="({ symbol, name, assetType }) => {
                          newAssetRow = {
                              symbol,
                              name,
                              assetType
                          };
                      }"
                    />
                </div>
            </template>
        </Column>

        <!-- Target -->
        <Column field="target" header="" style="width: 20%">
            <template #body="{ data }">
                <InputNumber v-model="data.target" suffix="%" showButtons :min="0" :max="100" />
            </template>

            <template #header>
                <span v-if="totalTarget === 100" class="font-semibold  p-1">Target: 100%</span>
                <span v-else class="text-gray-500 bg-orange-300 rounded-md p-1 font-semibold">Total: {{ totalTarget }}%</span>
            </template>

            <template #footer v-if="inputVisible && newAssetRow">
                <InputNumber v-model="newTarget" suffix="%" showButtons :min="0" :max="100" />
            </template>
        </Column>

        <!-- Action -->
        <Column style="width: 20%">
            <template #body="{ data }">
                <div class="flex justify-end">
                    <Button icon="pi pi-times" text severity="danger" @click="removeAsset(data)" />
                </div>
            </template>

            <template #footer v-if="inputVisible">
                <div class="flex justify-end items-center">
                    <Button v-if="newAssetRow && newTarget" icon="pi pi-check" variant="text" rounded aria-label="Filter" @click="confirmAddAsset" />
                    <Button icon="pi pi-times" text severity="danger" @click="close" />
                </div>
            </template>
        </Column>
    </DataTable>
  </div>
</template>
