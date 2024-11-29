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
      <StatusSelectorComponent
        :tourneyId="tourneyId"
        statusKey="sportAssignmentStatus"
        :statusOptions="sportAssignmentStatusOptions"
        v-model="currentStatus"
      />
    </div>

    <!-- Si aucun terrain n'est trouvé, afficher un message d'avertissement -->
    <div v-if="!fields.length">
      <ErrorMessageComponent
        message="Aucun terrain trouvé. Veuillez créer des terrains avant d'assigner des sports."
      ></ErrorMessageComponent>
    </div>

    <!-- Pagination et calendrier -->
    <div class="flex flex-wrap gap-4 my-2 px-4">
      <!-- Pagination alignée à droite -->
      <div class="flex items-center gap-2 ml-auto">
        <button
          v-if="currentPage > 1"
          @click="currentPage--"
          class="text-2xl px-2 py-1 rounded navigation-button"
        >
          &lt;
        </button>
        <select
          v-model="currentPage"
          class="bg-light-form-background dark:bg-dark-form-background text-light-form-text dark:text-dark-form-text border border-light-form-border-default dark:border-dark-form-border-default rounded-md px-2 py-1"
        >
          <option v-for="page in totalPages" :key="page" :value="page">
            Page {{ page }} / {{ totalPages }}
          </option>
        </select>
        <button
          v-if="currentPage < totalPages"
          @click="currentPage++"
          class="text-2xl px-2 py-1 rounded navigation-button"
        >
          &gt;
        </button>

        <!-- Bouton Show All Fields -->
        <button
          @click="
            showAllTerrains = !showAllTerrains;
            currentPage = 1;
          "
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {{ showAllTerrains ? 'Reduce' : 'Show All Fields' }}
        </button>
      </div>
    </div>

    <!-- Calendrier avec les ressources (terrains) -->
    <div v-if="tourney.dateTourney && fields.length">
      <FullCalendar
        ref="fullCalendar"
        :options="calendarOptions"
        :key="tourney.dateTourney"
      />
    </div>
  </div>
</template>

