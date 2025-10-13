<template>
  <div class="app">
    <h1>Walkthrough 功能教學範例</h1>

    <div class="demo-section">
      <button id="btn-start">開始</button>
      <input id="input-search" placeholder="搜尋..." />
      <button id="btn-submit">提交</button>
    </div>

    <!-- 教學導覽 -->
    <div v-if="currentStep < steps.length" class="overlay">
      <div class="highlight" :style="highlightStyle"></div>
      <div class="tooltip" :style="tooltipStyle">
        <h3>{{ steps[currentStep].title }}</h3>
        <p>{{ steps[currentStep].content }}</p>
        <div class="buttons">
          <button @click="prevStep" :disabled="currentStep === 0">上一步</button>
          <button @click="nextStep">
            {{ currentStep === steps.length - 1 ? '完成' : '下一步' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const steps = ref([
  { selector: '#btn-start', title: '開始按鈕', content: '這是啟動功能的按鈕。' },
  { selector: '#input-search', title: '搜尋欄位', content: '可輸入關鍵字進行搜尋。' },
  { selector: '#btn-submit', title: '提交按鈕', content: '點擊以送出你的輸入內容。' }
])

const currentStep = ref(0)

const highlightStyle = computed(() => {
  const el = document.querySelector(steps.value[currentStep.value].selector)
  if (!el) return {}
  const rect = el.getBoundingClientRect()
  return {
    top: `${rect.top - 5}px`,
    left: `${rect.left - 5}px`,
    width: `${rect.width + 10}px`,
    height: `${rect.height + 10}px`
  }
})

const tooltipStyle = computed(() => {
  const el = document.querySelector(steps.value[currentStep.value].selector)
  if (!el) return {}
  const rect = el.getBoundingClientRect()
  return {
    top: `${rect.bottom + 10}px`,
    left: `${rect.left}px`
  }
})

function nextStep() {
  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++
  } else {
    currentStep.value = steps.value.length
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

onMounted(() => {
  window.scrollTo(0, 0)
})
</script>

<style scoped>
.app {
  padding: 40px;
  font-family: "Segoe UI", sans-serif;
}

.demo-section {
  margin-top: 20px;
}

button, input {
  margin: 10px;
  padding: 8px 14px;
  font-size: 16px;
}

/* Walkthrough Overlay */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
}

.highlight {
  position: absolute;
  border: 2px solid #42b983;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.tooltip {
  position: absolute;
  background: #fff;
  color: #333;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.2);
  width: 250px;
  z-index: 10000;
}

.tooltip h3 {
  margin-top: 0;
  font-size: 18px;
  color: #42b983;
}

.buttons {
  margin-top: 10px;
  text-align: right;
}

button {
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.buttons button {
  margin-left: 8px;
  background: #42b983;
  color: white;
  padding: 6px 12px;
}

.buttons button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
