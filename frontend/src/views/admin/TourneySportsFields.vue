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
      >
        {{ sport.name }}
      </div>
    </div>

    <!-- Grille des terrains avec le calendrier FullCalendar -->
    <div
      v-if="tourney.dateTourney && fields.length"
      class="grid gap-4 justify-items-stretch"
      :class="gridClasses"
    >
      <div
        v-for="(field, index) in fields"
        :key="field.id"
        class="relative bg-white dark:bg-dark-card shadow-lg rounded-lg p-2 w-full"
      >
        <!-- Nom du terrain avec le numéro -->
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-bold text-center truncate">
            {{ field.name }}
          </h3>
          <span class="text-sm text-gray-500">
            {{ index + 1 }}/{{ fields.length }}
          </span>
        </div>
        <p class="truncate">{{ field.description }}</p>

        <!-- FullCalendar pour chaque terrain -->
        <FullCalendar
          :options="getFieldCalendarOptions(field)"
          :key="tourney.dateTourney + '-' + field.id"
        />
      </div>
    </div>
  </div>
</template>

<script>
  import FullCalendar from '@fullcalendar/vue3';
  import timeGridPlugin from '@fullcalendar/timegrid';
  import dayGridPlugin from '@fullcalendar/daygrid'; // Import du plugin dayGrid
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
      await this.fetchTourneySportsFields(); // Récupérer les sports associés aux terrains du tournoi
      await this.fetchSports(); // Récupérer tous les sports pour la sport list drag n drop

      // Rendre les éléments de sport externes "draggables"
      this.initializeExternalEvents();
    },
    computed: {
      gridClasses() {
        const fieldCount = this.fields.length;

        // Classes pour la grille responsive
        const baseClasses = 'grid-cols-1';
        const smClasses = 'sm:grid-cols-1';
        const mdClasses = fieldCount >= 2 ? 'md:grid-cols-2' : 'md:grid-cols-1';
        const lgClasses = fieldCount >= 3 ? 'lg:grid-cols-3' : '';
        const xlClasses = fieldCount >= 4 ? 'xl:grid-cols-4' : '';
        const xxlClasses = fieldCount >= 5 ? '2xl:grid-cols-5' : '';

        return [
          baseClasses,
          smClasses,
          mdClasses,
          lgClasses,
          xlClasses,
          xxlClasses,
        ].join(' ');
      },
    },
    methods: {
      async fetchTourneySportsFields() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/sports-fields`
          );
          this.fields = response.data;

          // Récupérer les informations du tournoi
          const tourneyResponse = await apiService.get(
            `/tourneys/${this.tourneyId}`
          );
          this.tourney = tourneyResponse.data;

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
        if (!this.tourney.dateTourney) {
          console.error('La date du tournoi n’est pas disponible');
          return {};
        }

        // Construire les événements
        const events = field.sportsFields.map((sportField) => ({
          id: sportField.id,
          title: sportField.sport.name,
          start: `${this.tourney.dateTourney}T${sportField.startTime}`,
          end: `${this.tourney.dateTourney}T${sportField.endTime}`,
          backgroundColor: sportField.sport.color || '#cccccc',
          extendedProps: {
            fieldId: field.id,
            sportId: sportField.sport.id,
          },
        }));

        return {
          plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
          initialView: 'timeGridDay', // Vous pouvez changer pour 'dayGridMonth' pour tester
          timeZone: 'local',
          initialDate: this.tourney.dateTourney,
          editable: true,
          eventContent: this.renderEventContent,
          droppable: true,
          allDaySlot: false,
          defaultTimedEventDuration: '02:00',
          height: 600,
          headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          },
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
          events: events,
        };
      },

      renderEventContent(arg) {
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
        timeRange.classList.add('text-sm', 'text-white');

        // Créer le conteneur principal
        const container = document.createElement('div');
        container.classList.add('flex', 'flex-col', 'space-y-1');

        container.appendChild(headerContainer);
        container.appendChild(timeRange);

        return { domNodes: [container] };
      },

      async handleEventReceive(info, newFieldId) {
        const event = info.event;
        try {
          const sportId = event.extendedProps.sportId;

          if (!newFieldId) {
            console.error("Problème d'ID : Terrain mal identifié.");
            info.revert();
            return;
          }

          // Vérifier si event.end est défini, sinon le définir
          if (!event.end) {
            const startDate = new Date(event.start);
            const endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + 2); // Ajouter 2 heures
            event.setEnd(endDate); // Mettre à jour l'heure de fin de l'événement
          }

          if (event.id) {
            // L'événement existe déjà, il est déplacé depuis un autre calendrier
            const eventId = event.id;

            const data = {
              fieldId: newFieldId,
              startTime: this.formatTime(event.start),
              endTime: this.formatTime(event.end),
            };

            await apiService.put(
              `/tourneys/${this.tourneyId}/sports-fields/${eventId}`,
              data
            );
          } else {
            // Nouvel événement : créer dans la base de données
            const data = {
              fieldId: newFieldId,
              sportId: sportId,
              startTime: this.formatTime(event.start),
              endTime: this.formatTime(event.end),
            };

            const response = await apiService.post(
              `/tourneys/${this.tourneyId}/sports-fields`,
              data
            );

            // Définir l'ID de l'événement depuis la réponse du backend
            event.setProp('id', response.data.id);
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

          await apiService.put(
            `/tourneys/${this.tourneyId}/sports-fields/${eventId}`,
            data
          );
          await this.fetchTourneySportsFields();
        } catch (error) {
          console.error("Erreur lors du déplacement de l'événement :", error);
          info.revert();
        }
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

          await apiService.put(
            `/tourneys/${this.tourneyId}/sports-fields/${eventId}`,
            data
          );
          await this.fetchTourneySportsFields();
        } catch (error) {
          console.error(
            "Erreur lors du redimensionnement de l'événement :",
            error
          );
          info.revert();
        }
      },

      formatDisplayTime(date) {
        const d = new Date(date);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
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
          await apiService.post(
            `/tourneys/${this.tourneyId}/sports-fields`,
            data
          );
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
          await apiService.delete(
            `/tourneys/${this.tourneyId}/sports-fields/${event.id}`
          );
          event.remove();
          await this.fetchTourneySportsFields();
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
