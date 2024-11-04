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
  </div>
</template>

<script>
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
        editingUser: null,
        newUser: {
          name: '',
          email: '',
          phone: '',
          password: '',
          roleId: '',
        },
        formErrors: {},
        isFormValid: false,
      };
    },
    async created() {
      await this.fetchData();
    },
    methods: {
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
      closeEditUserModal() {
        this.showEditUserModal = false;
        this.editingUser = null;
        this.newUser = {
          name: '',
          email: '',
          phone: '',
          password: '',
          roleId: '',
        };
      },
      validateUserForm() {
        const errors = {};
        if (!this.newUser.name) {
          errors.name = 'Le nom est obligatoire.';
        }
        if (!this.newUser.email) {
          errors.email = "L'email est obligatoire.";
        }
        // ... autres validations si nécessaire ...
        this.formErrors = errors;
        this.isFormValid = Object.keys(errors).length === 0;
        return errors;
      },
      async handleUserFormSubmit() {
        this.validateUserForm();
        if (!this.isFormValid) return;
        console.log('Soumission du formulaire:', this.newUser);
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
      handleAddUser() {
        this.$router.push('/users/create');
      },
      handleEditUser(userId) {
        this.$router.push(`/users/${userId}/edit`);
      },
    },
    computed: {
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
            required: false,
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
