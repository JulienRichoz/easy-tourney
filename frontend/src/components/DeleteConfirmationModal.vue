<!-- DeleteConfirmationModal(Component).vue -->
<!-- Modal de confirmation pour la suppression d'un élément. -->
<!-- Il affiche un message de confirmation et un formulaire pour confirmer. -->
<!-- Hard-delete possible avec un champ de confirmation supplémentaire. -->

<template>
  <div
    v-if="isVisible"
    ref="modalContainer"
    class="fixed inset-0 bg-light-modal-background z-50 dark:bg-dark-modal-background flex items-center justify-center"
    tabindex="0"
    aria-modal="true"
    aria-labelledby="modal-title"
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
      <p
        v-if="isHardDelete && hardDeleteMessage"
        class="mb-4 text-light-form-error dark:text-dark-form-error"
      >
        {{ hardDeleteMessage }}
      </p>

      <!-- Utilisation du FormComponent -->
      <FormComponent
        v-if="isHardDelete"
        v-model="formData"
        :fields="formFields"
        :isEditing="false"
        @form-submit="handleConfirm"
        @form-cancel="handleCancel"
      >
        <!-- Personnalisation des boutons via un slot nommé -->
        <template #buttons>
          <div class="flex justify-end space-x-4">
            <ButtonComponent
              variant="secondary"
              nativeType="button"
              @click="handleCancel"
            >
              Annuler
            </ButtonComponent>
            <ButtonComponent
              :variant="
                formData.confirmationText === 'CONFIRM' ? 'danger' : 'gray'
              "
              nativeType="submit"
              :disabled="formData.confirmationText !== 'CONFIRM'"
            >
              {{ textButton }}
            </ButtonComponent>
          </div>
        </template>
      </FormComponent>

      <!-- Si ce n'est pas un hard-delete, afficher les boutons directement -->
      <div v-else class="flex justify-end space-x-4">
        <ButtonComponent variant="secondary" @click="handleCancel">
          Annuler
        </ButtonComponent>
        <ButtonComponent variant="danger" @click="handleConfirm">
          {{ textButton }}
        </ButtonComponent>
      </div>
    </div>
  </div>
</template>

<script>
  import { ref, watch, nextTick } from 'vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import FormComponent from '@/components/FormComponent.vue';

  export default {
    components: {
      ButtonComponent,
      FormComponent,
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
      textButton: {
        type: String,
        default: 'Supprimer',
      },
    },

    // Setup pour initialiser les variables
    setup(props, { emit }) {
      const modalContainer = ref(null);

      const formData = ref({
        confirmationText: '',
      });

      const formFields = [
        {
          name: 'confirmationText',
          label: 'Tapez "CONFIRM" pour confirmer',
          type: 'text',
          required: true,
        },
      ];

      const handleCancel = () => {
        emit('form-cancel');
      };

      const handleConfirm = () => {
        if (
          !props.isHardDelete ||
          formData.value.confirmationText === 'CONFIRM'
        ) {
          emit('confirm');
          // Réinitialiser le champ après confirmation
          formData.value.confirmationText = '';
        }
      };

      // Focus sur le modal à l'ouverture
      watch(
        () => props.isVisible,
        (newVal) => {
          if (newVal) {
            nextTick(() => {
              if (modalContainer.value) {
                modalContainer.value.focus();
              }
            });
          } else {
            formData.value.confirmationText = '';
          }
        }
      );

      return {
        modalContainer,
        formData,
        formFields,
        handleCancel,
        handleConfirm,
      };
    },
  };
</script>

<style scoped>
  /* Styles gérés par Tailwind CSS */
</style>
