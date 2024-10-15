<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <div class="p-6">
      <div class="flex items-center mb-8">
        <h1 class="text-3xl font-bold ml-4">Gestion Terrains</h1>
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
          :subtitle="field.description"
          :showDeleteButton="true"
          :showEditButton="true"
          @click="editField(field)"
          @onDelete.stop="confirmDeleteField(field.id)"
          @onEdit.stop="editField(field)"
        />
      </div>

      <!-- Modale pour ajouter/modifier un terrain -->
      <ModalComponent
        :isVisible="showModal"
        :title="
          editingFieldId ? 'Modifier le Terrain' : 'Ajouter un Nouveau Terrain'
        "
        :isEditing="!!editingFieldId"
        @close="closeModal"
        @submit="handleFormSubmit"
      >
        <template #content>
          <form @submit.prevent="handleFormSubmit">
            <div class="mb-4">
              <label class="block text-gray-700 font-semibold mb-2"
                >Nom du terrain</label
              >
              <input
                type="text"
                v-model="newField.name"
                :class="[
                  'w-full p-2 border rounded-md',
                  nameError ? 'border-red-500' : 'border-gray-300',
                ]"
                required
              />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 font-semibold mb-2"
                >Description du terrain</label
              >
              <textarea
                v-model="newField.description"
                class="w-full p-2 border border-gray-300 rounded-md"
              ></textarea>
            </div>
          </form>
        </template>
      </ModalComponent>

      <!-- Modale pour ajouter plusieurs terrains -->
      <ModalComponent
        :isVisible="showMultipleFieldsModal"
        title="Ajouter plusieurs terrains"
        @close="closeMultipleFieldsModal"
        @submit="handleMultipleFieldsSubmit"
      >
        <template #content>
          <form @submit.prevent="handleMultipleFieldsSubmit">
            <div class="mb-4">
              <label class="block text-gray-700 font-semibold mb-2"
                >Nombre de terrains</label
              >
              <input
                type="number"
                v-model="numberOfFields"
                class="w-full p-2 border rounded-md"
                required
                min="1"
              />
            </div>
          </form>
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

  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';

  export default {
    components: {
      ModalComponent,
      ButtonComponent,
      DeleteConfirmationModal,
      TourneySubMenu,
      CardAddComponent,
      CardEditComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.id, // ID du tournoi récupéré depuis l'URL
        fields: [], // Stocker les terrains récupérés
        showModal: false, // Gérer l'affichage de la modale
        showMultipleFieldsModal: false, // Gérer la modale pour plusieurs terrains
        showDeleteConfirmation: false, // Gérer la confirmation de suppression individuelle
        confirmedDeleteFieldId: null, // ID du terrain à supprimer individuellement
        showDeleteAllFieldsModal: false, // Gérer la confirmation de suppression complète
        deleteAllConfirmation: '', // Pour stocker la confirmation de suppression de tous les terrains
        newField: {
          name: '',
          description: '',
        },
        editingFieldId: null, // ID du terrain en cours de modification
        nameError: false,
        isSubmitting: false,
        isDeleting: false,
        numberOfFields: 1, // Nombre de terrains à ajouter
      };
    },
    methods: {
      // Récupérer les détails des terrains d'un tournoi
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
      // Ouvrir la modal pour supprimer tous les terrains
      openDeleteAllFieldsModal() {
        this.showDeleteAllFieldsModal = true;
      },
      closeDeleteAllFieldsModal() {
        this.showDeleteAllFieldsModal = false;
      },

      // Gestion de la suppression de tous les terrains
      async handleDeleteAllFieldsSubmit() {
        if (this.isDeleting) return;
        this.isDeleting = true;

        try {
          await apiService.delete(`/fields/tourneys/${this.tourneyId}/all`);
          this.fetchFieldDetails(); // Recharger les terrains après suppression
          this.closeDeleteAllFieldsModal(); // Fermer la modal
        } catch (error) {
          console.error(
            'Erreur lors de la suppression de tous les terrains:',
            error
          );
        } finally {
          this.isDeleting = false;
        }
      },
      // Ouvrir la confirmation de suppression pour un terrain spécifique
      confirmDeleteField(id) {
        console.log('confirmDeleteField', id);
        this.confirmedDeleteFieldId = id;
        this.showDeleteConfirmation = true;
      },
      closeDeleteConfirmation() {
        this.showDeleteConfirmation = false;
        this.confirmedDeleteFieldId = null;
      },
      // Gestion de la suppression individuelle d'un terrain
      async deleteField(id) {
        if (this.isDeleting) return;
        this.isDeleting = true;

        try {
          await apiService.delete(`/fields/${id}`);
          this.fetchFieldDetails(); // Recharger les terrains après suppression
          this.closeDeleteConfirmation(); // Fermer la modal
        } catch (error) {
          console.error('Erreur lors de la suppression du terrain:', error);
        } finally {
          this.isDeleting = false;
        }
      },
      // Ouvrir la modal pour ajouter plusieurs terrains
      openAddMultipleFieldsModal() {
        this.numberOfFields = 1; // Initialiser à 1
        this.showMultipleFieldsModal = true;
      },
      closeMultipleFieldsModal() {
        this.showMultipleFieldsModal = false;
      },

      // Gestion de la soumission pour ajouter plusieurs terrains
      async handleMultipleFieldsSubmit() {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        try {
          // Boucler pour créer le nombre de terrains
          for (let i = 1; i <= this.numberOfFields; i++) {
            const newField = {
              name: `Terrain ${i}`,
              description: '',
              tourneyId: this.tourneyId,
            };
            await apiService.post(`/fields`, newField);
          }
          this.fetchFieldDetails(); // Recharger les terrains
          this.closeMultipleFieldsModal(); // Fermer la modal
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
        this.nameError = false;
        this.showModal = true;
      },
      editField(field) {
        console.log('editField', field);
        this.editingFieldId = field.id;
        this.newField = { ...field };
        this.showModal = true;
      },
      handleFormSubmit() {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        this.saveField();
      },
      async saveField() {
        try {
          if (this.editingFieldId) {
            // Mettre à jour le terrain
            await apiService.put(
              `/fields/${this.editingFieldId}`,
              this.newField
            );
          } else {
            // Créer un nouveau terrain
            await apiService.post(`/fields`, this.newField);
          }
          this.closeModal();
          this.fetchFieldDetails();
        } catch (error) {
          console.error('Erreur lors de la sauvegarde du terrain:', error);
        } finally {
          this.isSubmitting = false;
        }
      },
      closeModal() {
        this.showModal = false;
        this.isSubmitting = false;
      },
    },
    mounted() {
      this.fetchFieldDetails();
    },
  };
</script>

<style scoped></style>
