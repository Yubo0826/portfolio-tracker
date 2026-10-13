<template>
  <div class="guide">
    <!-- 左側目錄（GitLab Docs 風格） -->
    <nav class="guide-nav" :aria-label="L(guide.ui.root)">
      <div v-for="(group, gi) in guide.groups" :key="gi" class="guide-nav__group">
        <button
          type="button"
          class="guide-nav__group-btn"
          :aria-expanded="!collapsed[gi]"
          @click="collapsed[gi] = !collapsed[gi]"
        >
          {{ L(group.label) }}
          <i class="pi" :class="collapsed[gi] ? 'pi-angle-right' : 'pi-angle-down'" aria-hidden="true"></i>
        </button>
        <div v-show="!collapsed[gi]" class="guide-nav__items">
          <RouterLink
            v-for="key in group.pages"
            :key="key"
            :to="{ query: { page: key } }"
            class="guide-nav__link"
            :class="{ 'is-active': key === pageKey }"
            :aria-current="key === pageKey ? 'page' : undefined"
          >{{ L(guide.pages[key].title) }}</RouterLink>
        </div>
      </div>
    </nav>

    <article class="guide-doc">
      <ol class="doc-crumbs">
        <li>{{ L(guide.ui.root) }}</li>
        <li>{{ L(group.label) }}</li>
        <li aria-current="page">{{ L(page.title) }}</li>
      </ol>

      <h1 class="doc-title">{{ L(page.title) }}</h1>

      <div v-if="page.to" class="doc-meta">
        <div><strong>{{ L(guide.ui.location) }}</strong>：{{ L(group.label) }} › {{ L(page.title) }}</div>
        <div>
          <strong>{{ L(guide.ui.openPage) }}</strong>：
          <RouterLink :to="page.to" class="doc-a">{{ page.to }}</RouterLink>
        </div>
      </div>

      <p>{{ L(page.intro) }}</p>

      <div v-if="page.note" class="doc-note">
        <i class="pi pi-info-circle" aria-hidden="true"></i>
        <p>{{ L(page.note) }}</p>
      </div>

      <section v-for="(section, si) in page.sections" :key="si">
        <h2 class="doc-h2">{{ L(section.title) }}</h2>
        <p v-if="section.text">{{ L(section.text) }}</p>
        <ol v-if="section.steps" class="doc-list doc-list--ol">
          <li v-for="(step, i) in section.steps" :key="i">{{ L(step) }}</li>
        </ol>
        <ul v-if="section.list" class="doc-list">
          <li v-for="(item, i) in section.list" :key="i">{{ L(item) }}</li>
        </ul>
      </section>

      <div class="doc-pager">
        <RouterLink v-if="prevKey" :to="{ query: { page: prevKey } }" class="doc-pager__link">
          <span class="doc-pager__hint">{{ L(guide.ui.prev) }}</span>
          <span><i class="pi pi-angle-left" aria-hidden="true"></i> {{ L(guide.pages[prevKey].title) }}</span>
        </RouterLink>
        <RouterLink v-if="nextKey" :to="{ query: { page: nextKey } }" class="doc-pager__link doc-pager__link--next">
          <span class="doc-pager__hint">{{ L(guide.ui.next) }}</span>
          <span>{{ L(guide.pages[nextKey].title) }} <i class="pi pi-angle-right" aria-hidden="true"></i></span>
        </RouterLink>
      </div>
    </article>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
// ponytail: 指南內容是長篇巢狀文件，直接讀 yaml 依語系取值，不塞進扁平化的 i18n key
import guide from '@/i18n/guide.yaml'

const route = useRoute()
const { locale } = useI18n()
const L = (text) => text?.[locale.value] ?? text?.zh

