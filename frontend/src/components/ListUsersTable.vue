<!-- ListUsersTable.vue -->
<template>
  <div
    class="p-4 bg-light-background dark:bg-dark-background rounded-md shadow-lg"
  >
    <!-- En-tête avec les boutons et le titre -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <ButtonComponent
          variant="info"
          fontAwesomeIcon="envelope"
          @click="sendEmailToAll"
          :disabled="users.length === 0"
        >
          <span class="hidden sm:inline">Envoyer Email</span>
        </ButtonComponent>
        <TitleComponent :title="title" />
        <ButtonComponent
          variant="primary"
          fontAwesomeIcon="cog"
          @click="autoFillGroups"
        >
          <span class="hidden sm:inline">Remplir Groupes</span>
        </ButtonComponent>
      </div>
      <ButtonComponent
        variant="secondary"
        fontAwesomeIcon="arrow-left"
        @click="goBackToTeams"
      >
        Retour aux équipes
      </ButtonComponent>
    </div>

    <!-- Message d'information si tous les groupes sont complets -->
    <p
      v-if="!hasAvailableTeams"
      class="text-light-errorMessage dark:text-dark-errorMessage mb-4"
    >
      Tous les groupes sont complets. Veuillez en créer de nouveaux ou
      réassigner des utilisateurs.
    </p>

    <!-- Table pour afficher les utilisateurs -->
    <div class="overflow-x-auto mt-4">
      <table
        class="min-w-full bg-light-card dark:bg-dark-card shadow rounded-lg"
      >
        <thead>
          <tr>
            <th
              class="px-4 py-2 text-left text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Nom
            </th>
            <th
              class="px-4 py-2 text-left text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Email
            </th>
            <th
              class="px-4 py-2 text-left text-light-title dark:text-dark-title hidden md:table-cell border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Téléphone
            </th>
            <th
              class="px-4 py-2 text-center text-light-title dark:text-dark-title border-b border-light-subMenu-border dark:border-dark-subMenu-border"
            >
              Équipe
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in users"
            :key="user.id"
            class="hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground"
          >
            <td class="px-4 py-2">{{ user.name || 'N/A' }}</td>
            <td class="px-4 py-2 truncate">
              <a
                :href="`mailto:${user.email}`"
                class="text-blue-500 dark:text-blue-400 hover:underline"
              >
                {{ user.email || '-' }}
              </a>
            </td>
            <td class="px-4 py-2 hidden md:table-cell">
              {{ user.phone || '-' }}
            </td>
            <!-- Actions -->
            <td class="px-4 py-2 flex items-center justify-center space-x-2">
              <select
                v-if="availableTeams.length > 0 && teamSetup"
                v-model="selectedTeamIds[user.id]"
                class="border border-light-form-border dark:border-dark-form-border rounded-md p-1 w-28 bg-light-form-background dark:bg-dark-form-background text-light-form-text dark:text-dark-form-text"
              >
                <option :value="null">-- Sélectionnez une équipe --</option>
                <option
                  v-for="team in availableTeams"
                  :key="team.id"
                  :value="team.id"
                >
                  {{ team.teamName }} ({{ team.Users.length }}/{{
                    team.type === 'assistant'
                      ? teamSetup.playerPerTeam * teamSetup.maxTeamNumber
                      : teamSetup.playerPerTeam
                  }})
                </option>
              </select>
              <ButtonComponent
                v-if="availableTeams.length > 0"
                :fontAwesomeIcon="'plus'"
                variant="primary"
                @click="assignTeam(user.id)"
              >
                <span class="hidden sm:inline">Assigner</span>
              </ButtonComponent>
              <ButtonComponent
                v-else
                :fontAwesomeIcon="'ban'"
                variant="gray"
                :disabled="true"
              >
                <span class="hidden sm:inline">Aucune équipe</span>
              </ButtonComponent>
              <ButtonComponent
                :fontAwesomeIcon="'trash'"
                variant="danger"
                @click="confirmDelete(user.id)"
              >
                <span class="hidden sm:inline">Supprimer</span>
              </ButtonComponent>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Confirmation modal pour suppression -->
    <DeleteConfirmationModal
      v-if="showDeleteModal"
      :isVisible="showDeleteModal"
      title="Confirmer la suppression"
      message="Êtes-vous sûr de vouloir supprimer cet utilisateur du tournoi?"
      @confirm="deleteUser"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import TitleComponent from '@/components/TitleComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      TitleComponent,
      ButtonComponent,
      DeleteConfirmationModal,
    },
    props: {
      title: {
        type: String,
        default: 'Liste des utilisateurs',
      },
      users: {
        type: Array,
        required: true,
        default: () => [],
      },
      teams: {
        type: Array,
        required: false,
        default: () => [],
      },
      isAssigned: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['go-back', 'assign-team', 'delete-user'],
    computed: {
      availableTeams() {
        // Vérifie que `teamSetup` est chargé avant de tenter l'accès à `playerPerTeam`
        if (!this.teamSetup) return []; // Retourne un tableau vide si `teamSetup` n'est pas encore chargé

        return this.teams.filter(
          (team) => team.Users.length < this.teamSetup.playerPerTeam // Filtrer les équipes non pleines
        );
      },
      hasAvailableTeams() {
        return this.availableTeams.length > 0;
      },
    },
    data() {
      return {
        teamSetup: null,
        showDeleteModal: false,
        userIdToDelete: null,
        selectedTeamIds: {},
      };
    },
    async created() {
      await this.fetchTeamSetup(); // Charger `teamSetup` au montage du composant
    },
    methods: {
      async fetchTeamSetup() {
        try {
          const tourneyId = this.$route.params.id;
          const response = await apiService.get(
            `/tourneys/${tourneyId}/team-setup`
          );
          this.teamSetup = response.data;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération de la configuration des équipes:',
            error
          );
        }
      },
      goBackToTeams() {
        this.$emit('go-back');
      },
      assignTeam(userId) {
        const teamId = this.selectedTeamIds[userId];
        if (teamId) {
          this.$emit('assign-team', { userId, teamId });
          // Optionnel : Réinitialiser la sélection après assignation
          this.selectedTeamIds[userId] = null;
        } else {
          // Affiche un message si aucune équipe n'est sélectionnée
          toast.info('Veuillez sélectionner une équipe pour cet utilisateur.');
        }
      },
      confirmDelete(userId) {
        this.userIdToDelete = userId;
        this.showDeleteModal = true;
      },
      deleteUser() {
        if (this.userIdToDelete !== null) {
          this.$emit('delete-user', this.userIdToDelete);
          this.closeDeleteModal();
        }
      },
      closeDeleteModal() {
        this.showDeleteModal = false;
        this.userIdToDelete = null;
      },
      sendEmailToAll() {
        const emails = this.users
          .map((user) => user.email)
          .filter((email) => email);
        if (emails.length === 0) {
          toast.error(
            "Il n'y a aucun utilisateur sans groupe pour envoyer un email."
          );
          return;
        }
        const mailtoLink = `mailto:${emails.join(',')}`;
        window.location.href = mailtoLink;
      },
    },
    watch: {
      teams: {
        handler() {
          // Vous pouvez ajouter des actions supplémentaires ici si nécessaire lorsque les équipes changent
        },
        deep: true,
      },
    },
  };
</script>

<style scoped>
  /* Remplacement des styles en ligne par des classes Tailwind */
  table th,
  table td {
    padding: 0.5rem;
    white-space: nowrap;
  }
</style>
