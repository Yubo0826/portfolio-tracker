<template>
  <nav class="header-nav">
    <div
      v-for="link in navLinks"
      :key="link.key"
      class="header-nav__item"
      @mouseenter="activeMenu = link.key"
      @mouseleave="activeMenu = null"
    >
      <button
        type="button"
        class="header-nav__trigger"
        :class="{ 'is-active': isActive(link) }"
        :aria-expanded="link.hasMenu ? activeMenu === link.key : undefined"
        @click="handleLinkClick(link)"
      >
        <span>{{ link.label }}</span>
        <i
          v-if="link.hasMenu"
          class="pi pi-chevron-down header-nav__chevron"
          :class="{ 'is-open': activeMenu === link.key }"
        ></i>
      </button>

      <transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div
          v-if="link.hasMenu && activeMenu === link.key"
          class="header-nav__menu"
        >
          <button
            v-for="item in link.menuItems"
            :key="item.key"
            type="button"
            class="header-nav__menu-item"
            :class="{ 'is-active': isActive(item) }"
            @click="go(item.to)"
          >
            <i v-if="item.icon" :class="[item.icon, 'header-nav__menu-icon']"></i>
            <span>{{ item.label }}</span>
          </button>
        </div>
      </transition>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { buildHeaderNavItems } from './navigation.js'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const activeMenu = ref(null)

const navLinks = computed(() => buildHeaderNavItems(t))

const go = (to) => {
  activeMenu.value = null
  router.push(to)
}

const handleLinkClick = (link) => {
  if (!link.hasMenu) {
    go(link.to)
    return
  }
  if (activeMenu.value !== link.key) {
    activeMenu.value = link.key
    return
  }
  go(link.to)
}

// 與側邊欄一致的作用中判斷（支援子路徑）
const isActive = (item) =>
  item.activePaths.some((path) => route.path === path || route.path.startsWith(`${path}/`))

watch(() => route.path, () => {
  activeMenu.value = null
})
</script>

<style scoped>
/* display 交由外層的 hidden / lg:flex 決定，避免與 Tailwind 工具類互相覆蓋 */
.header-nav {
  align-items: center;
  gap: 0.125rem;
  height: 100%;
}

.header-nav__item {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
}

.header-nav__trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.25rem;
  padding: 0 0.75rem;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  white-space: nowrap;
  color: var(--p-text-muted-color);
  cursor: pointer;
  transition: color 0.16s ease;
}

/* hover 底線：進場由左至右展開，離場由右至左收合並淡出 */
.header-nav__trigger::after {
  content: '';
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: 0;
  height: 2px;
  border-radius: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left center;
  opacity: 0;
  transition:
    transform 0.22s cubic-bezier(0.4, 0, 1, 1),
    opacity 0.22s ease-in;
}

.header-nav__trigger:hover::after,
.header-nav__trigger:focus-visible::after {
  transform: scaleX(1);
  opacity: 1;
  transition:
    transform 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.14s ease-out;
}

.header-nav__trigger:hover {
  color: var(--p-text-color);
}

.header-nav__trigger.is-active {
  color: var(--p-primary-color);
  font-weight: 600;
}

.header-nav__trigger.is-active::after {
  background: var(--p-primary-color);
  transform: scaleX(1);
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .header-nav__trigger::after,
  .header-nav__trigger:hover::after {
    transition-duration: 0.01ms;
  }
}

.header-nav__chevron {
  font-size: 0.6rem;
  transition: transform 0.16s ease;
}

.header-nav__chevron.is-open {
  transform: rotate(180deg);
}

.header-nav__menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 60;
  min-width: 13rem;
  padding: 0.375rem;
  border: 1px solid var(--p-overlay-popover-border-color);
  border-radius: 0.9rem;
  background: var(--p-overlay-popover-background);
  box-shadow: 0 22px 44px rgba(0, 0, 0, 0.12);
}

.dark .header-nav__menu {
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.48);
}

.header-nav__menu-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: none;
  border-radius: 0.6rem;
  background: none;
  font-family: inherit;
  font-size: 0.85rem;
  text-align: left;
  color: var(--p-text-color);
  cursor: pointer;
  transition: background-color 0.14s ease, color 0.14s ease;
}

.header-nav__menu-item:hover {
  background: color-mix(in srgb, var(--p-text-color) 6%, transparent);
}

.header-nav__menu-item.is-active {
  background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
  color: var(--p-primary-color);
}

.header-nav__menu-icon {
  width: 1rem;
  font-size: 0.875rem;
  text-align: center;
  color: var(--p-text-muted-color);
  flex-shrink: 0;
}

.header-nav__menu-item.is-active .header-nav__menu-icon {
  color: inherit;
}
</style>
