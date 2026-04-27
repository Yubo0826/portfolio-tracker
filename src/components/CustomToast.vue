<template>
  <Toast position="bottom-center" group="standard">
    <template #container="{ message, closeCallback }">
      <div
        class="flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[280px] max-w-[380px] shadow-xl transition-all duration-300"
        :class="
          dark
            ? 'bg-[#1C2533] border border-white/10 text-white'
            : 'bg-white border border-gray-200 text-gray-800'
        "
      >
        <!-- Icon badge -->
        <span
          class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          :class="iconBadgeClass(message.severity || message.type)"
        >
          <i class="text-sm" :class="iconClass(message.severity || message.type)"></i>
        </span>

        <!-- Message -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold leading-snug truncate">{{ message.summary }}</p>
          <p v-if="message.detail" class="text-xs mt-0.5 opacity-60 truncate">{{ message.detail }}</p>
        </div>

        <!-- Close button -->
        <button
          class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
          :class="
            dark
              ? 'text-gray-400 hover:text-white hover:bg-white/10'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
          "
          @click="closeCallback"
        >
          <i class="pi pi-times text-xs"></i>
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

function iconClass(type) {
  switch (type) {
    case 'success': return 'pi pi-check';
    case 'warn':    return 'pi pi-exclamation-triangle';
    case 'error':   return 'pi pi-times';
    case 'info':    return 'pi pi-info';
    default:        return 'pi pi-info';
  }
}

function iconBadgeClass(type) {
  if (props.dark) {
    switch (type) {
      case 'success': return 'bg-green-500/20 text-green-400';
      case 'warn':    return 'bg-yellow-500/20 text-yellow-400';
      case 'error':   return 'bg-red-500/20 text-red-400';
      default:        return 'bg-blue-500/20 text-blue-400';
    }
  } else {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-600';
      case 'warn':    return 'bg-yellow-100 text-yellow-600';
      case 'error':   return 'bg-red-100 text-red-600';
      default:        return 'bg-blue-100 text-blue-600';
    }
  }
}
</script>
