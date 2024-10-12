<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" :tourneyName="tourney.name" />
    <div class="fields-management-container">
      <h2 class="page-title">
        Gestion des Terrains pour le Tournoi : {{ tourney.name }}
      </h2>
      <div class="fields-grid">
        <!-- Affichage des terrains -->
        <div v-for="field in fields" :key="field.id" class="field-card">
          <h3>{{ field.name }}</h3>
          <p>{{ field.description }}</p>
          <div v-if="field.sportFields && field.sportFields.length > 0">
            <h4>Sports assignés :</h4>
            <ul>
              <li v-for="sportField in field.sportFields" :key="sportField.id">
                {{ getSportName(sportField.sportId) }} de
                {{ sportField.startTime }} à {{ sportField.endTime }}
              </li>
            </ul>
          </div>
          <ButtonComponent
            variant="primary"
            @click="openAssignSportModal(field)"
          >
            Ajouter un sport
          </ButtonComponent>
        </div>
      </div>

      <!-- Modal pour ajouter un sport au terrain -->
      <ModalComponent
        :isVisible="showModal"
        title="Ajouter un Sport au Terrain"
        @close="closeModal"
      >
        <template #content>
          <form @submit.prevent="assignSport">
            <div class="mb-4">
              <label class="block text-gray-700 font-semibold mb-2"
                >Sport</label
              >
              <select
                v-model="selectedSport"
                class="w-full p-2 border rounded-md"
              >
                <option
                  v-for="sport in sports"
                  :key="sport.id"
                  :value="sport.id"
                >
                  {{ sport.name }}
                </option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 font-semibold mb-2"
                >Heure de début</label
              >
              <input
                type="time"
                v-model="startTime"
                class="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 font-semibold mb-2"
                >Heure de fin</label
              >
              <input
                type="time"
                v-model="endTime"
                class="w-full p-2 border rounded-md"
                required
              />
            </div>
            <ButtonComponent variant="primary" nativeType="submit">
              Ajouter
            </ButtonComponent>
          </form>
        </template>
      </ModalComponent>
    </div>
  </div>
</template>

<script>
  import ModalComponent from '@/components/ModalComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import apiService from '@/services/apiService';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';

  export default {
    components: {
      ModalComponent,
      ButtonComponent,
      TourneySubMenu,
    },
    data() {
      return {
        tourneyId: this.$route.params.id,
        tourney: {},
        fields: [],
        showModal: false,
        selectedField: null,
        selectedSport: null,
        startTime: '',
        endTime: '',
        sports: [],
      };
    },
    async mounted() {
      await this.fetchTourneyDetails();
      await this.fetchFields();
      await this.fetchSports();
    },
    methods: {
      async fetchTourneyDetails() {
        try {
          const response = await apiService.get(`/tourneys/${this.tourneyId}`);
          this.tourney = response.data;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du tournoi:',
            error
          );
        }
      },
      async fetchFields() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/fields`
          );
          this.fields = response.data;
        } catch (error) {
          console.error('Erreur lors de la récupération des terrains:', error);
        }
      },
      async fetchSports() {
        try {
          const response = await apiService.get('/sports');
          this.sports = response.data;
        } catch (error) {
          console.error('Erreur lors de la récupération des sports:', error);
        }
      },
      openAssignSportModal(field) {
        this.selectedField = field;
        this.showModal = true;
      },
      closeModal() {
        this.showModal = false;
        this.selectedField = null;
        this.selectedSport = null;
        this.startTime = '';
        this.endTime = '';
      },
      async assignSport() {
        if (!this.selectedSport || !this.startTime || !this.endTime) {
          alert('Tous les champs sont requis.');
          return;
        }

        try {
          const data = {
            fieldId: this.selectedField.id,
            sportId: this.selectedSport,
            startTime: this.startTime,
            endTime: this.endTime,
          };
          await apiService.post('/sport-fields', data);
          alert('Sport ajouté au terrain avec succès.');
          this.closeModal();
          await this.fetchFields(); // Rafraîchit les terrains pour inclure le nouveau sport assigné
        } catch (error) {
          console.error(
            "Erreur lors de l'assignation du sport au terrain:",
            error
          );
        }
      },
      getSportName(sportId) {
        const sport = this.sports.find((s) => s.id === sportId);
        return sport ? sport.name : 'Sport inconnu';
      },
    },
  };
</script>

<style scoped>
  .fields-management-container {
    padding: 2rem;
  }
  .page-title {
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 1.5rem;
  }
  .fields-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1.5rem;
  }
  @media (min-width: 768px) {
    .fields-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  .field-card {
    background-color: #f7fafc;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
</style>
