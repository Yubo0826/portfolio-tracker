<template>
  <div
    class="border-2 border-dashed border-purple-400 rounded-lg p-10 text-center flex flex-col items-center justify-center cursor-pointer transition hover:bg-purple-50"
    @dragover.prevent
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
  >
    <i class="pi pi-cloud-upload text-purple-500 text-5xl mb-4"></i>
    <p class="text-xl font-semibold text-purple-600">Import your files</p>
    <p class="text-gray-500">Drag or click to upload</p>
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      @change="handleFileChange"
      accept=".csv, xlsx, .xls"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

const fileInput = ref(null)

function triggerFileInput() {
  fileInput.value.click()
}

function handleFileChange(event) {
  const file = event.target.files[0]
  if (!file) return

  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'csv') {
    readCSV(file)
  } else if (ext === 'xlsx' || ext === 'xls') {
    readExcel(file)
  } else {
    console.warn('不支援的檔案格式:', ext)
  }
}

function readCSV(file) {
  Papa.parse(file, {
    header: true, // 會自動用第一列當 key
    skipEmptyLines: true,
    complete: (results) => {
      console.log('CSV content:', results.data)
      // results.data 是陣列 [{col1: 'xx', col2: 'yy'}...]
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
    console.log('Excel content:', json)
    // json 也是 [{col1: 'xx', col2: 'yy'}...]
  }
  reader.readAsArrayBuffer(file)
}
</script>

<style scoped>
</style>
