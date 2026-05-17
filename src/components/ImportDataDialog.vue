<template>
  <Dialog v-model:visible="localVisible" modal :style="{ width: 'min(52rem, 92vw)' }">
    <template #header>
      <div class="inline-flex items-center gap-2">
        <span class="font-bold">{{ isPortfolioMode ? $t('importPortfolioDialogTitle') : $t('importTransactionDataTo') }}</span>

        <!-- 選擇投資組合 -->
        <span v-if="!isPortfolioMode" class="font-bold">
          <Select
            v-model="selectedPortfolioId"
            size="small"
            ref="PortfolioSelect"
            :options="portfolioStore.portfolios"
            optionLabel="name"
            optionValue="id"
            checkmark
            :highlightOnSelect="false"
            class="m-2 font-normal"
            :pt="{
              root: {
                style: { border: '1px solid transparent', boxShadow: 'none' },
                class: 'custom-select-root'
              }
            }"
          >
            <template #dropdownicon>
              <i class="pi pi-pencil" style="font-size: .75rem"></i>
            </template>
          </Select>
        </span>
      </div>
    </template>

    <div v-if="isPortfolioMode" class="mb-4">
      <label for="import-portfolio-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ $t('newPortfolioName') }}
        </label>
      <InputText
        id="import-portfolio-name"
        v-model.trim="portfolioName"
        class="w-full mt-2"
        :placeholder="$t('newPortfolioNamePlaceholder')"
        autocomplete="off"
      />
    </div>

    <!-- 格式說明 -->
      <div class="px-1 pt-4 pb-2 flex justify-between items-center">
        <p class="dark:text-[#a1a1a1]">
          {{ $t('importFileHint1') }}
          <button @click="downloadSampleCSV" class="py-1 text-[#5b9cf6] text-md cursor-pointer hover:underline transition">
            {{ $t('downloadSampleCSV') }}
          </button>
        </p>
      </div>
      

    <!-- 拖拉區 -->
    <div
      class="border-2 border-dashed border-[var(--p-inputtext-border-color)] rounded-lg p-8 text-center flex flex-col items-center justify-center cursor-pointer transition duration-200 hover:border-[var(--p-primary-500)]"
      @dragover.prevent
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <i class="pi pi-cloud-upload text-5xl mb-4" :style="{ color: 'var(--p-primary-500)' }"></i>
      <p class="text-xl font-semibold" :style="{ color: 'var(--p-primary-600)' }">{{ $t('uploadTransactions') }}</p>
      <p class="text-gray-500">{{ $t('dropOrClickToUpload') }}</p>
      <input ref="fileInput" type="file" class="hidden" @change="handleFileChange" accept=".csv,.xlsx,.xls" />
    </div>
    

    <!-- 預覽區 -->
    <div v-if="previewData.length" class="mt-6">
      <div class="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 class="font-semibold">{{ $t('previewData') }}：</h3>

        <Paginator
          :rows="rowsPerPage"
          :totalRecords="previewData.length"
          :first="first"
          @page="onPage"
          template=" PrevPageLink CurrentPageReport NextPageLink "
          currentPageReportTemplate="{first} to {last} of {totalRecords}"
          class="import-preview-paginator"
          :pt="previewPaginatorPt"
        />
      </div>

      <DataTable
        :value="paginatedData"
        size="small"
        scrollable
        tableStyle="min-width: 42rem"
        class="import-preview-table"
        :pt="previewTablePt"
      >
        <Column field="date" :header="$t('date')"></Column>
        <Column field="symbol" :header="$t('symbol')"></Column>
        <Column field="shares" :header="$t('shares')"></Column>
        <Column field="price" :header="$t('price')"></Column>
        <Column field="currency" :header="$t('currency')"></Column>
        <Column field="fee" :header="$t('fee')"></Column>
        <Column field="totalCost" :header="$t('totalCost')"></Column>
        <Column field="transactionType" :header="$t('type')"></Column>
      </DataTable>
    </div>

    <template #footer>
      <Button :label="$t('cancel')" severity="secondary" @click="closeDialog" />
      <Button :label="$t('import')" :disabled="!previewData.length" @click="confirmImport" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import * as toast from '@/composables/toast'
import InputText from 'primevue/inputtext'
import Papa from 'papaparse'
import api from '@/utils/api'
import * as XLSX from 'xlsx'
import Message from 'primevue/message'
import Paginator from 'primevue/paginator'
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { usePortfolioStore } from '@/stores/portfolio'
import { useTransactionsStore } from '@/stores/transactions'
import { useHoldingsStore } from '@/stores/holdings'

