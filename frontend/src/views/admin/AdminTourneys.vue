<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-8">
      <TitleComponent title="Gestion des Tournois" />
      <!-- Filtres des tournois -->
      <FilterComponent :filters="filters" @filter-change="handleFilterChange" />
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
      />
    </div>
    <!-- Modale pour ajouter/modifier un tournoi -->
    <ModalComponent
      :isVisible="showModal"
      :title="
        editingTourneyId ? 'Modifier le Tournoi' : 'Ajouter un Nouveau Tournoi'
      "
      @close="closeModal"
    >
      <template #content>
        <FormComponent
          v-model="newTourney"
          :fields="formFields"
          :isEditing="!!editingTourneyId"
          :isFormValid="isFormValid"
          @form-submit="handleFormSubmit"
          @cancel="closeModal"
        />
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
  import FilterComponent from '@/components/FilterComponent.vue';
  import TitleComponent from '@/components/TitleComponent.vue';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      ModalComponent,
      DeleteConfirmationModal,
      CardAddComponent,
      CardEditComponent,
      FormComponent,
      FilterComponent,
      TitleComponent,
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
        filters: [
          {
            label: 'Filtrer par statut',
            value: this.filterStatus,
            placeholder: 'Tous les status',
            options: [
              { label: 'Tous les statuts', value: '' },
              { label: 'Brouillon', value: 'draft' },
              { label: 'Prêt', value: 'ready' },
              { label: 'En cours', value: 'active' },
              { label: 'Terminé', value: 'completed' },
            ],
          },
          {
            label: 'Filtrer par date',
            value: this.filterDate,
            options: [
              { label: 'Toutes les dates', value: '' },
              { label: 'À venir', value: 'upcoming' },
              { label: 'Passés', value: 'past' },
            ],
          },
        ],
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
              { value: 'draft', label: 'Brouillon' },
              { value: 'ready', label: 'Prêt' },
              { value: 'active', label: 'En cours' },
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
      handleFilterChange(filter) {
        // Mettre à jour les filtres sélectionnés
        if (filter.label === 'Filtrer par statut') {
          this.filterStatus = filter.value;
        } else if (filter.label === 'Filtrer par date') {
          this.filterDate = filter.value;
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
        console.log('Click edit tourney');
        this.editingTourneyId = tourney.id;
        this.newTourney = { ...tourney };
        this.showModal = true;
        this.isFormValid = false;
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
            toast.success('Tournoi modifié avec succès!');
          } else {
            await apiService.post('/tourneys', this.newTourney);
            toast.success('Nouveau tournoi ajouté avec succès!');
          }
          this.closeModal();
          this.fetchTourneys();
        } catch (error) {
          console.error("Erreur lors de l'enregistrement du tournoi:", error);
          toast.error("Erreur lors de l'enregistrement du tournoi!");
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
          toast.success('Tournoi supprimé avec succès!');
          this.closeDeleteConfirmation();
          this.fetchTourneys();
        } catch (error) {
          toast.error('Erreur lors de la suppression du tournoi!');
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

<style scoped></style>
