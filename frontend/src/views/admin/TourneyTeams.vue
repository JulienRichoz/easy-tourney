<!-- TourneyTeams.vue -->
<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <div class="p-6">
      <div class="flex items-center mb-8 justify-between">
        <div class="flex items-center space-x-4">
          <!-- Titre -->
          <TitleComponent title="Gestion des Equipes" />

          <!-- Bouton Réglages -->
          <ButtonComponent
            fontAwesomeIcon="cog"
            @click="openTeamSetupModal"
            variant="secondary"
          >
            <!-- Texte réduit sur mobile -->
            <span class="hidden sm:md:inline">Réglages</span>
          </ButtonComponent>
        </div>

        <!-- Boutons pour générer et réinitialiser les équipes -->
        <div class="flex items-center space-x-2 ml-auto">
          <!-- Bouton pour générer les équipes, visible uniquement si teamSetup existe et si le nombre max de groupes n'est pas atteint -->
          <ButtonComponent
            v-if="
              isEditable &&
              teamSetupConfigured &&
              teams.length <
                teamSetup.maxTeamNumber + (teamSetupConfigured ? 1 : 0)
            "
            @click="generateTeams"
            variant="primary"
            fontAwesomeIcon="people-group"
          >
            <!-- Texte réduit sur mobile -->
            <span class="hidden sm:md:inline">Générer équipes</span>
          </ButtonComponent>

          <!-- Bouton pour réinitialiser les équipes, visible uniquement si des équipes existent -->
          <ButtonComponent
            v-if="isEditable && teams.length > 0 && !isRegistrationActive"
            @click="openModalResetTeams"
            variant="danger"
            fontAwesomeIcon="trash"
          >
            <!-- Texte réduit sur mobile -->
            <span class="hidden sm:inline">Reset</span>
          </ButtonComponent>
        </div>
        <!-- Sélecteur de statut -->
        <StatusSelectorComponent
          :tourneyId="tourneyId"
          label="Inscriptions:"
          statusKey="registrationStatus"
          :statusOptions="registrationStatusOptions"
        />
      </div>

      <!-- Message d'erreur si teamSetup n'est pas configuré -->
      <ErrorMessageComponent
        v-if="!teamSetupConfigured"
        message="Aucune configuration d'équipe n'est définie. Veuillez cliquer sur 'Réglages' pour configurer les équipes."
      ></ErrorMessageComponent>

      <div v-if="teamSetupConfigured">
        <!-- Filtres et Informations -->
        <div
          class="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0"
        >
          <div class="flex items-center space-x-2 w-full md:w-auto">
            <!-- Filtres pour les équipes -->
            <FilterComponent
              :filters="filters"
              @filter-change="handleFilterChange"
            />
            <!-- Bouton pour Utilisateurs Non Assignés -->
            <ButtonComponent
              v-if="unassignedUsers.length > 0"
              @click="navigateToUnassignedUsers"
              variant="info"
              class="flex items-left space-x-2"
              fontAwesomeIcon="eye"
            >
              <span>Sans groupe ({{ unassignedUsers.length }})</span>
            </ButtonComponent>
          </div>
          <!-- Informations supplémentaires -->
          <div
            class="flex flex-wrap justify-end space-x-6 text-right w-full md:w-auto"
          >
            <div class="text-sm">
              <strong>Inscrits :</strong> {{ allUsers.length }}
            </div>
            <div class="text-sm">
              <strong>Groupes affichés :</strong> {{ filteredTeams.length }}
            </div>
            <div class="text-sm">
              <strong>Min. joueurs/groupe :</strong>
              {{ teamSetup.minPlayerPerTeam }}
            </div>
          </div>
        </div>

        <!-- Message selon le nombre d'utilisateurs -->
        <div class="mt-4">
          <div v-if="allUsers.length === 0">
            <span class="text-sm text-gray-600">
              Pas d'utilisateurs inscrits au tournoi.
            </span>
          </div>
          <div v-else>
            <span
              v-if="unassignedUsers.length === 0"
              class="text-sm text-gray-600"
            >
              Tous les utilisateurs inscrits sont dans des groupes.
            </span>
          </div>
        </div>

        <!-- Grille d'affichage des équipes -->
        <div
          class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4 mt-6"
        >
          <!-- Carte pour ajouter un nouveau groupe (affichée si isEditable) -->
          <CardAddComponent
            v-if="isEditable && teams.length < teamSetup.maxTeamNumber"
            title="Groupe"
            @openAddElementModal="openAddTeamModal"
          />

          <!-- Cartes des équipes existantes -->
          <CardEditComponent
            v-for="team in filteredTeams"
            :key="team.id"
            :title="team.teamName || 'Nom manquant'"
            :cornerCount="
              team.type === 'assistant'
                ? `${team.Users.length}`
                : `${team.Users.length}/${teamSetup.playerPerTeam}`
            "
            :titleColor="getStatusColor(team)"
            :hasActions="isEditable"
            :showDeleteButton="isEditable"
            :showEditButton="isEditable"
            @delete="confirmDeleteTeam(team.id)"
            @edit="editTeam(team)"
            @click="openTeamDetails(team)"
          >
            <!-- Liste des membres en deux colonnes -->
            <template #user-list>
              <ul class="grid grid-cols-2 gap-2 mt-2">
                <li
                  v-for="user in team.Users"
                  :key="user.id"
                  class="flex items-center text-sm text-light-form-text dark:text-dark-form-text truncate"
                >
                  <font-awesome-icon icon="user" class="mr-2 text-gray-500" />
                  <span class="truncate">{{ user.name }}</span>
                </li>
              </ul>
            </template>
          </CardEditComponent>
        </div>
      </div>

      <!-- Modale pour modifier teamSetup -->
      <ModalComponent
        v-if="isEditable"
        :isVisible="showTeamSetupModal"
        :title="
          teamSetup
            ? 'Modifier la configuration des équipes'
            : 'Configurer les équipes'
        "
        @close="closeTeamSetupModal"
      >
        <template #content>
          <!-- Formulaire de configuration des équipes -->
          <FormComponent
            v-model="localTeamSetup"
            :fields="teamSetupFields"
            :isEditing="!!teamSetup"
            @form-submit="handleTeamSetupSubmit"
            @cancel="closeTeamSetupModal"
          />
        </template>
      </ModalComponent>

      <!-- Modale pour ajouter/modifier une équipe -->
      <ModalComponent
        :isVisible="showModal"
        :title="
          editingTeamId ? 'Modifier le Groupe' : 'Ajouter un Nouveau Groupe'
        "
        @close="closeModal"
      >
        <template #content>
          <FormComponent
            v-model="newTeam"
            :fields="formFields"
            :isEditing="!!editingTeamId"
            @form-submit="handleFormSubmit"
            @cancel="closeModal"
          />
        </template>
      </ModalComponent>

      <!-- Confirmation de suppression -->
      <DeleteConfirmationModal
        :isVisible="showDeleteConfirmation"
        :isHardDelete="false"
        @cancel="closeDeleteConfirmation"
        @confirm="deleteTeam(confirmedDeleteTeamId)"
      />

      <!-- Modale pour confirmer le reset des teams (affichée si isEditable) -->
      <DeleteConfirmationModal
        v-if="isEditable"
        :isVisible="showModalResetTeams"
        @cancel="closeModalResetTeams"
        @confirm="handleResetAllTeamsSubmit"
        :isHardDelete="true"
        hardDeleteMessage="Tous les groupes seront supprimés et les utilisateurs n'auront plus de groupe (reset complet). Il ne sera pas possible de revenir en arrière. Êtes-vous sûr de vouloir continuer ?"
      />
    </div>
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import CardAddComponent from '@/components/CardAddComponent.vue';
  import CardEditComponent from '@/components/CardEditComponent.vue';
  import ModalComponent from '@/components/ModalComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import FormComponent from '@/components/FormComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';
  import TitleComponent from '@/components/TitleComponent.vue';
  import FilterComponent from '@/components/FilterComponent.vue';
  import ErrorMessageComponent from '@/components/ErrorMessageComponent.vue';
  import StatusSelectorComponent from '@/components/StatusSelectorComponent.vue';
  import { toast } from 'vue3-toastify';
  import { mapState } from 'vuex';

  export default {
    components: {
      ModalComponent,
      ButtonComponent,
      DeleteConfirmationModal,
      TourneySubMenu,
      CardAddComponent,
      CardEditComponent,
      FormComponent,
      FilterComponent,
      TitleComponent,
      ErrorMessageComponent,
      StatusSelectorComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.id, // Récupération du tourneyId depuis les params
        teams: [], // Liste des équipes
        unassignedUsers: [], // Utilisateurs non assignés
        allUsers: [], // Tous les utilisateurs inscrits (hors admin)
        showUnassignedModal: false,
        showModal: false,
        showDeleteConfirmation: false,
        localTeamSetup: {}, // Variable temporaire pour le modal
        showTeamSetupModal: false,
        showModalResetTeams: false,
        confirmedDeleteTeamId: null,
        newTeam: {
          teamName: '',
          type: 'player',
          tourneyId: this.$route.params.id,
        },
        editingTeamId: null,
        isSubmitting: false,
        teamSetupConfigured: false, // Vérifie si le teamSetup est configuré
        filters: [
          {
            label: 'Filtrer par statut',
            value: '',
            options: [
              { label: 'Tous les groupes', value: '' },
              { label: 'Équipes valides', value: 'valid' },
              { label: 'Partiel', value: 'partial' },
              { label: 'Vide', value: 'empty' },
            ],
          },
        ],
        teamSetup: null, // Initialisation à null
        teamSetupFields: [
          {
            name: 'maxTeamNumber',
            label: "Nombre maximum d'équipes",
            type: 'number',
            required: true,
          },
          {
            name: 'playerPerTeam',
            label: 'Nombre de joueurs par équipe',
            type: 'number',
            required: true,
          },
          {
            name: 'minPlayerPerTeam',
            label: 'Nombre minimum de joueurs par équipe',
            type: 'number',
            required: true,
          },
          {
            name: 'playerEstimated',
            label: 'Estimation des joueurs',
            type: 'number',
            required: false,
          },
        ],
        registrationStatusOptions: [
          { value: 'draft', label: 'Fermées' },
          { value: 'active', label: 'Ouvertes' },
          { value: 'completed', label: 'Terminées' },
        ],
      };
    },
    computed: {
      ...mapState('tourney', {
        statuses: (state) => state.statuses,
      }),
      isEditable() {
        return this.statuses.registrationStatus !== 'completed';
      },
      isRegistrationActive() {
        return this.statuses.registrationStatus === 'active';
      },
      filteredTeams() {
        if (!this.teamSetupConfigured) return [];

        return this.teams.filter((team) => {
          const minPlayers = this.teamSetup.minPlayerPerTeam;
          const maxPlayers = this.teamSetup.playerPerTeam;

          if (this.filters[0].value === 'valid') {
            return team.Users.length >= minPlayers; // Équipes valides
          }
          if (this.filters[0].value === 'partial') {
            return team.Users.length > 0 && team.Users.length < maxPlayers; // Partiellement remplies
          }
          if (this.filters[0].value === 'empty') {
            return team.Users.length === 0; // Équipes vides
          }
          return true;
        });
      },
      formFields() {
        return [
          {
            name: 'teamName',
            label: 'Nom du groupe',
            type: 'text',
            required: true,
          },
          {
            name: 'type',
            label: 'Type du groupe',
            type: 'select',
            options: [
              { label: 'Assistant', value: 'assistant' },
              { label: 'Player', value: 'player' },
            ],
            required: true,
          },
        ];
      },
    },
    methods: {
      // Nouvelle méthode pour récupérer toutes les données nécessaires en une seule requête
      async fetchTourneyDetails() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/teams-details`
          );
          const { teamSetup, teams, unassignedUsers, allUsers } = response.data;

          // Mise à jour de teamSetup et teamSetupConfigured
          if (
            teamSetup &&
            teamSetup.maxTeamNumber !== null &&
            teamSetup.playerPerTeam !== null &&
            teamSetup.minPlayerPerTeam !== null
          ) {
            this.teamSetup = teamSetup;
            this.teamSetupConfigured = true;
          } else {
            this.teamSetup = null;
            this.teamSetupConfigured = false;
          }

          // Mise à jour des équipes, des utilisateurs non assignés et de tous les utilisateurs
          this.teams = teams;
          this.unassignedUsers = unassignedUsers;
          this.allUsers = allUsers;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du tournoi:',
            error
          );
          toast.error('Erreur lors de la récupération des détails du tournoi.');
        }
      },
      async generateTeams() {
        try {
          await apiService.post(
            `/tourneys/${this.tourneyId}/teams/generate-teams`
          );
          toast.success(
            'Les équipes manquantes ont été générées avec succès !'
          );
          this.fetchTourneyDetails(); // Récupérer les données mises à jour
        } catch (error) {
          toast.error('Erreur lors de la génération des équipes.');
        }
      },
      async resetTeams() {
        try {
          await apiService.delete(`/tourneys/${this.tourneyId}/teams/reset`);
          toast.success('Les équipes ont été réinitialisées avec succès !');
          this.fetchTourneyDetails(); // Récupérer les données mises à jour
        } catch (error) {
          toast.error('Erreur lors de la réinitialisation des équipes.');
        }
      },
      handleFilterChange(filter) {
        this.filters[0].value = filter.value;
      },
      getStatusColor(team) {
        if (!this.teamSetupConfigured) return 'gray';

        const maxPlayers = this.teamSetup.playerPerTeam || team.maxPlayers;
        const minPlayers = this.teamSetup.minPlayerPerTeam;

        if (team.Users.length > maxPlayers) {
          return 'red'; // Erreur grave : trop de joueurs dans l'équipe
        } else if (team.type === 'assistant') {
          return 'purple'; // Assistant : équipe d'encadrement
        } else if (team.Users.length >= minPlayers) {
          return 'green'; // Valide : nombre de joueurs suffisant
        } else if (team.Users.length > 0) {
          return 'orange'; // Partiel : encore des places disponibles
        } else {
          return 'gray'; // Aucun joueur, pas de pastille
        }
      },
      navigateToUnassignedUsers() {
        this.$router.push(`/tourneys/${this.tourneyId}/unassigned-users`);
      },
      openAddTeamModal() {
        this.editingTeamId = null;
        this.newTeam = {
          teamName: '',
          type: 'player',
          tourneyId: this.tourneyId,
        };
        this.showModal = true;
      },
      editTeam(team) {
        this.editingTeamId = team.id;
        this.newTeam = { ...team };
        this.showModal = true;
      },
      openTeamDetails(team) {
        this.$router.push(`/tourneys/${this.tourneyId}/teams/${team.id}`);
      },
      confirmDeleteTeam(id) {
        this.confirmedDeleteTeamId = id;
        this.showDeleteConfirmation = true;
      },
      async deleteTeam(id) {
        try {
          await apiService.delete(`/tourneys/${this.tourneyId}/teams/${id}`);
          toast.success('Groupe supprimé avec succès !');
          this.fetchTourneyDetails(); // Récupérer les données mises à jour
          this.closeDeleteConfirmation();
        } catch (error) {
          toast.error('Erreur lors de la suppression du groupe.');
        }
      },
      openModalResetTeams() {
        this.showModalResetTeams = true;
      },
      closeModalResetTeams() {
        this.showModalResetTeams = false;
      },
      async handleResetAllTeamsSubmit() {
        await this.resetTeams();
        this.closeModalResetTeams();
      },
      async handleTeamSetupSubmit() {
        // Déterminer si c'est une mise à jour ou une création
        const isUpdate = this.teamSetupConfigured;

        // Préparer le payload en copiant les données locales
        const payload = { ...this.localTeamSetup };

        // Convertir les chaînes vides en null pour les champs optionnels
        if (
          payload.playerEstimated === '' ||
          payload.playerEstimated === undefined
        ) {
          payload.playerEstimated = null;
        } else {
          // S'assurer que c'est un nombre valide
          payload.playerEstimated = Number(payload.playerEstimated);
          if (isNaN(payload.playerEstimated)) {
            payload.playerEstimated = null;
          }
        }

        try {
          if (isUpdate) {
            // Mise à jour de la configuration existante
            await apiService.put(
              `/tourneys/${this.tourneyId}/team-setup`,
              payload
            );
          } else {
            // Création d'une nouvelle configuration
            await apiService.post(
              `/tourneys/${this.tourneyId}/team-setup`,
              payload
            );
          }

          // Mise à jour des données locales après succès
          if (isUpdate) {
            this.teamSetup = { ...payload };
          } else {
            this.teamSetup = { ...payload };
            this.teamSetupConfigured = true;
          }

          toast.success('Configuration des équipes enregistrée avec succès !');
          this.closeTeamSetupModal();
          this.fetchTourneyDetails(); // Récupérer les données mises à jour
        } catch (error) {
          console.error('Erreur lors de la configuration des équipes:', error);
          toast.error('Erreur lors de la configuration des équipes.');
        }
      },
      closeDeleteConfirmation() {
        this.showDeleteConfirmation = false;
        this.confirmedDeleteTeamId = null;
      },
      closeModal() {
        this.showModal = false;
        this.editingTeamId = null;
      },
      openTeamSetupModal() {
        // Initialiser localTeamSetup en fonction de la configuration existante
        if (this.teamSetupConfigured && this.teamSetup) {
          this.localTeamSetup = { ...this.teamSetup };
        } else {
          // Initialiser avec des valeurs par défaut ou vides
          this.localTeamSetup = {
            maxTeamNumber: 1,
            playerPerTeam: 1,
            minPlayerPerTeam: 1,
            playerEstimated: 1,
          };
        }
        this.showTeamSetupModal = true;
      },
      closeTeamSetupModal() {
        this.showTeamSetupModal = false;
      },
      async handleFormSubmit() {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        try {
          const payload = {
            teamName: this.newTeam.teamName,
            type: this.newTeam.type,
            tourneyId: this.tourneyId,
          };

          if (this.editingTeamId) {
            await apiService.put(
              `/tourneys/${this.tourneyId}/teams/${this.editingTeamId}`,
              payload
            );
          } else {
            await apiService.post(`/tourneys/${this.tourneyId}/teams`, payload);
          }

          toast.success(
            `Groupe ${this.editingTeamId ? 'modifié' : 'ajouté'} avec succès !`
          );
          this.fetchTourneyDetails(); // Récupérer les données mises à jour
        } catch (error) {
          console.error("Erreur lors de l'enregistrement du groupe:", error);
          toast.error("Erreur lors de l'enregistrement du groupe.");
        } finally {
          this.isSubmitting = false;
          this.closeModal();
        }
      },
    },
    mounted() {
      this.fetchTourneyDetails();
    },
  };
</script>

<style scoped>
  /* Géré par Tailwind */
</style>
