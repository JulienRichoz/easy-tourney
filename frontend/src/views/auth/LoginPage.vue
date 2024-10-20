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
            this.$router.replace('/admin');
          } else {
            this.$router.replace('/user');
          }
        } catch (err) {
          console.error('Erreur lors de la connexion:', err);
          this.error = 'Identifiant ou mot de passe incorrect.';
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
