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
        @cancel="handleCancel"
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
              Supprimer
            </ButtonComponent>
          </div>
        </template>
      </FormComponent>

      <!-- Si ce n'est pas une suppression "hard", afficher les boutons directement -->
      <div v-else class="flex justify-end space-x-4">
        <ButtonComponent variant="secondary" @click="handleCancel">
          Annuler
        </ButtonComponent>
        <ButtonComponent variant="danger" @click="handleConfirm">
          Supprimer
        </ButtonComponent>
      </div>
    </div>
  </div>
</template>

<script>
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
    },
    data() {
      return {
        formData: {
          confirmationText: '',
        },
      };
    },
    computed: {
      formFields() {
        return [
          {
            name: 'confirmationText',
            label: 'Tapez "CONFIRM" pour confirmer',
            type: 'text',
            required: true,
          },
        ];
      },
    },
    methods: {
      handleCancel() {
        this.$emit('cancel');
      },
      handleConfirm() {
        if (
          !this.isHardDelete ||
          this.formData.confirmationText === 'CONFIRM'
        ) {
          this.$emit('confirm');
          // Réinitialiser le champ après confirmation
          this.formData.confirmationText = '';
        }
      },
    },
    watch: {
      isVisible(newVal) {
        if (!newVal) {
          this.formData.confirmationText = '';
        }
      },
    },
  };
</script>

<style scoped>
  /* Styles gérés par Tailwind CSS */
</style>
