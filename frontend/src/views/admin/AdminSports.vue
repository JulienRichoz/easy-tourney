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
      :isFormValid="isFormValid"
      :isEditing="!!editingSportId"
      @close="closeModal"
      @submit="handleFormSubmit"
    >
      <template #content>
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
            @input="validateForm"
            required
          />
          <p v-if="nameError" class="text-red-500 text-sm mt-1">
            Un sport avec ce nom existe déjà ou le champ est vide.
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
            @input="validateForm"
            required
          ></textarea>
          <p v-if="ruleError" class="text-red-500 text-sm mt-1">
            Les règles du sport sont obligatoires.
          </p>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2"
            >Image du sport</label
          >
          <input
            type="file"
            @change="handleFileUpload"
            class="w-full p-2 border rounded-md"
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2"
            >Couleur (Hexadecimal)</label
          >
          <input
            type="color"
            v-model="newSport.color"
            class="w-16 h-16 p-2 border rounded-md"
          />
        </div>
      </template>
    </ModalComponent>

    <!-- Confirmation de suppression -->
    <DeleteConfirmationModal
      :isVisible="showDeleteConfirmation"
      @cancel="closeDeleteConfirmation"
      @confirm="deleteSport(confirmedDeleteSportId)"
    />
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import CardAddComponent from '@/components/CardAddComponent.vue';
  import CardEditComponent from '@/components/CardEditComponent.vue';
  import ModalComponent from '@/components/ModalComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import { toast } from 'vue3-toastify';
  import 'vue3-toastify/dist/index.css';

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
        isFormValid: false,
        selectedFile: null,
        nameError: false,
        ruleError: false,
        isSubmitting: false,
      };
    },

    methods: {
      validateForm() {
        this.nameError = !this.newSport.name;
        this.ruleError = !this.newSport.rule;
        this.isFormValid = !this.nameError && !this.ruleError;
      },

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
        const file = event.target.files[0];
        const maxSizeInMB = 10;
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

        if (file.size > maxSizeInBytes) {
          alert(
            `L'image dépasse la taille maximale autorisée de ${maxSizeInMB} Mo.`
          );
          this.selectedFile = null;
        } else if (file.size > 2 * 1024 * 1024) {
          this.resizeImage(file, 1024, 768);
        } else {
          this.selectedFile = file;
        }
      },

      resizeImage(file, maxWidth, maxHeight) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.src = e.target.result;

          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                this.selectedFile = new File([blob], file.name, {
                  type: file.type,
                });
              },
              file.type,
              0.8
            );
          };
        };

        reader.readAsDataURL(file);
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
        this.isFormValid = false; // Réinitialiser la validité du formulaire
        this.showModal = true;
      },

      editSport(sport) {
        this.editingSportId = sport.id;
        this.newSport = {
          name: sport.name || '',
          rule: sport.rule || '',
          scoreSystem: sport.scoreSystem || 'ASC',
          color: sport.color || '#000000',
          image: sport.image || null,
        };
        this.selectedFile = null;
        this.nameError = false;
        this.ruleError = false;
        this.isFormValid = true; // Si l'édition est en cours, considérer le formulaire valide
        this.showModal = true;
      },

      async handleFormSubmit() {
        if (!this.isFormValid) return;

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
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Sport modifié avec succès!', {
              position: 'top-right',
              autoClose: 3000,
            });
          } else {
            await apiService.post('/sports', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Nouveau sport ajouté avec succès!', {
              position: 'top-right',
              autoClose: 3000,
            });
          }
          this.closeModal();
          this.fetchSports();
        } catch (error) {
          toast.error("Erreur lors de l'enregistrement du sport!", {
            position: 'top-right',
            autoClose: 3000,
          });
        } finally {
          this.isSubmitting = false;
        }
      },

      confirmDeleteSport(id) {
        this.confirmedDeleteSportId = id;
        this.showDeleteConfirmation = true;
      },

      async deleteSport(id) {
        if (this.isDeleting) return;

        this.isDeleting = true;
        try {
          await apiService.delete(`/sports/${id}`);
          toast.error('Sport supprimé avec succès!', {
            position: 'top-right',
            autoClose: 3000,
          });
          this.closeDeleteConfirmation();
          this.fetchSports();
        } catch (error) {
          toast.error('Erreur lors de la suppression du sport!', {
            position: 'top-right',
            autoClose: 3000,
          });
        } finally {
          this.isDeleting = false;
        }
      },

      closeModal() {
        this.showModal = false;
        this.isFormValid = false; // Réinitialiser la validité du formulaire
        this.isSubmitting = false;
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
