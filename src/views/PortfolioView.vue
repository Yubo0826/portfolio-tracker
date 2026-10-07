<template>
  <div>
      <div class="flex mb-2 gap-2 items-center justify-start relative">
        <SelectButton
          v-model="tab"
          :options="options"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
          size="small"
        />
      </div>
  
      <div class="mt-4">
        <div v-if="tab === 'holdings'"><HoldingsView /></div>
        <div v-else-if="tab === 'transactions'"><TransactionsView /></div>
        <div v-else><DividendsView /></div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import HoldingsView from './HoldingsView.vue'
import TransactionsView from './TransactionsView.vue'
import DividendsView from './DividendsView.vue'

import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const VALID_TABS = ['holdings', 'transactions', 'dividends']
const normalize = (t) => (VALID_TABS.includes(t) ? t : 'holdings')

// PrimeVue SelectButton 選項
const options = computed(() => [
  { label: t('holding'), value: 'holdings' },
  { label: t('transactions'), value: 'transactions' },
  { label: t('dividends'), value: 'dividends' },
])

const route = useRoute()
const router = useRouter()

// 依 URL 初始化
const tab = ref(normalize(route.params.tab))

// 當 URL 改變（例如使用者直接輸入 /portfolio/transactions 或用瀏覽器返回）→ 更新 Tab
watch(
  () => route.params.tab,
  (t) => {
    tab.value = normalize(t)
  },
  { immediate: true }
)

// 當使用者切換 Tab → 更新 URL
watch(tab, (t) => {
  const next = normalize(t)
  if (route.params.tab !== next) {
    router.replace({ name: 'portfolio', params: { tab: next } })
  }
})
</script>



<style scoped>
/* 表格當卡片用，圓角對齊 Card（Aura card 用 border.radius.xl） */
:deep(.p-datatable) {
  border-radius: var(--p-border-radius-xl);
  overflow: hidden;
}

/* 表頭與內容同底色，分隔線用頁面底色做出凹槽感 */
:deep(.p-datatable-header-cell),
:deep(.p-datatable-tbody > tr > td) {
  border-color: var(--p-surface-background);
  border-bottom-width: 2px;
}

:deep(.p-datatable-header-cell) {
  padding: 1.25rem 1rem;
  font-weight: 700;
  color: var(--p-text-color);
}

:deep(.p-datatable-tbody > tr > td) {
  padding: 1rem;
  font-weight: 500;
}

:deep(.p-datatable-paginator-bottom) {
  border: 0;
}
</style>
