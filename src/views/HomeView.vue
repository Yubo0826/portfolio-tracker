<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

// 本頁固定深色（不跟使用者主題），所以不用 PrimeVue 元件與 --p-* 色票，全部走本頁自己的 --lp-* 變數

const auth = useAuthStore()
const router = useRouter()
const { locale, t } = useI18n()
const year = new Date().getFullYear()

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
const openDemo = () => router.push('/dashboard')

/* ── 產品畫面分頁（截圖為展示帳號資料，public/landing/*.webp） ── */
const tabs = ['overview', 'rebalance', 'dividends', 'backtest']
const shots = { overview: 'dashboard', rebalance: 'rebalancing', dividends: 'dividends', backtest: 'backtesting' }
const activeTab = ref('overview')
const tabEls = ref([])

// 方向鍵在分頁間移動（WAI-ARIA tabs 慣例）
function onTabKey(e, i) {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
  if (!step) return
  e.preventDefault()
  const next = (i + step + tabs.length) % tabs.length
  activeTab.value = tabs[next]
  tabEls.value[next]?.focus()
}

/* ── 捲動進場：元素進入畫面才播放；不支援或「減少動態」時什麼都不做，內容維持原樣可見 ──
   v-reveal="{ delay: ms, kind: 'up' | 'zoom' | 'side' }"，預設 up */
const canReveal = typeof window !== 'undefined'
  && 'IntersectionObserver' in window
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
let revealObserver
const vReveal = {
  mounted(el, { value = {} }) {
    if (!canReveal) return
    revealObserver ??= new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) show(entry.target)
      // 從畫面下方直接跳到上方（錨點、快速捲動）不會觸發交會，順便把已捲過頭的一起顯示
      for (const pending of revealPending) if (pending.getBoundingClientRect().bottom < 0) show(pending)
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0.05 })
    el.classList.add('lp-reveal', `lp-reveal--${value.kind || 'up'}`)
    el.style.setProperty('--lp-delay', `${value.delay || 0}ms`)
    revealPending.add(el)
    revealObserver.observe(el)
  },
  unmounted(el) {
    revealPending.delete(el)
    revealObserver?.unobserve(el)
  },
}
const revealPending = new Set()
function show(el) {
  el.classList.add('is-in')
  revealPending.delete(el)
  revealObserver.unobserve(el)
}

const features = [
  { key: 'currency', icon: 'pi-arrow-right-arrow-left' },
  { key: 'alert', icon: 'pi-envelope' },
  { key: 'import', icon: 'pi-upload' },
  { key: 'watchlist', icon: 'pi-star' },
  { key: 'fx', icon: 'pi-dollar' },
  { key: 'analysis', icon: 'pi-chart-pie' },
]
</script>

