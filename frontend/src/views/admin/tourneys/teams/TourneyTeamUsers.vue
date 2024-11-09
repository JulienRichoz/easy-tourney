<!-- src/views/admin/TourneyTeamUsers.vue -->
<template>
  <div class="mx-auto p-4" v-if="team">
    <!-- Composant ListUsersTable -->
    <ListUsersTable
      :title="`${team.teamName} - ${teamUsers.length}/${getTeamCapacity(team)}${
        team.type !== 'assistant' ? ` (min: ${teamSetup.minPlayerPerTeam})` : ''
      }`"
      :users="teamUsers"
      :teams="teams"
      :team-setup="teamSetup"
      :isAssigned="true"
      :enable-auto-fill="false"
      :enable-assign-team="true"
      :allow-assign-to-other-teams="true"
      :enable-remove-user="true"
      :back-button-text="'Retour aux équipes'"
      :delete-modal-title="'Confirmer le retrait'"
      :delete-modal-message="'Êtes-vous sûr de vouloir retirer cet utilisateur de la team ?'"
      :selected-team-ids="selectedTeamIds"
      @update:selectedTeamIds="selectedTeamIds = $event"
      @assign-team="handleAssignTeam"
      @delete-user="handleRemoveUser"
      @go-back="goBackToTeams"
    />

    <!-- Section pour ajouter des utilisateurs non assignés -->
    <div v-if="teamNotFull && unassignedUsers.length > 0" class="mt-4">
      <div class="flex items-center space-x-2">
        <v-select
          v-model="selectedUnassignedUserId"
          :options="unassignedUsers"
          :reduce="(user) => user.id"
          label="name"
          placeholder="Ajouter un utilisateur"
          class="w-64"
          appendToBody
        />
        <ButtonComponent
          variant="primary"
          size="sm"
          @click="assignUnassignedUserToTeam"
          :disabled="!selectedUnassignedUserId"
        >
          <span class="hidden sm:inline">Ajouter</span>
        </ButtonComponent>
      </div>
    </div>

    <!-- Affichage des messages d'information -->
    <ErrorMessageComponent
      v-if="!isTeamValid && !hasUnassignedUsers && team.type !== 'assistant'"
      message="L'équipe n'est pas valide et il n'y a pas d'utilisateurs à assigner. Veuillez créer de nouveaux utilisateurs ou réassigner des utilisateurs d'autres équipes."
    />
    <ErrorMessageComponent
      v-else-if="
        !isTeamValid && hasUnassignedUsers && team.type !== 'assistant'
      "
      message="L'équipe n'est pas valide. Veuillez ajouter des utilisateurs à l'équipe."
    />
  </div>
</template>

<script>
  import ListUsersTable from '@/components/ListUsersTable.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import ErrorMessageComponent from '@/components/ErrorMessageComponent.vue';
  import apiService from '@/services/apiService';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      ListUsersTable,
      ButtonComponent,
      ErrorMessageComponent,
    },
    data() {
      return {
        team: null,
        teamUsers: [],
        teams: [],
        teamSetup: null,
        unassignedUsers: [],
        selectedUnassignedUserId: null,
        selectedTeamIds: {},
        isAutoFilled: false,
        initialSelectedTeamIds: {},
      };
    },
    computed: {
      teamNotFull() {
        if (!this.team) return false;
        return this.teamUsers.length < this.getTeamCapacity(this.team);
      },
      isTeamValid() {
        if (!this.teamSetup || !this.team) return false;
        const minPlayers = this.teamSetup.minPlayerPerTeam;
        return this.teamUsers.length >= minPlayers;
      },
      hasUnassignedUsers() {
        return this.unassignedUsers.length > 0;
      },
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
      teamOptions() {
        return this.availableTeams.map((team) => {
          const capacity = this.getTeamCapacity(team);
          return {
            id: team.id,
            teamName: `${team.teamName} (${team.usersTourneys.length}/${capacity})`,
          };
        });
      },
    },
    async created() {
      await this.fetchData();
    },
    methods: {
      async fetchData() {
        const tourneyId = this.$route.params.tourneyId;
        const teamId = this.$route.params.teamId;
        try {
          const response = await apiService.get(
            `/tourneys/${tourneyId}/teams-details`
          );
          const data = response.data;
          this.teamSetup = data.teamSetup;
          this.teams = data.teams;

          // Exclure les admins et extraire les objets 'user'
          this.unassignedUsers = data.unassignedUsers
            .filter((userTourney) => userTourney.user.role.id !== 1)
            .map((userTourney) => userTourney.user);

          // Trouver l'équipe
          this.team = this.teams.find((t) => t.id === parseInt(teamId));
          if (!this.team) {
            toast.error('Équipe introuvable.');
            this.goBackToTeams();
            return;
          }

          // Extraire les utilisateurs de usersTourneys en filtrant les utilisateurs indéfinis
          if (
            this.team.usersTourneys &&
            Array.isArray(this.team.usersTourneys)
          ) {
            this.teamUsers = this.team.usersTourneys
              .map((ut) => ut.user)
              .filter((user) => user != null);
          } else {
            this.teamUsers = [];
          }
          // Initialiser selectedTeamIds
          this.selectedTeamIds = {};
          this.teamUsers.forEach((user) => {
            if (user.teamId) {
              this.selectedTeamIds[user.id] = user.teamId;
            }
          });
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du tournoi:',
            error
          );
          toast.error(
            'Une erreur est survenue lors de la récupération des données.'
          );
          this.goBackToTeams();
        }
      },

      getTeamCapacity(team) {
        if (team.type === 'assistant') {
          return this.teamSetup.playerPerTeam * this.teamSetup.maxTeamNumber;
        }
        return this.teamSetup.playerPerTeam;
      },

      async handleAssignTeam({ userId, teamId }) {
        const tourneyId = this.$route.params.tourneyId;
        try {
          await apiService.post(
            `/tourneys/${tourneyId}/users/${userId}/teams`,
            { teamId }
          );
          // Mettre à jour les données locales
          await this.fetchData();
          toast.success("Utilisateur assigné avec succès à l'équipe.");
        } catch (error) {
          console.error("Erreur lors de l'assignation de l'équipe:", error);
          toast.error(
            "Une erreur est survenue lors de l'assignation de l'équipe."
          );
        }
      },

      async handleRemoveUser(userId) {
        const tourneyId = this.$route.params.tourneyId;
        const teamId = this.$route.params.teamId;
        try {
          await apiService.delete(
            `/tourneys/${tourneyId}/teams/${teamId}/users/${userId}`
          );
          // Mettre à jour les données locales
          await this.fetchData();
          toast.success("Utilisateur retiré de l'équipe avec succès.");
        } catch (error) {
          console.error(
            "Erreur lors du retrait de l'utilisateur de l'équipe:",
            error
          );
          toast.error(
            "Une erreur est survenue lors du retrait de l'utilisateur de l'équipe."
          );
        }
      },

      async assignUnassignedUserToTeam() {
        const tourneyId = this.$route.params.tourneyId;
        const teamId = this.$route.params.teamId;
        const userId = this.selectedUnassignedUserId;
        try {
          await apiService.post(
            `/tourneys/${tourneyId}/users/${userId}/teams`,
            { teamId }
          );
          // Mettre à jour les données locales
          await this.fetchData();
          this.selectedUnassignedUserId = null;
          toast.success("Utilisateur ajouté à l'équipe avec succès.");
        } catch (error) {
          console.error(
            "Erreur lors de l'ajout de l'utilisateur à l'équipe:",
            error
          );
          toast.error(
            "Une erreur est survenue lors de l'ajout de l'utilisateur à l'équipe."
          );
        }
      },

      goBackToTeams() {
        this.$router.push(
          `/admin/tourneys/${this.$route.params.tourneyId}/teams`
        );
      },
    },
  };
</script>
