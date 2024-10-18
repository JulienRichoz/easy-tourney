<template>
  <div class="mb-4">
    <label :for="id" class="block text-gray-700 font-semibold mb-2">{{
      label
    }}</label>
    <input
      :type="type"
      :id="id"
      :placeholder="placeholder"
      :value="modelValue"
      @input="updateValue"
      @blur="$emit('blur')"
      :class="[
        'w-full p-2 border rounded-md',
        error && touched ? 'border-red-500' : 'border-gray-300',
      ]"
    />
    <p v-if="error && touched" class="text-red-500 text-sm mt-1">{{ error }}</p>
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
      validate: {
        type: Boolean,
        default: false,
      },
      touched: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        error: null,
      };
    },
    watch: {
      modelValue: {
        handler(value) {
          if (this.required && !value) {
            this.error = 'Ce champ est requis';
          } else if (
            this.validate &&
            this.type === 'email' &&
            !this.isValidEmail(value)
          ) {
            this.error = 'Veuillez entrer une adresse email valide';
          } else {
            this.error = null;
          }
        },
        immediate: true,
      },
    },
    methods: {
      updateValue(event) {
        this.$emit('update:modelValue', event.target.value);
      },
      isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
      },
    },
  };
</script>
