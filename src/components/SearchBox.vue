<template>
  <!-- 外層：不是 dropdown；清楚固定讓清單顯示在輸入框下面 -->
  <div
    class="w-full max-w-2xl rounded-2xl shadow-2xl backdrop-blur text-neutral-100"
  >
    <!-- Search input -->
    <div class="relative">
      <svg
        class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>

      <input
        ref="inputEl"
        v-model="query"
        @keydown="onKeydown"
        @input="onInput"
        id="searchInput"
        type="text"
        placeholder="Search docs"
        class="w-full bg-transparent placeholder-neutral-500 text-neutral-100 px-12 py-4 outline-none"
        autocomplete="off"
        aria-autocomplete="list"
        aria-controls="resultsList"
        aria-expanded="true"
        role="combobox"
        :aria-activedescendant="activeIndex >= 0 ? `opt-${activeIndex}` : undefined"
      />

      <button
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-neutral-400 hover:text-neutral-200 focus:outline-none"
        aria-label="清除"
        @click="clearAll"
      >
        ×
      </button>
    </div>

    <!-- Results menu（永遠在輸入框下方） -->
    <div class="max-h-96 overflow-auto">
      <div
        v-if="filtered.length"
        class="px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-neutral-500"
      >
        Documentation
      </div>

      <ul v-if="filtered.length" id="resultsList" role="listbox" class="py-2">
        <li
          v-for="(item, idx) in filtered"
          :key="item.title"
          :id="`opt-${idx}`"
          role="option"
          :aria-selected="activeIndex === idx"
          @mouseenter="setActive(idx)"
          @click="select(idx)"
          :class="[
            'group flex items-center justify-between gap-3 px-4 py-3 cursor-pointer',
            activeIndex === idx ? 'bg-neutral-100' : 'hover:bg-neutral-100'
          ]"
        >
          <div class="flex flex-col py-2 px-4">
            <span class="text-base font-semibold text-black">{{ item.symbol }}</span>
            <span class="text-sm text-gray-500">
              {{ item.name }}
              <template v-if="item.assetType">
                ({{ item.assetType }})
              </template>
            </span>
          </div>
        </li>
      </ul>

      <div
        v-else
        class="select-none py-12 text-center text-sm text-neutral-400"
      >
        No recent searches
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 假資料：實作時可改成 API 結果
const DATA = [
  { title: 'Vue.js Documentation', symbol: 'VUE', name: 'Vue.js Framework', assetType: 'Framework' },
  { title: 'React Documentation', symbol: 'REACT', name: 'React Library', assetType: 'Library' },
  { title: 'Angular Documentation', symbol: 'ANGULAR', name: 'Angular Framework', assetType: 'Framework' },
  { title: 'Svelte Documentation', symbol: 'SVELTE', name: 'Svelte Framework', assetType: 'Framework' },
  // 更多項目...
]

const query = ref('')
const inputEl = ref(null)
const activeIndex = ref(-1)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return DATA.filter((d) => d.title.toLowerCase().includes(q))
})

function onInput() {
  activeIndex.value = filtered.value.length ? 0 : -1
}

function setActive(idx) {
  activeIndex.value = idx
}

function select(idx) {
  const item = filtered.value[idx]
  if (!item) return
  // 專案內可改成路由跳轉或開啟連結
  alert('Selected: ' + item.title)
}

function clearAll() {
  query.value = ''
  onInput()
  inputEl.value?.focus()
}

function onKeydown(e) {
  const max = filtered.value.length - 1
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, max)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (activeIndex.value >= 0) select(activeIndex.value)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    clearAll()
    inputEl.value?.blur()
  }
}

onMounted(() => {
  onInput()
  inputEl.value?.focus()
})
</script>

<!--
使用方式：
1) 已在專案中安裝 TailwindCSS（或於全域引入 compiled CSS）。
2) 將本檔命名為 SearchPanel.vue，於頁面中 <SearchPanel /> 使用即可。
3) 如需串接後端，可將 DATA 換成 props 或 from API 的結果。
-->