<template>
  <div class="lp">
    <header class="lp-wrap lp-header">
      <a href="/" class="lp-brand" aria-label="StockBar">
        <img src="/stockbar-logo.svg" alt="" width="28" height="28" />
        <span>Stock<span class="lp-accent">Bar</span></span>
      </a>
      <nav class="lp-nav" :aria-label="t('landing.nav.product')">
        <a href="#product">{{ t('landing.nav.product') }}</a>
        <a href="#features">{{ t('landing.nav.features') }}</a>
        <RouterLink to="/user-guide">{{ t('landing.nav.guide') }}</RouterLink>
      </nav>
      <div class="lp-header__end">
        <RouterLink to="/user-guide" class="lp-link lp-guide-mobile">{{ t('landing.nav.guide') }}</RouterLink>
        <button type="button" class="lp-link" @click="toggleLanguage">
          <i class="pi pi-globe" aria-hidden="true"></i>{{ locale === 'en' ? '中文' : 'EN' }}
        </button>
        <button type="button" class="lp-btn lp-btn--light lp-btn--sm" @click="auth.login">{{ t('landing.login') }}</button>
      </div>
    </header>

    <main v-if="auth.authReady">
      <!-- Hero：兩色標題＋底部發光弧線 -->
      <section class="lp-hero">
        <div class="lp-wrap lp-hero__inner">
          <h1 v-reveal class="lp-hero__title">
            <span class="block">{{ t('landing.heroLine1') }}</span>
            <span class="block lp-accent">{{ t('landing.heroLine2') }}</span>
          </h1>
          <p v-reveal="{ delay: 120 }" class="lp-hero__sub">{{ t('landing.heroSubtitle') }}</p>
          <div v-reveal="{ delay: 240 }" class="lp-actions">
            <button type="button" class="lp-btn lp-btn--accent" @click="auth.login">
              <i class="pi pi-google" aria-hidden="true"></i>{{ t('landing.signIn') }}
            </button>
            <button type="button" class="lp-btn lp-btn--ghost" @click="openDemo">
              {{ t('landing.tryDemo') }}<i class="pi pi-arrow-right" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div class="lp-horizon" aria-hidden="true"></div>
      </section>

      <!-- 產品畫面：分頁切換＋截圖 -->
      <section id="product" class="lp-wrap lp-section">
        <h2 v-reveal class="lp-h2">{{ t('landing.product.title1') }}<span class="lp-accent">{{ t('landing.product.title2') }}</span></h2>
        <p v-reveal="{ delay: 100 }" class="lp-lead">{{ t('landing.product.subtitle') }}</p>

        <div v-reveal="{ delay: 200 }" class="lp-tabs" role="tablist" :aria-label="t('landing.nav.product')">
          <button
            v-for="(tab, i) in tabs"
            :id="`lp-tab-${tab}`"
            :key="tab"
            :ref="(el) => (tabEls[i] = el)"
            type="button"
            role="tab"
            class="lp-tab"
            :class="{ 'is-active': activeTab === tab }"
            :aria-selected="activeTab === tab"
            aria-controls="lp-panel"
            :tabindex="activeTab === tab ? 0 : -1"
            @click="activeTab = tab"
            @keydown="onTabKey($event, i)"
          >{{ t(`landing.product.tabs.${tab}.label`) }}</button>
        </div>

        <div id="lp-panel" class="lp-showcase" role="tabpanel" :aria-labelledby="`lp-tab-${activeTab}`">
          <figure v-reveal="{ kind: 'zoom' }" class="lp-frame">
            <div class="lp-frame__screen">
              <Transition name="lp-swap" mode="out-in">
                <img
                  :key="activeTab"
                  :src="`/landing/${shots[activeTab]}${locale === 'en' ? '-en' : ''}.webp`"
                  :alt="t(`landing.product.tabs.${activeTab}.title`)"
                  width="2192"
                  height="1370"
                  decoding="async"
                />
              </Transition>
            </div>
            <figcaption>{{ t('landing.product.demoNote') }}</figcaption>
          </figure>
          <!-- 進場動畫掛在外層：內層會隨分頁重掛，掛在內層會每切一次就重播 -->
          <div v-reveal="{ delay: 150, kind: 'side' }">
            <Transition name="lp-swap" mode="out-in">
              <div :key="activeTab" class="lp-showcase__copy">
                <h3>{{ t(`landing.product.tabs.${activeTab}.title`) }}</h3>
                <ul>
                  <li v-for="n in 3" :key="n">{{ t(`landing.product.tabs.${activeTab}.p${n}`) }}</li>
                </ul>
              </div>
            </Transition>
          </div>
        </div>
      </section>

      <!-- 其他功能 -->
      <section id="features" class="lp-wrap lp-section">
        <h2 v-reveal class="lp-h2">{{ t('landing.features.title1') }}<span class="lp-accent">{{ t('landing.features.title2') }}</span></h2>
        <div class="lp-grid">
          <article v-for="(f, i) in features" :key="f.key" v-reveal="{ delay: (i % 3) * 90 + Math.floor(i / 3) * 60 }" class="lp-card">
            <span class="lp-badge" aria-hidden="true"><i class="pi" :class="f.icon"></i></span>
            <h3>{{ t(`landing.features.items.${f.key}.title`) }}</h3>
            <p>{{ t(`landing.features.items.${f.key}.desc`) }}</p>
          </article>
        </div>
      </section>

      <!-- 收尾 CTA -->
      <section class="lp-wrap">
        <div v-reveal="{ kind: 'zoom' }" class="lp-cta">
          <h2 class="lp-h2">{{ t('landing.cta.title') }}</h2>
          <p class="lp-lead">{{ t('landing.cta.subtitle') }}</p>
          <div class="lp-actions">
            <button type="button" class="lp-btn lp-btn--accent" @click="auth.login">
              <i class="pi pi-google" aria-hidden="true"></i>{{ t('landing.signIn') }}
            </button>
            <button type="button" class="lp-btn lp-btn--ghost" @click="openDemo">
              {{ t('landing.tryDemo') }}<i class="pi pi-arrow-right" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </section>
    </main>
    <div v-else class="min-h-screen"></div>

    <footer class="lp-wrap lp-footer">&copy; {{ year }} StockBar</footer>
  </div>
