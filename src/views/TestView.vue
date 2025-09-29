<template>
  <div class="flex gap-6">
    <!-- Draggable 1: Holdings -->
    <div class="w-1/3">
      <h3 class="font-bold mb-3 text-gray-700">{{ $t('holdings') }}</h3>
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
              {{ element.symbol }}
              <span class="ml-2 text-sm text-gray-500">{{ element.name }}</span>
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
      <h3 class="font-bold mb-3 text-gray-700">{{ $t('allocation') }}</h3>
      <draggable
        class="space-y-3 p-2 rounded-xl border border-gray-200 bg-gray-50 min-h-[220px] flex align-center flex-col"
        :class="{ 'bg-green-50 border-green-300 border-2': isOver }"
        :list="assets"
        group="assets"
        item-key="symbol"
        @add="onDrop"
        @start="isOver = true"
        @end="isOver = false"
      >
        <!-- 當沒有項目時顯示提示 -->
        <template #footer>
          <div v-if="assets.length === 0" class="text-center text-gray-400 text-sm p-4 m-auto">
            將左側的 <span class="font-medium text-gray-600">持有資產</span> 拖曳到此處<br />
            以建立你的資產配置
          </div>
        </template>

        <template #item="{ element, index }">
          <div
            class="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition"
          >
            <div>
              <span class="font-bold text-gray-800 mr-2">{{ element.symbol }}</span>
              <span class="text-gray-500">{{ element.name }}</span>
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
      </draggable>

      <!-- Total target -->
      <div class="mt-4 text-sm font-semibold text-gray-700">
        Total:
        <span :class="totalTarget === 100 ? 'text-green-600' : 'text-red-600'">
          {{ totalTarget }}%
        </span>
      </div>

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
import { useToast } from "primevue/usetoast";
import { useAuthStore } from "@/stores/auth";
import { usePortfolioStore } from "@/stores/portfolio";
import { useHoldingsStore } from "@/stores/holdings";
import api from "@/utils/api";

const toast = useToast();
const auth = useAuthStore();
const portfolioStore = usePortfolioStore();
const holdingsStore = useHoldingsStore();

const list1 = ref(holdingsStore.list); // holdings
const assets = ref([]); // allocation
const oldAssets = ref([]);
const isOver = ref(false); // highlight 狀態

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
const cloneItem = (item) => ({ ...item });

// 檢查是否已存在 allocation
const existsInAllocation = (symbol) =>
  assets.value.some((a) => a.symbol === symbol);

// 當 item 被拖到 allocation
const onDrop = (evt) => {
  const item = evt.item._underlying_vm_;
  if (!item) return;

  if (existsInAllocation(item.symbol)) {
    toast.add({
      severity: "warn",
      summary: "Already exists",
      detail: `${item.symbol} 已在配置中`,
      life: 2000,
    });
    return;
  }

  assets.value.push({
    symbol: item.symbol,
    name: item.name,
    assetType: item.assetType,
    target: 0,
  });
};

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

// 儲存
const saveAllocation = async () => {
  if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
  if (assets.value.length > 0 && totalTarget.value !== 100) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Total target must equal 100%",
      life: 3000,
    });
    return;
  }
  await api.post("http://localhost:3000/api/allocation/", {
    uid: auth.user.uid,
    portfolio_id: portfolioStore.currentPortfolio.id,
    assets: assets.value,
  });
  oldAssets.value = JSON.parse(JSON.stringify(assets.value));
  toast.add({
    severity: "success",
    summary: "Success",
    detail: "Allocation saved",
    life: 2000,
  });
};
</script>
