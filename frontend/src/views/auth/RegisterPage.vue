<!-- src/views/RegisterPage.vue -->
<template>
  <AuthComponentForm
    mode="register"
    :error="error"
    :isSubmitting="isSubmitting"
    @submit="handleRegister"
  />
</template>

<script>
  import AuthComponentForm from '@/components/AuthComponentForm.vue';
  import apiService from '@/services/apiService';

  export default {
    name: 'RegisterPage',
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
      async handleRegister(formData) {
        this.error = '';
        this.isSubmitting = true;

        try {
          await apiService.post('/auth/register', {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            roleId: formData.roleId,
          });

          // Rediriger vers la page de connexion après l'inscription
          this.$router.push('/login');
        } catch (err) {
          console.error("Erreur lors de l'inscription:", err);
          if (err.response && err.response.data && err.response.data.message) {
            this.error = err.response.data.message; // Utilise le message d'erreur renvoyé par le serveur
          } else {
            this.error =
              "Erreur lors de l'inscription. Veuillez vérifier vos informations.";
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
