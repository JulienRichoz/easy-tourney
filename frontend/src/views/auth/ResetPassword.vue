<!-- src/views/auth/ResetPassword.vue -->
<!-- Page pour réinitialiser le mot de passe. -->
<template>
  <AuthComponentForm
    mode="reset-password"
    :error="error"
    :isSubmitting="isSubmitting"
    @submit="handleResetPassword"
  />
</template>

<script>
  import AuthComponentForm from '@/components/AuthComponentForm.vue';
  import apiService from '@/services/apiService';

  export default {
    name: 'ResetPassword',
    components: { AuthComponentForm },
    data() {
      return {
        error: '',
        isSubmitting: false,
      };
    },
    methods: {
      /**
       * Réinitialise le mot de passe.
       * @param {Object} formData - Les données du formulaire.
       */
      async handleResetPassword(formData) {
        this.error = '';
        this.isSubmitting = true;

        // Appel à l'API pour réinitialiser le mot de passe
        try {
          const token = this.$route.params.token; // Token récupéré dans l'URL

          await apiService.post('/auth/reset-password', {
            token,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          });
          this.$router.push({ name: 'LoginPage' });
        } catch (err) {
          console.error(
            'Erreur lors de la réinitialisation du mot de passe:',
            err
          );
          this.error =
            err.response?.data?.message ||
            'Une erreur est survenue. Veuillez réessayer.';
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
