<!-- src/views/admin/TourneyUnassignedTeams.vue -->
<!-- Page pour gérer les équipes sans pool -->
<template>
  <div class="mx-auto p-4">
    <div
      class="p-4 bg-light-background dark:bg-dark-background rounded-md shadow-lg"
    >
      <!-- Header with Title and Back Button -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <TitleComponent title="Équipes sans Pool" />
        </div>

        <!-- Back Button -->
        <ButtonComponent
          variant="secondary"
          fontAwesomeIcon="arrow-left"
          @click="goBack"
        >
          <span class="hidden sm:inline">Retour</span>
        </ButtonComponent>
      </div>

      <!-- Message if no pools are available -->
      <p
        v-if="!hasAvailablePools"
        class="text-light-errorMessage dark:text-dark-errorMessage mb-4 font-bold"
      >
        Aucune pool disponible. Veuillez en créer de nouvelles ou réassigner des
        équipes.
      </p>

      <!-- Table to display unassigned teams -->
      <div class="overflow-x-auto overflow-y-auto max-h-[70vh] mt-4">
        <table
          class="min-w-full bg-light-card dark:bg-dark-card shadow rounded-lg"
        >
          <thead>
            <tr>
              <!-- Team Name Column -->
              <th
                class="px-4 py-2 text-left text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
              >
                Nom de l'équipe
              </th>
              <!-- Assign to Pool Column -->
              <th
                class="px-4 py-2 text-left text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
              >
                Assigner à une Pool
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="team in unassignedTeams"
              :key="team.id"
              class="hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground"
            >
              <!-- Team Name -->
              <td class="px-4 py-2">
                <router-link
                  :to="`/admin/tourneys/${tourneyId}/teams/${team.id}/users`"
                  class="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {{ team.teamName || 'N/A' }}
                </router-link>
              </td>
              <!-- Assign to Pool -->
              <td class="px-4 py-2 flex items-center space-x-2">
                <v-select
                  v-model="selectedPoolIds[team.id]"
                  :options="poolOptions"
                  placeholder="Sélectionner une Pool"
                  label="name"
                  :reduce="(pool) => pool.id"
                  appendToBody
                  clearable
                  class="w-full sm:w-64"
                  :disabled="!hasAvailablePools"
                />
                <ButtonComponent
                  variant="primary"
                  size="sm"
                  fontAwesomeIcon="check"
                  @click="handleAssignPool(team.id)"
                  :disabled="!selectedPoolIds[team.id] || !hasAvailablePools"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import TitleComponent from '@/components/TitleComponent.vue';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      ButtonComponent,
      TitleComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
        unassignedTeams: [],
        pools: [],
        selectedPoolIds: {},
      };
    },
    computed: {
      hasAvailablePools() {
        return this.poolOptions.length > 0;
      },
      poolOptions() {
        return this.pools
          .filter((pool) => {
            const maxTeams = pool.maxTeamPerPool || Infinity;
            return pool.teams.length < maxTeams;
          })
          .map((pool) => ({
            id: pool.id,
            name: `${pool.name} (${pool.teams.length}/${
              pool.maxTeamPerPool || '∞'
            })`,
          }));
      },
    },
    async created() {
      await this.fetchData();
    },
    methods: {
      async fetchData() {
        try {
          // Fetch unassigned teams
          const teamsResponse = await apiService.get(
            `/tourneys/${this.tourneyId}/teams/unassigned`
          );
          this.unassignedTeams = teamsResponse.data;

          // Fetch pools with their teams
          const poolsResponse = await apiService.get(
            `/tourneys/${this.tourneyId}/pools-details`
          );
          this.pools = poolsResponse.data.pools;

          // Initialize selectedPoolIds
          this.unassignedTeams.forEach((team) => {
            if (!(team.id in this.selectedPoolIds)) {
              this.selectedPoolIds[team.id] = null;
            }
          });
        } catch (error) {
          console.error('Erreur lors de la récupération des données:', error);
          toast.error('Erreur lors de la récupération des données.');
        }
      },

      /**
       * Assign a team to a pool.
       * @param {number} teamId - The ID of the team to assign.
       */
      async handleAssignPool(teamId) {
        const poolId = this.selectedPoolIds[teamId];
        if (poolId) {
          try {
            await apiService.post(
              `/tourneys/${this.tourneyId}/pools/${poolId}/assign-teams`,
              { teamIds: [teamId] }
            );
            toast.success('Équipe assignée à la pool avec succès.');

            // Update local data instead of re-fetching
            // Remove the team from unassignedTeams
            this.unassignedTeams = this.unassignedTeams.filter(
              (team) => team.id !== teamId
            );
            // Clear the selection for this team
            delete this.selectedPoolIds[teamId];

            // Update the pools data
            const poolIndex = this.pools.findIndex(
              (pool) => pool.id === poolId
            );
            if (poolIndex !== -1) {
              // Update the teams array and increment teams.length
              const pool = this.pools[poolIndex];
              pool.teams.push({ id: teamId }); // We can add more team data if needed
              // If pool is now full, remove it from pools
              const maxTeams = pool.maxTeamPerPool || Infinity;
              if (pool.teams.length >= maxTeams) {
                // Remove the pool from pools
                this.pools.splice(poolIndex, 1);
                // Remove this pool from selectedPoolIds if it was selected for other teams
                Object.keys(this.selectedPoolIds).forEach((key) => {
                  if (this.selectedPoolIds[key] === poolId) {
                    this.selectedPoolIds[key] = null;
                  }
                });
              } else {
                // Update the pool in pools
                this.pools.splice(poolIndex, 1, pool);
              }
            }
          } catch (error) {
            console.error("Erreur lors de l'assignation de la pool:", error);
            toast.error("Erreur lors de l'assignation de la pool.");
          }
        } else {
          toast.info('Veuillez sélectionner une pool.');
        }
      },
      navigateToTeam(teamId) {
        this.$router.push(
          `/admin/tourneys/${this.tourneyId}/teams/${teamId}/users`
        );
      },
      goBack() {
        this.$router.push(`/admin/tourneys/${this.tourneyId}/pools`);
      },
    },
  };
</script>

<style scoped>
  /* Styles for the table */
  table th,
  table td {
    padding: 0.5rem;
    white-space: nowrap;
  }
</style>
