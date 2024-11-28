<!-- ActiveIcon.vue -->
<template>
  <!-- Icône représentant une étape active -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-8 w-8 fill-current text-light-details-active dark:text-dark-details-active"
    viewBox="0 0 24 24"
  >
    <!-- Exemple d'icône : un cercle avec une flèche indiquant l'activité -->
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="2"
      fill="none"
    />
    <path
      d="M12 8v4l3 3"
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
    name: 'ActiveIcon',
  };
</script>

<style scoped>
  /* Styles personnalisés si nécessaire */
</style>
