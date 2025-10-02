<template>
  <div class="flex gap-6">
    <!-- Draggable 1: Holdings -->
    <div class="w-1/3">
      <h3 class="font-bold mb-2 text-gray-700">{{ $t('holdings') }}</h3>
      <p class="text-sm mb-3 text-gray-500">可拖曳到右方快速新增</p>
      <draggable
        class="space-y-2"
        :list="list1"
        :group="{ name: 'assets', pull: 'clone', put: false }"
        :clone="cloneItem"
        :move="(evt) => !existsInAllocation(evt.draggedContext.element.symbol)"
        item-key="symbol"
      >
        <template #item="{ element }">
          <div
            class="flex justify-between items-center p-3 rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
            :class="{ 'opacity-50 bg-gray-50 cursor-not-allowed': existsInAllocation(element.symbol) }"
          >
          <div class="font-medium text-gray-800">
              <i class="fa-solid fa-grip-vertical mr-4"></i>
              {{ element.symbol }}
              <!-- <span class="ml-2 text-sm text-gray-500">{{ element.name }}</span> -->
              <span class="ml-2 text-xs text-gray-500">{{ element.actualRatio }}%</span>
            </div>
            <span
              v-if="existsInAllocation(element.symbol)"
              class="text-xs text-gray-400"
            >
              {{ $t('in_allocation') }}
            </span>
          </div>
        </template>
      </draggable>
    </div>

    <!-- Draggable 2: Allocation -->
    <div class="flex-1">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-bold mb-3 text-gray-700">{{ $t('allocation') }}</h3>

        <!-- Total target -->
        <div class="text-sm font-semibold text-gray-700">
          Total:
          <span :class="totalTarget === 100 ? 'text-green-600' : 'text-red-600'">
            {{ totalTarget }}%
          </span>
        </div>
      </div>
      <draggable
        class="space-y-3 p-2 rounded-xl border border-gray-200 bg-gray-50 min-h-[220px] flex align-center flex-col"
        :list="assets"
        group="assets"
        item-key="symbol"
        move="(evt) => false"
        @add="onDrop"
      >
        <!-- 當沒有項目時顯示提示 -->
        <template #header>
          <div v-if="assets.length === 0" class="text-center text-gray-400 text-sm p-4 m-auto">
            將左側的 <span class="font-medium text-gray-600">持有資產</span> 拖曳到此處<br />
            或手動新增以建立你的資產配置
          </div>
        </template>

        <template #item="{ element, index }">
          <div
            v-if="!element.editable"
            class="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition"
          >
            <div>
              <span class="font-bold text-gray-800 mr-2">{{ element.symbol }}</span>
              <!-- <span class="text-gray-500">{{ element.name }}</span> -->
            </div>
            <div class="flex items-center gap-2">
              <InputNumber
                v-model="element.target"
                suffix="%"
                :min="0"
                :max="100"
                size="small"
                input-class="text-right"
              />
              <Button
                icon="pi pi-times"
                text
                severity="danger"
                size="small"
                @click="removeAsset(index)"
              />
            </div>
          </div>

          <!-- 編輯模式 -->
           <div
              v-else
              class="flex justify-between items-center p-3 rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
            >
            <div class="font-medium text-gray-800">
              <SymbolAutoComplete 
                v-model="selectedSymbol"
                @update="updateElement(element, $event)"
              />
            </div>
            <div class="flex items-center gap-2">
              <InputNumber
                v-model="element.target"
                suffix="%"
                :min="0"
                :max="100"
                size="small"
                input-class="text-right"
              />
              <Button
                icon="pi pi-times"
                text
                severity="danger"
                size="small"
                @click="removeAsset(index)"
              />
            </div>
          </div>
        </template>

        <!-- 自行新增 -->
         <template #footer>
          <div class="text-center text-gray-400 text-sm p-4 m-auto">
            <Button @click="addAsset" icon="pi pi-plus" text label="Add Asset" />
          </div>
        </template>
      </draggable>

      

      <!-- Save button -->
      <div class="flex justify-end mt-4">
        <Button
          :label="$t('save')"
          icon="pi pi-check"
          size="small"
          :disabled="saveButtonDisabled"
          @click="saveAllocation"
        />
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, watch } from "vue";
import draggable from "vuedraggable";
import * as toast from '@/composables/toast';
import SymbolAutoComplete from '@/components/SymbolAutoComplete.vue';
import { useAuthStore } from "@/stores/auth";
import { usePortfolioStore } from "@/stores/portfolio";
import { useHoldingsStore } from "@/stores/holdings";
import api from "@/utils/api";

const auth = useAuthStore();
const portfolioStore = usePortfolioStore();
const holdingsStore = useHoldingsStore();

const list1 = ref(holdingsStore.list); // holdings
const assets = ref([]); // allocation
const oldAssets = ref([]);
const selectedSymbol = ref("");

watch(
  () => holdingsStore.list,
  (newVal) => {
    list1.value = newVal;
  }
);

const getAllocation = async () => {
  try {
    if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
    const data = await api.get(`http://localhost:3000/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`);
    console.log('Fetched allocation:', data);
    assets.value = data;
    oldAssets.value = JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error('Error fetching allocation:', error);
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

// clone item
const cloneItem = (item) => {
  return {
    symbol: item.symbol,
    name: item.name,
    assetType: item.assetType,
    target: 0
  };
};

// 檢查是否已存在 allocation
const existsInAllocation = (symbol) =>
  assets.value.some((a) => a.symbol === symbol);

// 移除資產
const removeAsset = (index) => {
  assets.value.splice(index, 1);
};

// 總和檢查
const totalTarget = computed(() =>
  assets.value.reduce((sum, a) => sum + (Number(a.target) || 0), 0)
);

const saveButtonDisabled = computed(
  () => JSON.stringify(assets.value) === JSON.stringify(oldAssets.value)
);

// 手動新增資產
const addAsset = () => {
  assets.value.push({
    symbol: "",
    name: "",
    assetType: "stock",
    target: 0,
    editable: true, // 標記為可編輯
  });
};

// 更新資產資料
const updateElement = (element, { symbol, name, assetType }) => {
  if (existsInAllocation(symbol)) {
    toast.error(`${symbol} 已在配置中`);
    return;
  }
  element.symbol = symbol;
  element.name = name;
  element.assetType = assetType;
  element.editable = false; // 完成後關閉編輯模式
};

// 儲存
const saveAllocation = async () => {
  if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
  // 檢查比例總和是否為 100%
  if (assets.value.length > 0 && totalTarget.value !== 100) {
    toast.error("Total target must equal 100%");
    return;
  }
  // 檢查是否有未完成編輯的項目
  const incompleteItem = assets.value.find(a => a.editable);
  if (incompleteItem) {
    toast.error("Please complete all editable items");
    return;
  }
  await api.post("http://localhost:3000/api/allocation/", {
    uid: auth.user.uid,
    portfolio_id: portfolioStore.currentPortfolio.id,
    assets: assets.value,
  });
  oldAssets.value = JSON.parse(JSON.stringify(assets.value));
  toast.success("Allocation saved");
};
</script>
