<!-- views/admin/TourneyPoolSchedule.vue -->

<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <!-- Liste des pools en haut, sticky sans fond gris -->
    <div
      id="external-events"
      class="p-2 rounded-lg shadow-lg sticky top-0 z-50 overflow-x-auto flex items-center justify-between bg-white dark:bg-dark-background"
    >
      <!-- Conteneur pour les pools -->
      <div class="flex space-x-4">
        <!-- Pools que l'on peut glisser -->
        <div
          v-for="pool in pools"
          :key="pool.id"
          :data-id="pool.id"
          :class="[
            'pool-item',
            'p-3',
            'mb-3',
            'rounded-lg',
            'text-center',
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
            'bg-blue-500',
            'text-white',
          ]"
        >
          {{ pool.name }}
        </div>
      </div>

      <!-- Bouton pour configurer le scheduleTourney -->
      <ButtonComponent
        fontAwesomeIcon="cog"
        @click="openScheduleConfigModal"
        variant="secondary"
      >
      </ButtonComponent>

      <!-- Sélecteur de statut aligné à droite -->
      <StatusSelectorComponent
        :tourneyId="tourneyId"
        statusKey="poolAssignmentStatus"
        :statusOptions="poolAssignmentStatusOptions"
      />
    </div>

    <!-- Si aucun terrain n'est trouvé, afficher un message d'avertissement -->
    <div v-if="!fields.length">
      <ErrorMessageComponent
        message="Aucun terrain trouvé. Veuillez créer des terrains avant d'assigner des pools."
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

    <!-- Modal pour configurer le planning du tournoi -->
    <ModalComponent
      v-if="showScheduleConfigModal"
      @close="showScheduleConfigModal = false"
    >
      <template #title>Configurer le planning du tournoi</template>
      <template #content>
        <!-- Formulaire pour configurer le scheduleTourney -->
        <form @submit.prevent="saveScheduleConfig">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="startTime" class="block text-sm font-medium">
                Heure de début
              </label>
              <input
                type="time"
                id="startTime"
                v-model="scheduleConfig.startTime"
                class="mt-1 block w-full border rounded-md shadow-sm"
              />
            </div>
            <div>
              <label for="endTime" class="block text-sm font-medium">
                Heure de fin
              </label>
              <input
                type="time"
                id="endTime"
                v-model="scheduleConfig.endTime"
                class="mt-1 block w-full border rounded-md shadow-sm"
              />
            </div>
            <div>
              <label for="poolDuration" class="block text-sm font-medium">
                Durée d'une session (minutes)
              </label>
              <input
                type="number"
                id="poolDuration"
                v-model.number="scheduleConfig.poolDuration"
                min="5"
                step="5"
                class="mt-1 block w-full border rounded-md shadow-sm"
              />
            </div>
            <div>
              <label for="transitionPoolTime" class="block text-sm font-medium">
                Temps de transition (minutes)
              </label>
              <input
                type="number"
                id="transitionPoolTime"
                v-model.number="scheduleConfig.transitionPoolTime"
                min="0"
                step="5"
                class="mt-1 block w-full border rounded-md shadow-sm"
              />
            </div>
            <!-- Vous pouvez ajouter d'autres champs pour intro, lunch, outro -->
          </div>
          <div class="mt-4 flex justify-end">
            <ButtonComponent type="submit" variant="primary">
              Enregistrer
            </ButtonComponent>
          </div>
        </form>
      </template>
    </ModalComponent>
  </div>
</template>

