<template>
  <div class="register-container">
    <h1>Inscription</h1>
    <form @submit.prevent="handleRegister">
      <!-- Champ Nom -->
      <FormInputComponent
        id="name"
        label="Nom"
        v-model="name"
        placeholder="Entrer votre nom"
        required
      />

      <!-- Champ Email -->
      <FormInputComponent
        id="email"
        label="Email"
        type="email"
        v-model="email"
        placeholder="Entrer votre email"
        required
      />

      <!-- Champ Mot de Passe -->
      <FormInputComponent
        id="password"
        label="Mot de passe"
        type="password"
        v-model="password"
        placeholder="Entrer votre mot de passe"
        required
      />

      <!-- Champ Rôle -->
      <div class="form-group">
        <label for="role">Rôle</label>
        <select v-model="roleId" id="role" required>
          <option value="1">Admin</option>
          <option value="2">Assistant</option>
          <option value="3">Player</option>
          <option value="4">Guest</option>
        </select>
      </div>

      <button type="submit">S'inscrire</button>
    </form>

    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script>
import apiService from "../../services/apiService";
import FormInputComponent from "../../components/FormInputComponent.vue";

export default {
  name: "RegisterPage",
  components: {
    FormInputComponent,
  },
  data() {
    return {
      name: '',
      email: '',
      password: '',
      roleId: 3, // Valeur par défaut pour 'Player'
      error: ''
    };
  },
  methods: {
    async handleRegister() {
      try {
        await apiService.post('/auth/register', {
          name: this.name,
          email: this.email,
          password: this.password,
          roleId: this.roleId,
        });

        this.$router.push('/user');
      } catch (err) {
        this.error = 'Erreur lors de l\'inscription. Veuillez vérifier vos informations.';
      }
    }
  }
};
</script>

<style scoped>
.register-container {
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

select {
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

button:hover {
  background-color: #37a774;
}

.error-message {
  color: #ff4d4d;
  margin-top: 10px;
}
</style>
