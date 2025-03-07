<!-- ListUsersTable.vue -->
<!-- Ce composant affiche une liste d'utilisateurs avec des fonctionnalités d'édition, suppression, assignation d'équipe et de tournoi. -->
<!-- Il permet également de filtrer les utilisateurs par tournoi et de rechercher par nom ou email. -->
<!-- Il est utilisé dans plusieurs pages de l'application (User, UnassignedUsers, List des player par pool etc.). -->
<!-- !!! Attention au changement => Composant très complexe !!! -->
<template>
  <div
    class="p-4 bg-light-background dark:bg-dark-background rounded-md shadow-lg"
  >
    <!-- En-tête avec les boutons et le titre -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <TitleComponent :title="title" />

        <!-- Bouton Ajouter Utilisateur -->
        <ButtonComponent
          v-if="enableAddUser"
          variant="primary"
          fontAwesomeIcon="fa-user"
          @click="handleAddUserClick"
        >
          <span class="hidden sm:inline"> Nouvel utilisateur</span>
        </ButtonComponent>

        <!-- Bouton Envoyer Email -->
        <ButtonComponent
          v-if="showEmailButton"
          variant="info"
          fontAwesomeIcon="envelope"
          @click="sendEmailToAll"
          :disabled="users.length === 0"
        >
          <span class="hidden sm:inline">Envoyer Email</span>
        </ButtonComponent>

        <!-- Slot pour les boutons supplémentaires -->
        <slot name="header-buttons"></slot>
      </div>

      <!-- Bouton Retour -->
      <ButtonComponent
        v-if="showBackButton"
        variant="secondary"
        fontAwesomeIcon="arrow-left"
        @click="goBack"
      >
        <span class="hidden sm:inline">{{ backButtonText }}</span>
      </ButtonComponent>
    </div>

    <!-- FILTRES -->
    <div v-if="showFilters" class="flex items-center space-x-4 mb-4">
      <!-- Filtre par tournoi -->
      <div>
        <v-select
          v-model="selectedTournamentFilter"
          :options="tournamentOptions"
          placeholder="Filtrer par tournoi"
          label="name"
          :reduce="(tourney) => tourney.id"
          appendToBody
          clearable
          class="w-full sm:w-64"
        />
      </div>
      <!-- Filtre de recherche -->
      <div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher par nom ou email"
          class="border border-light-form-border dark:border-dark-form-border rounded-md p-2 w-full sm:w-64 bg-light-form-background dark:bg-dark-form-background text-light-form-text dark:text-dark-form-text"
        />
      </div>
      <!-- Filtre utilisateurs sans tournoi -->
      <div class="mt-2">
        <label class="inline-flex items-center">
          <input
            type="checkbox"
            v-model="filterNoTournament"
            class="form-checkbox h-5 w-5 text-indigo-600"
          />
          <span class="ml-2 text-light-form-text dark:text-dark-form-text">
            Sans tournoi
          </span>
        </label>
      </div>
    </div>

    <!-- Message d'information si tous les groupes sont complets -->
    <p
      v-if="!hasAvailableTeams && enableAssignTeam"
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
            <!-- Colonne Nom -->
            <th
              class="px-4 py-2 text-left text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Nom
            </th>
            <!-- Colonne Email -->
            <th
              class="px-4 py-2 text-left text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Email
            </th>
            <!-- Colonne Téléphone -->
            <th
              v-if="showPhone"
              class="px-4 py-2 text-left text-light-title dark:text-dark-title hidden md:table-cell border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Téléphone
            </th>
            <!-- Colonne Tournois -->
            <th
              v-if="showTourney"
              class="px-4 py-2 text-left text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Tournois
            </th>
            <!-- Colonne Ajouter au Tournoi -->
            <th
              v-if="showAssignTourney"
              class="px-4 py-2 text-left text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Ajouter au Tournoi
            </th>
            <!-- Colonne Équipe (affichée uniquement si enableAssignTeam est true) -->
            <th
              v-if="enableAssignTeam"
              class="px-4 py-2 text-center text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Équipe
            </th>
            <!-- Colonne Suppression -->
            <th
              class="px-2 py-2 text-center text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Del
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in displayedUsers"
            :key="user.id"
            class="hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground"
          >
            <!-- Colonne Edit -->
            <td class="px-2 py-2 text-center">
              <SoftButtonComponent
                fontAwesomeIcon="pen"
                iconClass="w-5 h-5 text-light-buttonVariants-warning-default hover:text-light-buttonVariants-warning-hover dark:text-dark-buttonVariants-warning-default hover:dark:text-dark-buttonVariants-warning-hover"
                aria-label="Éditer l'utilisateur"
                @click="handleEditClick(user)"
              />
            </td>
            <!-- Colonne Username -->
            <td class="px-4 py-2">
              <span
                v-if="user.role.id === 1"
                class="mr-1 px-2 py-1 text-xs font-semibold text-white bg-light-buttonVariants-info-default dark:bg-dark-buttonVariants-info-default rounded-full"
              >
                Admin
              </span>
              <router-link
                :to="`/admin/users/${user.id}`"
                class="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {{ user.name || 'N/A' }}
              </router-link>
            </td>
            <!-- Colonne Email -->
            <td class="px-4 py-2 truncate">
              <a
                :href="`mailto:${user.email}`"
                class="text-blue-500 dark:text-blue-400 hover:underline"
              >
                {{ user.email || '-' }}
              </a>
            </td>

            <!-- Colonne Tournois -->
            <td v-if="showTourney" class="px-4 py-2 max-h-24 overflow-y-auto">
              <ul>
                <li
                  v-for="userTourney in user.usersTourneys || []"
                  :key="userTourney.tourney.id"
                  class="flex items-center space-x-2"
                >
                  <span>{{ userTourney.tourney.name }}</span>
                  <SoftButtonComponent
                    fontAwesomeIcon="fa-times"
                    iconClass="w-4 h-4 text-light-logoutButton-default hover:text-light-logoutButton-hover dark:text-dark-logoutButton-default hover:dark:text-dark-logoutButton-hover"
                    aria-label="Retirer du tournoi"
                    @click="
                      confirmRemoveFromTourney(user.id, userTourney.tourney.id)
                    "
                  />
                </li>
              </ul>
            </td>
            <!-- Colonne Ajouter au Tournoi -->
            <td
              v-if="showAssignTourney"
              class="px-4 py-2 flex items-center space-x-2"
            >
              <v-select
                v-model="selectedTourneyIds[user.id]"
                :options="availableTourneys[user.id]"
                placeholder="Tournoi"
                label="name"
                :reduce="(tourney) => tourney.id"
                appendToBody
                clearable
                class="w-full sm:w-48"
              />
              <ButtonComponent
                variant="primary"
                size="sm"
                heroIcon="PlusIcon"
                @click="assignTourney(user.id)"
                :disabled="!selectedTourneyIds[user.id]"
              />
            </td>
            <!-- Colonne Phone -->
            <td v-if="showPhone" class="px-4 py-2 hidden md:table-cell">
              {{ user.phone || '-' }}
            </td>
            <!-- Colonne Équipe -->
            <td
              v-if="enableAssignTeam"
              class="px-4 py-2 flex items-center justify-center space-x-2"
            >
              <!-- Sélecteur d'équipe -->
              <v-select
                v-if="
                  availableTeams.length > 0 &&
                  teamSetup &&
                  allowAssignToOtherTeams
                "
                v-model="localSelectedTeamIds[user.id]"
                :options="teamOptions"
                placeholder="Select Team"
                appendToBody
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
                @update:modelValue="onTeamSelectionChange(user.id, $event)"
              />
              <!-- Bouton Assigner -->
              <ButtonComponent
                fontAwesomeIcon="add"
                v-if="availableTeams.length > 0 && allowAssignToOtherTeams"
                variant="primary"
                @click="assignTeam(user.id)"
                :disabled="localSelectedTeamIds[user.id] === user.teamId"
              >
                <span class="hidden md:inline">Assigner</span>
              </ButtonComponent>
              <!-- Bouton Désactivé si aucune équipe disponible -->
              <ButtonComponent
                v-else
                :fontAwesomeIcon="'ban'"
                variant="gray"
                :disabled="true"
              >
                <span class="hidden sm:inline">Aucune équipe</span>
              </ButtonComponent>
            </td>
            <!-- Colonne Supprimer -->
            <td class="px-2 py-2 text-center">
              <SoftButtonComponent
                v-if="enableRemoveUser"
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
      :isVisible="showDeleteModal"
      :title="deleteModalTitle"
      :message="deleteModalMessage"
      @confirm="deleteUser"
      @form-cancel="closeDeleteModal"
    />

    <!-- Confirmation modal pour retirer un utilisateur d'un tournoi -->
    <DeleteConfirmationModal
      :isVisible="showRemoveFromTourneyModal"
      title="Confirmer le retrait"
      message="Êtes-vous sûr de vouloir retirer cet utilisateur du tournoi?"
      @confirm="removeUserFromTourney"
      @form-cancel="closeRemoveFromTourneyModal"
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

      // Données des utilisateurs
      users: {
        type: Array,
        required: true,
        default: () => [],
      },

      // Données des équipes
      teams: {
        type: Array,
        required: false,
        default: () => [],
      },
      teamSetup: {
        type: Object,
        required: false,
        default: null,
      },
      enableAssignTeam: {
        type: Boolean,
        default: true,
      },

      allowAssignToOtherTeams: {
        type: Boolean,
        default: true,
      },
      enableRemoveUser: {
        type: Boolean,
        default: true,
      },
      backButtonText: {
        type: String,
        default: 'Retour',
      },
      deleteModalTitle: {
        type: String,
        default: 'Confirmer la suppression',
      },
      deleteModalMessage: {
        type: String,
        default: 'Êtes-vous sûr de vouloir supprimer cet utilisateur?',
      },
      showEmailButton: {
        type: Boolean,
        default: true,
      },
      showBackButton: {
        type: Boolean,
        default: true,
      },
      showPhone: {
        type: Boolean,
        default: true,
      },
      showFilters: {
        type: Boolean,
        default: false,
      },
      showTourney: {
        type: Boolean,
        default: false,
      },
      showAssignTourney: {
        type: Boolean,
        default: false,
      },
      tournaments: {
        type: Array,
        required: false,
        default: () => [],
      },
      editUserFunction: {
        type: Function,
        default: null,
      },
      addUserFunction: {
        type: Function,
        default: null,
      },
      enableAddUser: {
        type: Boolean,
        default: false,
      },
      selectedTeamIds: {
        type: Object,
        default: () => ({}),
      },
    },
    emits: [
      'go-back',
      'assign-team',
      'delete-user',
      'validate-assignments',
      'assign-tourney',
      'remove-user-from-tourney',
      'user-updated',
      'update:selectedTeamIds',
    ],
    data() {
      return {
        showDeleteModal: false,
        userIdToDelete: null,
        isAutoFilled: false,
        initialSelectedTeamIds: {},
        selectedTournamentFilter: null,
        searchQuery: '',
        filterNoTournament: false,
        tournamentOptions: [],
        selectedTourneyIds: {},
        localSelectedTeamIds: {},
        availableTourneys: {},
        showRemoveFromTourneyModal: false,
        userIdToRemoveFromTourney: null,
        tourneyIdToRemove: null,

        // Handle form edit for user creation/update
        showEditUserModal: false,
        editingUser: null,
        newUser: {
          name: '',
          email: '',
          phone: '',
          password: '',
          roleId: '',
        },
        formErrors: {},
        isFormValid: false,
      };
    },
    computed: {
      /**
       * Retourne les équipes disponibles pour l'assignation.
       * @returns {Array}
       */
      availableTeams() {
        if (!this.teamSetup) return [];

        const currentTeamIds = this.users
          .map((user) => user.teamId)
          .filter((teamId) => teamId != null);

        return this.teams.filter((team) => {
          const isCurrentTeam = currentTeamIds.includes(team.id);
          const hasSpace =
            (team.usersTourneys ? team.usersTourneys.length : 0) <
            this.getTeamCapacity(team);
          return isCurrentTeam || hasSpace;
        });
      },

      /**
       * Options pour le sélecteur d'équipes.
       * @returns {Array}
       */
      teamOptions() {
        return this.availableTeams.map((team) => {
          const capacity = this.getTeamCapacity(team);
          return {
            id: team.id,
            teamName: `${team.teamName} (${team.usersTourneys.length}/${capacity})`,
          };
        });
      },

      /**
       * Indique s'il y a des équipes disponibles.
       * @returns {Boolean}
       */
      hasAvailableTeams() {
        return this.availableTeams.length > 0;
      },

      /**
       * Utilisateurs à afficher en fonction des filtres.
       * @returns {Array}
       */
      displayedUsers() {
        return this.showFilters ? this.filteredUsers : this.users;
      },

      /**
       * Utilisateurs filtrés.
       * @returns {Array}
       */
      filteredUsers() {
        let filtered = this.users;

        if (this.selectedTournamentFilter) {
          filtered = filtered.filter((user) =>
            user.usersTourneys?.some(
              (ut) => ut.tourney.id === this.selectedTournamentFilter
            )
          );
        }

        if (this.filterNoTournament) {
          filtered = filtered.filter(
            (user) => !user.usersTourneys || user.usersTourneys.length === 0
          );
        }

        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (user) =>
              (user.name && user.name.toLowerCase().includes(query)) ||
              (user.email && user.email.toLowerCase().includes(query))
          );
        }

        return filtered;
      },

      /**
       * Form fields pour l'édition d'un utilisateur.
       */
      userFormFields() {
        return [
          {
            name: 'name',
            label: 'Nom',
            type: 'text',
            required: true,
          },
          {
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true,
          },
          {
            name: 'phone',
            label: 'Téléphone',
            type: 'text',
            required: false,
          },
          {
            name: 'password',
            label: 'Mot de passe',
            type: 'password',
            required: false,
          },
          {
            name: 'roleId',
            label: 'Rôle',
            type: 'select',
            required: true,
            options: [
              { value: 1, label: 'Admin' },
              { value: 2, label: 'Utilisateur' },
            ],
          },
        ];
      },
    },
    methods: {
      /**
       * Retourne la capacité maximale d'une équipe.
       * @param {Object} team - L'équipe.
       * @returns {Number}
       */
      getTeamCapacity(team) {
        if (team.type === 'assistant') {
          return this.teamSetup.playerPerTeam * this.teamSetup.maxTeamNumber;
        }
        return this.teamSetup.playerPerTeam;
      },

      /**
       * Émet l'événement pour retourner en arrière.
       */
      goBack() {
        this.$emit('go-back');
      },

      /**
       * Assigne un utilisateur à une équipe.
       * @param {Number} userId - ID de l'utilisateur.
       */
      assignTeam(userId) {
        const teamId = this.localSelectedTeamIds[userId];
        if (teamId) {
          this.$emit('assign-team', { userId, teamId });
          // Remove the entry after assignment
          const newSelectedTeamIds = { ...this.localSelectedTeamIds };
          delete newSelectedTeamIds[userId];
          this.localSelectedTeamIds = newSelectedTeamIds;
          this.$emit('update:selectedTeamIds', this.localSelectedTeamIds);
        } else {
          toast.info('Veuillez sélectionner une équipe pour cet utilisateur.');
        }
      },

      /**
       * Ouvre la modale de confirmation de suppression d'un utilisateur.
       * @param {Number} userId - ID de l'utilisateur à supprimer.
       */
      confirmDelete(userId) {
        const user = this.users.find((u) => u.id == userId);
        const currentUserId = this.$store.state.user.id;
        // Vérifier si l'utilisateur est un admin et si le super admin est le seul à pouvoir le supprimer
        if (user && user.role.id === 1 && currentUserId !== 1) {
          toast.error(
            'Seul le super admin peut supprimer un autre administrateur.'
          );
          return;
        }

        this.userIdToDelete = userId;
        this.showDeleteModal = true;
      },

      /**
       * Emets l'événement pour mettre à jour l'équipe sélectionnée.
       * @param userId
       * @param teamId
       */
      onTeamSelectionChange(userId, teamId) {
        this.localSelectedTeamIds[userId] = teamId;
        this.$emit('update:selectedTeamIds', { ...this.localSelectedTeamIds });
      },

      /**
       * Supprime l'utilisateur après confirmation.
       */
      deleteUser() {
        if (this.userIdToDelete !== null) {
          this.$emit('delete-user', this.userIdToDelete);
          this.closeDeleteModal();
        }
      },

      /**
       * Ferme la modale de suppression.
       */
      closeDeleteModal() {
        this.showDeleteModal = false;
        this.userIdToDelete = null;
      },

      /**
       * Envoie un email à tous les utilisateurs.
       */
      sendEmailToAll() {
        const emails = this.users
          .map((user) => user.email)
          .filter((email) => email);
        if (emails.length === 0) {
          toast.error("Il n'y a aucun utilisateur pour envoyer un email.");
          return;
        }
        const mailtoLink = `mailto:${emails.join(',')}`;
        window.location.href = mailtoLink;
      },

      /**
       * Gère le clic sur le bouton d'édition d'un utilisateur.
       * @param {Object} user - L'utilisateur à éditer.
       */
      handleEditClick(user) {
        if (this.editUserFunction) {
          this.editUserFunction(user);
        } else {
          this.navigateToEdit(user.id);
        }
      },

      /**
       * Ouvre la modale d'ajout d'un utilisateur.
       */
      handleAddUserClick() {
        if (this.addUserFunction) {
          this.addUserFunction();
        }
      },

      /**
       * Navigation vers la page d'édition.
       * @param {Number} userId - ID de l'utilisateur.
       */
      navigateToEdit(userId) {
        this.$router.push(`/admin/users/${userId}`);
      },

      /**
       * Valide les assignations d'équipe.
       */
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

      /**
       * Met à jour l'équipe sélectionnée pour un utilisateur.
       * @param userId
       * @param teamId
       */
      updateSelectedTeamId(userId, teamId) {
        this.localSelectedTeamIds = {
          ...this.localSelectedTeamIds,
          [userId]: teamId,
        };
        this.$emit('update:selectedTeamIds', this.localSelectedTeamIds);
      },

      /**
       * Charge les tournois disponibles pour chaque utilisateur.
       * @returns {Promise<void>}
       */
      async loadAvailableTourneys() {
        const allTourneys = this.tournaments;
        this.users.forEach((user) => {
          const userTourneys = (user.usersTourneys || []).map(
            (ut) => ut.tourney.id
          );
          this.availableTourneys[user.id] = allTourneys.filter(
            (tourney) => !userTourneys.includes(tourney.id)
          );
        });
      },

      /**
       * Assigne un utilisateur à un tournoi.
       * @param {Number} userId - ID de l'utilisateur.
       */
      assignTourney(userId) {
        const tourneyId = this.selectedTourneyIds[userId];
        if (tourneyId) {
          this.$emit('assign-tourney', { userId, tourneyId });
          this.selectedTourneyIds[userId] = null;
          this.loadAvailableTourneys();
        } else {
          toast.info('Veuillez sélectionner un tournoi.');
        }
      },

      /**
       * Ouvre la modale de confirmation pour retirer un utilisateur d'un tournoi.
       * @param {Number} userId - ID de l'utilisateur.
       * @param {Number} tourneyId - ID du tournoi.
       */
      confirmRemoveFromTourney(userId, tourneyId) {
        this.userIdToRemoveFromTourney = userId;
        this.tourneyIdToRemove = tourneyId;
        this.showRemoveFromTourneyModal = true;
      },

      /**
       * Retire un utilisateur d'un tournoi après confirmation.
       */
      removeUserFromTourney() {
        if (
          this.userIdToRemoveFromTourney !== null &&
          this.tourneyIdToRemove !== null
        ) {
          this.$emit('remove-user-from-tourney', {
            userId: this.userIdToRemoveFromTourney,
            tourneyId: this.tourneyIdToRemove,
          });
          this.closeRemoveFromTourneyModal();
          this.loadAvailableTourneys();
        }
      },

      /**
       * Ferme la modale de retrait d'un utilisateur d'un tournoi.
       */
      closeRemoveFromTourneyModal() {
        this.showRemoveFromTourneyModal = false;
        this.userIdToRemoveFromTourney = null;
        this.tourneyIdToRemove = null;
      },

      /*
       * Fonctions pour la gestion des erreurs de formulaire
       */
      editUser(user) {
        this.editingUser = user;
        this.newUser = { ...user };
        this.showEditUserModal = true;
        this.formErrors = {};
        this.isFormValid = true;
      },

      /**
       * Ferme la modale d'édition d'un utilisateur.
       */
      closeEditUserModal() {
        this.showEditUserModal = false;
        this.editingUser = null;
        this.newUser = {
          name: '',
          email: '',
          phone: '',
        };
      },

      /**
       * Valide le formulaire d'édition d'un utilisateur.
       */
      validateUserForm() {
        const errors = {};
        if (!this.newUser.name) {
          errors.name = 'Le nom est obligatoire.';
        }
        if (!this.newUser.email) {
          errors.email = "L'email est obligatoire.";
        }
        this.formErrors = errors;
        this.isFormValid = Object.keys(errors).length === 0;
        return errors;
      },

      /**
       * Met à jour les informations de l'utilisateur.
       */
      async handleUserFormSubmit() {
        this.validateUserForm();
        if (!this.isFormValid) return;
        // Update user au serveur
        try {
          await apiService.put(`/users/${this.editingUser.id}`, this.newUser);
          toast.success('Utilisateur mis à jour avec succès!');
          this.closeEditUserModal();
          this.$emit('user-updated');
        } catch (error) {
          console.error(
            "Erreur lors de la mise à jour de l'utilisateur :",
            error
          );
          toast.error("Erreur lors de la mise à jour de l'utilisateur!");
        }
      },
    },
    watch: {
      /**
       * Surveille les changements dans la liste des utilisateurs.
       */
      users: {
        handler() {
          if (this.showAssignTourney) {
            this.loadAvailableTourneys();
          }
        },
        immediate: true,
      },

      /**
       * Surveille les changements dans la liste des tournois.
       */
      tournaments: {
        handler(newTournaments) {
          this.tournamentOptions = newTournaments;
        },
        immediate: true,
      },

      /**
       * Surveille les changements dans les équipes sélectionnées.
       */
      selectedTeamIds: {
        handler(newVal) {
          this.localSelectedTeamIds = { ...newVal };
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
</style>
