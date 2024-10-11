<template>
  <div class="p-6">
    <div class="flex items-center mb-8">
      <h1 class="text-3xl font-bold ml-4">Gestion des Sports</h1>
    </div>

    <!-- Grille des sports -->
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      <!-- Carte pour ajouter un nouveau sport -->
      <div
        @click.stop="openAddSportModal"
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
        @click.stop="editSport(sport)"
        class="cursor-pointer bg-white p-6 rounded-lg shadow-md flex flex-col items-center hover:bg-gray-50 transition-transform transform hover:scale-105"
      >
        <img
          :src="`http://localhost:3000${sport.image}`"
          alt="Sport image"
          class="w-full h-40 object-cover mb-4 rounded-lg"
        />
        <h2
          class="truncated-title text-2xl font-semibold mb-4"
          :style="{ color: sport.color, textShadow: '0 0 1px black' }"
        >
          {{ truncateText(sport.name) }}
        </h2>
        <div class="flex space-x-4 mt-4">
          <ButtonComponent variant="danger" @click.stop="confirmDeleteSport(sport.id)">
            Supprimer
          </ButtonComponent>
        </div>
      </div>
    </div>

    <!-- Modale pour ajouter/modifier un sport -->
    <ModalComponent
      :isVisible="showModal"
      :title="editingSportId ? 'Modifier le Sport' : 'Ajouter un Nouveau Sport'"
      @close="closeModal"
    >
      <template #content>
        <form @submit.prevent="handleFormSubmit">
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2">Nom du sport</label>
            <input
              type="text"
              v-model="newSport.name"
              :class="[
                'w-full p-2 border rounded-md',
                nameError ? 'border-red-500' : 'border-gray-300',
              ]"
              @input="validateName"
              required
            />
            <p v-if="nameError" class="text-red-500 text-sm mt-1">
              Un sport avec ce nom existe déjà. Veuillez en choisir un autre.
            </p>
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
              <img
                :src="`http://localhost:3000${newSport.image}`"
                alt="Current sport image"
                class="w-full h-40 object-cover rounded-lg"
              />
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
          <div class="flex justify-end space-x-4 mt-6">
            <ButtonComponent
              variant="secondary"
              @click.stop="closeModal"
              :nativeType="'button'"
              >Annuler</ButtonComponent
            >
            <ButtonComponent
              variant="primary"
              :nativeType="'submit'"
              :disabled="nameError"
            >
              {{ editingSportId ? "Modifier" : "Ajouter" }}
            </ButtonComponent>
          </div>
        </form>
      </template>
    </ModalComponent>

    <!-- Confirmation de suppression -->
    <ModalComponent
      :isVisible="showDeleteConfirmation"
      title="Confirmation de suppression"
      @close="closeDeleteConfirmation"
    >
      <template #content>
        <p class="mb-6">
          Êtes-vous sûr de vouloir supprimer ce sport ? Cette action est irréversible.
        </p>
      </template>
      <template #footer>
        <ButtonComponent variant="secondary" @click.stop="closeDeleteConfirmation"
          >Annuler</ButtonComponent
        >
        <ButtonComponent
          variant="danger"
          @click.stop="deleteSport(confirmedDeleteSportId)"
          :disabled="isDeleting"
        >
          Supprimer
        </ButtonComponent>
      </template>
    </ModalComponent>
  </div>
</template>

<script>
import apiService from "@/services/apiService";
import ModalComponent from "@/components/ModalComponent.vue";
import ButtonComponent from "@/components/ButtonComponent.vue";
import truncateMixin from "@/mixins/truncateMixin";

export default {
  components: {
    ModalComponent,
    ButtonComponent,
  },
  mixins: [truncateMixin],
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
        color: "#000000",
        image: null,
      },
      editingSportId: null,
      selectedFile: null,
      nameError: false,
      isDeleting: false, // Ajout d'un verrou pour éviter la suppression en doublon
      isSubmitting: false, // Ajout d'un verrou pour éviter la soumission en doublon
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
        color: "#000000",
        image: null,
      };
      this.selectedFile = null;
      this.nameError = false;
      this.showModal = true;
    },
    editSport(sport) {
      this.editingSportId = sport.id;
      this.newSport = {
        ...sport,
        color: sport.color || "#000000",
      };
      this.selectedFile = null;
      this.nameError = false;
      this.showModal = true;
    },
    handleFormSubmit() {
      if (this.isSubmitting) {
        return;
      }
      this.isSubmitting = true;
      if (this.nameError) {
        this.isSubmitting = false;
        return;
      }

      this.saveSport();
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
      } finally {
        this.isSubmitting = false;
      }
    },
    confirmDeleteSport(id) {
      this.confirmedDeleteSportId = id;
      this.showDeleteConfirmation = true;
    },
    async deleteSport(id) {
      if (this.isDeleting) {
        return;
      }
      this.isDeleting = true;
      try {
        await apiService.delete(`/sports/${id}`);
        this.closeDeleteConfirmation();
        this.fetchSports();
      } catch (error) {
        console.error("Erreur lors de la suppression du sport:", error);
      } finally {
        this.isDeleting = false;
      }
    },
    closeModal() {
      this.showModal = false;
      this.isSubmitting = false; // Réinitialise l'état
    },
    closeDeleteConfirmation() {
      this.showDeleteConfirmation = false;
      this.confirmedDeleteSportId = null;
    },
    validateName() {
      this.nameError = !this.isNameUnique(this.newSport.name);
    },
    isNameUnique(name) {
      return !this.sports.some(
        (sport) => sport.name.toLowerCase() === name.toLowerCase()
      );
    },
  },
  mounted() {
    this.fetchSports();
  },
};
</script>

<style scoped>
.truncated-title {
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%; /* Ajustez cette valeur selon la taille souhaitée */
}

button {
  transition: transform 0.2s ease;
}
button:hover {
  transform: scale(1.05);
}
</style>
