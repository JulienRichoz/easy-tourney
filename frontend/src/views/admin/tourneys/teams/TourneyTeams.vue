<!-- TourneyTeams.vue -->
<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <div class="p-6">
      <div class="flex items-center mb-8 justify-between">
        <div class="flex items-center">
          <TitleComponent title="Gestion des équipes"></TitleComponent>
          <!-- Bouton Réglages -->
          <ButtonComponent
            v-if="!isRegistrationActive && isEditable"
            fontAwesomeIcon="cog"
            @click="openTeamSetupModal"
            variant="secondary"
          >
            <span class="hidden sm:md:inline">Config Equipes</span>
          </ButtonComponent>

          <!-- Bouton pour générer les équipes, visible uniquement si teamSetup existe et si le nombre max d'équipe n'est pas atteint -->
          <ButtonComponent
            v-if="
              !isRegistrationActive &&
              isEditable &&
              teamSetupConfigured &&
              playerTeams.length < teamSetup.maxTeamNumber
            "
            @click="openGenerateConfirmationModal"
            variant="algo"
            fontAwesomeIcon="people-group"
            class="ml-2"
          >
            <span class="hidden sm:md:inline">Générer équipes</span>
          </ButtonComponent>
        </div>

        <!-- Affichage Reset/InvitationLink/Status -->
        <div class="flex items-center ml-auto">
          <!-- Sélecteur de statut et bouton Reset -->
          <ButtonComponent
            v-if="isEditable && playerTeams.length > 0 && !isRegistrationActive"
            @click="openModalResetTeams"
            variant="danger"
            fontAwesomeIcon="trash"
          >
            <span class="hidden sm:inline mr-auto">Toutes les équipes</span>
          </ButtonComponent>

          <!-- Champ pour afficher le lien d'invitation et bouton pour le générer -->
          <div
            v-if="isRegistrationActive"
            class="flex items-center space-x-2 ml-4"
          >
            <ButtonComponent
              @click="openInviteTokenModal"
              variant="success"
              fontAwesomeIcon="link"
            >
              Lien d'invitation
            </ButtonComponent>
          </div>
          <ModalComponent
            :isVisible="showInviteTokenModal"
            title="Gestion des liens d'invitation"
            @close="closeInviteTokenModal"
          >
            <template #content>
              <div class="flex justify-between items-center mb-4">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    v-model="showValidOnly"
                    class="form-checkbox"
                  />
                  <span class="ml-2">Afficher liens valides</span>
                </label>
                <ButtonComponent
                  @click="showAddTokenForm = !showAddTokenForm"
                  variant="primary"
                  fontAwesomeIcon="plus"
                >
                  Générer un lien
                </ButtonComponent>
              </div>
              <div v-if="showAddTokenForm" class="mb-4">
                <FormComponent
                  v-model="inviteTokenForm"
                  :fields="inviteTokenFields"
                  @form-submit="handleGenerateInviteToken"
                  @cancel="showAddTokenForm = false"
                />
              </div>

              <ul class="space-y-2">
                <li
                  v-for="token in filteredSortedInviteTokens"
                  :key="token.id"
                  class="p-4 border rounded-md flex justify-between items-center"
                  :class="{
                    'bg-green-100':
                      token.isValid && new Date(token.expiresAt) > new Date(),
                    'bg-orange-100':
                      token.isValid &&
                      new Date(token.expiresAt) <=
                        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                    'bg-red-100':
                      !token.isValid || new Date(token.expiresAt) <= new Date(),
                  }"
                >
                  <div class="flex-1">
                    <label class="font-semibold">Lien d'invitation :</label>
                    <font-awesome-icon
                      icon="copy"
                      class="ml-2 cursor-pointer text-gray-600 hover:text-gray-800"
                      @click="copyToClipboard(token.token)"
                      title="Copier le lien"
                    />
                    <div class="flex items-center">
                      <input
                        type="text"
                        :value="`${BASE_URL}/register?inviteToken=${token.token}`"
                        readonly
                        class="w-full p-1 border rounded-md overflow-x-auto"
                        style="max-width: 100%"
                      />
                    </div>
                    <p>
                      Expire le :
                      {{ new Date(token.expiresAt).toLocaleDateString() }}
                    </p>
                    <p>
                      Statut :
                      <span
                        :class="{
                          'text-green-600': token.isValid,
                          'text-red-600': !token.isValid,
                        }"
                      >
                        {{ token.isValid ? 'Valide' : 'Invalide' }}
                      </span>
                    </p>
                  </div>
                  <div class="flex flex-col items-end">
                    <ButtonComponent
                      v-if="token.isValid"
                      @click="invalidateToken(token.id)"
                      variant="danger"
                    >
                      Invalider
                    </ButtonComponent>
                    <ButtonComponent
                      v-else
                      @click="validateToken(token.id)"
                      variant="success"
                    >
                      Valider
                    </ButtonComponent>
                  </div>
                </li>
              </ul>
            </template>
            <template #footer>
              <div class="flex mt-4">
                <ButtonComponent
                  @click="closeInviteTokenModal"
                  variant="secondary"
                >
                  Fermer
                </ButtonComponent>
              </div>
            </template>
          </ModalComponent>

          <!-- Sélecteur de statut pour les inscriptions -->
          <StatusSelectorComponent
            :tourneyId="tourneyId"
            label="Inscriptions:"
            statusKey="registrationStatus"
            :statusOptions="registrationStatusOptions"
          />
        </div>
      </div>

      <!-- Message d'erreur si teamSetup n'est pas configuré -->
      <ErrorMessageComponent
        v-if="!teamSetupConfigured"
        message="Aucune configuration d'équipe n'est définie. Veuillez cliquer sur 'Réglages' pour configurer les équipes."
      ></ErrorMessageComponent>

      <!-- Message informant de la nécessité de créer des équipes "player" si aucune n'existe -->
      <div v-if="teamSetupConfigured && playerTeams.length === 0" class="mt-4">
        <ErrorMessageComponent
          class="text-sm"
          message="Aucune équipe n'a été créée. Veuillez créer des équipes pour assigner les utilisateurs."
        ></ErrorMessageComponent>
      </div>

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
            <!--Filtres pour chercher par nom -->
            <div v-if="allDisplayedTeams.length > 0">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Rechercher par nom ou mail"
                class="border border-light-form-border dark:border-dark-form-border rounded-md p-2 w-full sm:w-64 bg-light-form-background dark:bg-dark-form-background text-light-form-text dark:text-dark-form-text"
              />
            </div>
            <!-- Bouton pour Utilisateurs Non Assignés -->
            <ButtonComponent
              v-if="unassignedUsers.length > 0"
              @click="navigateToUnassignedUsers"
              variant="primary"
              class="flex items-left space-x-2"
              fontAwesomeIcon="user"
            >
              <span>Joueurs sans groupe ({{ unassignedUsers.length }})</span>
            </ButtonComponent>
            <!-- Bouton Envoyer Email -->
            <ButtonComponent
              v-if="allUsers.length > 0"
              variant="info"
              fontAwesomeIcon="envelope"
              @click="sendEmailToAll"
              :disabled="allUsers.length === 0"
            >
              <span class="hidden sm:inline"></span>
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
              <strong>Equipes affichées :</strong>
              {{ allDisplayedTeams.length }}
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
              Tous les utilisateurs inscrits sont dans des équipes.
            </span>
          </div>
        </div>

        <!-- Grille d'affichage des équipes -->
        <div
          class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4 mt-6"
        >
          <!-- Carte pour ajouter une nouvelle équipe (affichée si isEditable) -->
          <CardAddComponent
            v-if="isEditable && playerTeams.length < teamSetup.maxTeamNumber"
            title="Equipe"
            @openAddElementModal="openAddTeamModal"
          />

          <!-- Cartes des équipes existantes -->
          <CardEditComponent
            v-for="team in allDisplayedTeams"
            :key="team.id"
            :title="team.teamName || 'Nom manquant'"
            :cornerCount="
              team.type === 'assistant'
                ? `${team.usersTourneys.length}`
                : `${team.usersTourneys.length}/${teamSetup.playerPerTeam}`
            "
            :titleColor="getStatusColor(team)"
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
            :customValidation="customTeamSetupValidation"
          />
        </template>
      </ModalComponent>

      <!-- Modale pour ajouter/modifier une équipe -->
      <ModalComponent
        :isVisible="showModal"
        :title="
          editingTeamId ? 'Modifier équipe' : 'Ajouter une nouvelle équipe'
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

      <!-- Modale de confirmation pour générer les équipes -->
      <ConfirmationModal
        :isVisible="showGenerateConfirmationModal"
        title="Confirmer la Génération des Équipes"
        message="Êtes-vous sûr de vouloir générer les équipes automatiquement ?"
        @cancel="closeGenerateConfirmationModal"
        @confirm="confirmGenerateTeams"
      />

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
        hardDeleteMessage="Toutes les équipes seront supprimées et les utilisateurs n'auront plus d'équipe (reset complet). Il ne sera pas possible de revenir en arrière. Êtes-vous sûr de vouloir continuer ?"
      />
    </div>
  </div>
