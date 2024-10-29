<!-- TeamDetails.vue -->
<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center mb-8 justify-between">
        <!-- Titre -->
        <TitleComponent :title="`Équipe : ${team.teamName}`" />

        <!-- Bouton Retour aux équipes -->
        <ButtonComponent
          fontAwesomeIcon="arrow-left"
          @click="navigateToTeams"
          variant="secondary"
        >
          <span class="hidden sm:inline">Retour aux équipes</span>
        </ButtonComponent>
      </div>

      <!-- Table des utilisateurs de l'équipe -->
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white dark:bg-gray-800">
          <thead>
            <tr>
              <th class="px-4 py-2 text-left">Nom</th>
              <th class="px-4 py-2 text-left">Email</th>
              <th class="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in team.Users"
              :key="user.id"
              class="border-t border-gray-200 dark:border-gray-700"
            >
              <td class="px-4 py-2">{{ user.name }}</td>
              <td class="px-4 py-2">{{ user.email }}</td>
              <td class="px-4 py-2 flex items-center">
                <!-- Dropdown pour déplacer l'utilisateur vers une autre équipe -->
                <select
                  v-model="selectedTeams[user.id]"
                  @change="moveUserToTeam(user.id, selectedTeams[user.id])"
                  class="bg-light-form-background dark:bg-dark-form-background text-light-form-text dark:text-dark-form-text border border-light-form-border-default dark:border-dark-form-border-default rounded-md px-2 py-1"
                >
                  <option disabled value="">Déplacer vers une équipe</option>
                  <option
                    v-for="otherTeam in availableTeams"
                    :key="otherTeam.id"
                    :value="otherTeam.id"
                  >
                    {{ otherTeam.teamName }}
                  </option>
                </select>

                <!-- Bouton pour supprimer l'utilisateur de l'équipe -->
                <ButtonComponent
                  variant="danger"
                  fontAwesomeIcon="trash"
                  @click="confirmRemoveUser(user.id)"
                  class="ml-2"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Confirmation de suppression -->
      <DeleteConfirmationModal
        :isVisible="showDeleteConfirmation"
        @cancel="closeDeleteConfirmation"
        @confirm="removeUserFromTeam(confirmedUserId)"
      />
    </div>
  </div>
</template>

<script>
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import TitleComponent from '@/components/TitleComponent.vue';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';
  import apiService from '@/services/apiService';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      ButtonComponent,
      DeleteConfirmationModal,
      TitleComponent,
      TourneySubMenu,
    },
    data() {
      return {
        tourneyId: this.$route.params.id,
        teamId: this.$route.params.teamId,
        team: null,
        teams: [],
        selectedTeams: {},
        showDeleteConfirmation: false,
        confirmedUserId: null,
        teamSetup: null,
      };
    },
    computed: {
      availableTeams() {
        // Exclure l'équipe actuelle
        return this.teams.filter((team) => {
          if (team.id === parseInt(this.teamId)) return false;
          // Si vous souhaitez permettre la souplesse maximale, commentez les lignes suivantes
          if (!this.teamSetup || team.type === 'assistant') return true;
          const maxPlayers = this.teamSetup.playerPerTeam;
          return team.Users.length < maxPlayers;
        });
      },
    },
    methods: {
      navigateToTeams() {
        this.$router.push(`/tourneys/${this.tourneyId}/teams`);
      },
      async fetchTeamDetails() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/teams/${this.teamId}`
          );
          this.team = response.data;
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des détails de l'équipe:",
            error
          );
          toast.error(
            "Erreur lors de la récupération des détails de l'équipe."
          );
        }
      },
      async fetchTeams() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/teams`
          );
          this.teams = response.data;
        } catch (error) {
          console.error('Erreur lors de la récupération des équipes:', error);
          toast.error('Erreur lors de la récupération des équipes.');
        }
      },
      async fetchTeamSetup() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/team-setup`
          );
          this.teamSetup = response.data;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération de la configuration des équipes:',
            error
          );
          toast.error(
            'Erreur lors de la récupération de la configuration des équipes.'
          );
        }
      },
      async moveUserToTeam(userId, newTeamId) {
        try {
          // Supprimer l'utilisateur de l'équipe actuelle
          await apiService.delete(
            `/tourneys/${this.tourneyId}/teams/${this.teamId}/users/${userId}`
          );
          // Assigner l'utilisateur à la nouvelle équipe
          await apiService.post(
            `/tourneys/${this.tourneyId}/teams/${newTeamId}/users`,
            { userId }
          );
          toast.success(
            'Utilisateur déplacé vers la nouvelle équipe avec succès.'
          );
          // Mettre à jour les détails de l'équipe
          this.fetchTeamDetails();
          // Mettre à jour les équipes
          this.fetchTeams();
        } catch (error) {
          console.error(
            "Erreur lors du déplacement de l'utilisateur vers une autre équipe:",
            error
          );
          toast.error(
            "Erreur lors du déplacement de l'utilisateur vers une autre équipe."
          );
        }
      },
      confirmRemoveUser(userId) {
        this.confirmedUserId = userId;
        this.showDeleteConfirmation = true;
      },
      closeDeleteConfirmation() {
        this.showDeleteConfirmation = false;
        this.confirmedUserId = null;
      },
      async removeUserFromTeam(userId) {
        try {
          await apiService.delete(
            `/tourneys/${this.tourneyId}/teams/${this.teamId}/users/${userId}`
          );
          toast.success("Utilisateur retiré de l'équipe avec succès.");
          this.fetchTeamDetails();
          this.closeDeleteConfirmation();
        } catch (error) {
          console.error(
            "Erreur lors de la suppression de l'utilisateur de l'équipe:",
            error
          );
          toast.error(
            "Erreur lors de la suppression de l'utilisateur de l'équipe."
          );
        }
      },
    },
    async mounted() {
      await this.fetchTeamSetup();
      await this.fetchTeamDetails();
      await this.fetchTeams();
    },
  };
</script>

<style scoped>
  /* Styles gérés par Tailwind CSS */
</style>
