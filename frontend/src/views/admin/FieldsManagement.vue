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
          <div class="timeline">
            <!-- Affichage de la timeline pour chaque terrain -->
            <div class="timeline-hour-labels">
              <span v-for="hour in 13" :key="hour" class="hour-label">{{
                7 + hour - 1 + ':00'
              }}</span>
            </div>
            <div class="timeline-segments">
              <div
                v-for="sportField in field.sportFields"
                :key="sportField.id"
                class="timeline-segment"
                :style="getTimelineSegmentStyle(sportField)"
              >
                {{ sportField.sport.name }} ({{ sportField.startTime }} -
                {{ sportField.endTime }})
              </div>
            </div>
          </div>
          <div class="button-group">
            <ButtonComponent
              variant="primary"
              @click="openAssignSportModal(field)"
            >
              Ajouter un sport
            </ButtonComponent>
            <ButtonComponent variant="warning" @click="editField(field)">
              Modifier
            </ButtonComponent>
            <ButtonComponent
              variant="danger"
              @click="confirmDeleteField(field.id)"
            >
              Supprimer
            </ButtonComponent>
          </div>
        </div>
      </div>

      <!-- Modal pour ajouter un sport au terrain -->
      <ModalComponent
        :isVisible="showModal"
        title="Ajouter un Sport au Terrain"
        @close="closeModal"
        @submit="assignSport"
      >
        <template #content>
          <div class="mb-4">
            <label class="block text-gray-700 font-semibold mb-2">Sport</label>
            <select
              v-model="selectedSport"
              class="w-full p-2 border rounded-md"
            >
              <option v-for="sport in sports" :key="sport.id" :value="sport.id">
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
        </template>
      </ModalComponent>

      <!-- Confirmation de suppression -->
      <DeleteConfirmationModal
        :isVisible="showDeleteConfirmation"
        message="Êtes-vous sûr de vouloir supprimer ce terrain ? Cette action est irréversible."
        @cancel="closeDeleteConfirmation"
        @confirm="deleteField(confirmedDeleteFieldId)"
      />
    </div>
  </div>
</template>

<script>
  import ModalComponent from '@/components/ModalComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import apiService from '@/services/apiService';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';

  export default {
    components: {
      ModalComponent,
      ButtonComponent,
      DeleteConfirmationModal,
      TourneySubMenu,
    },
    data() {
      return {
        tourneyId: this.$route.params.id,
        tourney: {},
        fields: [], // 'fields' sera mis à jour via fetchTourneyDetails
        showModal: false,
        showDeleteConfirmation: false,
        confirmedDeleteFieldId: null,
        selectedField: null,
        selectedSport: null,
        startTime: '',
        endTime: '',
        sports: [], // Liste de tous les sports disponibles pour l'ajout
      };
    },
    async mounted() {
      await this.fetchTourneyDetails();
      await this.fetchSports();
    },
    methods: {
      async fetchTourneyDetails() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/sport-fields`
          );
          this.tourney = response.data;
          this.fields = response.data.fields; // Mise à jour des terrains associés

          // Ajout d'un log pour vérifier les données récupérées
          console.log('Détails du tournoi:', this.tourney);
          console.log('Terrains:', this.fields);
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

          // Ajout d'un log pour vérifier les données récupérées
          console.log('Données des terrains:', this.fields);
        } catch (error) {
          console.error('Erreur lors de la récupération des terrains:', error);
        }
      },
      async fetchSports() {
        try {
          const response = await apiService.get('/sports');
          this.sports = response.data;

          // Ajout d'un log pour vérifier les données des sports
          console.log('Données des sports:', this.sports);
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
            information: '', // Ajouter un champ d'information si nécessaire
          };
          await apiService.post('/sport-fields', data);
          alert('Sport ajouté au terrain avec succès.');
          this.closeModal();
          await this.fetchFields();
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
      getTimelineSegmentStyle(sportField) {
        const sport = sportField.sport;
        if (!sport) return {};

        const start = this.convertTimeToDecimal(sportField.startTime);
        const end = this.convertTimeToDecimal(sportField.endTime);
        const totalHours = 13; // Nombre total d'heures sur la timeline (7h - 20h)
        const width = ((end - start) / totalHours) * 100;
        const left = (start / totalHours) * 100;

        return {
          backgroundColor: sport.color || '#cccccc',
          width: `${width}%`,
          left: `${left}%`,
        };
      },
      convertTimeToDecimal(time) {
        const [hours, minutes] = time.split(':').map(Number);
        // Conversion à partir de 7:00 comme base de la journée
        const startHour = 7;
        return hours - startHour + minutes / 60;
      },

      confirmDeleteField(fieldId) {
        this.confirmedDeleteFieldId = fieldId;
        this.showDeleteConfirmation = true;
      },
      async deleteField(id) {
        try {
          await apiService.delete(`/fields/${id}`);
          this.closeDeleteConfirmation();
          await this.fetchFields();
        } catch (error) {
          console.error('Erreur lors de la suppression du terrain:', error);
        }
      },
      closeDeleteConfirmation() {
        this.showDeleteConfirmation = false;
        this.confirmedDeleteFieldId = null;
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
    margin-bottom: 2rem;
  }
  .button-group {
    display: flex;
    gap: 0.5rem;
  }
  .timeline {
    position: relative;
    width: 100%;
    height: 20rem;
    background-color: #e2e8f0;
    margin-top: 1rem;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
  }
  .timeline-hour-labels {
    display: flex;
    flex-direction: column;
    font-size: 0.75rem;
    color: #4a5568;
    padding: 0.5rem;
  }
  .timeline-segments {
    position: relative;
    flex: 1;
  }
  .timeline-segment {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 4px;
    text-align: center;
    font-size: 0.75rem;
    color: white;
    line-height: 2rem;
    overflow: hidden;
  }
</style>
