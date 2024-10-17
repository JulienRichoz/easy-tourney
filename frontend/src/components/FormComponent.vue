<template>
  <form @submit.prevent="handleSubmit">
    <div v-for="field in fields" :key="field.name" class="mb-4">
      <!-- Vérifier si un slot nommé existe pour ce champ -->
      <component :is="$slots[field.name] ? 'slot' : 'div'" :name="field.name">
        <template v-if="!$slots[field.name]">
          <label
            :for="field.name"
            class="block text-gray-700 font-semibold mb-2"
          >
            {{ field.label }}
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

          <!-- Boutons radio -->
          <div v-if="field.type === 'radio'" class="flex items-center">
            <label
              v-for="option in field.options"
              :key="option.value"
              class="mr-4"
            >
              <input
                type="radio"
                :value="option.value"
                v-model="formData[field.name]"
                @change="validateField(field)"
              />
              {{ option.label }}
            </label>
          </div>

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
      handleFileChange(event) {
        const file = event.target.files[0];
        if (file) {
          this.$emit('file-selected', file);
        }
      },
      handleSubmit() {
        this.$emit('submit', this.formData);
      },
    },
  };
</script>
