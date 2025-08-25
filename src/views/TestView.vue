<!-- Footer.vue -->
<template>
  <footer class="border-t bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-neutral-900/80 dark:supports-[backdrop-filter]:bg-neutral-900/60">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- 上排：品牌 + 導覽 -->
      <div class="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <!-- 品牌 -->
        <a href="/" class="inline-flex items-center gap-2 font-semibold text-neutral-900 hover:opacity-90 dark:text-neutral-100">
          <!-- 簡單 Logo 佔位 -->
          <span class="inline-flex h-6 w-6 items-center justify-center rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">A</span>
          <span>YourApp</span>
        </a>

        <!-- 導覽 -->
        <nav class="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-neutral-600 dark:text-neutral-300">
          <a v-for="link in links" :key="link.name" :href="link.href"
             class="transition hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:hover:text-white dark:focus-visible:ring-neutral-500">
            {{ link.name }}
          </a>
        </nav>
      </div>

      <!-- 下排：版權 + 社群 -->
      <div class="flex flex-col-reverse items-start gap-4 border-t py-6 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:text-neutral-400">
        <p>© {{ year }} YourCo. All rights reserved.</p>

        <div class="flex items-center gap-4">
          <!-- GitHub -->
          <a href="#" aria-label="GitHub"
             class="transition hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:hover:text-white dark:focus-visible:ring-neutral-500">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" clip-rule="evenodd"
                d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.09-.74.08-.73.08-.73 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.48.99.11-.79.42-1.3.76-1.6-2.67-.3-5.48-1.33-5.48-5.92 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.6-2.81 5.61-5.49 5.91.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58A12 12 0 0 0 12 .5Z"/>
            </svg>
          </a>
          <!-- X / Twitter -->
          <a href="#" aria-label="X"
             class="transition hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:hover:text-white dark:focus-visible:ring-neutral-500">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M18.146 2.25h3.195l-6.98 7.975L22.5 21.75h-6.27l-4.905-6.402-5.607 6.402H2.523l7.47-8.535L1.5 2.25h6.403l4.43 5.818 5.813-5.818Zm-1.102 17.16h1.77L7.03 4.44H5.147l11.897 14.97Z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
const links = [
  { name: '關於', href: '#' },
  { name: '文件', href: '#' },
  { name: '定價', href: '#' },
  { name: '部落格', href: '#' },
  { name: '支援', href: '#' },
]
</script>
