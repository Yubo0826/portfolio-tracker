<template>
  <div class="flex flex-col lg:flex-row gap-8 py-6">
    <!-- Sidebar Navigation (Desktop) -->
    <aside class="hidden lg:block w-64 shrink-0">
      <div class="sticky top-24 p-4 bg-[var(--p-surface-card)] rounded-xl border border-[var(--p-content-border-color)] shadow-sm">
        <div class="font-bold mb-4 text-lg">{{ $t('userGuide') }}</div>
        <nav class="flex flex-col gap-2">
          <a
            v-for="item in menuItems"
            :key="item.id"
            :href="`#${item.id}`"
            class="text-sm text-[var(--p-text-muted-color)] hover:text-[var(--p-primary-color)] transition-colors py-1 px-2 rounded hover:bg-[var(--p-surface-hover)]"
            :class="{ 'text-[var(--p-primary-color)] font-medium bg-[var(--p-surface-hover)]': activeSection === item.id }"
            @click.prevent="scrollToSection(item.id)"
          >
            {{ item.label }}
          </a>
        </nav>
      </div>
    </aside>

    <!-- Mobile Navigation (Dropdown or simple list) -->
    <div class="lg:hidden mb-4">
      <div class="p-4 bg-[var(--p-surface-card)] rounded-xl border border-[var(--p-content-border-color)]">
        <div class="font-bold mb-2">{{ $t('tableOfContents') }}</div>
        <select @change="scrollToSection($event.target.value)" class="w-full p-2 rounded border border-[var(--p-content-border-color)] bg-[var(--p-surface-ground)]">
          <option v-for="item in menuItems" :key="item.id" :value="item.id">
            {{ item.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1 min-w-0">
      <div class="prose max-w-none dark:prose-invert">
        <h1 class="text-3xl font-bold mb-8">{{ $t('userGuideTitle') }}</h1>
        
        <section id="dashboard" class="scroll-mt-24 mb-12">
          <h2 class="text-2xl font-bold mb-4 border-b pb-2">1. {{ $t('dashboard') }}</h2>
          <p class="mb-4">{{ $t('dashboardIntro') }}</p>
          
          <h3 class="text-xl font-semibold mb-2">{{ $t('coreMetrics') }}</h3>
          <ul class="list-disc pl-6 mb-4 space-y-1">
            <li><strong>{{ $t('totalValue') }}</strong>: {{ $t('totalValueDesc') }}</li>
            <li><strong>{{ $t('totalProfit') }}</strong>: {{ $t('totalProfitDesc') }}</li>
            <li><strong>{{ $t('irr') }} (XIRR)</strong>: {{ $t('irrDesc') }}</li>
          </ul>

          <h3 class="text-xl font-semibold mb-2">{{ $t('assetTrend') }}</h3>
          <ul class="list-disc pl-6 mb-4 space-y-1">
            <li>{{ $t('assetTrendDesc1') }}</li>
            <li>{{ $t('assetTrendDesc2') }}</li>
          </ul>

          <h3 class="text-xl font-semibold mb-2">{{ $t('allocationPie') }}</h3>
          <ul class="list-disc pl-6 mb-4 space-y-1">
            <li><strong>{{ $t('actualAllocation') }}</strong>: {{ $t('actualAllocationDesc') }}</li>
            <li><strong>{{ $t('targetAllocation') }}</strong>: {{ $t('targetAllocationDesc') }}</li>
            <li>{{ $t('allocationPieDesc1') }}</li>
            <li><strong>{{ $t('rebalanceSuggestion') }}</strong>: {{ $t('rebalanceSuggestionDesc') }}</li>
          </ul>

          <h3 class="text-xl font-semibold mb-2">{{ $t('holdingsTable') }}</h3>
          <ul class="list-disc pl-6 mb-4 space-y-1">
            <li>{{ $t('holdingsTableDesc1') }}</li>
            <li>{{ $t('holdingsTableDesc2') }}</li>
            <li>{{ $t('holdingsTableDesc3') }}</li>
          </ul>
        </section>

        <section id="transactions" class="scroll-mt-24 mb-12">
          <h2 class="text-2xl font-bold mb-4 border-b pb-2">2. {{ $t('transactions') }}</h2>
          <p class="mb-4">{{ $t('transactionsIntro') }}</p>

          <h3 class="text-xl font-semibold mb-2">{{ $t('operations') }}</h3>
          <ul class="list-disc pl-6 mb-4 space-y-1">
            <li><strong>{{ $t('addTransaction') }}</strong>: {{ $t('addTransactionDesc') }}</li>
            <li><strong>{{ $t('editDeleteTransaction') }}</strong>: {{ $t('editDeleteTransactionDesc') }}</li>
            <li><strong>{{ $t('exportData') }}</strong>: {{ $t('exportDataDesc') }}</li>
          </ul>
        </section>

        <section id="holdings" class="scroll-mt-24 mb-12">
          <h2 class="text-2xl font-bold mb-4 border-b pb-2">3. {{ $t('holdings') }}</h2>
          <p class="mb-4">{{ $t('holdingsIntro') }}</p>
          <ul class="list-disc pl-6 mb-4 space-y-1">
            <li><strong>{{ $t('viewDetails') }}</strong>: {{ $t('viewDetailsDesc') }}</li>
          </ul>
        </section>

        <section id="allocation" class="scroll-mt-24 mb-12">
          <h2 class="text-2xl font-bold mb-4 border-b pb-2">4. {{ $t('allocation') }}</h2>
          <p class="mb-4">{{ $t('allocationIntro') }}</p>
          
          <h3 class="text-xl font-semibold mb-2">{{ $t('operations') }}</h3>
          <ul class="list-disc pl-6 mb-4 space-y-1">
            <li><strong>{{ $t('setTargets') }}</strong>: {{ $t('setTargetsDesc') }}</li>
            <li><strong>{{ $t('addTrackedAsset') }}</strong>: {{ $t('addTrackedAssetDesc') }}</li>
          </ul>
        </section>

        <section id="rebalancing" class="scroll-mt-24 mb-12">
          <h2 class="text-2xl font-bold mb-4 border-b pb-2">5. {{ $t('rebalancing') }}</h2>
          <p class="mb-4">{{ $t('rebalancingIntro') }}</p>
          
          <h3 class="text-xl font-semibold mb-2">{{ $t('features') }}</h3>
          <ul class="list-disc pl-6 mb-4 space-y-1">
            <li><strong>{{ $t('rebalanceTable') }}</strong>: {{ $t('rebalanceTableDesc') }}</li>
            <li><strong>{{ $t('suggestions') }}</strong>: {{ $t('suggestionsDesc') }}</li>
          </ul>
        </section>

        <section id="dividends" class="scroll-mt-24 mb-12">
          <h2 class="text-2xl font-bold mb-4 border-b pb-2">6. {{ $t('dividends') }}</h2>
          <p class="mb-4">{{ $t('dividendsIntro') }}</p>
          <ul class="list-disc pl-6 mb-4 space-y-1">
            <li><strong>{{ $t('viewDividends') }}</strong>: {{ $t('viewDividendsDesc') }}</li>
          </ul>
        </section>

        <section id="backtesting" class="scroll-mt-24 mb-12">
          <h2 class="text-2xl font-bold mb-4 border-b pb-2">7. {{ $t('backtesting') }}</h2>
          <p class="mb-4">{{ $t('backtestingIntro') }}</p>
          <ul class="list-disc pl-6 mb-4 space-y-1">
            <li><strong>{{ $t('setParams') }}</strong>: {{ $t('setParamsDesc') }}</li>
            <li><strong>{{ $t('viewResults') }}</strong>: {{ $t('viewResultsDesc') }}</li>
          </ul>
        </section>

        <section id="settings" class="scroll-mt-24 mb-12">
          <h2 class="text-2xl font-bold mb-4 border-b pb-2">8. {{ $t('userSettings') }}</h2>
          <p class="mb-4">{{ $t('userSettingsIntro') }}</p>
          <ul class="list-disc pl-6 mb-4 space-y-1">
            <li><strong>{{ $t('generalSettings') }}</strong>: {{ $t('generalSettingsDesc') }}</li>
            <li><strong>{{ $t('accountManagement') }}</strong>: {{ $t('accountManagementDesc') }}</li>
          </ul>
        </section>

        <div class="bg-[var(--p-surface-ground)] p-4 rounded-lg border border-[var(--p-content-border-color)]">
          <div class="flex gap-2">
            <i class="pi pi-info-circle text-[var(--p-primary-color)] mt-1"></i>
            <div>
              <strong>{{ $t('tip') }}</strong>: {{ $t('dataAccuracyTip') }}
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const activeSection = ref('dashboard')

const menuItems = [
  { id: 'dashboard', label: '1. ' + t('dashboard') },
  { id: 'transactions', label: '2. ' + t('transactions') },
  { id: 'holdings', label: '3. ' + t('holdings') },
  { id: 'allocation', label: '4. ' + t('allocation') },
  { id: 'rebalancing', label: '5. ' + t('rebalancing') },
  { id: 'dividends', label: '6. ' + t('dividends') },
  { id: 'backtesting', label: '7. ' + t('backtesting') },
  { id: 'settings', label: '8. ' + t('userSettings') },
]

const scrollToSection = (id) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
    activeSection.value = id
  }
}

// Intersection Observer for active section
let observer = null

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        activeSection.value = entry.target.id
      }
    })
  }, {
    rootMargin: '-20% 0px -50% 0px'
  })

  menuItems.forEach((item) => {
    const el = document.getElementById(item.id)
    if (el) observer.observe(el)
  })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
/* Add any specific styles if needed, mostly using Tailwind */
</style>
