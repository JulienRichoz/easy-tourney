<!-- frontend/src/components/ButtonComponent.vue -->
<template>
  <button :type="nativeType" :class="buttonClasses" @click="onClick">
    <component v-if="icon" :is="icon" class="w-5 h-5 mr-1 inline-block" />
    <slot />
  </button>
</template>

<script>
  import { TrashIcon, PencilIcon } from '@heroicons/vue/24/outline';

  export default {
    props: {
      variant: {
        type: String,
        default: 'primary',
      },
      icon: {
        type: String,
        default: null,
      },
      nativeType: {
        type: String,
        default: 'button', // Par défaut un bouton classique
      },
    },
    components: {
      TrashIcon,
      PencilIcon,
    },
    computed: {
      buttonClasses() {
        switch (this.variant) {
          case 'primary':
            return 'ml-1 mr-1 sm:ml-4 sm:mr-2 px-2 sm:px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition shadow-md';
          case 'secondary':
            return 'ml-1 mr-1 sm:ml-4 sm:mr-2 px-2 sm:px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-all';
          case 'danger':
            return 'ml-1 mr-1 sm:ml-4 sm:mr-2 px-2 sm:px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition';
          case 'warning':
            return 'ml-1 mr-1 sm:ml-4 sm:mr-2 px-2 sm:px-4 py-2 bg-yellow-500 text-white rounded-md shadow-md hover:bg-yellow-600 transition-all';
          case 'gray':
            return 'ml-1 mr-1 sm:ml-4 sm:mr-2 px-2 sm:px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed';
          default:
            return 'ml-1 mr-1 sm:ml-4 sm:mr-2 px-2 sm:px-4 py-2 bg-gray-500 text-white rounded-md shadow-md hover:bg-gray-600 transition-all';
        }
      },
    },
    methods: {
      onClick(event) {
        this.$emit('click', event);
      },
    },
  };
</script>

<style scoped>
  button {
    transition: transform 0.2s ease;
  }

  button:hover {
    transform: scale(1.05);
  }
</style>
