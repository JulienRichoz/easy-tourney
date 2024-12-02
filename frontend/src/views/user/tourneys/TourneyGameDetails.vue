<template>
  <div class="p-6">
    <!-- Vue selon l'état du match -->
    <div v-if="matchNotStarted">
      <p>
        Le match n'a pas encore commencé. Il commencera le
        {{ startTimeFormatted }}.
      </p>
    </div>
    <div v-else-if="matchInProgress">
      <p>Le match est actuellement en cours. Bonne chance aux équipes !</p>
    </div>
    <div v-else-if="matchCompleted">
      <p>Le match est terminé. Score final :</p>
      <p>Équipe A : {{ match.scoreTeamA }}</p>
      <p>Équipe B : {{ match.scoreTeamB }}</p>
    </div>

    <!-- Section pour les assistants uniquement -->
    <div v-if="isAssistant && matchInProgress" class="mt-6">
      <h3 class="text-lg font-bold">Mise à jour des scores</h3>
      <!-- Formulaire pour mettre à jour les scores -->
      <form @submit.prevent="updateScores">
        <label class="block mt-2">
          <span>Score Équipe A :</span>
          <input v-model.number="scoreTeamA" type="number" class="input" />
        </label>
        <label class="block mt-2">
          <span>Score Équipe B :</span>
          <input v-model.number="scoreTeamB" type="number" class="input" />
        </label>
        <button type="submit" class="mt-4 btn btn-primary">
          Mettre à jour
        </button>
      </form>
    </div>
  </div>
</template>
<script>
  import apiService from '@/services/apiService';

  export default {
    data() {
      return {
        match: null, // Les détails du match
        scoreTeamA: 0,
        scoreTeamB: 0,
      };
    },
    computed: {
      startTimeFormatted() {
        if (!this.match) return '';
        const date = new Date(this.match.startTime);
        return date.toLocaleString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
      matchNotStarted() {
        const now = new Date();
        return this.match && new Date(this.match.startTime) > now;
      },
      matchInProgress() {
        const now = new Date();
        return (
          this.match &&
          new Date(this.match.startTime) <= now &&
          new Date(this.match.endTime) > now
        );
      },
      matchCompleted() {
        const now = new Date();
        return this.match && new Date(this.match.endTime) <= now;
      },
      isAssistant() {
        return this.$store.getters['userTourney/isAssistant'];
      },
    },
    methods: {
      async fetchMatchDetails() {
        try {
          const { tourneyId, gameId } = this.$route.params;
          const response = await apiService.get(
            `/tourneys/${tourneyId}/games/${gameId}`
          );
          this.match = response.data;
          this.scoreTeamA = this.match.scoreTeamA || 0;
          this.scoreTeamB = this.match.scoreTeamB || 0;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du match :',
            error
          );
        }
      },
      async updateScores() {
        try {
          const { tourneyId, gameId } = this.$route.params;
          await this.$apiService.put(
            `/tourneys/${tourneyId}/games/${gameId}/scores`,
            {
              scoreTeamA: this.scoreTeamA,
              scoreTeamB: this.scoreTeamB,
            }
          );
          alert('Scores mis à jour avec succès.');
        } catch (error) {
          console.error('Erreur lors de la mise à jour des scores :', error);
        }
      },
    },
    async mounted() {
      await this.fetchMatchDetails();
    },
  };
</script>
