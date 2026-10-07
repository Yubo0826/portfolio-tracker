<template>
  <div>
    <div class="flex flex-wrap items-center gap-2 mb-8">
      <div class="w-72">
        <SymbolAutoComplete v-model="newSymbol" :disabled="store.isReadOnly" @update="picked = $event" />
      </div>
      <Button
        :label="$t('addToWatchlist')"
        icon="pi pi-plus"
        size="small"
        :disabled="store.isReadOnly || !picked"
        :loading="adding"
        @click="onAdd"
      />
      <span v-if="store.isReadOnly" class="text-sm text-muted-color">{{ $t('watchlistSignInHint') }}</span>
    </div>

    <DataTable :value="store.items" :loading="store.isLoading" dataKey="symbol" tableStyle="min-width: 50rem" rowHover>
      <Column field="symbol" sortable :header="$t('symbol')">
        <template #body="{ data }">
          <RouterLink
            :to="{ name: 'asset', params: { symbol: data.symbol } }"
            class="flex items-center gap-3 p-2 rounded-md truncate hover:text-[var(--p-primary-color)]"
          >
            <StockIcon :symbol="data.symbol" class="!m-0 shrink-0" />
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
            <span class="w-3 text-muted-color">{{ data.target_price == null ? '' : (data.alert_above ? '≥' : '≤') }}</span>
            <InputNumber
              v-model="drafts[data.symbol]"
              :minFractionDigits="0"
              :maxFractionDigits="3"
              :min="0"
              :disabled="store.isReadOnly"
              :aria-label="`${$t('targetPrice')} ${data.symbol}`"
              size="small"
              inputClass="w-28"
              @blur="onTargetBlur(data)"
              @keydown.enter="$event.target.blur()"
            />
          </div>
        </template>
      </Column>
      <Column headerStyle="width: 4rem">
        <template #body="{ data }">
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
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import NoData from '@/components/NoData.vue'
import StockIcon from '@/components/StockIcon.vue'
import SymbolAutoComplete from '@/components/SymbolAutoComplete.vue'
import * as toast from '@/composables/toast'
import { useWatchlistStore } from '@/stores/watchlist'

const { t } = useI18n()
const confirm = useConfirm()
const store = useWatchlistStore()
store.fetchWatchlist() // 進頁面時刷新報價

const newSymbol = ref('')
const picked = ref(null)
const adding = ref(false)

// 目標價輸入框的草稿值，blur 時跟 store 比對有變才存
const drafts = reactive({})
watch(() => store.items, (items) => {
  items.forEach(i => { drafts[i.symbol] = i.target_price })
}, { immediate: true })

const formatNumber = (v) => v == null ? '--' : Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatSigned = (v) => v == null ? '--' : `${v > 0 ? '+' : ''}${formatNumber(v)}`
const changeClass = (v) => v == null ? '' : v >= 0 ? 'text-emerald-600' : 'text-rose-600'

const onAdd = async () => {
  adding.value = true
  try {
    await store.addSymbol(picked.value.symbol, picked.value.name, picked.value.assetType)
    toast.success(t('addedToWatchlist', { symbol: picked.value.symbol }))
    newSymbol.value = ''
    picked.value = null
  } catch (error) {
    toast.error(t('saveFailed'), error.message)
  } finally {
    adding.value = false
  }
}

const onTargetBlur = async (item) => {
  const value = drafts[item.symbol] ?? null
  if (value === item.target_price) return
  try {
    await store.setTarget(item.symbol, value)
  } catch (error) {
    drafts[item.symbol] = item.target_price
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
