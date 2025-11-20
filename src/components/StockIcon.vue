<template>
    <img
      :src="imageSrc"
      @error="handleImageError"
      class="w-8 h-8 mr-2"
    />
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  
  const props = defineProps<{
    symbol: string
  }>();
  
  const imageSrc = ref(`https://storage.googleapis.com/iex/api/logos/${props.symbol}.png`);
  const defaultImage = 'https://cdn-icons-png.flaticon.com/512/5108/5108750.png'; // 替換成您的預設圖片路徑
  
  const handleImageError = () => {
    imageSrc.value = defaultImage;
  };
  </script>