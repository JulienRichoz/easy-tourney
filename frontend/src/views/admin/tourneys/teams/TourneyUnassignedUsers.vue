<!-- src/views/admin/TourneyUnassignedUsers.vue -->
<template>
  <div class="mx-auto p-4">
    <ListUsersTable
      title="Utilisateurs sans groupe"
      :users="unassignedUsers"
      :teams="teams"
      :team-setup="teamSetup"
      :enable-assign-team="true"
      :allow-assign-to-other-teams="true"
      :selected-team-ids="selectedTeamIds"
      :available-teams="availableTeams"
      @update:selectedTeamIds="selectedTeamIds = $event"
      @assign-team="handleAssignTeam"
      @delete-user="handleDeleteUser"
      @go-back="goBackToTeams"
    >
      <template v-slot:header-buttons>
        <!-- Boutons pour l'assignation automatique -->
        <ButtonComponent
          v-if="hasAvailableTeams && unassignedUsers.length > 0"
          :variant="isAutoFilled ? 'algo' : 'algo'"
          fontAwesomeIcon="cog"
          @click="isAutoFilled ? handleValidateAssignments() : autoFillGroups()"
        >
          <span class="hidden sm:inline">
            {{ isAutoFilled ? 'Valider' : 'Assignation Automatique' }}
          </span>
        </ButtonComponent>
        <ButtonComponent
          v-if="isAutoFilled"
          variant="secondary"
          @click="cancelAutoFill"
        >
          <span class="hidden sm:inline">Annuler</span>
        </ButtonComponent>
      </template>
    </ListUsersTable>
  </div>
</template>

