<!-- src/views/shared/AccessDenied.vue -->
<!-- Page d'erreur 403 Access Denied. -->
<template>
  <div class="flex h-dvh bg-gray-100">
    <!-- Partie gauche avec un texte -->
    <div class="w-1/2 flex flex-col justify-center items-center">
      <h1 class="text-6xl font-extrabold text-green-400 mb-6">
        403 Access Denied
      </h1>
      <p class="text-2xl text-gray-700 text-center px-8">
        Sorry, you don’t have the necessary permissions to view this page.
      </p>
    </div>

    <!-- Partie droite avec un style similaire -->
    <div class="w-1/2 flex justify-center items-center bg-gray-700">
      <p class="text-4xl text-white text-center">
        Please contact your administrator if you think this is a mistake.
      </p>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'AccessDeniedPage',
  };
</script>

<style scoped></style>
