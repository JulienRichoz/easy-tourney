<!-- views/admin/TourneyPlanning.vue -->
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
          :data-pool-name="pool.name"
          :data-sport-name="pool.sport?.name || ''"
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
    </div>

    <!-- Messages d'avertissement -->
    <div v-if="!fields.length">
      <ErrorMessageComponent
        message="Aucun terrain trouvé. Veuillez créer des terrains avant d'assigner des pools."
      ></ErrorMessageComponent>
    </div>

    <!-- Messages d'avertissement de validation -->
    <div
      v-if="warnings.length && showWarningsModal"
      class="p-4 rounded mb-4 relative flex flex-col bg-yellow-100 border border-yellow-400 text-yellow-700"
    >
      <!-- Bouton Fermer positionné en haut à droite -->
      <button
        @click="closeWarningsModal"
        class="absolute top-2 right-2 flex items-center text-yellow-700 hover:text-yellow-900"
      >
        Fermer
        <span class="ml-1">&#10006;</span>
      </button>

      <p class="font-semibold mb-2">Avertissements de Validation :</p>
      <ul class="list-disc list-inside">
        <li v-for="(warning, index) in warnings" :key="index">
          <span :class="warningClass(warning.type)">
            {{ warning.message }}
          </span>
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-4 my-2 px-4">
      <!-- Première ligne -->
      <div class="flex flex-wrap w-full items-center gap-2 sm:gap-4">
        <!-- Boutons d'action -->
        <div class="flex flex-wrap items-center gap-2 sm:gap-4 flex-grow">
          <ButtonComponent
            fontAwesomeIcon="cog"
            @click="openScheduleConfigModal"
            variant="secondary"
            class="w-auto"
          >
            <span class="hidden md:inline">Config Planning</span>
            <span class="md:hidden">Conf.</span>
          </ButtonComponent>

          <ButtonComponent
            v-if="hasPoolSchedules && isEditable"
            fontAwesomeIcon="trash"
            @click="confirmClearPlanning"
            variant="danger"
            :disabled="!pools.length"
            class="w-auto"
          >
            <span class="hidden md:inline">Reset</span>
            <span class="md:hidden">Del</span>
          </ButtonComponent>

          <ButtonComponent
            fontAwesomeIcon="cog"
            @click="openGeneratePlanningModal"
            variant="algo"
            :disabled="!isEditable || !pools.length"
            class="w-auto"
          >
            <span class="hidden md:inline">Générer</span>
            <span class="md:hidden">Gen.</span>
          </ButtonComponent>

          <ButtonComponent
            fontAwesomeIcon="check"
            @click="validatePlanning"
            variant="primary"
            :disabled="!isEditable || !hasPoolSchedules"
            class="w-auto"
          >
            <span class="hidden md:inline">Vérifier</span>
            <span class="md:hidden">Check</span>
          </ButtonComponent>
        </div>

        <!-- Sélecteur "Étape" et bouton Étape -->
        <div class="flex items-center gap-2 order-last">
          <StatusSelectorComponent
            :tourneyId="tourneyId"
            statusKey="planningStatus"
            :statusOptions="planningStatusOptions"
            v-model="currentStatus"
            label="Etape"
            :hideWhenNotStarted="false"
          />
        </div>
      </div>

      <!-- Deuxième ligne -->
      <div class="flex flex-wrap w-full items-center gap-2 sm:gap-4">
        <!-- Filtre des Pools -->
        <v-select
          :options="poolOptions"
          v-model="selectedPoolId"
          placeholder="All Pools"
          :clearable="true"
          :searchable="true"
          label="name"
          :reduce="(pool) => pool.id"
          class="w-36 flex-shrink-0"
        />

        <!-- Toggle pour les couleurs -->
        <label class="flex items-center cursor-pointer flex-shrink-0">
          <div class="relative">
            <input type="checkbox" v-model="useUnifiedColors" class="sr-only" />
            <div
              class="block bg-gray-600 w-14 h-8 rounded-full transition-colors duration-300"
              :class="{ 'bg-blue-500': useUnifiedColors }"
            ></div>
            <div
              class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300"
              :class="{ 'translate-x-full': useUnifiedColors }"
            ></div>
          </div>
          <span class="ml-2 hidden md:block text-gray-700 dark:text-gray-300">
            {{ useUnifiedColors ? 'Pool' : 'Sport' }}
          </span>
        </label>

        <!-- Pagination alignée à droite -->
        <div class="flex items-center gap-2 ml-auto">
          <button
            v-if="currentPage > 1"
            @click="currentPage--"
            class="text-gray-700 text-2xl px-2 py-1 rounded hover:bg-gray-200 navigation-button"
          >
            &lt;
          </button>
          <select v-model="currentPage" class="px-2 py-1 border rounded">
            <option v-for="page in totalPages" :key="page" :value="page">
              Page {{ page }} / {{ totalPages }}
            </option>
          </select>
          <button
            v-if="currentPage < totalPages"
            @click="currentPage++"
            class="text-gray-700 text-2xl px-2 py-1 rounded hover:bg-gray-200 navigation-button"
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
            {{ showAllTerrains ? 'Réduire' : 'Show All Fields' }}
          </button>
        </div>
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

    <!-- Calendrier avec les ressources (terrains) -->
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
      size="lg"
    >
      <template #content>
        <FormComponent
          v-model="scheduleConfig"
          :fields="scheduleFormFields"
          @form-submit="saveScheduleConfig"
          @cancel="showScheduleConfigModal = false"
          :columns="2"
          :customValidation="validateForm"
          :isEditing="this.scheduleConfig ? true : false"
        />
      </template>
    </ModalComponent>

    <!-- Modal pour éditer un événement -->
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
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import ModalComponent from '@/components/ModalComponent.vue';
  import FormComponent from '@/components/FormComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import { toast } from 'vue3-toastify';
  import StrategyPlanningGeneratorComponent from '@/components/StrategyPattern/Planning/StrategyPlanningGeneratorComponent.vue';
  import vSelect from 'vue-select';
  import 'vue-select/dist/vue-select.css';

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
      vSelect,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
        tourney: {},
        fields: [],
        pools: [],
        poolSchedules: [],
        formErrors: {}, // Pour stocker les erreurs du formulaire
        selectedPoolId: null, // ID de la pool sélectionnée pour les filtres
        planningStatusOptions: [
          { value: 'draft', label: 'Pools' },
          { value: 'games', label: 'Matchs' },
          { value: 'completed', label: 'Terminé' },
        ],
        warnings: [],
        externalDraggableInstance: null,
        showScheduleConfigModal: false,
        showWarningsModal: false,

        isSmallScreen: false, // Détecte si l'écran est petit
        currentPage: 1, // Page actuelle pour la pagination
        terrainsPerPage: 10, // Nombre de terrains visibles par page
        showAllTerrains: false, // Permet d'afficher tous les terrains
        breakpoints: {
          large: 1150,
          medium: 640,
        },

        // Configuration du planning avec valeurs par défaut
        scheduleConfig: {
          startTime: '07:30:00',
          endTime: '17:30:00',
          poolDuration: 105,
          gameDuration: 15,
          transitionPoolTime: 15,
          transitionGameTime: 5,
          introStart: '07:30:00',
          introEnd: '08:00:00',
          lunchStart: '12:00:00',
          lunchEnd: '13:00:00',
          outroStart: '17:00:00',
          outroEnd: '17:30:00',
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
            name: 'transitionPoolTime',
            type: 'number',
            label: 'Transition entre les pools (en minutes)',
            required: true,
          },
          {
            name: 'gameDuration',
            type: 'number',
            label: 'Durée d’un match (en minutes)',
            required: true,
          },
          {
            name: 'transitionGameTime',
            type: 'number',
            label: 'Transition entre les matchs (en minutes)',
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
       * Indique si le planning est éditable en fonction du statut
       */
      isEditable() {
        return this.statuses.planningStatus !== 'completed';
      },
      /**
       * Vérifie s'il y a des PoolSchedules
       */
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
      poolOptions() {
        return [{ id: null, name: 'All Pools' }, ...this.pools];
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
          // Si une pool est sélectionnée et que l'ID ne correspond pas, on saute cet événement
          if (this.selectedPoolId && schedule.pool.id !== this.selectedPoolId) {
            return;
          }
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
            extendedProps: {
              sport: schedule.sport,
              poolId: schedule.pool.id,
            },
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

        return {
          plugins: [timeGridPlugin, interactionPlugin, resourceTimeGridPlugin],
          schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives', // Clé pour usage non-commercial (https://fullcalendar.io/license)
          initialView: 'resourceTimeGridDay',
          timeZone: 'local',
          initialDate: this.tourney.dateTourney,
          editable: this.isEditable,
          droppable: true,
          height: 'auto',
          slotMinTime: this.adjustedSlotMinTime,
          slotMaxTime: this.adjustedSlotMaxTime,
          allDaySlot: false,
          resources: this.paginatedFields.map((field) => ({
            id: field.id.toString(),
            title: field.name,
          })),
          customButtons: {
            prevPage: {
              text: 'Précédent',
              click: () => {
                if (this.currentPage > 1) this.currentPage--;
              },
            },
            nextPage: {
              text: 'Suivant',
              click: () => {
                if (this.currentPage < this.totalPages) this.currentPage++;
              },
            },
          },
          /*headerToolbar: {
            left: 'prevPage,nextPage', // Boutons personnalisés
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          },*/
          events: events,
          resourceAreaHeaderContent: 'Terrains',
          slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          },
          headerToolbar: false,
          eventReceive: this.handleEventReceive,
          eventDrop: this.handleEventDrop,
          eventResize: this.handleEventResize,
          eventContent: this.renderEventContent,
        };
      },
      /**
       * Ajuste le slotMinTime pour l'affichage du calendrier
       */
      adjustedSlotMinTime() {
        const startTime = this.scheduleConfig.startTime || '07:00:00';
        return this.subtractOneHour(startTime);
      },
      /**
       * Ajuste le slotMaxTime pour l'affichage du calendrier
       */
      adjustedSlotMaxTime() {
        const endTime = this.scheduleConfig.endTime || '23:00:00';
        return this.addOneHour(endTime);
      },
    },
    watch: {
      /**
       * Observe les changements du toggle des couleurs unies
       */
      useUnifiedColors() {
        if (this.$refs.fullCalendar) {
          // Rafraîchir le calendrier pour appliquer les nouvelles couleurs
          this.$refs.fullCalendar.getApi().refetchEvents();
        }
      },
      /**
       * recharger FullCalendar à chaque changement de page
       */
      currentPage() {
        if (this.$refs.fullCalendar) {
          const calendarApi = this.$refs.fullCalendar.getApi();
          calendarApi.refetchResources(); // Recharge les ressources (terrains visibles)
        }
      },
    },
    beforeUnmount() {
      if (this.externalDraggableInstance) {
        this.externalDraggableInstance.destroy();
        window.removeEventListener('resize', this.checkScreenSize);
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
          this.scheduleConfig = data.scheduleTourney || this.scheduleConfig;

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
       * Rafraîchir les événements du calendrier
       */
      refreshCalendarEvents() {
        if (this.$refs.fullCalendar) {
          const calendarApi = this.$refs.fullCalendar.getApi();
          calendarApi.refetchEvents();
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
              title: eventEl.dataset.poolName,
              duration: '01:00', // La durée sera définie dans handleEventReceive
              create: true,
              extendedProps: {
                poolId: eventEl.dataset.id,
                poolName: eventEl.dataset.poolName,
                sportName: eventEl.dataset.sportName,
              },
            };
          },
        });
      },

      /**
       * Contenu personnalisé pour chaque événement dans FullCalendar,
       * avec des icônes d'édition et de suppression.
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
          editIcon.style.color = 'yellow';
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
       * Retourne la classe CSS appropriée en fonction du type d'avertissement.
       * @param {string} type - Le type d'avertissement ('grave', 'moyenne', 'faible').
       * @returns {string} La ou les classes CSS à appliquer.
       */
      warningClass(type) {
        switch (type) {
          case 'grave':
            return 'text-red-600 font-bold';
          case 'moyenne':
            return 'text-orange-600 font-semibold';
          case 'faible':
            return 'text-yellow-600';
          default:
            return '';
        }
      },

      isSchedule() {
        if (this.scheduleConfig) {
          return true;
        } else {
          return false;
        }
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

          // Mettre à jour l'événement avec les nouvelles informations
          event.setProp('id', response.data.poolSchedule.id);
          event.setExtendedProp('sport', response.data.poolSchedule.sport);

          // Mettre à jour le titre de l'événement
          const sportName = response.data.poolSchedule.sport
            ? ` - ${response.data.poolSchedule.sport.name}`
            : '';
          event.setProp('title', `${event.extendedProps.poolName}${sportName}`);

          // Mettre à jour la couleur de l'événement
          const backgroundColor = this.useUnifiedColors
            ? this.generateUniqueColor(poolId)
            : response.data.poolSchedule.sport?.color || '#3B82F6';
          event.setProp('backgroundColor', backgroundColor);

          // Ajouter le nouveau poolSchedule à this.poolSchedules
          this.poolSchedules.push({
            id: response.data.poolSchedule.id,
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            field: { id: data.fieldId },
            pool: { id: poolId, name: event.extendedProps.poolName },
            sport: response.data.poolSchedule.sport,
          });
        } catch (error) {
          console.error("Erreur lors du traitement de l'événement :", error);
          info.revert();
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

          const response = await apiService.put(
            `/tourneys/${this.tourneyId}/pools/schedule/${eventId}`,
            data
          );

          // Mettre à jour localement le poolSchedule
          const index = this.poolSchedules.findIndex(
            (ps) => ps.id.toString() === eventId.toString()
          );
          if (index !== -1) {
            this.poolSchedules[index].field.id = data.fieldId;
            this.poolSchedules[index].startTime = data.startTime;
            this.poolSchedules[index].endTime = data.endTime;
            this.poolSchedules[index].sport = response.data.poolSchedule.sport;
          }

          // Mettre à jour les propriétés de l'événement
          event.setExtendedProp('sport', response.data.poolSchedule.sport);
          // Mettre à jour le titre de l'événement
          const sportName = response.data.poolSchedule.sport
            ? ` - ${response.data.poolSchedule.sport.name}`
            : '';
          event.setProp('title', `${event.title.split(' - ')[0]}${sportName}`);

          // Mettre à jour la couleur de l'événement
          const backgroundColor = this.useUnifiedColors
            ? this.generateUniqueColor(event.extendedProps.poolId)
            : response.data.poolSchedule.sport?.color || '#3B82F6';
          event.setProp('backgroundColor', backgroundColor);
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
            fieldId: fieldId,
            startTime: this.formatTime(event.start),
            endTime: this.formatTime(event.end),
            date: this.tourney.dateTourney,
          };

          const response = await apiService.put(
            `/tourneys/${this.tourneyId}/pools/schedule/${eventId}`,
            data
          );

          // Mettre à jour localement le poolSchedule
          const index = this.poolSchedules.findIndex(
            (ps) => ps.id.toString() === eventId.toString()
          );
          if (index !== -1) {
            this.poolSchedules[index].startTime = data.startTime;
            this.poolSchedules[index].endTime = data.endTime;
            this.poolSchedules[index].field.id = fieldId;
            this.poolSchedules[index].sport = response.data.poolSchedule.sport;
          }

          // Mettre à jour les propriétés de l'événement
          event.setExtendedProp('sport', response.data.poolSchedule.sport);

          // Mettre à jour le titre de l'événement
          const sportName = response.data.poolSchedule.sport
            ? ` - ${response.data.poolSchedule.sport.name}`
            : '';
          event.setProp('title', `${event.title.split(' - ')[0]}${sportName}`);

          // Mettre à jour la couleur de l'événement
          const backgroundColor = this.useUnifiedColors
            ? this.generateUniqueColor(event.extendedProps.poolId)
            : response.data.poolSchedule.sport?.color || '#3B82F6';
          event.setProp('backgroundColor', backgroundColor);
        } catch (error) {
          console.error(
            "Erreur lors du redimensionnement de l'événement :",
            error
          );
          info.revert();
        }
      },

      /**
       * Enregistre les modifications apportées à un événement via le modal d'édition.
       */
      async saveEventEdits() {
        try {
          const data = {
            startTime: this.eventFormData.startTime,
            endTime: this.eventFormData.endTime,
            date: this.tourney.dateTourney,
            fieldId: this.eventToEdit.getResources()[0]?.id,
          };
          const response = await apiService.put(
            `/tourneys/${this.tourneyId}/pools/schedule/${this.eventToEdit.id}`,
            data
          );

          // Mettre à jour localement le poolSchedule
          const index = this.poolSchedules.findIndex(
            (ps) => ps.id.toString() === this.eventToEdit.id.toString()
          );
          if (index !== -1) {
            this.poolSchedules[index].startTime = data.startTime;
            this.poolSchedules[index].endTime = data.endTime;
            this.poolSchedules[index].sport = response.data.poolSchedule.sport;
          }

          // Mettre à jour les propriétés de l'événement
          const event = this.eventToEdit;
          event.setExtendedProp('sport', response.data.poolSchedule.sport);

          // Mettre à jour le titre de l'événement
          const sportName = response.data.poolSchedule.sport
            ? ` - ${response.data.poolSchedule.sport.name}`
            : '';
          event.setProp('title', `${event.title.split(' - ')[0]}${sportName}`);

          // Mettre à jour la couleur de l'événement
          const backgroundColor = this.useUnifiedColors
            ? this.generateUniqueColor(event.extendedProps.poolId)
            : response.data.poolSchedule.sport?.color || '#3B82F6';
          event.setProp('backgroundColor', backgroundColor);

          this.showEditModal = false;
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
          // Supprimer le poolSchedule de la liste locale
          this.poolSchedules = this.poolSchedules.filter(
            (ps) => ps.id.toString() !== event.id.toString()
          );
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
       * Ouvre le modal d'édition d'un événement
       * @param {Object} event - Événement à éditer
       */
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
          if (error.response && error.response.status === 404) {
            console.warn(
              'Aucune configuration existante du planning trouvée. Utilisation des valeurs par défaut.'
            );
            // La configuration n'existe pas encore, on conserve les valeurs par défaut
          } else {
            console.error(
              'Erreur lors de la récupération de la configuration du planning :',
              error
            );
          }
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
        await this.fetchPlanningDetails();
        this.closeGeneratePlanningConfirmation();
        this.validatePlanning();
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
       * Appelle l'API pour valider le planning actuel.
       */
      async validatePlanning() {
        try {
          const response = await apiService.post(
            `/tourneys/${this.tourneyId}/planning/pools/validate`
          );

          const validationResults = response.data.validation;

          if (validationResults.hasErrors) {
            // Traiter les différentes erreurs en fonction des niveaux
            const newWarnings = [];
            if (validationResults.errors.high.length > 0) {
              validationResults.errors.high.forEach((err) => {
                newWarnings.push({ type: 'grave', message: err });
              });
            }
            if (validationResults.errors.mid.length > 0) {
              validationResults.errors.mid.forEach((err) => {
                newWarnings.push({ type: 'moyenne', message: err });
              });
            }
            if (validationResults.errors.low.length > 0) {
              validationResults.errors.low.forEach((err) => {
                newWarnings.push({ type: 'faible', message: err });
              });
            }
            this.warnings = newWarnings;
            this.showWarningsModal = true;
          } else {
            toast.success('Le planning est valide sans erreurs.');
            this.warnings = [];
            this.showWarningsModal = false;
          }
        } catch (error) {
          console.error('Erreur lors de la validation du planning :', error);
          toast.error('Erreur lors de la validation du planning.');
        }
      },

      /**
       * Enregistre la configuration du planning du tournoi.
       */
      async saveScheduleConfig() {
        try {
          let successMessage = '';
          if (this.scheduleConfig.id) {
            // Si un planning existe déjà, on le met à jour avec une requête PUT
            await apiService.put(
              `/tourneys/${this.tourneyId}/schedule/${this.scheduleConfig.id}`,
              this.scheduleConfig
            );
            successMessage =
              'Configuration du planning mise à jour avec succès !';
          } else {
            // Sinon, on crée un nouveau planning avec une requête POST
            await apiService.post(
              `/tourneys/${this.tourneyId}/schedule`,
              this.scheduleConfig
            );
            successMessage =
              'Configuration du planning enregistrée avec succès !';
          }
          this.showScheduleConfigModal = false;
          // Mettre à jour les détails du planning
          await this.fetchPlanningDetails();
          this.initializeExternalEvents(); // Ré-initialiser les événements externes si nécessaire
          toast.success(successMessage);
        } catch (error) {
          console.error(
            'Erreur lors de la sauvegarde de la configuration du planning :',
            error
          );
          toast.error(
            'Erreur lors de la sauvegarde de la configuration du planning.'
          );
        }
      },

      /**
       * Ferme la modal des avertissements de validation
       */
      closeWarningsModal() {
        this.showWarningsModal = false;
        this.warnings = [];
      },

      /**
       * Soustrait une heure à une heure donnée pour l'affichage du calendrier
       * @param {string} timeStr - Heure au format HH:MM:SS
       * @returns {string} Heure ajustée au format HH:MM:SS
       */
      subtractOneHour(timeStr) {
        let [hours] = timeStr.split(':').map(Number);

        if (hours < 0) hours = 0;
        // Arrondir à l'heure inférieure
        return `${hours.toString().padStart(2, '0')}:00:00`;
      },

      /**
       * Ajoute une heure à une heure donnée pour l'affichage du calendrier
       * @param {string} timeStr - Heure au format HH:MM:SS
       * @returns {string} Heure ajustée au format HH:MM:SS
       */
      addOneHour(timeStr) {
        let [hours, minutes, seconds] = timeStr.split(':').map(Number);
        // Si les minutes ou secondes sont non nulles, on ajoute une heure supplémentaire
        if (minutes > 0 || seconds > 0) {
          hours += 1;
        }
        if (hours >= 24) hours = 23; // Pour éviter de dépasser 23h
        // Arrondir à l'heure supérieure
        minutes = 0;
        seconds = 0;
        return `${hours.toString().padStart(2, '0')}:00:00`;
      },

      /**
       * Vérifie et ajoute des avertissements si nécessaire
       */
      checkWarnings() {
        // Réinitialiser les warnings
        this.warnings = [];

        // Vérifier si le nombre de pools est supérieur au nombre de terrains
        if (this.pools.length > this.fields.length) {
          this.warnings.push({
            type: 'faible',
            message:
              "Le nombre de pools est supérieur au nombre de terrains disponibles. Cela peut entraîner des temps d'attente pour certaines pools.",
          });
          this.showWarningsModal = true;
        } else {
          this.showWarningsModal = false;
        }
      },

      /**
       * Valide le formulaire de configuration du planning.
       * @returns {Object} Erreurs de validation
       */
      validateForm() {
        const errors = {};

        const schedule = this.scheduleConfig;
        const {
          startTime,
          endTime,
          introStart,
          introEnd,
          lunchStart,
          lunchEnd,
          outroStart,
          outroEnd,
        } = schedule;

        // Fonction pour convertir une heure au format "HH:MM:SS" en nombre de secondes
        const timeStringToNumber = (timeStr) => {
          const [hours, minutes, seconds] = timeStr.split(':').map(Number);
          return hours * 3600 + minutes * 60 + (seconds || 0);
        };

        // Convertir les heures en nombres pour la comparaison
        const startTimeNum = timeStringToNumber(startTime);
        const endTimeNum = timeStringToNumber(endTime);

        // Validation globale des horaires de début et de fin
        if (startTimeNum >= endTimeNum) {
          errors.startTime =
            "L'heure de début doit être inférieure à l'heure de fin.";
          errors.endTime =
            "L'heure de fin doit être supérieure à l'heure de début.";
        }

        // Tableau des périodes optionnelles pour validation
        const timePairs = [
          {
            start: introStart,
            end: introEnd,
            label: 'Introduction',
            startField: 'introStart',
            endField: 'introEnd',
          },
          {
            start: lunchStart,
            end: lunchEnd,
            label: 'Déjeuner',
            startField: 'lunchStart',
            endField: 'lunchEnd',
          },
          {
            start: outroStart,
            end: outroEnd,
            label: 'Conclusion',
            startField: 'outroStart',
            endField: 'outroEnd',
          },
        ];

        // Validation des plages horaires par rapport à la période globale
        for (const pair of timePairs) {
          if (pair.start && pair.end) {
            const pairStartNum = timeStringToNumber(pair.start);
            const pairEndNum = timeStringToNumber(pair.end);

            if (pairStartNum >= pairEndNum) {
              errors[pair.startField] =
                `L'heure de début doit être inférieure à l'heure de fin pour la section ${pair.label}.`;
              errors[pair.endField] =
                `L'heure de fin doit être supérieure à l'heure de début pour la section ${pair.label}.`;
            }
            if (pairStartNum < startTimeNum || pairEndNum > endTimeNum) {
              errors[pair.startField] =
                `Les heures de ${pair.label} doivent être comprises entre le début (${startTime}) et la fin (${endTime}) du planning global.`;
              errors[pair.endField] =
                `Les heures de ${pair.label} doivent être comprises entre le début (${startTime}) et la fin (${endTime}) du planning global.`;
            }
          } else if ((pair.start && !pair.end) || (!pair.start && pair.end)) {
            errors[pair.startField] =
              `Veuillez fournir à la fois l'heure de début et de fin pour la section ${pair.label}.`;
            errors[pair.endField] =
              `Veuillez fournir à la fois l'heure de début et de fin pour la section ${pair.label}.`;
          }
        }

        // Retourner l'objet errors
        return errors;
      },

      checkScreenSize() {
        this.isSmallScreen = window.innerWidth < 768; // Par exemple, pour les écrans de largeur < 768px
        this.terrainsPerPage = this.isSmallScreen ? 2 : 10; // Ajustez selon vos besoins
      },
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
      this.adjustTerrainsPerPage();
      window.addEventListener('resize', this.adjustTerrainsPerPage);
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

  /* Styles pour le toggle */
  .toggle-bg {
    background-color: #ccc;
  }
  .toggle-bg-active {
    background-color: #3b82f6;
  }
  .toggle-dot {
    top: 0.25rem;
    left: 0.25rem;
    transition: transform 0.2s;
  }
  .toggle-dot-active {
    transform: translateX(1.5rem);
  }

  .navigation-button {
    transition: transform 0.2s;
  }

  .navigation-button:hover {
    transform: scale(1.2);
  }

  select {
    background-color: #f9f9f9;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.5rem;
  }
  @import '@/assets/fullcalendar.css';
</style>
