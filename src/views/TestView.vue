<template>
  <header class="bg-white dark:bg-neutral-900 shadow-md">
    <nav class="container mx-auto flex items-center space-x-4 px-6 py-3">
      <!-- Dashboard -->
      <a
        href="#"
        class="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
      >
        📊 Dashboard
      </a>

      <!-- Portfolio with dropdown -->
      <div class="relative group">
        <button
          class="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          📂 Portfolio
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Dropdown -->
        <ul
          class="absolute left-0 mt-2 hidden w-40 rounded-lg bg-white dark:bg-neutral-800 shadow-lg group-hover:block"
        >
          <li>
            <a
              href="#"
              class="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-t-lg"
            >
              Holdings
            </a>
          </li>
          <li>
            <a
              href="#"
              class="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              Transactions
            </a>
          </li>
          <li>
            <a
              href="#"
              class="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-b-lg"
            >
              Dividends
            </a>
          </li>
        </ul>
      </div>

      <!-- Rebalance -->
      <a
        href="#"
        class="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
      >
        🔄 Rebalance
      </a>
    </nav>
  </header>
</template>
ㄋ