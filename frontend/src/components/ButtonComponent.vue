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
            return 'bg-green-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-green-600 transition-all';
          case 'secondary':
            return 'bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-all';
          case 'danger':
            return 'bg-red-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-red-600 transition-all';
          case 'warning':
            return 'bg-yellow-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-yellow-600 transition-all';
          default:
            return 'bg-gray-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-gray-600 transition-all';
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
