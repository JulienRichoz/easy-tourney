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
          v-if="hasAvailableTeams && enableAutoFill"
          :variant="isAutoFilled ? 'algo' : 'algo'"
          fontAwesomeIcon="cog"
          @click="isAutoFilled ? validateAssignments() : autoFillGroups()"
        >
          <span class="hidden sm:inline">
            {{ isAutoFilled ? 'Valider' : 'Remplir Groupes' }}
          </span>
        </ButtonComponent>
        <ButtonComponent
          v-if="isAutoFilled && enableAutoFill"
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
      class="text-light-errorMessage dark:text-dark-errorMessage mb-4 font-bold"
    >
      Pas d'équipe disponible. Veuillez en créer de nouvelles ou réassigner des
      utilisateurs.
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
                v-if="
                  availableTeams.length > 0 && teamSetup && enableAssignTeam
                "
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
                v-if="availableTeams.length > 0 && enableAssignTeam"
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
      teamSetup: {
        type: Object,
        required: false,
        default: null,
      },
      enableAutoFill: {
        type: Boolean,
        default: true,
      },
      enableAssignTeam: {
        type: Boolean,
        default: true,
      },
    },
    emits: ['go-back', 'assign-team', 'delete-user', 'validate-assignments'],
    computed: {
      availableTeams() {
        if (!this.teamSetup) return [];

        return this.teams.filter(
          (team) => team.Users.length < this.getTeamCapacity(team)
        );
      },
      teamOptions() {
        return this.availableTeams.map((team) => {
          const capacity = this.getTeamCapacity(team);
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
        showDeleteModal: false,
        userIdToDelete: null,
        selectedTeamIds: {},
        isAutoFilled: false,
        initialSelectedTeamIds: {},
      };
    },
    methods: {
      getTeamCapacity(team) {
        if (team.type === 'assistant') {
          return this.teamSetup.playerPerTeam * this.teamSetup.maxTeamNumber;
        }
        return this.teamSetup.playerPerTeam;
      },
      goBackToTeams() {
        this.$emit('go-back');
      },
      assignTeam(userId) {
        const teamId = this.selectedTeamIds[userId];
        if (teamId) {
          this.$emit('assign-team', { userId, teamId });
          // Supprimer l'entrée après l'assignation
          delete this.selectedTeamIds[userId];
        } else {
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
        // 1. Stocker l'état initial
        this.initialSelectedTeamIds = { ...this.selectedTeamIds };
        let unassignedUsers = [...this.users];

        // 2. Séparer les équipes 'player' et l'équipe 'assistant'
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

        // 3. Fonction pour assigner des utilisateurs à une équipe
        const assignUsersToTeam = (team, numberOfUsersNeeded) => {
          const usersToAssign = unassignedUsers.splice(0, numberOfUsersNeeded);
          team.assignedUsers.push(...usersToAssign);
          usersToAssign.forEach((user) => {
            this.selectedTeamIds[user.id] = team.id;
          });
        };

        // a) Remplir les groupes partiels jusqu'au seuil minimal
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

        // c) Distribuer les utilisateurs restants aux équipes jusqu'au maximum autorisé
        let distributionPossible = true;

        while (unassignedUsers.length > 0 && distributionPossible) {
          distributionPossible = false;
          for (const team of teams) {
            if (
              team.assignedUsers.length < this.teamSetup.playerPerTeam &&
              unassignedUsers.length > 0
            ) {
              assignUsersToTeam(team, 1);
              distributionPossible = true;
              if (unassignedUsers.length === 0) break;
            }
          }
        }

        // d) Assigner les utilisateurs restants à l'équipe 'assistant' si nécessaire
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
        const assignments = Object.entries(this.selectedTeamIds)
          .filter(([teamId]) => teamId !== null && teamId !== undefined)
          .map(([userId, teamId]) => ({
            userId: Number(userId),
            teamId,
          }));
        this.$emit('validate-assignments', assignments);
        this.isAutoFilled = false;
        this.initialSelectedTeamIds = {};
      },

      cancelAutoFill() {
        this.selectedTeamIds = { ...this.initialSelectedTeamIds };
        this.isAutoFilled = false;
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
</style>
