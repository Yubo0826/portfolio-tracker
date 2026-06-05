<script setup>
import { computed, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
})

const attrs = useAttrs()

const iconModules = import.meta.glob('@/assets/icons/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const iconMap = Object.fromEntries(
  Object.entries(iconModules).map(([path, rawSvg]) => {
    const iconName = path
      .split('/')
      .pop()
      ?.replace(/\.svg$/i, '')
    return [iconName, rawSvg]
  }),
)

const warnedIcons = new Set()

function injectSvgClass(rawSvg) {
  return rawSvg.replace(/<svg\b([^>]*)>/i, (match, attrsText) => {
    let nextAttrs = attrsText

    if (/class\s*=\s*['"][^'"]*['"]/i.test(nextAttrs)) {
      nextAttrs = nextAttrs.replace(/class\s*=\s*(['"])([^'"]*)\1/i, (classMatch, quote, value) => {
        return `class=${quote}${value} svg-icon__svg${quote}`
      })
    } else {
      nextAttrs = `${nextAttrs} class="svg-icon__svg"`
    }

    if (!/focusable\s*=\s*['"][^'"]*['"]/i.test(nextAttrs)) {
      nextAttrs = `${nextAttrs} focusable="false"`
    }

    return `<svg${nextAttrs}>`
  })
}

const normalizedName = computed(() => (props.name || '').trim())

const svgMarkup = computed(() => {
  const rawSvg = iconMap[normalizedName.value]

  if (!rawSvg) {
    if (import.meta.env.DEV && normalizedName.value && !warnedIcons.has(normalizedName.value)) {
      warnedIcons.add(normalizedName.value)
      console.warn(`[SvgIcon] Icon "${normalizedName.value}" not found in src/assets/icons.`)
    }
    return ''
  }

  return injectSvgClass(rawSvg)
})

const decorative = computed(() => !props.label)
</script>

<template>
  <span
    class="svg-icon"
    v-bind="attrs"
    :data-icon-name="normalizedName || undefined"
    :aria-hidden="decorative ? 'true' : undefined"
    :role="decorative ? undefined : 'img'"
    :aria-label="decorative ? undefined : label"
    v-html="svgMarkup"
  ></span>
</template>

<style scoped>
.svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  line-height: 1;
  flex-shrink: 0;
  color: currentColor;
}

.svg-icon :deep(.svg-icon__svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
