<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" :tourneyName="tourney.name" />
    <div class="fields-management-container">
      <h2 class="page-title">
        Gestion des Terrains pour le Tournoi : {{ tourney.name }}
      </h2>

      <div class="fields-grid">
        <!-- Affichage des terrains avec calendrier -->
        <div v-for="field in fields" :key="field.id" class="field-card">
          <h3>{{ field.name }}</h3>
          <p>{{ field.description }}</p>

          <!-- Calendrier FullCalendar pour chaque terrain -->
          <FullCalendar :options="getFieldCalendarOptions(field)" />

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
  import FullCalendar from '@fullcalendar/vue3';
  import timeGridPlugin from '@fullcalendar/timegrid';
  import interactionPlugin from '@fullcalendar/interaction';
  import apiService from '@/services/apiService';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';

  export default {
    components: {
      ModalComponent,
      ButtonComponent,
      DeleteConfirmationModal,
      FullCalendar,
      TourneySubMenu,
    },
    data() {
      return {
        tourneyId: this.$route.params.id,
        tourney: {},
        fields: [],
        showModal: false,
        showDeleteConfirmation: false,
        confirmedDeleteFieldId: null,
        selectedField: null,
        selectedSport: null,
        startTime: '',
        endTime: '',
        sports: [],
      };
    },
    async mounted() {
      await this.fetchTourneyDetails();
      await this.fetchSports();
    },
    methods: {
      async fetchTourneyDetails() {
        try {
          const response = await apiService.get(`/tourneys/${this.tourneyId}`);
          this.tourney = response.data;
          this.fields = response.data.fields; // Mettre à jour les terrains
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du tournoi:',
            error
          );
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
            information: '',
          };
          await apiService.post('/sport-fields', data);
          alert('Sport ajouté au terrain avec succès.');
          this.closeModal();
          await this.fetchTourneyDetails();
        } catch (error) {
          console.error(
            "Erreur lors de l'assignation du sport au terrain:",
            error
          );
        }
      },
      getFieldCalendarOptions(field) {
        // Génère les options du calendrier pour un terrain spécifique
        console.log(this.startDate);
        return {
          plugins: [timeGridPlugin, interactionPlugin],
          initialView: 'timeGridDay',
          timeZone: 'locale',
          initialDate: this.tourney.dateTourney,
          locale: 'fr',
          editable: true,
          slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // Format 24h
          },
          headerToolbar: false, // Supprimer les onglets de navigation et la date
          allDaySlot: false, // Supprimer le slot "all-day"
          height: 500, // Agrandir la vue du calendrier dans la card
          slotMinTime: '06:00:00', // Heure de début minimum
          slotMaxTime: '20:00:00', // Heure de fin maximum
          events: field.sportFields.map((sportField) => ({
            id: sportField.id,
            title: sportField.sport.name,
            start: `${this.tourney.dateTourney}T${sportField.startTime}`,
            end: `${this.tourney.dateTourney}T${sportField.endTime}`,
            backgroundColor: sportField.sport.color || '#cccccc',
            extendedProps: {
              fieldId: field.id,
            },
          })),
          eventDrop: this.handleEventDrop,
          eventResize: this.handleEventResize,
        };
      },
      handleEventDrop({ event }) {
        // Mise à jour côté backend lorsque l'événement est déplacé
        console.log('Événement déplacé:', event);

        // Extraire l'heure de début et de fin en supprimant le fuseau horaire
        const startTime = event.start.toISOString().split('T')[1].split('.')[0]; // Format HH:MM:SS
        const endTime = event.end.toISOString().split('T')[1].split('.')[0]; // Format HH:MM:SS

        const updatedEvent = {
          id: event.id,
          startTime,
          endTime,
          fieldId: event.extendedProps.fieldId,
        };

        this.updateEventInDatabase(updatedEvent);
      },
      handleEventResize({ event }) {
        // Mise à jour côté backend lorsque l'événement est redimensionné
        console.log('Événement redimensionné:', event);
        const updatedEvent = {
          id: event.id,
          startTime: event.startStr.split('T')[1],
          endTime: event.endStr.split('T')[1],
          fieldId: event.extendedProps.fieldId,
        };

        this.updateEventInDatabase(updatedEvent);
      },

      async updateEventInDatabase(event) {
        try {
          await apiService.put(`/sport-fields/${event.id}`, {
            startTime: event.startTime,
            endTime: event.endTime,
            fieldId: event.fieldId,
          });
          alert('Les horaires ont été mis à jour avec succès.');
        } catch (error) {
          console.error('Erreur lors de la mise à jour des horaires:', error);
          alert('Une erreur est survenue.');
        }
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
</style>