const store = useTransactionsStore()
const portfolioStore = usePortfolioStore()
const holdingsStore = useHoldingsStore()

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  mode: {
    type: String,
    default: 'transactions',
  },
})

const emit = defineEmits(['update:modelValue', 'import'])
const localVisible = ref(false)
watch(() => props.modelValue, v => (localVisible.value = v), { immediate: true })
watch(localVisible, v => {
  emit('update:modelValue', v)

  if (!v) {
    resetDialogState()
  }
})

const fileInput = ref(null)
const previewData = ref([])
const portfolioName = ref('')
const isPortfolioMode = computed(() => props.mode === 'portfolio')

// 改為 ID 模式
const selectedPortfolioId = ref(null)

watch(
  () => portfolioStore.currentPortfolio,
  newVal => {
    if (newVal?.id !== selectedPortfolioId.value) {
      selectedPortfolioId.value = newVal?.id || null
    }
  },
  { immediate: true }
)

// 分頁邏輯
const first = ref(0)
const rowsPerPage = ref(5)
const paginatedData = computed(() => previewData.value.slice(first.value, first.value + rowsPerPage.value))
const transparentSurfaceClass = '!bg-transparent !shadow-none'
const previewPaginatorPt = {
  root: { class: transparentSurfaceClass },
  paginatorContainer: { class: transparentSurfaceClass },
  content: { class: transparentSurfaceClass },
}
const previewTablePt = {
  root: { class: transparentSurfaceClass },
  tableContainer: { class: '!bg-transparent overflow-x-auto' },
  header: { class: '!bg-transparent' },
  bodyRow: { class: '!bg-transparent' },
  footer: { class: '!bg-transparent' },
}

function triggerFileInput() {
  fileInput.value.click()
}

function handleFileChange(event) {
  const file = event.target.files[0]
  if (file) parseFile(file)
}

function handleDrop(event) {
  const file = event.dataTransfer.files[0]
  if (file) parseFile(file)
}

function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext === 'csv') readCSV(file)
  else if (ext === 'xlsx' || ext === 'xls') readExcel(file)
  else console.warn('不支援的檔案格式:', ext)
}

function normalizeData(rows) {
  return rows.map(item => {
    const normalizedItem = Object.fromEntries(
      Object.entries(item || {}).map(([key, value]) => [String(key).toLowerCase().trim(), value])
    )

    const {
      date,
      symbol = '',
      name = '',
      assettype = '',
      shares = 0,
      price = 0,
      currency = 'USD',
      fee = 0,
      type = '',
    } = normalizedItem

    const numShares = Number(shares) || 0
    const numPrice = Number(price) || 0
    const numFee = Number(fee) || 0
    const normalizedDate = toDate(date)

    return {
      date: normalizedDate,
      symbol,
      name,
      assetType: assettype,
      shares: numShares,
      price: numPrice,
      currency: String(currency || 'USD').toUpperCase(),
      fee: numFee,
      totalCost: +(numShares * numPrice + numFee).toFixed(2),
      transactionType: type.toLowerCase() === 'buy' ? 'buy' : 'sell',
    }
  })
}

function toDate(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (regex.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day).toISOString().split('T')[0]
  }

  const d = new Date(dateStr)
  if (!isNaN(d)) return d.toISOString().split('T')[0]
  toast.error(t('InvalidDateString') + dateStr, '')
}

function readCSV(file) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.toLowerCase().trim(),
    complete: results => {
      previewData.value = normalizeData(results.data)
      console.log('Parsed CSV data:', previewData.value)
    },
    error: err => console.error('CSV 解析錯誤:', err),
  })
}

function readExcel(file) {
  const reader = new FileReader()
  reader.onload = e => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet)
    previewData.value = normalizeData(json)
  }
  reader.readAsArrayBuffer(file)
}

