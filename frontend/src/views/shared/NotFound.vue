<template>
  <div class="flex h-screen">
    <!-- Partie gauche avec fond personnalisé (potentiellement pour une image) -->
    <div class="w-1/2 bg-gray-100 flex justify-center items-center">
      <img
        src="@/assets/404_notFound.png"
        alt="Access Denied Image"
        class="w-full h-full object-cover"
      />
    </div>

    <!-- Partie droite avec du texte stylé -->
    <div class="w-1/2 flex flex-col justify-center items-center bg-gray-700">
      <h1 class="text-6xl font-extrabold text-green-400 mb-6">404 Not Found</h1>
      <p class="text-2xl text-white text-center px-8">
        Oops! The page you're looking for doesn't exist.
      </p>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'NotFoundPage',
  };
</script>

<style scoped>
  /* Pas de style supplémentaire, tout est géré par Tailwind */
</style>
