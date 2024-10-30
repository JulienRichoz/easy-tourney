<!-- ErrorMessageComponent.vue -->

<template>
  <div v-if="message" :class="errorClass">
    <span>{{ message }}</span>
  </div>
</template>

<script>
  export default {
    props: {
      message: {
        type: String,
        required: true, // Le message d'erreur à afficher, obligatoire
      },
      errorClass: {
        type: String,
        default:
          'p-2 text-center text-xl rounded-lg font-semibold text-light-errorMessage dark:text-errorMessage', // Classe CSS par défaut
      },
    },
  };
</script>

<style scoped></style>
