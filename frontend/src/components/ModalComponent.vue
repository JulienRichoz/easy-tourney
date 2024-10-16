<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
  >
    <div
      class="bg-white p-8 rounded-lg w-full max-w-md max-h-screen overflow-y-auto"
    >
      <slot name="header">
        <h2 class="text-2xl font-bold mb-4">{{ title }}</h2>
      </slot>
      <slot name="content"></slot>
      <div class="flex justify-between mt-4">
        <ButtonComponent
          variant="secondary"
          nativeType="button"
          @click="onCancel"
        >
          Annuler
        </ButtonComponent>
        <ButtonComponent
          :variant="!isFormValid ? 'gray' : confirmButtonVariant || 'primary'"
          nativeType="submit"
          @click="onSubmit"
          :disabled="!isFormValid"
        >
          {{ confirmButtonText || (isEditing ? 'Modifier' : 'Ajouter') }}
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
        default: '',
      },
      isEditing: {
        type: Boolean,
        default: false,
      },
      confirmButtonText: {
        type: String,
        default: '', // Par défaut vide pour utiliser 'Ajouter' ou 'Modifier'
      },
      confirmButtonVariant: {
        type: String,
        default: 'primary', // Variante du bouton par défaut
      },
      isFormValid: {
        type: Boolean,
        default: false, // Contrôle l'état du bouton (désactivé si false)
      },
    },
    methods: {
      onCancel() {
        this.$emit('close');
      },
      onSubmit() {
        this.$emit('submit');
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
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
</style>
