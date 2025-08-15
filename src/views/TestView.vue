<script setup>
import { ref } from 'vue'
import Dropdown from 'primevue/dropdown'

const value = ref('USD')
const currencies = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'JPY', value: 'JPY' },
  { label: 'TWD', value: 'TWD' }
]

// 透過 pt (PassThrough) 調整內部節點大小與間距
const pt = {
  root: { class: 'currency-dropdown-root' },
  trigger: { class: 'currency-dropdown-trigger' },
  label: { class: 'currency-dropdown-label' },
  dropdownIcon: { class: 'currency-dropdown-icon' },
  panel: { class: 'currency-dropdown-panel' },
  item: ({ context }) =>
    ({ class: ['currency-dropdown-item', { 'is-selected': context.selected }] })
}
</script>

<template>
  <Dropdown
    v-model="value"
    :options="currencies"
    optionLabel="label"
    optionValue="value"
    :pt="pt"
    :showClear="false"
    :filter="false"
    :editable="false"
    :appendTo="'self'"
  />
</template>

<style scoped>
/* 外觀尺寸與背景（未 hover） */
.currency-dropdown-root {
  --radius: 10px;
  --bg: #f4f7fb;      /* 淡灰藍底 */
  --text: #6b7280;    /* 灰字 */
  --icon: #6b7280;
  --text-hover: #3b82f6;  /* 藍色（hover） */
  --icon-hover: #3b82f6;

  background: var(--bg);
  border: none;
  border-radius: var(--radius);
  padding: 6px 10px;          /* 讓高度接近你的圖 */
  box-shadow: 0 0 0 1px rgba(0,0,0,0.02) inset;
  min-height: auto;           /* 壓小一點 */
}

/* 讓整個區塊有 hover 效果（字與箭頭變藍） */
.currency-dropdown-root:hover .currency-dropdown-label,
.currency-dropdown-root:hover .currency-dropdown-icon {
  color: var(--text-hover);
  fill: var(--icon-hover);
}

/* 內距與無邊框的觸發區 */
.currency-dropdown-trigger {
  padding: 0 4px;
  border-left: none;
}

/* 文字樣式 */
.currency-dropdown-label {
  color: var(--text);
  font-weight: 600;
  font-size: 14px;
  padding: 0;
}

/* 箭頭大小與顏色 */
.currency-dropdown-icon {
  color: var(--icon);
  width: 14px;
  height: 14px;
}

/* 下拉面板與項目樣式（可依需求微調） */
.currency-dropdown-panel {
  border-radius: 10px;
}

.currency-dropdown-item {
  font-size: 14px;
  padding: 8px 10px;
}
.currency-dropdown-item.is-selected {
  font-weight: 600;
}
</style>
