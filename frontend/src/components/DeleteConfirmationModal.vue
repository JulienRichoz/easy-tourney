<!-- frontend/src/components/DeleteConfirmationModal.vue -->
<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
  >
    <div class="bg-white p-8 rounded-lg w-full max-w-md">
      <h2 class="text-2xl font-bold mb-4">{{ title }}</h2>
      <p class="mb-6">{{ message }}</p>
      <div class="flex justify-end space-x-4">
        <ButtonComponent variant="secondary" @click="onCancel">
          Annuler
        </ButtonComponent>
        <ButtonComponent variant="danger" @click="onConfirm">
          Supprimer
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
        default: 'Confirmation de suppression',
      },
      message: {
        type: String,
        default:
          'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
      },
    },
    methods: {
      onCancel() {
        this.$emit('cancel');
      },
      onConfirm() {
        this.$emit('confirm');
      },
    },
  };
</script>

<style scoped>
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
  }
  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
</style>
