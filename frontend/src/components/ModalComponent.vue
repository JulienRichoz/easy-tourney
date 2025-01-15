<!-- ModalComponent.vue -->
<!-- Ce composant affiche une modal. -->
<!-- Il prend en paramètre un titre et un état pour savoir s'il doit être affiché. -->
<!-- C'est un socle pour afficher dedans un formulaire par exemple. -->
<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-light-modal-background dark:bg-dark-modal-background flex items-center justify-center z-50"
  >
    <div
      class="bg-light-modal-content dark:bg-dark-modal-content p-8 rounded-lg w-full max-w-md max-h-screen overflow-y-auto"
    >
      <slot name="header">
        <h2
          class="text-2xl font-bold mb-4 text-light-title dark:text-dark-title"
        >
          {{ title }}
        </h2>
      </slot>
      <slot name="content"></slot>
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script>
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
    watch: {
      // Écoute les changements de la propriété isVisible
      isVisible(newVal) {
        if (newVal) {
          // Modal ouverte
          window.dispatchEvent(new Event('modal-open'));
        } else {
          // Modal fermée
          window.dispatchEvent(new Event('modal-close'));
        }
      },
    },
    methods: {
      // Émet un événement pour indiquer au parent de fermer la modal
      close() {
        this.$emit('close'); // Émet un événement pour indiquer au parent de cacher la modal
      },
    },
  };
</script>

<style scoped>
  body.modal-open {
    overflow: hidden;
  }
</style>
