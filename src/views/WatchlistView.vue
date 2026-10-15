<template>
  <div>
    <div class="flex flex-wrap items-center justify-end gap-2 mb-8">
      <span v-if="store.isReadOnly" class="text-sm text-muted-color">{{ $t('watchlistSignInHint') }}</span>
      <Button :label="$t('addSymbol')" icon="pi pi-plus" size="small" :disabled="store.isReadOnly" @click="openPicker" />
    </div>

    <Dialog
      v-model:visible="pickerVisible"
      modal
      dismissableMask
      blockScroll
      position="top"
      :showHeader="false"
      :draggable="false"
      class="w-[min(44rem,calc(100vw-2rem))]"
      :pt="{ content: { class: '!p-0' }, transition: { name: 'search-fade' } }"
    >
      <div class="flex items-center gap-3 px-4 py-3 border-b border-surface">
        <label class="flex flex-1 items-center gap-3 px-3 py-2 rounded-md border border-surface focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <i class="pi pi-search text-primary"></i>
          <input
            v-model="query"
            autofocus
            class="flex-1 bg-transparent outline-none"
            :placeholder="$t('searchPlaceholder')"
            :aria-label="$t('searchPlaceholder')"
            @input="onSearch"
          />
        </label>
        <Button icon="pi pi-times" text rounded severity="secondary" size="small" :aria-label="$t('close')"
          v-tooltip.bottom="{ value: $t('close'), showDelay: 500 }" @click="pickerVisible = false" />
      </div>
      <div class="px-4 pt-3 pb-1 text-sm text-muted-color">{{ query.trim() ? $t('searchResults') : $t('popularSymbols') }}</div>
      <div class="max-h-[60vh] overflow-y-auto pb-2">
        <div v-if="searching" class="px-4 py-6 text-center"><i class="pi pi-spin pi-spinner"></i></div>
        <div v-else-if="!options.length" class="px-4 py-6 text-center text-muted-color">{{ $t('noResults') }}</div>
        <button
          v-for="item in options"
          v-else
          :key="item.symbol"
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-emphasis disabled:cursor-wait disabled:opacity-60"
          :disabled="pending.has(item.symbol)"
          :aria-pressed="store.symbolSet.has(item.symbol)"
          @click="toggle(item)"
        >
          <i
            :class="pending.has(item.symbol) ? 'pi pi-spin pi-spinner' : store.symbolSet.has(item.symbol) ? 'pi pi-check text-primary' : 'pi pi-plus text-primary'"
            class="w-4"
          ></i>
          <div class="min-w-0 flex-1">
            <div class="truncate">
              <span class="font-semibold">{{ item.symbol }}</span>
              <span v-if="item.exchDisp" class="text-muted-color"> : {{ item.exchDisp }}</span>
            </div>
            <div class="truncate text-sm text-muted-color">{{ item.longname || item.shortname }}</div>
          </div>
          <div v-if="item.regularMarketPrice != null" class="shrink-0 text-right">
            <div class="font-semibold">{{ formatNumber(item.regularMarketPrice) }}</div>
            <div v-if="item.regularMarketChangePercent != null" :class="changeClass(item.regularMarketChangePercent)" class="text-sm">
              {{ formatSigned(item.regularMarketChangePercent) }}%
            </div>
          </div>
        </button>
      </div>
    </Dialog>

    <div class="card-table">
    <DataTable :value="store.items" :loading="store.isLoading" dataKey="symbol" tableStyle="min-width: 50rem" rowHover>
      <Column field="symbol" sortable :header="$t('symbol')">
        <template #body="{ data }">
          <RouterLink
            :to="{ name: 'asset', params: { symbol: data.symbol } }"
            class="flex items-center gap-3 p-2 rounded-md truncate hover:text-[var(--p-primary-color)]"
          >
            <div class="truncate">
              <span class="font-medium">{{ data.symbol }}</span>
              <div class="text-xs text-muted-color mt-1">{{ data.name }}</div>
            </div>
          </RouterLink>
        </template>
      </Column>
      <Column field="regularMarketPrice" sortable :header="$t('currentPrice')">
        <template #body="{ data }">
          <span class="font-medium">{{ formatNumber(data.regularMarketPrice) }}</span>
          <span v-if="data.currency" class="ml-1 text-[10px] font-semibold text-muted-color">{{ data.currency }}</span>
        </template>
      </Column>
      <Column field="regularMarketChange" sortable :header="$t('dailyChange')">
        <template #body="{ data }">
          <span :class="changeClass(data.regularMarketChange)">{{ formatSigned(data.regularMarketChange) }}</span>
        </template>
      </Column>
      <Column field="regularMarketChangePercent" sortable :header="$t('dailyChangePercent')">
        <template #body="{ data }">
          <span :class="changeClass(data.regularMarketChangePercent)">{{ formatSigned(data.regularMarketChangePercent) }}%</span>
        </template>
      </Column>
      <Column field="target_price">
        <template #header>
          <span class="inline-flex items-center gap-1">
            {{ $t('targetPrice') }}
            <i class="pi pi-info-circle text-xs text-muted-color" v-tooltip.top="$t('targetPriceHint')" tabindex="0" :aria-label="$t('targetPriceHint')"></i>
          </span>
        </template>
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <InputNumber
              v-if="editing === data.symbol"
              v-model="draft"
              :inputId="`target-${data.symbol}`"
              :minFractionDigits="0"
              :maxFractionDigits="3"
              :min="0"
              :aria-label="`${$t('targetPrice')} ${data.symbol}`"
              size="small"
              inputClass="w-28"
              @blur="onTargetBlur(data)"
              @keydown.enter="$event.target.blur()"
              @keydown.esc="editing = null; $event.target.blur()"
            />
            <template v-else>
              <span class="w-3 text-muted-color">{{ data.target_price == null ? '' : (data.alert_above ? '≥' : '≤') }}</span>
              <span class="font-medium">{{ formatNumber(data.target_price) }}</span>
            </template>
            <span v-if="data.currency && (data.target_price != null || editing === data.symbol)" class="text-[10px] font-semibold text-muted-color">{{ data.currency }}</span>
          </div>
        </template>
      </Column>
      <Column headerStyle="width: 6rem">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            text
            rounded
            severity="secondary"
            size="small"
            :disabled="store.isReadOnly"
            :aria-label="`${$t('edit')} ${$t('targetPrice')}`"
            v-tooltip.top="{ value: `${$t('edit')} ${$t('targetPrice')}`, showDelay: 500 }"
            @click="startEdit(data)"
          />
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="secondary"
            size="small"
            :disabled="store.isReadOnly"
            :aria-label="$t('removeFromWatchlist')"
            v-tooltip.top="{ value: $t('removeFromWatchlist'), showDelay: 500 }"
            @click="confirmRemove(data.symbol)"
          />
        </template>
      </Column>

      <template #empty>
        <NoData />
      </template>
    </DataTable>
    </div>
  </div>