<script>
  // Importations nécessaires
  import { mapState, mapActions } from 'vuex';
  import FullCalendar from '@fullcalendar/vue3';
  import timeGridPlugin from '@fullcalendar/timegrid';
  import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
  import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
  import apiService from '@/services/apiService';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';
  import ErrorMessageComponent from '@/components/ErrorMessageComponent.vue';
  import StatusSelectorComponent from '@/components/StatusSelectorComponent.vue';

  export default {
    components: {
      FullCalendar,
      TourneySubMenu,
      ErrorMessageComponent,
      StatusSelectorComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId, // ID du tournoi courant
        tourney: {}, // Détails du tournoi
        fields: [], // Liste des terrains du tournoi
        sports: [], // Liste des sports disponibles
        sportAssignmentStatusOptions: [
          { value: 'draft', label: 'Edition' },
          { value: 'completed', label: 'Terminé' },
        ],
        externalDraggableInstance: null,
        currentPage: 1,
        terrainsPerPage: 10,
        showAllTerrains: false,
      };
    },
    computed: {
      ...mapState('tourney', {
        statuses: (state) => state.statuses,
      }),
      isEditable() {
        return this.statuses.sportAssignmentStatus !== 'completed';
      },
      // Définir `currentStatus` comme une propriété calculée liée au store
      currentStatus: {
        get() {
          return this.statuses.sportAssignmentStatus;
        },
        set(newStatus) {
          this.$store.dispatch('tourney/updateStatus', {
            tourneyId: this.tourneyId,
            key: 'sportAssignmentStatus',
            value: newStatus,
          });
        },
      },
      totalPages() {
        if (this.showAllTerrains) {
          return 1; // Si tous les terrains sont affichés, une seule "page"
        }
        return Math.ceil(this.fields.length / this.terrainsPerPage);
      },
      paginatedFields() {
        if (this.showAllTerrains) {
          return this.fields; // Affiche tous les terrains si l'option est activée
        }
        const start = (this.currentPage - 1) * this.terrainsPerPage;
        const end = start + this.terrainsPerPage;
        return this.fields.slice(start, end);
      },
      /**
       * Options du calendrier FullCalendar avec les ressources (terrains)
       */
      calendarOptions() {
        if (!this.tourney.dateTourney) {
          console.error('La date du tournoi n’est pas disponible');
          return {};
        }

        const events = [];

        // Ajouter les sportsFields en tant qu'événements
        this.fields.forEach((field) => {
          if (field.sportsFields && field.sportsFields.length > 0) {
            field.sportsFields.forEach((sportsField) => {
              events.push({
                id: sportsField.id.toString(),
                title: sportsField.sport.name,
                start: `${this.tourney.dateTourney}T${sportsField.startTime}`,
                end: `${this.tourney.dateTourney}T${sportsField.endTime}`,
                resourceId: field.id.toString(),
                backgroundColor: sportsField.sport.color || '#cccccc',
                extendedProps: {
                  fieldId: field.id,
                  sportId: sportsField.sport.id,
                },
              });
            });
          }
        });

        return {
          plugins: [timeGridPlugin, interactionPlugin, resourceTimeGridPlugin],
          schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives', // Clé pour usage non-commercial
          initialView: 'resourceTimeGridDay',
          timeZone: 'local',
          initialDate: this.tourney.dateTourney,
          editable: this.isEditable,
          droppable: true,
          headerToolbar: false,
          height: '600px',
          defaultTimedEventDuration: '04:00',
          slotMinTime: '00:00:00',
          slotMaxTime: '24:00:00',
          slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          },
          allDaySlot: false,
          resources: this.paginatedFields.map((field) => ({
            id: field.id.toString(),
            title: field.name,
          })),
          events: events,
          eventReceive: this.handleEventReceive,
          eventDrop: this.handleEventDrop,
          eventResize: this.handleEventResize,
          eventContent: this.renderEventContent,
        };
      },
    },
    watch: {
      currentPage() {
        if (this.$refs.fullCalendar) {
          const calendarApi = this.$refs.fullCalendar.getApi();
          calendarApi.refetchResources();
        }
      },
    },
    beforeUnmount() {
      if (this.externalDraggableInstance) {
        this.externalDraggableInstance.destroy();
      }
    },
    methods: {
      // Mapper les actions du module `tourney`
      ...mapActions('tourney', [
        'fetchTourneyStatuses',
        'setTournamentName',
        'clearTournamentName',
      ]),
      /**
       * Récupère les terrains et les sports associés du tournoi depuis l'API.
       * Met à jour la liste des terrains et les détails du tournoi.
       */
      async fetchTourneySportsFields() {
        try {
          // Charger les statuts du tournoi
          await this.fetchTourneyStatuses(this.tourneyId);

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

        // Détruire l'instance précédente si elle existe
        if (this.externalDraggableInstance) {
          this.externalDraggableInstance.destroy();
          this.externalDraggableInstance = null;
        }

        const containerEl = document.getElementById('external-events');
        this.externalDraggableInstance = new Draggable(containerEl, {
          itemSelector: '.external-event',
          eventData(eventEl) {
            return {
              title: eventEl.innerText.trim(),
              backgroundColor: eventEl.style.backgroundColor,
              duration: '04:00',
              extendedProps: {
                sportId: eventEl.getAttribute('data-id'),
              },
            };
          },
        });
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

      // Les méthodes handleEventReceive, handleEventDrop, handleEventResize, deleteEvent sont celles modifiées précédemment

      async handleEventReceive(info) {
        if (!this.isEditable) {
          info.revert();
          return;
        }
        const event = info.event;
        try {
          const sportId = event.extendedProps.sportId;
          const newFieldId = event.getResources()[0]?.id;

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

          // Mettre à jour les propriétés de l'événement
          event.setExtendedProp('fieldId', newFieldId);
          event.setExtendedProp('sportId', sportId);
          event.setProp('backgroundColor', event.backgroundColor);
        } catch (error) {
          console.error("Erreur lors du traitement de l'événement :", error);
          info.revert();
        }
      },

      async handleEventDrop(info) {
        if (!this.isEditable) {
          info.revert();
          return;
        }
        const event = info.event;
        try {
          const eventId = event.id;
          const newFieldId = event.getResources()[0]?.id;

          if (!eventId || !newFieldId) {
            console.error(
              "Problème d'ID : Terrain ou événement mal identifié."
            );
            info.revert();
            return;
          }

          const data = {
            fieldId: newFieldId,
            startTime: this.formatTime(event.start),
            endTime: this.formatTime(event.end),
          };

          await apiService.put(
            `/tourneys/${this.tourneyId}/sports-fields/${eventId}`,
            data
          );

          // Mettre à jour les propriétés de l'événement
          event.setExtendedProp('fieldId', newFieldId);
        } catch (error) {
          console.error("Erreur lors du déplacement de l'événement :", error);
          info.revert();
        }
      },

      async handleEventResize(info) {
        if (!this.isEditable) {
          info.revert();
          return;
        }
        const event = info.event;
        try {
          const eventId = event.id;
          const fieldId = event.extendedProps.fieldId;

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
        } catch (error) {
          console.error(
            "Erreur lors du redimensionnement de l'événement :",
            error
          );
          info.revert();
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

      async deleteEvent(event) {
        if (!this.isEditable) return;
        try {
          await apiService.delete(
            `/tourneys/${this.tourneyId}/sports-fields/${event.id}`
          );
          event.remove();
        } catch (error) {
          console.error('Erreur lors de la suppression du sport :', error);
        }
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

      /**
       * Ajuste le nombre de terrains à afficher par page en fonction de la largeur de l'écran.
       */
      adjustTerrainsPerPage() {
        const screenWidth = window.innerWidth;

        if (screenWidth >= 1200) {
          this.terrainsPerPage = 10; // 1200px et plus : 10 terrains
        } else if (screenWidth >= 1000) {
          this.terrainsPerPage = 8; // 1000px - 1200px : 8 terrains
        } else if (screenWidth >= 800) {
          this.terrainsPerPage = 7; // 800px - 1000px : 7 terrains
        } else if (screenWidth >= 600) {
          this.terrainsPerPage = 5; // 600px - 800px : 5 terrains
        } else {
          this.terrainsPerPage = 3; // Moins de 600px : 3 terrains
        }
      },
    },

    async mounted() {
      // Méthode appelée lorsque le composant est monté
      await this.fetchTourneySportsFields(); // Récupérer les sports associés aux terrains du tournoi
      await this.fetchSports(); // Récupérer tous les sports pour la sport list drag n drop

      // Rendre les éléments de sport externes "draggables"
      this.initializeExternalEvents();

      // Ajuster la pagination
      this.adjustTerrainsPerPage();
      window.addEventListener('resize', this.adjustTerrainsPerPage);
    },
  };
</script>

<style scoped>
  .sport-item {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .navigation-button {
    transition: transform 0.2s;
  }

  .navigation-button:hover {
    transform: scale(1.2);
  }

  @import '@/assets/fullcalendar.css';
</style>
