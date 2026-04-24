<template>
  <div class="p-6 bg-gray-50 min-h-screen text-gray-600">
    <div class="flex flex-wrap items-center gap-3 bg-white p-4 border border-gray-200 rounded-t-xl">
      
      <div class="relative flex-1 min-w-[240px]">
        <span class="absolute inset-y-0 left-3 flex items-center">
          <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </span>
        <input 
          type="text" 
          placeholder="search by any expense parameter"
          class="w-full pl-10 pr-4 py-2 bg-blue-50/30 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 ring-blue-50 text-sm"
        >
      </div>

      <div class="relative">
        <button 
          @click="toggleDropdown('date')"
          class="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
          :class="{ 'border-blue-500 ring-1 ring-blue-500': activeDropdown === 'date' }"
        >
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <span>Date Range</span>
          <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"></path></svg>
        </button>

        <div v-if="activeDropdown === 'date'" class="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 p-4">
          <div class="flex gap-2 mb-4">
            <div>
              <label class="text-[10px] text-gray-400 uppercase">Start date</label>
              <input type="text" placeholder="MM/DD/YYYY" class="w-full border rounded p-1 text-xs outline-none focus:border-blue-500">
            </div>
            <div>
              <label class="text-[10px] text-gray-400 uppercase">End date</label>
              <input type="text" placeholder="MM/DD/YYYY" class="w-full border rounded p-1 text-xs outline-none focus:border-blue-500">
            </div>
          </div>
          <div class="border-t pt-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-bold">January 2021</span>
              <div class="flex gap-2 text-gray-400">
                <button class="hover:text-gray-600">&lt;</button>
                <button class="hover:text-gray-600">&gt;</button>
              </div>
            </div>
            <div class="grid grid-cols-7 gap-1 text-[10px] text-center">
              <span v-for="d in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="d" class="text-gray-300 font-medium">{{ d }}</span>
              <button 
                v-for="i in 31" :key="i"
                class="py-1 hover:bg-blue-50 rounded"
                :class="{ 'bg-blue-600 text-white': i === 5 }"
              >
                {{ i }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <button class="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Money Range
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"></path></svg>
      </button>

      <div class="ml-auto">
        <button class="flex items-center gap-2 px-4 py-1.5 border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition">
          <img src="https://img.icons8.com/color/48/000000/microsoft-excel-2019--v1.png" class="w-4 h-4" />
          Export to CSV
        </button>
      </div>
    </div>

    <div class="bg-white border-x border-b border-gray-200 overflow-hidden shadow-sm">
        <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 text-gray-400 uppercase text-[10px] tracking-widest border-b">
                <tr>
                    <th class="px-6 py-4 font-medium">Created ⇅</th>
                    <th class="px-6 py-4 font-medium">Vehicle ⇅</th>
                    <th class="px-6 py-4 font-medium">Amount Money ⇅</th>
                    <th class="px-6 py-4 font-medium">Status ⇅</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                <tr v-for="i in 5" :key="i" class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-gray-500">12-4-2020</td>
                    <td class="px-6 py-4 font-medium">BMW</td>
                    <td class="px-6 py-4">BR. 30,000</td>
                    <td class="px-6 py-4 text-xs font-bold text-gray-400">RECURING</td>
                </tr>
            </tbody>
        </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const activeDropdown = ref(null);

const toggleDropdown = (type) => {
  activeDropdown.value = activeDropdown.value === type ? null : type;
};

// 點擊外部關閉彈窗的邏輯 (建議在實際項目中用指令或庫實現)
</script>