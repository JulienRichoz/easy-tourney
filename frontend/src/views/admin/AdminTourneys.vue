<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold ml-4">Gestion des Tournois</h1>
      <!-- Filtres des tournois -->
      <div class="flex flex-col md:flex-row items-center">
        <div class="mb-4 md:mb-0 md:mr-4">
          <span class="text-gray-700 font-semibold mr-2"
            >Filtrer par statut:</span
          >
          <select
            v-model="filterStatus"
            class="p-2 border border-gray-300 rounded-md"
          >
            <option value="">Tous les statuts</option>
            <option value="draft">Draft</option>
            <option value="ready">Prêt</option>
            <option value="active">Actif</option>
            <option value="completed">Terminé</option>
          </select>
        </div>
        <div>
          <span class="text-gray-700 font-semibold mr-2"
            >Filtrer par date:</span
          >
          <select
            v-model="filterDate"
            class="p-2 border border-gray-300 rounded-md"
          >
            <option value="">Toutes les dates</option>
            <option value="upcoming">À venir</option>
            <option value="past">Passés</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Grille des tournois -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      <!-- Carte pour ajouter un nouveau tournoi -->
      <CardAddComponent
        title="Tournoi"
        @openAddElementModal="openAddTourneyModal"
      />

      <!-- Cartes des tournois existants -->
      <CardEditComponent
        v-for="tourney in filteredTourneys"
        :key="tourney.id"
        :title="tourney.name"
        :location="tourney.location"
        :date="tourney.dateTourney"
        :status="tourney.status"
        :hasActions="true"
        :showDeleteButton="true"
        :showEditButton="true"
        @click="viewTourneyDetails(tourney.id)"
        @delete="confirmDeleteTourney(tourney.id)"
        @edit="editTourney(tourney)"
      >
        <template #subtitle>
          <p>Lieu: {{ tourney.location }}</p>
          <p>Date: {{ new Date(tourney.dateTourney).toLocaleDateString() }}</p>
          <p>Statut: {{ tourney.status }}</p>
        </template>
      </CardEditComponent>
    </div>
    <!-- Modale pour ajouter/modifier un tournoi -->
    <ModalComponent
      :isVisible="showModal"
      :title="
        editingTourneyId ? 'Modifier le Tournoi' : 'Ajouter un Nouveau Tournoi'
      "
      :isEditing="!!editingTourneyId"
      :isFormValid="isFormValid"
      @close="closeModal"
      @submit="handleFormSubmit"
    >
      <template #content>
        <FormComponent v-model="newTourney" :fields="formFields" />
      </template>
    </ModalComponent>

    <!-- Confirmation de suppression -->
    <DeleteConfirmationModal
      :isVisible="showDeleteConfirmation"
      @cancel="closeDeleteConfirmation"
      @confirm="deleteTourney(confirmedDeleteTourneyId)"
    />
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import ModalComponent from '@/components/ModalComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import CardAddComponent from '@/components/CardAddComponent.vue';
  import CardEditComponent from '@/components/CardEditComponent.vue';
  import FormComponent from '@/components/FormComponent.vue';

  export default {
    components: {
      ModalComponent,
      DeleteConfirmationModal,
      CardAddComponent,
      CardEditComponent,
      FormComponent,
    },
    data() {
      return {
        tourneys: [],
        showModal: false,
        showDeleteConfirmation: false,
        confirmedDeleteTourneyId: null,
        newTourney: {
          name: '',
          location: '',
          dateTourney: '',
          domain: '',
          emergencyDetails: '',
          status: 'draft',
        },
        editingTourneyId: null,
        nameError: false,
        locationError: false,
        dateError: false,
        filterStatus: '',
        filterDate: '',
        isSaving: false,
        isFormValid: false,
      };
    },
    computed: {
      filteredTourneys() {
        return this.tourneys.filter((tourney) => {
          const statusMatches = this.filterStatus
            ? tourney.status === this.filterStatus
            : true;
          const dateMatches =
            this.filterDate === 'upcoming'
              ? new Date(tourney.dateTourney) >= new Date()
              : this.filterDate === 'past'
              ? new Date(tourney.dateTourney) < new Date()
              : true;

          return statusMatches && dateMatches;
        });
      },
      formFields() {
        return [
          {
            name: 'name',
            label: 'Nom du tournoi',
            type: 'text',
            required: true,
          },
          {
            name: 'location',
            label: 'Lieu',
            type: 'text',
            required: true,
          },
          {
            name: 'dateTourney',
            label: 'Date du Tournoi',
            type: 'date',
            required: true,
          },
          {
            name: 'domain',
            label: 'Domaine',
            type: 'text',
            required: false,
          },
          {
            name: 'emergencyDetails',
            label: "Détails d'urgence",
            type: 'textarea',
            required: false,
          },
          {
            name: 'status',
            label: 'Statut',
            type: 'select',
            options: [
              { value: 'draft', label: 'Draft' },
              { value: 'ready', label: 'Prêt' },
              { value: 'active', label: 'Actif' },
              { value: 'completed', label: 'Terminé' },
            ],
            required: true,
          },
        ];
      },
    },
    methods: {
      async fetchTourneys() {
        try {
          const response = await apiService.get('/tourneys');
          this.tourneys = response.data;
        } catch (error) {
          console.error('Erreur lors de la récupération des tournois:', error);
        }
      },
      openAddTourneyModal() {
        this.editingTourneyId = null;
        this.newTourney = {
          name: '',
          location: '',
          dateTourney: '',
          domain: '',
          emergencyDetails: '',
          status: 'draft',
        };
        this.isFormValid = false;
        this.showModal = true;
      },
      editTourney(tourney) {
        this.editingTourneyId = tourney.id;
        this.newTourney = { ...tourney };
        this.isFormValid = false;
        this.showModal = true;
      },
      handleFormSubmit() {
        if (!this.isFormValid) {
          return;
        }
        this.isSaving = true;
        this.saveTourney();
      },
      validateForm() {
        this.validateNameField();
        this.validateLocationField();
        this.validateDateField();
        this.isFormValid =
          !this.nameError && !this.locationError && !this.dateError;
      },
      validateNameField() {
        this.nameError =
          !this.isNameUnique(this.newTourney.name) || !this.newTourney.name;
      },
      validateLocationField() {
        this.locationError = !this.newTourney.location;
      },
      validateDateField() {
        this.dateError = !this.newTourney.dateTourney;
      },
      isNameUnique(name) {
        return !this.tourneys.some(
          (tourney) =>
            tourney.name.toLowerCase() === name.toLowerCase() &&
            tourney.id !== this.editingTourneyId
        );
      },
      async saveTourney() {
        try {
          if (this.editingTourneyId) {
            await apiService.put(
              `/tourneys/${this.editingTourneyId}`,
              this.newTourney
            );
          } else {
            await apiService.post('/tourneys', this.newTourney);
          }
          this.closeModal();
          this.fetchTourneys();
        } catch (error) {
          console.error("Erreur lors de l'enregistrement du tournoi:", error);
          alert(
            "Une erreur s'est produite lors de l'enregistrement du tournoi. Veuillez réessayer."
          );
        } finally {
          this.isSaving = false;
        }
      },
      confirmDeleteTourney(id) {
        this.confirmedDeleteTourneyId = id;
        this.showDeleteConfirmation = true;
      },
      async deleteTourney(id) {
        try {
          await apiService.delete(`/tourneys/${id}`);
          this.closeDeleteConfirmation();
          this.fetchTourneys();
        } catch (error) {
          console.error('Erreur lors de la suppression du tournoi:', error);
        }
      },
      viewTourneyDetails(tourneyId) {
        this.$router.push(`/tourneys/${tourneyId}`);
      },
      closeModal() {
        this.showModal = false;
        this.isSaving = false;
      },
      closeDeleteConfirmation() {
        this.showDeleteConfirmation = false;
        this.confirmedDeleteTourneyId = null;
      },
    },
    watch: {
      newTourney: {
        handler() {
          this.validateForm();
        },
        deep: true,
      },
    },
    mounted() {
      this.fetchTourneys();
    },
  };
</script>

<style scoped>
  .truncated-title {
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  button {
    transition: transform 0.2s ease;
  }
  button:hover {
    transform: scale(1.05);
  }

  .card-footer {
    margin-top: auto;
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .card-footer button {
    flex: 1;
  }
</style>
