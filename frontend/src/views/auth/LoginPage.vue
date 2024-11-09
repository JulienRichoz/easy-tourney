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
  import { roles } from '@/services/permissions';
  import { toast } from 'vue3-toastify';
  import { jwtDecode } from 'jwt-decode';

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
        this.toastSuccess = null;
        this.toastError = null;
        this.isSubmitting = true;

        try {
          const response = await apiService.post('/auth/login', {
            email: formData.email,
            password: formData.password,
          });

          const token = response.data.token;
          // Stocker le token
          localStorage.setItem('token', token);
          apiService.defaults.headers.common[
            'Authorization'
          ] = `Bearer ${token}`;

          // Mettre à jour le store avec les informations utilisateur
          const userResponse = await apiService.get('/users/me');
          const user = userResponse.data;
          this.$store.commit('SET_AUTH', {
            isAuthenticated: true,
            user,
          });

          // Vérifier si un token d’invitation est présent dans le store Vuex
          const inviteToken = this.$store.state.inviteToken;
          if (inviteToken) {
            try {
              await apiService.post(`/tourneys/join`, { token: inviteToken });
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
              this.$store.dispatch('clearInviteToken'); // Nettoyer le token après usage
            }
          }

          // Redirection après connexion
          const userRole = user.roleId;
          if (userRole === roles.ADMIN) {
            this.$router.replace('/admin/tourneys').then(() => {
              if (this.toastSuccess) {
                toast.success(this.toastSuccess);
              } else if (this.toastError) {
                toast.error(this.toastError);
              }
            });
          } else {
            // Utiliser l'inviteToken pour la redirection
            const tourneyId = inviteToken
              ? jwtDecode(inviteToken).tourneyId
              : null;
            if (tourneyId) {
              this.$router.replace(`/tourneys/${tourneyId}/join-team`);
            } else {
              this.$router.replace('/tourneys').then(() => {
                if (this.toastSuccess) {
                  toast.success(this.toastSuccess);
                } else if (this.toastError) {
                  toast.error(this.toastError);
                }
              });
            }
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
