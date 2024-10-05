<template>
    <div class="register-container">
      <h1>Inscription</h1>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Nom</label>
          <input type="text" v-model="name" id="name" placeholder="Entrer votre nom" required />
        </div>
  
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" v-model="email" id="email" placeholder="Entrer votre email" required />
        </div>
  
        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input type="password" v-model="password" id="password" placeholder="Entrer votre mot de passe" required />
        </div>
  
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
  
      <p v-if="error">{{ error }}</p>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
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
          await axios.post('http://localhost:3000/api/auth/register', {
            name: this.name,
            email: this.email,
            password: this.password,
            roleId: this.roleId,
          });
  
          this.$router.push('/login');
        } catch (err) {
          this.error = 'Erreur lors de l\'inscription. Veuillez vérifier vos informations.';
        }
      }
    }
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
  