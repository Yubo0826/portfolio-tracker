<template>
  <img
    v-if="!showFallback"
    :src="imageSrc"
    :alt="`${symbolText} logo`"
    loading="lazy"
    decoding="async"
    @error="handleImageError"
    class="w-8 h-8 mr-2 rounded-full object-cover"
  />

  <div
    v-else
    class="w-8 h-8 mr-2 rounded-full bg-[#d8dde7] text-slate-700 flex items-center justify-center text-sm font-semibold leading-none"
    :title="symbolText"
  >
    {{ fallbackText }}
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  symbol: {
    type: String,
    default: '',
  },
})

// Tried in order; on load error we advance to the next source before giving up.
const LOGO_SOURCES = [
  (symbol) => `https://storage.googleapis.com/iex/api/logos/${symbol}.png`,
  (symbol) => `https://financialmodelingprep.com/image-stock/${symbol}.png`,
]

const showFallback = ref(false)
const sourceIndex = ref(0)

const symbolText = computed(() => (props.symbol || '').toUpperCase())

const fallbackText = computed(() => {
  const cleaned = symbolText.value.replace(/[^A-Z0-9]/g, '')
  if (!cleaned) return '--'
  return cleaned.slice(0, 2)
})

const imageSrc = computed(() => LOGO_SOURCES[sourceIndex.value]?.(props.symbol) ?? '')

const resetSource = () => {
  sourceIndex.value = 0
  showFallback.value = false
}

const handleImageError = () => {
  if (sourceIndex.value < LOGO_SOURCES.length - 1) {
    sourceIndex.value += 1
  } else {
    showFallback.value = true
  }
}

watch(() => props.symbol, resetSource, { immediate: true })
</script>