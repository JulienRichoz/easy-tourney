<!-- Page d'accueil de l'utilisateur -->
<!-- TODO: artifact à supprimer? -->

<template>
  <div>
    <h1>Bienvenue Utilisateur {{ userName }}</h1>
    <p>Voici votre tableau de bord.</p>
  </div>
</template>

<script>
  import { mapState } from 'vuex';

  export default {
    name: 'UserPage',
    computed: {
      ...mapState({
        userName: (state) => state.user?.name, // Récupère le nom de l'utilisateur
      }),
    },
  };
</script>

<style scoped>
  /* Style personnalisé pour la page Utilisateur */
</style>
