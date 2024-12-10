<!-- src/views/user/tourneys/TourneyScores.vue -->
<template>
  <SubMenuComponent :tourneyId="tourneyId" />
  <div class="p-4">
    <TitleComponent title="Classement du Tournoi" />
    <div v-if="loading" class="text-center py-4">Chargement...</div>
    <div v-else>
      <div v-for="pool in results" :key="pool.poolId" class="mb-8">
        <h2 class="text-xl font-semibold mb-2">Pool : {{ pool.poolName }}</h2>
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b">
              <th class="py-2">Position</th>
              <th class="py-2">Équipe</th>
              <th class="py-2">Points</th>
              <th class="py-2">Joués</th>
              <th class="py-2">Gagnés</th>
              <th class="py-2">Nuls</th>
              <th class="py-2">Perdus</th>
              <th class="py-2">BM</th>
              <th class="py-2">BE</th>
              <th class="py-2">Diff</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(team, index) in pool.standings"
              :key="team.teamId"
              class="border-b"
            >
              <td class="py-2">{{ index + 1 }}</td>
              <td class="py-2 font-semibold">{{ team.teamName }}</td>
              <td class="py-2">{{ team.points }}</td>
              <td class="py-2">{{ team.played }}</td>
              <td class="py-2">{{ team.won }}</td>
              <td class="py-2">{{ team.drawn }}</td>
              <td class="py-2">{{ team.lost }}</td>
              <td class="py-2">{{ team.goalsFor }}</td>
              <td class="py-2">{{ team.goalsAgainst }}</td>
              <td class="py-2">{{ team.goalDiff }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import SubMenuComponent from '@/components/user/SubMenuComponent.vue';
  import TitleComponent from '@/components/TitleComponent.vue';
  import { getSocket } from '@/services/socketService';

  export default {
    components: {
      TitleComponent,
      SubMenuComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
        loading: false,
        results: [],
      };
    },
    methods: {
      async fetchScores() {
        this.loading = true;
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/scores`
          );
          this.results = response.data.results;
        } catch (error) {
          console.error('Erreur lors de la récupération des scores :', error);
        } finally {
          this.loading = false;
        }
      },
      setupSocket() {
        const socket = getSocket();
        if (!socket) {
          console.warn(
            "Socket non disponible. L'utilisateur est peut-être déconnecté."
          );
          return;
        }

        // Rejoindre la salle du tournoi
        socket.emit('joinTourney', this.tourneyId);

        // Écouter l'événement de mise à jour des scores
        socket.on('tourneyScoresUpdated', () => {
          this.fetchScores();
        });
      },
    },
    async mounted() {
      await this.fetchScores();
      this.setupSocket();
    },
    beforeUnmount() {
      const socket = getSocket();
      if (socket) {
        // Émettre un événement pour quitter la salle du tournoi si nécessaire
        socket.emit('leaveTourney', this.tourneyId);
        socket.off('tourneyScoresUpdated');
      }
    },
  };
</script>
