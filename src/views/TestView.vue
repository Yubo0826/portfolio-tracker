<script setup>
import { ref } from 'vue';

const openDropdown = ref(null);

const toggleDropdown = (menu) => {
  console.log('Toggling menu:', menu);
  openDropdown.value = openDropdown.value === menu ? null : menu;
};

const closeDropdown = () => {
  openDropdown.value = null;
};
</script>

<template>
  <header class="bg-white shadow">
    <nav class="container mx-auto px-4 py-4 flex justify-between items-center">
      <div class="flex items-center space-x-8">
        <a href="#" class="text-gray-800 hover:text-indigo-600 font-medium">Home</a>

        <div class="relative">
          <button @mouseenter="toggleDropdown('products')" @mouseleave="closeDropdown" class="flex items-center space-x-1 text-gray-800 hover:text-indigo-600 font-medium focus:outline-none">
            <span>Products</span>
            <svg class="h-4 w-4 transform transition-transform duration-300" :class="{ 'rotate-180': openDropdown === 'products' }" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          
          <transition 
            enter-active-class="transition ease-out duration-200"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <div v-show="openDropdown === 'products'" @mouseleave="closeDropdown" class="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div class="py-1">
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Product A</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Product B</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Product C</a>
              </div>
            </div>
          </transition>
        </div>

        <div class="relative">
          <button @mouseenter="toggleDropdown('resources')" @mouseleave="closeDropdown" class="flex items-center space-x-1 text-gray-800 hover:text-indigo-600 font-medium focus:outline-none">
            <span>Resources</span>
            <svg class="h-4 w-4 transform transition-transform duration-300" :class="{ 'rotate-180': openDropdown === 'resources' }" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          <transition 
            enter-active-class="transition ease-out duration-200"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <div v-show="openDropdown === 'resources'" @mouseleave="closeDropdown" class="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div class="py-1">
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Resource 1</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Resource 2</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Resource 3</a>
              </div>
            </div>
          </transition>
        </div>

        <a href="#" class="text-gray-800 hover:text-indigo-600 font-medium">Pricing</a>
      </div>
    </nav>
  </header>
</template>