<script>
  import { mapState, mapActions } from 'vuex';
  import FullCalendar from '@fullcalendar/vue3';
  import timeGridPlugin from '@fullcalendar/timegrid';
  import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
  import apiService from '@/services/apiService';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';
  import ErrorMessageComponent from '@/components/ErrorMessageComponent.vue';
  import StatusSelectorComponent from '@/components/StatusSelectorComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import ModalComponent from '@/components/ModalComponent.vue';

  export default {
    components: {
      FullCalendar,
      TourneySubMenu,
      ErrorMessageComponent,
      StatusSelectorComponent,
      ButtonComponent,
      ModalComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId, // ID du tournoi courant
        tourney: {}, // Détails du tournoi
        fields: [], // Liste des terrains du tournoi
        pools: [], // Liste des pools du tournoi
        poolSchedules: [], // Liste des poolSchedules
        poolAssignmentStatusOptions: [
          { value: 'draft', label: 'Édition' },
          { value: 'completed', label: 'Terminé' },
        ],
        externalDraggableInstance: null,
        showScheduleConfigModal: false,
        scheduleConfig: {
          startTime: '',
          endTime: '',
          poolDuration: 60,
          transitionPoolTime: 0,
          // Ajoutez d'autres champs si nécessaire
        },
      };
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
        return this.statuses.poolAssignmentStatus !== 'completed';
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
       * Récupère les terrains du tournoi depuis l'API.
       * Met à jour la liste des terrains et les détails du tournoi.
       */
      async fetchTourneyFields() {
        try {
          // Charger les statuts du tournoi
          await this.fetchTourneyStatuses(this.tourneyId);

          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/fields`
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
       * Récupère la liste de toutes les pools du tournoi depuis l'API.
       * Met à jour la liste des pools.
       */
      async fetchPools() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/pools`
          );
          this.pools = response.data;
          if (!this.pools.length) {
            console.warn('Aucune pool trouvée');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des pools:', error);
        }
      },

      /**
       * Récupère les poolSchedules depuis l'API.
       */
      async fetchPoolSchedules() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/pools/schedule`
          );
          this.poolSchedules = response.data;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des plannings des pools:',
            error
          );
        }
      },

      /**
       * Initialise les éléments de pools pour qu'ils soient "draggables".
       * Permet de glisser les pools vers le calendrier pour les assigner à un terrain.
       */
      initializeExternalEvents() {
        if (!this.isEditable) return; // Ne pas initialiser le drag-and-drop si non éditable

        // Détruire l'instance précédente si elle existe
        if (this.externalDraggableInstance) {
          this.externalDraggableInstance.destroy();
          this.externalDraggableInstance = null;
        }

        const containerEl = document.getElementById('external-events');
        new Draggable(containerEl, {
          itemSelector: '.external-event',
          eventData(eventEl) {
            return {
              title: eventEl.innerText.trim(),
              duration: '01:00', // Durée par défaut, modifiable
              extendedProps: {
                poolId: eventEl.getAttribute('data-id'),
              },
            };
          },
        });
      },

      /**
       * Génère les options pour FullCalendar en fonction des pools assignées à chaque terrain.
       * @param {Object} field - Le terrain pour lequel on génère le calendrier.
       * @returns {Object} Options configurées pour FullCalendar
       */
      getFieldCalendarOptions(field) {
        if (!this.tourney.dateTourney) {
          console.error('La date du tournoi n’est pas disponible');
          return {};
        }

        // Filtrer les poolSchedules pour ce terrain
        const events = this.poolSchedules
          .filter((schedule) => schedule.field.id === field.id)
          .map((schedule) => ({
            id: schedule.id,
            title: schedule.pool.name,
            start: `${schedule.date}T${schedule.startTime}`,
            end: `${schedule.date}T${schedule.endTime}`,
            backgroundColor: '#3B82F6', // Couleur par défaut pour les pools
            extendedProps: {
              fieldId: field.id,
              poolId: schedule.pool.id,
            },
          }));

        return {
          plugins: [timeGridPlugin, interactionPlugin],
          initialView: 'timeGridDay',
          timeZone: 'local',
          initialDate: this.tourney.dateTourney,
          editable: this.isEditable,
          eventContent: this.renderEventContent,
          droppable: true,
          allDaySlot: false,
          headerToolbar: false,
          slotDuration: '00:05:00', // Créneaux de 5 minutes
          height: 400, // Calendriers plus petits
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
       * Gestion de l'ajout d'un événement lorsqu'il est glissé depuis les pools externes.
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
          const poolId = event.extendedProps.poolId;

          if (!newFieldId) {
            console.error("Problème d'ID : Terrain mal identifié.");
            info.revert();
            return;
          }

          if (!event.end) {
            const startDate = new Date(event.start);
            const endDate = new Date(startDate);
            endDate.setMinutes(
              endDate.getMinutes() + this.scheduleConfig.poolDuration
            );
            event.setEnd(endDate);
          }

          const data = {
            fieldId: newFieldId,
            startTime: this.formatTime(event.start),
            endTime: this.formatTime(event.end),
            date: this.tourney.dateTourney,
          };

          const response = await apiService.post(
            `/tourneys/${this.tourneyId}/pools/${poolId}/schedule`,
            data
          );

          event.setProp('id', response.data.poolSchedule.id);

          await this.fetchPoolSchedules();
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
            date: this.tourney.dateTourney,
          };

          await apiService.put(
            `/tourneys/${this.tourneyId}/pools/schedule/${eventId}`,
            data
          );
          await this.fetchPoolSchedules();
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
            date: this.tourney.dateTourney,
          };

          await apiService.put(
            `/tourneys/${this.tourneyId}/pools/schedule/${eventId}`,
            data
          );
          await this.fetchPoolSchedules();
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
            `/tourneys/${this.tourneyId}/pools/schedule/${event.id}`
          );
          event.remove();
          await this.fetchPoolSchedules();
        } catch (error) {
          console.error('Erreur lors de la suppression du pool :', error);
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

      /**
       * Ouvre la fenêtre modale pour configurer le planning du tournoi.
       */
      openScheduleConfigModal() {
        this.showScheduleConfigModal = true;
        // Charger les données existantes si disponibles
        this.loadScheduleConfig();
      },

      /**
       * Charge la configuration existante du planning du tournoi.
       */
      async loadScheduleConfig() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/schedule`
          );
          if (response.data) {
            this.scheduleConfig = response.data;
          }
        } catch (error) {
          console.error(
            'Erreur lors de la récupération de la configuration du planning :',
            error
          );
        }
      },

      /**
       * Enregistre la configuration du planning du tournoi.
       */
      async saveScheduleConfig() {
        try {
          await apiService.post(
            `/tourneys/${this.tourneyId}/schedule`,
            this.scheduleConfig
          );
          this.showScheduleConfigModal = false;
          // Vous pouvez déclencher une mise à jour du planning ici si nécessaire
        } catch (error) {
          console.error(
            'Erreur lors de la sauvegarde de la configuration du planning :',
            error
          );
        }
      },
    },
    async mounted() {
      // Méthode appelée lorsque le composant est monté
      await this.fetchTourneyFields(); // Récupérer les terrains du tournoi
      await this.fetchPools(); // Récupérer toutes les pools
      await this.fetchPoolSchedules(); // Récupérer les poolSchedules

      // Rendre les éléments de pools externes "draggables"
      this.initializeExternalEvents();
    },
  };
</script>

<style scoped>
  .fields-grid {
    display: grid;
    gap: 1.5rem;
  }

  .pool-item {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  @import '@/assets/fullcalendar.css';
</style>