function downloadSampleCSV() {
  const headers = ['date', 'symbol', 'shares', 'price', 'currency', 'fee', 'type']
  const sampleData = [
    // 2024 Q1
    ['2024/01/15', '0050.TW', 230, 132, 'TWD', 20, 'buy'],
    ['2024/01/15', 'VOO', 68, 440, 'USD', 1, 'buy'],
    ['2024/01/15', 'QQQ', 47, 425, 'USD', 1, 'buy'],
    ['2024/01/15', '00830.TW', 605, 33, 'TWD', 20, 'buy'],
    // 2024 Q2
    ['2024/04/15', '0050.TW', 225, 138, 'TWD', 20, 'buy'],
    ['2024/04/15', 'VOO', 66, 470, 'USD', 1, 'buy'],
    ['2024/04/15', 'QQQ', 45, 445, 'USD', 1, 'buy'],
    ['2024/04/15', '00830.TW', 580, 35, 'TWD', 20, 'buy'],
    // 2024 Q3
    ['2024/07/15', '0050.TW', 220, 142, 'TWD', 20, 'buy'],
    ['2024/07/15', 'VOO', 64, 490, 'USD', 1, 'buy'],
    ['2024/07/15', 'QQQ', 43, 470, 'USD', 1, 'buy'],
    ['2024/07/15', '00830.TW', 560, 36, 'TWD', 20, 'buy'],
    // 2024 Q4
    ['2024/10/15', '0050.TW', 215, 146, 'TWD', 20, 'buy'],
    ['2024/10/15', 'VOO', 62, 505, 'USD', 1, 'buy'],
    ['2024/10/15', 'QQQ', 42, 485, 'USD', 1, 'buy'],
    ['2024/10/15', '00830.TW', 545, 37, 'TWD', 20, 'buy'],
    // 2025 Q1
    ['2025/01/15', '0050.TW', 210, 150, 'TWD', 20, 'buy'],
    ['2025/01/15', 'VOO', 61, 520, 'USD', 1, 'buy'],
    ['2025/01/15', 'QQQ', 41, 500, 'USD', 1, 'buy'],
    ['2025/01/15', '00830.TW', 530, 38, 'TWD', 20, 'buy'],
    // 2025 Q2
    ['2025/04/15', '0050.TW', 205, 154, 'TWD', 20, 'buy'],
    ['2025/04/15', 'VOO', 60, 535, 'USD', 1, 'buy'],
    ['2025/04/15', 'QQQ', 40, 515, 'USD', 1, 'buy'],
    ['2025/04/15', '00830.TW', 520, 39, 'TWD', 20, 'buy'],
    // 2025 Q3
    ['2025/07/15', '0050.TW', 200, 158, 'TWD', 20, 'buy'],
    ['2025/07/15', 'VOO', 59, 550, 'USD', 1, 'buy'],
    ['2025/07/15', 'QQQ', 39, 530, 'USD', 1, 'buy'],
    ['2025/07/15', '00830.TW', 510, 40, 'TWD', 20, 'buy'],
    // 2025 Q4
    ['2025/10/15', '0050.TW', 198, 162, 'TWD', 20, 'buy'],
    ['2025/10/15', 'VOO', 58, 565, 'USD', 1, 'buy'],
    ['2025/10/15', 'QQQ', 38, 545, 'USD', 1, 'buy'],
    ['2025/10/15', '00830.TW', 500, 41, 'TWD', 20, 'buy'],
    // 2026 Q1
    ['2026/01/15', '0050.TW', 195, 166, 'TWD', 20, 'buy'],
    ['2026/01/15', 'VOO', 57, 580, 'USD', 1, 'buy'],
    ['2026/01/15', 'QQQ', 37, 560, 'USD', 1, 'buy'],
    ['2026/01/15', '00830.TW', 490, 42, 'TWD', 20, 'buy'],
    // 2026 Q2
    ['2026/04/15', '0050.TW', 192, 170, 'TWD', 20, 'buy'],
    ['2026/04/15', 'VOO', 56, 595, 'USD', 1, 'buy'],
    ['2026/04/15', 'QQQ', 36, 575, 'USD', 1, 'buy'],
    ['2026/04/15', '00830.TW', 480, 43, 'TWD', 20, 'buy'],
    // 2026 Q3
    ['2026/07/15', '0050.TW', 190, 174, 'TWD', 20, 'buy'],
    ['2026/07/15', 'VOO', 55, 610, 'USD', 1, 'buy'],
    ['2026/07/15', 'QQQ', 37, 590, 'USD', 1, 'buy'],
    ['2026/07/15', '00830.TW', 470, 44, 'TWD', 20, 'buy'],
    // 2026 Q4
    ['2026/10/15', '0050.TW', 188, 178, 'TWD', 20, 'buy'],
    ['2026/10/15', 'VOO', 54, 625, 'USD', 1, 'buy'],
    ['2026/10/15', 'QQQ', 36, 605, 'USD', 1, 'buy'],
    ['2026/10/15', '00830.TW', 460, 45, 'TWD', 20, 'buy'],
  ];

  const csvRows = sampleData
  const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sample_transactions.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function resetDialogState() {
  previewData.value = []
  portfolioName.value = ''
  first.value = 0

  if (fileInput.value) fileInput.value.value = ''
}

function closeDialog() {
  localVisible.value = false
}

import { showLoading, hideLoading } from "@/composables/loading.js"

async function confirmImport() {
  showLoading()
  let targetPortfolioId = selectedPortfolioId.value
  const targetPortfolioName = portfolioName.value.trim()

  if (isPortfolioMode.value) {
    if (!targetPortfolioName) {
      toast.error(t('portfolioRequired'), '')
      hideLoading()
      return
    }

    try {
      const createdPortfolio = await portfolioStore.addPortfolio({
        name: targetPortfolioName,
        description: '',
        drift_threshold: 5,
        enable_email_alert: true,
      })

      if (!createdPortfolio?.id) {
        throw new Error(t('createPortfolioFailed'))
      }

      targetPortfolioId = createdPortfolio.id
      portfolioStore.setCurrentPortfolio(createdPortfolio)
    } catch (error) {
      toast.error(t('createPortfolioFailed'), error.message || '')
      hideLoading()
      return
    }
  } else if (!targetPortfolioId) {
    toast.error(t('pleaseSelectPortfolio'), '')
    hideLoading()
    return
  }

  const symbolList = [...new Set(previewData.value.map(trade => trade.symbol))]
  let nonexistentSymbols = []
  const symbolDetails = {}

  // 查詢每個 symbol 的詳細資訊 & 蒐集不存在的 symbol
  for (const symbol of symbolList) {
    try {
      const query = await api.get('/api/yahoo/symbol?query=' + symbol)
      if (!query || query.length === 0) {
        nonexistentSymbols.push(symbol)
        continue
      }
      const matched =
        query.find(q => q.exchange === 'NMS' && q.quoteType === 'EQUITY') ||
        query.find(q => q.quoteType === 'EQUITY') ||
        query[0]

      symbolDetails[symbol] = {
        name: matched.longname || matched.shortname || '',
        assetType: matched.quoteType || '',
      }
    } catch (err) {
      console.error('查詢 symbol 錯誤:', symbol, err)
      nonexistentSymbols.push(symbol)
    }
  }

  // 如果有不存在的 symbol，顯示錯誤並中止匯入
  if (nonexistentSymbols.length > 0) {
    toast.error(t('symbolsNotFound', { symbols: nonexistentSymbols.join(', ') }), '')
    hideLoading()
    return
  }

  previewData.value = previewData.value.map(trade => {
    const details = symbolDetails[trade.symbol]
    return details
      ? { ...trade, name: details.name, assetType: details.assetType }
      : trade
  })

  try {
    const result = await store.saveTransactionBulk(previewData.value, String(targetPortfolioId))
    console.log('Bulk import result:', result)
    if (isPortfolioMode.value) {
      toast.success(t('importPortfolioSuccess', { name: targetPortfolioName }), '')
    } else {
      toast.success(t('importSuccess'), '')
    }
    closeDialog()
  } catch (e) {
    toast.error(t('importFailed'), e.message || '')
  } finally {
    hideLoading()
  }
}

function onPage(event) {
  first.value = event.first
  rowsPerPage.value = event.rows
}
</script>

<style scoped>
.import-preview-paginator :deep(.p-paginator),
.import-preview-paginator :deep(.p-paginator-content),
.import-preview-paginator :deep(.p-paginator-current),
.import-preview-paginator :deep(.p-paginator-page),
.import-preview-paginator :deep(.p-paginator-prev),
.import-preview-paginator :deep(.p-paginator-next) {
  background: transparent !important;
  user-select: none;
}

.import-preview-table :deep(.p-datatable),
.import-preview-table :deep(.p-datatable-table-container),
.import-preview-table :deep(.p-datatable-table),
.import-preview-table :deep(.p-datatable-thead > tr > th),
.import-preview-table :deep(.p-datatable-tbody > tr),
.import-preview-table :deep(.p-datatable-tbody > tr > td) {
  background: transparent !important;
  user-select: none;
}
</style>
