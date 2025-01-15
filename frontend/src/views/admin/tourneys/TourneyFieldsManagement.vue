<!-- TourneyFields.vue -->
<!-- Gère la gestion des terrains pour un tournoi -->
<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <div class="p-4 sm:p-6">
      <div class="flex items-center justify-between mb-4 sm:mb-8">
        <TitleComponent title="Gestion Terrains" />

        <!-- Boutons alignés à droite, utilisation d'icônes sur mobile -->
        <div class="flex items-center space-x-2 sm:space-x-4 mr-auto">
          <ButtonComponent
            v-if="isEditable"
            fontAwesomeIcon="cog"
            @click="openAddMultipleFieldsModal"
            variant="algo"
          >
            <span class="hidden sm:inline">Générer terrains</span>
          </ButtonComponent>
          <ButtonComponent
            v-if="isEditable && fields.length > 0"
            @click="openDeleteAllFieldsModal"
            variant="danger"
            fontAwesomeIcon="trash"
          >
            <span class="hidden sm:inline">Tous les terrains</span>
          </ButtonComponent>
        </div>

        <!-- Sélecteur de statut compact sur mobile -->
        <StatusSelectorComponent
          :tourneyId="tourneyId"
          statusKey="fieldAssignmentStatus"
          :statusOptions="fieldAssignmentStatusOptions"
          v-model="currentStatus"
        />
      </div>

      <!-- Grille des terrains -->
      <div
        class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
      >
        <!-- Carte pour ajouter un nouveau terrain (affichée uniquement si isEditable) -->
        <CardAddComponent
          v-if="isEditable"
          title="Terrain"
          @openAddElementModal="openAddFieldModal"
        />

        <!-- Cartes des terrains existants -->
        <CardEditComponent
          v-for="field in fields"
          :key="field.id"
          :title="field.name"
          :description="field.description"
          :showDeleteButton="isEditable"
          :showEditButton="true"
          :isEditable="isEditable"
          @delete="confirmDeleteField(field.id)"
          @edit="editField(field)"
          @click="editField(field)"
        />
      </div>

      <!-- Modale pour ajouter/modifier un terrain -->
      <ModalComponent
        :isVisible="showModal"
        :title="
          editingFieldId ? 'Modifier le Terrain' : 'Ajouter un Nouveau Terrain'
        "
        @close="closeModal"
      >
        <template #content>
          <FormComponent
            v-model="newField"
            :fields="formFields"
            :isEditing="!!editingFieldId"
            :isEditable="isEditable"
            @form-submit="handleFormSubmit"
            @form-cancel="closeModal"
          />
        </template>
      </ModalComponent>

      <!-- Modale pour ajouter plusieurs terrains -->
      <ModalComponent
        :isVisible="showMultipleFieldsModal"
        title="Ajouter plusieurs terrains"
        @close="closeMultipleFieldsModal"
      >
        <template #content>
          <FormComponent
            v-model="multipleFieldsData"
            :fields="multipleFieldsFormFields"
            :isFormValid="multipleFieldsData.numberOfFields > 0"
            :isEditing="!!editingFieldId"
            :isEditable="isEditable"
            @form-submit="handleMultipleFieldsSubmit"
            @form-cancel="closeMultipleFieldsModal"
          />
        </template>
      </ModalComponent>

      <!-- Modale pour confirmer la suppression de tous les terrains (affichée uniquement si isEditable) -->
      <DeleteConfirmationModal
        v-if="isEditable"
        :isVisible="showDeleteAllFieldsModal"
        @form-cancel="closeDeleteAllFieldsModal"
        @confirm="handleDeleteAllFieldsSubmit"
        :isHardDelete="true"
        hardDeleteMessage="Cette action supprimera définitivement tous les terrains et les sports associés."
      />

      <!-- Confirmation de suppression individuelle (affichée uniquement si isEditable) -->
      <DeleteConfirmationModal
        v-if="isEditable"
        :isVisible="showDeleteConfirmation"
        @form-cancel="closeDeleteConfirmation"
        @confirm="deleteField(confirmedDeleteFieldId)"
      />
    </div>
  </div>
