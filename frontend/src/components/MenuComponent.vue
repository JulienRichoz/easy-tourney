<template>
  <nav
    class="navbar bg-gray-800 p-4 shadow-md flex items-center justify-between"
  >
    <!-- Section de gauche -->
    <ul class="left-section flex items-center">
      <li v-if="isAdmin" class="mr-6">
        <router-link
          to="/tourneys"
          class="text-white font-semibold hover:text-green-400"
          >Tournois</router-link
        >
      </li>
      <li v-if="isAdmin" class="mr-6">
        <router-link
          to="/admin/sports"
          class="text-white font-semibold hover:text-green-400"
          >Sports</router-link
        >
      </li>
    </ul>

    <!-- Section du nom du tournoi (visible uniquement sur les pages de tournoi) -->
    <div
      v-if="showTournamentName"
      class="tournament-name text-lg font-bold absolute left-1/2 transform -translate-x-1/2 text-green-500 hidden md:block"
    >
      {{ tournamentName }}
    </div>

    <!-- Section de droite -->
    <ul class="right-section flex items-center">
      <li v-if="isAuthenticated" class="profile-section flex items-center">
        <span class="username text-white font-bold mr-4">{{ userName }}</span>
        <router-link to="/profile" class="profile-link text-green-400 mr-4">
          <i class="fas fa-user"></i>
        </router-link>
        <button @click="logout" class="text-red-500 text-xl hover:text-red-700">
          <i class="fas fa-power-off"></i>
        </button>
      </li>
      <li v-if="!isAuthenticated" class="ml-4">
        <router-link to="/login" class="text-green-400 font-bold text-lg">
          <i class="fas fa-power-on mr-2"></i>Se connecter
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script>
  import { mapState } from 'vuex';

  export default {
    computed: {
      ...mapState({
        isAuthenticated: (state) => state.isAuthenticated, // Vérifie l'authentification
        isAdmin: (state) => state.user?.roleId === 1, // Vérifie si l'utilisateur est admin
        userName: (state) => state.user?.name, // Récupère le nom de l'utilisateur
        tournamentName: (state) => state.tourney.currentTournamentName, // Nom du tournoi depuis Vuex
      }),
      showTournamentName() {
        // Afficher le nom du tournoi uniquement sur les pages qui commencent par /tourneys/:id
        return (
          this.$route.path.startsWith('/tourneys/') && this.$route.params.id
        );
      },
    },
    methods: {
      logout() {
        this.$store.dispatch('logout'); // Déconnexion
        this.$router.push('/login'); // Redirection après la déconnexion
      },
    },
  };
</script>

<style scoped>
  /* Style pour la barre de navigation - Tout est géré par Tailwind */
  .navbar {
    margin: 0;
  }
</style>