</template>

<script>
  import { mapState, mapActions } from 'vuex';
  import apiService, { BASE_URL } from '@/services/apiService';
  import CardAddComponent from '@/components/CardAddComponent.vue';
  import CardEditComponent from '@/components/CardEditComponent.vue';
  import ModalComponent from '@/components/ModalComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import FormComponent from '@/components/FormComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import ConfirmationModal from '@/components/ConfirmationModal.vue';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';
  import TitleComponent from '@/components/TitleComponent.vue';
  import FilterComponent from '@/components/FilterComponent.vue';
  import ErrorMessageComponent from '@/components/ErrorMessageComponent.vue';
  import StatusSelectorComponent from '@/components/StatusSelectorComponent.vue';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      ModalComponent,
      ButtonComponent,
      DeleteConfirmationModal,
      ConfirmationModal,
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
        BASE_URL,
        tourneyId: this.$route.params.tourneyId, // Récupération du tourneyId depuis les params
        teams: [], // Liste des équipes
        unassignedUsers: [], // Utilisateurs non assignés
        allUsers: [], // Tous les utilisateurs inscrits (hors admin)
        inviteLink: '', // Stocke le lien d'invitation
        showUnassignedModal: false,
        showModal: false,
        showDeleteConfirmation: false,
        showGenerateConfirmationModal: false, // Ajouté
        showTeamSetupModal: false,
        showModalResetTeams: false,
        confirmedDeleteTeamId: null,
        newTeam: {
          teamName: '',
          type: 'player',
          tourneyId: this.$route.params.tourneyId,
        },
        editingTeamId: null,
        isSubmitting: false,
        teamSetupConfigured: false,
        filters: [
          {
            label: 'Equipes',
            value: '',
            options: [
              { label: 'Toutes les équipes', value: '' },
              { label: 'Valides', value: 'valid' },
              { label: 'Invalides', value: 'partial' },
              { label: 'Vide', value: 'empty' },
            ],
          },
        ],
        teamSetup: null,
        localTeamSetup: null,
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
        ],
        registrationStatusOptions: [
          { value: 'draft', label: 'Fermées' },
          { value: 'active', label: 'Ouvertes' },
          { value: 'completed', label: 'Terminées' },
        ],
        // TOKEN INVITSATION
        showInviteTokenModal: false,
        inviteTokens: [], // Liste des tokens récupérés
        showValidOnly: true, // Pour filtrer uniquement les tokens valides
        showAddTokenForm: false,
        inviteTokenForm: {
          expiresInDays: 7, // Durée par défaut en jours
        },
        inviteTokenFields: [
          {
            name: 'expiresInDays',
            label: 'Durée de validité (jours)',
            type: 'number',
            required: true,
            min: 1, // Valeur minimale
          },
        ],
        searchQuery: '',
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
      // Sépare les équipes "player"
      playerTeams() {
        return this.teams.filter((team) => team.type === 'player');
      },
      // Sépare les équipes "assistant"
      assistantTeams() {
        return this.teams.filter((team) => team.type === 'assistant');
      },
      // Filtre les équipes "player" selon les critères
      filteredPlayerTeams() {
        if (!this.teamSetupConfigured) return [];

        let filteredTeams = this.playerTeams.filter((team) => {
          const minPlayers = this.teamSetup.minPlayerPerTeam;

          if (this.filters[0].value === 'valid') {
            return team.usersTourneys.length >= minPlayers;
          }
          if (this.filters[0].value === 'partial') {
            return (
              team.usersTourneys.length > 0 &&
              team.usersTourneys.length < minPlayers
            );
          }
          if (this.filters[0].value === 'empty') {
            return team.usersTourneys.length === 0;
          }
          return true;
        });

        // Appliquer le filtre de recherche par nom de joueur
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          filteredTeams = filteredTeams.filter((team) =>
            team.usersTourneys.some(
              (userTourney) =>
                userTourney.user.name.toLowerCase().includes(query) ||
                (userTourney.user.email &&
                  userTourney.user.email.toLowerCase().includes(query))
            )
          );
        }

        return filteredTeams;
      },

      // Combine les équipes "player" filtrées et les équipes "assistant"
      allDisplayedTeams() {
        return [...this.assistantTeams, ...this.filteredPlayerTeams];
      },
      formFields() {
        return [
          {
            name: 'teamName',
            label: "Nom de l'équipe",
            type: 'text',
            required: true,
          },
          {
            name: 'type',
            label: "Type d'équipe",
            type: 'select',
            options: [
              { label: 'Assistant', value: 'assistant' },
              { label: 'Player', value: 'player' },
            ],
            required: true,
          },
        ];
      },
      filteredSortedInviteTokens() {
        let tokens = this.inviteTokens;

        // Filtrer les tokens si l'option est cochée
        if (this.showValidOnly) {
          tokens = tokens.filter(
            (t) => t.isValid && new Date(t.expiresAt) > new Date()
          );
        }

        // Trier les tokens : valides en premier
        return tokens.sort((a, b) => {
          const aValid = a.isValid && new Date(a.expiresAt) > new Date();
          const bValid = b.isValid && new Date(b.expiresAt) > new Date();
          return bValid - aValid;
        });
      },
    },
    methods: {
      // Mapper les actions du module `tourney`
      ...mapActions('tourney', [
        'fetchTourneyStatuses',
        'setTournamentName',
        'clearTournamentName',
      ]),
      // Méthode pour récupérer toutes les données nécessaires en une seule requête
      async fetchTourneyDetails() {
        try {
          this.fetchTourneyStatuses(this.tourneyId);
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

      /*
       * GESTION TOKEN INVITATION
       */

      openInviteTokenModal() {
        this.showInviteTokenModal = true;
      },
      closeInviteTokenModal() {
        this.showInviteTokenModal = false;
        this.showAddTokenForm = false; // Réinitialiser le formulaire
      },
      async handleGenerateInviteToken() {
        try {
          const response = await apiService.post(
            `/tourneys/${this.tourneyId}/invite-token`,
            {
              expiresInDays: this.inviteTokenForm.expiresInDays,
            }
          );
          this.inviteLink = `${BASE_URL}/register?inviteToken=${response.data.token}`;
          toast.success("Lien d'invitation généré avec succès !");
          this.showAddTokenForm = false;
          this.inviteTokenForm.expiresInDays = 7; // Réinitialiser le formulaire
          this.fetchInviteTokens(); // Récupère les tokens après la création
        } catch (error) {
          console.error('Erreur lors de la génération du token:', error);
          toast.error('Erreur lors de la génération du token.');
        }
      },

      async invalidateToken(tokenId) {
        try {
          await apiService.patch(
            `/tourneys/${this.tourneyId}/invite-token/${tokenId}/invalidate`
          );
          toast.success('Token invalidé avec succès.');
          this.fetchInviteTokens(); // Actualiser la liste
        } catch (error) {
          console.error("Erreur lors de l'invalidation du token:", error);
          toast.error("Erreur lors de l'invalidation du token.");
        }
      },
      async validateToken(tokenId) {
        try {
          await apiService.patch(
            `/tourneys/${this.tourneyId}/invite-token/${tokenId}/validate`
          );
          toast.success('Token validé avec succès.');
          this.fetchInviteTokens(); // Actualiser la liste
        } catch (error) {
          console.error('Erreur lors de la validation du token:', error);
          toast.error('Erreur lors de la validation du token.');
        }
      },

      async fetchInviteTokens() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/invite-token`
          );
          this.inviteTokens = response.data.inviteTokens;
        } catch (error) {
          console.error('Erreur lors de la récupération des tokens:', error);
          toast.error('Erreur lors de la récupération des tokens.');
        }
      },
      copyToClipboard(token) {
        navigator.clipboard.writeText(
          `${BASE_URL}/register?inviteToken=${token}`
        );
        toast.success('Lien copié dans le presse-papiers !');
      },
      toggleValidOnly() {
        this.showValidOnly = !this.showValidOnly;
      },

      /**
       *  GESTION DES FILTRES ET EQUIPES
       **/
      handleFilterChange(filter) {
        this.filters[0].value = filter.value;
      },
      getStatusColor(team) {
        if (!this.teamSetupConfigured) return 'gray';

        const maxPlayers = this.teamSetup.playerPerTeam || team.maxPlayers;
        const minPlayers = this.teamSetup.minPlayerPerTeam;

        if (
          team.usersTourneys.length > maxPlayers &&
          team.type !== 'assistant'
        ) {
          return 'red'; // Erreur grave : trop de joueurs dans l'équipe
        } else if (team.type === 'assistant') {
          return 'purple'; // Assistant : équipe d'encadrement
        } else if (team.usersTourneys.length >= minPlayers) {
          return 'green'; // Valide : nombre de joueurs suffisant
        } else if (team.usersTourneys.length > 0) {
          return 'orange'; // Partiel : encore des places disponibles
        } else {
          return 'gray'; // Aucun joueur, pas de pastille
        }
      },
      navigateToUnassignedUsers() {
        this.$router.push(`/admin/tourneys/${this.tourneyId}/unassigned-users`);
      },

      /*
       * GESTION DES POP UP
       */
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
        this.$router.push(
          `/admin/tourneys/${this.tourneyId}/teams/${team.id}/users`
        );
      },
      confirmDeleteTeam(id) {
        this.confirmedDeleteTeamId = id;
        this.showDeleteConfirmation = true;
      },
      async deleteTeam(id) {
        try {
          await apiService.delete(`/tourneys/${this.tourneyId}/teams/${id}`);
          toast.success('Equipe supprimée avec succès !');
          this.fetchTourneyDetails(); // Récupérer les données mises à jour
          this.closeDeleteConfirmation();
        } catch (error) {
          toast.error("Erreur lors de la suppression de l'équipe.");
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
      /**
       * Fonction de validation personnalisée pour le formulaire de configuration des équipes.
       * Vérifie que minPlayerPerTeam <= playerPerTeam.
       * @returns {Object} Un objet contenant les messages d'erreur.
       */
      customTeamSetupValidation() {
        const errors = {};

        const { minPlayerPerTeam, playerPerTeam } = this.localTeamSetup;

        // Vérifie si les champs sont présents et sont des nombres
        if (
          typeof minPlayerPerTeam === 'number' &&
          typeof playerPerTeam === 'number'
        ) {
          if (minPlayerPerTeam > playerPerTeam) {
            errors.minPlayerPerTeam =
              'Le nombre minimum de joueurs par équipe doit être inférieur ou égal au nombre de joueurs par équipe.';
          }
        } else {
          // Gestion des cas où les champs ne sont pas des nombres
          if (minPlayerPerTeam > playerPerTeam) {
            errors.minPlayerPerTeam =
              'Veuillez entrer des nombres valides pour les joueurs par équipe.';
          }
        }

        return errors;
      },
      /**
       * Méthode appelée lors de la soumission du formulaire de configuration des équipes.
       * Supposée être appelée uniquement si le formulaire est valide.
       */
      async handleTeamSetupSubmit() {
        // Déterminer si c'est une mise à jour ou une création
        const isUpdate = this.teamSetupConfigured;

        // Préparer le payload en copiant les données locales
        const payload = { ...this.localTeamSetup };

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
          this.teamSetup = { ...payload };
          this.teamSetupConfigured = true;

          toast.success('Configuration des équipes enregistrée avec succès !');
          this.closeTeamSetupModal();
          this.fetchTourneyDetails(); // Récupérer les données mises à jour
        } catch (error) {
          console.error('Erreur lors de la configuration des équipes:', error);
          toast.error('Erreur lors de la configuration des équipes.');
        }
      },
      /**
       * Envoie un email à tous les utilisateurs inscrits.
       */
      sendEmailToAll() {
        console.log(this.allUsers);
        const emails = this.allUsers
          .map((userTourney) => userTourney.user.email)
          .filter((email) => email);
        if (emails.length === 0) {
          toast.error("Il n'y a aucun utilisateur pour envoyer un email.");
          return;
        }
        const mailtoLink = `mailto:${emails.join(',')}`;
        window.location.href = mailtoLink;
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
            `Equipe ${
              this.editingTeamId ? 'modifiée' : 'ajoutée'
            } avec succès !`
          );
          this.fetchTourneyDetails(); // Récupérer les données mises à jour
        } catch (error) {
          console.error("Erreur lors de l'enregistrement de l'équipe:", error);
          toast.error("Erreur lors de l'enregistrement de l'équipe.");
        } finally {
          this.isSubmitting = false;
          this.closeModal();
        }
      },
      openGenerateConfirmationModal() {
        this.showGenerateConfirmationModal = true;
      },
      closeGenerateConfirmationModal() {
        this.showGenerateConfirmationModal = false;
      },
      async confirmGenerateTeams() {
        this.showGenerateConfirmationModal = false;
        await this.generateTeams();
      },
    },
    mounted() {
      this.fetchTourneyDetails();
      this.fetchInviteTokens();
    },
  };
</script>

<style scoped>
  /* Géré par Tailwind */
</style>