<script>
  import ListUsersTable from '@/components/ListUsersTable.vue';
  import apiService from '@/services/apiService';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      ListUsersTable,
      ButtonComponent,
    },
    data() {
      return {
        unassignedUsers: [],
        teams: [],
        teamSetup: null,
        isAutoFilled: false,
        initialSelectedTeamIds: {},
        selectedTeamIds: {},
      };
    },
    computed: {
      hasAvailableTeams() {
        return this.availableTeams.length > 0;
      },
      availableTeams() {
        if (!this.teamSetup) return [];

        const currentTeamIds = this.unassignedUsers
          .map((user) => user.teamId)
          .filter((teamId) => teamId != null);

        return this.teams.filter((team) => {
          const isCurrentTeam = currentTeamIds.includes(team.id);
          const hasSpace =
            (team.usersTourneys ? team.usersTourneys.length : 0) <
            this.getTeamCapacity(team);
          return isCurrentTeam || hasSpace;
        });
      },
      /* teamOptions() {
        return this.availableTeams.map((team) => {
          const capacity = this.getTeamCapacity(team);
          return {
            id: team.id,
            teamName: `${team.teamName} (${team.usersTourneys.length}/${capacity})`,
          };
        });
      },*/
    },
    async created() {
      await this.fetchData();
    },
    methods: {
      getTeamCapacity(team) {
        if (team.type === 'assistant') {
          return this.teamSetup.playerPerTeam * this.teamSetup.maxTeamNumber;
        }
        return this.teamSetup.playerPerTeam;
      },
      async fetchData() {
        const tourneyId = this.$route.params.tourneyId;
        try {
          const response = await apiService.get(
            `/tourneys/${tourneyId}/teams-details`
          );
          const data = response.data;

          // Extraire les utilisateurs depuis unassignedUsers
          this.unassignedUsers = data.unassignedUsers.map((ut) => ut.user);
          this.teams = data.teams;
          this.teamSetup = data.teamSetup;

          this.selectedTeamIds = {};
          this.unassignedUsers.forEach((user) => {
            if (user.teamId) {
              this.selectedTeamIds[user.id] = user.teamId;
            }
          });
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du tournoi:',
            error
          );
        }
      },
      async handleAssignTeam({ userId, teamId }) {
        const tourneyId = this.$route.params.tourneyId;
        try {
          await apiService.post(
            `/tourneys/${tourneyId}/users/${userId}/teams`,
            { teamId }
          );

          // Rafraîchir les données après l'assignation
          await this.fetchData();

          toast.success("Utilisateur assigné avec succès à l'équipe.");
        } catch (error) {
          console.error("Erreur lors de l'assignation de l'équipe:", error);
          toast.error(
            "Une erreur est survenue lors de l'assignation de l'équipe."
          );
        }
      },
      async handleDeleteUser(userId) {
        const tourneyId = this.$route.params.tourneyId;
        try {
          await apiService.delete(`/tourneys/${tourneyId}/users/${userId}`);

          // Rafraîchir les données après la suppression
          await this.fetchData();

          toast.success('Utilisateur supprimé avec succès.');
        } catch (error) {
          console.error(
            "Erreur lors de la suppression de l'utilisateur:",
            error
          );
          toast.error(
            "Une erreur est survenue lors de la suppression de l'utilisateur."
          );
        }
      },
      goBackToTeams() {
        this.$router.push(
          `/admin/tourneys/${this.$route.params.tourneyId}/teams`
        );
      },
      async handleValidateAssignments() {
        const assignments = Object.entries(this.selectedTeamIds)
          .filter(([, teamId]) => teamId !== null && teamId !== undefined)
          .map(([userId, teamId]) => ({
            userId: Number(userId),
            teamId,
          }));

        const tourneyId = this.$route.params.tourneyId;
        try {
          // Envoyer les affectations au backend
          await apiService.post(`/tourneys/${tourneyId}/teams/auto-fill`, {
            assignments,
          });

          // Rafraîchir les données après la validation
          await this.fetchData();

          toast.success('Affectations validées avec succès.');

          this.isAutoFilled = false;
          this.initialSelectedTeamIds = {};
        } catch (error) {
          console.error(
            'Erreur lors de la validation des affectations:',
            error
          );
          toast.error(
            'Une erreur est survenue lors de la validation des affectations.'
          );
        }
      },
      autoFillGroups() {
        // 1. Stocker l'état initial
        this.initialSelectedTeamIds = { ...this.selectedTeamIds };
        let unassignedUsers = [...this.unassignedUsers];

        // 2. Séparer les équipes 'player' et l'équipe 'assistant'
        let assistantTeam = null;
        let teams = [];

        this.teams.forEach((team) => {
          if (team.type === 'assistant') {
            assistantTeam = {
              ...team,
              assignedUsers: team.usersTourneys ? [...team.usersTourneys] : [],
            };
          } else {
            teams.push({
              ...team,
              assignedUsers: team.usersTourneys ? [...team.usersTourneys] : [],
            });
          }
        });

        // 3. Fonction pour assigner des utilisateurs à une équipe
        const assignUsersToTeam = (team, numberOfUsersNeeded) => {
          const usersToAssign = unassignedUsers.splice(0, numberOfUsersNeeded);
          team.assignedUsers.push(...usersToAssign);
          usersToAssign.forEach((user) => {
            this.selectedTeamIds = {
              ...this.selectedTeamIds,
              [user.id]: team.id,
            };
          });
        };

        // a) Remplir les groupes partiels jusqu'au seuil minimal
        teams
          .filter(
            (team) =>
              team.assignedUsers.length > 0 &&
              team.assignedUsers.length < this.teamSetup.minPlayerPerTeam
          )
          .forEach((team) => {
            const needed =
              this.teamSetup.minPlayerPerTeam - team.assignedUsers.length;
            assignUsersToTeam(team, Math.min(needed, unassignedUsers.length));
          });

        // b) Calculer combien d'équipes vides peuvent être entièrement remplies
        const emptyTeams = teams.filter(
          (team) => team.assignedUsers.length === 0
        );
        const maxFillableEmptyTeams = Math.floor(
          unassignedUsers.length / this.teamSetup.minPlayerPerTeam
        );
        const teamsToFill = emptyTeams.slice(0, maxFillableEmptyTeams);

        // Remplir les équipes vides identifiées
        teamsToFill.forEach((team) => {
          assignUsersToTeam(team, this.teamSetup.minPlayerPerTeam);
        });

        // c) Distribuer les utilisateurs restants aux équipes valides jusqu'au maximum autorisé
        let distributionPossible = true;

        while (unassignedUsers.length > 0 && distributionPossible) {
          distributionPossible = false;
          for (const team of teams) {
            if (
              team.assignedUsers.length >= this.teamSetup.minPlayerPerTeam &&
              team.assignedUsers.length < this.teamSetup.playerPerTeam &&
              unassignedUsers.length > 0
            ) {
              assignUsersToTeam(team, 1);
              distributionPossible = true;
              if (unassignedUsers.length === 0) break;
            }
          }
        }

        // d) Assigner les utilisateurs restants à l'équipe 'assistant' si nécessaire
        if (unassignedUsers.length > 0) {
          if (!assistantTeam) {
            toast.error(
              "Aucune équipe 'assistant' disponible pour les utilisateurs restants."
            );
            return;
          }
          assignUsersToTeam(assistantTeam, unassignedUsers.length);
        }

        this.isAutoFilled = true;
      },

      cancelAutoFill() {
        this.selectedTeamIds = { ...this.initialSelectedTeamIds };
        this.isAutoFilled = false;
      },
    },
  };
</script>
