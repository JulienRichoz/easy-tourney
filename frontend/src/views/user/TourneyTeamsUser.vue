<template>
  <div>
    <div class="p-6">
      <!-- Titre de la page et statut des inscriptions -->
      <div class="flex items-center mb-8 justify-between">
        <TitleComponent title="Equipes du tournoi"></TitleComponent>
        <p v-if="isRegistrationActive" class="text-green-600">
          Les inscriptions sont ouvertes. Vous pouvez rejoindre ou quitter un
          groupe.
        </p>
        <p v-else-if="isRegistrationClosed" class="text-yellow-600">
          Les inscriptions sont fermées. Vous ne pouvez pas rejoindre ou quitter
          un groupe.
        </p>
        <p v-else-if="isRegistrationCompleted" class="text-red-600">
          Les inscriptions sont terminées. Vous ne pouvez pas rejoindre ou
          quitter un groupe.
        </p>
      </div>

      <!-- Section de votre équipe -->
      <div v-if="userTeam" class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Votre équipe</h2>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          <CardEditComponent
            :title="userTeam.teamName || 'Nom manquant'"
            :cornerCount="`${
              userTeam.usersTourneys ? userTeam.usersTourneys.length : 0
            }/${getTeamCapacity(userTeam)}`"
            :titleColor="getStatusColor(userTeam)"
            @click="openTeamDetails(userTeam)"
          >
            <template #button-actions>
              <ButtonComponent
                v-if="isRegistrationActive"
                @click.stop="leaveTeam"
                variant="danger"
              >
                Quitter
              </ButtonComponent>
            </template>
            <template #user-list>
              <ul class="grid grid-cols-2 gap-2 mt-2">
                <li
                  v-for="userTourney in userTeam.usersTourneys || []"
                  :key="userTourney.userId"
                  class="flex items-center text-sm text-light-form-text dark:text-dark-form-text truncate"
                >
                  <font-awesome-icon icon="user" class="mr-2 text-gray-500" />
                  <span class="truncate">{{ userTourney.user.name }}</span>
                </li>
              </ul>
            </template>
          </CardEditComponent>
        </div>
      </div>

      <!-- Section des autres équipes -->
      <h2 class="text-2xl font-semibold mt-8 mb-4">Toutes les équipes</h2>
      <!-- Options de recherche et filtres -->
      <div class="mb-4 flex items-center space-x-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un groupe ou un utilisateur"
          class="border p-2 rounded w-full md:w-1/3"
        />
        <select v-model="selectedFilter" class="border p-2 rounded">
          <option value="">Tous les groupes</option>
          <option value="non-full">Groupes partiels</option>
          <option value="full">Groupes pleins</option>
          <option value="empty">Groupes vides</option>
        </select>
      </div>

      <!-- Liste des autres équipes -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <CardEditComponent
          v-for="team in filteredTeams"
          :key="team.id"
          :title="team.teamName || 'Nom manquant'"
          :cornerCount="`${team.usersTourneys.length}/${getTeamCapacity(team)}`"
          :titleColor="getStatusColor(team)"
          :isEditable="isRegistrationActive"
          @click="openTeamDetails(team)"
        >
          <template #button-actions>
            <ButtonComponent
              v-if="!userTeam && isRegistrationActive"
              :disabled="team.usersTourneys.length >= getTeamCapacity(team)"
              @click.stop="joinTeam(team.id)"
              variant="primary"
            >
              Rejoindre
            </ButtonComponent>
          </template>
          <template #user-list>
            <ul class="grid grid-cols-2 gap-2 mt-2">
              <li
                v-for="userTourney in team.usersTourneys"
                :key="userTourney.userId"
                class="flex items-center text-sm text-light-form-text dark:text-dark-form-text truncate"
              >
                <font-awesome-icon icon="user" class="mr-2 text-gray-500" />
                <span class="truncate">{{ userTourney.user.name }}</span>
              </li>
            </ul>
          </template>
        </CardEditComponent>
      </div>

      <!-- Message si les inscriptions sont fermées ou terminées et que l'utilisateur n'est pas dans une équipe -->
      <div v-if="!userTeam && !isRegistrationActive" class="mt-4">
        <p>
          Les inscriptions sont fermées ou terminées. Vous ne pouvez pas
          rejoindre un groupe.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapActions } from 'vuex';
  import apiService from '@/services/apiService';
  import TitleComponent from '@/components/TitleComponent.vue';
  import CardEditComponent from '@/components/CardEditComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      TitleComponent,
      CardEditComponent,
      ButtonComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
        teams: [],
        userTeam: null,
        teamSetup: null,
        registrationStatus: null,
        searchQuery: '', // Variable pour la recherche
        selectedFilter: '', // Variable pour le filtre
      };
    },
    computed: {
      isRegistrationActive() {
        return this.registrationStatus === 'active';
      },
      isRegistrationClosed() {
        return this.registrationStatus === 'draft';
      },
      isRegistrationCompleted() {
        return this.registrationStatus === 'completed';
      },
      currentUserId() {
        return this.$store.state.user ? this.$store.state.user.id : null;
      },
      otherTeams() {
        if (this.userTeam) {
          return this.teams.filter((team) => team.id !== this.userTeam.id);
        }
        return this.teams;
      },
      filteredTeams() {
        let teams = this.otherTeams;

        // Appliquer les filtres
        if (this.selectedFilter === 'non-full') {
          teams = teams.filter(
            (team) =>
              team.usersTourneys.length < this.getTeamCapacity(team) &&
              team.type === 'player'
          );
        } else if (this.selectedFilter === 'full') {
          teams = teams.filter(
            (team) =>
              team.usersTourneys.length >= this.getTeamCapacity(team) &&
              team.type === 'player'
          );
        } else if (this.selectedFilter === 'empty') {
          teams = teams.filter(
            (team) => team.usersTourneys.length === 0 && team.type === 'player'
          );
        }

        // Filtrer par recherche
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          teams = teams.filter((team) => {
            const teamNameMatch = team.teamName
              ? team.teamName.toLowerCase().includes(query)
              : false;
            const userNameMatch = team.usersTourneys.some((userTourney) =>
              userTourney.user.name.toLowerCase().includes(query)
            );
            return teamNameMatch || userNameMatch;
          });
        }

        return teams;
      },
    },
    methods: {
      ...mapActions('tourney', ['fetchTourneyStatuses']),
      async fetchData() {
        try {
          // Récupérer les statuts du tournoi
          await this.fetchTourneyStatuses(this.tourneyId);

          // Récupérer les détails des équipes et des utilisateurs du tournoi
          const teamsResponse = await apiService.get(
            `/tourneys/${this.tourneyId}/teams-details`
          );

          // Décomposer la réponse pour extraire les informations nécessaires
          this.teamSetup = teamsResponse.data.teamSetup;
          this.teams = teamsResponse.data.teams;
          this.unassignedUsers = teamsResponse.data.unassignedUsers;

          // Vérifier si l'utilisateur actuel est déjà dans une équipe
          const userId = this.currentUserId;

          // Récupérer les membres de l'équipe de l'utilisateur
          const userTourney = teamsResponse.data.allUsers.find(
            (userTourney) => userTourney.userId === userId && userTourney.team
          );

          if (userTourney) {
            this.userTeam = this.teams.find(
              (team) => team.id === userTourney.teamId
            );
          } else {
            this.userTeam = null;
          }

          // Mettre à jour le statut d'inscription à partir de la méthode séparée
          await this.fetchRegistrationStatus();
        } catch (error) {
          console.error('Erreur lors de la récupération des données:', error);
          toast.error('Erreur lors de la récupération des données.');
        }
      },
      async fetchRegistrationStatus() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/registration-status`
          );
          this.registrationStatus = response.data.registrationStatus;
        } catch (error) {
          console.error(
            "Erreur lors de la récupération du statut d'inscription:",
            error
          );
          toast.error(
            "Erreur lors de la récupération du statut d'inscription."
          );
        }
      },
      getTeamCapacity(team) {
        if (team.type === 'assistant') {
          // Capacité spécifique pour les équipes d'assistants si nécessaire
          return (
            this.teamSetup.playerPerTeam * this.teamSetup.maxTeamNumber ||
            'Infinity'
          );
        }
        return this.teamSetup ? this.teamSetup.playerPerTeam : 0;
      },
      getStatusColor(team) {
        // Vérifiez si usersTourneys est défini avant d'accéder à sa propriété length
        const teamSize = team.usersTourneys ? team.usersTourneys.length : 0;

        const minPlayers = this.teamSetup ? this.teamSetup.minPlayerPerTeam : 0;
        const maxPlayers = this.getTeamCapacity(team);

        if (teamSize >= maxPlayers) {
          return 'red'; // Équipe pleine
        } else if (teamSize >= minPlayers) {
          return 'green'; // Équipe valide
        } else if (teamSize > 0) {
          return 'orange'; // Équipe partiellement remplie
        } else {
          return 'gray'; // Équipe vide
        }
      },
      async joinTeam(teamId) {
        try {
          if (this.userTeam) {
            toast.error(
              'Vous êtes déjà dans un groupe. Veuillez quitter votre groupe avant de rejoindre un autre.'
            );
            return;
          }
          const userId = this.currentUserId;
          await apiService.post(
            `/tourneys/${this.tourneyId}/teams/${teamId}/users`,
            {
              userId,
            }
          );
          toast.success('Vous avez rejoint le groupe avec succès.');
          // Rafraîchir les données
          this.fetchData();
        } catch (error) {
          console.error(
            'Erreur lors de la tentative de rejoindre le groupe:',
            error
          );
          if (
            error.response &&
            error.response.data &&
            error.response.data.message
          ) {
            toast.error(error.response.data.message);
          } else {
            toast.error('Erreur lors de la tentative de rejoindre le groupe.');
          }
        }
      },
      async leaveTeam() {
        try {
          if (!this.userTeam) {
            toast.error("Vous n'êtes pas dans un groupe.");
            return;
          }
          await apiService.delete(
            `/tourneys/${this.tourneyId}/teams/${this.userTeam.id}/users/${this.currentUserId}`
          );
          toast.success('Vous avez quitté le groupe avec succès.');
          // Rafraîchir les données
          this.fetchData();
        } catch (error) {
          console.error(
            'Erreur lors de la tentative de quitter le groupe:',
            error
          );
          toast.error('Erreur lors de la tentative de quitter le groupe.');
        }
      },
      openTeamDetails(team) {
        // Naviguer vers la page de détails de l'équipe
        this.$router.push(
          `/tourneys/${this.tourneyId}/teams/${team.id}/details`
        );
      },
    },
    mounted() {
      this.fetchData();
    },
  };
</script>

<style scoped>
  /* Styles personnalisés */
</style>
