<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
    <div class="text-center max-w-md">
      <p class="text-8xl font-extrabold text-primary mb-4">404</p>
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        {{ $t('notFound.title') }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mb-8">
        {{ $t('notFound.description') }}
      </p>
      <Button :label="$t('notFound.goHome')" icon="pi pi-home" @click="router.push('/')" />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()
</script>
