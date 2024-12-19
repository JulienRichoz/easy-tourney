<!-- TourneysList.vue -->
<template>
  <div class="p-6">
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
    >
      <!-- Titre -->
      <TitleComponent title="Gestion des Tournois" />

      <!-- Filtres avec icônes pour mobile -->
      <div class="flex flex-wrap items-center gap-4 sm:gap-8 mt-4 sm:mt-0">
        <FilterComponent
          :filters="filters"
          @filter-change="handleFilterChange"
        />
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
          :minDate="'1900-01-01'"
          :maxDate="'2200-01-01'"
          @form-submit="handleFormSubmit"
          @form-cancel="closeModal"
          :customValidation="validateForm"
        />
      </template>
    </ModalComponent>

    <!-- Confirmation de suppression -->
    <DeleteConfirmationModal
      :isVisible="showDeleteConfirmation"
      @form-cancel="closeDeleteConfirmation"
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
          location: { address: '', latitude: null, longitude: null },
          dateTourney: '',
          domain: '',
          emergencyDetails: '',
          status: 'draft',
        },
        editingTourneyId: null,
        isFormValid: false,
        isSaving: false,
        filterStatus: '',
        filterDate: '',
        filters: [
          {
            label: 'Filtrer par statut',
            value: this.filterStatus || '',
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
            value: this.filterDate || '',
            options: [
              { label: 'Toutes les dates', value: '' },
              { label: 'À venir', value: 'upcoming' },
              { label: 'Passés', value: 'past' },
            ],
          },
        ],
        formErrors: {}, // Ajouter cette ligne
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
            type: 'location', // Type personnalisé pour utiliser AutocompleteAddress
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
          toast.error('Erreur lors de la récupération des tournois!');
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
          location: { address: '', latitude: null, longitude: null }, // Réinitialiser comme objet
          dateTourney: '',
          domain: '',
          emergencyDetails: '',
          status: 'draft',
          latitude: null,
          longitude: null,
        };
        this.isFormValid = false;
        this.formErrors = {}; // Réinitialiser les erreurs
        this.showModal = true;
      },
      editTourney(tourney) {
        this.editingTourneyId = tourney.id;
        this.newTourney = {
          ...tourney,
          location: {
            address: tourney.location,
            latitude: tourney.latitude,
            longitude: tourney.longitude,
          },
        };
        this.isFormValid = false;
        this.formErrors = {}; // Réinitialiser les erreurs
        this.showModal = true;
      },
      async handleFormSubmit(formData) {
        this.isSaving = true;
        try {
          // Préparer le payload en séparant location, latitude, longitude
          const payload = {
            ...formData,
            location: formData.location.address,
            latitude: formData.location.latitude,
            longitude: formData.location.longitude,
          };

          if (this.editingTourneyId) {
            await apiService.put(`/tourneys/${this.editingTourneyId}`, payload);
            toast.success('Tournoi modifié avec succès!');
          } else {
            await apiService.post('/tourneys', payload);
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

      validateForm() {
        const { name, location, dateTourney } = this.newTourney;
        const trimmedName = name.trim();

        const errors = {};

        // Valider le nom
        if (!trimmedName) {
          errors.name = 'Le nom du tournoi est obligatoire.';
        } else {
          const nameExists = this.tourneys.some(
            (tourney) =>
              tourney.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
              tourney.id !== this.editingTourneyId
          );
          if (nameExists) {
            errors.name = 'Un tournoi avec ce nom existe déjà.';
          }
        }

        // Valider le lieu
        if (!location || !location.address) {
          errors.location = 'Le lieu du tournoi est obligatoire.';
        } else {
          // Vérifier si latitude et longitude sont présentes
          if (location.latitude === null || location.longitude === null) {
            errors.location = 'Veuillez sélectionner une adresse valide.';
          }
        }

        // Valider la date
        if (!dateTourney) {
          errors.dateTourney = 'La date du tournoi est obligatoire.';
        }

        // Mettre à jour les erreurs du formulaire
        this.formErrors = errors;

        // Mettre à jour la validité du formulaire
        this.isFormValid = Object.keys(errors).length === 0;
        return errors;
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
        this.$router.push(`/admin/tourneys/${tourneyId}`);
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
