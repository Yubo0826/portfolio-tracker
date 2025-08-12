<template>
    <TabMenu :model="items" v-model:activeIndex="activeIndex" />
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import TabMenu from 'primevue/tabmenu';
  
  const items = ref([
      { label: '1天' },
      { label: '5天' },
      { label: '1個月' },
      { label: '6個月' },
      { label: 'YTD' },
      { label: '1年' },
      { label: '5年' },
      { label: '最長' }
  ]);
  
  const activeIndex = ref(3); // 預設選中第四個，即 '6個月'
  </script>
  
  <style>
  /* 這裡可以覆蓋 PrimeVue 的 TabMenu 樣式 */
  /* 需要全域或使用 deep selector，因為 TabMenu 的結構複雜 */
  /* 例如: */
  .p-tabmenu .p-tabmenu-nav .p-tabmenuitem .p-menuitem-link {
      color: #6c757d;
      padding: 0.5rem 0.25rem;
  }
  
  .p-tabmenu .p-tabmenu-nav .p-tabmenuitem.p-highlight .p-menuitem-link {
      color: #007bff;
  }
  
  .p-tabmenu .p-tabmenu-nav .p-tabmenuitem.p-highlight .p-menuitem-link::before {
      background: #007bff;
      height: 2px;
  }
  </style>