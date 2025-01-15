<!-- src/views/auth/ForgotPassword.vue -->
<!-- Page pour demander un lien de réinitialisation du mot de passe. -->
<template>
  <AuthComponentForm
    mode="forgot-password"
    :error="error"
    :isSubmitting="isSubmitting"
    @submit="handleForgotPassword"
  />
</template>

<script>
  import AuthComponentForm from '@/components/AuthComponentForm.vue';
  import apiService from '@/services/apiService';
  import { toast } from 'vue3-toastify';

  export default {
    name: 'ForgotPassword',
    components: { AuthComponentForm },
    data() {
      return {
        error: '',
        isSubmitting: false,
      };
    },
    methods: {
      /**
       * Demande un lien de réinitialisation du mot de passe.
       * @param {Object} formData - Les données du formulaire.
       */
      async handleForgotPassword(formData) {
        this.error = '';
        this.isSubmitting = true;

        try {
          await apiService.post('/auth/forgot-password', {
            email: formData.email,
          });
          toast.success(
            'Un lien de réinitialisation a été envoyé à votre adresse email.'
          );
        } catch (err) {
          console.error(
            'Erreur lors de la demande de réinitialisation du mot de passe:',
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
