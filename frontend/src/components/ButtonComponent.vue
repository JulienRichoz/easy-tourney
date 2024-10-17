<!-- components/ButtonComponent.vue -->

<template>
  <button
    :type="nativeType"
    :class="[
      'ml-1 mr-1 sm:ml-4 sm:mr-2 px-2 sm:px-4 py-2 font-semibold rounded-md shadow-md transition-all',
      variantClasses,
      disabled ? 'opacity-50 cursor-not-allowed' : '',
    ]"
    :disabled="disabled"
  >
    <component
      v-if="icon"
      :is="icons[icon]"
      class="w-5 h-5 mr-1 inline-block"
    />
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
        default: 'button',
      },
      disabled: {
        type: Boolean,
        default: false,
      },
    },
    computed: {
      variantClasses() {
        const variants = {
          primary: 'bg-green-600 text-white hover:bg-green-700',
          secondary: 'bg-gray-500 text-white hover:bg-gray-600',
          danger: 'bg-red-500 text-white hover:bg-red-600',
          warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
          gray: 'bg-gray-400 text-white cursor-not-allowed',
        };
        return variants[this.variant] || variants.primary;
      },
    },
    data() {
      return {
        icons: {
          TrashIcon,
          PencilIcon,
        },
      };
    },
  };
</script>
