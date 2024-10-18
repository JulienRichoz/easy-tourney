<!-- src/components/MenuComponent.vue -->
<template>
  <nav
    class="navbar bg-gray-800 p-4 shadow-md flex items-center justify-between dark:bg-custom_dark_2"
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
      <li></li>
      <li>
        <button
          @click="toggleDarkMode"
          class="mr-2 bg-gray-600 p-2 rounded text-white"
        >
          <!-- Utilisez le composant FontAwesomeIcon -->
          <font-awesome-icon v-if="isDarkMode" :icon="['fas', 'sun']" />
          <font-awesome-icon v-else :icon="['fas', 'moon']" />
        </button>
      </li>
      <li v-if="isAuthenticated" class="profile-section flex items-center">
        <span class="username text-white font-bold mr-4">{{ userName }}</span>
        <router-link to="/profile" class="profile-link text-green-400 mr-4">
          <font-awesome-icon :icon="['fas', 'user']" />
        </router-link>
        <button @click="logout" class="text-red-500 text-xl hover:text-red-700">
          <font-awesome-icon :icon="['fas', 'power-off']" />
        </button>
      </li>
      <li v-if="!isAuthenticated" class="ml-4">
        <router-link
          to="/login"
          class="text-green-400 font-bold text-lg flex items-center"
        >
          <font-awesome-icon :icon="['fas', 'sign-in-alt']" class="mr-2" />Se
          connecter
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script>
  import { mapState } from 'vuex';

  export default {
    data() {
      return {
        isDarkMode: false,
      };
    },
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
        // Supprimer le token du localStorage
        localStorage.removeItem('token');
        this.$store.dispatch('logout'); // Déconnexion
        this.$router.push('/login'); // Redirection après la déconnexion
      },
      toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;

        if (this.isDarkMode) {
          document.documentElement.classList.add('dark'); // Ajoute la classe 'dark' à <html>
          localStorage.setItem('theme', 'dark'); // Sauvegarde dans le localStorage
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
      },
    },
    mounted() {
      // Vérifie si le mode sombre est déjà activé (via le localStorage ou la préférence du système)
      const isDark =
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      this.isDarkMode = isDark;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
  };
</script>

<style scoped>
  /* Style pour la barre de navigation - Tout est géré par Tailwind */
  .navbar {
    margin: 0;
  }
</style>
