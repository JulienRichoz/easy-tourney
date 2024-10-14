<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <div class="p-6">
      <div class="flex items-center mb-8">
        <h1 class="text-3xl font-bold ml-4">Gestion Terrains</h1>
        <ButtonComponent @click="openAddMultipleFieldsModal" variant="primary"
          >Ajouter plusieurs terrains</ButtonComponent
        >
        <ButtonComponent
          v-if="fields.length > 0"
          @click="openDeleteAllFieldsModal"
          variant="danger"
          >Supprimer tous les terrains</ButtonComponent
        >
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
          @onDelete="confirmDeleteField(field.id)"
          @onEdit="editField(field)"
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
              <label class="block text-gray-700 font-semibold mb-2">
                Nombre de terrains
              </label>
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
      <ModalComponent
        :isVisible="showDeleteAllFieldsModal"
        title="Confirmer la suppression de tous les terrains"
        @close="closeDeleteAllFieldsModal"
        @submit="handleDeleteAllFieldsSubmit"
        confirmButtonText="Supprimer"
        confirmButtonVariant="danger"
        :confirmButtonDisabled="deleteAllConfirmation.trim() !== 'Oui'"
      >
        <template #content>
          <form @submit.prevent="handleDeleteAllFieldsSubmit">
            <p class="mb-4 text-red-600">
              Êtes-vous sûr de vouloir supprimer tous les terrains ? Cette
              action est irréversible et tous les terrains ainsi que les sports
              associés seront définitivement supprimés.
            </p>
            <div class="mb-4">
              <label class="block text-gray-700 font-semibold mb-2"
                >Tapez "Oui" pour confirmer</label
              >
              <input
                type="text"
                v-model="deleteAllConfirmation"
                class="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Oui"
              />
            </div>
          </form>
        </template>
      </ModalComponent>

      <!-- Confirmation de suppression -->
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
  import ModalComponent from '@/components/ModalComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import CardAddComponent from '@/components/CardAddComponent.vue';
  import CardEditComponent from '@/components/CardEditComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import truncateMixin from '@/mixins/truncateMixin';
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
    mixins: [truncateMixin],
    data() {
      return {
        tourneyId: this.$route.params.id, // ID du tournoi récupéré depuis l'URL
        fields: [], // Stocker les terrains récupérés
        showModal: false, // Gérer l'affichage de la modale
        showMultipleFieldsModal: false, // Gérer la modale pour plusieurs terrains
        showDeleteConfirmation: false, // Gérer la confirmation de suppression
        confirmedDeleteFieldId: null, // ID du terrain à supprimer
        showDeleteAllFieldsModal: false, // Gérer l'affichage de la modal de suppression
        deleteAllConfirmation: '', // Pour stocker la confirmation de suppression
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
          if (response.data && response.data.length > 0) {
            this.fields = response.data; // Si des terrains existent, on les stocke
          } else {
            // Si aucun terrain n'est trouvé, afficher un message
            this.fields = [];
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            // Gérer le cas où l'API renvoie une erreur 404 (aucun terrain trouvé)
            this.fields = [];
          } else {
            console.error(
              'Erreur lors de la récupération des détails du terrain:',
              error
            );
          }
        }
      },
      // Ouvrir la modal pour supprimer tous les terrains
      openDeleteAllFieldsModal() {
        this.deleteAllConfirmation = ''; // Réinitialiser la confirmation
        this.showDeleteAllFieldsModal = true;
      },

      // Fermer la modal pour supprimer tous les terrains
      closeDeleteAllFieldsModal() {
        this.showDeleteAllFieldsModal = false;
      },

      // Gestion de la soumission pour supprimer tous les terrains
      async handleDeleteAllFieldsSubmit() {
        if (this.isSubmitting) return;

        // Vérifie si l'utilisateur a bien tapé "Oui"
        if (this.deleteAllConfirmation.trim() !== 'Oui') {
          return;
        }

        this.isSubmitting = true;

        try {
          // Suppression de tous les terrains pour ce tournoi
          await apiService.delete(`/fields/tourneys/${this.tourneyId}/all`);
          this.fetchFieldDetails(); // Recharger les terrains après suppression
          this.closeDeleteAllFieldsModal(); // Fermer la modal
        } catch (error) {
          console.error(
            'Erreur lors de la suppression de tous les terrains:',
            error
          );
        } finally {
          this.isSubmitting = false;
        }
      },
      // Ouvrir la modal pour ajouter plusieurs terrains
      openAddMultipleFieldsModal() {
        this.numberOfFields = 1; // Initialiser à 1
        this.showMultipleFieldsModal = true;
      },

      // Fermer la modal pour ajouter plusieurs terrains
      closeMultipleFieldsModal() {
        this.showMultipleFieldsModal = false;
      },

      // Gestion de la soumission pour créer plusieurs terrains
      async handleMultipleFieldsSubmit() {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        try {
          // Boucler pour créer le nombre de terrains
          for (let i = 1; i <= this.numberOfFields; i++) {
            const fieldName = `Terrain ${i}`;
            const newField = {
              name: fieldName,
              description: '', // Pas de description par défaut
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
      confirmDeleteField(id) {
        this.confirmedDeleteFieldId = id;
        this.showDeleteConfirmation = true;
      },
      async deleteField(id) {
        if (this.isDeleting) return;
        this.isDeleting = true;
        try {
          await apiService.delete(`/fields/${id}`);
          this.closeDeleteConfirmation();
          this.fetchFieldDetails();
        } catch (error) {
          console.error('Erreur lors de la suppression du terrain:', error);
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
        this.confirmedDeleteFieldId = null;
      },
    },
    mounted() {
      this.fetchFieldDetails();
    },
  };
</script>

<style scoped></style>
