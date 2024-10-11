<template>
    <div class="p-6">
      <div class="flex items-center mb-8">
        <h1 class="text-3xl font-bold ml-4">Gestion des Tournois</h1>
      </div>
  
      <!-- Grille des tournois -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Carte pour ajouter un nouveau tournoi -->
        <div
          @click="openAddTourneyModal"
          class="cursor-pointer bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center hover:bg-gray-100 transition-transform transform hover:scale-105"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-12 h-12 text-green-500"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <h2 class="text-lg font-semibold mt-4">Ajouter Tournoi</h2>
        </div>
  
        <!-- Cartes des tournois existants -->
        <div
          v-for="tourney in tourneys"
          :key="tourney.id"
          @click="editTourney(tourney)"
          class="cursor-pointer bg-white p-6 rounded-lg shadow-md flex flex-col items-center hover:bg-gray-50 transition-transform transform hover:scale-105"
        >
          <h2 class="text-2xl font-semibold mb-4">{{ tourney.name }}</h2>
          <p class="text-gray-600 mb-2">{{ tourney.location }}</p>
          <div class="flex space-x-4 mt-4">
            <button
              @click.stop="confirmDeleteTourney(tourney.id)"
              class="bg-red-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-red-600 transition-all"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
  
      <!-- Modale pour ajouter/modifier un tournoi -->
      <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-8 rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
          <h2 class="text-2xl font-bold mb-4">
            {{ editingTourneyId ? "Modifier le Tournoi" : "Ajouter un Nouveau Tournoi" }}
          </h2>
          <form @submit.prevent="saveTourney">
            <div class="mb-4">
              <label class="block text-gray-700 font-semibold mb-2">Nom du tournoi</label>
              <input type="text" v-model="newTourney.name" class="w-full p-2 border border-gray-300 rounded-md" required />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 font-semibold mb-2">Lieu</label>
              <input type="text" v-model="newTourney.location" class="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <!-- Ajoutez plus de champs ici comme dans le modèle `Tourney` -->
  
            <div class="flex justify-end space-x-4">
              <button type="button" @click="closeModal" class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                Annuler
              </button>
              <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                {{ editingTourneyId ? "Modifier" : "Ajouter" }}
              </button>
            </div>
          </form>
        </div>
      </div>
  
      <!-- Confirmation de suppression -->
      <div v-if="showDeleteConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-8 rounded-lg w-full max-w-md">
          <h2 class="text-2xl font-bold mb-4">Confirmation de suppression</h2>
          <p class="mb-6">Êtes-vous sûr de vouloir supprimer ce tournoi ? Cette action est irréversible.</p>
          <div class="flex justify-end space-x-4">
            <button @click="closeDeleteConfirmation" class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
              Annuler
            </button>
            <button @click="deleteTourney(confirmedDeleteTourneyId)" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import apiService from "@/services/apiService";
  
  export default {
    data() {
      return {
        tourneys: [],
        showModal: false,
        showDeleteConfirmation: false,
        confirmedDeleteTourneyId: null,
        newTourney: {
          name: "",
          location: "",
        },
        editingTourneyId: null,
      };
    },
    methods: {
      async fetchTourneys() {
        try {
          const response = await apiService.get("/tourneys");
          this.tourneys = response.data;
        } catch (error) {
          console.error("Erreur lors de la récupération des tournois:", error);
        }
      },
      openAddTourneyModal() {
        this.editingTourneyId = null;
        this.newTourney = {
          name: "",
          location: "",
        };
        this.showModal = true;
      },
      editTourney(tourney) {
        this.editingTourneyId = tourney.id;
        this.newTourney = { ...tourney };
        this.showModal = true;
      },
      async saveTourney() {
        try {
          if (this.editingTourneyId) {
            await apiService.put(`/tourneys/${this.editingTourneyId}`, this.newTourney);
          } else {
            await apiService.post("/tourneys", this.newTourney);
          }
          this.closeModal();
          this.fetchTourneys();
        } catch (error) {
          console.error("Erreur lors de l'enregistrement du tournoi:", error);
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
          console.error("Erreur lors de la suppression du tournoi:", error);
        }
      },
      closeModal() {
        this.showModal = false;
      },
      closeDeleteConfirmation() {
        this.showDeleteConfirmation = false;
        this.confirmedDeleteTourneyId = null;
      },
    },
    mounted() {
      this.fetchTourneys();
    },
  };
  </script>
  
  <style scoped>
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    max-height: 90vh;
    overflow-y: auto;
  }
  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
  </style>
  