<template>
  <div class="mt-4">
      <div class="flex mb-2 mt-6 gap-2 items-center justify-start relative">
        <SelectButton
          v-model="tab"
          :options="options"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
        />
        <div class="ml-auto">
          <Button
            :label="$t('refresh')"
            icon="pi pi-refresh"
            severity="secondary"
            size="small"
            :loading="isRefreshing"
            @click="refreshAll"
          />
        </div>
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

import { useHoldingsStore } from '@/stores/holdings'
import { useDividendsStore } from '@/stores/dividends'
import { useTransactionsStore } from '@/stores/transactions'

const holdingsStore = useHoldingsStore()
const dividendsStore = useDividendsStore()
const transactionsStore = useTransactionsStore()

const isRefreshing = computed(
  () => holdingsStore.isLoading || dividendsStore.isLoading || transactionsStore.isLoading
)

const refreshAll = () => {
  holdingsStore.refreshPrices()
  dividendsStore.refreshDividends()
  transactionsStore.fetchTransactions()
}

const VALID_TABS = ['holdings', 'transactions', 'dividends']
const normalize = (t) => (VALID_TABS.includes(t) ? t : 'holdings')

// PrimeVue SelectButton 選項
const options = ref([
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

