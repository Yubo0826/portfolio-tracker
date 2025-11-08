<template>
  <nav class="navbar">
    <ul>
      <li 
        v-for="(item, index) in menuItems" 
        :key="index" 
        @mouseenter="handleMouseEnter(index)" 
        @mouseleave="handleMouseLeave"
        :class="{ active: activeIndex === index }"
      >
        {{ item }}
        <div v-if="activeIndex === index" class="dropdown">
          Dropdown Content for {{ item }}
        </div>
      </li>
    </ul>
  </nav>
</template>

<script>
export default {
  data() {
    return {
      menuItems: ["Home", "About", "Services", "Contact"],
      activeIndex: null, // Tracks the currently hovered menu item
    };
  },
  methods: {
    handleMouseEnter(index) {
      this.activeIndex = index; // Set the active index on mouseenter
    },
    handleMouseLeave() {
      this.activeIndex = null; // Reset the active index on mouseleave
    },
  },
};
</script>

<style scoped>
.navbar {
  background-color: #333;
  padding: 10px;
}

.navbar ul {
  list-style: none;
  display: flex;
  gap: 20px;
  margin: 0;
  padding: 0;
}

.navbar li {
  color: white;
  cursor: pointer;
  position: relative;
}

.navbar li.active {
  font-weight: bold;
  color: #ffd700;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  color: black;
  padding: 10px;
  border: 1px solid #ccc;
  z-index: 10;
}
</style>
