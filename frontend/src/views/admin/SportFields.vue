<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" @selectTab="selectTab" />

    <!-- Liste des sports en haut, sticky sans fond gris -->
    <div
      class="p-2 rounded-lg shadow-lg sticky top-0 z-50 overflow-x-auto flex space-x-4 bg-white"
    >
      <draggable
        v-if="sports.length > 0"
        v-model="sports"
        group="sports"
        itemKey="id"
        class="flex flex-row space-x-4 justify-center"
      >
        <template #item="{ element }">
          <div
            :key="element.id"
            :style="{ backgroundColor: element.color }"
            class="sport-item p-3 mb-3 rounded-lg text-center text-white font-semibold cursor-pointer hover:scale-105 transform transition duration-300 w-28 shadow-md flex items-center justify-center"
            draggable="true"
            @dragstart="handleSportDragStart(element)"
            @dragend="handleDragEnd"
          >
            {{ element.name }}
          </div>
        </template>
      </draggable>
    </div>

    <!-- Grille des terrains -->
    <div
      class="fields-grid grid gap-2 mt-2"
      :class="{
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5':
          fields.length > 5,
      }"
      :style="
        fields.length <= 5
          ? 'grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));'
          : ''
      "
    >
      <div
        v-for="(field, index) in fields"
        :key="field.id"
        class="relative bg-white shadow-lg rounded-lg p-2 me-4 ms-4"
        @drop="handleFieldDrop(field)"
        @dragover.prevent
      >
        <!-- Numéro du terrain en haut à droite -->
        <span class="absolute top-2 right-2 text-sm text-gray-600">
          {{ index + 1 }}/{{ fields.length }}
        </span>

        <!-- Nom du terrain -->
        <h3 class="text-xl font-bold text-center truncate">
          {{ field.name }}
        </h3>

        <!-- Détails du terrain -->
        <p class="text-sm text-center">
          {{ field.description }} <br />
          {{ tourney.dateTourney }}
        </p>

        <!-- Calendrier FullCalendar -->
        <FullCalendar :options="getFieldCalendarOptions(field)" />
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
        tourneyId: this.$route.params.id, // Identifiant du tournoi en cours
        tourney: {}, // Détails du tournoi
        fields: [], // Liste des terrains disponibles
        sports: [], // Liste des sports disponibles
        draggedSport: null, // Sport en cours de déplacement
        draggedEvent: null, // Événement en cours de déplacement
      };
    },
    async mounted() {
      await this.fetchTourneySportField(); // Récupération des détails du tournoi
      await this.fetchSports(); // Récupération de la liste des sports disponibles
    },
    methods: {
      // Récupérer les détails du tournoi actuel
      async fetchTourneySportField() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/sport-fields`
          );
          this.tourney = response.data;
          this.fields = response.data.fields;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du tournoi:',
            error
          );
        }
      },
      // Récupérer la liste des sports disponibles
      async fetchSports() {
        try {
          const response = await apiService.get('/sports');
          this.sports = response.data;
        } catch (error) {
          console.error('Erreur lors de la récupération des sports:', error);
        }
      },

      // Gestion du drop sur un terrain
      handleFieldDrop(field) {
        console.log('Dépôt détecté sur le terrain:', field);
        if (!this.draggedSport || !this.draggedSport.id) {
          console.error(
            'Erreur : Aucune donnée de sport valide trouvée lors du drag.'
          );
          return;
        }

        // Création des données pour assigner le sport au terrain
        const data = {
          fieldId: field.id,
          sportId: this.draggedSport.id,
          startTime: '08:00:00', // Exemple d'heure par défaut
          endTime: '12:00:00', // Exemple d'heure par défaut
          information: '',
        };
        console.log('Données pour assigner le sport au terrain:', data);
        this.assignSport(data);

        // Réinitialiser draggedSport après le drop
        this.draggedSport = null;
      },

      // Gestion de l'événement de début du drag d'un sport
      handleSportDragStart(sport) {
        this.draggedSport = sport;
        this.draggedEvent = null; // Assurez-vous que l'événement traîné est null
        console.log('handleSportDragStart:', this.draggedSport);
      },

      // Gestion de l'événement de début du drag d'un événement
      handleEventDragStart(event) {
        this.draggedEvent = event;
        this.draggedSport = null; // Assurez-vous que le sport traîné est null
        console.log('handleEventDragStart:', this.draggedEvent);
      },

      // Gestion de l'événement de fin du drag
      handleDragEnd(evt) {
        console.log('Fin du drag:', evt);
        this.draggedSport = null; // Réinitialiser draggedSport à la fin
        this.draggedEvent = null; // Réinitialiser draggedEvent à la fin
      },

      // Gestion du déplacement d'un événement dans le calendrier (quand un sport est reçu par un terrain)
      handleEventReceive({ event }) {
        console.log('Sport reçu dans le calendrier:', event);

        if (!event) {
          console.error("Erreur : L'événement n'est pas défini.");
          return;
        }

        if (!this.draggedSport) {
          console.error('Erreur : ce sport est déjà assigné à un terrain.');
          this.$forceUpdate();
          return;
        }

        // Création des données pour assigner le sport au terrain
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

        // Réinitialiser draggedSport après le drop
        this.draggedSport = null;
      },

      // Fonction pour assigner un sport à un terrain
      async assignSport(data) {
        try {
          console.log(
            "Tentative d'ajout du sport au terrain avec les données:",
            data
          );
          await apiService.post('/sport-fields', data);
          await this.fetchTourneySportField(); // Rafraîchir les détails du tournoi après l'assignation
        } catch (error) {
          console.error(
            "Erreur lors de l'assignation du sport au terrain:",
            error
          );
        }
      },

      // Fonction pour supprimer un événement d'un terrain
      async deleteEvent(eventId) {
        if (!eventId) {
          console.error("Erreur : L'ID de l'événement est manquant.");
          return;
        }

        try {
          console.log("Suppression de l'événement avec ID:", eventId);
          await apiService.delete(`/sport-fields/${eventId}`);
          alert('Sport supprimé avec succès.');
          await this.fetchTourneySportField(); // Rafraîchir les détails du tournoi après la suppression
        } catch (error) {
          console.error('Erreur lors de la suppression du sport:', error);
        }
      },

      // Options de configuration du calendrier FullCalendar pour chaque terrain
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
            height: 10,
          },
          headerToolbar: false,
          allDaySlot: false,
          height: 600,
          slotMinTime: '00:00:00',
          slotMaxTime: '24:00:00',
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
          eventContent: function (arg) {
            const startTime = arg.event.start
              .toISOString()
              .split('T')[1]
              .substring(0, 5); // Heure au format HH:MM
            const endTime = arg.event.end
              .toISOString()
              .split('T')[1]
              .substring(0, 5); // Heure au format HH:MM

            return {
              html: `
              <div class="fc-event-main" style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: white; font-weight: bold;">
                  ${arg.event.title}<br/>
                  <small>${startTime} - ${endTime}</small>
                </span>
                <span class="delete-icon" style="color: white; padding: 2px 6px; font-size: 150%;">&#10060;</span>
              </div>
              `,
            };
          },
          eventClick: (info) => {
            const deleteIcon = info.el.querySelector('.delete-icon');
            if (deleteIcon) {
              deleteIcon.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêche la propagation du clic pour éviter l'ouverture du détail de l'événement
                this.handleDeleteSportField(info.event.id);
              });
            }
          },
          eventDrop: this.handleEventDrop, // Gestion du déplacement d'un événement
          eventResize: this.handleEventResize, // Gestion du redimensionnement d'un événement
          eventReceive: this.handleEventReceive, // Gestion de la réception d'un événement
          eventDragStart: ({ event }) => this.handleEventDragStart(event), // Gestion du début du drag d'un événement
        };
      },

      // Gestion du déplacement d'un événement dans le calendrier (changement de terrain ou de temps)
      handleEventDrop({ event }) {
        console.log('Événement déplacé:', event);
        if (!event) {
          console.error("Erreur : L'événement n'est pas défini.");
          return;
        }

        // Création de l'objet contenant les informations mises à jour de l'événement
        const updatedEvent = {
          id: event.id,
          startTime: event.start
            ? event.start.toISOString().split('T')[1].split('.')[0]
            : null,
          endTime: event.end
            ? event.end.toISOString().split('T')[1].split('.')[0]
            : null,
          oldFieldId: event.extendedProps.fieldId, // L'ancien terrain où l'événement était
          newFieldId: event.extendedProps.fieldId, // Le nouveau terrain si différent de l'ancien
        };

        if (updatedEvent.startTime && updatedEvent.endTime) {
          console.log(
            "Données mises à jour après déplacement de l'événement:",
            updatedEvent
          );

          if (updatedEvent.oldFieldId !== updatedEvent.newFieldId) {
            // Si l'événement a changé de terrain, nous devons le supprimer de l'ancien
            this.deleteEventFromField(updatedEvent.id, updatedEvent.oldFieldId);
          }

          // Ajouter l'événement au nouveau terrain ou mettre à jour dans le même terrain
          this.updateEventInDatabase(updatedEvent);
        } else {
          console.error(
            'Erreur : Les horaires de début ou de fin sont manquants.'
          );
        }
      },

      // Gestion du redimensionnement d'un événement dans le calendrier
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

      // Suppression d'un sportField
      async handleDeleteSportField(sportFieldId) {
        if (!sportFieldId) {
          console.error('Erreur : ID du sportField manquant.');
          return;
        }

        try {
          await apiService.delete(`/sport-fields/${sportFieldId}`);
          console.log('Le sportField a été supprimé avec succès.');
          await this.fetchTourneySportField(); // Rafraîchir les détails du tournoi après suppression
        } catch (error) {
          console.error('Erreur lors de la suppression du sportField:', error);
        }
      },

      // Suppression d'un événement de l'ancien terrain (quand il est déplacé)
      async deleteEventFromField(eventId, fieldId) {
        try {
          console.log(
            `Suppression de l'événement ${eventId} de l'ancien terrain ${fieldId}`
          );
          await apiService.delete(`/sport-fields/${eventId}`);
          console.log("Événement supprimé de l'ancien terrain avec succès.");
        } catch (error) {
          console.error(
            "Erreur lors de la suppression de l'événement de l'ancien terrain:",
            error
          );
        }
      },

      // Mise à jour d'un événement dans la base de données
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
            fieldId: event.newFieldId, // Utilisez le nouveau terrain pour l'update
          });
          console.log('Les horaires ont été mis à jour avec succès.');
          await this.fetchTourneySportField(); // Rafraîchir les détails du tournoi après la mise à jour
        } catch (error) {
          console.error('Erreur lors de la mise à jour des horaires:', error);
          alert(
            "Une erreur est survenue lors de la mise à jour de l'événement."
          );
        }
      },
      selectTab(tab) {
        this.activeTab = tab;
      },
    },
  };
</script>

<style scoped>
  .fields-management-container {
    display: flex;
    padding: 2rem;
  }

  .fields-grid {
    flex: 1;
    display: grid;
    gap: 1.5rem;
  }
  .field-card {
    background-color: #f6f6f6;
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
  .sports-menu-container {
    display: flex;
    flex-direction: row;
    max-width: 100%;
    overflow-x: auto;
  }

  .sport-item {
    /* Centrer le texte dans chaque bouton */
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Effet ombre léger */
  }

  /* Effet au survol pour ajouter du dynamisme */
  .sport-item:hover {
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  }
</style>
