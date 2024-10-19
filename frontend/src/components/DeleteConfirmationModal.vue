<!-- src/components/DeleteConfirmationModal.vue -->
<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-light-modal-background dark:bg-dark-modal-background flex items-center justify-center"
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
      <!-- Message supplémentaire pour hardDelete -->
      <p
        v-if="isHardDelete && hardDeleteMessage"
        class="mb-4 text-light-form-error dark:text-dark-form-error"
      >
        {{ hardDeleteMessage }}
      </p>

      <!-- Si hardDelete est activé, afficher le champ de confirmation -->
      <div v-if="isHardDelete" class="mb-4">
        <label
          class="block text-light-form-text dark:text-dark-form-text font-semibold mb-2 flex items-center"
        >
          Tapez "CONFIRM" pour confirmer
        </label>
        <input
          type="text"
          v-model="confirmationText"
          class="w-full p-2 border border-light-form-border-default dark:border-dark-form-border-default rounded-md bg-light-form-background dark:bg-dark-form-background text-light-form-text dark:text-dark-form-text"
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
  /* Styles gérés par Tailwind CSS */
</style>