</template>
<script>
  import { mapState, mapActions } from 'vuex';
  import apiService from '@/services/apiService';
  import CardAddComponent from '@/components/CardAddComponent.vue';
  import CardEditComponent from '@/components/CardEditComponent.vue';
  import ModalComponent from '@/components/ModalComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import FormComponent from '@/components/FormComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';
  import TitleComponent from '@/components/TitleComponent.vue';
  import StatusSelectorComponent from '@/components/StatusSelectorComponent.vue';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      ModalComponent,
      ButtonComponent,
      DeleteConfirmationModal,
      TourneySubMenu,
      CardAddComponent,
      CardEditComponent,
      FormComponent,
      TitleComponent,
      StatusSelectorComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
        fields: [],
        showModal: false,
        showMultipleFieldsModal: false,
        showDeleteConfirmation: false,
        confirmedDeleteFieldId: null,
        showDeleteAllFieldsModal: false,
        deleteAllConfirmation: '',
        newField: {
          name: '',
          description: '',
          tourneyId: this.tourneyId,
        },
        multipleFieldsData: {
          numberOfFields: 1,
        },
        editingFieldId: null,
        isSubmitting: false,
        isDeleting: false,
        isFormValid: false,
        fieldAssignmentStatusOptions: [
          { value: 'draft', label: 'Edition' },
          { value: 'completed', label: 'Terminé' },
        ],
      };
    },
    computed: {
      formFields() {
        return [
          {
            name: 'name',
            label: 'Nom du terrain',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            label: 'Description du terrain',
            type: 'textarea',
            required: false,
          },
        ];
      },
      multipleFieldsFormFields() {
        return [
          {
            name: 'numberOfFields',
            label: 'Nombre de terrains',
            type: 'number',
            required: true,
            min: 1,
          },
        ];
      },
      // Mapper l'état du module `tourney`
      ...mapState('tourney', {
        currentTournamentName: (state) => state.currentTournamentName,
        statuses: (state) => state.statuses,
      }),
      shouldShowStatusSelector() {
        // Ne pas afficher le sélecteur si le statut est 'notStarted'
        return this.statuses.fieldAssignmentStatus !== 'notStarted';
      },

      isEditable() {
        // Vérifie si le statut est différent de 'completed'
        return this.statuses.fieldAssignmentStatus !== 'completed';
      },
      // Définir `currentStatus` comme une propriété calculée liée au store
      currentStatus: {
        get() {
          return this.statuses.fieldAssignmentStatus;
        },
        set(newStatus) {
          this.$store.dispatch('tourney/updateStatus', {
            tourneyId: this.tourneyId,
            key: 'fieldAssignmentStatus',
            value: newStatus,
          });
        },
      },
    },
    methods: {
      // Mapper les actions du module `tourney`
      ...mapActions('tourney', [
        'fetchTourneyStatuses',
        'setTournamentName',
        'clearTournamentName',
      ]),

      async fetchFieldDetails() {
        try {
          // Charger les statuts du tournoi
          await this.fetchTourneyStatuses(this.tourneyId);

          // Charger les détails des terrains
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/fields`
          );
          this.fields = response.data || [];
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du terrain:',
            error
          );
        }
      },

      // Ouvrir la modale pour supprimer tous les terrains
      openDeleteAllFieldsModal() {
        this.showDeleteAllFieldsModal = true;
      },

      // Fermer la modale pour supprimer tous les terrains
      closeDeleteAllFieldsModal() {
        this.showDeleteAllFieldsModal = false;
      },

      // Supprimer tous les terrains
      async handleDeleteAllFieldsSubmit() {
        if (this.isDeleting) return;
        this.isDeleting = true;

        try {
          await apiService.delete(`/tourneys/${this.tourneyId}/fields`);
          toast.success('Tous les terrains ont été supprimés avec succès!');
          this.fetchFieldDetails();
          this.closeDeleteAllFieldsModal();
        } catch (error) {
          toast.error('Erreur lors de la suppression de tous les terrains.');
          console.error(
            'Erreur lors de la suppression de tous les terrains:',
            error
          );
        } finally {
          this.isDeleting = false;
        }
      },

      // Ouvrir la modale de confirmation de suppression
      confirmDeleteField(id) {
        this.confirmedDeleteFieldId = id;
        this.showDeleteConfirmation = true;
      },

      // Fermer la modale de confirmation de suppression
      closeDeleteConfirmation() {
        this.showDeleteConfirmation = false;
        this.confirmedDeleteFieldId = null;
      },

      // Supprimer un terrain
      async deleteField(id) {
        if (this.isDeleting) return;
        this.isDeleting = true;

        try {
          await apiService.delete(`/tourneys/${this.tourneyId}/fields/${id}`);
          toast.success('Terrain supprimé avec succès!');
          this.fetchFieldDetails();
          this.closeDeleteConfirmation();
        } catch (error) {
          toast.error('Erreur lors de la suppression du terrain!');
          console.error('Erreur lors de la suppression du terrain:', error);
        } finally {
          this.isDeleting = false;
        }
      },

      // Ouvrir la modale pour ajouter plusieurs terrains
      openAddMultipleFieldsModal() {
        this.multipleFieldsData.numberOfFields = 1;
        this.showMultipleFieldsModal = true;
      },

      // Fermer la modale pour ajouter plusieurs terrains
      closeMultipleFieldsModal() {
        this.showMultipleFieldsModal = false;
      },

      // Créer plusieurs terrains
      async handleMultipleFieldsSubmit() {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        // Vérifier le nombre de terrains à créer
        try {
          const numberOfFields = this.multipleFieldsData.numberOfFields;

          if (numberOfFields < 1) {
            toast.error(
              'Veuillez entrer un nombre valide de terrains à ajouter.'
            );
            return;
          }

          // Créer plusieurs terrains en 1 requête post
          await apiService.post(`/tourneys/${this.tourneyId}/fields/multiple`, {
            numberOfFields,
          });
          toast.success(`${numberOfFields} terrains créés avec succès !`);

          this.fetchFieldDetails();
          this.closeMultipleFieldsModal();
        } catch (error) {
          console.error('Erreur lors de la création des terrains:', error);
          toast.error('Erreur lors de la création des terrains.');
        } finally {
          this.isSubmitting = false;
        }
      },

      // Ouvrir la modale pour ajouter/modifier un terrain
      openAddFieldModal() {
        this.editingFieldId = null;
        this.newField = {
          name: '',
          description: '',
          tourneyId: this.tourneyId,
        };
        this.isFormValid = false;
        this.showModal = true;
      },

      // Ouvrir la modale pour modifier un terrain
      editField(field) {
        this.editingFieldId = field.id;
        this.newField = { ...field };
        this.isFormValid = true;
        this.showModal = true;
      },

      // Valider le formulaire
      validateForm() {
        this.isFormValid = !!this.newField.name;
      },

      // Gérer la soumission du formulaire
      handleFormSubmit() {
        this.validateForm();
        if (!this.isFormValid) return;
        this.isSubmitting = true;
        this.saveField();
      },

      // Enregistrer un terrain
      async saveField() {
        try {
          if (this.editingFieldId) {
            // Mettre à jour un terrain existant
            await apiService.put(
              `/tourneys/${this.tourneyId}/fields/${this.editingFieldId}`,
              this.newField
            );
            toast.success('Terrain modifié avec succès!');
          } else {
            // Créer un nouveau terrain
            await apiService.post(
              `/tourneys/${this.tourneyId}/fields`,
              this.newField
            );
            toast.success('Nouveau terrain ajouté avec succès!');
          }
          this.closeModal();
          this.fetchFieldDetails();
        } catch (error) {
          toast.error("Erreur lors de l'enregistrement du terrain!");
          console.error("Erreur lors de l'enregistrement du terrain:", error);
        } finally {
          this.isSubmitting = false;
        }
      },

      // Fermer la modale
      closeModal() {
        this.showModal = false;
        this.isSubmitting = false;
      },
    },
    watch: {
      // Observer les changements du formulaire pour valider
      newField: {
        handler() {
          this.validateForm();
        },
        deep: true,
      },
    },
    mounted() {
      this.fetchFieldDetails(); // Charger les détails des terrains
    },
  };
</script>

<style scoped></style>
