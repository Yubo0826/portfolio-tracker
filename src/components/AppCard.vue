<template>
  <div class="app-card">
    <div v-if="$slots.header" class="app-card-header">
      <slot name="header" />
    </div>
    <div class="app-card-body">
      <div v-if="$slots.title || $slots.subtitle" class="app-card-caption">
        <div v-if="$slots.title" class="app-card-title">
          <slot name="title" />
        </div>
        <div v-if="$slots.subtitle" class="app-card-subtitle">
          <slot name="subtitle" />
        </div>
      </div>
      <div class="app-card-content">
        <slot name="content">
          <slot />
        </slot>
      </div>
      <div v-if="$slots.footer" class="app-card-footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<style>
.app-card {
  display: flex;
  flex-direction: column;
  background: var(--p-content-background);
  color: var(--p-text-color);
  border: 1px solid var(--p-content-border-color);
  border-radius: var(--p-border-radius-xl, 0.75rem);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
}

.app-card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
}

.app-card-caption {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.app-card-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.app-card-subtitle {
  color: var(--p-text-muted-color);
}

.app-card-content {
  flex: 1;
}
</style>