</template>

<style scoped>
.lp {
  --lp-bg: #08080a;
  --lp-raised: #111114;
  --lp-raised-2: #17171b;
  --lp-line: rgb(255 255 255 / 0.08);
  --lp-line-strong: rgb(255 255 255 / 0.14);
  --lp-text: #f4f4f5;
  --lp-muted: #a1a1aa;
  --lp-accent: #ffb800;
  --lp-on-accent: #1b1b21;
  min-height: 100vh;
  /* 參考圖右上角落下的柔光，只在頁首 */
  background:
    radial-gradient(900px 640px at 100% 0%, rgb(255 244 224 / 0.3), rgb(255 200 90 / 0.08) 40%, transparent 70%) no-repeat,
    var(--lp-bg);
  color: var(--lp-text);
  color-scheme: dark;
  overflow-x: clip;
}
.lp ::selection {
  background: rgb(255 184 0 / 0.35);
  color: #fff;
}
.lp :focus-visible {
  outline: 2px solid var(--lp-accent);
  outline-offset: 3px;
}
.lp-accent {
  color: var(--lp-accent);
}
.lp-wrap {
  width: 100%;
  max-width: 72rem;
  margin-inline: auto;
  padding-inline: 1rem;
}
@media (min-width: 640px) {
  .lp-wrap {
    padding-inline: 1.5rem;
  }
}

/* ── Header ── */
.lp-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 1.25rem;
}
.lp-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 800; /* 品牌字例外，同 app 側欄 */
  letter-spacing: -0.04em;
  color: var(--lp-text);
}
.lp-nav {
  display: none;
  gap: 0.25rem;
  padding: 0.25rem;
  border: 1px solid var(--lp-line);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.03);
}
@media (min-width: 768px) {
  .lp-nav {
    display: flex;
  }
}
.lp-nav a {
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  color: var(--lp-muted);
  transition: color 0.2s, background-color 0.2s;
}
.lp-nav a:hover {
  color: var(--lp-text);
  background: rgb(255 255 255 / 0.06);
}
.lp-header__end {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.lp-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--lp-muted);
  cursor: pointer;
  transition: color 0.2s;
}
/* 手機版導覽藏起來時才顯示（Tailwind 的 md:hidden 會被 .lp-link 的 display 蓋掉） */
@media (min-width: 768px) {
  .lp-guide-mobile {
    display: none;
  }
}
.lp-link:hover {
  color: var(--lp-text);
}

/* ── 按鈕：膠囊形 ── */
.lp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 2.75rem;
  padding-inline: 1.375rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.lp-btn:active {
  transform: translateY(1px);
}
.lp-btn--sm {
  height: 2.25rem;
  padding-inline: 1rem;
  font-size: 0.8125rem;
}
.lp-btn--accent {
  background: var(--lp-accent);
  color: var(--lp-on-accent);
  box-shadow: 0 8px 24px -10px rgb(255 184 0 / 0.6);
}
.lp-btn--accent:hover {
  background: #ffc633;
  box-shadow: 0 10px 30px -10px rgb(255 184 0 / 0.75);
}
.lp-btn--light {
  background: var(--lp-text);
  color: var(--lp-on-accent);
}
.lp-btn--light:hover {
  background: #fff;
}
.lp-btn--ghost {
  border: 1px solid var(--lp-line-strong);
  color: var(--lp-text);
  background: rgb(255 255 255 / 0.02);
}
.lp-btn--ghost:hover {
  border-color: rgb(255 255 255 / 0.28);
  background: rgb(255 255 255 / 0.06);
}
.lp-btn .pi {
  font-size: 0.875rem;
}

