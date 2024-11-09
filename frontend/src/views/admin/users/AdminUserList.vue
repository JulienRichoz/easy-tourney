<!-- src/views/admin/AdminUsers.vue -->
<template>
  <div class="mx-auto p-4">
    <ListUsersTable
      :users="users"
      :enableAddUser="true"
      :enableEditUser="true"
      :enableAssignTourney="true"
      :enableRemoveUserFromTourney="true"
      :tournaments="tournaments"
      :showTourney="true"
      :showAssignTourney="true"
      :enableAssignTeam="false"
      :showEmailButton="false"
      :showBackButton="false"
      :showPhone="false"
      :showFilters="true"
      :editUserFunction="editUser"
      :addUserFunction="addUser"
      @assign-tourney="handleAssignTourney"
      @remove-user-from-tourney="handleRemoveUserFromTourney"
      @delete-user="handleDeleteUser"
      @user-updated="fetchData"
    />

    <!-- Modale pour éditer un utilisateur -->
    <ModalComponent
      :isVisible="showEditUserModal"
      title="Modifier l'utilisateur"
      @close="closeEditUserModal"
    >
      <template #content>
        <FormComponent
          v-model="newUser"
          :fields="userFormFields"
          :isEditing="true"
          @form-submit="handleUserFormSubmit"
          @cancel="closeEditUserModal"
          :customValidation="validateUserForm"
        />
      </template>
    </ModalComponent>

    <!-- Modale pour ajouter un nouvel utilisateur -->
    <ModalComponent
      :isVisible="showAddUserModal"
      title="Ajouter un utilisateur"
      @close="closeAddUserModal"
    >
      <template #content>
        <FormComponent
          v-model="newUser"
          :fields="userFormFields"
          :isEditing="false"
          @form-submit="handleAddUserSubmit"
          @cancel="closeAddUserModal"
          :customValidation="validateUserForm"
        />
      </template>
    </ModalComponent>
  </div>
</template>

