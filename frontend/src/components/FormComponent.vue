<!-- FormComponent.vue -->
<template>
  <form @submit.prevent="handleSubmit">
    <div v-for="field in fields" :key="field.name" class="mb-4">
      <component :is="$slots[field.name] ? 'slot' : 'div'" :name="field.name">
        <template v-if="!$slots[field.name]">
          <label
            :for="field.name"
            class="block text-light-form-text dark:text-dark-form-text font-semibold mb-2 flex items-center"
          >
            {{ field.label }}
            <span
              v-if="field.required"
              class="text-light-form-error dark:text-dark-form-error"
              >*</span
            >
            <button
              v-if="field.tooltip"
              type="button"
              @click="toggleTooltip(field.name)"
              class="ml-2 relative focus:outline-none"
            >
              <font-awesome-icon
                icon="question-circle"
                class="text-light-form-iconQuestion dark:text-dark-form-iconQuestion cursor-pointer"
              />
              <div
                v-if="visibleTooltip === field.name"
                class="absolute bottom-full mb-2 w-64 bg-gray-700 dark:bg-gray-600 text-white text-base rounded py-1 px-2 z-10 text-left"
                style="left: 50%; transform: translateX(-50%)"
              >
                {{ field.tooltip }}
              </div>
            </button>
          </label>

          <input
            v-if="
              field.type !== 'textarea' &&
              field.type !== 'select' &&
              field.type !== 'file' &&
              field.type !== 'radio' &&
              field.type !== 'color'
            "
            :type="field.type"
            :id="field.name"
            v-model="formData[field.name]"
            :class="[
              'w-full p-2 rounded-md border',
              'bg-light-form-background dark:bg-dark-form-background',
              'text-light-form-text dark:text-dark-form-text',
              errors[field.name]
                ? 'border-light-form-error dark:border-dark-form-error'
                : 'border-light-form-border-default dark:border-dark-form-border-default',
            ]"
            @input="validateField(field)"
            :placeholder="field.placeholder"
          />

          <textarea
            v-if="field.type === 'textarea'"
            :id="field.name"
            v-model="formData[field.name]"
            :class="[
              'w-full p-2 rounded-md border',
              'bg-light-form-background dark:bg-dark-form-background',
              'text-light-form-text dark:text-dark-form-text',
              errors[field.name]
                ? 'border-light-form-error dark:border-dark-form-error'
                : 'border-light-form-border-default dark:border-dark-form-border-default',
            ]"
            @input="validateField(field)"
          ></textarea>

          <select
            v-if="field.type === 'select'"
            :id="field.name"
            v-model="formData[field.name]"
            class="w-full p-2 rounded-md bg-light-form-background dark:bg-dark-form-background border border-light-form-border-default dark:border-dark-form-border-default text-light-form-text dark:text-dark-form-text"
            @change="validateField(field)"
          >
            <option
              v-for="option in field.options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>

          <input
            v-if="field.type === 'file'"
            type="file"
            :id="field.name"
            @change="handleFileChange"
            class="w-full p-2 rounded-md bg-light-form-background dark:bg-dark-form-background border border-light-form-border-default dark:border-dark-form-border-default text-light-form-text dark:text-dark-form-text"
          />

          <div v-if="field.type === 'color'" class="flex items-center">
            <input
              type="color"
              :id="field.name"
              v-model="formData[field.name]"
              class="w-16 h-16 p-0 border-none rounded-md"
              @input="validateField(field)"
            />
            <div
              class="w-8 h-8 ml-4 border border-light-form-border-default dark:border-dark-form-border-default rounded-md"
              :style="{ backgroundColor: formData[field.name] }"
            ></div>
          </div>

          <p
            v-if="errors[field.name]"
            class="text-light-form-error dark:text-dark-form-error text-sm mt-1"
          >
            {{ errors[field.name] }}
          </p>
        </template>
      </component>
    </div>

    <!-- Slot pour les boutons -->
    <slot name="buttons">
      <!-- Boutons par défaut -->
      <div class="flex justify-between mt-4">
        <ButtonComponent
          variant="secondary"
          nativeType="button"
          @click="handleCancel"
        >
          Annuler
        </ButtonComponent>
        <ButtonComponent
          :variant="isFormValid ? 'primary' : 'disabled'"
          nativeType="submit"
          :disabled="!isFormValid"
        >
          {{ isEditing ? 'Modifier' : 'Ajouter' }}
        </ButtonComponent>
      </div>
    </slot>
  </form>
</template>

<script>
  import ButtonComponent from '@/components/ButtonComponent.vue';

  export default {
    components: {
      ButtonComponent,
    },
    props: {
      fields: {
        type: Array,
        required: true,
      },
      modelValue: {
        type: Object,
        required: true,
      },
      isEditing: {
        type: Boolean,
        default: false,
      },
      customValidation: {
        type: Function,
        required: false,
        default: null,
      },
    },
    data() {
      return {
        errors: {},
        visibleTooltip: null,
      };
    },
    computed: {
      formData: {
        get() {
          return this.modelValue;
        },
        set(value) {
          this.$emit('update:modelValue', value);
        },
      },
      isFormValid() {
        // Check if there are any errors and all required fields are filled
        return (
          Object.keys(this.errors).length === 0 &&
          this.fields.every(
            (field) =>
              !field.required ||
              (this.formData[field.name] && this.formData[field.name] !== '')
          )
        );
      },
    },
    watch: {
      isFormValid(newVal) {
        this.$emit('update-validation', newVal);
      },
    },
    methods: {
      validateField(field) {
        if (field.required && !this.formData[field.name]) {
          this.errors[field.name] = 'Ce champ est obligatoire';
        } else if (this.customValidation) {
          // Appelle la fonction customValidation et récupère les erreurs
          const customErrors = this.customValidation();
          if (customErrors && customErrors[field.name]) {
            this.errors[field.name] = customErrors[field.name];
          } else {
            delete this.errors[field.name];
          }
        } else {
          delete this.errors[field.name];
        }
        // Emit validation update
        this.$emit('update-validation', this.isFormValid);
      },
      toggleTooltip(fieldName) {
        this.visibleTooltip =
          this.visibleTooltip === fieldName ? null : fieldName;
      },
      handleFileChange(event) {
        const file = event.target.files[0];
        this.$emit('file-selected', file);
        // Validate the field after file selection
        this.validateField({ name: 'image', required: false });
      },
      handleSubmit() {
        // Protéger l'accès à customValidation
        if (this.customValidation) {
          const customErrors = this.customValidation() || {};

          // S'assurer que customErrors est bien un objet
          if (Object.keys(customErrors).length > 0) {
            this.errors = customErrors;
            return; // Stopper si des erreurs sont présentes
          }
        }

        // Continuer si le formulaire est valide
        if (this.isFormValid) {
          this.$emit('form-submit', this.formData);
        }
      },
      handleCancel() {
        this.$emit('cancel');
      },
    },
  };
</script>

<style scoped>
  /* Styles gérés par Tailwind CSS */
</style>
