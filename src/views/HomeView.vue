<script setup lang="ts">
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore();
const router = useRouter();

// 如果有用戶登入，則設定 uid
if (auth.user) {
    router.push('/dashboard');
} else {
    console.log('No user is logged in');
}

watch(() => auth.user, (newUser) => {
  if (newUser) {
    router.push('/dashboard');
  }
})

</script>

<template>
  <main>
     請先登入
  </main>
</template>
