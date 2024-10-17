<template>
  <div class="mb-4">
    <label :for="id" class="block text-gray-700 font-semibold mb-2">{{
      label
    }}</label>
    <div v-if="type === 'color'" class="flex items-center">
      <input
        :type="type"
        :id="id"
        :value="modelValue"
        @input="updateValue"
        class="w-16 h-16 p-2 border border-gray-300 rounded-md mr-4"
      />
      <span class="text-gray-700 font-semibold">{{ modelValue }}</span>
      <!-- Affichage de la valeur hexadécimale -->
    </div>
    <input
      v-else
      :type="type"
      :id="id"
      :placeholder="placeholder"
      :value="modelValue"
      @input="updateValue"
      :class="[
        'w-full p-2 border rounded-md',
        error ? 'border-red-500' : 'border-gray-300',
      ]"
    />
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
      error: {
        type: String,
        default: null,
      },
    },
    methods: {
      updateValue(event) {
        this.$emit('update:modelValue', event.target.value);
      },
    },
  };
</script>
