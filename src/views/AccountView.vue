<template>
  <div class="max-w-md mx-auto mt-10">
    <Card class="p-6 shadow-lg rounded-2xl">
      <template #title>
        <h2 class="text-xl font-semibold text-gray-700">
          使用者設定
        </h2>
      </template>

      <template #content>
        <div class="flex flex-col gap-6">
          <!-- 偏移值設定 -->
          <div>
            <label class="block text-gray-600 mb-2 font-medium">投資組合偏移容忍值 (%)</label>
            <InputNumber
              v-model="threshold"
              mode="decimal"
              :min="0"
              :max="50"
              :step="0.1"
              suffix="%"
              class="w-full"
            />
            <small class="text-gray-500">
              當實際配置偏離超過此百分比時，系統會發出警示。
            </small>
          </div>

          <!-- 儲存按鈕 -->
          <Button
            label="儲存設定"
            icon="pi pi-save"
            class="w-full mt-4"
            @click="saveSettings"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import api from '@/utils/api.js';
import * as toast from '@/composables/toast';
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { useAuthStore } from "@/stores/auth";
const auth = useAuthStore();

const threshold = ref(0);

// 讀取現有設定
const loadSettings = async () => {
  try {
    const data = await api.get(`/api/user/settings?uid=${auth.user?.uid}`);
    console.log('Loaded settings:', data);
    threshold.value = parseFloat(data.settings.drift_threshold * 100) || 0;
  } catch (e) {
    toast.error(t('loadSettingsError'));
  }
};

// 儲存設定
const saveSettings = async () => {
  try {
    await api.put(`/api/user/settings`, {
      uid: auth.user?.uid,
      settings: {
        drift_threshold: threshold.value / 100,
      }
    });
    toast.success(t('settingsSaved'));
  } catch (e) {
    toast.error(t('saveSettingsError'));
  }
};

// 如果有用戶登入
if (auth.user) {
    loadSettings(); // 取得使用者設定
} else {
    console.log('No user is logged in');
}

// 監聽 auth.user 的變化，如果有用戶變化則取得使用者設定
watch(() => auth.user, (newUser) => {
    if (newUser) {
       loadSettings();
    }
})


</script>
