<!-- TourneyPools.vue -->
<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <div class="p-6">
      <div class="flex items-center mb-8 justify-between">
        <div class="flex items-center">
          <TitleComponent title="Gestion des Pools"></TitleComponent>
          <!-- Bouton Réglages -->
          <ButtonComponent
            v-if="isEditable"
            fontAwesomeIcon="cog"
            @click="openPoolSetupModal"
            variant="secondary"
            class="ml-2"
          >
            <span class="hidden sm:inline">Réglages Pools</span>
          </ButtonComponent>
          <!-- Bouton pour assigner les équipes aux pools -->
          <ButtonComponent
            v-if="isEditable && pools.length > 0 && teams.length > 0"
            @click="navigateToAssignTeams"
            variant="primary"
            fontAwesomeIcon="users"
            class="ml-2"
          >
            <span class="hidden sm:inline">Assigner Équipes</span>
          </ButtonComponent>
        </div>

        <!-- Sélecteur de statut pour les pools -->
        <div class="flex items-center">
          <StatusSelectorComponent
            :tourneyId="tourneyId"
            label="Pools:"
            statusKey="poolAssignmentStatus"
            :statusOptions="poolStatusOptions"
          />
        </div>
      </div>

      <!-- Grille d'affichage des pools -->
      <div
        class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4 mt-6"
      >
        <!-- Carte pour ajouter une nouvelle pool -->
        <CardAddComponent
          v-if="isEditable"
          title="Pool"
          @openAddElementModal="openAddPoolModal"
        />

        <!-- Cartes des pools existantes -->
        <CardEditComponent
          v-for="pool in pools"
          :key="pool.id"
          :title="pool.name"
          :cornerCount="`${pool.teams.length} Équipes`"
          :showDeleteButton="isEditable"
          :showEditButton="isEditable"
          @delete="confirmDeletePool(pool.id)"
          @edit="editPool(pool)"
          @click="openPoolDetails(pool)"
        >
          <!-- Liste des équipes dans la pool -->
          <template #user-list>
            <ul class="grid grid-cols-1 gap-2 mt-2">
              <li
                v-for="team in pool.teams.slice(0, 4)"
                :key="team.id"
                class="flex items-center text-sm text-light-form-text dark:text-dark-form-text truncate"
              >
                <font-awesome-icon icon="users" class="mr-2 text-gray-500" />
                <span class="truncate">{{ team.teamName }}</span>
              </li>
              <li v-if="pool.teams.length > 4" class="text-sm text-gray-500">
                + {{ pool.teams.length - 4 }} autres
              </li>
            </ul>
          </template>
        </CardEditComponent>
      </div>

      <!-- Modale pour ajouter/modifier une pool -->
      <ModalComponent
        :isVisible="showModal"
        :title="editingPoolId ? 'Modifier Pool' : 'Ajouter une nouvelle Pool'"
        @close="closeModal"
      >
        <template #content>
          <FormComponent
            v-model="newPool"
            :fields="formFields"
            :isEditing="!!editingPoolId"
            @form-submit="handleFormSubmit"
            @cancel="closeModal"
          />
        </template>
      </ModalComponent>

      <!-- Modale de confirmation pour supprimer une pool -->
      <DeleteConfirmationModal
        :isVisible="showDeleteConfirmation"
        :isHardDelete="false"
        @cancel="closeDeleteConfirmation"
        @confirm="deletePool(confirmedDeletePoolId)"
      />

      <!-- Modale pour modifier les réglages des pools -->
      <ModalComponent
        :isVisible="showPoolSetupModal"
        :title="'Réglages des Pools'"
        @close="closePoolSetupModal"
      >
        <template #content>
          <!-- Formulaire de configuration des pools -->
          <FormComponent
            v-model="localPoolSetup"
            :fields="poolSetupFields"
            :isEditing="true"
            @form-submit="handlePoolSetupSubmit"
            @cancel="closePoolSetupModal"
            :customValidation="customPoolSetupValidation"
          />
        </template>
      </ModalComponent>
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
        tourneyId: this.$route.params.tourneyId, // Récupération du tourneyId depuis les params
        pools: [], // Liste des pools
        teams: [], // Liste des équipes du tournoi
        showModal: false,
        showDeleteConfirmation: false,
        showPoolSetupModal: false,
        confirmedDeletePoolId: null,
        newPool: {
          name: '',
          tourneyId: this.$route.params.tourneyId,
        },
        editingPoolId: null,
        isSubmitting: false,
        localPoolSetup: {
          minTeamPerPool: null,
          maxTeamPerPool: null,
        },
        poolSetupFields: [
          {
            name: 'minTeamPerPool',
            label: "Nombre minimum d'équipes par pool",
            type: 'number',
            required: true,
          },
          {
            name: 'maxTeamPerPool',
            label: "Nombre maximum d'équipes par pool",
            type: 'number',
            required: true,
          },
        ],
        poolStatusOptions: [
          { value: 'notStarted', label: 'Non commencé' },
          { value: 'draft', label: 'En cours' },
          { value: 'completed', label: 'Terminé' },
        ],
      };
    },
    computed: {
      ...mapState('tourney', {
        statuses: (state) => state.statuses,
      }),
      isEditable() {
        return (
          this.statuses.poolAssignmentStatus !== 'completed' &&
          this.statuses.status !== 'completed'
        );
      },
    },
    methods: {
      // Mapper les actions du module `tourney`
      ...mapActions('tourney', ['fetchTourneyStatuses']),
      // Récupérer les pools du tournoi
      async fetchPools() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/pools`
          );
          this.pools = response.data;
        } catch (error) {
          console.error('Erreur lors de la récupération des pools:', error);
          toast.error('Erreur lors de la récupération des pools.');
        }
      },
      // Récupérer les équipes du tournoi
      async fetchTeams() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/teams`
          );
          this.teams = response.data.filter((team) => team.type === 'player');
        } catch (error) {
          console.error('Erreur lors de la récupération des équipes:', error);
          toast.error('Erreur lors de la récupération des équipes.');
        }
      },
      openAddPoolModal() {
        this.editingPoolId = null;
        this.newPool = {
          name: '',
          tourneyId: this.tourneyId,
        };
        this.showModal = true;
      },
      editPool(pool) {
        this.editingPoolId = pool.id;
        this.newPool = { ...pool };
        this.showModal = true;
      },
      openPoolDetails(pool) {
        // Rediriger vers la page d'une pool pour assigner les équipes (à implémenter)
        this.$router.push(
          `/admin/tourneys/${this.tourneyId}/pools/${pool.id}/teams`
        );
      },
      confirmDeletePool(id) {
        this.confirmedDeletePoolId = id;
        this.showDeleteConfirmation = true;
      },
      closeDeleteConfirmation() {
        this.showDeleteConfirmation = false;
        this.confirmedDeletePoolId = null;
      },
      closeModal() {
        this.showModal = false;
        this.editingPoolId = null;
      },
      async deletePool(id) {
        try {
          await apiService.delete(`/tourneys/${this.tourneyId}/pools/${id}`);
          toast.success('Pool supprimée avec succès !');
          this.fetchPools(); // Récupérer les données mises à jour
          this.closeDeleteConfirmation();
        } catch (error) {
          toast.error('Erreur lors de la suppression de la pool.');
        }
      },
      async handleFormSubmit() {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        try {
          const payload = {
            name: this.newPool.name,
            tourneyId: this.tourneyId,
          };

          if (this.editingPoolId) {
            await apiService.put(
              `/tourneys/${this.tourneyId}/pools/${this.editingPoolId}`,
              payload
            );
          } else {
            await apiService.post(`/tourneys/${this.tourneyId}/pools`, payload);
          }

          toast.success(
            `Pool ${this.editingPoolId ? 'modifiée' : 'ajoutée'} avec succès !`
          );
          this.fetchPools(); // Récupérer les données mises à jour
        } catch (error) {
          console.error("Erreur lors de l'enregistrement de la pool:", error);
          toast.error("Erreur lors de l'enregistrement de la pool.");
        } finally {
          this.isSubmitting = false;
          this.closeModal();
        }
      },
      // Ouvrir la modale de réglages des pools
      openPoolSetupModal() {
        // Récupérer les réglages actuels depuis le teamSetup
        this.localPoolSetup = {
          minTeamPerPool: this.teamSetup.minTeamPerPool || null,
          maxTeamPerPool: this.teamSetup.maxTeamPerPool || null,
        };
        this.showPoolSetupModal = true;
      },
      closePoolSetupModal() {
        this.showPoolSetupModal = false;
      },
      async handlePoolSetupSubmit() {
        try {
          await apiService.patch(
            `/tourneys/${this.tourneyId}/team-setup`,
            this.localPoolSetup
          );
          toast.success('Réglages des pools mis à jour avec succès !');
          this.closePoolSetupModal();
        } catch (error) {
          console.error(
            'Erreur lors de la mise à jour des réglages des pools:',
            error
          );
          toast.error('Erreur lors de la mise à jour des réglages des pools.');
        }
      },
      customPoolSetupValidation() {
        const errors = {};
        const { minTeamPerPool, maxTeamPerPool } = this.localPoolSetup;

        if (minTeamPerPool > maxTeamPerPool) {
          errors.minTeamPerPool =
            'Le nombre minimum doit être inférieur ou égal au nombre maximum.';
        }

        return errors;
      },
      async fetchTeamSetup() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/team-setup`
          );
          this.teamSetup = response.data;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération de la configuration des équipes:',
            error
          );
          toast.error(
            'Erreur lors de la récupération de la configuration des équipes.'
          );
        }
      },
      navigateToAssignTeams() {
        // Rediriger vers la page pour assigner les équipes aux pools (à implémenter)
        this.$router.push(
          `/admin/tourneys/${this.tourneyId}/assign-teams-to-pools`
        );
      },
    },
    mounted() {
      this.fetchTourneyStatuses(this.tourneyId);
      this.fetchPools();
      this.fetchTeams();
      this.fetchTeamSetup();
    },
  };
</script>

<style scoped>
  /* Géré par Tailwind CSS */
</style>
