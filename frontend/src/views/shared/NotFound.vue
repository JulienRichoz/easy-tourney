<!-- src/views/shared/NotFound.vue -->
<!-- Page d'erreur 404 Not Found. -->

<template>
  <div class="flex h-dvh bg-gray-100">
    <!-- Partie gauche avec un texte -->
    <div class="w-1/2 flex flex-col justify-center items-center">
      <h1 class="text-6xl font-extrabold text-green-400 mb-6">404 Not Found</h1>
      <p class="text-2xl text-gray-700 text-center px-8">
        Oops! The page you're looking for doesn't exist.
      </p>
    </div>

    <!-- Partie droite avec un style similaire -->
    <div class="w-1/2 flex justify-center items-center bg-gray-700">
      <p class="text-4xl text-white text-center">
        Try returning to the homepage or check the URL.
      </p>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'NotFoundPage',
  };
</script>

<style scoped></style>
