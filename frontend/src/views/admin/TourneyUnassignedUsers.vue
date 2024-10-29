<!-- src/views/admin/TourneyUnassignedUsers.vue -->
<template>
  <div class="mx-auto p-4">
    <ListUsersTable
      title="Utilisateurs sans groupe"
      :users="unassignedUsers"
      :teams="teams"
      :isAssigned="false"
      @assign-team="handleAssignTeam"
      @delete-user="handleDeleteUser"
      @go-back="goBackToTeams"
      @auto-fill-groups="handleAutoFillGroups"
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
      };
    },
    async created() {
      await this.fetchData();
    },
    methods: {
      async fetchData() {
        const tourneyId = this.$route.params.id;
        try {
          const [usersResponse, teamsResponse] = await Promise.all([
            apiService.get(`/tourneys/${tourneyId}/users/unassigned-users`),
            apiService.get(`/tourneys/${tourneyId}/teams`),
          ]);
          this.unassignedUsers = usersResponse.data;
          this.teams = teamsResponse.data;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des utilisateurs ou des équipes:',
            error
          );
        }
      },
      async handleAssignTeam({ userId, teamId }) {
        const tourneyId = this.$route.params.id;
        try {
          // Assignation de l'utilisateur à l'équipe via l'API
          await apiService.post(
            `/tourneys/${tourneyId}/users/${userId}/teams`,
            { teamId }
          );

          // Retirer l'utilisateur de la liste des utilisateurs sans groupe
          this.unassignedUsers = this.unassignedUsers.filter(
            (user) => user.id !== userId
          );

          // Recharger la liste des équipes pour mettre à jour les compteurs
          await this.fetchTeams();

          // Optionnel : Afficher une notification de succès
          toast.success("Utilisateur assigné avec succès à l'équipe.");
        } catch (error) {
          console.error("Erreur lors de l'assignation de l'équipe:", error);
          toast.error(
            "Une erreur est survenue lors de l'assignation de l'équipe."
          );
        }
      },
      async handleDeleteUser(userId) {
        const tourneyId = this.$route.params.id;
        try {
          await apiService.delete(`/tourneys/${tourneyId}/users/${userId}`);
          this.unassignedUsers = this.unassignedUsers.filter(
            (user) => user.id !== userId
          );

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
      async fetchTeams() {
        const tourneyId = this.$route.params.id;
        try {
          const teamsResponse = await apiService.get(
            `/tourneys/${tourneyId}/teams`
          );
          this.teams = teamsResponse.data;
          console.log('Teams mis à jour:', this.teams);
        } catch (error) {
          console.error('Erreur lors de la récupération des équipes:', error);
        }
      },
      async handleAutoFillGroups() {
        try {
          // const tourneyId = this.$route.params.id;
          // Appeler une API ou effectuer une action pour remplir automatiquement les groupes
          // Exemple : await apiService.post(`/tourneys/${tourneyId}/auto-fill-groups`);

          // Pour l'instant, afficher une notification
          toast.info('Remplissage automatique des groupes initié.');

          // Recharger les données après auto-fill si nécessaire
          await this.fetchData();
        } catch (error) {
          console.error(
            'Erreur lors du remplissage automatique des groupes:',
            error
          );
          toast.error(
            'Une erreur est survenue lors du remplissage automatique des groupes.'
          );
        }
      },
      goBackToTeams() {
        // Naviguer vers la page des équipes
        this.$router.push(`/tourneys/${this.$route.params.id}/teams`);
      },
    },
  };
</script>

<style scoped></style>
