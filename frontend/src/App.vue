<!-- src/App.vue -->
<!-- Fichier principal de l'application. -->
<template>
  <div
    id="app"
    class="min-h-screen bg-light-background dark:bg-dark-background text-light-title dark:text-dark-title font-sans antialiased"
  >
    <!-- Vérifier si l'utilisateur est hors ligne -->
    <div v-if="!isOnline" class="offline-indicator">
      Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.
    </div>
    <!-- Menu de navigation -->
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
        isModalOpen: false, // Indicateur de modal ouverte
        isOnline: navigator.onLine, // Indicateur de connexion
      };
    },
    methods: {
      ...mapActions(['logout']), // Injecter l'action de déconnexion

      /**
       * Démarrer la surveillance de l'expiration du token.
       */
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

      // Check if the user is online
      updateOnlineStatus() {
        this.isOnline = navigator.onLine;
      },

      /**
       * Vérifier si le token est expiré.
       */
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

      /**
       * Obtenir l'intervalle de vérification en fonction du temps restant sur le token.
       * @returns {number} - L'intervalle de vérification en millisecondes.
       */
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
      window.addEventListener('online', this.updateOnlineStatus);
      window.addEventListener('offline', this.updateOnlineStatus);
    },

    /**
     * Nettoyage lors du démontage du composant.
     */
    beforeUnmount() {
      clearInterval(this.tokenWatcher); // Nettoyage lors du démontage du composant
      window.removeEventListener('modal-open', this.handleModalOpen);
      window.removeEventListener('modal-close', this.handleModalClose);
      window.removeEventListener('online', this.updateOnlineStatus);
      window.removeEventListener('offline', this.updateOnlineStatus);
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

  .offline-indicator {
    background: #ff9800;
    color: #fff;
    text-align: center;
    padding: 5px 0;
    font-weight: bold;
  }
</style>
