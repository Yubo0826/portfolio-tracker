<!-- 投資組合下拉選單（頂欄投資組合按鈕）：Popover 掛在按鈕下方，標題＋搜尋框＋清單，上下鍵移動；外部用 ref.toggle(event) 開關 -->
<template>
  <Popover ref="popover" :pt="{ root: { class: '!rounded-xl' }, content: { class: '!p-0' } }" @show="onShow" @hide="emit('hide')">
    <div class="w-80 max-w-[calc(100vw-2rem)]" @keydown.down.prevent="moveFocus(1)" @keydown.up.prevent="moveFocus(-1)">
      <div class="px-4 pt-4 pb-2.5">
        <div class="mb-2.5 text-base font-semibold">{{ t('switchPortfolio') }}</div>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText
            ref="inputEl"
            v-model="query"
            size="small"
            fluid
            :placeholder="t('searchPortfolio')"
            :aria-label="t('searchPortfolio')"
            @keydown.enter="items[0] && select(items[0])"
          />
        </IconField>
      </div>

      <div ref="listEl" class="max-h-[60vh] overflow-y-auto px-2 pb-2">
        <div v-if="!items.length" class="px-3 py-4 text-center text-sm text-muted-color">{{ t('noResults') }}</div>
        <button
          v-for="p in items"
          :key="p.id"
          type="button"
          data-option
          class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[0.9375rem] font-normal text-[color-mix(in_srgb,var(--p-text-color)_82%,transparent)] cursor-pointer outline-none hover:bg-emphasis hover:text-color focus-visible:bg-emphasis"
          :class="{ 'bg-emphasis': p.id === currentId }"
          :aria-current="p.id === currentId || undefined"
          @click="select(p)"
        >
          <i class="pi pi-check w-4 shrink-0 text-sm" :class="{ invisible: p.id !== currentId }" aria-hidden="true"></i>
          <i class="pi pi-briefcase shrink-0 text-sm text-muted-color" aria-hidden="true"></i>
          <span class="min-w-0 flex-1 truncate">{{ p.name }}</span>
          <span v-if="p.holdings" class="shrink-0 text-sm text-muted-color">{{ p.holdings.length }}</span>
        </button>
      </div>

      <div v-if="!auth.isDemo" class="mx-3 flex flex-col border-t border-surface py-2"><!-- 分隔線左右內縮，同使用者選單 -->
        <button v-for="a in actions" :key="a.label" type="button"
          class="flex items-center gap-2.5 -mx-1 rounded-lg px-3 py-2.5 text-left text-[0.9375rem] font-normal text-muted-color cursor-pointer outline-none hover:bg-emphasis hover:text-color focus-visible:bg-emphasis"
          @click="close(a.run)">
          <i :class="a.icon" class="w-4 shrink-0 text-sm" aria-hidden="true"></i>{{ a.label }}
        </button>
      </div>
    </div>
  </Popover>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Popover from 'primevue/popover'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAuthStore } from '@/stores/auth'
import * as toast from '@/composables/toast'

const props = defineProps({
  recentIds: { type: Array, default: () => [] },
})
const emit = defineEmits(['create', 'import', 'show', 'hide'])

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const portfolioStore = usePortfolioStore()

const popover = ref(null)
const query = ref('')
const inputEl = ref(null)
const listEl = ref(null)
const currentId = computed(() => portfolioStore.currentPortfolio?.id)

defineExpose({ toggle: (event) => popover.value?.toggle(event) })

function onShow() {
  query.value = ''
  inputEl.value?.$el?.focus()
  emit('show')
}

// 沒輸入時最近使用排前面；有輸入時比對名稱與描述
const items = computed(() => {
  const all = portfolioStore.portfolios
  const q = query.value.trim().toLowerCase()
  if (q) return all.filter((p) => `${p.name} ${p.description || ''}`.toLowerCase().includes(q))
  const recent = props.recentIds.map((id) => all.find((p) => p.id === id)).filter(Boolean)
  return [...recent, ...all.filter((p) => !recent.includes(p))]
})

const actions = computed(() => [
  { label: t('createNewPortfolio'), icon: 'pi pi-plus', run: () => emit('create') },
  { label: t('importPortfolio'), icon: 'pi pi-upload', run: () => emit('import') },
  { label: t('managePortfolio'), icon: 'pi pi-cog', run: () => router.push('/portfolios') },
])

// 上下鍵在輸入框與選項之間移動焦點
function moveFocus(step) {
  const options = [...(listEl.value?.querySelectorAll('[data-option]') ?? [])]
  const next = options.indexOf(document.activeElement) + step
  if (next < 0) inputEl.value?.$el?.focus()
  else options[Math.min(next, options.length - 1)]?.focus()
}

const close = (after) => {
  popover.value?.hide()
  after()
}

const select = (p) => {
  popover.value?.hide()
  if (p.id === currentId.value) return
  portfolioStore.setCurrentPortfolio(p)
  toast.success(t('portfolioSwitchedTo', { name: p.name }))
}
</script>
