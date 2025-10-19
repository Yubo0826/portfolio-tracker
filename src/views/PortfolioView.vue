<template>
  <div>
    <div class="flex mb-2 gap-2 justify-start relative top-[50px]">
      <Button @click="tab = 'holdings'" rounded label="持有資產" class="" size="middle" :outlined="tab !== 'holdings'" />
      <Button @click="tab = 'transactions'" rounded label="交易紀錄" class="" size="middle" :outlined="tab !== 'transactions'" />
      <Button @click="tab = 'dividends'" rounded label="利息紀錄" class="" size="middle" :outlined="tab !== 'dividends'" />
    </div>

    <div>
      <div v-if="tab === 'holdings'" class="mt-4"><HoldingsView /></div>
      <div v-else-if="tab === 'transactions'" class="mt-4"><TransactionsView /></div>
      <div v-else class="mt-4"><DividendsView /></div>
    </div>

    <!-- 用 v-model:value 綁定目前分頁 -->
    <div class="bg-black" :style="{ backgroundColor: 'var(--p-primary-color)' }">
      <Tabs v-model:value="tab">
        <TabList>
          <Tab value="holdings">
            <div class="flex items-center">
              <span>{{ $t('holding') }}</span>
            </div>
          </Tab>
          <Tab value="transactions">
            <div class="flex items-center">
              <span>{{ $t('transactions') }}</span>
            </div>
          </Tab>
          <Tab value="dividends">
            <div class="flex items-center">
              <span>{{ $t('dividends') }}</span>
            </div>
          </Tab>
        </TabList>
  
        <TabPanels :pt="{ root: { style: { padding: 0, paddingTop: '1rem' }}}">
          <TabPanel value="holdings"><div class="mt-4"><HoldingsView /></div></TabPanel>
          <TabPanel value="transactions"><div class="mt-4"><TransactionsView /></div></TabPanel>
          <TabPanel value="dividends"><div class="mt-4"><DividendsView /></div></TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

import HoldingsView from './HoldingsView.vue'
import TransactionsView from './TransactionsView.vue'
import DividendsView from './DividendsView.vue'

const VALID_TABS = ['holdings', 'transactions', 'dividends']
const normalize = (t) => (VALID_TABS.includes(t) ? t : 'holdings')

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

