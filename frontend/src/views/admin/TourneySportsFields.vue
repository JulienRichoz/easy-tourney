<!-- views/admin/TourneySportsFields.vue -->

<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <!-- Liste des sports en haut, sticky sans fond gris -->
    <div
      id="external-events"
      class="p-2 rounded-lg shadow-lg sticky top-0 z-50 overflow-x-auto flex items-center justify-between bg-white dark:bg-dark-background"
    >
      <!-- Conteneur pour les sports -->
      <div class="flex space-x-4">
        <!-- Sports que l'on peut glisser -->
        <div
          v-for="sport in sports"
          :key="sport.id"
          :data-id="sport.id"
          :style="{ backgroundColor: sport.color }"
          :class="[
            'sport-item',
            'p-3',
            'mb-3',
            'rounded-lg',
            'text-center',
            'text-light-menuText',
            'dark:text-dark-menuText',
            'font-semibold',
            'transform',
            'transition',
            'duration-100',
            'w-28',
            'shadow-md',
            'flex',
            'items-center',
            'justify-center',
            isEditable
              ? 'cursor-pointer external-event hover:scale-110 active:scale-95'
              : 'opacity-50',
          ]"
        >
          {{ sport.name }}
        </div>
      </div>

      <!-- Sélecteur de statut aligné à droite -->
      <div class="flex items-center">
        <StatusSelectorComponent
          :tourneyId="tourneyId"
          statusKey="sportAssignmentStatus"
          :statusOptions="sportAssignmentStatusOptions"
        />
      </div>
    </div>

    <!-- Si aucun terrain n'est trouvé, afficher un message d'avertissement -->
    <div v-if="!fields.length">
      <ErrorMessageComponent
        message="Aucun terrain trouvé. Veuillez créer des terrains avant d'assigner des sports."
      ></ErrorMessageComponent>
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
  import ErrorMessageComponent from '@/components/ErrorMessageComponent.vue';
  import StatusSelectorComponent from '@/components/StatusSelectorComponent.vue';
  import { mapState } from 'vuex';

  export default {
    components: {
      FullCalendar,
      TourneySubMenu,
      ErrorMessageComponent,
      StatusSelectorComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.id, // ID du tournoi courant
        tourney: {}, // Détails du tournoi
        fields: [], // Liste des terrains du tournoi
        sports: [], // Liste des sports disponibles
        sportAssignmentStatusOptions: [
          { value: 'draft', label: 'Edition' },
          { value: 'completed', label: 'Terminé' },
        ],
      };
    },

    async mounted() {
      // Méthode appelée lorsque le composant est monté
      await this.fetchTourneySportsFields(); // Récupérer les sports associés aux terrains du tournoi
      await this.fetchSports(); // Récupérer tous les sports pour la sport list drag n drop

      // Rendre les éléments de sport externes "draggables"
      this.initializeExternalEvents();
    },

    computed: {
      /**
       * Génère dynamiquement les classes de la grille pour l'affichage responsive
       * en fonction du nombre de terrains.
       * @returns {string} Classes CSS à appliquer à la grille
       */
      gridClasses() {
        const fieldCount = this.fields.length;
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
      ...mapState('tourney', {
        statuses: (state) => state.statuses,
      }),
      isEditable() {
        return this.statuses.sportAssignmentStatus !== 'completed';
      },
    },

    methods: {
      /**
       * Récupère les terrains et les sports associés du tournoi depuis l'API.
       * Met à jour la liste des terrains et les détails du tournoi.
       */
      async fetchTourneySportsFields() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/sports-fields`
          );
          this.fields = response.data;

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

      /**
       * Récupère la liste de tous les sports disponibles depuis l'API.
       * Met à jour la liste des sports.
       */
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

      /**
       * Initialise les éléments de sports pour qu'ils soient "draggables".
       * Permet de glisser les sports vers le calendrier pour les assigner à un terrain.
       */
      initializeExternalEvents() {
        if (!this.isEditable) return; // Ne pas initialiser le drag-and-drop si non éditable

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

      /**
       * Génère les options pour FullCalendar en fonction des sports assignés à chaque terrain.
       * @param {Object} field - Le terrain pour lequel on génère le calendrier.
       * @returns {Object} Options configurées pour FullCalendar
       */
      getFieldCalendarOptions(field) {
        if (!this.tourney.dateTourney) {
          console.error('La date du tournoi n’est pas disponible');
          return {};
        }

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
          initialView: 'timeGridDay', // Peut être modifié en 'dayGridMonth'
          timeZone: 'local',
          initialDate: this.tourney.dateTourney,
          editable: this.isEditable,
          eventContent: this.renderEventContent,
          droppable: true,
          allDaySlot: false,
          headerToolbar: false,
          defaultTimedEventDuration: '02:00',
          height: 600,
          slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          },
          eventReceive: (info) => this.handleEventReceive(info, field.id),
          eventDrop: (info) => this.handleEventDrop(info, field.id),
          eventResize: (info) => this.handleEventResize(info, field.id),
          events: events,
        };
      },

      /**
       * Contenu personnalisé pour chaque événement dans FullCalendar,
       * avec un bouton de suppression.
       * @param {Object} arg - Détails de l'événement
       * @returns {Object} Contenu DOM pour l'événement
       */
      renderEventContent(arg) {
        const container = document.createElement('div');
        container.classList.add('flex', 'flex-col', 'space-y-1');

        const headerContainer = document.createElement('div');
        headerContainer.classList.add(
          'flex',
          'justify-between',
          'items-center'
        );

        const title = document.createElement('span');
        title.innerText = arg.event.title;
        title.classList.add('font-semibold', 'text-white');

        headerContainer.appendChild(title);

        if (this.isEditable) {
          const deleteIcon = document.createElement('span');
          deleteIcon.innerHTML = '&#10060;';
          deleteIcon.classList.add('delete-icon');
          deleteIcon.style.float = 'right';
          deleteIcon.style.color = 'white';
          deleteIcon.style.cursor = 'pointer';
          deleteIcon.style.padding = '0 5px';

          deleteIcon.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.deleteEvent(arg.event);
          });

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

          headerContainer.appendChild(deleteIcon);
        }

        const startTime = this.formatDisplayTime(arg.event.start);
        const endTime = this.formatDisplayTime(arg.event.end);
        const timeRange = document.createElement('div');
        timeRange.innerText = `${startTime} - ${endTime}`;
        timeRange.classList.add('text-sm', 'text-white');

        container.appendChild(headerContainer);
        container.appendChild(timeRange);

        return { domNodes: [container] };
      },

      /**
       * Gestion de l'ajout d'un événement lorsqu'il est glissé depuis les sports externes.
       * Crée ou met à jour l'événement selon qu'il existe déjà.
       * @param {Object} info - Informations sur l'événement reçu
       * @param {Number} newFieldId - ID du terrain où l'événement est assigné
       */
      async handleEventReceive(info, newFieldId) {
        if (!this.isEditable) {
          info.revert();
          return;
        }
        const event = info.event;
        try {
          const sportId = event.extendedProps.sportId;

          if (!newFieldId) {
            console.error("Problème d'ID : Terrain mal identifié.");
            info.revert();
            return;
          }

          if (!event.end) {
            const startDate = new Date(event.start);
            const endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + 2);
            event.setEnd(endDate);
          }

          if (event.id) {
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

            event.setProp('id', response.data.id);
          }

          await this.fetchTourneySportsFields();
        } catch (error) {
          console.error("Erreur lors du traitement de l'événement :", error);
          info.revert();
        }
      },

      /**
       * Gestion du déplacement d'un événement d'un terrain à un autre dans le calendrier.
       * @param {Object} info - Informations sur l'événement déplacé
       * @param {Number} fieldId - ID du terrain où l'événement a été déplacé
       */
      async handleEventDrop(info, fieldId) {
        if (!this.isEditable) {
          info.revert();
          return;
        }
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

      /**
       * Gestion du redimensionnement d'un événement (changement de durée).
       * @param {Object} info - Informations sur l'événement redimensionné
       * @param {Number} fieldId - ID du terrain de l'événement
       */
      async handleEventResize(info, fieldId) {
        if (!this.isEditable) {
          info.revert();
          return;
        }
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

      /**
       * Supprime un événement du calendrier et de la base de données.
       * @param {Object} event - Événement à supprimer
       */
      async deleteEvent(event) {
        if (!this.isEditable) return;
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

      /**
       * Formatte l'affichage des heures d'un événement.
       * @param {Date} date - La date à formater
       * @returns {string} Heure formatée (HH:MM)
       */
      formatDisplayTime(date) {
        const d = new Date(date);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      },

      /**
       * Formatte une date en format HH:MM:SS.
       * @param {Date} date - La date à formater
       * @returns {string} Heure formatée (HH:MM:SS)
       */
      formatTime(date) {
        const d = new Date(date);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const seconds = d.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
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

  @import '@/assets/fullcalendar.css';
</style>
