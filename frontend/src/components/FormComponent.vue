<template>
  <div>
    <form @submit.prevent="handleSubmit">
      <div v-for="field in fields" :key="field.name" class="mb-4">
        <label :for="field.name" class="block text-gray-700 font-semibold mb-2">
          {{ field.label }}
        </label>
        <input
          v-if="field.type !== 'textarea' && field.type !== 'select'"
          :type="field.type"
          :name="field.name"
          v-model="formData[field.name]"
          :class="[
            'w-full p-2 border rounded-md',
            errors[field.name] ? 'border-red-500' : 'border-gray-300',
          ]"
          @input="validateField(field)"
        />
        <textarea
          v-if="field.type === 'textarea'"
          :name="field.name"
          v-model="formData[field.name]"
          :class="[
            'w-full p-2 border rounded-md',
            errors[field.name] ? 'border-red-500' : 'border-gray-300',
          ]"
          @input="validateField(field)"
        ></textarea>
        <select
          v-if="field.type === 'select'"
          :name="field.name"
          v-model="formData[field.name]"
          class="w-full p-2 border border-gray-300 rounded-md"
        >
          <option
            v-for="option in field.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <p v-if="errors[field.name]" class="text-red-500 text-sm mt-1">
          {{ errors[field.name] }}
        </p>
      </div>
    </form>
  </div>
</template>

<script>
  export default {
    props: {
      fields: {
        type: Array,
        required: true,
      },
    },
    data() {
      return {
        formData: this.initializeFormData(),
        errors: {},
      };
    },
    methods: {
      initializeFormData() {
        const data = {};
        this.fields.forEach((field) => {
          data[field.name] = field.value || '';
        });
        return data;
      },
      validateField(field) {
        if (field.required && !this.formData[field.name]) {
          this.$set(this.errors, field.name, 'Ce champ est obligatoire');
        } else {
          delete this.errors[field.name]; // Utilise delete pour Vue 3
        }
      },
      handleSubmit() {
        this.$emit('submit', this.formData);
      },
    },
  };
</script>

<style scoped></style>
