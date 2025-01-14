<!-- src/views/auth/RegisterPage.vue -->
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
  import { roles } from '@/services/permissions';
  import { toast } from 'vue3-toastify';
  import { jwtDecode } from 'jwt-decode'; // On ne l'utilise que pour l'inviteToken, si besoin

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
          // 1) Créer le nouvel utilisateur (POST /auth/register)
          await apiService.post('/auth/register', {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          });

          // 2) Récupérer l'utilisateur via /users/me
          const userResponse = await apiService.get('/users/me');
          const user = userResponse.data;

          // 3) On met à jour le store
          this.$store.commit('SET_AUTH', {
            isAuthenticated: true,
            user, // Pas de token, juste l'user
          });

          // 4) Gestion de l'inviteToken
          const inviteToken = this.$store.state.inviteToken;
          if (inviteToken) {
            try {
              await apiService.post(`/tourneys/join`, {
                token: inviteToken,
              });
              toast.success('Vous avez rejoint le tournoi avec succès.');
            } catch (err) {
              console.error('Erreur lors de la jonction au tournoi:', err);
              if (err.response && err.response.status === 400) {
                toast.error(
                  err.response.data.message ||
                    'Impossible de rejoindre le tournoi.'
                );
              } else {
                toast.error('Erreur lors de la jonction au tournoi.');
              }
            } finally {
              this.$store.dispatch('clearInviteToken');
            }
          }

          // 5) Redirection selon le rôle
          const userRole = user.roleId;
          if (userRole === roles.ADMIN) {
            this.$router.replace('/admin/tourneys'); // Admin => /admin
          } else {
            // Sinon => /profile (ou /tourneys)
            // Si tu veux gérer l'inviteToken (et un possible tourneyId)
            // tu peux faire un decode sur inviteToken si besoin
            const tourneyId = inviteToken
              ? jwtDecode(inviteToken).tourneyId
              : null;
            if (tourneyId) {
              this.$router.replace(`/tourneys/${tourneyId}/join-team`);
            } else {
              this.$router.replace('/profile');
            }
          }
        } catch (err) {
          console.error("Erreur lors de l'inscription:", err);
          if (err.response && err.response.data && err.response.data.message) {
            this.error = err.response.data.message;
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
  /* Tailwind CSS ou tes styles custom */
</style>
