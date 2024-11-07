<!-- src/views/admin/TourneyUnassignedUsers.vue -->
<template>
  <div class="mx-auto p-4">
    <ListUsersTable
      title="Utilisateurs sans groupe"
      :users="unassignedUsers"
      :teams="teams"
      :team-setup="teamSetup"
      :isAssigned="false"
      :enable-auto-fill="unassignedUsers.length > 0"
      @assign-team="handleAssignTeam"
      @delete-user="handleDeleteUser"
      @go-back="goBackToTeams"
      @validate-assignments="handleValidateAssignments"
    />
  </div>
</template>

<script>
  import ListUsersTable from '@/components/ListUsersTable.vue';
  import apiService from '@/services/apiService';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      ListUsersTable,
    },
    data() {
      return {
        unassignedUsers: [],
        teams: [],
        teamSetup: null,
      };
    },
    async created() {
      await this.fetchData();
    },
    methods: {
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
        this.$router.push(`/tourneys/${this.$route.params.tourneyId}/teams`);
      },
      async handleValidateAssignments(assignments) {
        const tourneyId = this.$route.params.tourneyId;
        try {
          // Envoyer les affectations au backend
          await apiService.post(`/tourneys/${tourneyId}/teams/auto-fill`, {
            assignments,
          });

          // Rafraîchir les données après la validation
          await this.fetchData();

          toast.success('Affectations validées avec succès.');
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
    },
  };
</script>

<style scoped></style>
