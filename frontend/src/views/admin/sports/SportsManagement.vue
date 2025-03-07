<!-- Gestion des Sports -->
<!-- Path: src/views/admin/sports/SportsManagement.vue -->
<!-- Cette page permet de gérer les sports. -->

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
        :showEditButton="true"
        :showDeleteButton="true"
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
          @form-cancel="closeModal"
          :customValidation="validateForm"
        />
      </template>
    </ModalComponent>

    <!-- Confirmation de suppression -->
    <DeleteConfirmationModal
      :isVisible="showDeleteConfirmation"
      :isHardDelete="true"
      @form-cancel="closeDeleteConfirmation"
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
        formErrors: {}, // Gérer les erreurs du formualire
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
      /**
       * Valider le formulaire de création/modification d'un sport.
       * @returns {Object} Les erreurs du formulaire.
       */
      validateForm() {
        const { name, rule } = this.newSport;
        const trimmedName = name.trim(); // Supprime les espaces en début et fin

        // Initialiser les erreurs
        const errors = {};

        // Vérifier si le nom est vide
        if (!trimmedName) {
          errors.name = 'Le nom du sport est obligatoire.';
        } else {
          // Vérifier l'unicité du nom en ignorant les espaces
          const nameExists = this.sports.some(
            (sport) =>
              sport.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
              sport.id !== this.editingSportId
          );
          if (nameExists) {
            errors.name = 'Un sport avec ce nom existe déjà.';
          }
        }

        // Vérifier si les règles sont vides
        if (!rule) {
          errors.rule = 'Les règles du sport sont obligatoires.';
        }

        // Mettre à jour les erreurs du formulaire
        this.formErrors = errors;

        // Mettre à jour la validité du formulaire
        this.isFormValid = Object.keys(errors).length === 0;
        // Retourner l'objet errors, même s'il est vide
        return errors;
      },

      /**
       * Récupérer l'URL complète d'une image.
       * @param {string} imagePath - Le chemin de l'image.
       * @returns {string} L'URL complète de l'image.
       */
      getImageUrl(imagePath) {
        const baseUrl =
          process.env.VUE_APP_IMAGE_URL || 'http://localhost:3000';
        return `${baseUrl}${imagePath}`;
      },

      /**
       * Récupérer le nom du fichier à partir du chemin complet.
       * @param {string} filePath - Le chemin complet du fichier.
       * @returns {string} Le nom du fichier.
       */
      getFileName(filePath) {
        if (!filePath) return '';
        const parts = filePath.split('/');
        return parts[parts.length - 1];
      },

      /**
       * Récupérer la liste des sports depuis l'API.
       */
      async fetchSports() {
        try {
          const response = await apiService.get('/sports');
          this.sports = response.data;
        } catch (error) {
          console.error('Erreur lors de la récupération des sports:', error);
        }
      },

      /**
       * Gérer le téléchargement d'un fichier.
       * @param {File} file - Le fichier téléchargé.
       */
      handleFileUpload(file) {
        if (file === null) {
          this.selectedFile = null;
          return;
        }
        // Vérifier la taille du fichier
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
        } else {
          // File selection was canceled
          this.selectedFile = null;
        }
        this.validateForm();
      },
      // Ouvrir la modale pour ajouter un nouveau sport
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
        this.formErrors = {};
        this.showModal = true;
      },
      // Ouvrir la modale pour modifier un sport
      editSport(sport) {
        this.editingSportId = sport.id;
        this.newSport = { ...sport };
        this.selectedFile = null;
        this.isFormValid = true;
        this.formErrors = {};
        this.showModal = true;
      },

      // Gérer la soumission du formulaire
      async handleFormSubmit() {
        this.validateForm();
        if (!this.isFormValid) return;

        // Créer un objet FormData pour envoyer les données
        const formData = new FormData();
        formData.append('name', this.newSport.name);
        formData.append('rule', this.newSport.rule);
        formData.append('scoreSystem', this.newSport.scoreSystem);
        formData.append('color', this.newSport.color);

        // Ajouter l'image si elle a été sélectionnée
        if (this.newSport.image instanceof File) {
          formData.append('image', this.newSport.image);
        } else if (this.newSport.image) {
          // Si l'image est déjà une URL ou un nom de fichier
          formData.append('image', this.getFileName(this.newSport.image));
        }

        // Envoyer la requête
        try {
          if (this.editingSportId) {
            // Requête PUT pour mettre à jour le sport existant
            await apiService.put(`/sports/${this.editingSportId}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Sport modifié avec succès!');
          } else {
            // Requête POST pour créer un nouveau sport
            await apiService.post('/sports', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Nouveau sport ajouté avec succès!');
          }
          this.closeModal();
          this.fetchSports();
        } catch (error) {
          console.error("Erreur lors de l'enregistrement du sport :", error);
          toast.error("Erreur lors de l'enregistrement du sport!");
        }
      },

      // Confirmer la suppression d'un sport
      confirmDeleteSport(id) {
        this.confirmedDeleteSportId = id;
        this.showDeleteConfirmation = true;
      },

      /**
       * Supprimer un sport.
       * @param {number} id - L'ID du sport à supprimer.
       */
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

      // Fermer la modale
      closeModal() {
        this.showModal = false;
      },

      // Fermer la confirmation de suppression
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
