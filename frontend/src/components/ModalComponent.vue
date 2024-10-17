<!-- components/ModalComponent.vue -->

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
          >Annuler</ButtonComponent
        >
        <ButtonComponent
          :variant="isFormValid ? confirmButtonVariant || 'primary' : 'gray'"
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
        default: '',
      },
      confirmButtonVariant: {
        type: String,
        default: 'primary',
      },
      isFormValid: {
        type: Boolean,
        default: false,
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
