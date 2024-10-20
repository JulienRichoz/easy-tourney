<template>
  <div class="p-6">
    <div class="flex items-center mb-8">
      <TitleComponent title="Gestion des Sports" />
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
        :hasActions="true"
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
      @close="closeModal"
    >
      <template #content>
        <FormComponent
          v-model="newSport"
          :fields="formFields"
          :isEditing="!!editingSportId"
          @file-selected="handleFileUpload"
          @form-submit="handleFormSubmit"
          @cancel="closeModal"
          @update-validation="updateFormValidation"
        />
      </template>
    </ModalComponent>

    <!-- Confirmation de suppression -->
    <DeleteConfirmationModal
      :isVisible="showDeleteConfirmation"
      :isHardDelete="true"
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
  import FormComponent from '@/components/FormComponent.vue';
  import TitleComponent from '@/components/TitleComponent.vue';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      ModalComponent,
      DeleteConfirmationModal,
      CardAddComponent,
      CardEditComponent,
      FormComponent,
      TitleComponent,
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
          scoreSystem: 'DESC',
          color: '#000000',
          image: null,
        },
        editingSportId: null,
        selectedFile: null,
        isFormValid: false,
      };
    },
    computed: {
      formFields() {
        return [
          {
            name: 'name',
            label: 'Nom du sport',
            type: 'text',
            required: true,
          },
          {
            name: 'rule',
            label: 'Règles du sport',
            type: 'textarea',
            required: true,
          },
          {
            name: 'scoreSystem',
            label: 'Système de score',
            type: 'select',
            options: [
              { value: 'ASC', label: 'ASC' },
              { value: 'DESC', label: 'DESC' },
            ],
            tooltip:
              "'ASC': Un score faible est le meilleur (temps). 'DESC': Un score élevé est le meilleur (nombre de points).",
            required: true,
          },
          {
            name: 'image',
            label: 'Image du sport',
            type: 'file',
            required: false,
          },
          {
            name: 'color',
            label: 'Couleur (Hexadecimal)',
            type: 'color',
            required: false,
          },
        ];
      },
    },

    methods: {
      validateForm() {
        const { name, rule } = this.newSport;
        this.isFormValid = !!name && !!rule;
      },

      updateFormValidation(isValid) {
        this.isFormValid = isValid;
      },

      getImageUrl(imagePath) {
        const baseUrl =
          process.env.VUE_APP_IMAGE_URL || 'http://localhost:3000';
        return `${baseUrl}${imagePath}`;
      },
      getFileName(filePath) {
        if (!filePath) return '';
        const parts = filePath.split('/');
        return parts[parts.length - 1];
      },

      async fetchSports() {
        try {
          const response = await apiService.get('/sports');
          this.sports = response.data;
        } catch (error) {
          console.error('Erreur lors de la récupération des sports:', error);
        }
      },

      handleFileUpload(file) {
        if (file) {
          const maxSizeInMB = 10;
          const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

          if (file.size > maxSizeInBytes) {
            alert(
              `L'image dépasse la taille maximale autorisée de ${maxSizeInMB} Mo.`
            );
            this.selectedFile = null;
          } else {
            this.selectedFile = file;
          }
        }
        this.validateForm();
      },

      openAddSportModal() {
        this.editingSportId = null;
        this.newSport = {
          name: '',
          rule: '',
          scoreSystem: 'DESC',
          color: '#000000',
          image: null,
        };
        this.selectedFile = null;
        this.isFormValid = false;
        this.showModal = true;
      },

      editSport(sport) {
        this.editingSportId = sport.id;
        this.newSport = { ...sport };
        this.selectedFile = null;
        this.isFormValid = true;
        this.showModal = true;
      },

      async handleFormSubmit() {
        this.validateForm();
        if (!this.isFormValid) return;

        const formData = new FormData();
        formData.append('name', this.newSport.name);
        formData.append('rule', this.newSport.rule);
        formData.append('scoreSystem', this.newSport.scoreSystem);
        formData.append('color', this.newSport.color);

        if (this.selectedFile) {
          formData.append('image', this.selectedFile);
        } else if (this.newSport.image) {
          formData.append('image', this.getFileName(this.newSport.image));
        }

        try {
          if (this.editingSportId) {
            await apiService.put(`/sports/${this.editingSportId}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Sport modifié avec succès!');
          } else {
            await apiService.post('/sports', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Nouveau sport ajouté avec succès!');
          }
          this.closeModal();
          this.fetchSports();
        } catch (error) {
          toast.error("Erreur lors de l'enregistrement du sport!");
        }
      },

      confirmDeleteSport(id) {
        this.confirmedDeleteSportId = id;
        this.showDeleteConfirmation = true;
      },

      async deleteSport(id) {
        try {
          await apiService.delete(`/sports/${id}`);
          toast.success('Sport supprimé avec succès!');
          this.closeDeleteConfirmation();
          this.fetchSports();
        } catch (error) {
          toast.error('Erreur lors de la suppression du sport!');
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

    watch: {
      newSport: {
        handler() {
          this.validateForm();
        },
        deep: true,
      },
    },

    mounted() {
      this.fetchSports();
    },
  };
</script>

<style scoped>
  /* Styles gérés par Tailwind CSS */
</style>
