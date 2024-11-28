<!-- DraftIcon.vue -->
<template>
  <!-- Icône représentant une étape en brouillon -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-8 w-8 fill-current text-light-details-inProgress dark:text-dark-details-inProgress"
    viewBox="0 0 24 24"
  >
    <!-- Exemple d'icône : un crayon pour indiquer l'édition en cours -->
    <path
      d="M12 20h9"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <path
      d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </svg>
</template>

<script>
  export default {
    name: 'DraftIcon',
  };
</script>

<style scoped>
  /* Styles personnalisés si nécessaire */
</style>