const order = guide.groups.flatMap((g) => g.pages)
// 網址 ?page=xxx 決定目前文件，無效值回到第一篇
const pageKey = computed(() => (order.includes(route.query.page) ? route.query.page : order[0]))
const page = computed(() => guide.pages[pageKey.value])
const group = computed(() => guide.groups.find((g) => g.pages.includes(pageKey.value)))
const prevKey = computed(() => order[order.indexOf(pageKey.value) - 1])
const nextKey = computed(() => order[order.indexOf(pageKey.value) + 1])

const collapsed = reactive({})
watch(pageKey, () => {
  collapsed[guide.groups.indexOf(group.value)] = false
  document.querySelector('.guide-doc')?.scrollIntoView({ block: 'start' })
})
</script>

<style scoped>
.guide {
  display: flex;
  gap: 3.5rem;
  max-width: 76rem;
}

/* 左側目錄 */
.guide-nav {
  position: sticky;
  top: 5rem;
  align-self: flex-start;
  width: 15rem;
  flex-shrink: 0;
  max-height: calc(100vh - 6rem);
  overflow-y: auto;
}

.guide-nav__group-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: none;
  border-radius: 0.375rem;
  background: none;
  font-size: 0.95rem;
  color: var(--p-text-color);
  text-align: left;
  cursor: pointer;
}

.guide-nav__group-btn:hover {
  background: var(--p-content-hover-background);
}

.guide-nav__items {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin: 0.125rem 0 0.5rem 0.75rem;
  padding-left: 0.5rem;
  border-left: 1px solid var(--p-content-border-color);
}

.guide-nav__link {
  position: relative;
  padding: 0.55rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  color: var(--p-text-color);
  text-decoration: none;
}

.guide-nav__link:hover {
  background: var(--p-content-hover-background);
}

.guide-nav__link.is-active {
  background: var(--p-content-hover-background);
}

.guide-nav__link.is-active::before {
  content: '';
  position: absolute;
  left: calc(-0.5rem - 2px);
  top: 0.4rem;
  bottom: 0.4rem;
  width: 3px;
  border-radius: 2px;
  background: var(--p-text-color);
}

/* 正文 */
.guide-doc {
  flex: 1;
  min-width: 0;
  max-width: 46rem;
  scroll-margin-top: 6rem;
  font-size: 1rem;
  line-height: 1.75;
  color: var(--p-text-color);
}

.guide-doc p {
  margin: 0 0 1rem;
}

.doc-crumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
}

.doc-crumbs li + li::before {
  content: '/';
  margin-right: 0.5rem;
}

.doc-crumbs li[aria-current] {
  font-weight: 600;
  color: var(--p-text-color);
}

.doc-title {
  margin-bottom: 1.5rem;
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.2;
}

.doc-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.5rem;
  font-size: 0.9rem;
}

.doc-a {
  color: var(--p-primary-color);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.doc-note {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  background: var(--p-content-hover-background);
}

.doc-note .pi {
  margin-top: 0.4rem;
  color: var(--p-text-muted-color);
}

.guide-doc .doc-note p {
  margin: 0;
}

.doc-h2 {
  margin: 2rem 0 0.75rem;
  font-size: 1.4rem;
  font-weight: 700;
}

.doc-list {
  margin: 0 0 1rem;
  padding-left: 1.5rem;
  list-style: disc;
}

.doc-list--ol {
  list-style: decimal;
}

.doc-list li + li {
  margin-top: 0.35rem;
}

/* 上一篇／下一篇 */
.doc-pager {
  display: flex;
  gap: 1rem;
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--p-content-border-color);
}

.doc-pager__link {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.5rem;
  color: var(--p-text-color);
  text-decoration: none;
}

.doc-pager__link:hover {
  border-color: var(--p-primary-color);
}

.doc-pager__link--next {
  align-items: flex-end;
  margin-left: auto;
}

.doc-pager__hint {
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
}

@media (max-width: 1023px) {
  .guide {
    flex-direction: column;
    gap: 1.5rem;
  }

  .guide-nav {
    position: static;
    width: 100%;
    max-height: none;
  }
}
</style>
