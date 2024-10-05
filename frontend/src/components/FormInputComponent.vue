<template>
    <div class="form-group">
      <label :for="id">{{ label }}</label>
      <input
        :type="type"
        :id="id"
        :placeholder="placeholder"
        :required="required"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </div>
  </template>
  
  <script>
  export default {
    name: "FormInputComponent",
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
        default: "text",
      },
      modelValue: {
        type: String,
        default: "",
      },
      placeholder: {
        type: String,
        default: "",
      },
      required: {
        type: Boolean,
        default: false,
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
    color: #2c3e50; /* même couleur que le label dans LoginPage.vue */
  }
  
  input {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1em;
  }
  
  input:focus {
    outline: none;
    border-color: #42b983;
  }
  
  button {
    background: none;
    border: none;
  }
  </style>
  