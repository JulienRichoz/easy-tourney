<template>
    <div class="modal" v-if="isVisible">
      <div class="modal-content">
        <h2>{{ editMode ? 'Modifier Sport' : 'Ajouter un Nouveau Sport' }}</h2>
        <form @submit.prevent="handleSubmit">
          <FormInputComponent
            id="name"
            label="Nom du Sport"
            v-model="form.name"
            placeholder="Entrez le nom du sport"
            required
          />
          <FormInputComponent
            id="rule"
            label="Règles"
            v-model="form.rule"
            placeholder="Entrez les règles du sport"
            required
          />
          <FormInputComponent
            id="scoreSystem"
            label="Système de Points"
            v-model="form.scoreSystem"
            placeholder="Entrez le système de points"
          />
          <ButtonComponent variant="primary" type="submit">
            {{ editMode ? 'Enregistrer les Modifications' : 'Ajouter Sport' }}
          </ButtonComponent>
          <ButtonComponent variant="secondary" @click="closeModal">
            Annuler
          </ButtonComponent>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import FormInputComponent from "./FormInputComponent.vue";
  import ButtonComponent from "./ButtonComponent.vue";
  
  export default {
    name: "AddSportModal",
    components: {
      FormInputComponent,
      ButtonComponent,
    },
    props: {
      isVisible: Boolean,
      editMode: Boolean,
      sportData: Object,
    },
    data() {
      return {
        form: {
          name: "",
          rule: "",
          scoreSystem: "",
        },
      };
    },
    watch: {
      sportData: {
        handler() {
          if (this.editMode && this.sportData) {
            this.form = { ...this.sportData };
          }
        },
        immediate: true,
      },
    },
    methods: {
      handleSubmit() {
        if (this.editMode) {
          this.$emit("update-sport", this.form);
        } else {
          this.$emit("add-sport", this.form);
        }
        this.closeModal();
      },
      closeModal() {
        this.$emit("close");
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
  }
  </style>
  