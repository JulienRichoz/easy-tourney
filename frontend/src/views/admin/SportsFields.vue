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
          eventContent: this.renderEventContent,
          droppable: true,
          headerToolbar: false, // Enlève les boutons de navigation
          eventReceive: (info) => {
            // Obtenir l'ID du sport depuis l'événement d'origine
            const sportId =
              info.event.extendedProps.sportId ||
              info.draggedEl.getAttribute('data-sport-id');

            if (sportId) {
              info.event.setExtendedProp('sportId', sportId);
            } else {
              // Si le sportId est toujours null, essayer de le récupérer via event.id
              const eventId = info.event.id;
              const retrievedSportId = this.getSportIdFromEventId(eventId);
              if (retrievedSportId) {
                info.event.setExtendedProp('sportId', retrievedSportId);
              }
            }

            // Maintenant, appelez handleEventReceive
            this.handleEventReceive(info, field.id);
          },
          drop: (info) => this.handleDrop(info, field.id), // Passer l'ID du terrain ici
          eventLeave: (info) => this.handleEventLeave(info, field.id),
          eventDrop: this.handleEventDrop, // Gestion du déplacement des événements
          eventResize: this.handleEventResize, // Gestion du redimensionnement des événements
          eventDataTransform: (eventData) => {
            return {
              ...eventData,
              // Copier les extendedProps si nécessaire
              extendedProps: { ...eventData.extendedProps },
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

      handleEventLeave(info, oldFieldId) {
        // Vous pouvez effectuer des actions ici si nécessaire
        console.log('Événement quitté le terrain ID:', oldFieldId);
        console.log('Événement ID:', info.event.id);
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
          console.log(
            "Double-clic sur l'icône de suppression pour l'événement ID:",
            arg.event.id
          );
          this.deleteEvent(arg.event);
        });

        // Gestionnaire pour l'appui long sur les appareils mobiles
        let pressTimer;

        deleteIcon.addEventListener('touchstart', (e) => {
          e.stopPropagation();
          pressTimer = setTimeout(() => {
            console.log(
              "Appui long sur l'icône de suppression pour l'événement ID:",
              arg.event.id
            );
            this.deleteEvent(arg.event);
          }, 800); // Durée de l'appui long en millisecondes (ici 800ms)
        });

        deleteIcon.addEventListener('touchend', () => {
          clearTimeout(pressTimer);
        });

        // Créer l'élément de titre de l'événement
        const title = document.createElement('span');
        title.innerText = arg.event.title;

        // Créer le conteneur pour le titre et l'icône
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';

        container.appendChild(title);
        container.appendChild(deleteIcon);

        // Retourner les nœuds DOM
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

      getSportIdFromEventId(eventId) {
        for (const field of this.fields) {
          for (const sportsField of field.sportsFields) {
            if (sportsField.id.toString() === eventId.toString()) {
              return sportsField.sport.id;
            }
          }
        }
        return null;
      },

      async handleEventDrop(info, fieldId) {
        const event = info.event;
        try {
          const sportId = event.extendedProps.sportId;

          if (!sportId || !fieldId) {
            console.error("Problème d'ID : Terrain ou Sport mal identifié.");
            return;
          }

          // Préparer les données pour mettre à jour l'heure de l'événement
          const data = {
            fieldId: fieldId,
            startTime: this.formatTime(event.start),
            endTime: this.formatTime(event.end),
          };

          // Mettre à jour l'événement dans la base de données
          await apiService.put(`/sports-fields/${event.id}`, data);

          console.log('Événement déplacé avec succès');
        } catch (error) {
          console.error("Erreur lors du déplacement de l'événement :", error);
          // Revenir à l'état précédent en cas d'erreur
          info.revert();
        }
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

      async handleEventReceive(info, newFieldId) {
        const event = info.event;
        try {
          const sportId = event.extendedProps.sportId;

          if (!sportId) {
            console.error("Problème d'ID : Sport mal identifié.");
            info.revert();
            return;
          }

          if (!newFieldId) {
            console.error("Problème d'ID : Terrain mal identifié.");
            info.revert();
            return;
          }

          const data = {
            fieldId: newFieldId,
            sportId: sportId,
            startTime: this.formatTime(event.start),
            endTime: this.formatTime(event.end),
          };

          if (event.id) {
            // Événement existant : mettre à jour le terrain
            await apiService.put(`/sports-fields/${event.id}`, data);
            console.log('Événement transféré avec succès');
          } else {
            // Nouvel événement : créer dans la base de données
            await apiService.post('/sports-fields', data);
            console.log('Nouveau sport ajouté avec succès');
          }

          await this.fetchTourneySportsFields();
        } catch (error) {
          console.error("Erreur lors du traitement de l'événement :", error);
          info.revert();
        }
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
      async deleteEvent(event) {
        try {
          await apiService.delete(`/sports-fields/${event.id}`);
          // Supprimer l'événement du calendrier
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
</style>
