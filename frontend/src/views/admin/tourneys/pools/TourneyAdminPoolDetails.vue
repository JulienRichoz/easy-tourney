<!-- PoolDetails.vue -->
<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <div class="p-6">
      <!-- Titre avec le nom de la Pool -->
      <div class="flex items-center mb-4">
        <TitleComponent :title="`Détails de la Pool : ${pool.name}`" />
      </div>

      <!-- Section pour ajouter des équipes à la Pool -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold mb-2">Équipes non assignées</h2>
        <div v-if="unassignedTeams.length > 0">
          <form @submit.prevent="assignSelectedTeams">
            <div class="overflow-x-auto">
              <table class="min-w-full bg-white">
                <thead>
                  <tr>
                    <th class="px-4 py-2">
                      <input
                        type="checkbox"
                        v-model="selectAllUnassigned"
                        @change="toggleSelectAllUnassigned"
                      />
                    </th>
                    <th class="px-4 py-2">Nom de l'équipe</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="team in unassignedTeams"
                    :key="team.id"
                    class="border-t"
                  >
                    <td class="px-4 py-2">
                      <input
                        type="checkbox"
                        v-model="selectedUnassignedTeams"
                        :value="team.id"
                      />
                    </td>
                    <td class="px-4 py-2">{{ team.teamName }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ButtonComponent
              type="submit"
              variant="primary"
              class="mt-2"
              :disabled="selectedUnassignedTeams.length === 0"
            >
              Assigner les équipes sélectionnées à cette Pool
            </ButtonComponent>
          </form>
        </div>
        <div v-else>
          <p>Aucune équipe non assignée.</p>
        </div>
      </div>

      <!-- Section pour les équipes déjà assignées à la Pool -->
      <div>
        <h2 class="text-lg font-semibold mb-2">Équipes dans cette Pool</h2>
        <div v-if="assignedTeams.length > 0">
          <form @submit.prevent="removeSelectedTeams">
            <div class="overflow-x-auto">
              <table class="min-w-full bg-white">
                <thead>
                  <tr>
                    <th class="px-4 py-2">
                      <input
                        type="checkbox"
                        v-model="selectAllAssigned"
                        @change="toggleSelectAllAssigned"
                      />
                    </th>
                    <th class="px-4 py-2">Nom de l'équipe</th>
                    <th class="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="team in assignedTeams"
                    :key="team.id"
                    class="border-t"
                  >
                    <td class="px-4 py-2">
                      <input
                        type="checkbox"
                        v-model="selectedAssignedTeams"
                        :value="team.id"
                      />
                    </td>
                    <td class="px-4 py-2">{{ team.teamName }}</td>
                    <td class="px-4 py-2">
                      <ButtonComponent
                        variant="danger"
                        fontAwesomeIcon="trash"
                        @click="removeTeam(team.id)"
                      >
                      </ButtonComponent>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ButtonComponent
              type="submit"
              variant="danger"
              class="mt-2"
              :disabled="selectedAssignedTeams.length === 0"
            >
              Retirer les équipes sélectionnées de cette Pool
            </ButtonComponent>
          </form>
        </div>
        <div v-else>
          <p>Aucune équipe dans cette Pool.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapState, mapActions } from 'vuex';
  import apiService from '@/services/apiService';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';
  import TitleComponent from '@/components/TitleComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      TourneySubMenu,
      TitleComponent,
      ButtonComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
        poolId: this.$route.params.poolId,
        pool: {},
        teams: [],
        assignedTeams: [],
        unassignedTeams: [],
        selectedUnassignedTeams: [],
        selectedAssignedTeams: [],
        selectAllUnassigned: false,
        selectAllAssigned: false,
      };
    },
    computed: {
      ...mapState('tourney', {
        statuses: (state) => state.statuses,
      }),
      isEditable() {
        return (
          this.statuses.poolAssignmentStatus !== 'completed' &&
          this.statuses.status !== 'completed'
        );
      },
    },
    methods: {
      ...mapActions('tourney', ['fetchTourneyStatuses']),
      async fetchPoolDetails() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/pools/${this.poolId}`
          );
          const pool = response.data;
          this.pool = pool;

          // Récupérer toutes les équipes du tournoi
          const teamsResponse = await apiService.get(
            `/tourneys/${this.tourneyId}/teams`
          );
          const allTeams = teamsResponse.data;

          // Séparer les équipes assignées et non assignées
          this.assignedTeams = allTeams.filter(
            (team) => team.poolId === this.poolId
          );
          this.unassignedTeams = allTeams.filter((team) => !team.poolId);
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails de la Pool:',
            error
          );
          toast.error('Erreur lors de la récupération des détails de la Pool.');
        }
      },

      toggleSelectAllUnassigned() {
        if (this.selectAllUnassigned) {
          this.selectedUnassignedTeams = this.unassignedTeams.map(
            (team) => team.id
          );
        } else {
          this.selectedUnassignedTeams = [];
        }
      },
      toggleSelectAllAssigned() {
        if (this.selectAllAssigned) {
          this.selectedAssignedTeams = this.assignedTeams.map(
            (team) => team.id
          );
        } else {
          this.selectedAssignedTeams = [];
        }
      },
      async assignSelectedTeams() {
        try {
          await apiService.post(`/pools/${this.poolId}/assign-teams`, {
            teamIds: this.selectedUnassignedTeams,
          });
          toast.success('Équipes assignées avec succès !');
          this.selectedUnassignedTeams = [];
          this.selectAllUnassigned = false;
          this.fetchPoolDetails();
        } catch (error) {
          console.error("Erreur lors de l'assignation des équipes:", error);
          toast.error("Erreur lors de l'assignation des équipes.");
        }
      },
      async removeTeam(teamId) {
        try {
          await apiService.post(`/pools/${this.poolId}/remove-team`, {
            teamId,
          });
          toast.success('Équipe retirée avec succès !');
          this.fetchPoolDetails();
        } catch (error) {
          console.error("Erreur lors du retrait de l'équipe:", error);
          toast.error("Erreur lors du retrait de l'équipe.");
        }
      },
      async removeSelectedTeams() {
        try {
          await apiService.post(`/pools/${this.poolId}/remove-teams`, {
            teamIds: this.selectedAssignedTeams,
          });
          toast.success('Équipes retirées avec succès !');
          this.selectedAssignedTeams = [];
          this.selectAllAssigned = false;
          this.fetchPoolDetails();
        } catch (error) {
          console.error('Erreur lors du retrait des équipes:', error);
          toast.error('Erreur lors du retrait des équipes.');
        }
      },
    },
    mounted() {
      this.fetchTourneyStatuses(this.tourneyId);
      this.fetchPoolDetails();
    },
  };
</script>

<style scoped>
  /* Ajoutez vos styles ici */
</style>
