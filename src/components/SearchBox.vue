<template>
  <IconField class="w-full">
    <InputIcon class="pi pi-search" />
    <AutoComplete
      v-model="query"
      :suggestions="groups"
      optionLabel="symbol"
      optionGroupLabel="label"
      optionGroupChildren="items"
      completeOnFocus
      autofocus
      fluid
      scrollHeight="20rem"
      :placeholder="$t('searchPlaceholder')"
      :emptySearchMessage="t('noResults')"
      @complete="onComplete"
      @option-select="({ value }) => select(value)"
    >
      <template #optiongroup="{ option }">
        <span class="text-sm font-semibold">{{ option.label }}</span>
      </template>

      <template #option="{ option: item }">
        <div class="flex w-full min-w-0 items-center gap-3">
          <StockIcon :symbol="item.symbol" class="!mr-0 shrink-0" />

          <div class="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden">
            <span class="shrink-0 text-sm font-semibold text-primary">{{ item.symbol }}</span>
            <span class="shrink-0 text-muted-color">·</span>
            <span class="truncate text-sm">{{ item.longname || item.shortname || item.name || '' }}</span>
            <span class="hidden shrink-0 truncate text-xs text-muted-color sm:inline">
              · {{ item.quoteType || item.assetType || '' }}<template v-if="item.exchDisp"> · {{ item.exchDisp }}</template>
            </span>
          </div>

          <span
            v-if="item.regularMarketChangePercent !== null && item.regularMarketChangePercent !== undefined"
            :class="item.regularMarketChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'"
            class="shrink-0 text-xs font-medium"
          >
            {{ item.regularMarketChangePercent >= 0 ? '+' : '' }}{{ item.regularMarketChangePercent.toFixed(2) }}%
          </span>

          <Button
            v-if="item.group === 'history'"
            icon="pi pi-times"
            text
            rounded
            size="small"
            severity="secondary"
            :aria-label="`${t('delete')} ${item.symbol}`"
            @mousedown.prevent.stop
            @click.stop="removeHistoryItem(item)"
          />
        </div>
      </template>
    </AutoComplete>
  </IconField>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AutoComplete from 'primevue/autocomplete'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import api from '@/utils/api'
import StockIcon from '@/components/StockIcon.vue'

const { t } = useI18n()
const router = useRouter()
const emit = defineEmits(['close'])

const query = ref('')
const groups = ref([])
let trending = null

const SEARCH_HISTORY_KEY = 'portfolio-tracker-search-history'
const SEARCH_HISTORY_LIMIT = 5

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
    .catch(() => [])
  return trending
}

const group = (label, key, items) => ({ label, items: items.map(item => ({ ...item, group: key })) })

async function idleGroups() {
  return [
    group(t('recentlyUsed'), 'history', readSearchHistory()),
    group(t('popularSymbols'), 'trending', await loadTrending()),
  ].filter(g => g.items.length)
}

async function onComplete({ query: q }) {
  q = q.trim()
  if (!q) {
    groups.value = await idleGroups()
    return
  }
  try {
    const data = await api.get('/api/yahoo/symbol?query=' + encodeURIComponent(q))
    groups.value = Array.isArray(data) && data.length ? [group(t('searchResults'), 'result', data)] : []
  } catch {
    groups.value = []
  }
}

async function removeHistoryItem(item) {
  writeSearchHistory(readSearchHistory().filter(h => h.symbol !== item.symbol))
  groups.value = await idleGroups()
}

function select(item) {
  if (item.group !== 'history') {
    const normalized = normalizeSearchItem(item)
    writeSearchHistory([normalized, ...readSearchHistory().filter(h => h.symbol !== normalized.symbol)])
  }
  router.push({ name: 'asset', params: { symbol: item.symbol } })
  emit('close')
}
</script>
