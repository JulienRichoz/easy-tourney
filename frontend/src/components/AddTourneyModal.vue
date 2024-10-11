<!--
<template>
  <div class="modal" v-if="isVisible">
    <div class="modal-content">
      <h2 class="text-2xl font-bold mb-4">{{ editMode ? 'Modifier Tournoi' : 'Ajouter un Nouveau Tournoi' }}</h2>
      <form @submit.prevent="handleSubmit">
        <FormInputComponent
          id="name"
          label="Nom du Tournoi"
          v-model="form.name"
          placeholder="Entrez le nom du tournoi"
          required
        />
        <FormInputComponent
          id="location"
          label="Lieu"
          v-model="form.location"
          placeholder="Entrez le lieu du tournoi"
          required
        />
        <FormInputComponent
          id="dateTourney"
          label="Date du Tournoi"
          v-model="form.dateTourney"
          type="date"
          required
        />
        <FormInputComponent
          id="domain"
          label="Domaine"
          v-model="form.domain"
          placeholder="Entrez le domaine (facultatif)"
        />
        <FormInputComponent
          id="numberOfField"
          label="Nombre de Terrains"
          v-model.number="form.numberOfField"
          type="number"
          required
          min="0"
          @input="preventNegative"
        />
        <FormInputComponent
          id="emergencyDetails"
          label="Détails d'urgence"
          v-model="form.emergencyDetails"
          type="textarea"
          placeholder="Entrez les détails d'urgence (facultatif)"
        />
        <FormInputComponent
          id="status"
          label="Statut"
          v-model="form.status"
          type="select"
          :options="['draft', 'ready', 'active', 'completed']"
          required
        />
        <div class="flex justify-end space-x-4 mt-4">
          <ButtonComponent variant="secondary" @click="closeModal">
            Annuler
          </ButtonComponent>
          <ButtonComponent variant="primary" type="submit">
            {{ editMode ? 'Enregistrer les Modifications' : 'Ajouter Tournoi' }}
          </ButtonComponent>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import FormInputComponent from "./FormInputComponent.vue";
import ButtonComponent from "./ButtonComponent.vue";

export default {
  name: "AddTourneyModal",
  components: {
    FormInputComponent,
    ButtonComponent,
  },
  props: {
    isVisible: Boolean,
    editMode: Boolean,
    tourneyData: Object,
  },
  data() {
    return {
      form: {
        name: "",
        location: "",
        dateTourney: "",
        domain: "",
        numberOfField: 0,
        emergencyDetails: "",
        status: "draft",
      },
    };
  },
  watch: {
    tourneyData: {
      handler() {
        if (this.editMode && this.tourneyData) {
          this.form = { ...this.tourneyData };
        }
      },
      immediate: true,
    },
  },
  methods: {
    handleSubmit() {
      if (this.editMode) {
        this.$emit("update-tourney", this.form);
      } else {
        this.$emit("add-tourney", this.form);
      }
      this.closeModal();
    },
    closeModal() {
      this.$emit("close");
    },
    preventNegative() {
      if (this.form.numberOfField < 0) {
        this.form.numberOfField = 0;
      }
    },
  },
};
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh; /* Assurer un scrollbar si la fenêtre est petite */
  overflow-y: auto; /* Ajouter un scrollbar si nécessaire */
}

h2 {
  font-size: 2rem; /* Pour que le titre ait la même taille dans tous les formulaires */
  font-weight: bold;
  margin-bottom: 1rem;
}
</style>
-->


