<!-- src/views/admin/AdminUsers.vue -->
<template>
  <div class="mx-auto p-4">
    <ListUsersTable
      :users="users"
      :enableAddUser="true"
      :enableEditUser="true"
      :enableAssignTourney="true"
      :enableRemoveUserFromTourney="true"
      :tournaments="tournaments"
      :showTourney="true"
      :showAssignTourney="true"
      :enableAssignTeam="false"
      :showEmailButton="false"
      :showBackButton="false"
      :showPhone="false"
      :showFilters="true"
      @add-user="handleAddUser"
      @edit-user="handleEditUser"
      @assign-tourney="handleAssignTourney"
      @remove-user-from-tourney="handleRemoveUserFromTourney"
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
        users: [],
        tournaments: [],
      };
    },
    async created() {
      await this.fetchData();
    },
    methods: {
      async fetchData() {
        try {
          const [usersResponse, tourneysResponse] = await Promise.all([
            apiService.get('/users/all/details'),
            apiService.get('/tourneys'),
          ]);
          this.users = usersResponse.data;
          this.tournaments = tourneysResponse.data;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des utilisateurs:',
            error
          );
          toast.error(
            'Une erreur est survenue lors de la récupération des données.'
          );
        }
      },
      async handleAssignTourney({ userId, tourneyId }) {
        try {
          await apiService.post(`/users/${userId}/tourneys/${tourneyId}`);
          await this.fetchData();
          toast.success('Utilisateur assigné au tournoi avec succès.');
        } catch (error) {
          console.error("Erreur lors de l'assignation au tournoi:", error);
          toast.error(
            "Une erreur est survenue lors de l'assignation au tournoi."
          );
        }
      },
      async handleRemoveUserFromTourney({ userId, tourneyId }) {
        try {
          await apiService.delete(`/users/${userId}/tourneys/${tourneyId}`);
          await this.fetchData();
          toast.success('Utilisateur retiré du tournoi avec succès.');
        } catch (error) {
          console.error('Erreur lors du retrait du tournoi:', error);
          toast.error(
            "Une erreur est survenue lors du retrait de l'utilisateur du tournoi."
          );
        }
      },
      async handleDeleteUser(userId) {
        try {
          await apiService.delete(`/users/${userId}`);
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
      handleAddUser() {
        this.$router.push('/users/create');
      },
      handleEditUser(userId) {
        this.$router.push(`/users/${userId}/edit`);
      },
    },
  };
</script>

<style scoped></style>
