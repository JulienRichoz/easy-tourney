<!-- frontend/src/views/admin/AdminSports.vue -->
<template>
  <div class="p-6">
    <div class="flex items-center mb-8">
      <h1 class="text-3xl font-bold ml-4">Gestion des Sports</h1>
    </div>

    <!-- Grille des sports -->
    <div
      class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
    >
      <!-- Carte pour ajouter un nouveau sport -->
      <CardAddComponent
        title="Sport"
        @openAddElementModal="openAddSportModal"
      />

      <!-- Cartes des sports existants -->
      <CardEditComponent
        v-for="sport in sports"
        :key="sport.id"
        :title="sport.name"
        :image="getImageUrl(sport.image)"
        :showDeleteButton="true"
        :showEditButton="true"
        :titleColor="sport.color"
        @click="editSport(sport)"
        @delete="confirmDeleteSport(sport.id)"
        @edit="editSport(sport)"
      />
    </div>

    <!-- Modale pour ajouter/modifier un sport -->
    <ModalComponent
      :isVisible="showModal"
      :title="editingSportId ? 'Modifier le Sport' : 'Ajouter un Nouveau Sport'"
      :isEditing="!!editingSportId"
      @close="closeModal"
      @submit="handleFormSubmit"
    >
      <template #content>
        <form @submit.prevent="handleFormSubmit">
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2"
              >Nom du sport</label
            >
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
              Un sport avec ce nom existe déjà ou le champ est vide. Veuillez en
              choisir un autre.
            </p>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2"
              >Règles du sport</label
            >
            <textarea
              v-model="newSport.rule"
              :class="[
                'w-full p-2 border rounded-md',
                ruleError ? 'border-red-500' : 'border-gray-300',
              ]"
              @input="validateRule"
              required
            ></textarea>
            <p v-if="ruleError" class="text-red-500 text-sm mt-1">
              Les règles du sport sont obligatoires.
            </p>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2"
              >Système de score</label
            >
            <select
              v-model="newSport.scoreSystem"
              class="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="ASC">ASC</option>
              <option value="DESC">DESC</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2"
              >Image du sport</label
            >
            <div v-if="editingSportId && newSport.image" class="mb-2">
              <img
                :src="getImageUrl(sport.image)"
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
              <span class="text-gray-700 font-semibold">{{
                newSport.color
              }}</span>
            </div>
          </div>
        </form>
      </template>
    </ModalComponent>

    <!-- Confirmation de suppression -->
    <DeleteConfirmationModal
      :isVisible="showDeleteConfirmation"
      @cancel="closeDeleteConfirmation"
      @confirm="deleteSport(confirmedDeleteSportId)"
      :isHardDelete="true"
      hardDeleteMessage="Cette action entraine la destruction définitive du sport et de toutes les données associées telles que les sports associés aux terrains aux différents tournois et potentiellement les matchs et statistiques passées. Êtes-vous sûr de vouloir continuer ?"
    />
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import CardAddComponent from '@/components/CardAddComponent.vue';
  import CardEditComponent from '@/components/CardEditComponent.vue';
  import ModalComponent from '@/components/ModalComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';

  export default {
    components: {
      ModalComponent,
      DeleteConfirmationModal,
      CardAddComponent,
      CardEditComponent,
    },

    data() {
      return {
        sports: [],
        showModal: false,
        showDeleteConfirmation: false,
        confirmedDeleteSportId: null,
        newSport: {
          name: '',
          rule: '',
          scoreSystem: 'ASC',
          color: '#000000',
          image: null,
        },
        editingSportId: null,
        selectedFile: null,
        nameError: false,
        ruleError: false,
        isDeleting: false,
        isSubmitting: false,
      };
    },
    methods: {
      getImageUrl(imagePath) {
        const baseUrl =
          process.env.VUE_APP_IMAGE_URL || 'http://localhost:3000';
        return `${baseUrl}${imagePath}`;
      },
      async fetchSports() {
        try {
          const response = await apiService.get('/sports');
          this.sports = response.data;
        } catch (error) {
          console.error('Erreur lors de la récupération des sports:', error);
        }
      },
      handleFileUpload(event) {
        this.selectedFile = event.target.files[0];
      },
      openAddSportModal() {
        this.editingSportId = null;
        this.newSport = {
          name: '',
          rule: '',
          scoreSystem: 'ASC',
          color: '#000000',
          image: null,
        };
        this.selectedFile = null;
        this.nameError = false;
        this.ruleError = false;
        this.showModal = true;
      },
      editSport(sport) {
        this.editingSportId = sport.id;
        this.newSport = {
          ...sport,
          color: sport.color || '#000000',
        };
        this.selectedFile = null;
        this.nameError = false;
        this.ruleError = false;
        this.showModal = true;
      },
      handleFormSubmit() {
        if (this.isSubmitting) {
          return;
        }
        this.isSubmitting = true;
        this.validateFields();
        if (this.nameError || this.ruleError) {
          this.isSubmitting = false;
          return;
        }

        this.saveSport();
      },
      async saveSport() {
        const formData = new FormData();
        formData.append('name', this.newSport.name);
        formData.append('rule', this.newSport.rule);
        formData.append('scoreSystem', this.newSport.scoreSystem);
        formData.append('color', this.newSport.color);

        if (this.selectedFile) {
          formData.append('image', this.selectedFile);
        }

        try {
          if (this.editingSportId) {
            await apiService.put(`/sports/${this.editingSportId}`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
          } else {
            await apiService.post('/sports', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
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
          console.error('Erreur lors de la suppression du sport:', error);
        } finally {
          this.isDeleting = false;
        }
      },
      closeModal() {
        this.showModal = false;
        this.isSubmitting = false;
      },
      closeDeleteConfirmation() {
        this.showDeleteConfirmation = false;
        this.confirmedDeleteSportId = null;
      },
      validateFields() {
        this.validateName();
        this.validateRule();
      },
      validateName() {
        // Si on est en mode édition, on ne vérifie pas l'unicité du nom
        if (this.editingSportId) {
          this.nameError = !this.newSport.name; // Vérifie seulement si le champ est vide
        } else {
          // Vérification de l'unicité du nom seulement si on ajoute un nouveau sport
          this.nameError =
            !this.isNameUnique(this.newSport.name) || !this.newSport.name;
        }
      },
      validateRule() {
        this.ruleError = !this.newSport.rule;
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
    max-width: 100%;
  }

  button {
    transition: transform 0.2s ease;
  }
  button:hover {
    transform: scale(1.05);
  }
</style>
