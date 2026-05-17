<template> 
  <div class="relative w-full ">
    <div class="search-shell bg-[#f2f2f2] dark:bg-[#141f34] py-4">
      <i class="pi pi-search text-xs text-neutral-400 shrink-0"></i>
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
        :aria-expanded="results.length > 0"
        role="combobox"
        :aria-activedescendant="activeIndex >= 0 ? `opt-${activeIndex}` : undefined"
      />
      <span class="search-shortcut-indicator">/</span>
    </div>

    <div
      v-if="results.length || (query.trim().length > 0 && !loading) || loading"
      class="absolute top-full mt-2 left-0 right-0 rounded-[1.25rem] shadow-xl
             bg-[var(--p-surface-0)] dark:bg-[#121c2b]
             overflow-hidden"
    >
      <div class="max-h-80 overflow-auto">
        <div
          v-if="results.length"
          class="px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-neutral-500"
        >
          {{ isShowingHistory ? t('recentlyUsed') : t('searchResults') }}
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
              'search-result-item group flex items-center gap-3 px-4 py-2 cursor-pointer',
              'hover:bg-neutral-100 dark:hover:bg-white/10',
              activeIndex === idx ? 'bg-neutral-100 dark:bg-white/10' : ''
            ]"
          >
            <div class="flex w-full items-center gap-2">
              <table class="w-full table-fixed">
                <tbody>
                  <tr>
                    <td class="w-28 pr-3 text-[#3a8dff] text-sm font-semibold truncate">
                      {{ item.symbol }}
                    </td>
                    <td class="pr-3 text-[#100000] dark:text-[#cbd5e1] text-sm truncate">
                      {{ item.longname || item.shortname || item.name || '' }}
                    </td>
                    <td class="w-26 text-sm truncate">
                      <span class="mr-4 text-[#100000] dark:text-[#cbd5e1] text-xs">{{ item.quoteType || item.assetType || '' }}</span>
                      <span>{{ item.exchDisp || '' }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <button
                v-if="isShowingHistory"
                type="button"
                class="history-remove-btn"
                :aria-label="`${t('delete')} ${item.symbol}`"
                @mousedown.prevent
                @click.stop="removeHistoryItem(idx)"
              >
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>
          </li>
        </ul>

        <div
          v-else-if="query.trim().length > 0 && !loading"
          class="select-none py-8 text-center text-sm text-neutral-400"
        >
          {{ t('noResults') }}
        </div>

        <div v-if="loading" class="select-none py-8 text-center text-sm text-neutral-400">
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
const activeIndex = ref(-1)
const loading = ref(false)

const SEARCH_HISTORY_KEY = 'portfolio-tracker-search-history'
const SEARCH_HISTORY_LIMIT = 5
const isShowingHistory = computed(() => query.value.trim().length === 0)

function normalizeSearchItem(item) {
  if (!item?.symbol) return null
  return {
    symbol: String(item.symbol).toUpperCase(),
    longname: item.longname || item.longName || item.name || item.shortname || item.shortName || '',
    shortname: item.shortname || item.shortName || item.longname || item.longName || item.name || '',
    quoteType: item.quoteType || item.assetType || item.typeDisp || '',
    assetType: item.assetType || item.typeDisp || item.quoteType || '',
    exchDisp: item.exchDisp || item.fullExchangeName || item.exchange || '',
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

function showSearchHistory() {
  const history = readSearchHistory()
  results.value = history
  activeIndex.value = history.length ? 0 : -1
}

function saveSearchHistory(item) {
  const normalized = normalizeSearchItem(item)
  if (!normalized) return

  const current = readSearchHistory().filter(h => h.symbol !== normalized.symbol)
  const next = [normalized, ...current].slice(0, SEARCH_HISTORY_LIMIT)
  writeSearchHistory(next)
}

function removeHistoryItem(idx) {
  if (!isShowingHistory.value) return

  const item = results.value[idx]
  if (!item?.symbol) return

  const next = readSearchHistory().filter(h => h.symbol !== item.symbol)
  writeSearchHistory(next)
  results.value = next

  if (!next.length) {
    activeIndex.value = -1
    return
  }

  if (activeIndex.value === idx) {
    activeIndex.value = Math.min(idx, next.length - 1)
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
  activeIndex.value = -1
  emit('close')
}

// 搜尋資料
const search = async () => {
  const q = query.value.trim()
  if (!q.length) {
    showSearchHistory()
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
    showSearchHistory()
    return
  }
  debouncedSearch()
}

function onFocus() {
  if (!query.value.trim().length) {
    showSearchHistory()
  }
}

function setActive(idx) {
  activeIndex.value = idx
}

function select(idx) {
  const item = results.value[idx]
  if (!item) return
  saveSearchHistory(item)
  router.push({ name: 'asset', params: { symbol: item.symbol } })
  close()
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
  min-height: 3.25rem;
  padding: 0.875rem 1rem;
  border-radius: 40px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
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

.dark .search-shortcut-indicator {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}
</style>
