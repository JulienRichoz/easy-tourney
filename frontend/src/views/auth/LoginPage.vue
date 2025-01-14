<!-- src/views/auth/LoginPage.vue -->
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
  // On supprime import { jwtDecode } from 'jwt-decode' pour le token d'auth
  // (inutile en cookie httpOnly).
  // On peut le garder si on veut décoder l'inviteToken, voir plus bas.

  import { jwtDecode } from 'jwt-decode'; // <= On le garde UNIQUEMENT si on veut décoder l'inviteToken.

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
          // 1) Appel /auth/login -> le serveur place le cookie httpOnly
          await apiService.post('/auth/login', {
            email: formData.email,
            password: formData.password,
          });

          // 2) On récupère l'utilisateur depuis /users/me
          const userResponse = await apiService.get('/users/me');
          const user = userResponse.data;

          // 3) Mettre à jour le store Vuex
          this.$store.commit('SET_AUTH', {
            isAuthenticated: true,
            user, // On stocke juste l'utilisateur, pas le token
          });

          // 4) Vérifier si on a un inviteToken (distinct du JWT auth)
          const inviteToken = this.$store.state.inviteToken;
          if (inviteToken) {
            // Décoder l'inviteToken pour en extraire le tourneyId
            // (Sauf si c’est un simple string, on peut le gérer autrement)
            const decodedInvite = jwtDecode(inviteToken);
            if (!decodedInvite || !decodedInvite.tourneyId) {
              toast.error('Token d’invitation invalide.');
              this.$store.dispatch('clearInviteToken');
            } else {
              // Joindre le tournoi
              try {
                await apiService.post(`/tourneys/join`, { token: inviteToken });
              } catch (err) {
                console.error('Erreur lors de la jonction au tournoi:', err);
                toast.error('Impossible de rejoindre le tournoi.');
              } finally {
                this.$store.dispatch('clearInviteToken'); // Nettoyer le token après usage
              }
            }
          }

          // 5) Redirection selon le rôle
          const userRole = user.roleId;
          if (userRole === roles.ADMIN) {
            this.$router.replace('/admin/tourneys');
          } else {
            // S’il y avait un inviteToken, on essaye de rediriger vers /join-team
            // (Mais on l’a peut-être déjà fait si on a un code au-dessus)
            // Donc tu peux juste envoyer vers "/tourneys"
            this.$router.replace('/tourneys');
          }
        } catch (err) {
          console.error('Erreur lors de la connexion:', err);

          // Gestion des messages d'erreur
          if (err.code === 'ERR_NETWORK' || !err.response) {
            this.error =
              'Le serveur de connexion est injoignable. Veuillez réessayer plus tard.';
          } else if (err.response && err.response.status === 401) {
            this.error = 'Identifiant ou mot de passe incorrect.';
          } else {
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
  /* Tailwind CSS ou tes styles custom */
</style>
