<!-- src/components/MenuComponent.vue -->
<template>
  <nav
    class="navbar bg-light-menu dark:bg-dark-menu p-4 shadow-md flex items-center justify-between"
  >
    <!-- Section de gauche -->
    <ul class="left-section flex items-center">
      <li v-if="isAdmin" class="mr-6">
        <router-link to="/tourneys" :class="getLinkClass('/tourneys')">
          Tournois
        </router-link>
      </li>
      <!-- Lien pour les utilisateurs non-admins -->
      <li v-if="isAuthenticated && !isAdmin" class="mr-6">
        <router-link to="/my-tourneys" :class="getLinkClass('/my-tourneys')">
          Mes tournois
        </router-link>
      </li>
      <li v-if="isAdmin" class="mr-6">
        <router-link to="/sports" :class="getLinkClass('/sports')">
          Sports
        </router-link>
      </li>
      <li v-if="isAdmin" class="mr-6">
        <router-link to="/users" :class="getLinkClass('/users')">
          Utilisateurs
        </router-link>
      </li>
    </ul>

    <!-- Section du nom du tournoi (visible uniquement sur les pages de tournoi) -->
    <div
      v-if="showTournamentName"
      class="tournament-name text-lg font-bold absolute left-1/2 transform -translate-x-1/2 text-light-profileText dark:text-dark-profileText hidden md:block"
    >
      {{ tournamentName }}
    </div>

    <!-- Section de droite -->
    <ul class="right-section flex items-center">
      <li>
        <button
          @click="toggleDarkMode"
          class="mr-2 p-2 rounded text-blue-200 dark:text-yellow-300 hover:text-blue-300 dark:hover:text-yellow-500"
        >
          <font-awesome-icon v-if="isDarkMode" :icon="['fas', 'sun']" />
          <font-awesome-icon v-else :icon="['fas', 'moon']" />
        </button>
      </li>
      <li v-if="isAuthenticated" class="profile-section flex items-center">
        <router-link
          to="/profile"
          class="profile-link text-light-profileText dark:text-dark-profileText mr-4 hover:text-light-profileHoverText dark:hover:text-dark-profileHoverText"
        >
          <span
            class="username text-light-menuText dark:text-dark-menuText font-bold mr-4"
            >{{ userName }}</span
          >

          <font-awesome-icon :icon="['fas', 'user']" />
        </router-link>
        <button
          @click="logout"
          class="text-light-logoutButton-default dark:text-dark-logoutButton-default text-xl hover:text-light-logoutButton-hover dark:hover:text-dark-logoutButton-hover"
        >
          <font-awesome-icon :icon="['fas', 'power-off']" />
        </button>
      </li>
      <li v-if="!isAuthenticated" class="ml-4">
        <router-link
          to="/login"
          class="text-light-profileText dark:text-dark-profileText font-bold text-lg flex items-center"
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
        isAuthenticated: (state) => state.isAuthenticated,
        isAdmin: (state) => state.user?.roleId === 1,
        userName: (state) => state.user?.name,
        ...mapState('tourney', {
          tournamentName: (state) => state.currentTournamentName,
        }),
      }),
      showTournamentName() {
        return (
          this.$route.path.startsWith('/tourneys/') &&
          this.$route.params.tourneyId
        );
      },
    },
    methods: {
      logout() {
        localStorage.removeItem('token');
        this.$store.dispatch('logout');
        this.$router.push('/login');
      },
      toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;

        if (this.isDarkMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
      },
      getLinkClass(path) {
        const isActive = this.$route.path === path;
        return [
          'font-semibold',
          'hover:text-light-menuHoverText',
          'dark:hover:text-dark-menuHoverText',
          isActive
            ? 'text-light-menuActive dark:text-dark-menuActive'
            : 'text-light-menuText dark:text-dark-menuText',
        ];
      },
    },
    mounted() {
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
  /* Styles gérés par Tailwind CSS */
</style>