<script>
  // Importation des composants nécessaires
  import ListUsersTable from '@/components/ListUsersTable.vue';
  import apiService from '@/services/apiService';
  import { toast } from 'vue3-toastify';
  import ModalComponent from '@/components/ModalComponent.vue';
  import FormComponent from '@/components/FormComponent.vue';

  export default {
    components: {
      ListUsersTable,
      ModalComponent,
      FormComponent,
    },
    data() {
      return {
        users: [],
        tournaments: [],
        showEditUserModal: false,
        showAddUserModal: false, // État pour la modale d'ajout
        editingUser: null,
        newUser: {
          name: '',
          email: '',
          phone: '',
          password: '',
          roleId: 2, // Par défaut, rôle utilisateur
        },
        formErrors: {},
        isFormValid: false,
      };
    },
    async created() {
      await this.fetchData();
    },
    methods: {
      /**
       * Récupère les données des utilisateurs et des tournois depuis l'API.
       * @returns {Promise<void>}
       */
      async fetchData() {
        try {
          const [usersResponse, tourneysResponse] = await Promise.all([
            apiService.get('/users/all/details'),
            apiService.get('/tourneys'),
          ]);
          this.users = usersResponse.data;
          this.tournaments = tourneysResponse.data;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des utilisateurs:',
            error
          );
          toast.error(
            'Une erreur est survenue lors de la récupération des données.'
          );
        }
      },
      /**
       * Ouvre la modale d'édition avec les données de l'utilisateur sélectionné.
       * @param {Object} user - L'utilisateur à éditer.
       */
      editUser(user) {
        this.editingUser = user;
        this.newUser = {
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          password: '',
          roleId: Number(user.roleId || user.role?.id || 2), // Valeur par défaut à 2 (Utilisateur)
        };
        this.showEditUserModal = true;
        this.formErrors = {};
        this.isFormValid = true;
      },
      /**
       * Ferme la modale d'édition et réinitialise les données.
       */
      closeEditUserModal() {
        this.showEditUserModal = false;
        this.editingUser = null;
        this.resetNewUser();
      },
      /**
       * Ouvre la modale d'ajout d'un nouvel utilisateur.
       */
      addUser() {
        this.resetNewUser();
        this.showAddUserModal = true;
        this.formErrors = {};
        this.isFormValid = true;
      },
      /**
       * Ferme la modale d'ajout et réinitialise les données.
       */
      closeAddUserModal() {
        this.showAddUserModal = false;
        this.resetNewUser();
      },
      /**
       * Réinitialise les données du nouvel utilisateur.
       */
      resetNewUser() {
        this.newUser = {
          name: '',
          email: '',
          phone: '',
          password: '',
          roleId: 2, // Par défaut, rôle utilisateur
        };
      },
      /**
       * Valide le formulaire d'utilisateur.
       * @returns {Object} - Les erreurs de validation.
       */
      validateUserForm() {
        const errors = {};
        if (!this.newUser.name) {
          errors.name = 'Le nom est obligatoire.';
        }
        if (!this.newUser.email) {
          errors.email = "L'email est obligatoire.";
        }
        if (!this.newUser.password && !this.editingUser) {
          errors.password = 'Le mot de passe est obligatoire.';
        }
        // ... autres validations si nécessaire ...
        this.formErrors = errors;
        this.isFormValid = Object.keys(errors).length === 0;
        return errors;
      },
      /**
       * Soumet le formulaire d'édition d'un utilisateur.
       * @returns {Promise<void>}
       */
      async handleUserFormSubmit() {
        this.validateUserForm();
        if (!this.isFormValid) return;
        try {
          await apiService.put(`/users/${this.editingUser.id}`, this.newUser);
          toast.success('Utilisateur mis à jour avec succès!');
          this.closeEditUserModal();
          await this.fetchData();
        } catch (error) {
          console.error(
            "Erreur lors de la mise à jour de l'utilisateur:",
            error
          );
          toast.error("Erreur lors de la mise à jour de l'utilisateur!");
        }
      },
      /**
       * Soumet le formulaire d'ajout d'un nouvel utilisateur.
       * @returns {Promise<void>}
       */
      async handleAddUserSubmit() {
        this.validateUserForm();
        if (!this.isFormValid) return;
        try {
          await apiService.post('/users', this.newUser);
          toast.success('Utilisateur créé avec succès!');
          this.closeAddUserModal();
          await this.fetchData();
        } catch (error) {
          console.error("Erreur lors de la création de l'utilisateur:", error);
          toast.error("Erreur lors de la création de l'utilisateur!");
        }
      },
      async handleAssignTourney({ userId, tourneyId }) {
        try {
          await apiService.post(`/users/${userId}/tourneys/${tourneyId}`);
          await this.fetchData();
          toast.success('Utilisateur assigné au tournoi avec succès.');
        } catch (error) {
          console.error("Erreur lors de l'assignation au tournoi:", error);
          toast.error(
            "Une erreur est survenue lors de l'assignation au tournoi."
          );
        }
      },
      async handleRemoveUserFromTourney({ userId, tourneyId }) {
        try {
          await apiService.delete(`/users/${userId}/tourneys/${tourneyId}`);
          await this.fetchData();
          toast.success('Utilisateur retiré du tournoi avec succès.');
        } catch (error) {
          console.error('Erreur lors du retrait du tournoi:', error);
          toast.error(
            "Une erreur est survenue lors du retrait de l'utilisateur du tournoi."
          );
        }
      },
      async handleDeleteUser(userId) {
        try {
          await apiService.delete(`/users/${userId}`);
          await this.fetchData();
          toast.success('Utilisateur supprimé avec succès.');
        } catch (error) {
          console.error(
            "Erreur lors de la suppression de l'utilisateur:",
            error
          );
          toast.error(
            "Une erreur est survenue lors de la suppression de l'utilisateur."
          );
        }
      },
    },
    computed: {
      /**
       * Définit les champs du formulaire d'utilisateur.
       * @returns {Array} - Les champs du formulaire.
       */
      userFormFields() {
        return [
          {
            name: 'name',
            label: 'Nom',
            type: 'text',
            required: true,
          },
          {
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true,
          },
          {
            name: 'phone',
            label: 'Téléphone',
            type: 'text',
            required: false,
          },
          {
            name: 'password',
            label: 'Mot de passe',
            type: 'password',
            required: !this.editingUser, // Le mot de passe est requis uniquement lors de la création
          },
          {
            name: 'roleId',
            label: 'Rôle',
            type: 'select',
            required: true,
            options: [
              { value: 1, label: 'Administrateur' },
              { value: 2, label: 'Utilisateur' },
            ],
          },
        ];
      },
    },
  };
</script>

<style scoped></style>
