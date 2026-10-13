<template>
  <div class="set-page">
    <!-- 頁面標題由 App.vue 統一渲染，這裡只放說明與總和 -->
    <p class="set-intro">{{ $t('setTargetsSubtitle') }}</p>

    <!-- ============ Target weights ============ -->
    <section class="set-group">
      <div class="set-group__head">
        <span>{{ $t('allocTargetsGroup') }}</span>
        <span class="alloc-badge" :class="isTotalOk ? 'alloc-badge--ok' : 'alloc-badge--err'">{{ totalTarget }}%</span>
      </div>
      <div class="set-group__body">
        <div
          v-for="(asset, index) in assets"
          :key="asset.symbol || index"
          class="set-row alloc-row"
        >
          <span class="alloc-bar" :style="{ background: colorFor(index) }" />

          <span class="flex flex-col gap-0.5 min-w-0">
            <span class="alloc-symbol">{{ asset.symbol || '—' }}</span>
            <span v-if="isCustom(asset.symbol)" class="alloc-custom-tag">{{ $t('customAssetTag') }}</span>
          </span>

          <span class="alloc-name">{{ asset.name }}</span>

          <div class="alloc-controls">
            <InputNumber
              v-model="asset.target"
              class="alloc-num"
              suffix="%"
              :min="0"
              :max="100"
              :maxFractionDigits="1"
              size="small"
              input-class="alloc-input"
            />

            <Button
              v-tooltip.top="{ value: $t('delete'), showDelay: 500 }"
              icon="pi pi-trash"
              :aria-label="$t('delete')"
              text
              severity="danger"
              size="small"
              rounded
              @click="removeAsset(index)"
            />
          </div>
        </div>

        <div v-if="assets.length === 0" class="set-row alloc-empty">
          {{ $t('allocEmpty') }}
        </div>
      </div>
    </section>

    <!-- ============ Add tracked asset ============ -->
    <section class="set-group">
      <div class="set-group__head">{{ $t('addTrackedAsset') }}</div>
      <div class="set-group__body">
        <div class="set-row">
          <label class="set-label">{{ $t('allocSearchLabel') }}</label>
          <div class="alloc-search">
            <SymbolAutoComplete
              v-model="selectedSymbol"
              @update="addFromSearch"
            />
          </div>
          <p class="set-help">{{ $t('allocSearchHint') }}</p>
        </div>

        <div class="set-row">
          <div class="set-label">{{ $t('quickPick') }}</div>
          <div v-if="candidates.length" class="flex flex-wrap gap-2">
            <button
              v-for="c in candidates"
              :key="c.symbol"
              type="button"
              class="alloc-chip"
              @click="addFromHolding(c)"
            >
              <span class="alloc-chip-mono" :style="monoColors(c.symbol)">{{ c.symbol.slice(0, 2) }}</span>
              <span class="alloc-chip-symbol">{{ c.symbol }}</span>
              <i class="pi pi-plus" style="font-size: 0.62rem; color: var(--p-text-muted-color)" />
            </button>
          </div>
          <p v-else class="set-help">{{ $t('allNamedInAllocation') }}</p>
        </div>
      </div>
    </section>

    <!-- ============ Target preview ============ -->
    <section class="set-group">
      <div class="set-group__head">{{ $t('targetPreview') }}</div>
      <div class="set-group__body">
        <div class="set-row flex items-center gap-5 flex-wrap">
          <div class="alloc-donut">
            <svg viewBox="0 0 180 180" width="170" height="170" style="transform: rotate(-90deg)">
              <circle
                cx="90" cy="90" :r="donutRadius"
                fill="none" :stroke="donutTrackColor" :stroke-width="26"
              />
              <circle
                v-for="(seg, i) in donutSegments"
                :key="i"
                cx="90" cy="90" :r="donutRadius"
                fill="none"
                :stroke="seg.color"
                :stroke-width="26"
                :stroke-dasharray="seg.dash"
                :stroke-dashoffset="seg.offset"
              />
            </svg>
            <div class="alloc-donut-center">
              <span class="alloc-donut-label">{{ $t('targetPreview') }}</span>
              <span class="alloc-donut-total">{{ totalTarget }}%</span>
            </div>
          </div>

          <ul class="alloc-legend">
            <li v-for="lg in donutLegend" :key="lg.name" class="alloc-legend-item">
              <span class="alloc-legend-dot" :style="{ background: lg.color }" />
              <span class="alloc-legend-name">{{ lg.name }}</span>
              <span class="alloc-legend-pct">{{ lg.pct }}</span>
            </li>
            <li v-if="donutLegend.length === 0" class="alloc-legend-empty">{{ $t('allocEmpty') }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ============ Sticky actions ============ -->
    <div class="set-footer">
      <Button
        :label="$t('save')"
        :disabled="saveButtonDisabled"
        @click="saveAllocation"
      />
      <Button
        :label="$t('cancel')"
        severity="secondary"
        outlined
        :disabled="saveButtonDisabled"
        @click="resetAllocation"
      />
    </div>
  </div>
</template>


<script setup>
import { ref, computed, watch } from "vue";
import InputNumber from "primevue/inputnumber";
import Button from "primevue/button";
import * as toast from '@/composables/toast';
import SymbolAutoComplete from '@/components/SymbolAutoComplete.vue';
import { useAuthStore } from "@/stores/auth";
import { usePortfolioStore } from "@/stores/portfolio";
import { useHoldingsStore } from "@/stores/holdings";
import api from "@/utils/api";

import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const auth = useAuthStore();
const portfolioStore = usePortfolioStore();
const holdingsStore = useHoldingsStore();

const assets = ref([]); // allocation
const oldAssets = ref([]);
const selectedSymbol = ref("");

// 配色（沿用 Dashboard 資產配置圖的色盤，並延伸以支援更多標的）
const CHART = ['#3b82f6', '#14b8a6', '#f59e0b', '#f97316', '#8b5cf6', '#ec4899', '#64748b'];
const colorFor = (i) => CHART[i % CHART.length];

// 取得配置資料
const getAllocation = async () => {
  try {
    if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
    const data = await api.get(`/api/allocation?uid=${auth.user?.uid}&portfolio_id=${portfolioStore.currentPortfolio?.id}`);
    assets.value = (data || []).map((a) => ({ ...a, target: Number(a.target) || 0 }));
    oldAssets.value = JSON.parse(JSON.stringify(assets.value));
  } catch (error) {
    console.error('Error fetching allocation:', error);
  }
};

if (auth.user) {
  getAllocation();
}

watch(() => auth.user, (newUser) => {
  if (newUser) getAllocation();
});

watch(() => portfolioStore.currentPortfolio, (newVal) => {
  if (newVal?.id) getAllocation();
});

// 檢查是否已存在 allocation
const existsInAllocation = (symbol) =>
  assets.value.some((a) => a.symbol === symbol);

// 是否為自訂標的（不在持股中）
const isCustom = (symbol) =>
  !!symbol && !holdingsStore.list.some((h) => h.symbol === symbol);

// 可快速選擇的持股（尚未加入配置）
const candidates = computed(() =>
  holdingsStore.list.filter((h) => !existsInAllocation(h.symbol))
);

// 從持股快速加入
const addFromHolding = (h) => {
  if (existsInAllocation(h.symbol)) return;
  assets.value.push({
    symbol: h.symbol,
    name: h.name,
    assetType: h.assetType,
    target: 0,
  });
};

// 從搜尋加入（可為自訂標的）
const addFromSearch = ({ symbol, name, assetType }) => {
  if (existsInAllocation(symbol)) {
    toast.error(t('symbolhavebeenexisted', { symbol }));
    selectedSymbol.value = "";
    return;
  }
  assets.value.push({ symbol, name, assetType, target: 0 });
  selectedSymbol.value = "";
};

// 移除資產
const removeAsset = (index) => {
  assets.value.splice(index, 1);
};

// 還原為上次儲存的配置
const resetAllocation = () => {
  assets.value = JSON.parse(JSON.stringify(oldAssets.value));
};

// 總和
const totalTarget = computed(() =>
  Math.round(assets.value.reduce((sum, a) => sum + (Number(a.target) || 0), 0) * 10) / 10
);
const isTotalOk = computed(() => Math.round(totalTarget.value) === 100);

const saveButtonDisabled = computed(
  () => JSON.stringify(assets.value) === JSON.stringify(oldAssets.value)
);

// 儲存
const saveAllocation = async () => {
  if (!auth.user?.uid || !portfolioStore.currentPortfolio?.id) return;
  if (assets.value.length > 0 && Math.round(totalTarget.value) !== 100) {
    toast.error(t('totalTargetError'));
    return;
  }
  await api.post("/api/allocation/", {
    uid: auth.user.uid,
    portfolio_id: portfolioStore.currentPortfolio.id,
    assets: assets.value,
  });
  oldAssets.value = JSON.parse(JSON.stringify(assets.value));
  toast.success(t('allocationSaved'));
};

/* ---------- Donut preview ---------- */
const donutRadius = 77;
const donutCirc = 2 * Math.PI * donutRadius;
const donutTrackColor = 'var(--p-content-border-color)';

const donutSource = computed(() =>
  assets.value
    .map((a, i) => ({ name: a.symbol || '—', value: Number(a.target) || 0, color: colorFor(i) }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)
);

const donutSegments = computed(() => {
  const total = donutSource.value.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return donutSource.value.map((s) => {
    const len = (s.value / total) * donutCirc;
    const seg = {
      color: s.color,
      dash: `${len.toFixed(2)} ${(donutCirc - len).toFixed(2)}`,
      offset: (-offset).toFixed(2),
    };
    offset += len;
    return seg;
  });
});

const donutLegend = computed(() =>
  donutSource.value.map((s) => ({ color: s.color, name: s.name, pct: `${s.value}%` }))
);

// 依代號產生穩定的字母標記配色
const monoColors = (sym) => {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) % 360;
  return { background: `hsl(${h} 42% 92%)`, color: `hsl(${h} 55% 34%)` };
};
</script>

<style scoped>
/* 表單頁不需要滿版，限制寬度較好讀 */
.set-page {
  max-width: 56rem;
}

.alloc-search {
  max-width: 22rem;
}

/* Total badge */
.alloc-badge {
  font-variant-numeric: tabular-nums;
  font-size: 0.875rem;
  font-weight: 700;
}
.alloc-badge--ok { color: var(--p-green-600, #16a34a); }
.alloc-badge--err { color: var(--p-red-600, #dc2626); }

/* Rows */
.alloc-row {
  display: grid;
  grid-template-columns: 5px 64px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}
.alloc-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}
.alloc-num {
  width: 104px;
}
:deep(.alloc-num.p-inputnumber) {
  width: 104px;
}
:deep(.alloc-num .p-inputnumber-input) {
  width: 100%;
}
.alloc-bar {
  width: 5px;
  height: 30px;
  border-radius: 3px;
}
.alloc-symbol {
  font-weight: 700;
  color: var(--p-text-color);
  font-size: 0.875rem;
}
.alloc-custom-tag {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--p-primary-color);
}
.alloc-name {
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:deep(.alloc-input) {
  text-align: right;
}
.alloc-empty {
  padding: 1.75rem 1rem;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--p-text-muted-color);
}

/* Quick-pick chips */
.alloc-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px 0 6px;
  border: 1px solid var(--p-content-border-color);
  border-radius: 999px;
  background: var(--p-content-background);
  cursor: pointer;
  transition: all 0.15s;
}
.alloc-chip:hover {
  border-color: var(--p-primary-color);
  background: color-mix(in srgb, var(--p-primary-color) 8%, transparent);
}
.alloc-chip-mono {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}
.alloc-chip-symbol {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--p-text-color);
}

/* Donut */
.alloc-donut {
  position: relative;
  flex: 0 0 auto;
  width: 170px;
  height: 170px;
}
.alloc-donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.alloc-donut-label {
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
}
.alloc-donut-total {
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--p-text-color);
  font-variant-numeric: tabular-nums;
}
.alloc-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.alloc-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
}
.alloc-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex: 0 0 auto;
}
.alloc-legend-name {
  font-weight: 600;
  color: var(--p-text-color);
}
.alloc-legend-pct {
  margin-left: auto;
  color: var(--p-text-muted-color);
  font-variant-numeric: tabular-nums;
}
.alloc-legend-empty {
  font-size: 0.8125rem;
  color: var(--p-text-muted-color);
}
</style>
