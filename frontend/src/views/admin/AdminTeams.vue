<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />
    <div class="p-4">
      <!-- Section Supérieure -->
      <div class="flex flex-wrap items-center justify-between mb-4">
        <!-- Icône Paramètres et Boutons -->
        <div class="flex items-center">
          <!-- Icône Paramètres -->
          <ButtonComponent variant="secondary" @click="openTeamSetupModal">
            <CogIcon class="w-5 h-5 mr-2" />
            Paramètres
          </ButtonComponent>

          <!-- Bouton Générer les Équipes -->
          <ButtonComponent
            variant="primary"
            :disabled="!isTeamSetupConfigured"
            @click="generateTeams"
            class="ml-2"
          >
            Générer les équipes
          </ButtonComponent>

          <!-- Bouton Supprimer Toutes les Équipes -->
          <ButtonComponent
            variant="danger"
            @click="confirmDeleteAllTeams"
            class="ml-2"
          >
            Supprimer toutes les équipes
          </ButtonComponent>
        </div>

        <!-- Filtres -->
        <FilterComponent :filters="filters" @filter-change="onFilterChange" />
      </div>

      <!-- Contenu Principal : Cartes des Équipes -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <!-- Carte des Utilisateurs Non Assignés (Invités) -->
        <CardEditComponent
          title="Non assignés"
          :description="`${unassignedUsers.length} utilisateurs`"
          :status="'unassigned'"
          @click="openUnassignedUsers"
        >
          <template #additional-content>
            <ul class="mt-2">
              <li
                v-for="user in unassignedUsers.slice(0, 5)"
                :key="user.id"
                class="text-light-form-text dark:text-dark-form-text"
              >
                {{ user.name }}
              </li>
            </ul>
            <div v-if="unassignedUsers.length > 5" class="text-sm mt-2">
              et {{ unassignedUsers.length - 5 }} autres...
            </div>
          </template>
        </CardEditComponent>

        <!-- Cartes des Équipes -->
        <CardEditComponent
          v-for="team in filteredTeams"
          :key="team.id"
          :title="team.teamName"
          :description="teamDescription(team)"
          :status="teamStatus(team)"
          @click="openTeamDetail(team)"
        >
          <!-- Contenu Additionnel -->
          <template #additional-content>
            <ul class="mt-2">
              <li
                v-for="member in team.members"
                :key="member.id"
                class="text-light-form-text dark:text-dark-form-text"
              >
                {{ member.name }}
              </li>
            </ul>
          </template>
        </CardEditComponent>
      </div>

      <!-- Modales -->
      <ModalComponent
        v-if="isTeamSetupModalVisible"
        :isVisible="isTeamSetupModalVisible"
        title="Paramètres des équipes"
        @close="closeTeamSetupModal"
      >
        <template #content>
          <!-- Formulaire TeamSetup -->
          <FormComponent
            :fields="teamSetupFields"
            v-model="teamSetupData"
            @form-submit="saveTeamSetup"
            @cancel="closeTeamSetupModal"
          />
        </template>
      </ModalComponent>

      <DeleteConfirmationModal
        v-if="isDeleteAllTeamsModalVisible"
        :isVisible="isDeleteAllTeamsModalVisible"
        title="Confirmer la suppression de toutes les équipes"
        message="Êtes-vous sûr de vouloir supprimer toutes les équipes ? Cette action est irréversible."
        @confirm="deleteAllTeams"
        @cancel="closeDeleteAllTeamsModal"
      />
    </div>
  </div>
</template>

