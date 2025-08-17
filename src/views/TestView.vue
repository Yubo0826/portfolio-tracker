<template>
  <div class="relative border-b border-gray-300 w-full">
    <!-- Tabs -->
    <div class="flex space-x-4">
      <div
        v-for="(tab, index) in tabs"
        :key="tab"
        ref="tabRefs"
        class="cursor-pointer px-4 py-2 text-sm font-medium text-gray-600 hover:text-black"
        :class="{ 'text-black': activeTabIndex === index }"
        @click="selectTab(index)"
      >
        {{ tab }}
      </div>
    </div>

    <!-- Slider -->
    <div
      class="absolute bottom-0 h-0.5 bg-blue-500 transition-all duration-300"
      :style="{
        width: sliderWidth + 'px',
        left: sliderLeft + 'px'
      }"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const tabs = ['1D', '5D', '1M', '6M', '1Y', '5Y', 'Max']
const activeTabIndex = ref(0)
const tabRefs = ref([])

const sliderWidth = ref(0)
const sliderLeft = ref(0)

const updateSlider = () => {
  const el = tabRefs.value[activeTabIndex.value]
  if (el) {
    const rect = el.getBoundingClientRect()
    const parentRect = el.parentElement.getBoundingClientRect()
    sliderWidth.value = rect.width
    sliderLeft.value = rect.left - parentRect.left
  }
}

const selectTab = async (index) => {
  activeTabIndex.value = index
  await nextTick()
  updateSlider()
}

onMounted(() => {
  nextTick(updateSlider)
})
</script>

<style scoped>
/* 無需額外 CSS，皆由 Tailwind 控制 */
</style>
