<template>
  <Dialog v-model:visible="localVisible" modal :style="{ width: '40rem' }">
    <template #header>
      <div class="inline-flex items-center gap-2">
        <i class="pi pi-upload text-[var(--p-primary-500)]"></i>
        <span class="font-bold">{{ $t('importTransactionDataTo') }}</span>

        <!-- 選擇投資組合 -->
        <span class="font-bold">
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

    <!-- 拖拉區 -->
    <div
      class="border-2 border-dashed rounded-lg p-10 text-center flex flex-col items-center justify-center cursor-pointer transition hover:bg-[var(--p-primary-50)]"
      :style="{ borderColor: 'var(--p-primary-400)' }"
      @dragover.prevent
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <i class="pi pi-cloud-upload text-5xl mb-4" :style="{ color: 'var(--p-primary-500)' }"></i>
      <p class="text-xl font-semibold" :style="{ color: 'var(--p-primary-600)' }">{{ $t('ImportFile') }}</p>
      <p class="text-gray-500">{{ $t('dropOrClickToUpload') }}</p>
      <input ref="fileInput" type="file" class="hidden" @change="handleFileChange" accept=".csv,.xlsx,.xls" />
    </div>
    

    <!-- 格式說明 -->
    <Message severity="info" class="mt-4">
      <div class="flex justify-between text-sm">
        <span>
          <!-- 檔案需包含以下欄位：date, symbol, name, shares, price, fee, type(交易類型：buy 或 sell) -->
          {{ $t('importFileHint1') }}
        </span>
        <button
          @click="downloadSampleCSV"
          class="ml-4 px-3 py-1 border rounded border-[var(--p-primary-400)] bg-[var(--p-primary-100)] hover:bg-[var(--p-primary-200)] text-[var(--p-primary-700)] text-sm"
        >
          {{ $t('downloadSampleCSV') }}
        </button>
      </div>
    </Message>

    <!-- 預覽區 -->
    <div v-if="previewData.length" class="mt-6">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold">{{ $t('previewData') }}：</h3>

        <Paginator
          :rows="rowsPerPage"
          :totalRecords="previewData.length"
          :first="first"
          @page="onPage"
          template=" PrevPageLink CurrentPageReport NextPageLink "
          currentPageReportTemplate="{first} to {last} of {totalRecords}"
        />
      </div>

      <DataTable :value="paginatedData" size="small" responsiveLayout="scroll">
        <Column field="date" :header="$t('date')"></Column>
        <Column field="symbol" :header="$t('symbol')"></Column>
        <Column field="shares" :header="$t('shares')"></Column>
        <Column field="price" :header="$t('price')"></Column>
        <Column field="fee" :header="$t('fee')"></Column>
        <Column field="totalCost" :header="$t('totalCost')"></Column>
        <Column field="transactionType" :header="$t('type')"></Column>
      </DataTable>
    </div>

    <template #footer>
      <Button :label="$t('cancel')" severity="secondary" @click="closeDialog" />
      <Button :label="$t('import')" icon="pi pi-check" severity="success" :disabled="!previewData.length" @click="confirmImport" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import * as toast from '@/composables/toast'
import Papa from 'papaparse'
import api from '@/utils/api'
import * as XLSX from 'xlsx'
import Message from 'primevue/message'
import Paginator from 'primevue/paginator'
import { useI18n } from 'vue-i18n';
import { usePortfolioStore } from '@/stores/portfolio'
import { useTransactionsStore } from '@/stores/transactions'
import { useHoldingsStore } from '@/stores/holdings'
import { showLoading, hideLoading } from "@/composables/loading"

const { t } = useI18n();
const store = useTransactionsStore()
const portfolioStore = usePortfolioStore()
const holdingsStore = useHoldingsStore()

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'import'): void;
}>()

const localVisible = ref(false)
watch(() => props.modelValue, v => (localVisible.value = v), { immediate: true })
watch(localVisible, v => emit('update:modelValue', v))

const fileInput = ref<HTMLInputElement | null>(null)

interface PreviewItem {
  date: string;
  symbol: string;
  name: string;
  assetType: string;
  shares: number;
  price: number;
  fee: number;
  totalCost: number;
  transactionType: 'buy' | 'sell';
}

