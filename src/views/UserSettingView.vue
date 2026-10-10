<template>
  <div class="preferences">
    <p class="preferences__intro">{{ t('notifications.intro') }}</p>

    <!-- 1. 通知信箱 -->
    <section class="pref-section">
      <div class="pref-section__head">
        <h2 class="pref-section__title">{{ t('notifications.email.label') }}</h2>
        <p class="pref-section__desc">{{ t('notifications.email.desc') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <span class="font-medium">{{ auth.user?.email }}</span>
        <Button
          :label="t('notifications.email.test')"
          icon="pi pi-send"
          severity="secondary"
          size="small"
          :loading="sending"
          @click="sendEmail"
        />
      </div>
    </section>

    <div class="pref-divider"></div>

    <!-- 2. 各投資組合的偏移警示（drift_threshold / enable_email_alert 存在 portfolios 表） -->
    <section class="pref-section">
      <div class="pref-section__head">
        <h2 class="pref-section__title">{{ t('notifications.drift.label') }}</h2>
        <p class="pref-section__desc">{{ t('emailAlertHint') }}</p>
      </div>

      <p v-if="!rows.length" class="pref-section__desc">{{ t('notifications.drift.empty') }}</p>

      <div v-else class="drift-list">
        <div v-for="row in rows" :key="row.id" class="drift-row">
          <span class="drift-row__name">{{ row.name }}</span>
          <InputNumber
            v-model="row.drift_threshold"
            :min="0"
            :max="100"
            :step="0.5"
            :minFractionDigits="0"
            :maxFractionDigits="2"
            suffix="%"
            showButtons
            :inputId="`drift-${row.id}`"
            :aria-label="`${row.name} ${t('driftThreshold')}`"
            inputClass="w-24"
            :disabled="!row.enable_email_alert"
          />
          <ToggleSwitch v-model="row.enable_email_alert" :aria-label="`${row.name} ${t('emailAlert')}`" />
        </div>
      </div>

      <div v-if="rows.length">
        <Button :label="t('save')" :disabled="!dirty.length" :loading="saving" @click="save" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ToggleSwitch from 'primevue/toggleswitch'
import api from '@/utils/api.js'
import * as toast from '@/composables/toast'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'

const { t } = useI18n()
const auth = useAuthStore()
const portfolioStore = usePortfolioStore()

// 編輯用的本地副本；store 更新（例如儲存後）時重新同步
const pick = (p) => ({ id: p.id, name: p.name, description: p.description, drift_threshold: p.drift_threshold ?? 5, enable_email_alert: p.enable_email_alert ?? true })
const rows = ref([])
watch(() => portfolioStore.portfolios, (list) => { rows.value = (list || []).map(pick) }, { immediate: true, deep: true })

const dirty = computed(() => rows.value.filter((row) => {
  const orig = pick(portfolioStore.portfolios.find((p) => p.id === row.id) || {})
  return row.drift_threshold !== orig.drift_threshold || row.enable_email_alert !== orig.enable_email_alert
}))

const saving = ref(false)
const save = async () => {
  saving.value = true
  // ponytail: editPortfolio 內部吞掉錯誤只 console.error，這裡無法得知個別失敗；要精確回報需讓它 rethrow
  await Promise.all(dirty.value.map(({ id, ...data }) => portfolioStore.editPortfolio(id, data)))
  saving.value = false
  toast.success(t('settingsSaved'))
}

const sending = ref(false)
const sendEmail = async () => {
  sending.value = true
  try {
    await api.post('/api/user/send-test-email', { to: auth.user?.email })
    toast.success(t('notifications.email.sent'))
  } catch (e) {
    toast.error(t('notifications.email.error'))
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.preferences {
  max-width: 62rem;
}

.preferences__intro {
  margin-bottom: 2rem;
  font-size: 0.9rem;
  color: var(--p-text-muted-color);
}

.pref-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.pref-section__title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--p-text-color);
}

.pref-section__desc {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
}

.pref-divider {
  height: 1px;
  background: var(--p-content-border-color);
  margin: 1.5rem 0;
}

.drift-list {
  max-width: 36rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.75rem;
  overflow: hidden;
}

.drift-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--p-surface-card);
}

.drift-row + .drift-row {
  border-top: 1px solid var(--p-content-border-color);
}

.drift-row__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}
</style>
