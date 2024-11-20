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
            'external-event',
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
          <span v-if="pool.sport"> - {{ pool.sport.name }}</span>
        </div>
      </div>

      <!-- Sélecteur de statut aligné à droite -->
      <StatusSelectorComponent
        :tourneyId="tourneyId"
        statusKey="planningStatus"
        :statusOptions="planningStatusOptions"
        v-model="currentStatus"
      />
    </div>
    <!-- Si aucun terrain n'est trouvé, afficher un message d'avertissement -->
    <div v-if="!fields.length">
      <ErrorMessageComponent
        message="Aucun terrain trouvé. Veuillez créer des terrains avant d'assigner des pools."
      ></ErrorMessageComponent>
    </div>
    <div
      v-if="warnings.length"
      class="p-4 bg-yellow-100 border border-yellow-400 rounded mb-4"
    >
      <ul>
        <li
          v-for="(warning, index) in warnings"
          :key="index"
          class="text-yellow-700"
        >
          {{ warning }}
        </li>
      </ul>
      <button
        @click="warnings = []"
        class="mt-2 text-sm text-blue-600 underline"
      >
        Fermer
      </button>
    </div>

    <div class="flex items-center space-x-4 my-4">
      <ButtonComponent
        fontAwesomeIcon="cog"
        @click="openScheduleConfigModal"
        variant="secondary"
      >
        Configurer le planning
      </ButtonComponent>
      <ButtonComponent
        v-if="hasPoolSchedules && isEditable"
        fontAwesomeIcon="trash"
        @click="confirmClearPlanning"
        variant="danger"
        :disabled="!pools.length"
      >
        Supprimer le planning
      </ButtonComponent>
      <ButtonComponent
        fontAwesomeIcon="cog"
        @click="openGeneratePlanningModal"
        variant="algo"
        :disabled="!isEditable || !pools.length"
      >
        Générer le planning
      </ButtonComponent>
      <!-- Toggle pour les couleurs des pools -->
      <div class="flex items-center space-x-4 my-4">
        <label class="flex items-center cursor-pointer">
          <div class="relative">
            <input type="checkbox" v-model="useUnifiedColors" class="sr-only" />
            <div class="w-10 h-4 bg-gray-400 rounded-full shadow-inner"></div>
            <div
              class="dot absolute w-6 h-6 bg-white rounded-full shadow -left-1 -top-1 transition"
              :class="{ 'translate-x-full bg-blue-500': useUnifiedColors }"
            ></div>
          </div>
          <span class="ml-3 text-gray-700">Couleurs unies</span>
        </label>
      </div>
    </div>

    <!-- Modal de Confirmation pour la Génération du Planning -->
    <StrategyPlanningGeneratorComponent
      :isVisible="showGeneratePlanningConfirmation"
      :tourneyId="tourneyId"
      :tourneyType="tourneyType"
      @close="closeGeneratePlanningConfirmation"
      @planningGenerated="handlePlanningGenerated"
    />

    <!-- Modal de Confirmation pour la Suppression du Planning -->
    <DeleteConfirmationModal
      :isVisible="showClearPlanningConfirmation"
      :isHardDelete="false"
      :title="'Suppression du Planning'"
      :message="'Êtes-vous sûr de vouloir supprimer le planning ?'"
      @cancel="closeClearPlanningConfirmation"
      @confirm="clearPlanning"
    />

    <!-- Calendrier unique avec les ressources (terrains) -->
    <div v-if="tourney.dateTourney && fields.length">
      <FullCalendar
        ref="fullCalendar"
        :options="calendarOptions"
        :key="tourney.dateTourney"
      />
    </div>

    <!-- Modal pour configurer le planning du tournoi -->
    <ModalComponent
      :isVisible="showScheduleConfigModal"
      :title="'Configurer le planning du tournoi'"
      @close="showScheduleConfigModal = false"
    >
      <template #title></template>
      <template #content>
        <FormComponent
          v-model="scheduleConfig"
          :fields="scheduleFormFields"
          @form-submit="saveScheduleConfig"
          @cancel="showScheduleConfigModal = false"
        />
      </template>
    </ModalComponent>

    <ModalComponent :isVisible="showEditModal" @close="showEditModal = false">
      <template #title>Modifier l'événement</template>
      <template #content>
        <FormComponent
          v-model="eventFormData"
          :fields="eventFormFields"
          @form-submit="saveEventEdits"
          @cancel="showEditModal = false"
        />
      </template>
    </ModalComponent>
  </div>
