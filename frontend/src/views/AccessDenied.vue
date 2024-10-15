<template>
  <div class="flex h-dvh">
    <!-- Partie gauche avec une image -->
    <div class="w-1/2 bg-gray-100 flex justify-center items-center">
      <img
        src="@/assets/403_accessDenied.png"
        alt="Access Denied Image"
        class="w-full h-full object-cover"
      />
    </div>

    <!-- Partie droite avec du texte stylé -->
    <div class="w-1/2 flex flex-col justify-center items-center bg-gray-700">
      <h1 class="text-6xl font-extrabold text-green-400 mb-6">
        403 Access Denied
      </h1>
      <p class="text-2xl text-white text-center px-8">
        Sorry, you don’t have the necessary permissions to view this page.
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
