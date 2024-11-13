<!-- TourneyPoolDetails.vue -->
<template>
  <div class="p-6" v-if="pool">
    <div class="flex items-center mb-4 relative">
      <TitleComponent :title="`Détails : ${pool.name}`" />
      <!-- Bouton Retour -->
      <ButtonComponent
        variant="secondary"
        fontAwesomeIcon="arrow-left"
        class="absolute right-0"
        @click="goBackToPools"
      >
        <span class="hidden sm:inline">Retour aux Pools</span>
      </ButtonComponent>
    </div>

    <!-- Section pour les équipes déjà assignées à la Pool -->
    <div class="mb-8">
      <h2
        :class="[
          'text-lg',
          'font-semibold',
          'mb-2',
          'text-light-poolDetails-text',
          'dark:text-dark-poolDetails-text',
        ]"
      >
        Équipes dans cette Pool ({{ assignedTeams.length }}/{{
          this.pool.maxTeamPerPool
        }})
      </h2>
      <div v-if="assignedTeams.length > 0">
        <form @submit.prevent="removeSelectedTeams">
          <div class="overflow-x-auto">
            <table
              :class="[
                'min-w-full',
                'bg-light-poolDetails-card',
                'dark:bg-dark-poolDetails-card',
                'rounded-lg',
                'shadow-md',
              ]"
            >
              <thead>
                <tr
                  :class="[
                    'dark:bg-dark-menu',
                    'border-b',
                    'dark:hover:bg-dark-menu',
                  ]"
                >
                  <th class="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      v-model="selectAllAssigned"
                      @change="toggleSelectAllAssigned"
                    />
                    <span class="ml-2">All</span>
                  </th>
                  <th class="px-4 py-3 text-left">Nom de l'équipe</th>
                  <th class="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="team in assignedTeams"
                  :key="team.id"
                  :class="[
                    'border-t',
                    'hover:bg-light-poolDetails-hover',
                    'dark:hover:bg-dark-poolDetails-card',
                    'cursor-pointer',
                    {
                      'bg-light-poolDetails-selectedErase dark:bg-dark-poolDetails-selectedErase':
                        selectedAssignedTeams.includes(team.id),
                    },
                  ]"
                  @click="toggleRemoveTeamSelection(team.id)"
                >
                  <td class="px-4 py-2">
                    <input
                      type="checkbox"
                      v-model="selectedAssignedTeams"
                      :value="team.id"
                      @click.stop
                    />
                  </td>
                  <td class="px-4 py-2">
                    <router-link
                      :to="`/admin/tourneys/${tourneyId}/teams/${team.id}/users`"
                      class="text-blue-600 hover:underline dark:text-blue-400"
                      @click.stop
                    >
                      {{ team.teamName }}
                    </router-link>
                  </td>
                  <td class="px-4 py-2">
                    <SoftButtonComponent
                      fontAwesomeIcon="fa-trash"
                      iconClass="w-4 h-4 text-red-500 hover:text-red-700"
                      aria-label="Retirer du pool"
                      @click="removeTeam(team.id)"
                    />
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
            Retirer
          </ButtonComponent>
        </form>
      </div>
      <div v-else>
        <p
          :class="[
            'text-light-poolDetails-text',
            'dark:text-dark-poolDetails-text',
          ]"
        >
          Aucune équipe dans cette Pool.
        </p>
      </div>
    </div>

    <!-- Section pour ajouter des équipes à la Pool -->
    <div>
      <h2
        :class="[
          'text-lg',
          'font-semibold',
          'mb-2',
          'text-light-poolDetails-text',
          'dark:text-dark-poolDetails-text',
        ]"
      >
        Équipes non assignées
      </h2>
      <div v-if="unassignedTeams.length > 0" class="relative">
        <form @submit.prevent="assignSelectedTeams">
          <div class="overflow-x-auto max-h-60 overflow-y-auto">
            <table
              :class="[
                'min-w-full',
                'bg-light-poolDetails-card',
                'dark:bg-dark-poolDetails-card',
                'rounded-lg',
                'shadow-md',
              ]"
            >
              <thead>
                <tr
                  :class="[
                    'border-b',
                    'dark:bg-dark-menu',
                    'dark:hover:bg-dark-menu',
                  ]"
                >
                  <th class="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      v-model="selectAllUnassigned"
                      @change="toggleSelectAllUnassigned"
                    />
                    <span class="ml-2">All</span>
                  </th>
                  <th class="px-4 py-3 text-left">Nom de l'équipe</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="team in unassignedTeams"
                  :key="team.id"
                  :class="[
                    'border-t',
                    'hover:bg-light-poolDetails-hover',
                    'dark:hover:bg-dark-poolDetails-hover',
                    'cursor-pointer',
                    {
                      'bg-light-poolDetails-selected dark:bg-dark-poolDetails-selected':
                        selectedUnassignedTeams.includes(team.id),
                    },
                  ]"
                  @click="toggleTeamSelection(team.id)"
                >
                  <td class="px-4 py-2">
                    <input
                      type="checkbox"
                      v-model="selectedUnassignedTeams"
                      :value="team.id"
                      @click.stop
                    />
                  </td>
                  <td class="px-4 py-2">
                    <router-link
                      :to="`/admin/tourneys/${tourneyId}/teams/${team.id}/users`"
                      class="text-blue-600 hover:underline dark:text-blue-400"
                      @click.stop
                    >
                      {{ team.teamName }}
                    </router-link>
                  </td>
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
            Assigner
          </ButtonComponent>
        </form>
      </div>
      <div v-else>
        <p
          :class="[
            'text-light-poolDetails-text',
            'dark:text-dark-poolDetails-text',
          ]"
        >
          Aucune équipe non assignée.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapState, mapActions } from 'vuex';
  import apiService from '@/services/apiService';
  import TitleComponent from '@/components/TitleComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import SoftButtonComponent from '@/components/SoftButtonComponent.vue';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      TitleComponent,
      ButtonComponent,
      SoftButtonComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
        poolId: this.$route.params.poolId,
        pool: null,
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
      maxTeamsPerPool() {
        return (
          this.pool.maxTeamPerPool || this.pool.defaultMaxTeamPerPool || '∞'
        );
      },
    },
    methods: {
      ...mapActions('tourney', ['fetchTourneyStatuses']),
      async fetchPoolDetails() {
        try {
          // Récupérer les détails de la pool, incluant les équipes assignées
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/pools/${this.poolId}`
          );
          this.pool = response.data;

          // Récupérer toutes les équipes du tournoi et filtrer
          const teamsResponse = await apiService.get(
            `/tourneys/${this.tourneyId}/teams`
          );
          const allTeams = teamsResponse.data;

          // Séparer les équipes non assignées, sans assistant et sans poolId
          this.unassignedTeams = allTeams.filter(
            (team) => team.type === 'player' && !team.poolId
          );

          // Utiliser les équipes assignées directement de `this.pool`
          this.assignedTeams = this.pool.teams;
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
          // Vérifier si l'ajout des équipes ne dépasse pas la capacité maximale
          const totalTeamsAfterAssignment =
            this.assignedTeams.length + this.selectedUnassignedTeams.length;
          const maxTeams =
            this.pool.maxTeamPerPool ||
            this.pool.defaultMaxTeamPerPool ||
            Number.MAX_SAFE_INTEGER;

          if (maxTeams && totalTeamsAfterAssignment > maxTeams) {
            toast.error(
              `Impossible d'assigner les équipes : la pool atteindrait sa capacité maximale de ${maxTeams} équipes.`
            );
            return;
          }

          await apiService.post(
            `/tourneys/${this.tourneyId}/pools/${this.poolId}/assign-teams`,
            {
              teamIds: this.selectedUnassignedTeams,
            }
          );
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
          await apiService.post(
            `/tourneys/${this.tourneyId}/pools/${this.poolId}/remove-teams`,
            {
              teamIds: [teamId],
            }
          );
          toast.success('Équipe retirée avec succès !');
          this.fetchPoolDetails();
        } catch (error) {
          console.error("Erreur lors du retrait de l'équipe:", error);
          toast.error("Erreur lors du retrait de l'équipe.");
        }
      },

      async removeSelectedTeams() {
        try {
          await apiService.post(
            `/tourneys/${this.tourneyId}/pools/${this.poolId}/remove-teams`,
            {
              teamIds: this.selectedAssignedTeams,
            }
          );
          toast.success('Équipes retirées avec succès !');
          this.selectedAssignedTeams = [];
          this.selectAllAssigned = false;
          this.fetchPoolDetails();
        } catch (error) {
          console.error('Erreur lors du retrait des équipes:', error);
          toast.error('Erreur lors du retrait des équipes.');
        }
      },
      toggleTeamSelection(teamId) {
        if (this.selectedUnassignedTeams.includes(teamId)) {
          this.selectedUnassignedTeams = this.selectedUnassignedTeams.filter(
            (id) => id !== teamId
          );
        } else {
          this.selectedUnassignedTeams.push(teamId);
        }
      },

      toggleRemoveTeamSelection(teamId) {
        if (this.selectedAssignedTeams.includes(teamId)) {
          this.selectedAssignedTeams = this.selectedAssignedTeams.filter(
            (id) => id !== teamId
          );
        } else {
          this.selectedAssignedTeams.push(teamId);
        }
      },
      goBackToPools() {
        this.$router.push(
          `/admin/tourneys/${this.$route.params.tourneyId}/pools`
        );
      },
    },
    mounted() {
      this.fetchTourneyStatuses(this.tourneyId);
      this.fetchPoolDetails();
    },
  };
</script>

<style scoped>
  /* Vos styles ici */

  /* Style pour les lignes sélectionnées */
  table tr.selected {
    background-color: #e0f7fa;
  }

  /* Optionnel : ajouter une différence visuelle pour les sections */
  h2 {
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 0.5rem;
  }

  /* Highlight selected rows */
  table tr:hover {
    background-color: #f5f5f5;
  }

  table tr.selected {
    background-color: #d1fae5;
  }
</style>
