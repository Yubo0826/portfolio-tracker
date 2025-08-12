<template>
  <div class="flex justify-center flex-wrap">
    <!-- <Button @click="$router.go(-1)">Back</Button> -->
    <Card class="w-2/3 mb-8">
      <template #content>
        <HistoricalPriceChart :symbol="symbol" />
      </template>
    </Card>
    <Card class="w-2/3 mb-8">
      <template #content>
        <KLineChart :symbol="symbol" />
      </template>
    </Card>
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
  