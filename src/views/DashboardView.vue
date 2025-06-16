
<template>
<div>
    <apexchart width="380" type="donut" :options="options" :series="series"></apexchart>
</div>
</template>
<script setup>
const options = {
    chart: {
        type: 'donut',
    },
    labels: ['Apple', 'Mango', 'Orange', 'Watermelon'],
    responsive: [{
        breakpoint: 480,
        options: {
            chart: {
                width: 400
            },
            legend: {
                position: 'bottom'
            }
        }
    }]
};
const series = [44, 55, 41, 17];
</script>