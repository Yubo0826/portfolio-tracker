<template>
  <div
    class="flex items-center gap-3 select-none"
    role="radiogroup"
    aria-label="Time range"
  >
    <button
      v-for="(opt, idx) in normalizedOptions"
      :key="opt"
      type="button"
      role="radio"
      :aria-checked="idx === activeIndex"
      :tabindex="idx === activeIndex ? 0 : -1"
      :aria-label="`Set range ${opt}`"
      :ref="el => setBtnRef(el, idx)"
      @click="select(opt)"
      @keydown="onKeydown($event, idx)"
      :class="[
        'px-3 py-1 text-sm rounded-full transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
        idx === activeIndex
          ? 'bg-blue-100 text-blue-600 font-semibold'
          : 'text-slate-500 hover:text-slate-900'
      ]"
    >
      {{ opt }}
    </button>
  </div>
</template>

<script setup>
import { computed, onBeforeUpdate, ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '1y' },
  options: {
    type: Array,
    default: () => ['7d', '1m', '3m', '6m', 'YTD', '1y', '5y']
  }
})
const emit = defineEmits(['update:modelValue', 'change'])

const normalizedOptions = computed(() => props.options.map(o => String(o)))
const activeIndex = computed(() => {
  const i = normalizedOptions.value.findIndex(
    o => o.toLowerCase() === String(props.modelValue).toLowerCase()
  )
  return i === -1 ? 0 : i
})

const btnRefs = ref([])
onBeforeUpdate(() => { btnRefs.value = [] })
function setBtnRef (el, idx) { if (el) btnRefs.value[idx] = el }

function select (opt) {
  emit('update:modelValue', opt)
  emit('change', opt)
}
function focusIndex (i) { btnRefs.value[i]?.focus() }
function move (delta) {
  const len = normalizedOptions.value.length
  const next = (activeIndex.value + delta + len) % len
  focusIndex(next)
  select(normalizedOptions.value[next])
}
function onKeydown (e, idx) {
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault(); move(1); break
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault(); move(-1); break
    case 'Home':
      e.preventDefault(); focusIndex(0); select(normalizedOptions.value[0]); break
    case 'End':
      e.preventDefault(); focusIndex(normalizedOptions.value.length - 1)
      select(normalizedOptions.value.at(-1)); break
    case ' ':
    case 'Enter':
      e.preventDefault(); select(normalizedOptions.value[idx]); break
  }
}
</script>
