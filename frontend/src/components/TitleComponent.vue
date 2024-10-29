<!-- TitleComponent.vue -->

<template>
  <h1 :class="titleClass">{{ title }}</h1>
</template>

<script>
  export default {
    props: {
      title: {
        type: String,
        required: true, // Titre à afficher, obligatoire
      },
      titleClass: {
        type: String,
        default: 'text-3xl font-bold dark:bg-custom_light_1', // Classe CSS à appliquer au titre
      },
    },
  };
</script>

<style scoped></style>
