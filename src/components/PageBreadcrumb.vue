<template>
  <nav v-if="items.length" class="page-breadcrumb" aria-label="Breadcrumb">
    <template v-for="(item, index) in items" :key="index">
      <RouterLink v-if="item.to && index !== items.length - 1" :to="item.to" class="page-breadcrumb__link">
        {{ item.label }}
      </RouterLink>
      <span v-else class="page-breadcrumb__current">{{ item.label }}</span>
      <span v-if="index !== items.length - 1" class="page-breadcrumb__separator">/</span>
    </template>
  </nav>
</template>

<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<style scoped>
.page-breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  font-size: 0.8125rem;
  margin-bottom: 1.25rem;
}

.page-breadcrumb__link {
  color: var(--p-text-muted-color);
  text-decoration: none;
  transition: color 0.15s ease;
}

.page-breadcrumb__link:hover {
  color: var(--p-text-color);
  text-decoration: underline;
}

.page-breadcrumb__current {
  color: var(--p-text-color);
  font-weight: 600;
}

.page-breadcrumb__separator {
  color: var(--p-text-muted-color);
  opacity: 0.6;
}
</style>
