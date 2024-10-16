<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <!-- Liste des sports en haut, sticky sans fond gris -->
    <div
      class="p-2 rounded-lg shadow-lg sticky top-0 z-50 overflow-x-auto flex space-x-4 bg-white"
    >
      <!-- Sports que l'on peut glisser -->
      <div
        v-for="sport in sports"
        :key="sport.id"
        :data-id="sport.id"
        :style="{ backgroundColor: sport.color }"
        class="sport-item p-3 mb-3 rounded-lg text-center text-white font-semibold cursor-pointer hover:scale-105 transform transition duration-300 w-28 shadow-md flex items-center justify-center external-event"
      >
        {{ sport.name }}
      </div>
    </div>

    <!-- Grille des terrains avec le calendrier FullCalendar -->
    <div class="fields-grid grid gap-2 mt-2" :class="gridColumnsClass">
      <div
        v-for="field in fields"
        :key="field.id"
        :data-field-id="field.id"
        class="relative bg-white shadow-lg rounded-lg p-2 me-4 ms-4"
      >
        <!-- Nom du terrain -->
        <h3 class="text-xl font-bold text-center truncate">{{ field.name }}</h3>

        <!-- FullCalendar pour chaque terrain -->
        <FullCalendar :options="getFieldCalendarOptions(field)" />
      </div>
    </div>
  </div>
</template>

<script>
  import FullCalendar from '@fullcalendar/vue3';
  import timeGridPlugin from '@fullcalendar/timegrid';
  import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
  import apiService from '@/services/apiService';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';

  export default {
    components: {
      FullCalendar,
      TourneySubMenu,
    },
    data() {
      return {
        tourneyId: this.$route.params.id,
        tourney: {},
        fields: [],
        sports: [],
      };
    },
    async mounted() {
      await this.fetchTourneySportsFields();
      await this.fetchSports();

      // Rendre les éléments de sport externes "draggables"
      this.initializeExternalEvents();
    },
    computed: {
      gridColumnsClass() {
        return this.fields.length > 5
          ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5'
          : 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4';
      },
    },
    methods: {
      async fetchTourneySportsFields() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/sports-fields`
          );
          this.tourney = response.data;
          this.fields = response.data.fields;

          if (!this.fields.length) {
            console.warn('Aucun terrain trouvé');
          }
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
          if (!this.sports.length) {
            console.warn('Aucun sport trouvé');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des sports:', error);
        }
      },
      initializeExternalEvents() {
        const containerEl = document.querySelector('.p-2');
        new Draggable(containerEl, {
          itemSelector: '.external-event',
          eventData(eventEl) {
            return {
              title: eventEl.innerText.trim(),
              backgroundColor: eventEl.style.backgroundColor,
              extendedProps: {
                sportId: eventEl.getAttribute('data-id'),
              },
            };
          },
        });
      },
      getFieldCalendarOptions(field) {
        return {
          plugins: [timeGridPlugin, interactionPlugin],
          initialView: 'timeGridDay',
          timeZone: 'locale',
          initialDate: this.tourney.dateTourney,
          editable: true,
          droppable: true,
          headerToolbar: false, // Enlève les boutons de navigation
          drop: (info) => this.handleDrop(info, field.id), // Passer l'ID du terrain ici
          eventDrop: this.handleEventDrop, // Gestion du déplacement des événements
          eventResize: this.handleEventResize, // Gestion du redimensionnement des événements
          events: field.sportsFields.map((sportField) => ({
            id: sportField.id,
            title: sportField.sport.name,
            start: `${this.tourney.dateTourney}T${sportField.startTime}`,
            end: `${this.tourney.dateTourney}T${sportField.endTime}`,
            backgroundColor: sportField.sport.color || '#cccccc',
            extendedProps: {
              fieldId: field.id,
              sportId: sportField.sport.id,
            },
          })),
        };
      },

      async handleDrop(info, fieldId) {
        try {
          // Récupérer l'ID du sport depuis l'élément draggué
          const sportId = info.draggedEl.getAttribute('data-id');

          console.log('Sport reçu avec ID:', sportId);
          console.log('Terrain associé ID:', fieldId);

          // Vérifier que les IDs sont valides
          if (!fieldId || !sportId) {
            console.error("Problème d'ID : Terrain ou Sport mal identifié.");
            return;
          }

          // Formatage des heures pour l'envoi au backend
          const startTime = this.formatTime(info.date);
          const endTime = this.formatTime(
            new Date(info.date).setHours(new Date(info.date).getHours() + 2)
          );

          // Créer l'objet de données à envoyer pour l'assignation
          const data = {
            fieldId: fieldId,
            sportId: sportId,
            startTime: startTime,
            endTime: endTime,
          };

          console.log('Données envoyées pour assignation:', data);
          await this.assignSport(data);
        } catch (error) {
          console.error(
            "Erreur lors de l'ajout du sport au calendrier:",
            error
          );
        }
      },

      async handleEventDrop({ event }) {
        // Mise à jour lors du déplacement d'un événement dans le calendrier
        const updatedEvent = {
          id: event.id,
          fieldId: event.extendedProps.fieldId,
          startTime: this.formatTime(event.start),
          endTime: this.formatTime(event.end),
        };

        console.log('Événement déplacé, mise à jour :', updatedEvent);
        await this.updateEventInDatabase(updatedEvent);
      },

      async handleEventResize({ event }) {
        // Mise à jour lors du redimensionnement d'un événement
        const updatedEvent = {
          id: event.id,
          fieldId: event.extendedProps.fieldId,
          startTime: this.formatTime(event.start),
          endTime: this.formatTime(event.end),
        };

        console.log('Événement redimensionné, mise à jour :', updatedEvent);
        await this.updateEventInDatabase(updatedEvent);
      },

      formatTime(date) {
        const d = new Date(date);
        const hours = d.getUTCHours().toString().padStart(2, '0');
        const minutes = d.getUTCMinutes().toString().padStart(2, '0');
        const seconds = d.getUTCSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      },

      async assignSport(data) {
        try {
          await apiService.post('/sports-fields', data);
          console.log('Sport assigné avec succès');
          await this.fetchTourneySportsFields();
        } catch (error) {
          console.error(
            "Erreur lors de l'assignation du sport au terrain:",
            error
          );
        }
      },

      async updateEventInDatabase(event) {
        try {
          await apiService.put(`/sports-fields/${event.id}`, {
            startTime: event.startTime,
            endTime: event.endTime,
            fieldId: event.fieldId,
          });
          console.log("Mise à jour de l'événement réussie");
          await this.fetchTourneySportsFields(); // Rafraîchir les données après mise à jour
        } catch (error) {
          console.error("Erreur lors de la mise à jour de l'événement:", error);
        }
      },
    },
  };
</script>

<style scoped>
  .fields-grid {
    display: grid;
    gap: 1.5rem;
  }

  .sport-item {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .sport-item:hover {
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  }
</style>