</template>

<script setup>
import { nextTick, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import debounce from 'lodash/debounce'
import NoData from '@/components/NoData.vue'
import api from '@/utils/api'
import * as toast from '@/composables/toast'
import { useWatchlistStore } from '@/stores/watchlist'

const { t } = useI18n()
const confirm = useConfirm()
const store = useWatchlistStore()
store.fetchWatchlist() // 進頁面時刷新報價

// 新增代號對話框：空白時列熱門標的，輸入時列搜尋結果；點一下加入、再點一下移除
const pickerVisible = ref(false)
const query = ref('')
const options = ref([])
const searching = ref(false)
const pending = reactive(new Set())
let trending = null

const loadOptions = async () => {
  const q = query.value.trim()
  searching.value = true
  try {
    const data = q
      ? await api.get('/api/yahoo/symbol?query=' + encodeURIComponent(q))
      : await (trending ??= api.get('/api/yahoo/trending').catch(() => { trending = null; return [] }))
    if (q === query.value.trim()) options.value = Array.isArray(data) ? data : [] // 丟掉過期回應
  } catch {
    if (q === query.value.trim()) options.value = []
  } finally {
    searching.value = false
  }
}
const onSearch = debounce(loadOptions, 300)

const openPicker = () => {
  query.value = ''
  pickerVisible.value = true
  loadOptions()
}

const toggle = async (item) => {
  const { symbol } = item
  const added = store.symbolSet.has(symbol)
  pending.add(symbol)
  try {
    if (added) await store.removeSymbol(symbol)
    else await store.addSymbol(symbol, item.longname || item.shortname || null, item.typeDisp || item.assetType || item.quoteType || null)
    toast.success(t(added ? 'removedFromWatchlist' : 'addedToWatchlist', { symbol }))
  } catch (error) {
    toast.error(t('saveFailed'), error.message)
  } finally {
    pending.delete(symbol)
  }
}

// 一次只編輯一列：點鉛筆進編輯，blur / Enter 儲存，Esc 取消
const editing = ref(null)
const draft = ref(null)
const startEdit = async (item) => {
  draft.value = item.target_price
  editing.value = item.symbol
  await nextTick()
  document.getElementById(`target-${item.symbol}`)?.focus()
}

const formatNumber = (v) => v == null ? '--' : Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatSigned = (v) => v == null ? '--' : `${v > 0 ? '+' : ''}${formatNumber(v)}`
const changeClass = (v) => v == null ? '' : v >= 0 ? 'text-up' : 'text-down'

const onTargetBlur = async (item) => {
  if (editing.value !== item.symbol) return // Esc 取消
  await nextTick() // InputNumber 先 emit blur 才更新 v-model，等一拍才拿得到新值
  editing.value = null
  const value = draft.value ?? null
  if (value === item.target_price) return
  try {
    await store.setTarget(item.symbol, value)
  } catch (error) {
    toast.error(t('saveFailed'), error.message)
  }
}

const confirmRemove = (symbol) => {
  confirm.require({
    message: t('deleteConfirm'),
    header: t('warning'),
    icon: 'pi pi-info-circle',
    rejectProps: { label: t('cancel'), severity: 'secondary', outlined: true },
    acceptProps: { label: t('delete'), severity: 'danger' },
    accept: async () => {
      try {
        await store.removeSymbol(symbol)
        toast.success(t('deletedSuccess'))
      } catch (error) {
        toast.error(t('deleteFailed'))
      }
    },
  })
}
</script>
