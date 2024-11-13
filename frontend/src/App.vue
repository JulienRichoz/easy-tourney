<!-- src/App.vue -->
<template>
  <div
    id="app"
    class="min-h-screen bg-light-background dark:bg-dark-background text-light-title dark:text-dark-title font-sans antialiased"
  >
    <Menu />
    <div :class="{ 'overflow-hidden max-h-screen': isModalOpen }">
      <router-view />
    </div>
  </div>
</template>

<script>
  import Menu from './components/MenuComponent';
  import { mapActions } from 'vuex';
  import { isTokenExpired } from '@/services/authService';

  export default {
    name: 'App',
    components: {
      Menu,
    },
    data() {
      return {
        isModalOpen: false,
      };
    },
    methods: {
      ...mapActions(['logout']),

      startTokenExpirationWatcher() {
        if (this.tokenWatcher) {
          clearInterval(this.tokenWatcher);
        }

        this.checkTokenExpiration(); // Première vérification

        // Configurer un intervalle dynamique en fonction du temps restant sur le token
        this.tokenWatcher = setInterval(() => {
          this.checkTokenExpiration();
        }, this.getCheckInterval());
      },

      checkTokenExpiration() {
        if (isTokenExpired()) {
          // Token expiré, on déconnecte l'utilisateur
          this.logout(); // Effectuer la déconnexion via Vuex

          // Rediriger vers la page de login uniquement si l'utilisateur n'y est pas déjà
          if (this.$route.path !== '/login') {
            this.$router.push('/login');
          }

          // Arrêter l'intervalle après déconnexion
          clearInterval(this.tokenWatcher);
        }
      },

      getCheckInterval() {
        const tokenExpiration = this.$store.state.tokenExpiration;
        const currentTime = Math.floor(Date.now() / 1000);

        if (tokenExpiration) {
          const timeLeft = tokenExpiration - currentTime;
          // Retourner l'intervalle en fonction du temps restant sur le token
          return timeLeft > 10 ? (timeLeft / 2) * 1000 : 5000;
        }
        return 5000; // Valeur par défaut
      },
      handleModalOpen() {
        document.body.classList.add('modal-open');
      },
      handleModalClose() {
        document.body.classList.remove('modal-open');
      },
    },

    mounted() {
      const token = localStorage.getItem('token');
      const isAuthenticated = !!token;

      if (isAuthenticated && !isTokenExpired()) {
        // Démarrer la surveillance uniquement si l'utilisateur est authentifié et que le token n'est pas expiré
        this.startTokenExpirationWatcher();
      }

      // Réagir aux changements de l'état d'authentification
      this.$watch(
        () => this.$store.state.isAuthenticated,
        (newVal) => {
          if (newVal) {
            // Redémarrer la surveillance après reconnexion
            this.startTokenExpirationWatcher();
          } else {
            // Arrêter la surveillance si déconnexion
            clearInterval(this.tokenWatcher);
          }
        }
      );

      // Écoute les événements `modal-open` et `modal-close`
      window.addEventListener('modal-open', this.handleModalOpen);
      window.addEventListener('modal-close', this.handleModalClose);
    },

    beforeUnmount() {
      clearInterval(this.tokenWatcher); // Nettoyage lors du démontage du composant
      window.removeEventListener('modal-open', this.handleModalOpen);
      window.removeEventListener('modal-close', this.handleModalClose);
    },
  };
</script>

<style lang="postcss">
  body.modal-open {
    overflow: hidden;
  }
  html,
  body {
    @apply bg-dark-menu;
    height: 100%;
  }
</style>
