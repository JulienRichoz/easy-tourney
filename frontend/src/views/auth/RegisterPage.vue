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
  import { jwtDecode } from 'jwt-decode';
  import { roles } from '@/services/permissions';
  import { toast } from 'vue3-toastify';

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
          // Créer le nouvel utilisateur
          const response = await apiService.post('/auth/register', {
            name: formData.name,
            email: formData.email,
            password: formData.password,
          });

          const token = response.data.token;
          // Stocker le token dans le localStorage
          localStorage.setItem('token', token);
          apiService.defaults.headers.common[
            'Authorization'
          ] = `Bearer ${token}`;

          // Mettre à jour le store Vuex avec les informations utilisateur
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
              this.$store.dispatch('clearInviteToken'); // Nettoyer le token d'invitation après usage
            }
          }

          // Redirection après inscription
          const userRole = user.roleId;
          if (userRole === roles.ADMIN) {
            this.$router.replace('/tourneys'); // Admin vers tournois
          } else {
            // Utiliser l'inviteToken pour la redirection
            const tourneyId = inviteToken
              ? jwtDecode(inviteToken).tourneyId
              : null;
            if (tourneyId) {
              this.$router.replace(`/tourneys/${tourneyId}`);
            } else {
              this.$router.replace('/user'); // Autres utilisateurs vers page user par défaut
            }
          }
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
