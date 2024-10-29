<!-- ListUsersTable.vue -->
<template>
  <div
    class="p-4 bg-light-background dark:bg-dark-background rounded-md shadow-lg"
  >
    <!-- En-tête avec les boutons et le titre -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <TitleComponent :title="title" />
        <ButtonComponent
          variant="info"
          fontAwesomeIcon="envelope"
          @click="sendEmailToAll"
          :disabled="users.length === 0"
        >
          <span class="hidden sm:inline">Envoyer Email</span>
        </ButtonComponent>
        <ButtonComponent
          v-if="hasAvailableTeams"
          :variant="isAutoFilled ? 'algo' : 'algo'"
          fontAwesomeIcon="cog"
          @click="isAutoFilled ? validateAssignments() : autoFillGroups()"
        >
          <span class="hidden sm:inline">
            {{ isAutoFilled ? 'Valider' : 'Remplir Groupes' }}
          </span>
        </ButtonComponent>
        <ButtonComponent
          v-if="isAutoFilled"
          variant="secondary"
          @click="cancelAutoFill"
        >
          <span class="hidden sm:inline">Annuler</span>
        </ButtonComponent>
      </div>
      <ButtonComponent
        variant="secondary"
        fontAwesomeIcon="arrow-left"
        @click="goBackToTeams"
      >
        <span class="hidden sm:inline">Retour aux équipes</span>
      </ButtonComponent>
    </div>

    <!-- Message d'information si tous les groupes sont complets -->
    <p
      v-if="!hasAvailableTeams"
      class="text-light-errorMessage dark:text-dark-errorMessage mb-4"
    >
      Tous les groupes sont complets. Veuillez en créer de nouveaux ou
      réassigner des utilisateurs.
    </p>

    <!-- Table pour afficher les utilisateurs -->
    <div class="overflow-x-auto overflow-y-auto max-h-[70vh] mt-4">
      <table
        class="min-w-full bg-light-card dark:bg-dark-card shadow rounded-lg"
      >
        <thead>
          <tr>
            <!-- Colonne Edit -->
            <th
              class="px-2 py-2 text-center text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Edit
            </th>
            <th
              class="px-4 py-2 text-left text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Nom
            </th>
            <th
              class="px-4 py-2 text-left text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Email
            </th>
            <th
              class="px-4 py-2 text-left text-light-title dark:text-dark-title hidden md:table-cell border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Téléphone
            </th>
            <th
              class="px-4 py-2 text-center text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Équipe
            </th>
            <th
              class="px-2 py-2 text-center text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            ></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in users"
            :key="user.id"
            class="hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground"
          >
            <!-- Colonne Edit -->
            <td class="px-2 py-2 text-center">
              <SoftButtonComponent
                fontAwesomeIcon="pen"
                iconClass="w-5 h-5 text-light-buttonVariants-warning-default hover:text-light-buttonVariants-warning-hover dark:text-dark-buttonVariants-warning-default hover:dark:text-dark-buttonVariants-warning-hover"
                aria-label="Éditer l'utilisateur"
                @click.stop="navigateToEdit(user.id)"
              />
            </td>
            <td class="px-4 py-2">{{ user.name || 'N/A' }}</td>
            <td class="px-4 py-2 truncate">
              <a
                :href="`mailto:${user.email}`"
                class="text-blue-500 dark:text-blue-400 hover:underline"
              >
                {{ user.email || '-' }}
              </a>
            </td>
            <td class="px-4 py-2 hidden md:table-cell">
              {{ user.phone || '-' }}
            </td>
            <!-- Equipe -->
            <td class="px-4 py-2 flex items-center justify-center space-x-2">
              <v-select
                v-if="availableTeams.length > 0 && teamSetup"
                v-model="selectedTeamIds[user.id]"
                :options="teamOptions"
                placeholder="Select Team"
                :reduce="(team) => team.id"
                label="teamName"
                :styles="{
                  dropdown: {
                    'max-height': '200px',
                    'overflow-y': 'auto',
                  },
                }"
                :class="[
                  'border border-light-form-border dark:border-dark-form-border rounded-md p-1 w-48 sm:w-56',
                  'bg-light-form-background dark:bg-dark-form-background text-light-form-text dark:text-dark-form-text ring-indigo-500',
                  'cursor-pointer',
                ]"
              />
              <ButtonComponent
                fontAwesomeIcon="add"
                v-if="availableTeams.length > 0"
                variant="primary"
                @click="assignTeam(user.id)"
              >
                <span class="hidden md:inline">Assigner</span>
              </ButtonComponent>
              <ButtonComponent
                v-else
                :fontAwesomeIcon="'ban'"
                variant="gray"
                :disabled="true"
              >
                <span class="hidden sm:inline">Aucune équipe</span>
              </ButtonComponent>
            </td>
            <!-- Colonne Supprimer  -->
            <td class="px-2 py-2 text-center">
              <SoftButtonComponent
                fontAwesomeIcon="trash"
                iconClass="w-5 h-5 text-light-buttonVariants-danger-default hover:text-light-buttonVariants-danger-hover dark:text-dark-buttonVariants-danger-default hover:dark:text-dark-buttonVariants-danger-hover"
                aria-label="Supprimer l'utilisateur"
                @click="confirmDelete(user.id)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Confirmation modal pour suppression -->
    <DeleteConfirmationModal
      v-if="showDeleteModal"
      :isVisible="showDeleteModal"
      title="Confirmer la suppression"
      message="Êtes-vous sûr de vouloir supprimer cet utilisateur du tournoi?"
      @confirm="deleteUser"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import TitleComponent from '@/components/TitleComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import SoftButtonComponent from '@/components/SoftButtonComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      TitleComponent,
      ButtonComponent,
      SoftButtonComponent,
      DeleteConfirmationModal,
    },
    props: {
      title: {
        type: String,
        default: 'Liste des utilisateurs',
      },
      users: {
        type: Array,
        required: true,
        default: () => [],
      },
      teams: {
        type: Array,
        required: false,
        default: () => [],
      },
      isAssigned: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['go-back', 'assign-team', 'delete-user', 'auto-fill-groups'],
    computed: {
      availableTeams() {
        if (!this.teamSetup) return [];

        return this.teams.filter(
          (team) => team.Users.length < this.getTeamCapacity(team)
        );
      },

      teamOptions() {
        return this.availableTeams.map((team) => {
          const capacity =
            team.type === 'assistant'
              ? this.teamSetup.playerPerTeam * this.teamSetup.maxTeamNumber
              : this.teamSetup.playerPerTeam;

          return {
            id: team.id,
            teamName: `${team.teamName} (${team.Users.length}/${capacity})`,
          };
        });
      },
      hasAvailableTeams() {
        return this.availableTeams.length > 0;
      },
    },
    data() {
      return {
        teamSetup: null,
        showDeleteModal: false,
        userIdToDelete: null,
        selectedTeamIds: {},
        isAutoFilled: false,
        initialSelectedTeamIds: {},
      };
    },
    async created() {
      await this.fetchTeamSetup(); // Charger `teamSetup` au montage du composant
    },
    methods: {
      getTeamCapacity(team) {
        if (team.type === 'assistant') {
          return this.teamSetup.playerPerTeam * this.teamSetup.maxTeamNumber;
        }
        return this.teamSetup.playerPerTeam;
      },
      async fetchTeamSetup() {
        try {
          const tourneyId = this.$route.params.id;
          const response = await apiService.get(
            `/tourneys/${tourneyId}/team-setup`
          );
          this.teamSetup = response.data;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération de la configuration des équipes:',
            error
          );
        }
      },
      goBackToTeams() {
        this.$emit('go-back');
      },
      assignTeam(userId) {
        const teamId = this.selectedTeamIds[userId];
        if (teamId) {
          this.$emit('assign-team', { userId, teamId });
          // Réinitialiser la sélection après assignation
          this.selectedTeamIds[userId] = null;
        } else {
          // Affiche un message si aucune équipe n'est sélectionnée
          toast.info('Veuillez sélectionner une équipe pour cet utilisateur.');
        }
      },
      confirmDelete(userId) {
        this.userIdToDelete = userId;
        this.showDeleteModal = true;
      },
      deleteUser() {
        if (this.userIdToDelete !== null) {
          this.$emit('delete-user', this.userIdToDelete);
          this.closeDeleteModal();
        }
      },
      closeDeleteModal() {
        this.showDeleteModal = false;
        this.userIdToDelete = null;
      },
      sendEmailToAll() {
        const emails = this.users
          .map((user) => user.email)
          .filter((email) => email);
        if (emails.length === 0) {
          toast.error(
            "Il n'y a aucun utilisateur sans groupe pour envoyer un email."
          );
          return;
        }
        const mailtoLink = `mailto:${emails.join(',')}`;
        window.location.href = mailtoLink;
      },
      navigateToEdit(userId) {
        const tourneyId = this.$route.params.id;
        this.$router.push(`/tourneys/${tourneyId}/users/${userId}/edit`);
      },

      /*
       * Fonctions pour pré-remplir automatiquement les groupes
       */
      autoFillGroups() {
        // Stocker l'état initial
        this.initialSelectedTeamIds = { ...this.selectedTeamIds };
        let unassignedUsers = [...this.users];

        // Séparer les équipes 'player' et l'équipe 'assistant'
        let assistantTeam = null;
        let teams = [];

        this.teams.forEach((team) => {
          if (team.type === 'assistant') {
            assistantTeam = {
              ...team,
              assignedUsers: team.Users ? [...team.Users] : [],
            };
          } else {
            teams.push({
              ...team,
              assignedUsers: team.Users ? [...team.Users] : [],
            });
          }
        });

        // Fonction pour assigner des utilisateurs à une équipe
        const assignUsersToTeam = (team, numberOfUsersNeeded) => {
          const usersToAssign = unassignedUsers.splice(0, numberOfUsersNeeded);
          team.assignedUsers.push(...usersToAssign);
          usersToAssign.forEach((user) => {
            this.selectedTeamIds[user.id] = team.id;
          });
        };

        // a) Remplir les groupes partiels pour les rendre valides
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

        // b) Remplir les groupes vides pour les rendre pleins
        teams
          .filter((team) => team.assignedUsers.length === 0)
          .forEach((team) => {
            const needed = this.teamSetup.playerPerTeam;
            assignUsersToTeam(team, Math.min(needed, unassignedUsers.length));
          });

        // c) Remplir les groupes vides pour les rendre valides
        if (unassignedUsers.length > 0) {
          teams
            .filter((team) => team.assignedUsers.length === 0)
            .forEach((team) => {
              const needed = this.teamSetup.minPlayerPerTeam;
              assignUsersToTeam(team, Math.min(needed, unassignedUsers.length));
            });
        }

        // d) Remplir les groupes valides pour les rendre pleins
        teams
          .filter(
            (team) =>
              team.assignedUsers.length >= this.teamSetup.minPlayerPerTeam &&
              team.assignedUsers.length < this.teamSetup.playerPerTeam
          )
          .forEach((team) => {
            const needed =
              this.teamSetup.playerPerTeam - team.assignedUsers.length;
            assignUsersToTeam(team, Math.min(needed, unassignedUsers.length));
          });

        // e) Assigner les utilisateurs restants à l'équipe 'assistant'
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
      validateAssignments() {
        // Collecter les affectations
        const assignments = Object.entries(this.selectedTeamIds).map(
          ([userId, teamId]) => ({
            userId: Number(userId),
            teamId,
          })
        );

        // Émettre un événement pour que le parent puisse gérer l'envoi au backend
        this.$emit('validate-assignments', assignments);

        // Réinitialiser l'état
        this.isAutoFilled = false;
        this.initialSelectedTeamIds = {};
      },
      cancelAutoFill() {
        // Restaurer l'état initial
        this.selectedTeamIds = { ...this.initialSelectedTeamIds };
        this.isAutoFilled = false;
      },
    },
    watch: {
      teams: {
        handler() {
          // Vous pouvez ajouter des actions supplémentaires ici si nécessaire lorsque les équipes changent
        },
        deep: true,
      },
    },
  };
</script>

<style scoped>
  /* Remplacement des styles en ligne par des classes Tailwind */
  table th,
  table td {
    padding: 0.5rem;
    white-space: nowrap;
  }

  .v-list .v-list-item--active {
    background-color: green !important;
  }
  .v-list .v-list-item--active .v-list-item__title {
    color: #ffd54f !important;
  }
</style>