/* ── Hero ── */
.lp-hero {
  position: relative;
  padding-top: clamp(3rem, 8vw, 6rem);
  padding-bottom: clamp(9rem, 18vw, 14rem);
  overflow: hidden;
  text-align: center;
}
.lp-hero__inner {
  position: relative;
  z-index: 1;
}
.lp-hero__title {
  margin-inline: auto;
  max-width: 24ch;
  font-size: clamp(2.25rem, 1.2rem + 4vw, 4rem);
  font-weight: 500;
  line-height: 1.12;
  letter-spacing: -0.035em;
  text-wrap: balance;
}
.lp-hero__sub {
  margin: 1.25rem auto 0;
  max-width: 34rem;
  font-size: 1rem;
  line-height: 1.7;
  color: var(--lp-muted);
  text-wrap: balance;
  word-break: keep-all;
}
.lp-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 2rem;
}

/* 地平線：一個超大的橢圓，只露出上緣。亮邊＋向上暈開的光，背後是更暗的弧面 */
.lp-horizon {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: max(160%, 1100px);
  aspect-ratio: 3 / 1;
  transform: translate(-50%, 78%);
  border-radius: 50%;
  border-top: 2px solid rgb(255 244 214 / 0.95);
  /* 弧面與頁面同色；弧線靠亮邊與向上的光暈 */
  background: radial-gradient(ellipse 50% 12% at 50% 0%, rgb(255 184 0 / 0.12), transparent 80%), var(--lp-bg);
  box-shadow:
    0 -1px 6px 0 rgb(255 226 150 / 0.9),
    0 -6px 24px 0 rgb(255 184 0 / 0.45),
    0 -40px 100px -20px rgb(255 184 0 / 0.3);
}
/* hero 底邊被 overflow 裁切處用漸層收成頁面底色，不留色差接縫 */
.lp-hero::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 3rem;
  background: linear-gradient(to bottom, transparent, var(--lp-bg));
  pointer-events: none;
}
@media (prefers-reduced-motion: no-preference) {
  .lp-horizon {
    animation: lp-rise 1.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
}
@keyframes lp-rise {
  from {
    transform: translate(-50%, 88%);
    opacity: 0.4;
  }
}

/* ── 區塊共用 ── */
.lp-section {
  padding-top: clamp(4rem, 9vw, 7rem);
  text-align: center;
}
.lp-h2 {
  font-size: clamp(1.75rem, 1.2rem + 2vw, 2.5rem);
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.03em;
  text-wrap: balance;
}
.lp-lead {
  margin: 0.875rem auto 0;
  max-width: 34rem;
  font-size: 0.875rem;
  line-height: 1.7;
  color: var(--lp-muted);
  text-wrap: balance;
  word-break: keep-all;
}

/* ── 分頁 ── */
.lp-tabs {
  display: inline-flex;
  max-width: 100%;
  margin-top: 2rem;
  padding: 0.25rem;
  gap: 0.25rem;
  overflow-x: auto;
  border: 1px solid var(--lp-line);
  border-radius: 999px;
  background: var(--lp-raised);
  scrollbar-width: none;
}
.lp-tab {
  flex-shrink: 0;
  padding: 0.625rem 1.5rem;
  border-radius: 999px;
  font-size: 0.875rem;
  color: var(--lp-muted);
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
}
.lp-tab:hover {
  color: var(--lp-text);
}
.lp-tab.is-active {
  background: var(--lp-accent);
  color: var(--lp-on-accent);
  font-weight: 500;
}

/* ── 產品畫面 ── */
.lp-showcase {
  display: grid;
  gap: 2rem;
  margin-top: 2.5rem;
  text-align: left;
  align-items: center;
}
@media (min-width: 1024px) {
  .lp-showcase {
    grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr);
    gap: 3.5rem;
  }
}
.lp-frame {
  margin: 0;
}
/* 厚邊框的「螢幕」：外框比內圖圓角大一圈，像參考圖的圓角機身 */
.lp-frame__screen {
  --bezel: 0.75rem;
  --frame-r: 1.5rem;
  padding: var(--bezel);
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: var(--frame-r);
  background: #1a1a1e;
  box-shadow:
    0 1px 0 rgb(255 255 255 / 0.06) inset,
    0 40px 80px -40px rgb(0 0 0 / 0.9),
    0 30px 90px -50px rgb(255 184 0 / 0.25);
}
.lp-frame__screen img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  object-position: top left;
  border-radius: calc(var(--frame-r) - var(--bezel));
  border: 1px solid rgb(0 0 0 / 0.6);
}
@media (min-width: 640px) {
  .lp-frame__screen {
    --bezel: 1.5rem;
    --frame-r: 2.75rem;
  }
}
.lp-frame figcaption {
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: var(--lp-muted);
  text-align: center;
}
.lp-showcase__copy h3 {
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: -0.02em;
}
.lp-showcase__copy ul {
  margin-top: 1.25rem;
  display: grid;
  gap: 0.875rem;
}
.lp-showcase__copy li {
  position: relative;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--lp-muted);
}
.lp-showcase__copy li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--lp-accent);
}