const previewData = ref<PreviewItem[]>([])

// 改為 ID 模式
const selectedPortfolioId = ref<string | null>(null)

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

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0]
  if (file) parseFile(file)
}

function handleDrop(event: DragEvent) {
  const file = event.dataTransfer?.files[0]
  if (file) parseFile(file)
}

function parseFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'csv') readCSV(file)
  else if (ext === 'xlsx' || ext === 'xls') readExcel(file)
  else console.warn('不支援的檔案格式:', ext)
}

function normalizeData(rows: any[]): PreviewItem[] {
  return rows.map(item => {
    const {
      date,
      symbol = '',
      name = '',
      assetType = '',
      shares = 0,
      price = 0,
      fee = 0,
      type = '',
    } = item

    const numShares = Number(shares) || 0
    const numPrice = Number(price) || 0
    const numFee = Number(fee) || 0
    const normalizedDate = toDate(date) || new Date().toISOString().split('T')[0]

    return {
      date: normalizedDate,
      symbol,
      name,
      assetType,
      shares: numShares,
      price: numPrice,
      fee: numFee,
      totalCost: +(numShares * numPrice + numFee).toFixed(2),
      transactionType: type.toLowerCase() === 'buy' ? 'buy' : 'sell',
    }
  })
}

function toDate(dateStr: string) {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (regex.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day).toISOString().split('T')[0]
  }

  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  toast.error(t('InvalidDateString') + dateStr, '')
  return null
}

function readCSV(file: File) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.toLowerCase().trim(),
    complete: (results: any) => {
      previewData.value = normalizeData(results.data)
      console.log('Parsed CSV data:', previewData.value)
    },
    error: (err: any) => console.error('CSV 解析錯誤:', err),
  })
}

function readExcel(file: File) {
  const reader = new FileReader()
  reader.onload = e => {
    const data = new Uint8Array(e.target?.result as ArrayBuffer)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet)
    previewData.value = normalizeData(json)
  }
  reader.readAsArrayBuffer(file)
}

