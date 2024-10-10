<template>
  <div class="p-6">
    <div class="flex items-center mb-8">
      <h1 class="text-3xl font-bold ml-4">Gestion des Sports</h1>
    </div>

    <!-- Grille des sports -->
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      <!-- Carte pour ajouter un nouveau sport -->
      <div
        @click="openAddSportModal"
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
        <h2 class="text-lg font-semibold mt-4">Ajouter Sport</h2>
      </div>

      <!-- Cartes des sports existants -->
      <div
        v-for="sport in sports"
        :key="sport.id"
        @click="editSport(sport)"
        class="cursor-pointer bg-white p-6 rounded-lg shadow-md flex flex-col items-center hover:bg-gray-50 transition-transform transform hover:scale-105"
      >
        <img
          :src="`http://localhost:3000${sport.image}`"
          alt="Sport image"
          class="w-full h-40 object-cover mb-4 rounded-lg"
        />
        <h2
          class="text-2xl font-semibold mb-4"
          :style="{ color: sport.color, textShadow: '0 0 1px black' }"
        >
          {{ sport.name }}
        </h2>
        <div class="flex space-x-4 mt-4">
          <button
            @click.stop="confirmDeleteSport(sport.id)"
            class="bg-red-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-red-600 transition-all"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>

    <!-- Modale pour ajouter/modifier un sport -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-white p-8 rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
        <h2 class="text-2xl font-bold mb-4">
          {{ editingSportId ? "Modifier le Sport" : "Ajouter un Nouveau Sport" }}
        </h2>
        <form @submit.prevent="saveSport" enctype="multipart/form-data">
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2">Nom du sport</label>
            <input
              type="text"
              v-model="newSport.name"
              class="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2">Règles du sport</label>
            <textarea
              v-model="newSport.rule"
              class="w-full p-2 border border-gray-300 rounded-md"
              required
            ></textarea>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2">Système de score</label>
            <select
              v-model="newSport.scoreSystem"
              class="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="ASC">ASC</option>
              <option value="DESC">DESC</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2">Image du sport</label>
            <div v-if="editingSportId && newSport.image" class="mb-2">
              <img :src="`http://localhost:3000${newSport.image}`" alt="Current sport image" class="w-full h-40 object-cover rounded-lg" />
            </div>
            <input
              type="file"
              @change="handleFileUpload"
              class="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2"
              >Couleur (Hexadecimal)</label
            >
            <div class="flex items-center">
              <input
                type="color"
                v-model="newSport.color"
                class="w-16 h-16 p-2 border border-gray-300 rounded-md mr-4"
              />
              <span class="text-gray-700 font-semibold">{{ newSport.color }}</span>
            </div>
          </div>

          <div class="flex justify-end space-x-4">
            <button
              type="button"
              @click="closeModal"
              class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              {{ editingSportId ? "Modifier" : "Ajouter" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirmation de suppression -->
    <div v-if="showDeleteConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg w-full max-w-md">
        <h2 class="text-2xl font-bold mb-4">Confirmation de suppression</h2>
        <p class="mb-6">Êtes-vous sûr de vouloir supprimer ce sport ? Cette action est irréversible.</p>
        <div class="flex justify-end space-x-4">
          <button @click="closeDeleteConfirmation" class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
            Annuler
          </button>
          <button @click="deleteSport(confirmedDeleteSportId)" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
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
      sports: [],
      showModal: false,
      showDeleteConfirmation: false,
      confirmedDeleteSportId: null,
      newSport: {
        name: "",
        rule: "",
        scoreSystem: "ASC",
        color: "#000000", // Initialisation avec un code couleur par défaut
        image: null,
      },
      editingSportId: null,
      selectedFile: null,
    };
  },
  methods: {
    async fetchSports() {
      try {
        const response = await apiService.get("/sports");
        this.sports = response.data;
      } catch (error) {
        console.error("Erreur lors de la récupération des sports:", error);
      }
    },
    handleFileUpload(event) {
      this.selectedFile = event.target.files[0];
    },
    openAddSportModal() {
      this.editingSportId = null;
      this.newSport = {
        name: "",
        rule: "",
        scoreSystem: "ASC",
        color: "#000000", // Assurez-vous de réinitialiser la couleur
        image: null,
      };
      this.selectedFile = null; // Réinitialiser le fichier sélectionné
      this.showModal = true;
    },
    editSport(sport) {
      this.editingSportId = sport.id;
      this.newSport = {
        ...sport,
        color: sport.color || "#000000",
      };
      this.selectedFile = null; // Réinitialiser le fichier sélectionné
      this.showModal = true;
    },
    async saveSport() {
      const formData = new FormData();
      formData.append("name", this.newSport.name);
      formData.append("rule", this.newSport.rule);
      formData.append("scoreSystem", this.newSport.scoreSystem);
      formData.append("color", this.newSport.color);

      if (this.selectedFile) {
        formData.append("image", this.selectedFile);
      }

      try {
        if (this.editingSportId) {
          await apiService.put(`/sports/${this.editingSportId}`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        } else {
          await apiService.post("/sports", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
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
        console.error("Erreur lors de la suppression du sport:", error);
      }
    },
    closeModal() {
      this.showModal = false;
    },
    closeDeleteConfirmation() {
      this.showDeleteConfirmation = false;
      this.confirmedDeleteSportId = null;
    },
  },
  mounted() {
    this.fetchSports();
  },
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