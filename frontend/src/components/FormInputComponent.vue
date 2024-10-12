<!-- frontend/src/components/FormInputComponent.vue -->
<template>
  <div class="form-group">
    <label :for="id">{{ label }}</label>
    <input
      :type="type"
      :id="id"
      :placeholder="placeholder"
      :required="required"
      :value="modelValue"
      @input="updateValue"
    />
  </div>
</template>

<script>
  export default {
    name: 'FormInputComponent',
    props: {
      id: {
        type: String,
        required: true,
      },
      label: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        default: 'text',
      },
      modelValue: {
        type: String,
        default: '',
      },
      placeholder: {
        type: String,
        default: '',
      },
      required: {
        type: Boolean,
        default: false,
      },
    },
    methods: {
      updateValue(event) {
        const target = event.target;
        if (target instanceof HTMLInputElement) {
          this.$emit('update:modelValue', target.value);
        }
      },
    },
  };
</script>

<style scoped>
  .form-group {
    margin-bottom: 15px;
  }

  label {
    display: block;
    margin-bottom: 5px;
    color: #2c3e50;
    font-weight: bold;
  }

  input {
    width: 100%;
    padding: 0.75rem; /* Ajouté pour une meilleure apparence */
    border: 1px solid #ccc;
    border-radius: 0.375rem; /* Taille standard de Tailwind pour border-radius */
    font-size: 1em;
  }

  input:focus {
    outline: none;
    border-color: #42b983;
    box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.3); /* Effet de focus */
  }
</style>
