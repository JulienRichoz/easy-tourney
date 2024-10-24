<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <div class="p-6">
      <div class="flex items-center mb-8 justify-between">
        <div class="flex items-center">
          <!-- Titre -->
          <TitleComponent title="Gestion des Groupes" />

          <!-- Icône de roue dentée pour ouvrir les paramètres du teamSetup -->
          <button @click="openTeamSetupModal" class="ml-4">
            <font-awesome-icon
              :icon="['fas', 'cog']"
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            />
          </button>
        </div>

        <!-- Bouton pour générer les équipes, visible uniquement si teamSetup existe -->
        <ButtonComponent
          v-if="teamSetupConfigured"
          @click="generateTeams"
          variant="primary"
        >
          Générer les équipes
        </ButtonComponent>

        <!-- Bouton pour réinitialiser les équipes, visible uniquement si des équipes existent -->
        <ButtonComponent
          v-if="teams.length > 0"
          @click="resetTeams"
          variant="danger"
        >
          Réinitialiser les équipes
        </ButtonComponent>
      </div>

      <!-- Filtres pour les équipes -->
      <FilterComponent :filters="filters" @filter-change="handleFilterChange" />

      <!-- Affichage des équipes -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6"
      >
        <!-- Carte pour ajouter un nouveau groupe -->
        <CardAddComponent
          title="Groupe"
          @openAddElementModal="openAddTeamModal"
        />

        <!-- Cartes des équipes existantes -->
        <CardEditComponent
          v-for="team in filteredTeams"
          :key="team.id"
          :title="team.teamName || 'Nom manquant'"
          :description="getTeamStatus(team)"
          :hasActions="true"
          :showDeleteButton="true"
          :showEditButton="true"
          @delete="confirmDeleteTeam(team.id)"
          @edit="editTeam(team)"
          @click="openTeamDetails(team)"
        />
      </div>

      <!-- Modale pour modifier teamSetup -->
      <ModalComponent
        :isVisible="showTeamSetupModal"
        title="Configuration des équipes"
        @close="closeTeamSetupModal"
      >
        <template #content>
          <!-- Formulaire de configuration des équipes -->
          <FormComponent
            v-model="teamSetup"
            :fields="teamSetupFields"
            @form-submit="handleTeamSetupSubmit"
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
        @cancel="closeDeleteConfirmation"
        @confirm="deleteTeam(confirmedDeleteTeamId)"
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

  import { faCog } from '@fortawesome/free-solid-svg-icons';
  import { library } from '@fortawesome/fontawesome-svg-core';
  library.add(faCog);

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
        showModal: false,
        showDeleteConfirmation: false,
        showTeamSetupModal: false,
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
              { label: 'Plein', value: 'full' },
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
          if (this.filters[0].value === 'full') return team.isFull;
          if (this.filters[0].value === 'partial')
            return !team.isFull && team.players.length > 0;
          if (this.filters[0].value === 'empty')
            return team.players.length === 0;
          return true;
        });
      },
      formFields() {
        return [
          {
            name: 'name',
            label: 'Nom du groupe',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            label: 'Description du groupe',
            type: 'textarea',
            required: false,
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
          this.teams = response.data;
        } catch (error) {
          console.error('Erreur lors de la récupération des groupes:', error);
        }
      },
      async generateTeams() {
        try {
          await apiService.post(
            `/tourneys/${this.tourneyId}/teams/generate-teams`
          );
          toast.success('Les équipes ont été générées avec succès !');
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
        // Mettre à jour les filtres sélectionnés
        this.filters[0].value = filter.value;
      },
      async handleTeamSetupSubmit() {
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
          description: '',
          tourneyId: this.tourneyId,
        };
        this.showModal = true;
      },
      editTeam(team) {
        this.editingTeamId = team.id;
        this.newTeam = { ...team };
        this.showModal = true;
      },
      // Ouvre le modal de configuration du teamSetup
      openTeamSetupModal() {
        this.showTeamSetupModal = true;
      },
      // Ferme le modal de configuration
      closeTeamSetupModal() {
        this.showTeamSetupModal = false;
      },
      async handleFormSubmit() {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        try {
          if (this.editingTeamId) {
            await apiService.put(
              `/tourneys/${this.tourneyId}/teams/${this.editingTeamId}`,
              this.newTeam
            );
            toast.success('Groupe modifié avec succès !');
          } else {
            await apiService.post(
              `/tourneys/${this.tourneyId}/teams`,
              this.newTeam
            );
            toast.success('Nouveau groupe ajouté avec succès !');
          }
          this.closeModal();
          this.fetchTeams();
        } catch (error) {
          toast.error("Erreur lors de l'enregistrement du groupe.");
        } finally {
          this.isSubmitting = false;
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
      getTeamStatus(team) {
        if (!team || typeof team !== 'object') {
          return 'Erreur de données';
        }

        // Vérifie si 'players' est un tableau
        if (!Array.isArray(team.players)) {
          return 'Aucun joueur associé';
        }

        if (team.isFull) {
          return 'Complet';
        }

        if (team.players.length === 0) {
          return 'Vide';
        }

        return `Partiel (${team.players.length}/${team.maxPlayers || 0})`;
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
