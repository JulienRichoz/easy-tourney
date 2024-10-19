<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <!-- Liste des sports en haut, sticky sans fond gris -->
    <div
      id="external-events"
      class="p-2 rounded-lg shadow-lg sticky top-0 z-50 overflow-x-auto flex space-x-4 bg-white dark:bg-dark-background"
    >
      <!-- Sports que l'on peut glisser -->
      <div
        v-for="sport in sports"
        :key="sport.id"
        :data-id="sport.id"
        :style="{ backgroundColor: sport.color }"
        class="sport-item p-3 mb-3 rounded-lg text-center text-white font-semibold cursor-pointer transform transition duration-300 w-28 shadow-md flex items-center justify-center external-event hover:scale-110 hover:shadow-xl active:scale-95"
        @touchstart="handleSportPress"
        @mousedown="handleSportPress"
      >
        {{ sport.name }}
      </div>
    </div>

    <!-- Grille des terrains avec le calendrier FullCalendar -->
    <div
      class="fields-grid grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 justify-center"
      :class="gridColumnsClass"
    >
      <div
        v-for="(field, index) in fields"
        :key="field.id"
        :data-field-id="field.id"
        class="relative bg-white dark:bg-dark-card shadow-lg rounded-lg p-2 me-4 ms-4"
      >
        <!-- Nom du terrain avec le numéro -->
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-bold text-center truncate">
            {{ field.name }}
          </h3>
          <span class="text-sm text-gray-500"
            >{{ index + 1 }}/{{ fields.length }}</span
          >
        </div>
        <p>{{ field.description }}</p>

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
        const fieldCount = this.fields.length;
        if (fieldCount === 1) {
          return 'grid-cols-1';
        } else if (fieldCount === 2) {
          return 'grid-cols-1 md:grid-cols-2';
        } else if (fieldCount === 3) {
          return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3';
        } else if (fieldCount === 4) {
          return 'grid-cols-1 md:grid-cols-4 lg:grid-cols-4';
        } else {
          return 'grid-cols-1 md:grid-cols-4 lg:grid-cols-5';
        }
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
        const containerEl = document.getElementById('external-events');
        new Draggable(containerEl, {
          itemSelector: '.external-event',
          eventData(eventEl) {
            return {
              title: eventEl.innerText.trim(),
              backgroundColor: eventEl.style.backgroundColor,
              duration: '02:00',
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
          timeZone: 'local',
          initialDate: this.tourney.dateTourney,
          editable: true,
          eventContent: this.renderEventContent,
          droppable: true,
          allDaySlot: false,
          defaultTimedEventDuration: '02:00',
          height: 600,
          headerToolbar: false,
          slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          },
          eventReceive: (info) => this.handleEventReceive(info, field.id),
          eventDrop: (info) => this.handleEventDrop(info, field.id),
          eventResize: (info) => this.handleEventResize(info, field.id),
          eventDataTransform: (eventData) => {
            return {
              ...eventData,
              id: eventData.id, // Conserver l'ID de l'événement
            };
          },
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

      renderEventContent(arg) {
        console.log('arg.event:', arg.event);
        // Créer l'icône de suppression
        const deleteIcon = document.createElement('span');
        deleteIcon.innerHTML = '&#10060;'; // Icône de croix
        deleteIcon.classList.add('delete-icon');
        deleteIcon.style.float = 'right';
        deleteIcon.style.color = 'white';
        deleteIcon.style.cursor = 'pointer';
        deleteIcon.style.padding = '0 5px';

        // Gestionnaire pour le double-clic sur les ordinateurs de bureau
        deleteIcon.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          this.deleteEvent(arg.event);
        });

        // Gestionnaire pour l'appui long sur les appareils mobiles
        let pressTimer;

        deleteIcon.addEventListener('touchstart', (e) => {
          e.stopPropagation();
          pressTimer = setTimeout(() => {
            this.deleteEvent(arg.event);
          }, 600);
        });

        deleteIcon.addEventListener('touchend', () => {
          clearTimeout(pressTimer);
        });

        // Créer le titre de l'événement
        const title = document.createElement('span');
        title.innerText = arg.event.title;

        title.classList.add('font-semibold', 'text-white');
        // Créer un conteneur pour le titre et l'icône de suppression
        const headerContainer = document.createElement('div');
        headerContainer.classList.add(
          'flex',
          'justify-between',
          'items-center'
        );

        headerContainer.appendChild(title);
        headerContainer.appendChild(deleteIcon);

        // Formater les heures de début et de fin
        const startTime = this.formatDisplayTime(arg.event.start);
        const endTime = this.formatDisplayTime(arg.event.end);

        const timeRange = document.createElement('div');
        timeRange.innerText = `${startTime} - ${endTime}`;
        console.log('RenderEventContent ', endTime);
        timeRange.classList.add('text-sm', 'text-white');

        // Créer le conteneur principal
        const container = document.createElement('div');
        container.classList.add('flex', 'flex-col', 'space-y-1');

        container.appendChild(headerContainer);
        container.appendChild(timeRange);

        return { domNodes: [container] };
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
          const startDate = new Date(info.date); // Obtenir l'heure de début
          const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Ajouter 2 heures
          const startTime = this.formatTime(startDate); // Formatter l'heure de début
          const endTime = this.formatTime(endDate); // Formatter l'heure de fin

          // Créer l'objet de données à envoyer pour l'assignation
          const data = {
            fieldId: fieldId,
            sportId: sportId,
            startTime: startTime,
            endTime: endTime,
          };
          await this.assignSport(data);
        } catch (error) {
          console.error(
            "Erreur lors de l'ajout du sport au calendrier:",
            error
          );
        }
      },
      async handleEventReceive(info, newFieldId) {
        const event = info.event;
        try {
          const eventId = event.id;
          let sportId = event.extendedProps.sportId;

          if (!newFieldId) {
            console.error("Problème d'ID : Terrain mal identifié.");
            info.revert();
            return;
          }

          // Vérifier si event.end est défini, sinon le définir
          console.log('event.end: ', event.end);
          if (!event.end) {
            const startDate = new Date(event.start);
            const endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + 2); // Ajouter 2 heures
            event.setEnd(endDate); // Mettre à jour l'heure de fin de l'événement
          }

          if (eventId) {
            // Événement existant : mettre à jour le terrain
            if (!sportId) {
              // Récupérer le sportId depuis l'API
              const response = await apiService.get(
                `/sports-fields/${eventId}`
              );
              sportId = response.data.sportId;
            }

            if (!sportId) {
              console.error("Problème d'ID : Sport mal identifié.");
              info.revert();
              return;
            }
            // Créer un nouvel objet Date pour l'heure de début
            const startDate = new Date(event.start);

            // Cloner l'heure de début pour l'heure de fin
            const endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + 2); // Ajouter 2 heures

            const data = {
              fieldId: newFieldId,
              sportId: sportId,
              startTime: this.formatTime(startDate),
              endTime: this.formatTime(endDate),
            };

            await apiService.put(`/sports-fields/${eventId}`, data);
          } else {
            // Nouvel événement : créer dans la base de données
            if (!sportId) {
              console.error(
                "Problème d'ID : Sport mal identifié pour le nouvel événement."
              );
              info.revert();
              return;
            }

            const data = {
              fieldId: newFieldId,
              sportId: sportId,
              startTime: this.formatTime(event.start),
              endTime: this.formatTime(event.end),
            };

            await apiService.post('/sports-fields', data);
          }

          await this.fetchTourneySportsFields();
        } catch (error) {
          console.error("Erreur lors du traitement de l'événement :", error);
          info.revert();
        }
      },

      async handleEventDrop(info, fieldId) {
        const event = info.event;
        try {
          const eventId = event.id;

          if (!eventId || !fieldId) {
            console.error(
              "Problème d'ID : Terrain ou événement mal identifié."
            );
            info.revert();
            return;
          }

          const data = {
            fieldId: fieldId,
            startTime: this.formatTime(event.start),
            endTime: this.formatTime(event.end),
          };

          await apiService.put(`/sports-fields/${eventId}`, data);
        } catch (error) {
          console.error("Erreur lors du déplacement de l'événement :", error);
          info.revert();
        }
      },
      formatDisplayTime(date) {
        const d = new Date(date);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      },

      async handleEventResize(info, fieldId) {
        const event = info.event;
        try {
          const eventId = event.id;

          if (!eventId || !fieldId) {
            console.error(
              "Problème d'ID : Terrain ou événement mal identifié."
            );
            info.revert();
            return;
          }

          const data = {
            startTime: this.formatTime(event.start),
            endTime: this.formatTime(event.end),
          };

          await apiService.put(`/sports-fields/${eventId}`, data);
        } catch (error) {
          console.error(
            "Erreur lors du redimensionnement de l'événement :",
            error
          );
          info.revert();
        }
      },

      formatTime(date) {
        const d = new Date(date);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const seconds = d.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      },

      async assignSport(data) {
        try {
          await apiService.post('/sports-fields', data);
          await this.fetchTourneySportsFields();
        } catch (error) {
          console.error(
            "Erreur lors de l'assignation du sport au terrain:",
            error
          );
        }
      },

      async deleteEvent(event) {
        try {
          await apiService.delete(`/sports-fields/${event.id}`);
          event.remove();
        } catch (error) {
          console.error('Erreur lors de la suppression du sport :', error);
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

  @import '@/assets/fullcalendar.css';
</style>
