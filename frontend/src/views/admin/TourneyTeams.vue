<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <div class="p-6">
      <div class="flex items-center mb-8 justify-between">
        <div class="flex items-center">
          <!-- Titre -->
          <TitleComponent title="Gestion des Groupes" />

          <!-- Bouton Réglages -->
          <ButtonComponent
            fontAwesomeIcon="cog"
            class="ml-4 bg-gray-300 hover:bg-gray-400 text-gray-800"
            @click="openTeamSetupModal"
            variant="secondary"
          >
            <!-- Texte réduit sur mobile -->
            <span class="hidden sm:inline">Réglages</span>
          </ButtonComponent>
        </div>

        <!-- Boutons pour générer et réinitialiser les équipes -->
        <div class="flex items-center space-x-2">
          <!-- Bouton pour générer les équipes, visible uniquement si teamSetup existe et si le nombre max de groupes n'est pas atteint -->
          <ButtonComponent
            v-if="
              teamSetupConfigured && teams.length < teamSetup.maxTeamNumber + 1
            "
            @click="generateTeams"
            variant="primary"
            fontAwesomeIcon="people-group"
          >
            <!-- Texte réduit sur mobile -->
            <span class="hidden sm:inline">Générer les équipes</span>
          </ButtonComponent>

          <!-- Bouton pour réinitialiser les équipes, visible uniquement si des équipes existent -->
          <ButtonComponent
            v-if="teams.length > 0"
            @click="openModalResetTeams"
            variant="danger"
            fontAwesomeIcon="trash"
          >
            <!-- Texte réduit sur mobile -->
            <span class="hidden sm:inline">Reset les équipes</span>
          </ButtonComponent>
        </div>
      </div>

      <!-- Filtres pour les équipes -->
      <FilterComponent :filters="filters" @filter-change="handleFilterChange" />

      <!-- Carte pour les utilisateurs non assignés, uniquement visible s'il y a des utilisateurs non assignés -->
      <CardEditComponent
        v-if="unassignedUsers.length > 0"
        title="Utilisateurs Non Assignés"
        :description="`${unassignedUsers.length} invités`"
        :cornerCount="`${unassignedUsers.length}`"
        :hasActions="false"
        @click="openUnassignedModal"
      />

      <span v-else class="text-sm">
        Tous les utilisateurs inscrits sont dans des groupes.
      </span>

      <!-- Grille d'affichage des équipes -->
      <div
        class="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4 mt-6"
      >
        <!-- Carte pour ajouter un nouveau groupe -->
        <CardAddComponent
          title="Groupe"
          v-if="teams.length < teamSetup.maxTeamNumber"
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
          :hasActions="true"
          :showDeleteButton="true"
          :showEditButton="true"
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

      <!-- Modale pour modifier teamSetup -->
      <ModalComponent
        :isVisible="showTeamSetupModal"
        title="Configuration des équipes"
      >
        <template #content>
          <!-- Formulaire de configuration des équipes -->
          <FormComponent
            v-model="localTeamSetup"
            :fields="teamSetupFields"
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

      <!-- Modale pour confirmer le reset des teams -->
      <DeleteConfirmationModal
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
  import { toast } from 'vue3-toastify';

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
    },
    data() {
      return {
        tourneyId: this.$route.params.id, // Récupération du tourneyId depuis les params
        teams: [], // Liste des équipes
        unassignedUsers: [], // utilisateurs non assignés
        showUnassignedModal: false,
        showModal: false,
        showDeleteConfirmation: false,
        localTeamSetup: {}, // Variable temporaire pour le modal
        showTeamSetupModal: false,
        showModalResetTeams: false,
        confirmedDeleteTeamId: null,
        newTeam: {
          name: '',
          description: '',
          tourneyId: this.tourneyId,
        },
        editingTeamId: null,
        isSubmitting: false,
        teamSetupConfigured: false, // Vérifie si le teamSetup est configuré
        filters: [
          {
            label: 'Filtrer par statut',
            value: '',
            options: [
              { label: 'Tous les statuts', value: '' },
              { label: 'Équipes valides', value: 'valid' },
              { label: 'Partiel', value: 'partial' },
              { label: 'Vide', value: 'empty' },
            ],
          },
        ],
        teamSetup: {
          maxTeamNumber: 5,
          playerPerTeam: 4,
          minPlayerPerTeam: 3,
          playerEstimated: 20,
        },
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
      };
    },
    computed: {
      filteredTeams() {
        return this.teams.filter((team) => {
          const minPlayers = this.teamSetup.minPlayerPerTeam;
          const maxPlayers = this.teamSetup.playerPerTeam || team.maxPlayers;

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
      async fetchTeams() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/teams`
          );
          const unassignedResponse = await apiService.get(
            `/tourneys/${this.tourneyId}/users/unassigned-users`
          );
          this.unassignedUsers = unassignedResponse.data;
          this.teams = response.data;
        } catch (error) {
          console.error('Erreur lors de la récupération des données:', error);
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
          this.fetchTeams();
        } catch (error) {
          toast.error('Erreur lors de la génération des équipes.');
        }
      },
      async resetTeams() {
        try {
          await apiService.delete(`/tourneys/${this.tourneyId}/teams/reset`);
          toast.success('Les équipes ont été réinitialisées avec succès !');
          this.fetchTeams();
        } catch (error) {
          toast.error('Erreur lors de la réinitialisation des équipes.');
        }
      },
      handleFilterChange(filter) {
        this.filters[0].value = filter.value;
      },
      getStatusColor(team) {
        const maxPlayers = this.teamSetup.playerPerTeam || team.maxPlayers;
        const minPlayers = this.teamSetup.minPlayerPerTeam;

        if (team.Users.length > maxPlayers) {
          return 'red'; // Erreur grave : trop de joueurs dans l'équipe
        } else if (team.type == 'assistant') {
          return 'purple'; // Assistant : équipe d'encadrement
        } else if (team.Users.length >= minPlayers) {
          return 'green'; // Valide : nombre de joueurs suffisant
        } else if (team.Users.length > 0) {
          return 'orange'; // Partiel : encore des places disponibles
        } else {
          return 'gray'; // Aucun joueur, pas de pastille
        }
      },
      openUnassignedModal() {
        this.showUnassignedModal = true;
      },
      closeUnassignedModal() {
        this.showUnassignedModal = false;
      },
      closeModalResetTeams() {
        this.showModalResetTeams = false;
      },
      openModalResetTeams() {
        this.showModalResetTeams = true;
      },
      async handleResetAllTeamsSubmit() {
        await this.resetTeams();
        this.closeModalResetTeams();
      },

      async handleTeamSetupSubmit() {
        // Appliquer les modifications de localTeamSetup à teamSetup
        this.teamSetup = { ...this.localTeamSetup };

        // Appeler l'API pour sauvegarder les données
        try {
          await apiService.put(
            `/tourneys/${this.tourneyId}/team-setup`,
            this.teamSetup
          );
          toast.success('Configuration des équipes enregistrée avec succès !');
          this.closeTeamSetupModal();
        } catch (error) {
          toast.error('Erreur lors de la configuration des équipes.');
        }
      },
      openAddTeamModal() {
        this.editingTeamId = null;
        this.newTeam = {
          name: '',
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
      openTeamSetupModal() {
        this.localTeamSetup = { ...this.teamSetup };
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
            apiService.put(
              `/tourneys/${this.tourneyId}/teams/${this.editingTeamId}`,
              payload
            );
          } else {
            apiService.post(`/tourneys/${this.tourneyId}/teams`, payload);
          }

          toast.success(
            `Groupe ${this.editingTeamId ? 'modifié' : 'ajouté'} avec succès !`
          );
          this.fetchTeams();
        } catch (error) {
          toast.error("Erreur lors de l'enregistrement du groupe.");
        } finally {
          this.isSubmitting = false;
          this.closeModal();
          this.fetchTeams();
        }
      },
      confirmDeleteTeam(id) {
        this.confirmedDeleteTeamId = id;
        this.showDeleteConfirmation = true;
      },
      closeDeleteConfirmation() {
        this.showDeleteConfirmation = false;
        this.confirmedDeleteTeamId = null;
      },
      async deleteTeam(id) {
        try {
          await apiService.delete(`/tourneys/${this.tourneyId}/teams/${id}`);
          toast.success('Groupe supprimé avec succès !');
          this.fetchTeams();
          this.closeDeleteConfirmation();
        } catch (error) {
          toast.error('Erreur lors de la suppression du groupe.');
        }
      },
      openTeamDetails(team) {
        this.$router.push(`/tourneys/${this.tourneyId}/teams/${team.id}`);
      },
      closeModal() {
        this.showModal = false;
      },
    },
    mounted() {
      this.fetchTeams();
      this.teamSetupConfigured = true; // Remplacer par une vérification réelle de la config
    },
  };
</script>

<style scoped>
  /* Géré par Tailwind */
</style>
