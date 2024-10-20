<!-- src/views/LoginPage.vue -->
<template>
  <AuthComponentForm
    mode="login"
    :error="error"
    :isSubmitting="isSubmitting"
    @submit="handleLogin"
  />
</template>

<script>
  import AuthComponentForm from '@/components/AuthComponentForm.vue';
  import apiService from '@/services/apiService';
  import { jwtDecode } from 'jwt-decode'; // Assurez-vous d'avoir installé ce package
  import { roles } from '@/services/permissions';

  export default {
    name: 'LoginPage',
    components: {
      AuthComponentForm,
    },
    data() {
      return {
        error: '',
        isSubmitting: false,
      };
    },
    methods: {
      async handleLogin(formData) {
        this.error = '';
        this.isSubmitting = true;

        try {
          const response = await apiService.post('/auth/login', {
            email: formData.email,
            password: formData.password,
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
            this.$router.replace('/tourneys');
          } else {
            this.$router.replace('/user');
          }
        } catch (err) {
          console.error('Erreur lors de la connexion:', err);

          if (err.code === 'ERR_NETWORK' || !err.response) {
            // Erreur réseau
            this.error =
              'Le serveur de connexion est injoignable. Veuillez ressayer plus tard.';
          } else if (err.response && err.response.status === 401) {
            // Identifiants incorrects
            this.error = 'Identifiant ou mot de passe incorrect.';
          } else {
            // Autres erreurs
            this.error = 'Une erreur est survenue. Veuillez réessayer.';
          }
        } finally {
          this.isSubmitting = false;
        }
      },
    },
  };
</script>

<style scoped>
  /* Les styles sont gérés via Tailwind CSS */
</style>
