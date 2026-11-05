<!-- 投資組合選取視窗：外觀與操作沿用搜尋視窗（SearchBox）——頂部浮層、搜尋列、分組清單、上下鍵移動 -->
<template>
  <Dialog
    v-model:visible="visible"
    modal
    dismissableMask
    blockScroll
    position="top"
    :showHeader="false"
    :draggable="false"
    class="w-[min(36rem,calc(100vw-2rem))] !rounded-3xl !border-0 shadow-2xl dark:!bg-surface-800"
    :pt="{ content: { class: '!p-0' }, transition: { name: 'search-fade' } }"
  >
    <div @keydown.down.prevent="moveFocus(1)" @keydown.up.prevent="moveFocus(-1)">
      <div class="flex items-center gap-3 px-4 py-3 border-b border-surface">
        <label class="flex flex-1 items-center gap-3 px-3 py-2">
          <i class="pi pi-briefcase text-primary"></i>
          <input
            ref="inputEl"
            v-model="query"
            autofocus
            class="flex-1 bg-transparent text-base outline-none"
            :placeholder="t('searchPortfolio')"
            :aria-label="t('searchPortfolio')"
            @keydown.enter="groups[0]?.items[0] && select(groups[0].items[0])"
          />
        </label>
        <Button icon="pi pi-times" text rounded severity="secondary" size="small" :aria-label="t('close')"
          v-tooltip.bottom="{ value: t('close'), showDelay: 500 }" @click="visible = false" />
      </div>

      <div ref="listEl" class="max-h-[60vh] overflow-y-auto pb-2">
        <div v-if="!groups.length" class="px-4 py-6 text-center text-muted-color">{{ t('noResults') }}</div>
        <template v-for="(g, i) in groups" v-else :key="g.key">
          <div :class="{ 'mt-2 border-t border-surface': i }" class="px-4 pt-3 pb-1 text-xs text-muted-color">{{ g.label }}</div>
          <button
            v-for="p in g.items"
            :key="p.id"
            type="button"
            data-option
            class="flex w-full items-center gap-3 px-4 py-2 text-left cursor-pointer outline-none hover:bg-emphasis focus-visible:bg-emphasis"
            :aria-current="p.id === currentId || undefined"
            @click="select(p)"
          >
            <div class="min-w-0 flex-1">
              <div class="truncate text-base font-semibold">{{ p.name }}</div>
              <div v-if="p.description" class="truncate text-xs text-muted-color">{{ p.description }}</div>
            </div>
            <span v-if="p.holdings" class="shrink-0 text-xs text-muted-color">{{ t('holdingsCount') }} {{ p.holdings.length }}</span>
            <i class="pi pi-check w-4 shrink-0 text-primary" :class="{ invisible: p.id !== currentId }" aria-hidden="true"></i>
          </button>
        </template>
      </div>

      <div v-if="!auth.isDemo" class="flex flex-wrap items-center gap-1 border-t border-surface px-3 py-2">
        <Button :label="t('createNewPortfolio')" icon="pi pi-plus" text size="small" @click="close(() => emit('create'))" />
        <Button :label="t('importPortfolio')" icon="pi pi-upload" text size="small" severity="secondary" @click="close(() => emit('import'))" />
        <Button :label="t('managePortfolio')" icon="pi pi-cog" text size="small" severity="secondary" class="ml-auto" @click="close(() => router.push('/portfolios'))" />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAuthStore } from '@/stores/auth'
import * as toast from '@/composables/toast'

const props = defineProps({
  recentIds: { type: Array, default: () => [] },
})
const emit = defineEmits(['create', 'import'])
const visible = defineModel('visible', { type: Boolean, default: false })

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const portfolioStore = usePortfolioStore()

const query = ref('')
const inputEl = ref(null)
const listEl = ref(null)
const currentId = computed(() => portfolioStore.currentPortfolio?.id)

watch(visible, (v) => { if (v) query.value = '' })

// 沒輸入時分「最近使用」與「其他」兩組；有輸入時搜尋全部（比對名稱與描述）
const groups = computed(() => {
  const all = portfolioStore.portfolios
  const q = query.value.trim().toLowerCase()
  if (q) {
    const hits = all.filter((p) => `${p.name} ${p.description || ''}`.toLowerCase().includes(q))
    return hits.length ? [{ key: 'results', label: t('all'), items: hits }] : []
  }
  const recent = props.recentIds.map((id) => all.find((p) => p.id === id)).filter(Boolean)
  const others = all.filter((p) => !recent.includes(p))
  return [
    { key: 'recent', label: t('recentlyUsed'), items: recent },
    { key: 'all', label: t('all'), items: others },
  ].filter((g) => g.items.length)
})

// 上下鍵在輸入框與選項之間移動焦點（同 SearchBox）
function moveFocus(step) {
  const options = [...(listEl.value?.querySelectorAll('[data-option]') ?? [])]
  const next = options.indexOf(document.activeElement) + step
  if (next < 0) inputEl.value?.focus()
  else options[Math.min(next, options.length - 1)]?.focus()
}

const close = (after) => {
  visible.value = false
  after()
}

const select = (p) => {
  visible.value = false
  if (p.id === currentId.value) return
  portfolioStore.setCurrentPortfolio(p)
  toast.success(t('portfolioSwitchedTo', { name: p.name }))
}
</script>
