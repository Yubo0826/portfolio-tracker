<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'
import Footer from '@/layouts/Footer.vue'
import '@/composables/useTheme' // 模組載入時套用 .dark class（本頁沒有 AppHeader）

const auth = useAuthStore()
const router = useRouter()
const { locale, t } = useI18n()

// 已登入（含從本頁登入）就直接進 dashboard
watch(
  () => [auth.authReady, auth.user.uid],
  ([ready, uid]) => {
    if (ready && uid !== 'demo-user') router.replace('/dashboard')
  },
  { immediate: true }
)

const toggleLanguage = () => {
  locale.value = locale.value === 'en' ? 'zh' : 'en'
  localStorage.setItem('locale', locale.value)
}

const features = [
  { icon: 'pi pi-wallet', key: 'holdings' },
  { icon: 'pi pi-chart-pie', key: 'allocation' },
  { icon: 'pi pi-history', key: 'backtest' },
  { icon: 'pi pi-envelope', key: 'alert' },
]
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface-0 text-color dark:bg-surface-950">
    <header class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <div class="flex items-center gap-2 text-lg font-semibold">
        <img src="/stockbar-icon.png" alt="" class="h-8 w-8" />
        StockBar
      </div>
      <Button
        :label="locale === 'en' ? '中文' : 'EN'"
        icon="pi pi-globe"
        text
        severity="secondary"
        @click="toggleLanguage"
      />
    </header>

    <main v-if="auth.authReady" class="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
      <section class="py-16 text-center sm:py-24">
        <h1 class="mx-auto max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
          {{ t('landing.heroTitle') }}
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-muted-color">
          {{ t('landing.heroSubtitle') }}
        </p>
        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button :label="t('landing.signIn')" icon="pi pi-google" size="large" @click="auth.login" />
          <Button
            :label="t('landing.tryDemo')"
            icon="pi pi-arrow-right"
            iconPos="right"
            size="large"
            outlined
            @click="router.push('/dashboard')"
          />
        </div>
      </section>

      <section class="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="f in features"
          :key="f.key"
          class="rounded-2xl border border-surface-200 p-6 dark:border-surface-700"
        >
          <i :class="f.icon" class="text-2xl text-primary" aria-hidden="true"></i>
          <h2 class="mt-4 text-lg font-semibold">{{ t(`landing.${f.key}Title`) }}</h2>
          <p class="mt-2 text-sm text-muted-color">{{ t(`landing.${f.key}Desc`) }}</p>
        </div>
      </section>
    </main>
    <div v-else class="flex-1"></div>

    <Footer />
  </div>
</template>
