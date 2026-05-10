<template>
  <div class="relative w-full">
    <div class="search-shell">
      <i class="pi pi-search text-xs text-neutral-400 shrink-0"></i>
      <input
        ref="inputEl"
        v-model="query"
        @keydown="onKeydown"
        @input="onInput"
        type="text"
        :placeholder="$t('searchPlaceholder')"
        class="flex-1 min-w-0 bg-transparent text-sm outline-none
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
             border border-[var(--p-content-border-color)]
             bg-[var(--p-surface-0)] dark:bg-[var(--p-surface-900)]
             overflow-hidden"
    >
      <div class="max-h-80 overflow-auto">
        <div
          v-if="results.length"
          class="px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-neutral-500"
        >
          {{ t('searchResults') }}
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
            <div class="flex flex-col py-1">
              <span class="search-item-symbol text-sm font-semibold">{{ item.symbol }}</span>
              <span class="search-item-name text-xs">
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
import { ref, nextTick } from 'vue'
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
    results.value = []
    return
  }

  loading.value = true
  try {
    const data = await api.get('/api/yahoo/symbol?query=' + q)
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

function setActive(idx) {
  activeIndex.value = idx
}

function select(idx) {
  const item = results.value[idx]
  if (!item) return
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
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 90%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--p-form-field-background) 94%, transparent);
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
  border-radius: 999px;
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

.dark .search-shell {
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.dark .search-shortcut-indicator {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}


.search-item-symbol {
  color: var(--p-text-color);
}

.search-item-name {
  color: var(--p-text-muted-color);
}
</style>
