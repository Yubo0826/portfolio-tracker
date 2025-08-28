<template>
    <div>
        <Tabs value="holdings">
            <TabList>
                <Tab value="holdings">
                    <div class="flex items-center">
                        <i class="pi pi-briefcase mr-2"></i>
                        <span>目前持有</span>
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
                        <span>利息</span>
                    </div>
                </Tab>
            </TabList>
            <TabPanels :pt="{
                root: {
                    style: {
                        padding: '0',
                        paddingTop: '1rem',
                    }
                },
            }">
                <TabPanel value="holdings">
                    <div class="mt-4">
                        <HoldingsView></HoldingsView>
                    </div>
                </TabPanel>
                <TabPanel value="transactions">
                    <div class="mt-4">
                        <TransactionsView></TransactionsView>
                    </div>
                </TabPanel>
                <TabPanel value="dividends">
                    <div class="mt-4">
                        <DividendsView></DividendsView>
                    </div>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>
<script setup>
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';

import HoldingsView from './HoldingsView.vue';
import TransactionsView from './TransactionsView.vue';
import DividendsView from './DividendsView.vue';
import { Card } from 'primevue';
</script>