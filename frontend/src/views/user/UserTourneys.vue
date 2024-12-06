<!-- src/views/user/UserTourneys.vue -->
<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-8">
      <!-- Titre de la page -->
      <TitleComponent title="Mes tournois" />
    </div>

    <!-- Grille des tournois -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      <!-- Affichage des tournois de l'utilisateur -->
      <CardEditComponent
        v-for="tourney in userTourneys"
        :key="tourney.id"
        :title="tourney.name"
        :location="tourney.location"
        :date="tourney.dateTourney"
        :status="tourney.status"
        :registration-status="tourney.registrationStatus"
        :title-color="getTitleColor(tourney)"
        @click="viewTourneyDetails(tourney)"
      />
    </div>
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import CardEditComponent from '@/components/CardEditComponent.vue';
  import TitleComponent from '@/components/TitleComponent.vue';

  export default {
    components: {
      CardEditComponent,
      TitleComponent,
    },
    data() {
      return {
        userTourneys: [],
      };
    },
    methods: {
      async fetchUserTourneys() {
        const userId = this.$store.state.user.id;
        try {
          let response;
          if (this.isAdmin()) {
            // S'il est admin global, récupérer tous les tournois
            response = await apiService.get('/tourneys');
          } else {
            // Sinon, récupérer uniquement les tournois de l'utilisateur
            response = await apiService.get(`/users/${userId}/tourneys`);
          }
          this.userTourneys = response.data;
        } catch (error) {
          console.error('Erreur lors de la récupération des tournois:', error);
        }
      },
      isAdmin() {
        return this.$store.state.user?.roleId === 1;
      },
      getTitleColor(tourney) {
        if (tourney.status === 'active') {
          return '#48bb78'; // Vert pour 'active'
        } else if (tourney.status === 'completed') {
          return '#a0aec0'; // Gris pour 'completed'
        } else {
          if (tourney.registrationStatus === 'active') {
            return '#ed8936'; // Orange pour inscriptions ouvertes
          } else if (
            tourney.registrationStatus === 'notStarted' ||
            tourney.registrationStatus === 'completed'
          ) {
            return '#f56565'; // Rouge pour inscriptions fermées
          } else {
            return '#4299e1'; // Bleu par défaut
          }
        }
      },
      isCardClickable(tourney) {
        if (this.isAdmin()) {
          return true; // Toujours cliquable pour un administrateur
        }
        // Si les inscriptions sont fermées et le tournoi n'est ni actif ni terminé
        if (
          (tourney.registrationStatus === 'draft' ||
            tourney.registrationStatus === 'notStarted') &&
          tourney.status !== 'active' &&
          tourney.status !== 'completed'
        ) {
          return false; // Ne pas permettre le clic
        }
        return true; // Permettre le clic
      },

      viewTourneyDetails(tourney) {
        if (!this.isCardClickable(tourney)) {
          return; // Ne pas rediriger si la carte n'est pas cliquable
        }

        // Priorité sur le statut du tournoi
        if (
          tourney.status === 'active' ||
          tourney.status === 'completed' ||
          this.isAdmin()
        ) {
          // Rediriger vers 'planning'
          this.$router.push(`/tourneys/${tourney.id}/planning`);
        } else if (
          tourney.registrationStatus === 'active' ||
          tourney.registrationStatus === 'completed'
        ) {
          // Rediriger vers 'join-team'
          ('Redirection vers join-team');

          this.$router.push(`/tourneys/${tourney.id}/join-team`);
        } else {
          return; // Ne pas rediriger si le statut est inconnu
        }
      },
    },
    mounted() {
      this.fetchUserTourneys();
    },
  };
</script>

<style scoped>
  /* Ajouter des styles personnalisés si nécessaire */
</style>
