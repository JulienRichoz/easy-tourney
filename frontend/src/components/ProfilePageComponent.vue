<template>
  <div class="max-w-5xl mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">{{ pageTitle }}</h1>
    <div class="flex flex-col md:flex-row">
      <!-- Colonne gauche : Informations utilisateur -->
      <div class="w-full md:w-1/2 md:pr-4">
        <h2 class="text-2xl font-semibold mb-4">Informations</h2>
        <div class="space-y-6">
          <!-- Champ Nom -->
          <div>
            <div class="flex items-center">
              <label class="block text-lg font-medium">Nom</label>
              <SoftButtonComponent
                fontAwesomeIcon="fa-pen-alt"
                iconClass="w-4 h-4 ml-2"
                @click="toggleEdit('name')"
                v-if="!editingField.name"
              />
            </div>
            <div class="flex items-center">
              <span v-if="!editingField.name" @click="toggleEdit('name')">
                {{ userData.name }}
              </span>
              <div v-else class="flex items-center w-full">
                <input
                  v-model="userData.name"
                  type="text"
                  class="form-input mt-1 block w-full"
                />
                <SoftButtonComponent
                  fontAwesomeIcon="fa-check"
                  iconClass="w-5 h-5 text-green-500 ml-2"
                  @click="saveField('name')"
                />
                <SoftButtonComponent
                  fontAwesomeIcon="times"
                  iconClass="w-5 h-5 text-red-500 ml-2"
                  @click="cancelEdit('name')"
                />
              </div>
            </div>
          </div>
          <!-- Champ Email -->
          <div>
            <div class="flex items-center">
              <label class="block text-lg font-medium">Email</label>
              <SoftButtonComponent
                v-if="canEditEmail && !editingField.email"
                fontAwesomeIcon="fa-pen-alt"
                iconClass="w-4 h-4 ml-2"
                @click="toggleEdit('email')"
              />
            </div>
            <div class="flex items-center">
              <span
                v-if="!editingField.email"
                @click="canEditEmail ? toggleEdit('email') : null"
              >
                {{ userData.email }}
              </span>
              <div v-else class="flex items-center w-full">
                <input
                  v-model="userData.email"
                  type="email"
                  class="form-input mt-1 block w-full"
                  :disabled="!canEditEmail"
                />
                <SoftButtonComponent
                  fontAwesomeIcon="check"
                  iconClass="w-5 h-5 text-green-500 ml-2"
                  @click="saveField('email')"
                />
                <SoftButtonComponent
                  fontAwesomeIcon="times"
                  iconClass="w-5 h-5 text-red-500 ml-2"
                  @click="cancelEdit('email')"
                />
              </div>
            </div>
          </div>
          <!-- Champ Téléphone -->
          <div>
            <div class="flex items-center">
              <label class="block text-lg font-medium">Téléphone</label>
              <SoftButtonComponent
                fontAwesomeIcon="fa-pen-alt"
                iconClass="w-4 h-4 ml-2 cursor-pointer"
                @click="toggleEdit('phone')"
                v-if="!editingField.phone"
              />
            </div>
            <div class="flex items-center">
              <span v-if="!editingField.phone" @click="toggleEdit('phone')">
                {{ userData.phone || 'Non renseigné' }}
              </span>
              <div v-else class="flex items-center w-full">
                <input
                  v-model="userData.phone"
                  type="text"
                  class="form-input mt-1 block w-full"
                />
                <SoftButtonComponent
                  fontAwesomeIcon="check"
                  iconClass="w-5 h-5 text-green-500 ml-2"
                  @click="saveField('phone')"
                />
                <SoftButtonComponent
                  fontAwesomeIcon="times"
                  iconClass="w-5 h-5 text-red-500 ml-2"
                  @click="cancelEdit('phone')"
                />
              </div>
            </div>
          </div>
          <!-- Changement de mot de passe -->
          <div>
            <div class="flex items-center">
              <label class="block text-lg font-medium">Mot de passe</label>
              <SoftButtonComponent
                fontAwesomeIcon="fa-pen-alt"
                iconClass="w-4 h-4 ml-2"
                @click="toggleEdit('password')"
                v-if="!editingField.password"
              />
            </div>
            <div class="flex items-center">
              <span
                v-if="!editingField.password"
                @click="toggleEdit('password')"
              >
                ••••••••
              </span>
              <div v-else class="w-full">
                <!-- Ancien mot de passe (uniquement pour les utilisateurs non-admin) -->
                <input
                  v-if="!isAdmin"
                  v-model="passwordData.oldPassword"
                  type="password"
                  placeholder="Ancien mot de passe"
                  class="form-input block w-full mt-1"
                />
                <input
                  v-model="passwordData.newPassword"
                  type="password"
                  placeholder="Nouveau mot de passe"
                  class="form-input block w-full mt-1"
                />
                <input
                  v-model="passwordData.confirmPassword"
                  type="password"
                  placeholder="Confirmer le nouveau mot de passe"
                  class="form-input block w-full mt-1"
                />
                <div class="flex space-x-2 mt-2">
                  <SoftButtonComponent
                    fontAwesomeIcon="check"
                    iconClass="w-5 h-5 text-green-500"
                    @click="updatePassword"
                  />
                  <SoftButtonComponent
                    fontAwesomeIcon="times"
                    iconClass="w-5 h-5 text-red-500"
                    @click="cancelEdit('password')"
                  />
                </div>
              </div>
            </div>
          </div>
          <!-- Changer le rôle (uniquement pour les administrateurs) -->
          <div v-if="isAdmin">
            <div class="flex items-center">
              <label
                class="block text-lg font-medium text-gray-700 dark:text-gray-300"
                >Rôle</label
              >
              <SoftButtonComponent
                fontAwesomeIcon="fa-pen-alt"
                iconClass="w-4 h-4 ml-2 cursor-pointer"
                @click="toggleEdit('role')"
                v-if="!editingField.role"
              />
            </div>
            <div class="flex items-center">
              <span
                v-if="!editingField.role"
                class="text-gray-900 dark:text-gray-100"
                @click="toggleEdit('role')"
              >
                {{ userData.roleName }}
              </span>
              <div v-else class="flex items-center w-full">
                <select
                  v-model="userData.roleId"
                  class="form-select mt-1 block w-full"
                >
                  <option v-for="role in roles" :key="role.id" :value="role.id">
                    {{ role.name }}
                  </option>
                </select>
                <SoftButtonComponent
                  fontAwesomeIcon="check"
                  iconClass="w-5 h-5 text-green-500 ml-2 cursor-pointer"
                  @click="saveField('roleId')"
                />
                <SoftButtonComponent
                  fontAwesomeIcon="times"
                  iconClass="w-5 h-5 text-red-500 ml-2 cursor-pointer"
                  @click="cancelEdit('role')"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Colonne droite : Tournois -->
      <div class="w-full md:w-1/2 md:pl-4 mt-8 md:mt-0">
        <h2 class="text-2xl font-semibold mb-4">Tournois</h2>
        <!-- Si l'utilisateur n'est pas admin, on affiche simplement la liste des tournois -->
        <div v-if="!isAdmin">
          <ul>
            <li
              v-for="tourney in userTournaments"
              :key="tourney.id"
              class="border-b border-gray-300 py-2"
            >
              {{ tourney.name }}
            </li>
          </ul>
        </div>
        <!-- Si l'utilisateur est admin, on affiche les tournois avec possibilité d'assigner/retirer -->
        <div v-else>
          <!-- Assignation à un tournoi -->
          <div class="mb-4">
            <label
              class="block text-lg font-medium text-gray-700 dark:text-gray-300"
              >Ajouter au tournoi</label
            >
            <div class="flex items-center">
              <v-select
                v-model="selectedTourneyId"
                :options="availableTourneys"
                placeholder="Sélectionnez un tournoi"
                label="name"
                :reduce="(t) => t.id"
                clearable
                class="w-full sm:w-64"
              />
              <ButtonComponent
                class="ml-2"
                variant="success"
                size="sm"
                @click="assignTourney"
                :disabled="!selectedTourneyId"
              >
                Ajouter
              </ButtonComponent>
            </div>
          </div>
          <!-- Liste des tournois avec option de retrait -->
          <ul>
            <li
              v-for="tourney in userTournaments"
              :key="tourney.id"
              class="border-b py-2 flex justify-between items-center"
            >
              <span>{{ tourney.name }}</span>
              <SoftButtonComponent
                fontAwesomeIcon="trash"
                iconClass="w-5 h-5 text-red-500 hover:text-red-700"
                aria-label="Retirer du tournoi"
                @click="confirmRemoveFromTourney(tourney.id)"
              />
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Actions administrateur (uniquement pour les administrateurs) -->
    <div v-if="isAdmin && userId !== currentUserId" class="mt-8">
      <h2 class="text-2xl font-semibold mb-4">Actions administrateur</h2>
      <ButtonComponent variant="danger" size="sm" @click="confirmDeleteUser">
        Supprimer l'utilisateur
      </ButtonComponent>
    </div>

    <!-- Modale de confirmation pour la suppression -->
    <DeleteConfirmationModal
      v-if="showDeleteModal"
      :isVisible="showDeleteModal"
      title="Confirmer la suppression"
      message="Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
      @confirm="deleteUser"
      @cancel="closeDeleteModal"
    />

    <!-- Modale de confirmation pour retirer du tournoi -->
    <DeleteConfirmationModal
      v-if="showRemoveFromTourneyModal"
      :isVisible="showRemoveFromTourneyModal"
      title="Confirmer le retrait"
      message="Êtes-vous sûr de vouloir retirer l'utilisateur de ce tournoi ?"
      @confirm="removeUserFromTourney"
      @cancel="closeRemoveFromTourneyModal"
    />
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import { toast } from 'vue3-toastify';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import SoftButtonComponent from '@/components/SoftButtonComponent.vue';

  export default {
    components: {
      DeleteConfirmationModal,
      ButtonComponent,
      SoftButtonComponent,
    },
    props: {
      userId: {
        type: Number,
        required: true,
      },
      isAdmin: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        userData: {
          name: '',
          email: '',
          phone: '',
          roleId: null,
          roleName: '',
        },
        originalUserData: {}, // Pour stocker les données originales
        passwordData: {
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        },
        userTournaments: [],
        availableTourneys: [],
        selectedTourneyId: null,
        roles: [],
        editingField: {
          name: false,
          email: false,
          phone: false,
          password: false,
          role: false,
        },
        showDeleteModal: false,
        showRemoveFromTourneyModal: false,
        tourneyIdToRemove: null,
      };
    },
    computed: {
      pageTitle() {
        return this.isAdmin ? "Profil de l'utilisateur" : 'Mon Profil';
      },
      canEditEmail() {
        // Si vous voulez permettre aux utilisateurs de modifier leur email, changez cette valeur
        return this.isAdmin;
      },
      currentUserId() {
        return this.$store.state.user ? this.$store.state.user.id : null;
      },
    },
    async created() {
      await this.fetchUserData();
      if (this.userNotFound) {
        // Ne pas exécuter le reste du code si l'utilisateur n'existe pas
        return;
      }
      if (this.isAdmin) {
        await this.fetchAvailableTourneys();
        await this.fetchRoles();
      }
    },
    methods: {
      /**
       * Récupère les données de l'utilisateur depuis l'API.
       */
      async fetchUserData() {
        try {
          const response = await apiService.get(`/users/${this.userId}`);
          const user = response.data;
          this.userData = {
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            roleId: user.roleId,
            roleName: user.role ? user.role.name : '',
          };
          this.userTournaments = user.usersTourneys
            ? user.usersTourneys.map((ut) => ut.tourney)
            : [];
          // Stocker une copie des données originales pour annuler les modifications
          this.originalUserData = { ...this.userData };
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des données utilisateur:',
            error
          );
          if (error.response && error.response.status === 404) {
            // Rediriger vers la page 404
            this.$router.push('/404');
          } else {
            // Afficher un message d'erreur général
            toast.error(
              'Une erreur est survenue lors de la récupération des données.'
            );
          }
        }
      },
      /**
       * Récupère les tournois disponibles pour l'assignation.
       */
      async fetchAvailableTourneys() {
        try {
          const response = await apiService.get('/tourneys');
          const userTourneyIds = this.userTournaments.map((t) => t.id);
          this.availableTourneys = response.data.filter(
            (t) => !userTourneyIds.includes(t.id)
          );
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des tournois disponibles:',
            error
          );
        }
      },
      /**
       * Récupère les rôles disponibles.
       */
      async fetchRoles() {
        try {
          const response = await apiService.get('/roles');
          this.roles = response.data;
        } catch (error) {
          console.error('Erreur lors de la récupération des rôles:', error);
        }
      },
      /**
       * Basculer le mode édition pour un champ donné.
       * @param {String} field - Le champ à éditer.
       */
      toggleEdit(field) {
        this.editingField[field] = true;
      },
      /**
       * Enregistre les modifications pour un champ.
       * @param {String} field - Le champ à sauvegarder.
       */
      async saveField(field) {
        await this.updateField(field);
        this.editingField[field] = false;
      },
      /**
       * Annule les modifications pour un champ.
       * @param {String} field - Le champ à annuler.
       */
      cancelEdit(field) {
        this.userData[field] = this.originalUserData[field];
        this.editingField[field] = false;
      },
      /**
       * Met à jour un champ individuel de l'utilisateur.
       * @param {String} field - Le champ à mettre à jour.
       */
      async updateField(field) {
        try {
          const payload = {
            [field]: this.userData[field],
          };
          await apiService.put(`/users/${this.userId}`, payload);
          toast.success('Informations mises à jour avec succès!');

          // Si le champ modifié est le nom et que l'utilisateur est le même que celui du store
          if (field === 'name' && this.$store.state.user.id === this.userId) {
            this.$store.commit('UPDATE_USER_NAME', this.userData.name);
          }

          if (field === 'roleId') {
            // Mettre à jour le nom du rôle
            const selectedRole = this.roles.find(
              (role) => role.id === this.userData.roleId
            );
            this.userData.roleName = selectedRole ? selectedRole.name : '';
          }
          // Mettre à jour les données originales
          this.originalUserData[field] = this.userData[field];
        } catch (error) {
          console.error(
            'Erreur lors de la mise à jour des informations:',
            error
          );
          toast.error('Une erreur est survenue lors de la mise à jour.');
          // Restaurer la valeur originale en cas d'erreur
          this.userData[field] = this.originalUserData[field];
        }
      },
      /**
       * Met à jour le mot de passe de l'utilisateur.
       */
      async updatePassword() {
        if (
          this.passwordData.newPassword !== this.passwordData.confirmPassword
        ) {
          toast.error('Les mots de passe ne correspondent pas.');
          return;
        }
        try {
          const payload = {
            password: this.passwordData.newPassword,
          };
          if (!this.isAdmin) {
            payload.oldPassword = this.passwordData.oldPassword;
          }
          await apiService.put(`/users/${this.userId}`, payload);
          toast.success('Mot de passe mis à jour avec succès!');
          // Réinitialiser les champs de mot de passe
          this.passwordData.oldPassword = '';
          this.passwordData.newPassword = '';
          this.passwordData.confirmPassword = '';
          this.editingField.password = false;
        } catch (error) {
          console.error(
            'Erreur lors de la mise à jour du mot de passe:',
            error
          );
          if (
            error.response &&
            error.response.data &&
            error.response.data.message
          ) {
            toast.error(error.response.data.message);
          } else {
            toast.error(
              'Une erreur est survenue lors de la mise à jour du mot de passe.'
            );
          }
        }
      },
      /**
       * Confirme la suppression de l'utilisateur.
       */
      confirmDeleteUser() {
        this.showDeleteModal = true;
      },
      /**
       * Supprime l'utilisateur après confirmation.
       */
      async deleteUser() {
        try {
          await apiService.delete(`/users/${this.userId}`);
          toast.success('Utilisateur supprimé avec succès.');
          this.$router.push('/users');
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
      closeDeleteModal() {
        this.showDeleteModal = false;
      },
      /**
       * Assigne l'utilisateur à un tournoi.
       */
      async assignTourney() {
        try {
          await apiService.post(
            `/users/${this.userId}/tourneys/${this.selectedTourneyId}`
          );
          toast.success('Utilisateur assigné au tournoi avec succès.');
          await this.fetchUserData();
          await this.fetchAvailableTourneys();
          this.selectedTourneyId = null;
        } catch (error) {
          console.error("Erreur lors de l'assignation au tournoi:", error);
          toast.error(
            "Une erreur est survenue lors de l'assignation au tournoi."
          );
        }
      },
      /**
       * Confirme le retrait de l'utilisateur d'un tournoi.
       * @param {Number} tourneyId - ID du tournoi.
       */
      confirmRemoveFromTourney(tourneyId) {
        this.tourneyIdToRemove = tourneyId;
        this.showRemoveFromTourneyModal = true;
      },
      /**
       * Retire l'utilisateur du tournoi.
       */
      async removeUserFromTourney() {
        try {
          await apiService.delete(
            `/users/${this.userId}/tourneys/${this.tourneyIdToRemove}`
          );
          toast.success('Utilisateur retiré du tournoi avec succès.');
          await this.fetchUserData();
          await this.fetchAvailableTourneys();
          this.showRemoveFromTourneyModal = false;
          this.tourneyIdToRemove = null;
        } catch (error) {
          console.error('Erreur lors du retrait du tournoi:', error);
          toast.error('Une erreur est survenue lors du retrait du tournoi.');
        }
      },
      closeRemoveFromTourneyModal() {
        this.showRemoveFromTourneyModal = false;
        this.tourneyIdToRemove = null;
      },
    },
  };
</script>

<style scoped>
  /* Styles personnalisés */
  .form-input,
  .form-select {
    background-color: #f9fafb; /* Couleur de fond claire */
    border: 1px solid #d1d5db; /* Bordure grise */
    border-radius: 0.375rem; /* Rayon des coins */
    padding: 0.5rem; /* Padding */
    color: #111827; /* Couleur du texte */
  }
  .dark .form-input,
  .dark .form-select {
    background-color: #1f2937; /* Couleur de fond foncée */
    border-color: #374151; /* Bordure foncée */
    color: #f9fafb; /* Couleur du texte */
  }
</style>
