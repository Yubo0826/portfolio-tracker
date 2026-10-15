<template>
  <div @keydown.down.prevent="moveFocus(1)" @keydown.up.prevent="moveFocus(-1)">
    <div class="flex items-center gap-3 px-4 py-3 border-b border-surface">
      <label class="flex flex-1 items-center gap-3 px-3 py-2">
        <i class="pi pi-search text-primary"></i>
        <input
          ref="inputEl"
          v-model="query"
          autofocus
          class="flex-1 bg-transparent text-base outline-none"
          :placeholder="$t('searchPlaceholder')"
          :aria-label="$t('searchPlaceholder')"
          @input="onSearch"
          @keydown.enter="groups[0]?.items[0] && select(groups[0].items[0])"
        />
      </label>
      <Button icon="pi pi-times" text rounded severity="secondary" size="small" :aria-label="$t('close')"
        v-tooltip.bottom="{ value: $t('close'), showDelay: 500 }" @click="emit('close')" />
    </div>

    <div ref="listEl" class="max-h-[60vh] overflow-y-auto pb-2">
      <div v-if="searching" class="px-4 py-6 text-center"><i class="pi pi-spin pi-spinner"></i></div>
      <div v-else-if="!groups.length" class="px-4 py-6 text-center text-muted-color">{{ $t('noResults') }}</div>
      <template v-for="(g, i) in groups" v-else :key="g.key">
        <div :class="{ 'mt-2 border-t border-surface': i }" class="px-4 pt-3 pb-1 text-xs text-muted-color">{{ g.label }}</div>
        <div
          v-for="item in g.items"
          :key="item.symbol"
          class="flex items-center hover:bg-emphasis"
        >
          <button
            type="button"
            data-option
            class="flex min-w-0 flex-1 items-center gap-3 px-4 py-2 text-left cursor-pointer outline-none focus-visible:bg-emphasis"
            @click="select(item)"
          >
            <div class="min-w-0 flex-1">
              <div class="truncate text-base font-semibold">{{ item.symbol }}</div>
              <div class="truncate text-xs text-muted-color">{{ [item.longname || item.shortname, item.exchDisp].filter(Boolean).join(' · ') }}</div>
            </div>
            <div class="shrink-0 text-right">
              <div v-if="item.regularMarketPrice != null" class="text-base font-semibold">{{ formatNumber(item.regularMarketPrice) }}</div>
              <div v-if="item.regularMarketChangePercent != null" :class="item.regularMarketChangePercent >= 0 ? 'text-up' : 'text-down'" class="text-xs">
                {{ item.regularMarketChangePercent >= 0 ? '+' : '' }}{{ formatNumber(item.regularMarketChangePercent) }}%
              </div>
            </div>
          </button>
          <Button
            v-if="g.key === 'history'"
            icon="pi pi-times"
            text
            rounded
            size="small"
            severity="secondary"
            class="mr-2"
            :aria-label="`${t('delete')} ${item.symbol}`"
            v-tooltip.top="{ value: t('delete'), showDelay: 500 }"
            @click="removeHistoryItem(item)"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import debounce from 'lodash/debounce'
import api from '@/utils/api'

const { t } = useI18n()
const router = useRouter()
const emit = defineEmits(['close'])

const query = ref('')
const groups = ref([])
const searching = ref(false)
const inputEl = ref(null)
const listEl = ref(null)
let trending = null

const SEARCH_HISTORY_KEY = 'portfolio-tracker-search-history'
const SEARCH_HISTORY_LIMIT = 5

const formatNumber = (v) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function normalizeSearchItem(item) {
  if (!item?.symbol) return null
  return {
    symbol: String(item.symbol).toUpperCase(),
    longname: item.longname || item.longName || item.name || item.shortname || item.shortName || '',
    shortname: item.shortname || item.shortName || item.longname || item.longName || item.name || '',
    quoteType: item.quoteType || item.assetType || item.typeDisp || '',
    assetType: item.assetType || item.typeDisp || item.quoteType || '',
    exchDisp: item.exchDisp || item.fullExchangeName || item.exchange || '',
    regularMarketPrice: item.regularMarketPrice ?? null,
    regularMarketChangePercent: item.regularMarketChangePercent ?? null,
  }
}

function readSearchHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeSearchItem).filter(Boolean).slice(0, SEARCH_HISTORY_LIMIT)
  } catch {
    return []
  }
}

function writeSearchHistory(items) {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(items.slice(0, SEARCH_HISTORY_LIMIT)))
  } catch {
    // noop
  }
}

function loadTrending() {
  trending ??= api.get('/api/yahoo/trending')
    .then(data => (Array.isArray(data) ? data.map(normalizeSearchItem).filter(Boolean) : []))
    .catch(() => { trending = null; return [] })
  return trending
}

const group = (label, key, items) => ({ label, key, items })

async function idleGroups() {
  return [
    group(t('recentlyUsed'), 'history', readSearchHistory()),
    group(t('popularSymbols'), 'trending', await loadTrending()),
  ].filter(g => g.items.length)
}

async function loadGroups() {
  const q = query.value.trim()
  searching.value = true
  try {
    let next
    if (!q) next = await idleGroups()
    else {
      const data = await api.get('/api/yahoo/symbol?query=' + encodeURIComponent(q))
      next = Array.isArray(data) && data.length ? [group(t('searchResults'), 'result', data.map(normalizeSearchItem).filter(Boolean))] : []
    }
    if (q === query.value.trim()) groups.value = next // 丟掉過期回應
  } catch {
    if (q === query.value.trim()) groups.value = []
  } finally {
    searching.value = false
  }
}
const onSearch = debounce(loadGroups, 300)
loadGroups()

// 上下鍵在輸入框與選項之間移動焦點
function moveFocus(step) {
  const options = [...(listEl.value?.querySelectorAll('[data-option]') ?? [])]
  const next = options.indexOf(document.activeElement) + step
  if (next < 0) inputEl.value?.focus()
  else options[Math.min(next, options.length - 1)]?.focus()
}

async function removeHistoryItem(item) {
  writeSearchHistory(readSearchHistory().filter(h => h.symbol !== item.symbol))
  groups.value = await idleGroups()
}

function select(item) {
  // 報價會過期，不存進歷史
  writeSearchHistory([{ ...item, regularMarketPrice: null, regularMarketChangePercent: null }, ...readSearchHistory().filter(h => h.symbol !== item.symbol)])
  router.push({ name: 'asset', params: { symbol: item.symbol } })
  emit('close')
}
</script>
