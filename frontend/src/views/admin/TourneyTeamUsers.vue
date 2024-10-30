<!-- src/views/admin/TourneyTeamUsers.vue -->
<template>
  <div class="mx-auto p-4" v-if="team">
    <ListUsersTable
      :title="`Utilisateurs de l'équipe ${team.teamName}`"
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
      @assign-team="handleAssignTeam"
      @delete-user="handleRemoveUser"
      @go-back="goBackToTeams"
    />
    <!-- Section pour ajouter des utilisateurs non assignés si l'équipe n'est pas pleine -->
    <div v-if="teamNotFull && unassignedUsers.length > 0" class="mt-6">
      <h2 class="text-xl font-bold mb-4">
        Ajouter un utilisateur non assigné à l'équipe
      </h2>
      <v-select
        v-model="selectedUnassignedUserId"
        :options="unassignedUsers"
        :reduce="(user) => user.id"
        label="name"
        placeholder="Sélectionner un utilisateur"
      />
      <ButtonComponent
        variant="primary"
        @click="assignUnassignedUserToTeam"
        :disabled="!selectedUnassignedUserId"
      >
        Ajouter à l'équipe
      </ButtonComponent>
    </div>
  </div>
  <!-- Affichage d'un message de chargement ou d'erreur si nécessaire -->
  <div v-else class="mx-auto p-4">
    <p>Chargement des données de l'équipe...</p>
  </div>
</template>

<script>
  import ListUsersTable from '@/components/ListUsersTable.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import apiService from '@/services/apiService';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      ListUsersTable,
      ButtonComponent,
    },
    data() {
      return {
        team: null,
        teamUsers: [],
        teams: [],
        teamSetup: null,
        unassignedUsers: [],
        selectedUnassignedUserId: null,
      };
    },
    computed: {
      teamNotFull() {
        if (!this.team) return false;
        return this.teamUsers.length < this.getTeamCapacity(this.team);
      },
    },
    async created() {
      await this.fetchData();
    },
    methods: {
      async fetchData() {
        const tourneyId = this.$route.params.id;
        const teamId = this.$route.params.teamId;
        try {
          const response = await apiService.get(
            `/tourneys/${tourneyId}/teams-details`
          );
          const data = response.data;
          this.teamSetup = data.teamSetup;
          this.teams = data.teams;
          this.unassignedUsers = data.unassignedUsers;
          // Trouver l'équipe
          this.team = this.teams.find((t) => t.id === parseInt(teamId));
          if (!this.team) {
            toast.error('Équipe introuvable.');
            this.goBackToTeams();
            return;
          }
          this.teamUsers = this.team.Users || [];
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
        const tourneyId = this.$route.params.id;
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
        const tourneyId = this.$route.params.id;
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
        const tourneyId = this.$route.params.id;
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
        this.$router.push(`/tourneys/${this.$route.params.id}/teams`);
      },
    },
  };
</script>
