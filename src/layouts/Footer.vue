<script setup>
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer
    class="mt-auto flex justify-center items-center p-4 text-muted-color"
  >
    <div class="text-sm">
      &copy; {{ currentYear }} StockBar. All rights reserved.
    </div>
  </footer>
</template>
