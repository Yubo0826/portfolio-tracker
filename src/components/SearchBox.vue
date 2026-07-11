<template> 
  <div class="relative w-full ">
    <div class="search-shell bg-[#f2f2f2] dark:bg-[#141f34]">
      <i class="pi pi-search text-xs text-neutral-600 shrink-0"></i>
      <input
        ref="inputEl"
        v-model="query"
        @focus="onFocus"
        @keydown="onKeydown"
        @input="onInput"
        type="text"
        :placeholder="$t('searchPlaceholder')"
        class="flex-1 min-w-0 bg-transparent text-md outline-none
               text-[var(--p-text-color)] placeholder-neutral-500"
        autocomplete="off"
        aria-autocomplete="list"
        aria-controls="resultsList"
        :aria-expanded="flatItems.length > 0"
        role="combobox"
        :aria-activedescendant="activeIndex >= 0 ? `opt-${activeIndex}` : undefined"
      />
      <span class="search-shortcut-indicator">/</span>
    </div>

    <div
      v-if="flatItems.length || (!isIdle && query.trim().length > 0 && !loading) || loading"
      class="absolute top-full mt-2 left-0 right-0 rounded-[1.25rem] shadow-xl
             bg-[var(--p-surface-0)] dark:bg-[#121c2b]
             overflow-hidden"
    >
      <div class="max-h-80 overflow-auto">
        <ul v-if="flatItems.length" id="resultsList" role="listbox" class="py-2">
          <template v-for="(item, idx) in flatItems" :key="item.group + '-' + item.symbol + '-' + idx">
            <li
              v-if="idx === 0 || flatItems[idx - 1].group !== item.group"
              role="presentation"
              :class="[
                'px-4 pb-1.5 text-sm font-semibold text-[#1f2937] dark:text-neutral-200',
                idx === 0 ? 'pt-3' : 'mt-2 pt-3 border-t border-neutral-200/70 dark:border-white/10'
              ]"
            >
              {{ groupLabel(item.group) }}
            </li>

            <li
              :id="`opt-${idx}`"
              role="option"
              :aria-selected="activeIndex === idx"
              @mouseenter="setActive(idx)"
              @click="select(idx)"
              :class="[
                'search-result-item group flex items-center gap-3 px-4 py-2.5 cursor-pointer',
                'hover:bg-neutral-100 dark:hover:bg-white/10',
                activeIndex === idx ? 'bg-neutral-100 dark:bg-white/10' : ''
              ]"
            >
              <div
                class="result-avatar shrink-0"
                :style="{ background: avatarColor(item.symbol) }"
              >
                {{ item.symbol.slice(0, 2) }}
              </div>

              <div class="min-w-0 flex-1 flex items-baseline gap-1.5 overflow-hidden">
                <span class="text-sm font-semibold text-[#3a8dff] shrink-0">{{ item.symbol }}</span>
                <span class="text-neutral-400 shrink-0">·</span>
                <span class="text-sm text-[#1f2937] dark:text-[#cbd5e1] truncate">
                  {{ item.longname || item.shortname || item.name || '' }}
                </span>
                <span class="hidden sm:inline text-xs text-neutral-400 shrink-0 truncate">
                  · {{ item.quoteType || item.assetType || '' }}<template v-if="item.exchDisp"> · {{ item.exchDisp }}</template>
                </span>
              </div>

              <span
                v-if="item.regularMarketChangePercent !== null && item.regularMarketChangePercent !== undefined"
                :class="item.regularMarketChangePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'"
                class="text-xs font-medium shrink-0"
              >
                {{ item.regularMarketChangePercent >= 0 ? '+' : '' }}{{ item.regularMarketChangePercent.toFixed(2) }}%
              </span>

              <button
                v-if="item.group === 'history'"
                type="button"
                class="history-remove-btn shrink-0"
                :aria-label="`${t('delete')} ${item.symbol}`"
                @mousedown.prevent
                @click.stop="removeHistoryItem(idx)"
              >
                <i class="pi pi-times text-xs"></i>
              </button>
            </li>
          </template>
        </ul>

        <div
          v-else-if="!isIdle && query.trim().length > 0 && !loading"
          class="select-none py-8 text-center text-sm text-neutral-600"
        >
          {{ t('noResults') }}
        </div>

        <div v-if="loading" class="select-none py-8 text-center text-sm text-neutral-600">
          {{ t('loading') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import debounce from 'lodash/debounce'
import api from '@/utils/api'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const emit = defineEmits(['close'])

const query = ref('')
const inputEl = ref(null)
const results = ref([])
const history = ref([])
const trending = ref([])
const activeIndex = ref(-1)
const loading = ref(false)

const SEARCH_HISTORY_KEY = 'portfolio-tracker-search-history'
const SEARCH_HISTORY_LIMIT = 5
const isIdle = computed(() => query.value.trim().length === 0)

let trendingLoaded = false
let trendingPromise = null

const flatItems = computed(() => {
  if (isIdle.value) {
    return [
      ...history.value.map(item => ({ ...item, group: 'history' })),
      ...trending.value.map(item => ({ ...item, group: 'trending' })),
    ]
  }
  return results.value.map(item => ({ ...item, group: 'result' }))
})

function groupLabel(group) {
  if (group === 'history') return t('recentlyUsed')
  if (group === 'trending') return t('popularSymbols')
  return t('searchResults')
}

const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316']

function avatarColor(symbol) {
  const code = String(symbol || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function normalizeSearchItem(item) {
  if (!item?.symbol) return null
  return {
    symbol: String(item.symbol).toUpperCase(),
    longname: item.longname || item.longName || item.name || item.shortname || item.shortName || '',
    shortname: item.shortname || item.shortName || item.longname || item.longName || item.name || '',
    quoteType: item.quoteType || item.assetType || item.typeDisp || '',
    assetType: item.assetType || item.typeDisp || item.quoteType || '',
    exchDisp: item.exchDisp || item.fullExchangeName || item.exchange || '',
    regularMarketChangePercent: item.regularMarketChangePercent ?? null,
  }
}

function readSearchHistory() {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map(normalizeSearchItem)
      .filter(Boolean)
      .slice(0, SEARCH_HISTORY_LIMIT)
  } catch (err) {
    return []
  }
}

function writeSearchHistory(items) {
  try {
    localStorage.setItem(
      SEARCH_HISTORY_KEY,
      JSON.stringify(items.slice(0, SEARCH_HISTORY_LIMIT))
    )
  } catch (err) {
    // noop
  }
}

function syncActiveIndex() {
  if (!isIdle.value) return
  const max = flatItems.value.length - 1
  if (max < 0) {
    activeIndex.value = -1
    return
  }
  activeIndex.value = activeIndex.value < 0 ? 0 : Math.min(activeIndex.value, max)
}

async function loadTrending() {
  if (trendingLoaded || trendingPromise) return trendingPromise
  trendingPromise = (async () => {
    try {
      const data = await api.get('/api/yahoo/trending')
      trending.value = Array.isArray(data) ? data.map(normalizeSearchItem).filter(Boolean) : []
    } catch (err) {
      trending.value = []
    } finally {
      trendingLoaded = true
      syncActiveIndex()
    }
  })()
  return trendingPromise
}

function showIdleState() {
  history.value = readSearchHistory()
  syncActiveIndex()
  loadTrending()
}

function saveSearchHistory(item) {
  const normalized = normalizeSearchItem(item)
  if (!normalized) return

  const current = readSearchHistory().filter(h => h.symbol !== normalized.symbol)
  const next = [normalized, ...current].slice(0, SEARCH_HISTORY_LIMIT)
  writeSearchHistory(next)
}

function removeHistoryItem(idx) {
  const item = flatItems.value[idx]
  if (!item || item.group !== 'history') return

  const next = readSearchHistory().filter(h => h.symbol !== item.symbol)
  writeSearchHistory(next)
  history.value = next

  const newLen = flatItems.value.length
  if (!newLen) {
    activeIndex.value = -1
    return
  }

  if (activeIndex.value === idx) {
    activeIndex.value = Math.min(idx, newLen - 1)
  } else if (activeIndex.value > idx) {
    activeIndex.value -= 1
  }
}

async function focusInput() {
  await nextTick()
  inputEl.value?.focus()
}

function close() {
  query.value = ''
  results.value = []
  history.value = []
  activeIndex.value = -1
  emit('close')
}

// 搜尋資料
const search = async () => {
  const q = query.value.trim()
  if (!q.length) {
    showIdleState()
    return
  }

  loading.value = true
  try {
    const data = await api.get('/api/yahoo/symbol?query=' + q)
    results.value = Array.isArray(data) ? data : []
    activeIndex.value = results.value.length ? 0 : -1
  } catch (err) {
    results.value = []
  } finally {
    loading.value = false
  }
}

const debouncedSearch = debounce(search, 300)

function onInput() {
  if (!query.value.trim().length) {
    debouncedSearch.cancel()
    showIdleState()
    return
  }
  debouncedSearch()
}

function onFocus() {
  if (!query.value.trim().length) {
    showIdleState()
  }
}

function setActive(idx) {
  activeIndex.value = idx
}

function select(idx) {
  const item = flatItems.value[idx]
  if (!item) return
  if (item.group !== 'history') saveSearchHistory(item)
  router.push({ name: 'asset', params: { symbol: item.symbol } })
  close()
}

function onKeydown(e) {
  const max = flatItems.value.length - 1
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
    close()
  }
}

defineExpose({ focusInput })
</script>

<style scoped>
.search-shell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  height: 2.85rem;
  padding: 0 1rem;
  border-radius: 40px;
  border: 1.5px solid transparent;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.search-shell:focus-within {
  border-color: #3a8dff;
  box-shadow: 0 0 0 3px rgba(58, 141, 255, 0.15);
}

.search-shortcut-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.65rem;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 92%, transparent);
  border-radius: 5px;
  background: color-mix(in srgb, var(--p-surface-0) 3%, transparent);
  color: var(--p-text-muted-color);
  font-size: 0.95rem;
  line-height: 1;
}

.search-result-item {
  margin: 0 0.5rem;
  border-radius: 0.625rem;
  transition: background-color 0.2s ease;
}

.result-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.history-remove-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 9999px;
  color: #6b7280;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.history-remove-btn:hover {
  background-color: rgba(15, 23, 42, 0.08);
  color: #111827;
}

.dark .history-remove-btn:hover {
  background-color: rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
}

.dark .search-shell {
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.dark .search-shell:focus-within {
  border-color: #3a8dff;
  box-shadow: 0 0 0 3px rgba(58, 141, 255, 0.25);
}

.dark .search-shortcut-indicator {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}
</style>
