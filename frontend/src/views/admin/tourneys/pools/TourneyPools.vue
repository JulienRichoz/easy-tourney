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
            <span class="hidden sm:inline">Global Config Pools</span>
          </ButtonComponent>

          <!-- Bouton de génération des pools -->
          <div class="flex justify-end">
            <ButtonComponent
              v-if="isEditable"
              variant="algo"
              fontAwesomeIcon="cog"
              @click="openGeneratePoolsModal"
            >
              <span class="hidden sm:inline"> Générer Pools auto. </span>
            </ButtonComponent>
          </div>
          <!-- Bouton pour supprimer toutes les pools -->
          <ButtonComponent
            v-if="isEditable && pools.length > 0"
            variant="danger"
            fontAwesomeIcon="trash"
            @click="confirmDeleteAllPools"
          >
            <span class="hidden sm:inline"> Supprimer les Pools </span>
          </ButtonComponent>
        </div>

        <!-- Sélecteur de statut pour les pools -->
        <div class="flex items-center">
          <StatusSelectorComponent
            :tourneyId="tourneyId"
            label="Pools:"
            statusKey="poolStatus"
            :statusOptions="poolStatusOptions"
          />
        </div>
      </div>

      <!-- Conteneur pour les informations générales -->
      <div class="mb-4 p-4 bg-blue-100 border border-blue-200 rounded-lg">
        <p class="text-base text-blue-800">
          <strong>Total d'équipes :</strong> {{ teams.length }} &emsp;
          <strong>Terrains disponibles :</strong>
          {{ availableFields }}
        </p>
        <!-- Message d'avertissement conditionnel pour customRoundRobin -->
        <p
          v-if="tourneyType === 'customRoundRobin' && warningMessage"
          class="mt-4 text-sm text-red-600"
        >
          {{ warningMessage }}
        </p>
        <p
          v-if="
            tourneySetup &&
            tourneyType === 'customRoundRobin' &&
            shouldShowFieldWarning
          "
          class="mt-4 text-sm text-orange-600"
        >
          Vous avez {{ availableFields }} terrains disponibles, mais le nombre
          maximum de pools est configuré à {{ tourneySetup.maxNumberOfPools }}.
          Assurez-vous que c'est bien ce que vous souhaitez.
        </p>
      </div>

      <!-- Filtre pour les pools -->
      <div class="flex items-center space-x-2 w-full md:w-auto">
        <FilterComponent
          :filters="filters"
          @filter-change="handleFilterChange"
        />
        <!-- Bouton pour assigner les équipes aux pools -->
        <ButtonComponent
          v-if="isEditable && unassignedTeams.length > 0"
          @click="navigateToAssignTeams"
          variant="primary"
          fontAwesomeIcon="users"
          class="ml-2"
        >
          <span class="hidden sm:inline">
            Assigner Équipes ({{ unassignedTeams.length }})
          </span>
        </ButtonComponent>
      </div>
      <!-- Grille d'affichage des pools -->
      <div
        class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4 mt-6"
      >
        <!-- Carte pour ajouter une nouvelle pool -->
        <CardAddComponent
          v-if="isEditable && canAddMorePools"
          title="Pool"
          @openAddElementModal="openAddPoolModal"
        />

        <!-- Cartes des pools existantes -->
        <CardEditComponent
          v-for="pool in filteredPools"
          :key="pool.id"
          :title="pool.name"
          :cornerCount="`${pool.teams.length} Équipes`"
          :titleColor="getPoolStatusColor(pool)"
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
            <!-- Afficher le nombre de sessions -->
            <div class="mt-2 text-sm text-gray-500">
              Sessions programmées : {{ pool.schedulesCount || 0 }}
            </div>
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

      <!-- Modale pour générer des pools selon le DP strategy-->
      <StrategyPoolGeneratorComponent
        v-if="showGeneratePoolsModal"
        :tourneyId="tourneyId"
        :tourneyType="tourneyType"
        :teams="teams"
        :pools="pools"
        :availableFields="availableFields"
        @poolsGenerated="handlePoolsGenerated"
        @close="closeGeneratePoolsModal"
      />

      <!-- Modale de confirmation pour supprimer toutes les pools -->
      <DeleteConfirmationModal
        :isVisible="showDeleteAllConfirmation"
        :isHardDelete="false"
        @cancel="closeDeleteAllConfirmation"
        @confirm="deleteAllPools"
      >
        <template #message>
          Êtes-vous sûr de vouloir supprimer toutes les pools ? Cette action est
          irréversible.
        </template>
      </DeleteConfirmationModal>
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
  import FilterComponent from '@/components/FilterComponent.vue';
  import StrategyPoolGeneratorComponent from '@/components/StrategyPattern/Pool/StrategyPoolGeneratorComponent.vue';

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
      FilterComponent,
      StrategyPoolGeneratorComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId, // Récupération du tourneyId depuis les params
        pools: [], // Liste des pools
        teams: [], // Liste des équipes du tournoi
        warningMessage: '',
        selectedStatus: this.currentStatus,
        showModal: false,
        showDeleteConfirmation: false,
        showDeleteAllConfirmation: false,
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
        showGeneratePoolsModal: false,
        availableFields: 0,
        desiredPoolCount: null,
        tourneySetup: {
          maxNumberOfPools: 0, // Valeur par défaut
          defaultMinTeamPerPool: 0, // Valeur par défaut
          defaultMaxTeamPerPool: 0, // Valeur par défaut
        },
        formFields: [
          {
            name: 'name',
            label: 'Nom de la Pool',
            type: 'text',
            required: true,
          },
          {
            name: 'stage',
            label: 'Stade',
            placeholder: 'Demi-finale, Finale, etc.',
            type: 'text',
            required: false,
          },
          {
            name: 'maxTeamPerPool',
            label: "Nombre maximum d'équipes par pool",
            type: 'number',
            required: false,
          },
          {
            name: 'minTeamPerPool',
            label: "Nombre minimum d'équipes par pool",
            type: 'number',
            required: false,
          },
        ],
        poolSetupFields: [
          {
            name: 'maxNumberOfPools',
            label: 'Nombre maximum de pools',
            type: 'number',
            required: true,
          },
          {
            name: 'defaultMinTeamPerPool',
            label: "Nombre min. d'équipes par pool",
            type: 'number',
            required: true,
          },
          {
            name: 'defaultMaxTeamPerPool',
            label: "Nombre max. d'équipes par pool",
            type: 'number',
            required: true,
          },
        ],
        poolStatusOptions: [
          { value: 'draft', label: 'Edition' },
          { value: 'completed', label: 'Terminé' },
        ],
        filters: [
          {
            label: 'Pools',
            value: '',
            options: [
              { label: 'Toutes les Pools', value: '' },
              { label: 'Valides', value: 'valid' },
              { label: 'Invalides', value: 'partial' },
              { label: 'Vides', value: 'empty' },
            ],
          },
        ],
      };
    },
    computed: {
      ...mapState('tourney', {
        statuses: (state) => state.statuses,
        tourneyType: (state) => state.tourneyType,
      }),
      isEditable() {
        return this.statuses.poolStatus !== 'completed';
      },
      unassignedTeams() {
        return this.teams.filter((team) => !team.poolId);
      },
      shouldShowFieldWarning() {
        const maxNumberOfPools = this.tourneySetup?.maxNumberOfPools || 0;
        return this.availableFields > maxNumberOfPools;
      },
      canAddMorePools() {
        const maxNumberOfPools = this.tourneySetup?.maxNumberOfPools || 0;
        return this.pools.length < maxNumberOfPools;
      },
      filteredPools() {
        return this.pools.filter((pool) => {
          const minTeams =
            pool.minTeamPerPool ||
            this.tourneySetup?.defaultMinTeamPerPool ||
            0;

          if (this.filters[0].value === 'valid') {
            return pool.teams.length >= minTeams;
          }
          if (this.filters[0].value === 'partial') {
            return pool.teams.length > 0 && pool.teams.length < minTeams;
          }
          if (this.filters[0].value === 'empty') {
            return pool.teams.length === 0;
          }
          return true;
        });
      },
    },
    methods: {
      // Mapper les actions du module `tourney`
      ...mapActions('tourney', ['fetchTourneyStatuses']),
      // Récupérer les pools du tournoi
      async fetchTourneyPoolsDetails() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/pools-details`
          );
          const { pools, teams, tourneySetup } = response.data;
          this.pools = pools.map((pool) => ({
            ...pool,
            schedulesCount: pool.schedules ? pool.schedules.length : 0,
          }));
          this.teams = teams;
          this.tourneySetup = tourneySetup;
          this.calculateWarningMessage();
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails des pools:',
            error
          );
          toast.error('Erreur lors de la récupération des détails des pools.');
        }
      },
      async fetchAvailableFields() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/fields`
          );
          const fields = response.data;
          this.availableFields = fields.length;
        } catch (error) {
          console.error('Erreur lors de la récupération des terrains:', error);
          toast.error('Erreur lors de la récupération des terrains.');
        }
      },
      // Calculer le message d'avertissement si nécessaire
      calculateWarningMessage() {
        if (this.tourneyType === 'customRoundRobin') {
          const maxTeamsPerPool = this.tourneySetup.defaultMaxTeamPerPool || 6;
          const optimalPools = Math.ceil(this.teams.length / maxTeamsPerPool);

          if (this.availableFields < optimalPools) {
            const neededFields = optimalPools - this.availableFields;
            this.warningMessage = `Avec ${this.availableFields} terrains disponibles et ${this.teams.length} équipes: risque de temps d'attente. Nous vous recommandons d'ajouter ${neededFields} terrain(s) supplémentaire(s) pour améliorer la fluidité du tournoi, ou de réduire les équipes (plus complexes si les joueurs sont déjà inscrits).`;
          } else {
            this.warningMessage = '';
          }
        }
      },
      handleFilterChange(filter) {
        this.filters[0].value = filter.value;
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
        this.$router.push(`/admin/tourneys/${this.tourneyId}/pools/${pool.id}`);
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
          this.fetchTourneyPoolsDetails(); // Récupérer les données mises à jour
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
            stage: this.newPool.stage,
            maxTeamPerPool: this.newPool.maxTeamPerPool,
            minTeamPerPool: this.newPool.minTeamPerPool,
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
          this.fetchTourneyPoolsDetails(); // Récupérer les données mises à jour
        } catch (error) {
          console.error("Erreur lors de l'enregistrement de la pool:", error);
          toast.error("Erreur lors de l'enregistrement de la pool.");
        } finally {
          this.isSubmitting = false;
          this.closeModal();
        }
      },

      confirmDeleteAllPools() {
        this.showDeleteAllConfirmation = true;
      },
      closeDeleteAllConfirmation() {
        this.showDeleteAllConfirmation = false;
      },
      async deleteAllPools() {
        try {
          await apiService.delete(`/tourneys/${this.tourneyId}/pools/reset`);
          toast.success('Toutes les pools ont été supprimées avec succès !');
          this.fetchTourneyPoolsDetails();
        } catch (error) {
          toast.error('Erreur lors de la suppression des pools.');
        } finally {
          this.closeDeleteAllConfirmation();
        }
      },
      // Ouvrir la modale de réglages des pools
      openPoolSetupModal() {
        this.localPoolSetup = {
          maxNumberOfPools: this.tourneySetup.maxNumberOfPools || null,
          defaultMinTeamPerPool:
            this.tourneySetup.defaultMinTeamPerPool || null,
          defaultMaxTeamPerPool:
            this.tourneySetup.defaultMaxTeamPerPool || null,
        };
        this.showPoolSetupModal = true;
      },
      closePoolSetupModal() {
        this.showPoolSetupModal = false;
      },
      async handlePoolSetupSubmit() {
        try {
          await apiService.put(
            `/tourneys/${this.tourneyId}`,
            this.localPoolSetup
          );
          // Mettez à jour tourneySetup avec les nouvelles valeurs
          this.tourneySetup = { ...this.tourneySetup, ...this.localPoolSetup };
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
      navigateToAssignTeams() {
        // Rediriger vers la page pour assigner les équipes aux pools (à implémenter)
        this.$router.push(
          `/admin/tourneys/${this.tourneyId}/assign-teams-to-pools`
        );
      },

      // Ajouter pastille de couleur pour indiquer l'état du Pool
      getPoolStatusColor(pool) {
        const minTeams =
          pool.minTeamPerPool || this.tourneySetup?.defaultMinTeamPerPool || 0;
        if (pool.teams.length >= minTeams) {
          return 'green'; // Valide
        } else if (pool.teams.length > 0) {
          return 'orange'; // Partielle
        } else {
          return 'gray'; // Vide
        }
      },

      // Pool generation
      openGeneratePoolsModal() {
        this.showGeneratePoolsModal = true;
      },
      closeGeneratePoolsModal() {
        this.showGeneratePoolsModal = false;
      },
      async generatePools() {
        if (!this.desiredPoolCount || this.desiredPoolCount < 1) {
          return toast.error('Veuillez entrer un nombre valide de pools.');
        }

        try {
          // Appel à l'API ou logique pour générer les pools
          await apiService.post(`/tourneys/${this.tourneyId}/pools/generate`, {
            poolCount: this.desiredPoolCount,
          });

          toast.success('Pools générés avec succès !');
          this.closeGeneratePoolsModal();
        } catch (error) {
          console.error('Erreur lors de la génération des pools :', error);
          toast.error('Erreur lors de la génération des pools.');
        }
      },

      // rafraîchit les données des pools en appelant fetchTourneyPoolsDetails() et ferme la modale en appelant closeGeneratePoolsModal().
      handlePoolsGenerated() {
        this.fetchTourneyPoolsDetails();
        this.closeGeneratePoolsModal();
      },
    },
    mounted() {
      this.fetchTourneyStatuses(this.tourneyId);
      this.fetchTourneyPoolsDetails();
      this.fetchAvailableFields();
    },
  };
</script>

<style scoped>
  /* Géré par Tailwind CSS */
</style>
