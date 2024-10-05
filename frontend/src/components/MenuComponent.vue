<template>
  <nav class="navbar">
    <ul class="left-section">
      <li>
        <router-link to="/">Accueil</router-link>
      </li>

      <!-- Si l'utilisateur est admin, on affiche le lien vers la page admin -->
      <li v-if="isAdmin">
        <router-link to="/admin">Admin</router-link>
      </li>
    </ul>

    <ul class="right-section">
      <!-- Si l'utilisateur est connecté, on affiche son profil et le bouton de déconnexion -->
      <li v-if="isAuthenticated" class="profile-section">
        <span class="username">
          {{ userName }}
        </span>
        <router-link to="/profile" class="profile-link">
          <i class="fas fa-user"></i>
        </router-link>
        <button @click="logout" class="logout-btn">
          <i class="fas fa-power-off"></i>
        </button>
      </li>

      <!-- Si l'utilisateur n'est pas connecté, on affiche le bouton de connexion -->
      <li v-if="!isAuthenticated">
        <router-link to="/login" class="login-btn">
          <i class="fas fa-power-on"></i> Se connecter
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script>
import { mapState } from "vuex";

export default {
  computed: {
    ...mapState({
      isAuthenticated: (state) => state.isAuthenticated, // Vérifie l'authentification
      isAdmin: (state) => state.user?.roleId === 1, // Vérifie si l'utilisateur est admin
      userName: (state) => state.user?.name, // Récupère le nom de l'utilisateur
    }),
  },
  methods: {
    logout() {
      this.$store.dispatch("logout"); // Déconnexion
      this.$router.push("/login"); // Redirection après la déconnexion
    },
  },
};
</script>

<style scoped>
/* Style pour le menu de navigation */
.navbar {
  background-color: #f0f0f0;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
}

ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
}

li {
  margin-right: 20px;
}

a {
  text-decoration: none;
  color: #333;
  font-weight: bold;
}

a:hover {
  color: #42b983;
}

.profile-section {
  display: flex;
  align-items: center;
}

.username {
  font-weight: bold;
  color: #444;
  font-size: 1.1em;
  margin-right: 10px;
  display: flex;
  align-items: center;
}

.profile-link {
  color: #42b983;
  margin-right: 15px;
}

button {
  background: none;
  border: none;
  color: #ff4d4d;
  cursor: pointer;
  font-size: 1.2em;
}

button:hover {
  color: #ff0000;
}

.login-btn {
  color: #42b983;
  font-size: 1.2em;
}

.login-btn i {
  margin-right: 5px;
}

/* Alignement des sections */
.left-section {
  display: flex;
  align-items: center;
}

.right-section {
  display: flex;
  align-items: center;
  margin-left: auto;
}
</style>
