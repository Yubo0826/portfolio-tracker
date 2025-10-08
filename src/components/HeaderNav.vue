<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const openDropdown = ref(null);

// 關閉延遲計時器
const closeTimer = ref(null);

// 這裡維護導覽列資料
const navItems = ref([
  { type: 'link', label: t('dashboard'), to: '/dashboard', matchPath: ['/dashboard'] },

  {
    type: 'menu',
    key: 'portfolio',
    label: t('portfolio'),
    to: '/portfolio',
    matchPath: ['/portfolio', '/portfolio/holdings', '/portfolio/transactions', '/portfolio/dividends'],
    children: [
      { label: t('holdings'), to: '/portfolio/holdings' },
      { label: t('transactions'), to: '/portfolio/transactions' },
      { label: t('dividends'), to: '/portfolio/dividends' },
    ],
  },

  {
    type: 'menu',
    key: 'tool',
    label: t('tool'),
    to: '/allocation',
    matchPath: ['/rebalancing', '/allocation', '/backtesting'],
    children: [
      { label: t('allocation'), to: '/allocation', special: true },
      { label: t('rebalance'), to: '/rebalancing' },
      { label: t('backtesting'), to: '/backtesting' }
    ],
  },
]);

const toggleDropdown = (menuKey) => {
  cancelClose();
  openDropdown.value = openDropdown.value === menuKey ? null : menuKey;
};

// 延遲關閉（預設 180ms）
const closeDropdown = (delay = 180) => {
  if (closeTimer.value) clearTimeout(closeTimer.value);
  closeTimer.value = setTimeout(() => {
    openDropdown.value = null;
    closeTimer.value = null;
  }, delay);
};

// 取消延遲關閉（滑回到按鈕或面板時呼叫）
const cancelClose = () => {
  if (closeTimer.value) {
    clearTimeout(closeTimer.value);
    closeTimer.value = null;
  }
};
</script>

<template>
  <nav>
    <!-- 迴圈渲染 nav items -->
    <template v-for="item in navItems" :key="item.key || item.label">
      <!-- 單純連結 -->
      <RouterLink v-if="item.type === 'link'" :to="item.to">
        <Button 
          :pt="{
            label: {
              class: item.matchPath.includes($router.currentRoute.value.path) ? 'text-[#10b981]' : ''
            }
          }"
          :label="item.label" severity="secondary" variant="text" class="font-bold m-1" />
      </RouterLink>

      <!-- 下拉選單 -->
      <div v-else class="relative inline-block">
        <RouterLink :to="item.to">
          <Button
            :label="item.label"
            severity="secondary"
            variant="text"
            class="m-1"
            :pt="{
              label: {
                class: item.matchPath.includes($router.currentRoute.value.path) ? 'text-[#10b981]' : ''
              }
            }"
            @mouseenter="cancelClose(); toggleDropdown(item.key)"
            @mouseleave="closeDropdown(180)"
          />
        </RouterLink>

        <transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <div
            v-show="openDropdown === item.key"
            @mouseenter="cancelClose"
            @mouseleave="closeDropdown(180)"
            class="absolute left-0 mt-2 w-48 rounded-md shadow bg-white ring-1 ring-[#ececec] ring-opacity-5 focus:outline-none z-10"
          >
            <div class="py-1 cursor-pointer">
              <div
                v-for="child in item.children"
                :key="child.label"
                @click="$router.push(child.to), openDropdown = null, closeTimer = null;"
                class="block text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
              <i v-if="child.special" class="pi pi-cog"></i>
                {{ child.label }}
              </div>
            </div>
          </div>
        </transition>
      </div>
    </template>
  </nav>
</template>
