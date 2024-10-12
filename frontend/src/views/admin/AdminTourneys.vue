<!-- frontend/src/views/admin/AdminTourneys.vue -->
<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold ml-4">Gestion des Tournois</h1>
      <!-- Filtres des tournois -->
      <div class="flex items-center">
        <span class="text-gray-700 font-semibold mr-4">Filtrer par:</span>
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
        <select
          v-model="filterDate"
          class="ml-4 p-2 border border-gray-300 rounded-md"
        >
          <option value="">Toutes les dates</option>
          <option value="upcoming">À venir</option>
          <option value="past">Passés</option>
        </select>
      </div>
    </div>

    <!-- Grille des tournois -->
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      <!-- Carte pour ajouter un nouveau tournoi -->
      <div
        @click="openAddTourneyModal"
        class="cursor-pointer bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center hover:bg-gray-100 transition-transform transform hover:scale-105 h-72"
      >
        <PlusIcon class="w-12 h-12 text-green-500" />
        <h2 class="text-lg font-semibold mt-4">Ajouter Tournoi</h2>
      </div>

      <!-- Cartes des tournois existants -->
      <div
        v-for="tourney in filteredTourneys"
        :key="tourney.id"
        @click="viewTourneyDetails(tourney.id)"
        class="cursor-pointer bg-white p-6 rounded-lg shadow-md flex flex-col items-start hover:bg-gray-50 transition-transform transform hover:scale-105 h-72 justify-between"
      >
        <div class="flex-grow w-full">
          <h2 class="truncated-title text-xl font-semibold mb-2">
            {{ truncateText(tourney.name) }}
          </h2>
          <div class="flex items-center text-gray-600 mb-1">
            <MapPinIcon class="w-5 h-5 mr-1 flex-shrink-0" />
            <p class="truncate">{{ truncateText(tourney.location, 40) }}</p>
          </div>

          <div class="flex items-center text-gray-600 mb-3">
            <CalendarDaysIcon class="w-5 h-5 mr-1 flex-shrink-0" />
            <p>{{ tourney.dateTourney }}</p>
          </div>
          <span
            :class="[
              'inline-block px-3 py-1 rounded-full text-white font-semibold text-sm',
              tourney.status === 'draft'
                ? 'bg-red-300 text-red-500'
                : tourney.status === 'ready'
                ? 'bg-yellow-300 text-yellow-500'
                : tourney.status === 'active'
                ? 'bg-blue-300 text-blue-500'
                : 'bg-gray-300 text-gray-500',
            ]"
          >
            {{ tourney.status }}
          </span>
        </div>
        <div class="flex space-x-4 mt-4 w-full card-footer justify-between">
          <ButtonComponent
            variant="danger"
            icon="TrashIcon"
            @click.stop="confirmDeleteTourney(tourney.id)"
          />
          <ButtonComponent
            variant="warning"
            icon="PencilIcon"
            @click.stop="editTourney(tourney)"
          />
        </div>
      </div>
    </div>

    <!-- Modale pour ajouter/modifier un tournoi -->
    <ModalComponent
      :isVisible="showModal"
      :title="
        editingTourneyId ? 'Modifier le Tournoi' : 'Ajouter un Nouveau Tournoi'
      "
      :isEditing="!!editingTourneyId"
      @close="closeModal"
      @submit="handleFormSubmit"
    >
      <template #content>
        <form @submit.prevent="handleFormSubmit">
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2"
              >Nom du tournoi</label
            >
            <input
              type="text"
              v-model="newTourney.name"
              :class="[
                'w-full p-2 border rounded-md',
                nameError ? 'border-red-500' : 'border-gray-300',
              ]"
              @input="validateNameField"
              required
            />
            <p v-if="nameError" class="text-red-500 text-sm mt-1">
              Un tournoi avec ce nom existe déjà ou le champ est vide. Veuillez
              en choisir un autre.
            </p>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2">Lieu</label>
            <input
              type="text"
              v-model="newTourney.location"
              :class="[
                'w-full p-2 border rounded-md',
                locationError ? 'border-red-500' : 'border-gray-300',
              ]"
              @input="validateLocationField"
              required
            />
            <p v-if="locationError" class="text-red-500 text-sm mt-1">
              Le lieu est obligatoire.
            </p>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2"
              >Date du Tournoi</label
            >
            <input
              type="date"
              v-model="newTourney.dateTourney"
              :class="[
                'w-full p-2 border rounded-md',
                dateError ? 'border-red-500' : 'border-gray-300',
              ]"
              @input="validateDateField"
              required
            />
            <p v-if="dateError" class="text-red-500 text-sm mt-1">
              La date du tournoi est obligatoire.
            </p>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2"
              >Domaine</label
            >
            <input
              type="text"
              v-model="newTourney.domain"
              class="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2"
              >Nombre de Terrains</label
            >
            <input
              type="number"
              v-model="newTourney.numberOfField"
              :class="[
                'w-full p-2 border rounded-md',
                fieldError ? 'border-red-500' : 'border-gray-300',
              ]"
              @input="validateFieldNumber"
              min="0"
              required
            />
            <p v-if="fieldError" class="text-red-500 text-sm mt-1">
              Le nombre de terrains doit être un nombre positif.
            </p>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2"
              >Détails d'urgence</label
            >
            <textarea
              v-model="newTourney.emergencyDetails"
              class="w-full p-2 border border-gray-300 rounded-md"
            ></textarea>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2">Statut</label>
            <select
              v-model="newTourney.status"
              class="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="draft">Draft</option>
              <option value="ready">Prêt</option>
              <option value="active">Actif</option>
              <option value="completed">Terminé</option>
            </select>
          </div>
        </form>
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
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import {
    PlusIcon,
    MapPinIcon,
    CalendarDaysIcon,
  } from '@heroicons/vue/24/outline';
  import truncateMixin from '@/mixins/truncateMixin';

  export default {
    components: {
      ModalComponent,
      ButtonComponent,
      DeleteConfirmationModal,
      PlusIcon,
      MapPinIcon,
      CalendarDaysIcon,
    },
    mixins: [truncateMixin],
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
          numberOfField: 0,
          emergencyDetails: '',
          status: 'draft',
        },
        editingTourneyId: null,
        nameError: false,
        locationError: false,
        dateError: false,
        fieldError: false,
        filterStatus: '',
        filterDate: '',
        isSaving: false,
        isSubmitting: false,
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
      handleFileUpload(event) {
        this.selectedFile = event.target.files[0];
      },
      openAddTourneyModal() {
        this.editingTourneyId = null;
        this.newTourney = {
          name: '',
          location: '',
          dateTourney: '',
          domain: '',
          numberOfField: 0,
          emergencyDetails: '',
          status: 'draft',
        };
        this.clearErrors();
        this.showModal = true;
      },
      editTourney(tourney) {
        this.editingTourneyId = tourney.id;
        this.newTourney = { ...tourney };
        this.clearErrors();
        this.showModal = true;
      },
      handleFormSubmit() {
        if (this.isSubmitting) {
          return;
        }
        this.isSubmitting = true;
        this.validateFields();
        if (
          this.nameError ||
          this.locationError ||
          this.dateError ||
          this.fieldError
        ) {
          this.isSubmitting = false;
          return;
        }
        this.saveTourney();
      },
      async saveTourney() {
        if (this.isSaving) {
          return;
        }
        this.isSaving = true;

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
          this.isSubmitting = false;
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
      validateFields() {
        this.validateNameField();
        this.validateLocationField();
        this.validateDateField();
        this.validateFieldNumber();
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
      validateFieldNumber() {
        this.fieldError = this.newTourney.numberOfField < 0;
      },
      clearErrors() {
        this.nameError = false;
        this.locationError = false;
        this.dateError = false;
        this.fieldError = false;
      },
      isNameUnique(name) {
        return !this.tourneys.some(
          (tourney) =>
            tourney.name.toLowerCase() === name.toLowerCase() &&
            tourney.id !== this.editingTourneyId
        );
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
