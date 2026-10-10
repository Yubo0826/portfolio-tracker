<template>
  <img
    v-if="imageSrc"
    :src="imageSrc"
    :alt="`${symbolText} logo`"
    decoding="async"
    @error="handleImageError"
    class="w-8 h-8 mr-2 rounded-full object-cover"
  />

  <div
    v-else
    class="w-8 h-8 mr-2 rounded-full bg-emphasis text-muted-color flex items-center justify-center text-sm font-semibold leading-none"
    :title="symbolText"
  >
    <span v-if="resolved">{{ fallbackText }}</span>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  LOGO_SOURCES,
  NOT_FOUND,
  getCachedSourceIndex,
  resolveStockLogo,
} from '@/utils/stockLogo'

const props = defineProps({
  symbol: {
    type: String,
    default: '',
  },
})

const sourceIndex = ref(NOT_FOUND)
// False only while we are probing a symbol we have never seen; keeps the
// placeholder blank instead of flashing initials before the logo lands.
const resolved = ref(true)

const symbolText = computed(() => (props.symbol || '').toUpperCase())

const fallbackText = computed(() => {
  const cleaned = symbolText.value.replace(/[^A-Z0-9]/g, '')
  if (!cleaned) return '--'
  return cleaned.slice(0, 2)
})

const imageSrc = computed(() => {
  if (sourceIndex.value === NOT_FOUND || !symbolText.value) return ''
  return LOGO_SOURCES[sourceIndex.value](symbolText.value)
})

// The <img> can still fail even for a cached hit (expired CDN entry): fall
// through to the remaining sources and let the cache be rewritten.
const handleImageError = () => {
  if (sourceIndex.value < LOGO_SOURCES.length - 1) {
    sourceIndex.value += 1
  } else {
    sourceIndex.value = NOT_FOUND
  }
}

watch(
  () => props.symbol,
  async (symbol) => {
    const cached = getCachedSourceIndex(symbol)
    if (cached !== undefined) {
      sourceIndex.value = cached
      resolved.value = true
      return
    }

    sourceIndex.value = NOT_FOUND
    resolved.value = false
    const index = await resolveStockLogo(symbol)
    // A newer symbol may have been assigned while we were probing.
    if (symbol !== props.symbol) return
    sourceIndex.value = index
    resolved.value = true
  },
  { immediate: true }
)
</script>
