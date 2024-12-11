<template>
  <SubMenuComponent :tourneyId="tourneyId" />
  <div
    class="p-4 bg-light-background dark:bg-dark-background transition-colors duration-300"
  >
    <div class="flex justify-between items-center mb-4">
      <TitleComponent title="Classement du Tournoi" />
      <ButtonComponent @click="toggleView" class="py-2 px-4">
        {{ compactView ? 'Vue détaillée' : 'Vue compacte' }}
      </ButtonComponent>
    </div>
    <div v-if="loading" class="text-center py-4">Chargement...</div>
    <div v-else>
      <div
        :class="[
          'grid gap-4',
          compactView
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1',
        ]"
      >
        <div
          v-for="pool in results"
          :key="pool.poolId"
          class="p-4 rounded shadow bg-light-card dark:bg-dark-card"
        >
          <h2
            class="text-xl font-semibold mb-4 text-center text-light-title dark:text-dark-title"
          >
            {{ pool.poolName }}
          </h2>
          <div>
            <table class="w-full text-left border-collapse">
              <thead>
                <tr
                  class="border-b bg-light-details.background dark:bg-dark-details.background"
                >
                  <th class="py-2 px-2 text-light-text dark:text-dark-text">
                    Pos
                  </th>
                  <th class="py-2 px-2 text-light-text dark:text-dark-text">
                    Team
                  </th>
                  <th class="py-2 px-2 text-light-text dark:text-dark-text">
                    Pts
                  </th>
                  <th class="py-2 px-2 text-light-text dark:text-dark-text">
                    J
                  </th>
                  <th class="py-2 px-2 text-light-text dark:text-dark-text">
                    G
                  </th>
                  <th class="py-2 px-2 text-light-text dark:text-dark-text">
                    N
                  </th>
                  <th class="py-2 px-2 text-light-text dark:text-dark-text">
                    P
                  </th>
                  <th class="py-2 px-2 text-light-text dark:text-dark-text">
                    BM
                  </th>
                  <th class="py-2 px-2 text-light-text dark:text-dark-text">
                    BE
                  </th>
                  <th class="py-2 px-2 text-light-text dark:text-dark-text">
                    Diff
                  </th>
                </tr>
              </thead>
              <transition-group
                tag="tbody"
                name="list"
                class="transition-wrapper"
              >
                <tr
                  v-for="(team, index) in sortedStandings(pool.standings)"
                  :key="team.teamId"
                  :class="[
                    'border-b hover:bg-light-details.hover dark:hover:bg-dark-details.hover',
                    compactView ? 'text-sm' : 'text-base',
                  ]"
                >
                  <td class="py-2 px-2 text-center">{{ index + 1 }}</td>
                  <td class="py-2 px-2 font-semibold">{{ team.teamName }}</td>
                  <td class="py-2 px-2 text-center">{{ team.points }}</td>
                  <td class="py-2 px-2 text-center">{{ team.played }}</td>
                  <td class="py-2 px-2 text-center">{{ team.won }}</td>
                  <td class="py-2 px-2 text-center">{{ team.drawn }}</td>
                  <td class="py-2 px-2 text-center">{{ team.lost }}</td>
                  <td class="py-2 px-2 text-center">{{ team.goalsFor }}</td>
                  <td class="py-2 px-2 text-center">{{ team.goalsAgainst }}</td>
                  <td class="py-2 px-2 text-center">{{ team.goalDiff }}</td>
                </tr>
              </transition-group>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import SubMenuComponent from '@/components/user/SubMenuComponent.vue';
  import TitleComponent from '@/components/TitleComponent.vue';
  import { getSocket } from '@/services/socketService';
  import ButtonComponent from '@/components/ButtonComponent.vue';

  export default {
    components: {
      TitleComponent,
      SubMenuComponent,
      ButtonComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
        loading: true, // Initial loading state
        results: [],
        compactView: false,
      };
    },
    methods: {
      async fetchScores(showLoading = true) {
        if (showLoading) {
          this.loading = true;
        }
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/scores`
          );
          this.results = response.data.results;
        } catch (error) {
          console.error('Erreur lors de la récupération des scores :', error);
        } finally {
          if (showLoading) {
            this.loading = false;
          }
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

        socket.emit('joinTourney', this.tourneyId);

        socket.on('tourneyScoresUpdated', () => {
          // Fetch scores without showing loading indicator
          this.fetchScores(false);
        });
      },
      sortedStandings(standings) {
        // Retourner une copie triée pour éviter la mutation directe
        return [...standings].sort((a, b) => {
          if (a.points !== b.points) return b.points - a.points;
          if (a.played !== b.played) return a.played - b.played;
          return b.goalDiff - a.goalDiff;
        });
      },
      toggleView() {
        this.compactView = !this.compactView;
      },
    },
    async mounted() {
      await this.fetchScores(); // Initial fetch with loading=true
      this.setupSocket();
    },
    beforeUnmount() {
      const socket = getSocket();
      if (socket) {
        socket.emit('leaveTourney', this.tourneyId);
        socket.off('tourneyScoresUpdated');
      }
    },
  };
  // TODO doc. https://vuejs.org/guide/built-ins/transition-group
</script>

<style scoped>
  /* Transition styles for the list */
  .list-enter-active,
  .list-leave-active {
    transition: all 0.5s ease;
  }
  .list-enter-from,
  .list-leave-to {
    opacity: 0;
    transform: translateY(-10px);
  }
  .list-move {
    transition: transform 0.5s;
  }

  /* Optional: To prevent layout shift during transitions */
  .transition-wrapper {
    display: contents;
  }
</style>
