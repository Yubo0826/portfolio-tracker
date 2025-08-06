<template>
  <div class="max-w-100% m-1rem auto">
    <!-- <Button @click="$router.go(-1)">Back</Button> -->
    <HistoricalPriceChart :symbol="symbol" />
    <KLineChart :symbol="symbol" />
  </div>
</template>
  
<script setup>
// import { ref, onMounted } from 'vue'
// import api from '@/api'
import { useRoute  } from 'vue-router'
import KLineChart from '@/components/KLineChart.vue'
import HistoricalPriceChart from '@/components/HistoricalPriceChart.vue'

const route  = useRoute()
const symbol = route.params.symbol
</script>
  