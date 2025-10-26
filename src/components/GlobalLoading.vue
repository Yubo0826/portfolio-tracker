<template>
    <div
      v-if="visible"
      class="fixed inset-0 opacity-75 flex flex-col items-center justify-center z-50 transition-opacity duration-300"
      :style="{ background: 'var(--p-surface-800)' }"
    >
      <div class="snippet" data-title="dot-falling">
        <div class="stage">
          <div class="dot-falling"></div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref } from "vue";
  
  export const globalLoadingVisible = ref(false); // 對外暴露
  
  export default {
    name: "GlobalLoading",
    setup() {
      return { visible: globalLoadingVisible };
    }
  };
  </script>
  <style scoped>
    .dot-falling {
      position: relative;
      left: -9999px;
      width: 10px;
      height: 10px;
      border-radius: 5px;
      /* background-color: #9880ff; */
      background-color: var(--p-primary-color);
      color: var(--p-primary-color);
      box-shadow: 9999px 0 0 0 var(--p-primary-color);
      animation: dot-falling 1s infinite linear;
      animation-delay: 0.1s;
    }
    .dot-falling::before, .dot-falling::after {
      content: "";
      display: inline-block;
      position: absolute;
      top: 0;
    }
    .dot-falling::before {
      width: 10px;
      height: 10px;
      border-radius: 5px;
      background-color: var(--p-primary-color);
      color: var(--p-primary-color);
      animation: dot-falling-before 1s infinite linear;
      animation-delay: 0s;
    }
    .dot-falling::after {
      width: 10px;
      height: 10px;
      border-radius: 5px;
      background-color: var(--p-primary-color);
      color: var(--p-primary-color);
      animation: dot-falling-after 1s infinite linear;
      animation-delay: 0.2s;
    }

    @keyframes dot-falling {
      0% {
        box-shadow: 9999px -15px 0 0 rgba(152, 128, 255, 0);
      }
      25%, 50%, 75% {
        box-shadow: 9999px 0 0 0 var(--p-primary-color);
      }
      100% {
        box-shadow: 9999px 15px 0 0 rgba(152, 128, 255, 0);
      }
    }
    @keyframes dot-falling-before {
      0% {
        box-shadow: 9984px -15px 0 0 rgba(152, 128, 255, 0);
      }
      25%, 50%, 75% {
        box-shadow: 9984px 0 0 0 var(--p-primary-color);
      }
      100% {
        box-shadow: 9984px 15px 0 0 rgba(152, 128, 255, 0);
      }
    }
    @keyframes dot-falling-after {
      0% {
        box-shadow: 10014px -15px 0 0 rgba(152, 128, 255, 0);
      }
      25%, 50%, 75% {
        box-shadow: 10014px 0 0 0 var(--p-primary-color);
      }
      100% {
        box-shadow: 10014px 15px 0 0 rgba(152, 128, 255, 0);
      }
    }

  </style>
  