</template>

<script>
  import { mapState, mapActions } from 'vuex';
  import FullCalendar from '@fullcalendar/vue3';
  import timeGridPlugin from '@fullcalendar/timegrid';
  import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
  import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
  import apiService from '@/services/apiService';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';
  import ErrorMessageComponent from '@/components/ErrorMessageComponent.vue';
  import StatusSelectorComponent from '@/components/StatusSelectorComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import ModalComponent from '@/components/ModalComponent.vue';
  import FormComponent from '@/components/FormComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import { toast } from 'vue3-toastify';
  import StrategyPlanningGeneratorComponent from '@/components/StrategyPattern/Planning/StrategyPlanningGeneratorComponent.vue';

  export default {
    components: {
      FullCalendar,
      TourneySubMenu,
      ErrorMessageComponent,
      StatusSelectorComponent,
      ButtonComponent,
      ModalComponent,
      FormComponent,
      DeleteConfirmationModal,
      StrategyPlanningGeneratorComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
        tourney: {},
        fields: [],
        pools: [],
        poolSchedules: [],
        planningStatusOptions: [
          { value: 'draft', label: 'Édition' },
          { value: 'completed', label: 'Terminé' },
        ],
        warnings: [],
        externalDraggableInstance: null,
        showScheduleConfigModal: false,
        scheduleConfig: {
          startTime: '',
          endTime: '',
          poolDuration: 120,
          gameDuration: 15,
          transitionPoolTime: 15,
          transitionGameTime: 5,
          introStart: '',
          introEnd: '',
          lunchStart: '',
          lunchEnd: '',
          outroStart: '',
          outroEnd: '',
        },
        scheduleFormFields: [
          {
            name: 'startTime',
            type: 'time',
            label: 'Heure de début',
            required: true,
          },
          {
            name: 'endTime',
            type: 'time',
            label: 'Heure de fin',
            required: true,
          },
          {
            name: 'introStart',
            type: 'time',
            label: "Début de l'introduction",
          },
          {
            name: 'introEnd',
            type: 'time',
            label: "Fin de l'introduction",
          },
          {
            name: 'lunchStart',
            type: 'time',
            label: 'Début du déjeuner',
          },
          {
            name: 'lunchEnd',
            type: 'time',
            label: 'Fin du déjeuner',
          },
          {
            name: 'outroStart',
            type: 'time',
            label: 'Début de la conclusion',
          },
          {
            name: 'outroEnd',
            type: 'time',
            label: 'Fin de la conclusion',
          },
          {
            name: 'poolDuration',
            type: 'number',
            label: 'Durée d’une pool (en minutes)',
            required: true,
          },
          {
            name: 'gameDuration',
            type: 'number',
            label: 'Durée d’un match (en minutes)',
            required: true,
          },
          {
            name: 'transitionPoolTime',
            type: 'number',
            label: 'Temps de transition entre les pools (en minutes)',
            required: true,
          },
          {
            name: 'transitionGameTime',
            type: 'number',
            label: 'Temps de transition entre les matchs (en minutes)',
            required: true,
          },
        ],
        showEditModal: false,
        eventToEdit: null,
        eventFormData: {},
        eventFormFields: [
          {
            name: 'startTime',
            type: 'time',
            label: 'Heure de début',
            required: true,
          },
          {
            name: 'endTime',
            type: 'time',
            label: 'Heure de fin',
            required: true,
          },
        ],
        showGeneratePlanningConfirmation: false,
        showClearPlanningConfirmation: false,
        currentStatus: null,
        useUnifiedColors: false,
        colorMap: {}, // Pour stocker les couleurs unies par Pool ID
      };
    },
    computed: {
      ...mapState('tourney', {
        statuses: (state) => state.statuses,
        tourneyType: (state) => state.tourneyType,
      }),
      isEditable() {
        return this.statuses.planningStatus !== 'completed';
      },
      hasPoolSchedules() {
        return this.poolSchedules.length > 0;
      },
      /**
       * Génère une couleur unique basée sur l'ID de la pool
       */
      generateUniqueColor() {
        return (poolId) => {
          if (this.colorMap[poolId]) {
            return this.colorMap[poolId];
          }
          // Générer une couleur unique
          const hue = (poolId * 137.508) % 360;
          const color = `hsl(${hue}, 70%, 60%)`;
          this.colorMap[poolId] = color;
          return color;
        };
      },
      /**
       * Terrains triés par nom (ordre alphabétique ou numérique)
       */
      sortedFields() {
        return [...this.fields].sort((a, b) => {
          // Trier par nom numérique si les noms sont des nombres
          const aNum = parseInt(a.name);
          const bNum = parseInt(b.name);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          // Sinon, trier alphabétiquement
          return a.name.localeCompare(b.name);
        });
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

        // Ajouter les poolSchedules en tant qu'événements normaux
        this.poolSchedules.forEach((schedule) => {
          events.push({
            id: schedule.id.toString(),
            title:
              schedule.pool.name +
              (schedule.sport ? ` - ${schedule.sport.name}` : ''),
            start: `${schedule.date}T${schedule.startTime}`,
            end: `${schedule.date}T${schedule.endTime}`,
            resourceId: schedule.field.id.toString(),
            backgroundColor: this.useUnifiedColors
              ? this.generateUniqueColor(schedule.pool.id)
              : schedule.sport?.color || '#3B82F6',
            textColor: '#FFFFFF',
          });
        });

        // Ajouter les sportsFields en tant qu'événements de fond
        this.fields.forEach((field) => {
          if (field.sportsFields && field.sportsFields.length > 0) {
            field.sportsFields.forEach((sportsField) => {
              events.push({
                id: `bg-${field.id}-${sportsField.sport.id}-${sportsField.startTime}-${sportsField.endTime}`,
                title: sportsField.sport.name,
                start: `${this.tourney.dateTourney}T${sportsField.startTime}`,
                end: `${this.tourney.dateTourney}T${sportsField.endTime}`,
                resourceId: field.id.toString(),
                backgroundColor: sportsField.sport.color || '#cccccc',
                display: 'background',
              });
            });
          }
        });

        // const minTime = this.scheduleConfig.startTime || '07:00:00';
        // const maxTime = this.scheduleConfig.endTime || '23:00:00';

        return {
          plugins: [timeGridPlugin, interactionPlugin, resourceTimeGridPlugin],
          schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives', // Clé pour usage non-commercial
          initialView: 'resourceTimeGridDay',
          timeZone: 'local',
          initialDate: this.tourney.dateTourney,
          editable: this.isEditable,
          droppable: true,
          height: 'auto',
          slotMinTime: this.adjustedSlotMinTime,
          slotMaxTime: this.adjustedSlotMaxTime,
          allDaySlot: false, // 1) Supprimer la section all-day
          resources: this.sortedFields.map((field) => ({
            id: field.id.toString(),
            title: field.name,
          })),
          events: events,
          resourceAreaHeaderContent: 'Terrains',
          slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          },
          headerToolbar: false, // 5) Supprimer les boutons du calendrier
          eventReceive: this.handleEventReceive,
          eventDrop: this.handleEventDrop,
          eventResize: this.handleEventResize,
          eventContent: this.renderEventContent,
        };
      },
      adjustedSlotMinTime() {
        const startTime = this.scheduleConfig.startTime || '07:00:00';
        return this.subtractOneHour(startTime);
      },
      adjustedSlotMaxTime() {
        const endTime = this.scheduleConfig.endTime || '23:00:00';
        return this.addOneHour(endTime);
      },
    },
    watch: {
      useUnifiedColors() {
        // Rafraîchir le calendrier pour appliquer les nouvelles couleurs
        this.$refs.fullCalendar.getApi().refetchEvents();
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
       * Récupère les détails du planning du tournoi depuis l'API.
       * Met à jour les listes de terrains, pools, sports, etc.
       */
      async fetchPlanningDetails() {
        try {
          // Charger les statuts du tournoi
          await this.fetchTourneyStatuses(this.tourneyId);

          // Définir le statut actuel
          this.currentStatus = this.statuses.planningStatus;

          // Récupérer les détails du planning
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/planning/details`
          );

          const data = response.data;

          this.fields = data.fields || [];
          this.pools = data.pools || [];
          this.sports = data.sports || [];
          this.scheduleConfig = data.scheduleTourney || {};

          // Récupérer les détails du tournoi pour avoir la date
          const tourneyResponse = await apiService.get(
            `/tourneys/${this.tourneyId}`
          );
          this.tourney = tourneyResponse.data;

          // Vérifier que dateTourney est défini
          if (!this.tourney.dateTourney) {
            console.warn("La date du tournoi n'est pas définie.");
          }

          // Transformer les poolSchedules pour correspondre au format attendu
          this.poolSchedules = [];
          data.pools.forEach((pool) => {
            if (pool.schedules && pool.schedules.length > 0) {
              pool.schedules.forEach((schedule) => {
                this.poolSchedules.push({
                  id: schedule.id,
                  date: schedule.date,
                  startTime: schedule.startTime,
                  endTime: schedule.endTime,
                  field: schedule.field,
                  pool: {
                    id: pool.id,
                    name: pool.name,
                  },
                  sport: schedule.sport,
                });
              });
            }
          });

          if (!this.fields.length) {
            console.warn('Aucun terrain trouvé');
          }
          if (!this.pools.length) {
            console.warn('Aucune pool trouvée');
          }
          if (!this.poolSchedules.length) {
            console.warn('Aucun planning de pool trouvé');
          }
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du planning:',
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
        this.externalDraggableInstance = new Draggable(containerEl, {
          itemSelector: '.external-event',
          eventData(eventEl) {
            return {
              title: eventEl.innerText.trim(),
              duration: '01:00', // La durée sera définie dans handleEventReceive
              create: true,
              extendedProps: {
                poolId: eventEl.dataset.id,
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

        // Vérifier si l'événement est un événement de fond
        if (arg.event.display === 'background') {
          // Ne pas afficher de contenu pour les événements de fond
          container.appendChild(headerContainer);
          return { domNodes: [container] };
        }

        if (this.isEditable) {
          const editIcon = document.createElement('span');
          editIcon.innerHTML = '&#9998;'; // Icône d'édition
          editIcon.classList.add('edit-icon');
          editIcon.style.color = 'white';
          editIcon.style.cursor = 'pointer';
          editIcon.style.padding = '0 5px';

          editIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openEditModal(arg.event);
          });

          const deleteIcon = document.createElement('span');
          deleteIcon.innerHTML = '&#10060;';
          deleteIcon.classList.add('delete-icon');
          deleteIcon.style.color = 'white';
          deleteIcon.style.cursor = 'pointer';
          deleteIcon.style.padding = '0 5px';

          deleteIcon.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.deleteEvent(arg.event);
          });

          headerContainer.appendChild(editIcon);
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
       */
      async handleEventReceive(info) {
        if (!this.isEditable) {
          info.revert();
          return;
        }
        const event = info.event;
        try {
          const poolId = event.extendedProps.poolId;
          const newFieldId = event.getResources()[0]?.id;

          if (!newFieldId) {
            console.error("Problème d'ID : Terrain mal identifié.");
            info.revert();
            return;
          }

          // Définir la durée de l'événement selon poolDuration
          const durationMinutes =
            parseInt(this.scheduleConfig.poolDuration) || 60;
          const startDate = new Date(event.start);
          const endDate = new Date(
            startDate.getTime() + durationMinutes * 60000
          );
          event.setEnd(endDate);

          const data = {
            fieldId: newFieldId,
            startTime: this.formatTime(event.start),
            endTime: this.formatTime(event.end),
            date: this.tourney.dateTourney,
          };

          const response = await apiService.post(
            `/tourneys/${this.tourneyId}/pools/schedule/${poolId}`,
            data
          );

          event.setProp('id', response.data.poolSchedule.id);

          await this.fetchPlanningDetails();
        } catch (error) {
          console.error("Erreur lors du traitement de l'événement :", error);
          info.revert();
          // Vous pouvez afficher un message d'erreur à l'utilisateur ici
        }
      },

      /**
       * Gestion du déplacement d'un événement dans le calendrier.
       * @param {Object} info - Informations sur l'événement déplacé
       */
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
            date: this.tourney.dateTourney,
          };

          await apiService.put(
            `/tourneys/${this.tourneyId}/pools/schedule/${eventId}`,
            data
          );
          await this.fetchPlanningDetails();
        } catch (error) {
          console.error("Erreur lors du déplacement de l'événement :", error);
          info.revert();
        }
      },

      /**
       * Gestion du redimensionnement d'un événement (changement de durée).
       * @param {Object} info - Informations sur l'événement redimensionné
       */
      async handleEventResize(info) {
        if (!this.isEditable) {
          info.revert();
          return;
        }
        const event = info.event;
        try {
          const eventId = event.id;
          const fieldId = event.getResources()[0]?.id;

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
          await this.fetchPlanningDetails();
        } catch (error) {
          console.error(
            "Erreur lors du redimensionnement de l'événement :",
            error
          );
          info.revert();
        }
      },
      async saveEventEdits() {
        try {
          const data = {
            startTime: this.eventFormData.startTime,
            endTime: this.eventFormData.endTime,
            date: this.tourney.dateTourney,
            fieldId: this.eventToEdit.getResources()[0]?.id,
          };
          await apiService.put(
            `/tourneys/${this.tourneyId}/pools/schedule/${this.eventToEdit.id}`,
            data
          );
          this.showEditModal = false;
          await this.fetchPlanningDetails();
        } catch (error) {
          console.error(
            'Erreur lors de la sauvegarde des modifications :',
            error
          );
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
          await this.fetchPlanningDetails();
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

      openEditModal(event) {
        this.eventToEdit = event;
        this.eventFormData = {
          startTime: this.formatTime(event.start),
          endTime: this.formatTime(event.end),
        };
        this.showEditModal = true;
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
       * Ouvre le modal de confirmation pour générer le planning
       */
      openGeneratePlanningModal() {
        this.showGeneratePlanningConfirmation = true;
      },

      /**
       * Ferme le modal de confirmation pour générer le planning
       */
      closeGeneratePlanningConfirmation() {
        this.showGeneratePlanningConfirmation = false;
      },

      /**
       * Ouvre le modal de confirmation pour supprimer le planning
       */
      confirmClearPlanning() {
        this.showClearPlanningConfirmation = true;
      },

      /**
       * Ferme le modal de confirmation pour supprimer le planning
       */
      closeClearPlanningConfirmation() {
        this.showClearPlanningConfirmation = false;
      },

      /**
       * Génère le planning après confirmation
       */
      async handlePlanningGenerated() {
        this.fetchPlanningDetails();
        this.closeGeneratePlanningConfirmation();
      },

      /**
       * Supprime le planning après confirmation
       */
      async clearPlanning() {
        try {
          await apiService.delete(
            `/tourneys/${this.tourneyId}/planning/pools/reset`
          );
          toast.success('Planning supprimé avec succès !');
          this.showClearPlanningConfirmation = false;
          await this.fetchPlanningDetails();
        } catch (error) {
          console.error('Erreur lors de la suppression du planning :', error);
          toast.error('Erreur lors de la suppression du planning.');
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
          await this.fetchPlanningDetails();
          this.initializeExternalEvents(); // Ré-initialiser les événements externes si nécessaire
        } catch (error) {
          console.error(
            'Erreur lors de la sauvegarde de la configuration du planning :',
            error
          );
        }
      },

      // Reduce startTime by one hour for better UI display
      subtractOneHour(timeStr) {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours - 1, minutes, seconds || 0);
        return date.toTimeString().slice(0, 8);
      },
      // Add one hour for better UI display
      addOneHour(timeStr) {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours + 1, minutes, seconds || 0);
        return date.toTimeString().slice(0, 8);
      },

      checkWarnings() {
        // Vérifier si le nombre de pools est supérieur au nombre de terrains
        if (this.pools.length > this.fields.length) {
          this.warnings.push(
            "Le nombre de pools est supérieur au nombre de terrains disponibles. Cela peut entraîner des temps d'attente pour certaines pools."
          );
        }
      },
    },
    async mounted() {
      // Méthode appelée lorsque le composant est monté
      await this.fetchPlanningDetails(); // Récupérer les détails du planning

      // Rendre les éléments de pools externes "draggables"
      this.initializeExternalEvents();

      this.checkWarnings();
    },
  };
</script>

<style scoped>
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