<script>
  import { CogIcon } from '@heroicons/vue/24/outline';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import FilterComponent from '@/components/FilterComponent.vue';
  import CardEditComponent from '@/components/CardEditComponent.vue';
  import ModalComponent from '@/components/ModalComponent.vue';
  import FormComponent from '@/components/FormComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import apiService from '@/services/apiService';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';

  export default {
    components: {
      CogIcon,
      ButtonComponent,
      FilterComponent,
      CardEditComponent,
      ModalComponent,
      FormComponent,
      DeleteConfirmationModal,
      TourneySubMenu,
    },
    data() {
      return {
        tourneyId: this.$route.params.id,
        isTeamSetupModalVisible: false,
        isDeleteAllTeamsModalVisible: false,
        teamSetupData: {
          maxTeamNumber: null,
          playerPerTeam: null,
          minPlayerPerTeam: null, // Champ optionnel
        },
        teamSetupFields: [
          {
            name: 'maxTeamNumber',
            label: "Nombre maximum d'équipes",
            type: 'number',
            required: true,
          },
          {
            name: 'playerPerTeam',
            label: 'Nombre de joueurs par équipe',
            type: 'number',
            required: true,
          },
          {
            name: 'minPlayerPerTeam',
            label: 'Nombre minimum de joueurs par équipe',
            type: 'number',
            required: false,
            tooltip:
              'Champ optionnel pour le nombre minimum de joueurs par équipe',
          },
        ],
        filters: [
          {
            label: 'Filtrer par statut',
            value: '',
            options: [
              { label: 'Tous', value: '' },
              { label: 'Complet', value: 'full' },
              { label: 'Partiel', value: 'partial' },
              { label: 'Vide', value: 'empty' },
            ],
          },
        ],
        teams: [],
        filteredTeams: [],
        unassignedUsers: [],
      };
    },
    computed: {
      isTeamSetupConfigured() {
        return (
          this.teamSetupData.maxTeamNumber && this.teamSetupData.playerPerTeam
        );
      },
    },
    methods: {
      openTeamSetupModal() {
        this.isTeamSetupModalVisible = true;
      },
      closeTeamSetupModal() {
        this.isTeamSetupModalVisible = false;
      },
      saveTeamSetup() {
        apiService
          .post(
            `/tourneys/${this.$route.params.id}/team-setup`,
            this.teamSetupData
          )
          .then(() => {
            this.closeTeamSetupModal();
          })
          .catch((error) => {
            console.error(
              'Erreur lors de la sauvegarde des paramètres des équipes :',
              error
            );
          });
      },
      generateTeams() {
        apiService
          .get(`/tourneys/${this.$route.params.id}/team-setup/generate`)
          .then(() => {
            this.fetchTeams();
          })
          .catch((error) => {
            console.error('Erreur lors de la génération des équipes :', error);
          });
      },
      confirmDeleteAllTeams() {
        this.isDeleteAllTeamsModalVisible = true;
      },
      closeDeleteAllTeamsModal() {
        this.isDeleteAllTeamsModalVisible = false;
      },
      deleteAllTeams() {
        apiService
          .delete(`/teams/${this.$route.params.id}/all`)
          .then(() => {
            this.fetchTeams();
            this.closeDeleteAllTeamsModal();
          })
          .catch((error) => {
            console.error(
              'Erreur lors de la suppression de toutes les équipes :',
              error
            );
          });
      },
      fetchTeams() {
        apiService
          .get(`/teams/tourney/${this.$route.params.id}`)
          .then((response) => {
            this.teams = response.data;
            this.applyFilters();
            this.fetchUnassignedUsers(); // Récupérer les utilisateurs non assignés
          })
          .catch((error) => {
            console.error(
              'Erreur lors de la récupération des équipes :',
              error
            );
          });
      },
      fetchUnassignedUsers() {
        apiService
          .get(`/tourneys/${this.$route.params.id}/unassigned-users`)
          .then((response) => {
            this.unassignedUsers = response.data;
          })
          .catch((error) => {
            console.error(
              'Erreur lors de la récupération des utilisateurs non assignés :',
              error
            );
          });
      },
      applyFilters() {
        const statusFilter = this.filters[0].value;
        if (statusFilter) {
          this.filteredTeams = this.teams.filter((team) => {
            const memberCount = team.members.length;
            const maxMembers = team.maxMembers;
            if (statusFilter === 'full') {
              return memberCount >= maxMembers;
            } else if (statusFilter === 'partial') {
              return memberCount > 0 && memberCount < maxMembers;
            } else if (statusFilter === 'empty') {
              return memberCount === 0;
            }
            return true;
          });
        } else {
          this.filteredTeams = this.teams;
        }
      },
      onFilterChange() {
        this.applyFilters();
      },
      teamDescription(team) {
        return `${team.members.length}/${team.maxMembers} membres`;
      },
      teamStatus(team) {
        const memberCount = team.members.length;
        const maxMembers = team.maxMembers;
        if (memberCount >= maxMembers) {
          return 'full';
        } else if (memberCount > 0) {
          return 'partial';
        } else {
          return 'empty';
        }
      },
      openTeamDetail(team) {
        this.$router.push({
          name: 'TeamDetail',
          params: { id: team.id },
        });
      },
      openUnassignedUsers() {
        this.$router.push({
          name: 'UnassignedUsers',
          params: { id: this.$route.params.id },
        });
      },
    },
    mounted() {
      this.fetchTeams();
    },
  };
</script>

<style scoped>
  /* Les styles sont principalement gérés par Tailwind CSS */
</style>
