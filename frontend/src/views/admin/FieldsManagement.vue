<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" :tourneyName="tourney.name" />
    <div class="fields-management-container">
      <draggable
        v-if="sports.length > 0"
        v-model="sports"
        group="sports"
        itemKey="id"
        class="sports-draggable"
      >
        <template #item="{ element }">
          <div
            :key="element.id"
            class="sport-item"
            draggable="true"
            @dragstart="handleSportDragStart(element)"
            @dragend="handleDragEnd"
          >
            {{ element.name }}
          </div>
        </template>
      </draggable>

      <div class="fields-grid">
        <!-- Affichage des terrains avec calendrier -->
        <div
          v-for="field in fields"
          :key="field.id"
          class="field-card"
          @drop="handleFieldDrop(field)"
          @dragover.prevent
        >
          <h3>{{ field.name }}</h3>
          <p>{{ field.description }}</p>

          <!-- Calendrier FullCalendar pour chaque terrain -->
          <FullCalendar :options="getFieldCalendarOptions(field)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import draggable from 'vuedraggable';
  import FullCalendar from '@fullcalendar/vue3';
  import timeGridPlugin from '@fullcalendar/timegrid';
  import interactionPlugin from '@fullcalendar/interaction';
  import apiService from '@/services/apiService';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';

  export default {
    components: {
      draggable,
      FullCalendar,
      TourneySubMenu,
    },
    data() {
      return {
        tourneyId: this.$route.params.id,
        tourney: {},
        fields: [],
        sports: [],
        draggedSport: null,
        showDeleteZone: false,
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
          this.fields = response.data.fields;
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
      handleFieldDrop(field) {
        console.log('Dépôt détecté sur le terrain:', field);
        console.log('This.draggedSport: ', this.draggedSport);
        if (!this.draggedSport || !this.draggedSport.id) {
          console.error(
            'Erreur : Aucune donnée de sport valide trouvée lors du drag.'
          );
          return;
        }

        const data = {
          fieldId: field.id,
          sportId: this.draggedSport.id,
          startTime: '09:00:00', // Exemple d'heure par défaut
          endTime: '10:00:00', // Exemple d'heure par défaut
          information: '',
        };
        console.log('Field id:', field.id);
        console.log('Données pour assigner le sport au terrain:', data);
        this.assignSport(data);

        // Réinitialiser draggedSport après le drop
        this.draggedSport = null;
      },
      handleSportDragStart(sport) {
        this.draggedSport = sport;
        console.log('handleSportDragStart:', this.draggedSport);
      },
      handleDragEnd(evt) {
        console.log('Fin du drag:', evt);
        this.draggedSport = null; // Réinitialiser à la fin
      },

      handleEventReceive({ event }) {
        console.log('Sport reçu dans le calendrier:', event);

        if (!event) {
          console.error("Erreur : L'événement n'est pas défini.");
          return;
        }

        if (!this.draggedSport) {
          console.error(
            "Erreur : Aucune donnée de sport n'a été trouvée lors du drag."
          );
          return;
        }

        // Vérifiez les propriétés avant de les utiliser
        console.log(
          "Propriétés de l'événement:",
          event.start,
          event.end,
          event.extendedProps
        );
        if (!event.extendedProps || !event.extendedProps.fieldId) {
          console.error(
            "Erreur : Les propriétés étendues de l'événement sont manquantes."
          );
          return;
        }

        const data = {
          fieldId: event.extendedProps.fieldId,
          sportId: this.draggedSport.id,
          startTime: event.start
            ? event.start.toISOString().split('T')[1].split('.')[0]
            : null,
          endTime: event.end
            ? event.end.toISOString().split('T')[1].split('.')[0]
            : null,
          information: '',
        };

        if (data.startTime && data.endTime) {
          console.log('Données pour assigner le sport:', data);
          this.assignSport(data);
        } else {
          console.error(
            'Erreur : Les horaires de début ou de fin sont manquants.'
          );
        }

        // Réinitialiser le sport traîné après le drop
        this.draggedSport = null;
      },
      async assignSport(data) {
        try {
          console.log(
            "Tentative d'ajout du sport au terrain avec les données:",
            data
          );
          await apiService.post('/sport-fields', data);
          alert('Sport ajouté au terrain avec succès.');
          await this.fetchTourneyDetails();
        } catch (error) {
          console.error(
            "Erreur lors de l'assignation du sport au terrain:",
            error
          );
        }
      },

      async deleteEvent(eventId) {
        if (!eventId) {
          console.error("Erreur : L'ID de l'événement est manquant.");
          return;
        }

        try {
          console.log("Suppression de l'événement avec ID:", eventId);
          await apiService.delete(`/sport-fields/${eventId}`);
          alert('Sport supprimé avec succès.');
          await this.fetchTourneyDetails();
        } catch (error) {
          console.error('Erreur lors de la suppression du sport:', error);
        }
      },
      getFieldCalendarOptions(field) {
        return {
          plugins: [timeGridPlugin, interactionPlugin],
          initialView: 'timeGridDay',
          timeZone: 'locale',
          initialDate: this.tourney.dateTourney,
          locale: 'fr',
          editable: true,
          droppable: true, // Permet de déposer des éléments dans le calendrier
          slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          },
          headerToolbar: false,
          allDaySlot: false,
          height: 500,
          slotMinTime: '06:00:00',
          slotMaxTime: '20:00:00',
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
          eventReceive: this.handleEventReceive,
        };
      },
      handleEventDrop({ event }) {
        console.log('Événement déplacé:', event);

        if (!event) {
          console.error("Erreur : L'événement n'est pas défini.");
          return;
        }

        // Vérifiez les propriétés avant de les utiliser
        if (!event.extendedProps || !event.extendedProps.fieldId) {
          console.error(
            "Erreur : Les propriétés étendues de l'événement sont manquantes."
          );
          return;
        }

        const updatedEvent = {
          id: event.id,
          startTime: event.start
            ? event.start
                .toISOString()
                .split('T')[1]
                .split('.')[0]
                .replace('Z', '')
            : null,
          endTime: event.end
            ? event.end
                .toISOString()
                .split('T')[1]
                .split('.')[0]
                .replace('Z', '')
            : null,
          fieldId: event.extendedProps.fieldId,
        };

        if (updatedEvent.startTime && updatedEvent.endTime) {
          console.log(
            "Données mises à jour après déplacement de l'événement:",
            updatedEvent
          );
          this.updateEventInDatabase(updatedEvent);
        } else {
          console.error(
            'Erreur : Les horaires de début ou de fin sont manquants.'
          );
        }
      },

      handleEventResize({ event }) {
        console.log('Événement redimensionné:', event);
        if (!event) {
          console.error(
            "Erreur : L'événement de redimensionnement n'est pas défini."
          );
          return;
        }

        const formatTime = (date) => {
          return date.toISOString().split('T')[1].split('.')[0];
        };

        const updatedEvent = {
          id: event.id,
          startTime: formatTime(event.start).replace('Z', ''), // Enlever le Z
          endTime: formatTime(event.end).replace('Z', ''), // Enlever le Z
          fieldId: event.extendedProps.fieldId,
        };

        if (updatedEvent.startTime && updatedEvent.endTime) {
          console.log("Données mises à jour pour l'événement:", updatedEvent);
          this.updateEventInDatabase(updatedEvent);
        } else {
          console.error(
            'Erreur : Les horaires de début ou de fin sont manquants.'
          );
        }
      },
      async updateEventInDatabase(event) {
        console.log(
          "Mise à jour de l'événement dans la base de données:",
          event
        );
        if (!event || !event.id) {
          console.error('Erreur : Données de mise à jour incorrectes.');
          return;
        }

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
    display: flex;
    padding: 2rem;
  }
  .sports-sidebar {
    width: 200px;
    margin-right: 2rem;
    padding: 1rem;
    border-radius: 8px;
    background-color: #f3f4f6;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
    max-height: 600px;
  }
  .sports-draggable {
    display: flex;
    flex-direction: column;
  }
  .sport-item {
    padding: 10px;
    margin-bottom: 10px;
    cursor: grab;
    background-color: #e2e8f0;
    border-radius: 4px;
    text-align: center;
  }
  .fields-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
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
  .delete-zone {
    position: fixed;
    bottom: 0;
    left: 5%;
    width: 200px;
    height: 100px;
    background-color: #e53e3e;
    text-align: center;
    color: white;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.9;
  }
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s;
  }
  .fade-enter,
  .fade-leave-to {
    opacity: 0;
  }
</style>
