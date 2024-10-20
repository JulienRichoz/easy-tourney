<template>
  <div
    v-if="isVisible"
    @keydown.esc="close"
    class="fixed inset-0 bg-light-modal-background dark:bg-dark-modal-background flex items-center justify-center"
  >
    <div
      class="bg-light-modal-content dark:bg-dark-modal-content p-8 rounded-lg w-full max-w-md max-h-screen overflow-y-auto"
    >
      <slot name="header">
        <h2
          ref="myInput"
          class="text-2xl font-bold mb-4 text-light-title dark:text-dark-title"
        >
          {{ title }}
        </h2>
      </slot>
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script>
  import { ref, onMounted } from 'vue';
  export default {
    props: {
      isVisible: {
        type: Boolean,
        required: true,
      },
      title: {
        type: String,
        default: '',
      },
    },
    methods: {
      close() {
        this.$emit('close');
      },
    },
    setup() {
      // Utilisation de ref pour accéder à l'input
      const myInput = ref(null);

      // Fonction qui donne le focus à l'input
      const focusInput = () => {
        if (myInput.value) {
          myInput.value.focus();
        }
      };

      // Donne automatiquement le focus lors du montage du composant
      onMounted(() => {
        focusInput();
      });

      return {
        myInput,
        focusInput,
      };
    },
  };
</script>

<style scoped>
  /* Styles gérés par Tailwind CSS */
</style>
