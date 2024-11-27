<!-- TourneyPlanningGames.vue -->
<template>
  <div>
    <!-- Tournament Sub-Menu -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <!-- Warning Messages -->
    <div v-if="!fields.length">
      <ErrorMessageComponent
        message="Aucun terrain trouvé. Veuillez créer des terrains avant d'assigner des matchs."
      ></ErrorMessageComponent>
    </div>

    <!-- Validation Warning Messages -->
    <div
      v-if="warnings.length && showWarningsModal"
      class="p-4 rounded mb-4 relative flex flex-col bg-light-warning-bg border border-light-warning-border text-light-warning-text dark:bg-dark-warning-bg dark:border-yellow-600 dark:text-dark-warning-text"
    >
      <!-- Close Button -->
      <button
        @click="closeWarningsModal"
        class="absolute top-2 right-2 flex items-center text-light-warning-text hover:text-light-warning-closeText"
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

    <!-- Action Buttons and Filters -->
    <div class="flex flex-wrap gap-4 my-2 px-4">
      <!-- First Row -->
      <div class="flex flex-wrap w-full items-center gap-2 sm:gap-4">
        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-2 sm:gap-4 flex-grow">
          <ButtonComponent
            fontAwesomeIcon="cog"
            @click="openScheduleConfigModal"
            variant="secondary"
            class="w-auto"
          >
            <span class="hidden md:inline">Config Horaires</span>
            <span class="md:hidden">Conf.</span>
          </ButtonComponent>

          <ButtonComponent
            v-if="hasGames && isEditable"
            fontAwesomeIcon="trash"
            @click="confirmClearPlanning"
            variant="danger"
            :disabled="!games.length"
            class="w-auto"
          >
            <span class="hidden md:inline">Reset</span>
            <span class="md:hidden">Del</span>
          </ButtonComponent>

          <ButtonComponent
            fontAwesomeIcon="cog"
            @click="openGeneratePlanningModal"
            variant="algo"
            :disabled="!isEditable"
            class="w-auto"
          >
            <span class="hidden md:inline">Générer</span>
            <span class="md:hidden">Gen.</span>
          </ButtonComponent>

          <ButtonComponent
            fontAwesomeIcon="check"
            @click="validatePlanning"
            variant="primary"
            :disabled="!isEditable || !hasGames"
            class="w-auto"
          >
            <span class="hidden md:inline">Vérifier</span>
            <span class="md:hidden">Check</span>
          </ButtonComponent>
        </div>

        <!-- Status Selector -->
        <div class="flex items-center gap-2 order-last">
          <StatusSelectorComponent
            :tourneyId="tourneyId"
            statusKey="planningStatus"
            :statusOptions="planningStatusOptions"
            v-model="currentStatus"
            label="Étape"
            :hideWhenNotStarted="false"
          />
        </div>
      </div>

      <!-- Second Row -->
      <div class="flex flex-wrap w-full items-center gap-2 sm:gap-4">
        <!-- Pool Filter -->
        <v-select
          :options="poolOptions"
          v-model="selectedPoolId"
          placeholder="Toutes les Pools"
          :clearable="true"
          :searchable="true"
          label="name"
          :reduce="(pool) => pool.id"
          class="w-auto flex-shrink-0 whitespace-nowrap"
        />

        <!-- Color Toggle -->
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

        <!-- Pagination -->
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

          <!-- Show All Fields Button -->
          <button
            @click="
              showAllTerrains = !showAllTerrains;
              currentPage = 1;
            "
            class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {{ showAllTerrains ? 'Réduire' : 'Afficher Tous les Terrains' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Generate Planning Confirmation Modal for Games -->
    <StrategyPlanningGeneratorComponent
      :isVisible="showGeneratePlanningConfirmation"
      :tourneyId="tourneyId"
      :tourneyType="tourneyType"
      :pools="pools"
      :fields="fields"
      :planningTourney="scheduleConfig"
      :planningType="'game'"
      @close="closeGeneratePlanningConfirmation"
      @planningGenerated="handlePlanningGenerated"
    />

    <!-- Clear Planning Confirmation Modal -->
    <DeleteConfirmationModal
      :isVisible="showClearPlanningConfirmation"
      :isHardDelete="false"
      :title="'Suppression du Planning des Matchs'"
      :message="'Êtes-vous sûr de vouloir supprimer le planning des matchs ?'"
      @cancel="closeClearPlanningConfirmation"
      @confirm="clearPlanning"
    />

    <!-- Calendar with Fields as Resources -->
    <div v-if="tourney.dateTourney && fields.length">
      <FullCalendar
        ref="fullCalendar"
        :options="calendarOptions"
        :key="tourney.dateTourney"
      />
    </div>

    <!-- Schedule Configuration Modal -->
    <ModalComponent
      :isVisible="showScheduleConfigModal"
      :title="'Configurer le planning des matchs'"
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

    <!-- Create Game Modal -->
    <ModalComponent
      :title="createModalTitle"
      :isVisible="showCreateModal"
      @close="showCreateModal = false"
    >
      <template #content>
        <FormComponent
          v-model="createFormData"
          :fields="createFormFields"
          @form-submit="saveNewEvent"
          @cancel="showCreateModal = false"
          :customValidation="validateForm"
        />
      </template>
    </ModalComponent>

    <!-- Edit Game Modal -->
    <ModalComponent
      :isVisible="showEditModal"
      @close="showEditModal = false"
      :title="'Modifier le match'"
    >
      <template #content>
        <FormComponent
          v-model="eventFormData"
          :fields="eventFormFields"
          @form-submit="saveEventEdits"
          @cancel="showEditModal = false"
          :customValidation="validateForm"
        />
      </template>
    </ModalComponent>
  </div>
</template>

<script>
  // Import necessary components and plugins
  import { mapState, mapActions } from 'vuex';
  import FullCalendar from '@fullcalendar/vue3';
  import timeGridPlugin from '@fullcalendar/timegrid';
  import interactionPlugin from '@fullcalendar/interaction';
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
        teams: [],
        games: [],
        pools: [],
        sports: [],
        scheduleConfig: {},
        formErrors: {},
        selectedPoolId: null,
        planningStatusOptions: [
          { value: 'pools', label: 'Pools' },
          { value: 'games', label: 'Matchs' },
          { value: 'completed', label: 'Terminé' },
        ],
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
        warnings: [],
        showScheduleConfigModal: false,
        showWarningsModal: false,

        isSmallScreen: false,
        currentPage: 1,
        terrainsPerPage: 6,
        showAllTerrains: false,

        showEditModal: false,
        eventToEdit: null,
        eventFormData: {},

        showGeneratePlanningConfirmation: false,
        showClearPlanningConfirmation: false,
        useUnifiedColors: false,
        colorMap: {},

        // For creating new games
        showCreateModal: false,
        createFormData: {
          startTime: '',
          endTime: '',
          poolScheduleId: null,
          fieldId: '',
          sportId: '',
          teamAId: null,
          teamBId: null,
        },
      };
    },
    computed: {
      ...mapState('tourney', {
        statuses: (state) => state.statuses,
        tourneyType: (state) => state.tourneyType,
      }),
      currentStatus: {
        get() {
          return this.statuses.planningStatus;
        },
        set(newStatus) {
          this.$store.dispatch('tourney/updateStatus', {
            tourneyId: this.tourneyId,
            key: 'planningStatus',
            value: newStatus,
          });
        },
      },
      /**
       * Calcule les pages avec une répartition équilibrée des terrains.
       */
      pages() {
        if (this.showAllTerrains) {
          return [this.filteredFields];
        }

        const total = this.filteredFields.length;
        const maxPerPage = this.terrainsPerPage;
        const numPages = Math.ceil(total / maxPerPage);

        const base = Math.floor(total / numPages);
        let remainder = total % numPages;

        const pages = [];
        let start = 0;
        for (let i = 0; i < numPages; i++) {
          let perPage = base;
          if (remainder > 0) {
            perPage += 1;
            remainder -= 1;
          }
          const end = start + perPage;
          pages.push(this.filteredFields.slice(start, end));
          start = end;
        }
        return pages;
      },

      /**
       * Nombre total de pages.
       */
      totalPages() {
        return this.pages.length;
      },

      /**
       * Terrains à afficher sur la page actuelle.
       */
      paginatedFields() {
        return this.pages[this.currentPage - 1];
      },
      /**
       * Filters fields based on selected pool
       */
      filteredFields() {
        if (this.selectedPoolId) {
          // Get field IDs where the selected pool has schedules
          const fieldIds = new Set();
          const selectedPool = this.pools.find(
            (pool) => pool.id === this.selectedPoolId
          );
          if (selectedPool && selectedPool.schedules) {
            selectedPool.schedules.forEach((schedule) => {
              fieldIds.add(schedule.fieldId);
            });
          }
          return this.fields.filter((field) => fieldIds.has(field.id));
        }
        return this.fields;
      },
      /**
       *
       */
      editTeamOptions() {
        if (this.eventToEdit && this.eventToEdit.extendedProps.game.pool) {
          const poolId = this.eventToEdit.extendedProps.game.pool.id;
          return this.teams
            .filter((team) => team.poolId === poolId)
            .map((team) => ({
              value: team.id,
              label: team.teamName,
            }));
        }
        // Si pas de pool associée, retourner toutes les équipes
        return this.teamOptions;
      },
      /**
       * Determines if the planning is editable based on the current status.
       */
      isEditable() {
        return this.statuses.planningStatus !== 'completed';
      },
      /**
       * Checks if there are any games.
       */
      hasGames() {
        return this.games.length > 0;
      },
      /**
       * Generates a unique color for pools.
       * @param {number} poolId - The ID of the pool.
       * @returns {string} - The generated color.
       */
      generateUniqueColor() {
        return (poolId) => {
          if (!poolId) return '#888888'; // Default color if poolId is undefined
          if (this.colorMap[poolId]) {
            return this.colorMap[poolId];
          }
          const hue = (poolId * 137.508) % 360;
          const color = `hsl(${hue}, 70%, 60%)`;
          this.colorMap[poolId] = color;
          return color;
        };
      },
      poolOptions() {
        return [{ id: null, name: 'Toutes les Pools' }, ...this.pools];
      },
      teamOptions() {
        return this.teams.map((team) => ({
          value: team.id,
          label: team.teamName,
        }));
      },
      fieldOptions() {
        return this.fields.map((field) => ({
          value: field.id,
          label: field.name,
        }));
      },
      sportOptions() {
        return this.sports.map((sport) => ({
          value: sport.id,
          label: sport.name,
        }));
      },
      /**
       * Filters teams based on the selected pool.
       */
      filteredTeams() {
        if (this.selectedPoolId) {
          return this.teams.filter(
            (team) => team.poolId === this.selectedPoolId
          );
        }
        return this.teams;
      },
      /**
       * Configures the options for FullCalendar.
       */
      calendarOptions() {
        if (!this.tourney.dateTourney) {
          console.error('La date du tournoi n’est pas disponible');
          return {};
        }

        const events = [];

        // Add games as events
        this.games.forEach((game) => {
          // Filter by selected pool and team
          if (this.selectedPoolId && game.pool?.id !== this.selectedPoolId) {
            return;
          }
          // Check if game.field is defined
          if (!game.field) {
            console.warn(`Game with ID ${game.id} has no field assigned.`);
            return;
          }
          // Check if game.teamA and game.teamB are defined
          const teamATeamName = game.teamA?.teamName || 'Équipe A';
          const teamBTeamName = game.teamB?.teamName || 'Équipe B';

          events.push({
            id: game.id.toString(),
            resourceId: game.field.id.toString(),
            title: `${teamATeamName} vs ${teamBTeamName}`,
            start: new Date(game.startTime),
            end: new Date(game.endTime),
            backgroundColor: this.useUnifiedColors
              ? this.generateUniqueColor(game.pool?.id)
              : game.sport?.color || '#3B82F6',
            textColor: '#FFFFFF',
            extendedProps: { game },
          });
        });

        // Add poolSchedules as background events
        this.pools.forEach((pool) => {
          if (pool.schedules && pool.schedules.length > 0) {
            pool.schedules.forEach((schedule) => {
              // If a pool is selected and doesn't match, skip
              if (this.selectedPoolId && pool.id !== this.selectedPoolId) {
                return;
              }
              events.push({
                id: `pool-${pool.id}-schedule-${schedule.id}`,
                start: `${schedule.date}T${schedule.startTime}`,
                end: `${schedule.date}T${schedule.endTime}`,
                resourceId: schedule.fieldId.toString(),
                display: 'background',
                backgroundColor: this.generateUniqueColor(pool.id),
              });
            });
          }
        });

        return {
          plugins: [timeGridPlugin, interactionPlugin, resourceTimeGridPlugin],
          schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
          initialView: 'resourceTimeGridDay',
          timeZone: 'local',
          initialDate: this.tourney.dateTourney,
          editable: this.isEditable,
          droppable: true, // Permet de déposer les éléments
          eventStartEditable: true, // Autorise le déplacement des événements
          eventDurationEditable: true, // Autorise les ajustements de durée
          selectable: this.isEditable,
          select: this.handleSelect,
          eventOverlap: true,
          height: 'auto',
          slotMinTime: this.adjustedSlotMinTime,
          slotMaxTime: this.adjustedSlotMaxTime,
          slotDuration: '00:05:00',
          slotLabelInterval: '00:15:00',
          allDaySlot: false,
          resources: this.paginatedFields.map((field) => ({
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
          headerToolbar: false,
          eventDrop: this.handleEventDrop,
          eventResize: this.handleEventResize,
          eventContent: this.renderEventContent,
          // Enhanced hover feedback
          eventMouseEnter: this.handleEventMouseEnter,
          eventMouseLeave: this.handleEventMouseLeave,
        };
      },
      adjustedSlotMinTime() {
        const startTime = this.scheduleConfig.startTime || '07:00:00';
        return startTime;
      },
      adjustedSlotMaxTime() {
        const endTime = this.scheduleConfig.endTime || '23:00:00';
        return endTime;
      },
      /**
       * Defines the fields for the edit game form.
       */
      eventFormFields() {
        return [
          {
            name: 'teamAId',
            type: 'select',
            label: 'Équipe A',
            options: this.editTeamOptions,
            required: true,
          },
          {
            name: 'teamBId',
            type: 'select',
            label: 'Équipe B',
            options: this.editTeamOptions,
            required: true,
          },

          {
            name: 'startTime',
            type: 'datetime-local',
            label: 'Heure de début',
            required: true,
          },
          {
            name: 'endTime',
            type: 'datetime-local',
            label: 'Heure de fin',
            required: true,
          },
        ];
      },
      /**
       * Defines the fields for the create game form.
       */
      createFormFields() {
        const fields = [
          {
            name: 'teamAId',
            type: 'select',
            label: 'Équipe A',
            options: this.createTeamOptions,
            required: true,
          },
          {
            name: 'teamBId',
            type: 'select',
            label: 'Équipe B',
            options: this.createTeamOptions,
            required: true,
          },
          {
            name: 'startTime',
            type: 'datetime-local',
            label: 'Heure de début',
            required: true,
          },
          {
            name: 'endTime',
            type: 'datetime-local',
            label: 'Heure de fin',
            required: true,
            // disabled: this.autoCalculateEndTime,
          },
        ];

        // Ajout conditionnel de 'fieldId' et 'sportId' si 'poolScheduleId' est null
        if (!this.createFormData.poolScheduleId) {
          fields.push(
            {
              name: 'fieldId',
              type: 'select',
              label: 'Terrain',
              options: this.fieldOptions,
              required: true,
            },
            {
              name: 'sportId',
              type: 'select',
              label: 'Sport',
              options: this.sportOptions,
              required: true,
            }
          );
        }

        return fields;
      },

      /**
       * Determines if end time should be auto-calculated.
       */
      autoCalculateEndTime() {
        return !!this.createFormData.poolScheduleId;
      },
      /**
       * Provides team options based on the pool when creating a game.
       */
      createTeamOptions() {
        if (this.createFormData.poolScheduleId) {
          const pool = this.findPoolByScheduleId(
            this.createFormData.poolScheduleId
          );
          if (pool) {
            return pool.teams.map((team) => ({
              value: team.id,
              label: team.teamName,
            }));
          }
        }
        return this.teamOptions;
      },
      /**
       * Dynamically sets the title for the create game modal.
       */
      createModalTitle() {
        if (this.createFormData.poolScheduleId) {
          const pool = this.findPoolByScheduleId(
            this.createFormData.poolScheduleId
          );
          if (pool) {
            const schedule = pool.schedules.find(
              (s) => s.id === this.createFormData.poolScheduleId
            );
            const sportName = schedule.sport ? schedule.sport.name : 'Sport';
            return `${pool.name} - ${sportName}`;
          }
        }
        return 'Créer un Match';
      },
    },
    watch: {
      useUnifiedColors() {
        if (this.$refs.fullCalendar) {
          this.$refs.fullCalendar.getApi().refetchEvents();
        }
      },
      currentPage() {
        if (this.$refs.fullCalendar) {
          const calendarApi = this.$refs.fullCalendar.getApi();
          calendarApi.refetchResources();
        }
      },
      currentStatus(newStatus) {
        if (newStatus === 'pools') {
          this.$router.push({
            name: 'AdminTourneyPlanningPools',
            params: { tourneyId: this.tourneyId },
          });
        } else if (newStatus === 'games') {
          this.$router.push({
            name: 'AdminTourneyPlanningGames',
            params: { tourneyId: this.tourneyId },
          });
        } else if (newStatus === 'completed') {
          // Rediriger vers la vue appropriée pour 'Terminé'
          this.$router.push({
            name: 'AdminTourneyPlanningCompleted',
            params: { tourneyId: this.tourneyId },
          });
        }
      },
    },
    methods: {
      // Map Vuex actions
      ...mapActions('tourney', [
        'fetchTourneyStatuses',
        'setTournamentName',
        'clearTournamentName',
      ]),
      /**
       * Fetches planning details including fields, pools, games, etc.
       */
      async fetchPlanningDetails() {
        try {
          await this.fetchTourneyStatuses(this.tourneyId);
          this.currentStatus = this.statuses.planningStatus;

          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/planning/details`
          );

          const data = response.data;

          this.fields = data.fields || [];
          this.pools = data.pools || [];
          this.games = data.games || [];
          this.sports = data.sports || [];
          this.scheduleConfig = data.scheduleTourney || this.scheduleConfig;

          // Fetch tournament details to get the date
          const tourneyResponse = await apiService.get(
            `/tourneys/${this.tourneyId}`
          );
          this.tourney = tourneyResponse.data;

          // Fetch teams with their poolId
          const teamsResponse = await apiService.get(
            `/tourneys/${this.tourneyId}/teams`
          );
          this.teams = teamsResponse.data;

          // Check if dateTourney is defined
          if (!this.tourney.dateTourney) {
            console.warn("La date du tournoi n'est pas définie.");
          }
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du planning:',
            error
          );
        }
      },
      /**
       * Refreshes calendar events.
       */
      refreshCalendarEvents() {
        if (this.$refs.fullCalendar) {
          const calendarApi = this.$refs.fullCalendar.getApi();
          calendarApi.refetchEvents();
        }
      },
      /**
       * Renders custom event content with sport and pool information.
       * @param {Object} arg - Event render info.
       * @returns {Object} - Custom DOM nodes.
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

        // Check if the event is editable and not a background event
        if (this.isEditable && arg.event.display !== 'background') {
          const editIcon = document.createElement('span');
          editIcon.innerHTML = '&#9998;';
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

        // For background events or events without a game, we might not have start and end times
        const startTime = arg.event.start
          ? this.formatDisplayTime(arg.event.start)
          : '';
        const endTime = arg.event.end
          ? this.formatDisplayTime(arg.event.end)
          : '';
        const timeRange = document.createElement('div');
        if (startTime && endTime) {
          timeRange.innerText = `${startTime} - ${endTime}`;
          timeRange.classList.add('text-sm', 'text-white');
        }

        // Display sport and pool information if 'game' exists
        const game = arg.event.extendedProps.game;
        if (game) {
          const sportPoolInfo = document.createElement('div');
          const poolName = game.pool ? game.pool.name : '';
          const sportName = game.sport ? game.sport.name : '';
          sportPoolInfo.innerText = `${poolName} - ${sportName}`;
          sportPoolInfo.classList.add('text-xs', 'text-white');

          container.appendChild(headerContainer);
          container.appendChild(timeRange);
          container.appendChild(sportPoolInfo);
        } else {
          // For events without 'game' (e.g., background events), only show the title and time range if available
          container.appendChild(headerContainer);
          if (startTime && endTime) {
            container.appendChild(timeRange);
          }
        }

        return { domNodes: [container] };
      },

      /**
       * Handles the hover over events to provide feedback.
       * @param {Object} info - Event hover info.
       */
      handleEventMouseEnter() {
        // Add custom hover effects if needed
      },
      /**
       * Handles the mouse leave event.
       * @param {Object} info - Event hover leave info.
       */
      handleEventMouseLeave() {
        // Remove custom hover effects if needed
      },
      /**
       * Returns CSS class based on warning type.
       * @param {string} type - Warning type.
       * @returns {string} - CSS class.
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
      /**
       * Handles selection on the calendar to create a new game.
       * @param {Object} selectionInfo - Selection info from FullCalendar.
       */
      handleSelect(selectionInfo) {
        if (!this.isEditable) return;

        const poolSchedule = this.findPoolScheduleForSelection(selectionInfo);

        if (poolSchedule) {
          // Si un poolSchedule est trouvé, remplir les données en conséquence
          this.createFormData = {
            startTime: this.formatDateTime(selectionInfo.start),
            endTime: this.calculateEndTime(
              selectionInfo.start,
              this.scheduleConfig.gameDuration
            ),
            poolScheduleId: poolSchedule.id,
            teamAId: null,
            teamBId: null,
            fieldId: null,
            sportId: null,
          };
        } else {
          // Si aucun poolSchedule n'est trouvé, permettre la création sans poolScheduleId
          this.createFormData = {
            startTime: this.formatDateTime(selectionInfo.start),
            endTime: this.calculateEndTime(
              selectionInfo.start,
              this.scheduleConfig.gameDuration
            ),
            poolScheduleId: null,
            fieldId: selectionInfo.resource.id,
            sportId: null,
            teamAId: null,
            teamBId: null,
          };
        }
        this.showCreateModal = true;
      },
      /**
       * Finds the pool schedule for a given selection.
       * @param {Object} selectionInfo - Selection info from FullCalendar.
       * @returns {Object|null} - The matching pool schedule or null.
       */
      findPoolScheduleForSelection(selectionInfo) {
        const selectionStart = selectionInfo.start;
        const selectionEnd = selectionInfo.end;
        const resourceId = selectionInfo.resource.id;

        // Iterate over all poolSchedules
        for (const pool of this.pools) {
          for (const schedule of pool.schedules) {
            // Check if the schedule is on the same field
            if (schedule.fieldId.toString() === resourceId) {
              const scheduleStart = new Date(
                `${schedule.date}T${schedule.startTime}`
              );
              const scheduleEnd = new Date(
                `${schedule.date}T${schedule.endTime}`
              );

              // Check if the selection is within the schedule
              if (
                selectionStart >= scheduleStart &&
                selectionEnd <= scheduleEnd
              ) {
                return schedule;
              }
            }
          }
        }
        return null;
      },
      /**
       * Finds a pool by its schedule ID.
       * @param {number} scheduleId - The schedule ID.
       * @returns {Object|null} - The matching pool or null.
       */
      findPoolByScheduleId(scheduleId) {
        for (const pool of this.pools) {
          if (pool.schedules.some((s) => s.id === scheduleId)) {
            return pool;
          }
        }
        return null;
      },
      /**
       * Formats a Date object to 'YYYY-MM-DDTHH:MM' format.
       * @param {Date} date - The date to format.
       * @returns {string} - The formatted date string.
       */
      formatDateTime(date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
          return null;
        }
        const year = d.getFullYear().toString().padStart(4, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      },
      /**
       * Calculates the end time based on start time and duration.
       * @param {Date} startTime - The start time.
       * @param {number} durationMinutes - Duration in minutes.
       * @returns {string} - The calculated end time in 'YYYY-MM-DDTHH:MM' format.
       */
      calculateEndTime(startTime, durationMinutes) {
        const endDate = new Date(startTime.getTime() + durationMinutes * 60000);
        return this.formatDateTime(endDate);
      },
      /**
       * Saves a new game after form submission.
       */
      async saveNewEvent() {
        try {
          const data = {
            teamAId: this.createFormData.teamAId,
            teamBId: this.createFormData.teamBId,
            startTime: this.createFormData.startTime.replace('T', ' ') + ':00',
            endTime: this.createFormData.endTime.replace('T', ' ') + ':00',
          };

          if (this.createFormData.poolScheduleId) {
            data.poolScheduleId = this.createFormData.poolScheduleId;
          } else {
            data.fieldId = Number(this.createFormData.fieldId);
            data.sportId = this.createFormData.sportId;
          }
          console.log('Données envoyées au serveur:', data);

          const response = await apiService.post(
            `/tourneys/${this.tourneyId}/games`,
            data
          );

          const newGame = response.data;

          // Manually assign the field to the new game if it's not included in the response
          if (!newGame.field && data.fieldId) {
            const field = this.fields.find((f) => f.id === data.fieldId);
            if (field) {
              newGame.field = field;
            } else {
              console.warn(`Field with ID ${data.fieldId} not found.`);
            }
          }

          // Similarly, assign the sport if it's not included
          if (!newGame.sport && data.sportId) {
            const sport = this.sports.find((s) => s.id === data.sportId);
            if (sport) {
              newGame.sport = sport;
            } else {
              console.warn(`Sport with ID ${data.sportId} not found.`);
            }
          }

          this.games.push(newGame);
          this.refreshCalendarEvents();
          this.showCreateModal = false;
        } catch (error) {
          console.error('Erreur lors de la création du match :', error);
          toast.error('Erreur lors de la création du match.');
        }
      },

      /**
       * Helper function to format time from a Date object.
       * @param startTime
       * @param endTime
       * @param fieldId
       */
      findPoolScheduleAtPosition(startTime, endTime, fieldId) {
        for (const pool of this.pools) {
          for (const schedule of pool.schedules) {
            if (schedule.fieldId.toString() === fieldId) {
              const scheduleStart = new Date(
                `${schedule.date}T${schedule.startTime}`
              );
              const scheduleEnd = new Date(
                `${schedule.date}T${schedule.endTime}`
              );
              if (startTime >= scheduleStart && endTime <= scheduleEnd) {
                return schedule;
              }
            }
          }
        }
        return null;
      },
      /**
       * Handles the drag and drop of events on the calendar.
       * Allows moving within the same pool schedule.
       * @param {Object} info - Event drop info from FullCalendar.
       */
      async handleEventDrop(info) {
        if (!this.isEditable) {
          info.revert();
          return;
        }

        const event = info.event;
        const eventId = event.id;
        const newFieldId = event.getResources()[0]?.id;
        const newStart = event.start;
        const newEnd = event.end;
        const currentGame = event.extendedProps.game;

        try {
          const poolScheduleAtNewPosition = this.findPoolScheduleAtPosition(
            newStart,
            newEnd,
            newFieldId
          );

          let data = {
            startTime: this.formatTime(newStart),
            endTime: this.formatTime(newEnd),
            fieldId: newFieldId,
            poolScheduleId: currentGame.poolScheduleId || null,
          };

          if (currentGame.poolScheduleId) {
            // Game has a poolScheduleId
            if (
              !poolScheduleAtNewPosition ||
              poolScheduleAtNewPosition.id !== currentGame.poolScheduleId
            ) {
              toast.warning(
                'Vous ne pouvez pas déplacer ce match en dehors de son pool schedule.'
              );
              info.revert();
              return;
            }

            if (poolScheduleAtNewPosition.id !== currentGame.poolScheduleId) {
              // Check if sports match
              if (poolScheduleAtNewPosition.sportId !== currentGame.sport.id) {
                toast.warning(
                  'Vous ne pouvez pas déplacer ce match vers un pool schedule avec un sport différent.'
                );
                info.revert();
                return;
              }
              // Update poolScheduleId
              data.poolScheduleId = poolScheduleAtNewPosition.id;
            }
            // Update data
            data.poolScheduleId = currentGame.poolScheduleId;
          } else {
            // Game does not have a poolScheduleId
            if (poolScheduleAtNewPosition) {
              toast.warning(
                'Vous ne pouvez pas déplacer ce match dans un créneau de pool.'
              );
              info.revert();
              return;
            }
            // Ensure poolScheduleId remains null
            data.poolScheduleId = null;
          }

          const response = await apiService.put(
            `/tourneys/${this.tourneyId}/games/${eventId}`,
            data
          );

          // Update the game locally
          const index = this.games.findIndex(
            (g) => g.id.toString() === event.id
          );
          if (index !== -1) {
            this.games[index] = response.data;
          }

          // Update event properties
          event.setExtendedProp('game', response.data);
        } catch (error) {
          console.error("Erreur lors du déplacement de l'événement :", error);
          info.revert();
        }
      },

      /**
       * Finds the poolSchedule for a given event.
       * @param {Object} event - The event object from FullCalendar.
       * @returns {Object|null} - The matching poolSchedule or null.
       */
      findPoolScheduleForEvent(event) {
        const eventStart = event.start;
        const eventEnd = event.end;
        const resourceId = event.getResources()[0]?.id;

        for (const pool of this.pools) {
          for (const schedule of pool.schedules) {
            if (schedule.fieldId.toString() === resourceId) {
              const scheduleStart = new Date(
                `${schedule.date}T${schedule.startTime}`
              );
              const scheduleEnd = new Date(
                `${schedule.date}T${schedule.endTime}`
              );
              if (eventStart >= scheduleStart && eventEnd <= scheduleEnd) {
                return schedule;
              }
            }
          }
        }
        return null;
      },

      /**
       * Handles event resizing on the calendar.
       * @param {Object} info - Event resize info from FullCalendar.
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

          // Ensure the resized event stays within its pool schedule
          const poolSchedule = this.findPoolScheduleForEvent(event);

          if (
            (event.extendedProps.game.poolScheduleId && !poolSchedule) ||
            (poolSchedule &&
              event.extendedProps.game.poolScheduleId !== poolSchedule.id)
          ) {
            // Prevent resizing outside of the pool schedule
            toast.error(
              'Vous ne pouvez pas redimensionner ce match en dehors de son pool schedule.'
            );
            info.revert();
            return;
          }

          if (poolSchedule) {
            data.poolScheduleId = poolSchedule.id;
          }

          const response = await apiService.put(
            `/tourneys/${this.tourneyId}/games/${eventId}`,
            data
          );

          // Update the game locally
          const index = this.games.findIndex(
            (g) => g.id.toString() === eventId.toString()
          );
          if (index !== -1) {
            this.games[index] = response.data;
          }

          // Update event properties
          event.setExtendedProp('game', response.data);
        } catch (error) {
          console.error(
            "Erreur lors du redimensionnement de l'événement :",
            error
          );
          info.revert();
        }
      },
      /**
       * Saves edits to an event after form submission.
       */
      async saveEventEdits() {
        try {
          const data = {
            teamAId: this.eventFormData.teamAId,
            teamBId: this.eventFormData.teamBId,
            startTime: this.eventFormData.startTime.replace('T', ' ') + ':00',
            endTime: this.eventFormData.endTime.replace('T', ' ') + ':00',
            fieldId: this.eventFormData.fieldId,
          };
          const response = await apiService.put(
            `/tourneys/${this.tourneyId}/games/${this.eventToEdit.id}`,
            data
          );

          // Update the game locally
          const index = this.games.findIndex(
            (g) => g.id.toString() === this.eventToEdit.id.toString()
          );
          if (index !== -1) {
            this.games[index] = response.data;
          }

          // Update event properties
          const event = this.eventToEdit;
          event.setExtendedProp('game', response.data);
          this.refreshCalendarEvents();
          this.showEditModal = false;
        } catch (error) {
          console.error(
            'Erreur lors de la sauvegarde des modifications :',
            error
          );
          toast.error('Erreur lors de la sauvegarde des modifications.');
        }
      },
      /**
       * Deletes an event.
       * @param {Object} event - The event object from FullCalendar.
       */
      async deleteEvent(event) {
        if (!this.isEditable) return;
        try {
          await apiService.delete(
            `/tourneys/${this.tourneyId}/games/${event.id}`
          );
          event.remove();
          // Remove the game from the local list
          this.games = this.games.filter(
            (g) => g.id.toString() !== event.id.toString()
          );
        } catch (error) {
          console.error('Erreur lors de la suppression du match :', error);
          toast.error('Erreur lors de la suppression du match.');
        }
      },
      /**
       * Formats date for display in events.
       * @param {Date} date - The date to format.
       * @returns {string} - The formatted time.
       */
      formatDisplayTime(date) {
        const d = new Date(date);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      },
      /**
       * Formats date to 'YYYY-MM-DD HH:MM:SS' format.
       * @param {Date} date - The date to format.
       * @returns {string} - The formatted date string.
       */
      formatTime(date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
          return null;
        }
        const year = d.getFullYear().toString().padStart(4, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const seconds = d.getSeconds().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      },
      /**
       * Opens the schedule configuration modal.
       */
      openScheduleConfigModal() {
        this.showScheduleConfigModal = true;
        this.loadScheduleConfig();
      },
      /**
       * Opens the edit modal for an event.
       * @param {Object} event - The event object from FullCalendar.
       */
      openEditModal(event) {
        this.eventToEdit = event;
        const game = event.extendedProps.game;
        this.eventFormData = {
          teamAId: game.teamA.id,
          teamBId: game.teamB.id,
          startTime: this.formatDateTime(event.start),
          endTime: this.formatDateTime(event.end),
          fieldId: event.getResources()[0]?.id,
        };
        this.showEditModal = true;
      },
      /**
       * Loads the existing schedule configuration.
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
          } else {
            console.error(
              'Erreur lors de la récupération de la configuration du planning :',
              error
            );
          }
        }
      },
      /**
       * Opens the generate planning confirmation modal.
       */
      openGeneratePlanningModal() {
        this.showGeneratePlanningConfirmation = true;
      },
      /**
       * Closes the generate planning confirmation modal.
       */
      closeGeneratePlanningConfirmation() {
        this.showGeneratePlanningConfirmation = false;
      },
      /**
       * Opens the clear planning confirmation modal.
       */
      confirmClearPlanning() {
        this.showClearPlanningConfirmation = true;
      },
      /**
       * Closes the clear planning confirmation modal.
       */
      closeClearPlanningConfirmation() {
        this.showClearPlanningConfirmation = false;
      },
      /**
       * Handles the planning generation.
       */
      async handlePlanningGenerated() {
        await this.fetchPlanningDetails();
        this.closeGeneratePlanningConfirmation();
        this.validatePlanning();
      },
      validateEventDrop(event, resourceId) {
        // Récupérer l'événement déplacé
        const game = event.extendedProps.game;

        // Vérifiez que le champ (terrain) appartient toujours au même poolSchedule
        const poolSchedule = this.poolSchedules.find(
          (ps) =>
            ps.id === game.poolScheduleId &&
            ps.field.id.toString() === resourceId
        );

        // Si aucune correspondance n'est trouvée, l'action est invalide
        return !!poolSchedule;
      },
      /**
       * Clears the planning.
       */
      async clearPlanning() {
        try {
          await apiService.delete(
            `/tourneys/${this.tourneyId}/planning/games/reset`
          );
          toast.success('Planning des matchs supprimé avec succès !');
          this.showClearPlanningConfirmation = false;
          await this.fetchPlanningDetails();
        } catch (error) {
          console.error('Erreur lors de la suppression du planning :', error);
          toast.error('Erreur lors de la suppression du planning.');
        }
      },
      /**
       * Validates the planning.
       */
      async validatePlanning() {
        try {
          const response = await apiService.post(
            `/tourneys/${this.tourneyId}/planning/games/validate`
          );

          const validationResults = response.data.validation;

          if (validationResults.hasErrors) {
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
            toast.success('Le planning des matchs est valide sans erreurs.');
            this.warnings = [];
            this.showWarningsModal = false;
          }
        } catch (error) {
          console.error('Erreur lors de la validation du planning :', error);
          toast.error('Erreur lors de la validation du planning.');
        }
      },
      /**
       * Saves the schedule configuration.
       */
      async saveScheduleConfig() {
        try {
          let successMessage = '';
          if (this.scheduleConfig.id) {
            await apiService.put(
              `/tourneys/${this.tourneyId}/schedule/${this.scheduleConfig.id}`,
              this.scheduleConfig
            );
            successMessage =
              'Configuration du planning des matchs mise à jour avec succès !';
          } else {
            await apiService.post(
              `/tourneys/${this.tourneyId}/schedule`,
              this.scheduleConfig
            );
            successMessage =
              'Configuration du planning des matchs enregistrée avec succès !';
          }
          this.showScheduleConfigModal = false;
          await this.fetchPlanningDetails();
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
       * Closes the warnings modal.
       */
      closeWarningsModal() {
        this.showWarningsModal = false;
        this.warnings = [];
      },
      /**
       * Validates the schedule configuration form.
       * @returns {Object} - Form errors.
       */
      validateForm() {
        let formData;
        /**
         * Déterminer quel formulaire est actuellement affiché.
         */
        if (this.showCreateModal) {
          formData = this.createFormData;
        } else if (this.showEditModal) {
          formData = this.eventFormData;
        } else {
          formData = {};
        }

        console.log('Form data:', formData);
        const errors = {};

        if (!formData.teamAId) {
          errors.teamAId = "Veuillez sélectionner l'équipe A.";
        }
        if (!formData.teamBId) {
          errors.teamBId = "Veuillez sélectionner l'équipe B.";
        }
        if (
          formData.teamAId &&
          formData.teamBId &&
          formData.teamAId === formData.teamBId
        ) {
          errors.teamBId = "L'équipe B doit être différente de l'équipe A.";
        }

        /**
         * Si 'poolScheduleId' est défini, 'fieldId' et 'sportId' ne sont pas nécessaires. (Clique sur un poolSchedule)
         */
        if (!formData.poolScheduleId) {
          if (!formData.fieldId) {
            errors.fieldId = 'Veuillez sélectionner un terrain.';
          }
          if (!formData.sportId) {
            errors.sportId = 'Veuillez sélectionner un sport.';
          }
        }

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

        const timeStringToNumber = (timeStr) => {
          const [hours, minutes, seconds] = timeStr.split(':').map(Number);
          return hours * 3600 + minutes * 60 + (seconds || 0);
        };

        const startTimeNum = timeStringToNumber(startTime);
        const endTimeNum = timeStringToNumber(endTime);

        if (startTimeNum >= endTimeNum) {
          errors.startTime =
            "L'heure de début doit être inférieure à l'heure de fin.";
          errors.endTime =
            "L'heure de fin doit être supérieure à l'heure de début.";
        }

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

        for (const pair of timePairs) {
          if (pair.start && pair.end) {
            const pairStartNum = timeStringToNumber(pair.start);
            const pairEndNum = timeStringToNumber(pair.end);

            if (pairStartNum >= pairEndNum) {
              errors[
                pair.startField
              ] = `L'heure de début doit être inférieure à l'heure de fin pour la section ${pair.label}.`;
              errors[
                pair.endField
              ] = `L'heure de fin doit être supérieure à l'heure de début pour la section ${pair.label}.`;
            }
            if (pairStartNum < startTimeNum || pairEndNum > endTimeNum) {
              errors[
                pair.startField
              ] = `Les heures de ${pair.label} doivent être comprises entre le début (${startTime}) et la fin (${endTime}) du planning global.`;
              errors[
                pair.endField
              ] = `Les heures de ${pair.label} doivent être comprises entre le début (${startTime}) et la fin (${endTime}) du planning global.`;
            }
          } else if ((pair.start && !pair.end) || (!pair.start && pair.end)) {
            errors[
              pair.startField
            ] = `Veuillez fournir à la fois l'heure de début et de fin pour la section ${pair.label}.`;
            errors[
              pair.endField
            ] = `Veuillez fournir à la fois l'heure de début et de fin pour la section ${pair.label}.`;
          }
        }

        return errors;
      },
      /**
       * Checks screen size and adjusts terrains per page.
       */
      checkScreenSize() {
        this.isSmallScreen = window.innerWidth < 768;
        this.terrainsPerPage = this.isSmallScreen ? 2 : 10;
      },
      /**
       * Adjusts terrains per page based on screen width.
       */
      adjustTerrainsPerPage() {
        const screenWidth = window.innerWidth;

        if (screenWidth >= 1200) {
          this.terrainsPerPage = 6;
        } else if (screenWidth >= 1000) {
          this.terrainsPerPage = 4;
        } else if (screenWidth >= 800) {
          this.terrainsPerPage = 3;
        } else if (screenWidth >= 600) {
          this.terrainsPerPage = 2;
        } else {
          this.terrainsPerPage = 2;
        }
      },
    },
    async mounted() {
      this.adjustTerrainsPerPage();
      window.addEventListener('resize', this.adjustTerrainsPerPage);
      await this.fetchPlanningDetails();
    },
  };
</script>

<style scoped>
  .navigation-button {
    transition: transform 0.2s;
  }

  .navigation-button:hover {
    transform: scale(1.2);
  }

  .fc-timegrid-slot:hover {
    cursor: crosshair;
  }

  select {
    background-color: #f9f9f9;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.5rem;
  }
  @import '@/assets/fullcalendar.css';
</style>
