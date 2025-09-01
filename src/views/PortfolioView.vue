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

<template>
  <div>
    <!-- 用 v-model:value 綁定目前分頁 -->
    <Tabs v-model:value="tab">
      <TabList>
        <Tab value="holdings">
          <div class="flex items-center">
            <i class="pi pi-briefcase mr-2"></i>
            <span>持有資產</span>
          </div>
        </Tab>
        <Tab value="transactions">
          <div class="flex items-center">
            <i class="pi pi-receipt mr-2"></i>
            <span>交易紀錄</span>
          </div>
        </Tab>
        <Tab value="dividends">
          <div class="flex items-center">
            <i class="pi pi-wallet mr-2"></i>
            <span>利息紀錄</span>
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
</template>
