<!-- src/views/admin/TourneyTeamUsers.vue -->
<template>
  <div class="container mx-auto p-4">
    <ListUsersTable
      :title="`Utilisateurs de l'équipe ${team.teamName}`"
      :users="teamUsers"
      :teams="teams"
      :isAssigned="true"
      @change-team="handleChangeTeam"
      @delete-user="handleRemoveUserFromTeam"
    />
  </div>
</template>

<script>
  import ListUsersTable from '@/components/ListUsersTable.vue';
  import apiService from '@/services/apiService';

  export default {
    components: {
      ListUsersTable,
    },
    data() {
      return {
        teamUsers: [],
        teams: [],
        team: {},
      };
    },
    async created() {
      const { id, teamId } = this.$route.params;
      try {
        const teamResponse = await apiService.get(
          `/tourneys/${id}/teams/${teamId}`
        );
        this.team = teamResponse.data;
        this.teamUsers = teamResponse.data.Users;

        const teamsResponse = await apiService.get(`/tourneys/${id}/teams`);
        this.teams = teamsResponse.data;
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données de l'équipe:",
          error
        );
      }
    },
    methods: {
      async handleChangeTeam({ userId, teamId }) {
        try {
          await apiService.post(
            `/tourneys/${this.$route.params.id}/users/${userId}/teams`,
            { teamId }
          );
          this.teamUsers = this.teamUsers.filter((user) => user.id !== userId);
        } catch (error) {
          console.error("Erreur lors de la réassignation de l'équipe:", error);
        }
      },
      async handleRemoveUserFromTeam(userId) {
        try {
          await apiService.delete(
            `/tourneys/${this.$route.params.id}/users/${userId}`
          );
          this.teamUsers = this.teamUsers.filter((user) => user.id !== userId);
        } catch (error) {
          console.error(
            "Erreur lors de la suppression de l'utilisateur de l'équipe:",
            error
          );
        }
      },
    },
  };
</script>

<style scoped>
  .container {
    max-width: 800px;
  }
</style>
