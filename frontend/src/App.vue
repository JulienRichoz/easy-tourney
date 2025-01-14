<!-- src/App.vue -->
<template>
  <div
    id="app"
    class="min-h-screen bg-light-background dark:bg-dark-background text-light-title dark:text-dark-title font-sans antialiased"
  >
    <!-- Indicateur offline -->
    <div v-if="!isOnline" class="offline-indicator">
      Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.
    </div>

    <!-- Menu principal -->
    <Menu />

    <!-- Contenu principal -->
    <div :class="{ 'overflow-hidden max-h-screen': isModalOpen }">
      <router-view />
    </div>
  </div>
</template>

<script>
  import Menu from './components/MenuComponent';
  import { mapActions } from 'vuex';

  export default {
    name: 'App',
    components: {
      Menu,
    },
    data() {
      return {
        isModalOpen: false, // Gère l'état d'ouverture d'une éventuelle modale
        isOnline: navigator.onLine, // Gère l'état hors-ligne
      };
    },
    methods: {
      ...mapActions(['logout', 'initializeAuth']),

      // Gestion de l'état "online/offline"
      updateOnlineStatus() {
        this.isOnline = navigator.onLine;
      },

      // Gestion de l'ouverture/fermeture modale
      handleModalOpen() {
        document.body.classList.add('modal-open');
        this.isModalOpen = true;
      },
      handleModalClose() {
        document.body.classList.remove('modal-open');
        this.isModalOpen = false;
      },
    },

    async mounted() {
      // Au montage, on tente de récupérer l'utilisateur courant
      // (si le serveur renvoie 200, on est déjà loggué ; sinon 401 => non loggué)
      try {
        await this.initializeAuth();
      } catch (error) {
        // On peut ignorer ou logger l'erreur,
        // car si l'utilisateur n'est pas logué => 401 => store.LOGOUT
        console.warn('initializeAuth error:', error);
      }

      // Écoute l'ouverture/fermeture modale (si tu l'utilises quelque part)
      window.addEventListener('modal-open', this.handleModalOpen);
      window.addEventListener('modal-close', this.handleModalClose);

      // Écoute l'état offline/online
      window.addEventListener('online', this.updateOnlineStatus);
      window.addEventListener('offline', this.updateOnlineStatus);
    },

    beforeUnmount() {
      // Nettoyages
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
