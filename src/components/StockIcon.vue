<template>
  <img
    v-if="!showFallback"
    :src="imageSrc"
    :alt="`${symbolText} logo`"
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

const showFallback = ref(false)
const imageSrc = ref('')

const symbolText = computed(() => (props.symbol || '').toUpperCase())

const fallbackText = computed(() => {
  const cleaned = symbolText.value.replace(/[^A-Z0-9]/g, '')
  if (!cleaned) return '--'
  return cleaned.slice(0, 2)
})

const setImageSrc = () => {
  imageSrc.value = `https://storage.googleapis.com/iex/api/logos/${props.symbol}.png`
  showFallback.value = false
}

const handleImageError = () => {
  showFallback.value = true
}

watch(
  () => props.symbol,
  () => setImageSrc(),
  { immediate: true }
)
</script>