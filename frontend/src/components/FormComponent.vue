<!-- FormComponent.vue 
Event emis:
update:modelValue: Pour la liaison bidirectionnelle des données (v-model)
update-validation: Pour informer le parent de la validité du formulaire.
form-submit: Lorsque le formulaire est soumis avec succès.
file-selected: Lorsqu'un fichier est sélectionné.
-->

<template>
  <form @submit.prevent="handleSubmit">
    <div :class="gridClass">
      <!-- Boucle sur les champs pour afficher les éléments du formulaire -->
      <div v-for="field in fields" :key="field.name" class="mb-4">
        <component :is="$slots[field.name] ? 'slot' : 'div'" :name="field.name">
          <!-- Utilisation du slot pour les champs personnalisés -->
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

            <!-- Utilisation du composant AutocompleteAddress pour le champ 'location' -->
            <AutocompleteAddress
              v-if="field.name === 'location'"
              v-model="formData.location"
              :disabled="!isEditable"
              :placeholder="field.placeholder"
              @input="validateField(field)"
            />

            <!-- Champs de formulaire génériques -->
            <input
              v-if="
                field.type !== 'textarea' &&
                field.type !== 'select' &&
                field.type !== 'file' &&
                field.type !== 'radio' &&
                field.type !== 'color' &&
                field.name !== 'location'
              "
              :type="field.type"
              :id="field.name"
              :disabled="!isEditable"
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
            <!-- Champs textArea -->
            <textarea
              v-if="field.type === 'textarea'"
              :id="field.name"
              :disabled="!isEditable"
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
              :disabled="!isEditable"
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

            <!-- Champ de type 'file' -->
            <input
              v-if="field.type === 'file'"
              type="file"
              :id="field.name"
              :disabled="!isEditable"
              @change="handleFileChange"
              @click.stop
              accept="image/*"
              class="w-full p-2 rounded-md bg-light-form-background dark:bg-dark-form-background border border-light-form-border-default dark:border-dark-form-border-default text-light-form-text dark:text-dark-form-text"
            />

            <!-- Choisir la couleur -->
            <div v-if="field.type === 'color'" class="flex items-center">
              <input
                type="color"
                :disabled="!isEditable"
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

            <!-- afficher les erreurs -->
            <p
              v-if="errors[field.name]"
              class="text-light-form-error dark:text-dark-form-error text-sm mt-1"
            >
              {{ errors[field.name] }}
            </p>
          </template>
        </component>
      </div>
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
          v-if="isEditable"
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
  import AutocompleteAddress from '@/components/AutocompleteAddress.vue';

  export default {
    components: {
      ButtonComponent,
      AutocompleteAddress,
    },
    props: {
      fields: {
        type: Array,
        required: true,
      },
      // Objet contenant les données du formulaire
      modelValue: {
        type: Object,
        required: true,
      },
      isEditing: {
        type: Boolean,
        default: false,
      },
      minDate: {
        type: String,
        required: false,
      },
      maxDate: {
        type: String,
        required: false,
      },
      // Permet au parent de fournir une fonction de validation supplémentaire.
      // fonction est appelée dans handleSubmit avant de soumettre le formulaire
      customValidation: {
        type: Function,
        required: false,
        default: null,
      },
      isEditable: {
        type: Boolean,
        default: true,
      },
      columns: {
        type: Number,
        default: 1,
      },
    },
    data() {
      return {
        errors: {}, // Stocker les erreurs de validation
        visibleTooltip: null, // Champ actuellement survolé
      };
    },
    computed: {
      formData: {
        // Utiliser un getter/setter pour la liaison bidirectionnelle
        get() {
          return this.modelValue;
        },
        set(value) {
          this.$emit('update:modelValue', value);
        },
      },

      // Classe CSS pour la grille de formulaire
      gridClass() {
        return `grid grid-cols-1 sm:grid-cols-${this.columns} gap-4`;
      },

      // Vérifier si le formulaire est valide
      isFormValid() {
        return (
          // Vérifier si tous les champs requis sont remplis
          Object.keys(this.errors).length === 0 &&
          this.fields.every(
            (field) =>
              !field.required ||
              (this.formData[field.name] !== null &&
                this.formData[field.name] !== undefined &&
                this.formData[field.name] !== '')
          )
        );
      },
    },
    watch: {
      // Écouter les changements de modèle pour valider les champs
      isFormValid(newVal) {
        this.$emit('update-validation', newVal);
      },
    },
    methods: {
      // Valider un champ de formulaire
      validateField(field) {
        if (field.name === 'location' && field.required) {
          // Valider l'adresse si le champ est requis
          if (
            !this.formData.location ||
            !this.formData.location.address ||
            !this.formData.location.latitude ||
            !this.formData.location.longitude
          ) {
            this.errors.location = 'Veuillez sélectionner une adresse valide.';
          } else {
            delete this.errors.location;
          }
        }
        //Vérifier si le champ terrain  est requis et vide
        if (
          field.required &&
          (this.formData[field.name] === null ||
            this.formData[field.name] === undefined ||
            this.formData[field.name] === '')
        ) {
          this.errors[field.name] = 'Ce champ est obligatoire';

          // Vérifier si le champ est de type date'
        } else if (field.type === 'date') {
          const dateValue = new Date(this.formData[field.name]);
          const minDate = this.minDate ? new Date(this.minDate) : null;
          const maxDate = this.maxDate ? new Date(this.maxDate) : null;

          // Vérifier si la date est valide
          if (minDate && dateValue < minDate) {
            this.errors[
              field.name
            ] = `La date doit être après le ${this.minDate}`;
          } else if (maxDate && dateValue > maxDate) {
            this.errors[
              field.name
            ] = `La date doit être avant le ${this.maxDate}`;
          } else {
            delete this.errors[field.name];
          }
        } else {
          delete this.errors[field.name];
        }

        // Emit validation update
        this.$emit('update-validation', this.isFormValid);
      },

      // Afficher/masquer le tooltip
      toggleTooltip(fieldName) {
        this.visibleTooltip =
          this.visibleTooltip === fieldName ? null : fieldName;
      },

      // Gérer la sélection de fichier
      handleFileChange(event) {
        const file = event.target.files[0] || null;
        if (file) {
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (file.size > maxSize) {
            this.errors.image =
              "La taille de l'image ne doit pas dépasser 10MB";
            return;
          } else {
            delete this.errors.image;
            this.formData.image = file; // Mettre à jour le modèle de données
            this.$emit('file-selected', file); // Émettre l'événement
          }
        } else {
          // User canceled the file selection
          this.formData.image = null; // Reset the image in form data
          // Optionally, emit the file-selected event with null
          this.$emit('file-selected', null);
        }
        // Bloquer toute action supplémentaire
        event.stopPropagation();
      },

      // Soumettre le formulaire
      handleSubmit() {
        if (!this.isEditable) return; // Empêcher la soumission si non éditable

        // Réinitialiser les erreurs
        this.errors = {};

        // Valider les champs requis
        this.fields.forEach((field) => {
          this.validateField(field);
        });

        // Appeler la validation personnalisée si définie
        if (this.customValidation) {
          const customErrors = this.customValidation() || {};

          // Fusionner les erreurs personnalisées avec les erreurs existantes
          this.errors = { ...this.errors, ...customErrors };
        }

        // Continuer si le formulaire est valide
        if (this.isFormValid) {
          this.$emit('form-submit', this.formData);
        }
      },

      // Annuler l'édition
      handleCancel() {
        this.$emit('form-cancel');
      },
    },
  };
</script>

<style scoped>
  /* Styles gérés par Tailwind CSS */
</style>