function downloadSampleCSV() {
  const headers = ['date', 'symbol', 'shares', 'price', 'fee', 'type']
  const sampleData = [
    ['2025/01/03', 'VOO', 5, 420, 1, 'buy'],
    ['2025/01/08', 'QQQ', 8, 390, 1, 'buy'],
    ['2025/01/15', 'SCHD', 10, 75, 0.5, 'buy'],
    ['2025/01/20', 'VTI', 6, 250, 1, 'buy'],
    ['2025/01/25', 'IWM', 5, 195, 0.5, 'buy'],
    ['2025/02/02', 'XLV', 4, 145, 0.5, 'buy'],
    ['2025/02/06', 'VNQ', 6, 90, 0.5, 'buy'],
    ['2025/02/12', 'QQQ', 4, 405, 0.5, 'sell'],
    ['2025/02/15', 'VOO', 3, 440, 0.5, 'sell'],
    ['2025/02/20', 'SCHD', 5, 78, 0.3, 'buy'],
    ['2025/03/01', 'VTI', 3, 260, 0.5, 'buy'],
    ['2025/03/06', 'IWM', 5, 205, 0.5, 'buy'],
    ['2025/03/10', 'XLV', 3, 150, 0.3, 'buy'],
    ['2025/03/20', 'VNQ', 4, 88, 0.3, 'buy'],
    ['2025/03/25', 'QQQ', 2, 420, 0.5, 'buy'],
    ['2025/03/30', 'SCHD', 5, 80, 0.3, 'buy'],
    ['2025/04/02', 'VTI', 6, 255, 1, 'buy'],
    ['2025/04/10', 'VOO', 4, 445, 1, 'buy'],
    ['2025/04/15', 'QQQ', 5, 430, 1, 'buy'],
    ['2025/04/20', 'IWM', 3, 210, 0.5, 'sell'],
    ['2025/04/25', 'VNQ', 5, 85, 0.5, 'buy'],
    ['2025/05/01', 'XLV', 4, 148, 0.5, 'buy'],
    ['2025/05/05', 'SCHD', 5, 82, 0.3, 'sell'],
    ['2025/05/10', 'VTI', 4, 265, 0.5, 'buy'],
    ['2025/05/15', 'VOO', 5, 460, 1, 'buy'],
    ['2025/05/20', 'QQQ', 4, 440, 0.5, 'sell'],
    ['2025/05/25', 'IWM', 5, 215, 0.5, 'buy'],
    ['2025/06/02', 'XLV', 6, 152, 0.5, 'buy'],
    ['2025/06/10', 'VNQ', 5, 92, 0.3, 'buy'],
    ['2025/06/15', 'SCHD', 8, 83, 0.5, 'buy'],
    ['2025/06/20', 'VTI', 5, 270, 0.5, 'sell'],
    ['2025/06/25', 'VOO', 3, 465, 0.5, 'buy'],
    ['2025/07/01', 'QQQ', 6, 445, 1, 'buy'],
    ['2025/07/05', 'IWM', 4, 218, 0.3, 'buy'],
    ['2025/07/10', 'XLV', 3, 149, 0.3, 'sell'],
    ['2025/07/15', 'VNQ', 4, 94, 0.3, 'buy'],
    ['2025/07/20', 'SCHD', 5, 85, 0.3, 'buy'],
    ['2025/07/25', 'VTI', 5, 275, 0.5, 'buy'],
    ['2025/08/02', 'VOO', 4, 470, 0.5, 'buy'],
    ['2025/08/08', 'QQQ', 5, 450, 0.5, 'sell'],
    ['2025/08/15', 'IWM', 6, 220, 0.5, 'buy'],
    ['2025/08/20', 'XLV', 5, 155, 0.5, 'buy'],
    ['2025/08/25', 'VNQ', 6, 95, 0.5, 'buy'],
    ['2025/09/02', 'SCHD', 5, 86, 0.3, 'sell'],
    ['2025/09/08', 'VTI', 4, 280, 0.5, 'buy'],
    ['2025/09/15', 'VOO', 3, 480, 0.5, 'buy'],
    ['2025/09/20', 'QQQ', 5, 455, 0.5, 'buy'],
    ['2025/10/05', 'IWM', 4, 225, 0.5, 'buy'],
    ['2025/10/12', 'XLV', 3, 160, 0.3, 'buy'],
    ['2025/10/20', 'VNQ', 5, 97, 0.5, 'sell'],
  ];

  const csvContent = [headers.join(','), ...sampleData.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sample_transactions.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function closeDialog() {
  localVisible.value = false
  previewData.value = []
}

async function confirmImport() {
  if (!selectedPortfolioId.value) {
    toast.error(t('pleaseSelectPortfolio'), '')
    return
  }

  showLoading()
  const symbolList = [...new Set(previewData.value.map(trade => trade.symbol))]
  let nonexistentSymbols: string[] = []
  const symbolDetails: Record<string, { name: string; assetType: string }> = {}

  // 查詢每個 symbol 的詳細資訊 & 蒐集不存在的 symbol
  for (const symbol of symbolList) {
    try {
      const query: any = await api.get('/api/yahoo/symbol?query=' + symbol)
      if (!query || query.length === 0) {
        nonexistentSymbols.push(symbol)
        continue
      }
      const matched =
        query.find((q: any) => q.exchange === 'NMS' && q.quoteType === 'EQUITY') ||
        query.find((q: any) => q.quoteType === 'EQUITY') ||
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
    toast.error(t('symbolsNotFound'), nonexistentSymbols.join(', '))
    return
  }

  previewData.value = previewData.value.map(trade => {
    const details = symbolDetails[trade.symbol]
    return details
      ? { ...trade, name: details.name, assetType: details.assetType }
      : trade
  })

  try {
    const result = await store.saveTransactionBulk(previewData.value, selectedPortfolioId.value)
    console.log('Bulk import result:', result)
    toast.success(t('importSuccess'), '')
    closeDialog()
  } catch (e: any) {
    toast.error(t('importFailed'), e.message || '')
  } finally {
    hideLoading()
  }
}

function onPage(event: any) {
  first.value = event.first
  rowsPerPage.value = event.rows
}
</script>
