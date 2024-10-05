<template>
  <div class="login-container">
    <h1>Connexion</h1>
    <form @submit.prevent="handleLogin">
      <!-- Champ email avec FormInputComponent -->
      <FormInputComponent
        id="email"
        label="Email"
        type="email"
        v-model="email"
        placeholder="Entrer votre email"
        required
      />

      <!-- Champ mot de passe avec FormInputComponent -->
      <FormInputComponent
        id="password"
        label="Mot de passe"
        type="password"
        v-model="password"
        placeholder="Entrer votre mot de passe"
        required
      />

      <button type="submit">Se connecter</button>
    </form>
    <p>Pas de compte ? <router-link to="/register">Créer un compte</router-link></p>

    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script>
import apiService from "../../services/apiService";
import { jwtDecode } from "jwt-decode";
import FormInputComponent from "../../components/FormInputComponent.vue";

export default {
  name: "LoginPage",
  components: {
    FormInputComponent,
  },
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
        const response = await apiService.post("/auth/login", {
          email: this.email,
          password: this.password,
        });

        const token = response.data.token;
        const decoded = jwtDecode(token);

        localStorage.setItem("token", token);

        this.$store.commit("SET_AUTH", {
          isAuthenticated: true,
          userRole: decoded.roleId,
          user: decoded,
        });

        if (decoded.roleId === 1) {
          this.$router.push("/admin");
        } else {
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
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
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

button:hover {
  background-color: #37a774;
}
</style>
