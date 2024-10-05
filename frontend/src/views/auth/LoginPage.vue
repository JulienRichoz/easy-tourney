<template>
  <div class="login-container">
    <h1>Connexion</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          v-model="email"
          id="email"
          placeholder="Entrer votre email"
          required
        />
      </div>

      <div class="form-group">
        <label for="password">Mot de passe</label>
        <input
          type="password"
          v-model="password"
          id="password"
          placeholder="Entrer votre mot de passe"
          required
        />
      </div>

      <button type="submit">Se connecter</button>
    </form>
    <p>Pas de compte ? <router-link to="/register">Créer un compte</router-link></p>

    <p v-if="error">{{ error }}</p>
  </div>
</template>
<script>
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Corrige l'import

export default {
  name: "LoginPage",
  data() {
    return {
      email: "",
      password: "",
      error: "",
    };
  },
  methods: {
    async handleLogin() {
      try {
        // 1. Appel à l'API pour se connecter
        const response = await axios.post("http://localhost:3000/api/auth/login", {
          email: this.email,
          password: this.password,
        });

        // 2. Récupérer le token et décoder le JWT pour obtenir le rôle
        const token = response.data.token;
        const decoded = jwtDecode(token);
        console.log("Decoded token:", decoded); // Ajoute ce log pour voir tout ce qui est décodé
        console.log("Role ID:", decoded.roleId); // Log du roleId pour vérifier
        console.log("name:", decoded.name); // Log du roleId pour vérifier
        // 3. Stocker le token dans le localStorage
        localStorage.setItem("token", token);

        // 4. Mettre à jour le store Vuex avec les informations d'authentification
        this.$store.commit("SET_AUTH", {
          isAuthenticated: true,
          userRole: decoded.roleId, // Met à jour le rôle
          user: decoded, // Stocke les informations de l'utilisateur
        });

        // 5. Redirection en fonction du rôle
        if (decoded.roleId === 1) {
          console.log("redirecting to admin");
          this.$router.push("/admin");
        } else {
          console.log("redirecting to user");
          this.$router.push("/user");
        }
      } catch (err) {
        this.error = "Erreur lors de la connexion. Veuillez vérifier vos identifiants.";
      }
    },
  },
};
</script>

<style scoped>
/* Styles inchangés */
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
