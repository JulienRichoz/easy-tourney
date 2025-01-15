<!-- src/views/admin/TourneyUnassignedUsers.vue -->
<template>
  <!-- Conteneur principal avec des marges automatiques et un padding de 4 unités -->
  <div class="mx-auto p-4">
    <!-- Composant ListUsersTable affichant les utilisateurs sans groupe -->
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
      <!-- Slot personnalisé pour les boutons d'en-tête -->
      <template v-slot:header-buttons>
        <!-- Bouton pour l'assignation automatique, visible si des équipes sont disponibles et des utilisateurs non assignés existent -->
        <ButtonComponent
          v-if="hasAvailableTeams && unassignedUsers.length > 0"
          :variant="isAutoFilled ? 'algo' : 'algo'"
          fontAwesomeIcon="cog"
          @click="isAutoFilled ? handleValidateAssignments() : autoFillGroups()"
        >
          <span class="hidden sm:inline">
            {{ isAutoFilled ? 'Valider' : 'Assignation Automatique' }}
            <!-- Texte du bouton selon l'état -->
          </span>
        </ButtonComponent>
        <!-- Bouton pour annuler l'assignation automatique, visible uniquement si une assignation automatique a été effectuée -->
        <ButtonComponent
          v-if="isAutoFilled"
          variant="secondary"
          @click="cancelAutoFill"
        >
          <span class="hidden sm:inline">Annuler</span>
          <!-- Texte du bouton -->
        </ButtonComponent>
      </template>
    </ListUsersTable>
  </div>
</template>

