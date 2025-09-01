<template>
  <div class="flex justify-center items-center p-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
    <div class="text-sm">
      &copy; 2025 StockBar. {{ t('allRightsReserved') }}.
    </div>
    <div class="ml-4 space-x-4">
      <a href="/about" class="hover:underline">{{ t('about') }}</a>
      <a href="/privacy" class="hover:underline">{{ t('privacyPolicy') }}</a>
      <a href="/terms" class="hover:underline">{{ t('termsOfService') }}</a>
      <a href="/contact" class="hover:underline">{{ t('contact') }}</a>
    </div>

  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>