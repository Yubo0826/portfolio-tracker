<template>
  <Toast position="bottom-center" group="standard">
    <template #container="{ message, closeCallback  }">
      <div
        class="flex items-start gap-4 p-4 rounded-xl shadow-md transition-all duration-300 w-[300px]"
        :class="[
          message.type === 'success'
            ? (dark ? 'bg-green-900 text-white' : 'bg-white text-green-800')
            : message.type === 'warn'
              ? (dark ? 'bg-yellow-800 text-white' : 'bg-white text-yellow-800')
              : (dark ? 'bg-red-800 text-white' : 'bg-white text-red-800'),
          'border-l-4',
          {
            'border-green-500': message.type === 'success',
            'border-yellow-500': message.type === 'warn',
            'border-red-500': message.type === 'error',
          }
        ]"
      >
        <!-- Icon -->
        <i
          :class="[
            'pi text-xl mt-1',
            {
              'pi-check-circle': message.type === 'success',
              'pi-exclamation-circle': message.type === 'warn',
              'pi-times-circle': message.type === 'error'
            }
          ]"
        ></i>

        <!-- Content -->
        <div class="flex-1">
          <p class="font-semibold">
            {{ message.summary }}
          </p>
          <p class="text-sm opacity-80">
            {{ message.detail }}
          </p>
          <p class="text-xs mt-1 opacity-60">
            {{ new Date().toLocaleTimeString() }}
          </p>
        </div>

        <!-- Close Button -->
        <button
          class="text-gray-400 hover:text-gray-600 dark:hover:text-white"
          @click="closeCallback"
        >
          ✕
        </button>
      </div>
    </template>
  </Toast>
</template>

<script setup>
const props = defineProps({
  dark: {
    type: Boolean,
    default: false,
  },
});
</script>
