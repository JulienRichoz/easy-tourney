<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <div class="p-6">
      <div class="flex items-center mb-8">
        <TitleComponent title="Gestion Terrains" />
        <ButtonComponent @click="openAddMultipleFieldsModal" variant="primary">
          Ajouter plusieurs terrains
        </ButtonComponent>
        <ButtonComponent
          v-if="fields.length > 0"
          @click="openDeleteAllFieldsModal"
          variant="danger"
        >
          Supprimer tous les terrains
        </ButtonComponent>
      </div>

      <!-- Grille des terrains -->
      <div
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-h-[50px]"
      >
        <!-- Carte pour ajouter un nouveau terrain -->
        <CardAddComponent
          title="Terrain"
          @openAddElementModal="openAddFieldModal"
        />

        <!-- Cartes des terrains existants -->
        <CardEditComponent
          v-for="field in fields"
          :key="field.id"
          :title="field.name"
          :description="field.description"
          :subtitle="field.description"
          :hasActions="true"
          :showDeleteButton="true"
          :showEditButton="true"
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
            @form-submit="handleFormSubmit"
            @cancel="closeModal"
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
            @form-submit="handleMultipleFieldsSubmit"
            @cancel="closeMultipleFieldsModal"
          />
        </template>
      </ModalComponent>

      <!-- Modale pour confirmer la suppression de tous les terrains -->
      <DeleteConfirmationModal
        :isVisible="showDeleteAllFieldsModal"
        @cancel="closeDeleteAllFieldsModal"
        @confirm="handleDeleteAllFieldsSubmit"
        :isHardDelete="true"
        hardDeleteMessage="Cette action supprimera définitivement tous les terrains et les sports associés."
      />

      <!-- Confirmation de suppression individuelle -->
      <DeleteConfirmationModal
        :isVisible="showDeleteConfirmation"
        @cancel="closeDeleteConfirmation"
        @confirm="deleteField(confirmedDeleteFieldId)"
      />
    </div>
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import CardAddComponent from '@/components/CardAddComponent.vue';
  import CardEditComponent from '@/components/CardEditComponent.vue';
  import ModalComponent from '@/components/ModalComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import FormComponent from '@/components/FormComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';
  import TitleComponent from '@/components/TitleComponent.vue';
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
    },
    data() {
      return {
        tourneyId: this.$route.params.id,
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
    },
    methods: {
      async fetchFieldDetails() {
        try {
          const response = await apiService.get(
            `/fields/tourneys/${this.tourneyId}`
          );
          this.fields = response.data || [];
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du terrain:',
            error
          );
        }
      },
      openDeleteAllFieldsModal() {
        this.showDeleteAllFieldsModal = true;
      },
      closeDeleteAllFieldsModal() {
        this.showDeleteAllFieldsModal = false;
      },
      async handleDeleteAllFieldsSubmit() {
        if (this.isDeleting) return;
        this.isDeleting = true;

        try {
          await apiService.delete(`/fields/tourneys/${this.tourneyId}/all`);
          toast.success('Tous les terrains ont été supprimés avec succès!');
          this.fetchFieldDetails();
          this.closeDeleteAllFieldsModal();
        } catch (error) {
          toast.error(
            'Erreur lors de la suppression de tous les terrains:',
            error
          );
        } finally {
          this.isDeleting = false;
        }
      },
      confirmDeleteField(id) {
        this.confirmedDeleteFieldId = id;
        this.showDeleteConfirmation = true;
      },
      closeDeleteConfirmation() {
        this.showDeleteConfirmation = false;
        this.confirmedDeleteFieldId = null;
      },
      async deleteField(id) {
        if (this.isDeleting) return;
        this.isDeleting = true;

        try {
          await apiService.delete(`/fields/${id}`);
          toast.success('Terrain supprimé avec succès!');
          this.fetchFieldDetails();
          this.closeDeleteConfirmation();
        } catch (error) {
          toast.error('Erreur lors de la suppression du terrain!');
        } finally {
          this.isDeleting = false;
        }
      },
      openAddMultipleFieldsModal() {
        this.multipleFieldsData.numberOfFields = 1;
        this.showMultipleFieldsModal = true;
      },
      closeMultipleFieldsModal() {
        this.showMultipleFieldsModal = false;
      },
      async handleMultipleFieldsSubmit() {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        try {
          const numberOfFields = this.multipleFieldsData.numberOfFields;

          if (numberOfFields < 1) {
            toast.error(
              'Veuillez entrer un nombre valide de terrains à ajouter.'
            );
            return;
          }
          for (let i = 1; i <= this.multipleFieldsData.numberOfFields; i++) {
            const newField = {
              name: `Terrain ${i}`,
              description: '',
              tourneyId: this.tourneyId,
            };
            await apiService.post(`/fields`, newField);
          }
          this.fetchFieldDetails();
          this.closeMultipleFieldsModal();
        } catch (error) {
          console.error('Erreur lors de la création des terrains:', error);
        } finally {
          this.isSubmitting = false;
        }
      },
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
      editField(field) {
        this.editingFieldId = field.id;
        this.newField = { ...field };
        this.isFormValid = true;
        this.showModal = true;
      },
      validateForm() {
        this.isFormValid = !!this.newField.name;
      },

      handleFormSubmit() {
        this.validateForm();
        if (!this.isFormValid) return;
        this.isSubmitting = true;
        this.saveField();
      },

      async saveField() {
        try {
          if (this.editingFieldId) {
            await apiService.put(
              `/fields/${this.editingFieldId}`,
              this.newField
            );
            toast.success('Terrain modifié avec succès!');
          } else {
            await apiService.post(`/fields`, this.newField);
            toast.success('Nouveau terrain ajouté avec succès!');
          }
          this.closeModal();
          this.fetchFieldDetails();
        } catch (error) {
          toast.error("Erreur lors de l'enregistrement du terrain!");
        } finally {
          this.isSubmitting = false;
        }
      },
      closeModal() {
        this.showModal = false;
        this.isSubmitting = false;
      },
    },
    watch: {
      newField: {
        handler() {
          this.validateForm();
        },
        deep: true,
      },
    },
    mounted() {
      this.fetchFieldDetails();
    },
  };
</script>

<style scoped></style>
