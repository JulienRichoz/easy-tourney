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
    <!-- Gérer FontAwesome ou HeroIcons selon le type d'icône -->
    <font-awesome-icon
      v-if="fontAwesomeIcon"
      :icon="['fas', fontAwesomeIcon]"
      class="w-5 h-5 mr-1 inline-block"
    />
    <component
      v-if="heroIcon"
      :is="icons[heroIcon]"
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
      heroIcon: {
        type: String,
        default: null, // Utilisé pour HeroIcons
      },
      fontAwesomeIcon: {
        type: String,
        default: null, // Utilisé pour FontAwesome
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
          primary:
            'bg-light-buttonVariants-primary-default dark:bg-dark-buttonVariants-primary-default text-white hover:bg-light-buttonVariants-primary-hover dark:hover:bg-dark-buttonVariants-primary-hover',
          secondary:
            'bg-light-buttonVariants-secondary-default dark:bg-dark-buttonVariants-secondary-default text-white hover:bg-light-buttonVariants-secondary-hover dark:hover:bg-dark-buttonVariants-secondary-hover',
          danger:
            'bg-light-buttonVariants-danger-default dark:bg-dark-buttonVariants-danger-default text-white hover:bg-light-buttonVariants-danger-hover dark:hover:bg-dark-buttonVariants-danger-hover',
          warning:
            'bg-light-buttonVariants-warning-default dark:bg-dark-buttonVariants-warning-default text-white hover:bg-light-buttonVariants-warning-hover dark:hover:bg-dark-buttonVariants-warning-hover',
          gray: 'bg-light-buttonVariants-disabled-default dark:bg-dark-buttonVariants-disabled-default text-white',
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
