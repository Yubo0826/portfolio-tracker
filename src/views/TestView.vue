<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import debounce from 'lodash/debounce'
import api from '@/api'

const props = defineProps({
  modelValue: String,
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'update'])

const q = ref(props.modelValue || '')
const results = ref([])
const loading = ref(false)
const open = ref(false)
const activeIndex = ref(-1) // 鍵盤高亮

const wrapperRef = ref(null)
const inputRef = ref(null)

const hasQuery = computed(() => q.value.trim().length > 0)
const showPanel = computed(() => open.value && (loading.value || hasQuery.value))

const fetchSymbols = async (keyword) => {
  if (!keyword) {
    results.value = []
    return
  }
  loading.value = true
  try {
    const { data } = await api.get(`http://localhost:3000/api/yahoo/symbol?query=${encodeURIComponent(keyword)}`)
    const items = (Array.isArray(data) ? data : [])
      .filter(it => it && ['EQUITY', 'ETF'].includes(it.quoteType))
      .map(it => ({
        symbol: it.symbol,
        name: it.longName ?? it.shortName ?? '',
        assetType: it.typeDisp ?? it.quoteType
      }))
    // de-duplicate
    const seen = new Set()
    results.value = items.filter(it => !seen.has(it.symbol) && seen.add(it.symbol))
    activeIndex.value = results.value.length ? 0 : -1
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

const debouncedFetch = debounce(() => fetchSymbols(q.value.trim()), 150)

const onInput = (e) => {
  q.value = e.target.value
  open.value = true
  debouncedFetch()
}

const selectItem = (item) => {
  if (!item) return
  emit('update:modelValue', item.symbol)
  emit('update', { symbol: item.symbol, name: item.name, assetType: item.assetType })
  q.value = item.symbol
  open.value = false
}

const onKeydown = (e) => {
  if (!showPanel.value) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!results.value.length) return
    activeIndex.value = (activeIndex.value + 1) % results.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (!results.value.length) return
    activeIndex.value = (activeIndex.value - 1 + results.value.length) % results.value.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (activeIndex.value >= 0) selectItem(results.value[activeIndex.value])
  } else if (e.key === 'Escape') {
    e.preventDefault()
    open.value = false
  }
}

const onClickOutside = (e) => {
  if (!wrapperRef.value) return
  if (!wrapperRef.value.contains(e.target)) open.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<template>
  <div ref="wrapperRef" class="relative max-w-xl w-full mx-auto">
    <!-- 搜尋輸入框 -->
    <div class="relative">
      <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
      <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 border border-gray-300 rounded px-1">esc</span>

      <input
        ref="inputRef"
        :value="q"
        :disabled="disabled"
        @input="onInput"
        @focus="open = true"
        @keydown="onKeydown"
        type="text"
        placeholder="Search symbol"
        class="w-full pl-11 pr-14 py-3 text-[15px] rounded-2xl border border-gray-300 shadow-sm focus:outline-none"
      />
    </div>

    <!-- 結果面板（非下拉，固定渲染在下面） -->
    <div
      v-show="showPanel"
      class="mt-2 rounded-xl shadow-2xl border border-gray-200 overflow-hidden bg-white"
    >
      <!-- Header -->
      <div class="px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-500 border-b border-gray-100">
        Documentation
      </div>

      <!-- Loading -->
      <div v-if="loading" class="px-4 py-4 text-sm text-gray-500">Searching…</div>

      <!-- Results -->
      <div v-else>
        <div
          v-if="results.length"
          class="divide-y divide-gray-100"
        >
          <button
            v-for="(item, idx) in results"
            :key="item.symbol"
            type="button"
            @mouseenter="activeIndex = idx"
            @mouseleave="activeIndex = -1"
            @click="selectItem(item)"
            class="w-full text-left px-4 py-2 flex items-start gap-3"
            :class="idx === activeIndex ? 'bg-[#0b1220] text-white' : ''"
          >
            <i class="pi pi-search mt-2" :class="idx === activeIndex ? 'text-slate-200' : 'text-gray-400'"></i>
            <div class="flex flex-col">
              <span class="text-[15px] font-semibold leading-5">{{ item.symbol }}</span>
              <span class="text-sm leading-5" :class="idx === activeIndex ? 'text-slate-200' : 'text-gray-500'">
                {{ item.name }} <template v-if="item.assetType">({{ item.assetType }})</template>
              </span>
            </div>
            <i class="pi pi-share-alt ml-auto mt-2" :class="idx === activeIndex ? 'text-slate-200' : 'text-gray-400'"></i>
          </button>
        </div>

        <!-- Empty -->
        <div v-else class="py-4 px-4 text-center text-gray-400">
          No matching symbols
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-100">
        <div class="px-4 py-2 text-right text-xs text-gray-400">
          Search by <span class="font-medium">algolia</span>
        </div>
        <div class="flex items-center justify-between px-4 py-2 text-[11px] text-gray-500 border-t border-gray-100">
          <div class="flex items-center gap-4">
            <span class="inline-flex items-center gap-1">
              <span class="border rounded px-1">↵</span> to select
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="border rounded px-1">↑</span>
              <span class="border rounded px-1">↓</span> to navigate
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="border rounded px-1">esc</span> to close
            </span>
          </div>
          <div class="text-gray-400">Data from Yahoo Finance</div>
        </div>
      </div>
    </div>
  </div>
</template>
