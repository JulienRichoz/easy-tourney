<template>
  <div id="app" class="min-h-screen bg-gray-100">
    <Menu />
    <div class="p-0">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
  import Menu from './components/MenuComponent'; // Importe le composant Menu
  import { mapActions } from 'vuex'; // Pour appeler les actions Vuex depuis ton composant
  import { isTokenExpired } from '@/services/authService'; // Importer la méthode pour vérifier l'expiration du token

  export default {
    name: 'App',
    components: {
      Menu,
    },
    methods: {
      ...mapActions(['logout']), // Permet d'utiliser l'action logout de Vuex

      // Démarrer la surveillance de l'expiration du token
      startTokenExpirationWatcher() {
        // Si un intervalle existe déjà, on l'efface pour éviter des duplications
        if (this.tokenWatcher) {
          clearInterval(this.tokenWatcher);
        }

        this.checkTokenExpiration(); // Initialiser une première vérification

        // Dynamique : ajuster l'intervalle de vérification en fonction du temps restant
        this.tokenWatcher = setInterval(() => {
          this.checkTokenExpiration();
        }, this.getCheckInterval()); // Appel dynamique de l'intervalle
      },

      // Vérifier si le token est expiré et effectuer une déconnexion si nécessaire
      checkTokenExpiration() {
        if (isTokenExpired()) {
          this.logout();
          this.$router.push('/login');
          clearInterval(this.tokenWatcher); // Arrêter la surveillance une fois déconnecté
        }
      },

      // Fonction pour calculer dynamiquement l'intervalle de vérification
      getCheckInterval() {
        const tokenExpiration = this.$store.state.tokenExpiration;
        const currentTime = Math.floor(Date.now() / 1000); // Temps actuel en secondes

        if (tokenExpiration) {
          const timeLeft = tokenExpiration - currentTime;
          return timeLeft > 10 ? (timeLeft / 2) * 1000 : 5000; // Moitié du temps restant ou 5 secondes
        }
        return 5000; // Intervalle par défaut si aucune info d'expiration
      },
    },
    mounted() {
      this.startTokenExpirationWatcher(); // Lancer la surveillance lors du montage du composant

      // Surveillance des changements d'état d'authentification pour redémarrer la surveillance après reconnexion
      this.$watch(
        () => this.$store.state.isAuthenticated,
        (newVal) => {
          if (newVal) {
            // L'utilisateur est authentifié, on redémarre la surveillance
            this.startTokenExpirationWatcher();
          } else {
            // L'utilisateur est déconnecté, on arrête la surveillance
            clearInterval(this.tokenWatcher);
          }
        }
      );
    },
    beforeUnmount() {
      clearInterval(this.tokenWatcher); // Arrêter la surveillance pour éviter les fuites de mémoire
    },
  };
</script>

<style>
  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
  }
</style>
