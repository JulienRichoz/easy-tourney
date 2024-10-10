<template>
  <div class="p-6">
    <div class="flex items-center mb-8">
      <h1 class="text-3xl font-bold ml-4">Gestion des Sports</h1>
    </div>

    <!-- Grille des sports -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Carte pour ajouter un nouveau sport -->
      <div
        @click="openAddSportModal"
        class="cursor-pointer bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center hover:bg-gray-100 transition-transform transform hover:scale-105"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-12 h-12 text-green-500">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <h2 class="text-lg font-semibold mt-4">Ajouter Sport</h2>
      </div>

      <!-- Cartes des sports existants -->
      <div
        v-for="sport in sports"
        :key="sport.id"
        @click="editSport(sport)"
        class="cursor-pointer bg-white p-6 rounded-lg shadow-md flex flex-col items-center hover:bg-gray-50 transition-transform transform hover:scale-105"
      >
        <img :src="sport.image || '/path/to/default-image.png'" alt="Sport image" class="w-20 h-20 object-cover mb-4 rounded-full">
        <h2 class="text-2xl font-semibold mb-4">{{ sport.name }}</h2>
        <div class="flex space-x-4 mt-4">
          <button @click.stop="confirmDeleteSport(sport.id)" class="bg-red-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-red-600 transition-all">Supprimer</button>
        </div>
      </div>
    </div>

    <!-- Modale pour ajouter/modifier un sport -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg w-full max-w-md">
        <h2 class="text-2xl font-bold mb-4">{{ editingSportId ? 'Modifier le Sport' : 'Ajouter un Nouveau Sport' }}</h2>
        <form @submit.prevent="saveSport">
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2">Nom du sport</label>
            <input type="text" v-model="newSport.name" class="w-full p-2 border border-gray-300 rounded-md" required />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2">Règles du sport</label>
            <textarea v-model="newSport.rule" class="w-full p-2 border border-gray-300 rounded-md" required></textarea>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2">Système de score</label>
            <select v-model="newSport.scoreSystem" class="w-full p-2 border border-gray-300 rounded-md">
              <option value="ASC">ASC</option>
              <option value="DESC">DESC</option>
            </select>
          </div>
          <div class="flex justify-end space-x-4">
            <button type="button" @click="closeModal" class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">Annuler</button>
            <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">{{ editingSportId ? 'Modifier' : 'Ajouter' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modale de confirmation de suppression -->
    <div v-if="showDeleteConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg w-full max-w-md">
        <h2 class="text-2xl font-bold mb-4">Confirmation de Suppression</h2>
        <p class="mb-6">Êtes-vous sûr de vouloir supprimer ce sport ? Cette action est irréversible.</p>
        <div class="flex justify-end space-x-4">
          <button type="button" @click="closeDeleteConfirmation" class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">Annuler</button>
          <button type="button" @click="deleteSport(confirmedDeleteSportId)" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">Supprimer</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import apiService from '@/services/apiService';

export default {
  data() {
    return {
      sports: [],
      showModal: false,
      showDeleteConfirmation: false,
      newSport: {
        name: '',
        rule: '',
        scoreSystem: 'ASC'
      },
      editingSportId: null,
      confirmedDeleteSportId: null
    };
  },
  methods: {
    async fetchSports() {
      try {
        const response = await apiService.get('/sports');
        this.sports = response.data;
      } catch (error) {
        console.error('Erreur lors de la récupération des sports:', error);
      }
    },
    openAddSportModal() {
      this.editingSportId = null;
      this.newSport = { name: '', rule: '', scoreSystem: 'ASC' };
      this.showModal = true;
    },
    editSport(sport) {
      this.editingSportId = sport.id;
      this.newSport = { ...sport };
      this.showModal = true;
    },
    async saveSport() {
      try {
        if (this.editingSportId) {
          await apiService.put(`/sports/${this.editingSportId}`, this.newSport);
        } else {
          await apiService.post('/sports', this.newSport);
        }
        this.closeModal();
        this.fetchSports();
      } catch (error) {
        console.error("Erreur lors de l'enregistrement du sport:", error);
      }
    },
    confirmDeleteSport(id) {
      this.confirmedDeleteSportId = id;
      this.showDeleteConfirmation = true;
    },
    async deleteSport(id) {
      try {
        await apiService.delete(`/sports/${id}`);
        this.closeDeleteConfirmation();
        this.fetchSports();
      } catch (error) {
        console.error('Erreur lors de la suppression du sport:', error);
      }
    },
    closeModal() {
      this.showModal = false;
    },
    closeDeleteConfirmation() {
      this.showDeleteConfirmation = false;
      this.confirmedDeleteSportId = null;
    }
  },
  mounted() {
    this.fetchSports();
  }
};
</script>

<style scoped>
/* Styles supplémentaires pour améliorer la présentation des cartes */
.card-hover:hover {
  transform: translateY(-5px);
  transition: transform 0.2s ease;
}

button {
  transition: transform 0.2s ease;
}

button:hover {
  transform: scale(1.05);
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}




</style>