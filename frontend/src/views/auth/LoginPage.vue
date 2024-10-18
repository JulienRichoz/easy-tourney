<template>
  <div class="flex items-center justify-center pt-16 bg-gray-100">
    <div class="bg-white p-10 rounded-lg shadow-md w-full max-w-sm">
      <h1 class="text-2xl font-bold text-center mb-8">Connexion</h1>
      <form @submit.prevent="handleLogin">
        <!-- Champ email avec FormInputComponent -->
        <FormInputComponent
          id="email"
          label="Email"
          type="email"
          v-model="email"
          placeholder="Entrer votre email"
          :required="true"
          :validate="true"
          class="mb-6"
          :touched="emailTouched"
          @blur="emailTouched = true"
        />

        <!-- Champ mot de passe avec FormInputComponent -->
        <FormInputComponent
          id="password"
          label="Mot de passe"
          type="password"
          v-model="password"
          placeholder="Entrer votre mot de passe"
          :required="true"
          class="mb-6"
          :touched="passwordTouched"
          @blur="passwordTouched = true"
        />

        <ButtonComponent variant="primary" type="submit" class="w-full">
          Se connecter
        </ButtonComponent>
      </form>
      <p v-if="error" class="text-red-500 mt-4 text-center font-semibold">
        {{ error }}
      </p>
      <p class="text-center mt-6">
        Pas de compte ?
        <router-link
          to="/register"
          class="text-green-500 hover:text-green-600 font-semibold"
          >Créer un compte</router-link
        >
      </p>
    </div>
  </div>
</template>

<script>
  import apiService from '../../services/apiService';
  import { jwtDecode } from 'jwt-decode';
  import FormInputComponent from '../../components/FormInputComponent.vue';
  import ButtonComponent from '../../components/ButtonComponent.vue';
  import { roles } from '@/services/permissions';

  export default {
    name: 'LoginPage',
    components: {
      FormInputComponent,
      ButtonComponent,
    },
    data() {
      return {
        email: '',
        password: '',
        error: '',
        emailTouched: false,
        passwordTouched: false,
      };
    },
    methods: {
      async handleLogin() {
        if (!this.email || !this.password) {
          this.error = 'Tous les champs sont obligatoires.';
          return;
        }
        try {
          const response = await apiService.post('/auth/login', {
            email: this.email,
            password: this.password,
          });

          const token = response.data.token;

          // Stocker le token
          localStorage.setItem('token', token);

          // Décoder le token
          const decoded = jwtDecode(token);

          // Mettre à jour le store avec les informations utilisateur
          this.$store.commit('SET_AUTH', {
            isAuthenticated: true,
            user: decoded,
          });

          // Redirection selon le rôle de l'utilisateur
          if (decoded.roleId === roles.ADMIN) {
            this.$router.replace('/admin');
          } else {
            this.$router.replace('/user');
          }
        } catch (err) {
          console.error('Erreur lors de la connexion:', err);
          this.error = 'Identifiant ou mot de passe incorrect.';
        }
      },
    },
  };
</script>
