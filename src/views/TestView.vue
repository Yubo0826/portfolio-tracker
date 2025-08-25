<template>
  <Button
    unstyled
    label="前往目標設定"
    icon="pi pi-bullseye"
    :pt="pt"
    @click="onClick"
  />
</template>

<script setup>
import Button from 'primevue/button'

const onClick = () => {
  // TODO: 前往目標設定
}

const pt = {
  root: {
    class:
      // 尺寸/外觀
      'inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 ' +
      // 文字
      'text-sm font-medium text-slate-700 ' +
      // 陰影/互動
      'shadow-[0_4px_12px_rgba(2,6,23,0.08)] hover:border-slate-300 hover:shadow-[0_8px_20px_rgba(2,6,23,0.12)] active:shadow-sm ' +
      // 無障礙
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 ' +
      // 動畫
      'transition'
  },
  icon: {
    // 使用 primeicons，靠字級控制大小
    class: 'order-0 mr-0 text-slate-600 text-[18px]'
  },
  label: {
    class: 'order-1'
  }
}
</script>
