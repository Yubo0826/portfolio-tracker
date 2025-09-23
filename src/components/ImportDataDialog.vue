<template>
    <Dialog v-model:visible="localVisible" modal :style="{ width: '40rem' }">
      <template #header>
        <div class="inline-flex items-center gap-2">
          <i class="pi pi-upload text-purple-500"></i>
          <span class="font-bold">匯入交易資料至</span>

          <!-- 選擇投資組合 -->
        <span class="font-bold">
          <Select 
            v-model="selectedPortfolio"
            size="small" ref="PortfolioSelect" 
            :options="portfolioStore.portfolios" optionLabel="name" checkmark 
            :highlightOnSelect="false" class="m-2 font-normal"
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
        class="border-2 border-dashed border-purple-400 rounded-lg p-10 text-center flex flex-col items-center justify-center cursor-pointer transition hover:bg-purple-50"
        @dragover.prevent
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <i class="pi pi-cloud-upload text-purple-500 text-5xl mb-4"></i>
        <p class="text-xl font-semibold text-purple-600">匯入檔案</p>
        <p class="text-gray-500">拖曳或點擊以上傳 CSV / Excel</p>
        <input ref="fileInput" type="file" class="hidden" @change="handleFileChange" accept=".csv,.xlsx,.xls" />
      </div>
    
      <!-- 格式說明 -->
      <Message severity="info" class="mt-4">
        檔案需包含以下欄位：
        <strong>date, symbol, name, shares, price, fee, type(交易類型：buy 或 sell)</strong>
        <!-- 下載範例 CSV -->
        <button
            @click="downloadSampleCSV"
            class="ml-4 px-3 py-1 border rounded bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm"
        >
            下載範例 CSV
        </button>
      </Message>
    
      <!-- 預覽區 (匯入後才顯示) -->
      <div v-if="previewData.length" class="mt-6">
        <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold">預覽資料：</h3>

            <Paginator 
                :rows="rowsPerPage"
                :totalRecords="previewData.length" 
                template=" PrevPageLink CurrentPageReport NextPageLink "
                currentPageReportTemplate="{first} - {last} ({totalRecords})"
            />
            
        </div>
        <DataTable
            :value="paginatedData" 
            size="small" 
            responsiveLayout="scroll"
        >
          <Column field="date" header="日期"></Column>
          <Column field="symbol" header="代號"></Column>
          <Column field="shares" header="股數"></Column>
          <Column field="price" header="價格"></Column>
          <Column field="fee" header="手續費"></Column>
          <Column field="totalCost" header="總和"></Column>
          <Column field="transactionType" header="類型"></Column>
        </DataTable>
      </div>
    
      <!-- Footer -->
      <template #footer>
        <Button label="取消" severity="secondary" @click="closeDialog" />
        <Button label="匯入" icon="pi pi-check" severity="success" :disabled="!previewData.length" @click="confirmImport" />
      </template>
    </Dialog>
    </template>
    
<script setup>
import { ref, watch, computed } from 'vue'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import Message from 'primevue/message'
import Paginator from 'primevue/paginator'
import { $t } from '@primeuix/themes'
import { usePortfolioStore } from '@/stores/portfolio';
import { useToast } from 'primevue/usetoast';
import { useTransactionsStore } from '@/stores/transactions';
const toast = useToast();
const store = useTransactionsStore();

const props = defineProps({
    modelValue: {
    type: Boolean,
    required: true,
    },
})

const emit = defineEmits(['update:modelValue', 'import'])

const localVisible = ref(false)
watch(
    () => props.modelValue,
    (v) => (localVisible.value = v),
    { immediate: true }
)
watch(localVisible, (v) => emit('update:modelValue', v))

const fileInput = ref(null)
const previewData = ref([])

// 選擇投資組合
const portfolioStore = usePortfolioStore();
const selectedPortfolio = ref(null);

watch(() => portfolioStore.currentPortfolio, (newVal) => {
  if (newVal?.id !== selectedPortfolio.value?.id) {
    selectedPortfolio.value = newVal
  }
})

// 分頁邏輯
const first = ref(0)          // 當前頁面起始 index
const rowsPerPage = ref(5)    // 每頁筆數

// 計算目前頁要顯示的資料
const paginatedData = computed(() => {
  return previewData.value.slice(first.value, first.value + rowsPerPage.value)
})

function triggerFileInput() {
    fileInput.value.click()
}

function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return
    parseFile(file)
}

function handleDrop(event) {
    const file = event.dataTransfer.files[0]
    if (!file) return
    parseFile(file)
}

function parseFile(file) {
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext === 'csv') {
    readCSV(file)
    } else if (ext === 'xlsx' || ext === 'xls') {
    readExcel(file)
    } else {
    console.warn('不支援的檔案格式:', ext)
    }
}

function normalizeData(rows) {
  return rows.map((item) => {
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

    // 將 shares, price, fee 強制轉數字，非數字則為 0
    const numShares = Number(shares) || 0
    const numPrice = Number(price) || 0
    const numFee = Number(fee) || 0

    // date 安全轉換
    const normalizedDate = toDate(date)

    return {
      date: normalizedDate,
      symbol,
      name,
      assetType,
      shares: numShares,
      price: numPrice,
      fee: numFee,
      totalCost: +(numShares * numPrice + numFee).toFixed(2),
      transactionType: type.toLowerCase() === 'buy' ? 'buy' : 'sell', // 強制轉小寫，非 buy 則為 sell
    }
  })
}


function toDate(dateStr) {
  // 正規表示式檢查 YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  if (regex.test(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    // new Date(year, monthIndex, day) 會依本地時間建立，避免 UTC 偏移
    const result = new Date(year, month - 1, day);
    return result.toISOString().split('T')[0];
  }

  // 其他格式交給 Date 物件自己解析
  const d = new Date(dateStr);
  if (!isNaN(d)) {
    return d.toISOString().split('T')[0];
  }

    // throw new Error("Invalid date string: " + dateStr);
  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: $t('InvalidDateString') + dateStr,
    life: 3000
  });
}


function readCSV(file) {
    Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.toLowerCase().trim(), // 自動轉小寫
    complete: (results) => {
        console.log('CSV content:', results.data)
        previewData.value = normalizeData(results.data)
        console.log('Normalized data:', previewData.value)
    },
    error: (err) => {
        console.error('CSV 解析錯誤:', err)
    },
    })
}

function readExcel(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json(sheet)
    previewData.value = normalizeData(json)
    }
    reader.readAsArrayBuffer(file)
}

function downloadSampleCSV() {
  const headers = ['date', 'symbol', 'shares', 'price', 'fee', 'type']
  const sampleData = [
    ['2025/09/20', 'AAPL', 10, 180, 1, 'buy'],
    ['2025/01/21', 'TSLA', 5, 120, 0.5, 'buy'],
    ['2025/02/21', 'TSLA', 15, 135, 0.5, 'buy'],
  ]

  // 將 headers + data 轉成 CSV 字串
  const csvContent = [
    headers.join(','),
    ...sampleData.map((row) => row.join(',')),
  ].join('\n')

  // 生成 blob 並下載
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
    const result = await store.saveTransactionBulk(previewData.value, selectedPortfolio.value.id);
    console.log('Bulk import result:', result);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: $t('importSuccess'),
      life: 3000,
    });
    closeDialog()

}
</script>
    