/* 捲動進場（class 由 v-reveal 加上；沒加就是原樣可見）
   up：標題、文字、卡片往上浮現；zoom：截圖外框與收尾面板由略小放大；side：說明欄由右滑入 */
/* 起始狀態保留半透明、輕微模糊，不是全隱形 */
.lp-reveal {
  opacity: 0.25;
  filter: blur(4px);
  transition:
    opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) var(--lp-delay, 0ms),
    transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) var(--lp-delay, 0ms),
    filter 0.9s cubic-bezier(0.16, 1, 0.3, 1) var(--lp-delay, 0ms);
}
.lp-reveal--up {
  transform: translateY(24px);
}
.lp-reveal--zoom {
  transform: translateY(32px) scale(0.96);
  filter: none; /* 截圖不模糊，只放大 */
  transition-duration: 1.2s;
}
.lp-reveal--side {
  transform: translateX(24px);
}
.lp-reveal.is-in {
  opacity: 1;
  filter: none;
  transform: none;
}

/* 分頁切換：淡出淡入＋輕微模糊 */
.lp-swap-enter-active,
.lp-swap-leave-active {
  transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), filter 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.lp-swap-enter-from,
.lp-swap-leave-to {
  opacity: 0;
  filter: blur(6px);
  transform: translateY(6px);
}
@media (prefers-reduced-motion: reduce) {
  .lp-swap-enter-active,
  .lp-swap-leave-active {
    transition: opacity 0.15s linear;
  }
  .lp-swap-enter-from,
  .lp-swap-leave-to {
    filter: none;
    transform: none;
  }
}

/* ── 功能卡片 ── */
.lp-grid {
  display: grid;
  gap: 1rem;
  margin-top: 2.5rem;
  text-align: left;
}
@media (min-width: 640px) {
  .lp-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1024px) {
  .lp-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.lp-card {
  padding: 1.5rem;
  border: 1px solid var(--lp-line);
  border-radius: 1.25rem;
  background: linear-gradient(180deg, var(--lp-raised-2), var(--lp-raised));
  box-shadow: 0 1px 0 rgb(255 255 255 / 0.04) inset;
  transition: border-color 0.2s;
}
.lp-card:hover {
  border-color: var(--lp-line-strong);
}
/* 卡片自己的 transition 會蓋掉進場的，合併成一條 */
.lp-card.lp-reveal {
  transition:
    opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) var(--lp-delay, 0ms),
    transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) var(--lp-delay, 0ms),
    filter 0.9s cubic-bezier(0.16, 1, 0.3, 1) var(--lp-delay, 0ms),
    border-color 0.2s;
}
.lp-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--lp-line-strong);
  border-radius: 50%;
  background: rgb(255 255 255 / 0.03);
  color: var(--lp-accent);
}
.lp-badge .pi {
  font-size: 1rem;
}
.lp-card h3 {
  margin-top: 1.25rem;
  font-size: 1rem;
  font-weight: 500;
}
.lp-card p {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--lp-muted);
}

/* ── 收尾 ── */
.lp-cta {
  margin-top: clamp(5rem, 10vw, 8rem);
  padding: clamp(3.5rem, 7vw, 5rem) 1.5rem;
  text-align: center;
  border: 1px solid var(--lp-line);
  border-radius: 2rem;
  background: radial-gradient(ellipse 70% 90% at 50% 120%, rgb(255 184 0 / 0.16), transparent 70%), var(--lp-raised);
}
.lp-footer {
  padding-block: 3rem 2.5rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--lp-muted);
}
</style>
