<template>
  <div class="mt-4">
      <div class="flex mb-2 mt-6 gap-2 justify-center relative">
        <SelectButton
          v-model="tab"
          :options="options"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
        />

        <!-- <Button @click="tab = 'holdings'" rounded :label="t('holding')" class="" size="middle" :outlined="tab !== 'holdings'" />
        <Button @click="tab = 'transactions'" rounded :label="t('transactions')" class="" size="middle" :outlined="tab !== 'transactions'" />
        <Button @click="tab = 'dividends'" rounded :label="t('dividends')" class="" size="middle" :outlined="tab !== 'dividends'" />-->
        
        <!-- <button
          v-for="option in options"
          :key="option.value"
          @click="tab = option.value"
          class="px-4 py-2 text-sm transition-all duration-200 rounded-lg cursor-pointer"
          :class="[
            tab === option.value
              ? 'bg-gray-100 text-black dark:bg-[#2e2e2e] dark:text-white font-bold'
              : 'text-gray-500 dark:text-white hover:text-black hover:bg-gray-50 dark:hover:text-white dark:hover:bg-[#222222]'
          ]"
        >
          {{ option.label }}
        </button> -->

      </div>
  
      <div class="mt-4">
        <div v-if="tab === 'holdings'"><HoldingsView /></div>
        <div v-else-if="tab === 'transactions'"><TransactionsView /></div>
        <div v-else><DividendsView /></div>
      </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import HoldingsView from './HoldingsView.vue'
import TransactionsView from './TransactionsView.vue'
import DividendsView from './DividendsView.vue'

import { useI18n } from 'vue-i18n'
const { t } = useI18n()

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

