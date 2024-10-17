<!-- components/DeleteConfirmationModal.vue -->

<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
  >
    <div class="bg-white p-8 rounded-lg w-full max-w-md">
      <h2 class="text-2xl font-bold mb-4">{{ title }}</h2>
      <p class="mb-6">{{ message }}</p>
      <!-- Message supplémentaire pour hardDelete -->
      <p v-if="isHardDelete && hardDeleteMessage" class="mb-4 text-red-600">
        {{ hardDeleteMessage }}
      </p>

      <!-- Si hardDelete est activé, afficher le champ de confirmation -->
      <div v-if="isHardDelete" class="mb-4">
        <label class="block text-gray-700 font-semibold mb-2">
          Tapez "CONFIRM" pour confirmer
        </label>
        <input
          type="text"
          v-model="confirmationText"
          class="w-full p-2 border border-gray-300 rounded-md"
          placeholder="CONFIRM"
        />
      </div>

      <div class="flex justify-end space-x-4">
        <ButtonComponent variant="secondary" @click="onCancel">
          Annuler
        </ButtonComponent>
        <!-- Bouton suppression avec changement de couleur dynamique  -->
        <ButtonComponent
          :variant="
            isHardDelete
              ? confirmationText === 'CONFIRM'
                ? 'danger'
                : 'gray'
              : 'danger'
          "
          @click="onConfirm"
          :disabled="isHardDelete && confirmationText !== 'CONFIRM'"
        >
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
        default: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
      },
      isHardDelete: {
        type: Boolean,
        default: false,
      },
      hardDeleteMessage: {
        type: String,
        default:
          'Cette action est irréversible et entraîne des suppressions en cascade. Risque de pertes de données annexes.',
      },
    },
    data() {
      return {
        confirmationText: '', // Pour stocker le texte de confirmation
      };
    },
    methods: {
      onCancel() {
        this.$emit('cancel');
      },
      onConfirm() {
        this.$emit('confirm');
      },
    },
    watch: {
      isVisible(newVal) {
        if (!newVal) {
          this.confirmationText = ''; // Réinitialiser le texte de confirmation quand la modal est fermée
        }
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
