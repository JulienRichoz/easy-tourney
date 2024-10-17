<template>
  <div class="mb-4">
    <label :for="id" class="block text-gray-700 font-semibold mb-2">
      {{ label }}
    </label>
    <select
      :id="id"
      v-model="internalValue"
      class="w-full p-2 border rounded-md"
      :class="error ? 'border-red-500' : 'border-gray-300'"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <p v-if="error" class="text-red-500 text-sm mt-1">{{ error }}</p>
  </div>
</template>

<script>
  export default {
    props: {
      id: {
        type: String,
        required: true,
      },
      label: {
        type: String,
        required: true,
      },
      options: {
        type: Array,
        required: true,
      },
      modelValue: {
        type: String,
        default: '',
      },
      error: {
        type: String,
        default: null,
      },
    },
    data() {
      return {
        internalValue: this.modelValue, // Initialiser la valeur interne avec la valeur du modèle
      };
    },
    watch: {
      // Si la prop modelValue change, on met à jour la valeur interne
      modelValue(newValue) {
        this.internalValue = newValue;
      },
    },
    methods: {
      updateValue(event) {
        const value = event.target.value;
        this.$emit('update:modelValue', value); // Émet l'événement pour informer le parent du changement
      },
    },
  };
</script>
