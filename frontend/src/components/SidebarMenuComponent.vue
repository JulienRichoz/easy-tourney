<template>
  <div>
    <!-- Bouton pour ouvrir/fermer le menu -->
    <button
      @click="toggleSidebar"
      class="fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700"
    >
      <span v-if="isOpen" class="fas fa-times"></span>
      <span v-else class="fas fa-bars"></span>
    </button>

    <!-- Menu latéral -->
    <transition name="slide">
      <div
        v-if="isOpen"
        class="fixed left-0 top-0 h-full w-64 bg-gray-800 text-white shadow-lg z-40"
      >
        <div class="p-4">
          <h2 class="text-lg font-bold mb-4">Menu Planning</h2>
          <ul class="space-y-2">
            <li v-for="item in menuItems" :key="item.id">
              <button
                @click="navigateTo(item.route)"
                class="w-full text-left px-4 py-2 rounded hover:bg-gray-700"
              >
                {{ item.label }}
              </button>
            </li>
          </ul>
          <hr class="my-4 border-gray-600" />
          <div v-if="options.length">
            <h3 class="text-md font-semibold mb-2">Options</h3>
            <ul class="space-y-2">
              <li v-for="option in options" :key="option.id">
                <button
                  @click="option.action"
                  class="w-full text-left px-4 py-2 rounded hover:bg-gray-700"
                >
                  {{ option.label }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
  export default {
    props: {
      menuItems: {
        type: Array,
        required: true,
      },
      options: {
        type: Array,
        default: () => [],
      },
    },
    data() {
      return {
        isOpen: false, // État d'ouverture/fermeture du menu
      };
    },
    methods: {
      toggleSidebar() {
        this.isOpen = !this.isOpen;
      },
      navigateTo(route) {
        this.$router.push(route);
        this.isOpen = false; // Fermer le menu après navigation
      },
    },
  };
</script>

<style scoped>
  /* Animation de glissement pour l'ouverture/fermeture */
  .slide-enter-active,
  .slide-leave-active {
    transition: transform 0.3s ease;
  }
  .slide-enter {
    transform: translateX(-100%);
  }
  .slide-leave-to {
    transform: translateX(-100%);
  }
</style>
