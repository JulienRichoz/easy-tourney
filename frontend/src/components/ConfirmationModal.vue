<!-- components/ConfirmationModal.vue -->
<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-light-modal-background z-50 dark:bg-dark-modal-background flex items-center justify-center"
    tabindex="0"
    @keydown.enter="handleConfirm"
  >
    <div
      class="bg-light-modal-content dark:bg-dark-modal-content p-8 rounded-lg w-full max-w-md"
    >
      <h2 class="text-2xl font-bold mb-4 text-light-title dark:text-dark-title">
        {{ title }}
      </h2>
      <p class="mb-6 text-light-form-text dark:text-dark-form-text">
        {{ message }}
      </p>
      <div class="flex justify-end space-x-4">
        <ButtonComponent variant="secondary" @click="handleCancel">
          Annuler
        </ButtonComponent>
        <ButtonComponent variant="success" @click="handleConfirm">
          Confirmer
        </ButtonComponent>
      </div>
    </div>
  </div>
</template>

<script>
  import ButtonComponent from '@/components/ButtonComponent.vue';

  export default {
    components: {
      ButtonComponent,
    },
    props: {
      isVisible: {
        type: Boolean,
        required: true,
      },
      title: {
        type: String,
        default: 'Confirmation',
      },
      message: {
        type: String,
        default: 'Êtes-vous sûr de vouloir effectuer cette action ?',
      },
    },
    methods: {
      handleCancel() {
        this.$emit('cancel');
      },
      handleConfirm() {
        this.$emit('confirm');
      },
    },
  };
</script>

<style scoped>
  /* Styles gérés par Tailwind CSS */
</style>