<script>
  // Importation des composants nécessaires
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
        unassignedUsers: [], // Tableau des utilisateurs non assignés
        teams: [], // Tableau des équipes disponibles
        teamSetup: null, // Objet de configuration des équipes (min/max joueurs)
        isAutoFilled: false, // Indicateur si l'assignation automatique a été effectuée
        initialSelectedTeamIds: {}, // Mapping initial des assignations pour permettre l'annulation
        selectedTeamIds: {}, // Mapping actuel des assignations utilisateurs-équipes
      };
    },
    computed: {
      /**
       * Vérifie s'il y a des équipes disponibles pour l'assignation.
       * @returns {boolean} True si des équipes sont disponibles, sinon False.
       */
      hasAvailableTeams() {
        return this.availableTeams.length > 0;
      },
      /**
       * Filtre les équipes disponibles en fonction de la capacité et des assignations actuelles.
       * @returns {Array} Tableau des équipes disponibles.
       */
      availableTeams() {
        if (!this.teamSetup) return [];

        // Récupère les IDs des équipes actuellement assignées aux utilisateurs non assignés
        const currentTeamIds = this.unassignedUsers
          .map((user) => user.teamId)
          .filter((teamId) => teamId != null);

        // Filtre les équipes qui ont de la place ou qui sont actuellement assignées
        return this.teams.filter((team) => {
          const isCurrentTeam = currentTeamIds.includes(team.id);
          const hasSpace =
            (team.usersTourneys ? team.usersTourneys.length : 0) <
            this.getTeamCapacity(team);
          return isCurrentTeam || hasSpace;
        });
      },
    },

    /**
     * Hook du cycle de vie de Vue.js appelé après la création du composant.
     * Utilisé ici pour initialiser les données en appelant fetchData.
     */
    async created() {
      await this.fetchData();
    },

    methods: {
      /**
       * Calcule la capacité d'une équipe en fonction de son type.
       * @param {Object} team - L'équipe pour laquelle calculer la capacité.
       * @returns {number} Capacité maximale de l'équipe.
       */
      getTeamCapacity(team) {
        if (team.type === 'assistant') {
          // Les équipes 'assistant' ont une capacité multipliée par le nombre maximal d'équipes
          return this.teamSetup.playerPerTeam * this.teamSetup.maxTeamNumber;
        }
        // Les autres équipes ont une capacité basée sur playerPerTeam
        return this.teamSetup.playerPerTeam;
      },

      /**
       * Récupère les détails du tournoi depuis le backend et initialise les données du composant.
       */
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

          // Initialiser le mapping des assignations
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

      /**
       * Gère l'assignation d'un utilisateur à une équipe spécifique.
       * @param {Object} param0 - Objet contenant userId et teamId.
       */
      async handleAssignTeam({ userId, teamId }) {
        const tourneyId = this.$route.params.tourneyId;
        try {
          await apiService.post(
            `/tourneys/${tourneyId}/users/${userId}/teams`,
            { teamId }
          );

          // Rafraîchir les données après l'assignation
          await this.fetchData();

          // Afficher une notification de succès
          toast.success("Utilisateur assigné avec succès à l'équipe.");
        } catch (error) {
          console.error("Erreur lors de l'assignation de l'équipe:", error);
          // Afficher une notification d'erreur
          toast.error(
            "Une erreur est survenue lors de l'assignation de l'équipe."
          );
        }
      },

      /**
       * Gère la suppression d'un utilisateur du tournoi.
       * @param {number} userId - ID de l'utilisateur à supprimer.
       */
      async handleDeleteUser(userId) {
        const tourneyId = this.$route.params.tourneyId;
        try {
          await apiService.delete(`/tourneys/${tourneyId}/users/${userId}`);

          // Rafraîchir les données après la suppression
          await this.fetchData();

          // Afficher une notification de succès
          toast.success('Utilisateur supprimé avec succès.');
        } catch (error) {
          console.error(
            "Erreur lors de la suppression de l'utilisateur:",
            error
          );
          // Afficher une notification d'erreur
          toast.error(
            "Une erreur est survenue lors de la suppression de l'utilisateur."
          );
        }
      },

      /**
       * Redirige l'utilisateur vers la liste des équipes du tournoi.
       */
      goBackToTeams() {
        this.$router.push(
          `/admin/tourneys/${this.$route.params.tourneyId}/teams`
        );
      },

      /**
       * Valide les assignations automatiques en les envoyant au backend.
       */
      async handleValidateAssignments() {
        // Transformer le mapping des assignations en une liste d'objets
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

          // Afficher une notification de succès
          toast.success('Affectations validées avec succès.');

          // Réinitialiser les états d'assignation automatique
          this.isAutoFilled = false;
          this.initialSelectedTeamIds = {};
        } catch (error) {
          console.error(
            'Erreur lors de la validation des affectations:',
            error
          );
          // Afficher une notification d'erreur
          toast.error(
            'Une erreur est survenue lors de la validation des affectations.'
          );
        }
      },

      /**
       * Lance l'algorithme d'assignation automatique des groupes.
       * Répartit les utilisateurs non assignés entre les équipes disponibles.
       */
      autoFillGroups() {
        // 1. Stocker l'état initial des assignations pour permettre une annulation ultérieure
        this.initialSelectedTeamIds = { ...this.selectedTeamIds };
        let unassignedUsers = [...this.unassignedUsers];

        // 2. Séparer les équipes en 'player' et 'assistant'
        let assistantTeam = null;
        let teams = [];

        this.teams.forEach((team) => {
          if (team.type === 'assistant') {
            // Clone de l'équipe 'assistant' avec les utilisateurs déjà assignés
            assistantTeam = {
              ...team,
              assignedUsers: team.usersTourneys ? [...team.usersTourneys] : [],
            };
          } else {
            // Clonage des équipes 'player' avec les utilisateurs déjà assignés
            teams.push({
              ...team,
              assignedUsers: team.usersTourneys ? [...team.usersTourneys] : [],
            });
          }
        });

        /**
         * 3. Fonction interne pour assigner un nombre spécifique d'utilisateurs à une équipe.
         * @param {Object} team - L'équipe à laquelle assigner les utilisateurs.
         * @param {number} numberOfUsersNeeded - Nombre d'utilisateurs à assigner.
         */
        const assignUsersToTeam = (team, numberOfUsersNeeded) => {
          // Extraire les utilisateurs à assigner
          const usersToAssign = unassignedUsers.splice(0, numberOfUsersNeeded);
          // Ajouter les utilisateurs à l'équipe
          team.assignedUsers.push(...usersToAssign);
          // Mettre à jour le mapping des assignations
          usersToAssign.forEach((user) => {
            this.selectedTeamIds = {
              ...this.selectedTeamIds,
              [user.id]: team.id,
            };
          });
        };

        // a) Remplir les équipes partiellement remplies jusqu'au seuil minimal
        teams
          .filter(
            (team) =>
              team.assignedUsers.length > 0 &&
              team.assignedUsers.length < this.teamSetup.minPlayerPerTeam
          )
          .forEach((team) => {
            // Calculer le nombre d'utilisateurs nécessaires pour atteindre le seuil minimal
            const needed =
              this.teamSetup.minPlayerPerTeam - team.assignedUsers.length;
            // Assigner les utilisateurs nécessaires ou le nombre disponible
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
              // Assigner un utilisateur à l'équipe
              assignUsersToTeam(team, 1);
              distributionPossible = true;
              // Si tous les utilisateurs sont assignés, sortir de la boucle
              if (unassignedUsers.length === 0) break;
            }
          }
        }

        // d) Assigner les utilisateurs restants à l'équipe 'assistant'
        if (unassignedUsers.length > 0) {
          if (!assistantTeam) {
            // Afficher une erreur si aucune équipe 'assistant' n'est disponible
            toast.error(
              "Aucune équipe 'assistant' disponible pour les utilisateurs restants."
            );
            return;
          }
          // Assigner tous les utilisateurs restants à l'équipe 'assistant'
          assignUsersToTeam(assistantTeam, unassignedUsers.length);
        }

        // Marquer l'assignation automatique comme effectuée
        this.isAutoFilled = true;
      },

      /**
       * Annule l'assignation automatique en réinitialisant les assignations à l'état initial.
       */
      cancelAutoFill() {
        this.selectedTeamIds = { ...this.initialSelectedTeamIds };
        this.isAutoFilled = false;
      },
    },
  };
</script>

<style scoped>
  .mx-auto {
    max-width: 1200px;
  }

  .p-4 {
    padding: 1rem;
  }
</style>
