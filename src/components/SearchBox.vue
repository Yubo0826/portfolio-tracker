<template>
  <div class="w-full max-w-2xl rounded-2xl shadow-2xl backdrop-blur">
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
        placeholder="輸入股票、ETF代號或名稱"
        class="w-full bg-transparent placeholder-neutral-500 px-12 py-4 outline-none"
        autocomplete="off"
        aria-autocomplete="list"
        aria-controls="resultsList"
        aria-expanded="true"
        role="combobox"
        :aria-activedescendant="activeIndex >= 0 ? `opt-${activeIndex}` : undefined"
      />


      <i @click="clearAll" class="pi pi-times absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-neutral-400 focus:outline-none"></i>
    </div>

    <!-- Results -->
    <div class="max-h-96 overflow-auto">
      <div
        v-if="results.length"
        class="px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-neutral-500"
      >
        搜尋結果
      </div>

      <ul v-if="results.length" id="resultsList" role="listbox" class="py-2">
        <li
          v-for="(item, idx) in results"
          :key="item.symbol + idx"
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
        v-else-if="query.trim().length > 0 && !loading"
        class="select-none py-12 text-center text-sm text-neutral-400"
      >
        No results
      </div>

      <div v-if="loading" class="select-none py-12 text-center text-sm text-neutral-400">
        Loading...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import debounce from 'lodash/debounce'
import api from '@/api'
import { useRouter } from 'vue-router'

const router = useRouter()
const emit = defineEmits(['close']);

const query = ref('')
const inputEl = ref(null)
const results = ref([])
const activeIndex = ref(-1)
const loading = ref(false)

// 搜尋資料
const search = async () => {
  const q = query.value.trim()
  if (!q.length) {
    results.value = []
    return
  }

  loading.value = true
  try {
    const data = await api.get('http://localhost:3000/api/yahoo/symbol?query=' + q)
    results.value = data.map(item => ({
      symbol: item.symbol,
      name: item.longname,
      assetType: item.typeDisp,
    }))
    activeIndex.value = results.value.length ? 0 : -1
  } catch (err) {
    results.value = []
  } finally {
    loading.value = false
  }
}

const debouncedSearch = debounce(search, 300)

function onInput() {
  debouncedSearch()
}

function clearAll() {
  query.value = ''
  results.value = []
  activeIndex.value = -1
  inputEl.value?.focus()
}

function setActive(idx) {
  activeIndex.value = idx
}

function select(idx) {
  const item = results.value[idx]
  if (!item) return
  emit('close');
  router.push({ name: 'asset', params: { symbol: item.symbol } });
}

function onKeydown(e) {
  const max = results.value.length - 1
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
  inputEl.value?.focus()
})
</script>
