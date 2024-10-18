<template>
  <form @submit.prevent="handleSubmit">
    <div v-for="field in fields" :key="field.name" class="mb-4">
      <!-- Vérifier si un slot nommé existe pour ce champ -->
      <component :is="$slots[field.name] ? 'slot' : 'div'" :name="field.name">
        <template v-if="!$slots[field.name]">
          <label
            :for="field.name"
            class="block text-gray-700 font-semibold mb-2 flex items-center"
          >
            {{ field.label }}
            <span v-if="field.required" class="text-red-500">*</span>
            <!-- Icône du tooltip utilisant Font Awesome -->
            <button
              v-if="field.tooltip"
              type="button"
              @click="toggleTooltip(field.name)"
              class="ml-2 relative focus:outline-none"
            >
              <font-awesome-icon
                icon="question-circle"
                class="text-gray-400 cursor-pointer"
              />
              <!-- Texte du tooltip -->
              <div
                v-if="visibleTooltip === field.name"
                class="absolute bottom-full mb-2 w-64 bg-gray-700 text-white text-base rounded py-1 px-2 z-10 text-left"
                style="left: 50%; transform: translateX(-50%)"
              >
                {{ field.tooltip }}
              </div>
            </button>
          </label>

          <!-- Champ input -->
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
              'w-full p-2 border rounded-md',
              errors[field.name] ? 'border-red-500' : 'border-gray-300',
            ]"
            @input="validateField(field)"
            :placeholder="field.placeholder"
          />

          <!-- Champ textarea -->
          <textarea
            v-if="field.type === 'textarea'"
            :id="field.name"
            v-model="formData[field.name]"
            :class="[
              'w-full p-2 border rounded-md',
              errors[field.name] ? 'border-red-500' : 'border-gray-300',
            ]"
            @input="validateField(field)"
          ></textarea>

          <!-- Champ select -->
          <select
            v-if="field.type === 'select'"
            :id="field.name"
            v-model="formData[field.name]"
            class="w-full p-2 border rounded-md"
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

          <!-- Champ fichier -->
          <input
            v-if="field.type === 'file'"
            type="file"
            :id="field.name"
            @change="handleFileChange"
            class="w-full p-2 border rounded-md"
          />
          <!-- Sélecteur de couleur -->
          <div v-if="field.type === 'color'" class="flex items-center">
            <input
              type="color"
              :id="field.name"
              v-model="formData[field.name]"
              class="w-16 h-16 p-0 border-none rounded-md"
              @input="validateField(field)"
            />
            <!-- Carré affichant la couleur choisie -->
            <div
              class="w-8 h-8 ml-4 border border-gray-300 rounded-md"
              :style="{ backgroundColor: formData[field.name] }"
            ></div>
          </div>

          <!-- Afficher l'erreur -->
          <p v-if="errors[field.name]" class="text-red-500 text-sm mt-1">
            {{ errors[field.name] }}
          </p>
        </template>
      </component>
    </div>
    <!-- Slot pour contenu additionnel -->
    <slot name="additional-content"></slot>
  </form>
</template>

<script>
  export default {
    props: {
      fields: {
        type: Array,
        required: true,
      },
      modelValue: {
        type: Object,
        required: true,
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
    },
    methods: {
      validateField(field) {
        if (field.required && !this.formData[field.name]) {
          this.errors[field.name] = 'Ce champ est obligatoire';
        } else {
          delete this.errors[field.name];
        }
      },
      toggleTooltip(fieldName) {
        if (this.visibleTooltip === fieldName) {
          this.visibleTooltip = null;
        } else {
          this.visibleTooltip = fieldName;
        }
      },
      handleClickOutside(event) {
        if (!this.$el.contains(event.target)) {
          this.visibleTooltip = null;
        }
      },
      handleSubmit() {
        this.$emit('submit', this.formData);
      },
    },
    mounted() {
      document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
      document.removeEventListener('click', this.handleClickOutside);
    },
  };
</script>

<style scoped></style>
