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
        @click="viewTourneyDetails(tourney.id)"
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
          const response = await apiService.get(`/users/${userId}/tourneys`);
          this.userTourneys = response.data;
        } catch (error) {
          console.error('Erreur lors de la récupération des tournois:', error);
        }
      },
      viewTourneyDetails(tourneyId) {
        this.$router.push(`/tourneys/${tourneyId}/join-team`);
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
