<!-- views/admin/TourneyPlanningGames.vue -->
<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />

    <!-- Liste des équipes en haut, sticky sans fond gris -->
    <div
      id="external-events"
      class="p-2 rounded-lg shadow-lg sticky top-0 z-50 overflow-x-auto flex items-center justify-between bg-white dark:bg-dark-background"
    >
      <!-- Conteneur pour les équipes -->
      <div class="flex space-x-4">
        <!-- Équipes que l'on peut glisser -->
        <div
          v-for="team in filteredTeams"
          :key="team.id"
          :data-id="team.id"
          :data-team-name="team.teamName"
          :class="[
            'team-item',
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
            'bg-green-500',
            'text-white',
          ]"
        >
          {{ team.teamName }}
          <span v-if="team.pool"> - {{ team.pool.name }}</span>
        </div>
      </div>
    </div>

    <!-- Messages d'avertissement -->
    <div v-if="!fields.length">
      <ErrorMessageComponent
        message="Aucun terrain trouvé. Veuillez créer des terrains avant d'assigner des matchs."
      ></ErrorMessageComponent>
    </div>

    <!-- Messages d'avertissement de validation -->
    <div
      v-if="warnings.length && showWarningsModal"
      class="p-4 rounded mb-4 relative flex flex-col bg-light-warning-bg border border-light-warning-border text-light-warning-text dark:bg-dark-warning-bg dark:border-yellow-600 dark:text-dark-warning-text"
    >
      <!-- Bouton Fermer positionné en haut à droite -->
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
        <!-- Filtre des Équipes -->
        <v-select
          :options="teamOptions"
          v-model="selectedTeamId"
          placeholder="All Teams"
          :clearable="true"
          :searchable="true"
          label="teamName"
          :reduce="(team) => team.id"
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
      :title="'Suppression du Planning des Matchs'"
      :message="'Êtes-vous sûr de vouloir supprimer le planning des matchs ?'"
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

    <!-- Modal pour éditer un match -->
    <ModalComponent :isVisible="showEditModal" @close="showEditModal = false">
      <template #title>Modifier le Match</template>
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
        formErrors: {},
        selectedPoolId: null,
        selectedTeamId: null,
        planningStatusOptions: [
          { value: 'pools', label: 'Pools' },
          { value: 'games', label: 'Matchs' },
          { value: 'completed', label: 'Terminé' },
        ],
        warnings: [],
        externalDraggableInstance: null,
        showScheduleConfigModal: false,
        showWarningsModal: false,

        isSmallScreen: false,
        currentPage: 1,
        terrainsPerPage: 10,
        showAllTerrains: false,
        breakpoints: {
          large: 1150,
          medium: 640,
        },

        // Configuration du planning avec valeurs par défaut
        scheduleConfig: {
          startTime: '07:30:00',
          endTime: '17:30:00',
          gameDuration: 15,
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
          return 1;
        }
        return Math.ceil(this.fields.length / this.terrainsPerPage);
      },
      paginatedFields() {
        if (this.showAllTerrains) {
          return this.fields;
        }
        const start = (this.currentPage - 1) * this.terrainsPerPage;
        const end = start + this.terrainsPerPage;
        return this.fields.slice(start, end);
      },
      isEditable() {
        return this.statuses.planningStatus !== 'completed';
      },
      hasGames() {
        return this.games.length > 0;
      },
      generateUniqueColor() {
        return (poolId) => {
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
        return [{ id: null, name: 'All Pools' }, ...this.pools];
      },
      teamOptions() {
        return [{ id: null, teamName: 'All Teams' }, ...this.teams];
      },
      filteredTeams() {
        if (this.selectedPoolId) {
          return this.teams.filter(
            (team) => team.poolId === this.selectedPoolId
          );
        }
        return this.teams;
      },
      calendarOptions() {
        if (!this.tourney.dateTourney) {
          console.error('La date du tournoi n’est pas disponible');
          return {};
        }

        const events = [];

        // Ajouter les matchs en tant qu'événements
        this.games.forEach((game) => {
          // Filtrer par pool et équipe si sélectionnées
          if (this.selectedPoolId && game.poolId !== this.selectedPoolId) {
            return;
          }
          if (
            this.selectedTeamId &&
            game.teamAId !== this.selectedTeamId &&
            game.teamBId !== this.selectedTeamId
          ) {
            return;
          }
          events.push({
            id: game.id.toString(),
            title: `${game.teamA.teamName} vs ${game.teamB.teamName}`,
            start: game.startTime,
            end: game.endTime,
            resourceId: game.field.id.toString(),
            backgroundColor: this.useUnifiedColors
              ? this.generateUniqueColor(game.poolId)
              : game.sport?.color || '#3B82F6',
            textColor: '#FFFFFF',
            extendedProps: {
              game,
            },
          });
        });

        // Ajouter les sportsFields en tant qu'événements de fond (si nécessaire)

        return {
          plugins: [timeGridPlugin, interactionPlugin, resourceTimeGridPlugin],
          schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
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
            name: 'TourneyPlanningPools',
            params: { tourneyId: this.tourneyId },
          });
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
      ...mapActions('tourney', [
        'fetchTourneyStatuses',
        'setTournamentName',
        'clearTournamentName',
      ]),
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
          this.scheduleConfig = data.scheduleTourney || this.scheduleConfig;

          // Récupérer les détails du tournoi pour avoir la date
          const tourneyResponse = await apiService.get(
            `/tourneys/${this.tourneyId}`
          );
          this.tourney = tourneyResponse.data;

          // Récupérer les équipes
          const teamsResponse = await apiService.get(
            `/tourneys/${this.tourneyId}/teams`
          );
          this.teams = teamsResponse.data;

          // Vérifier que dateTourney est défini
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
      refreshCalendarEvents() {
        if (this.$refs.fullCalendar) {
          const calendarApi = this.$refs.fullCalendar.getApi();
          calendarApi.refetchEvents();
        }
      },
      initializeExternalEvents() {
        if (!this.isEditable) return;

        if (this.externalDraggableInstance) {
          this.externalDraggableInstance.destroy();
          this.externalDraggableInstance = null;
        }

        const containerEl = document.getElementById('external-events');
        this.externalDraggableInstance = new Draggable(containerEl, {
          itemSelector: '.external-event',
          eventData(eventEl) {
            return {
              title: eventEl.dataset.teamName,
              duration: '00:15', // La durée sera définie dans handleEventReceive
              create: true,
              extendedProps: {
                teamId: eventEl.dataset.id,
                teamName: eventEl.dataset.teamName,
              },
            };
          },
        });
      },
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

        const startTime = this.formatDisplayTime(arg.event.start);
        const endTime = this.formatDisplayTime(arg.event.end);
        const timeRange = document.createElement('div');
        timeRange.innerText = `${startTime} - ${endTime}`;
        timeRange.classList.add('text-sm', 'text-white');

        container.appendChild(headerContainer);
        container.appendChild(timeRange);

        return { domNodes: [container] };
      },
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
      async handleEventReceive(info) {
        if (!this.isEditable) {
          info.revert();
          return;
        }
        const event = info.event;
        try {
          const teamId = event.extendedProps.teamId;
          const newFieldId = event.getResources()[0]?.id;

          if (!newFieldId) {
            console.error("Problème d'ID : Terrain mal identifié.");
            info.revert();
            return;
          }

          // Définir la durée de l'événement selon gameDuration
          const durationMinutes =
            parseInt(this.scheduleConfig.gameDuration) || 15;
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
            teamAId: teamId,
            // teamBId sera défini lorsqu'une autre équipe sera ajoutée
          };

          // Créer un nouveau match
          const response = await apiService.post(
            `/tourneys/${this.tourneyId}/games`,
            data
          );

          // Mettre à jour l'événement avec les nouvelles informations
          event.setProp('id', response.data.id);
          event.setExtendedProp('game', response.data);

          // Ajouter le nouveau match à la liste locale
          this.games.push(response.data);
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
            date: this.tourney.dateTourney,
          };

          const response = await apiService.put(
            `/tourneys/${this.tourneyId}/games/${eventId}`,
            data
          );

          // Mettre à jour localement le match
          const index = this.games.findIndex(
            (g) => g.id.toString() === eventId.toString()
          );
          if (index !== -1) {
            this.games[index] = response.data;
          }

          // Mettre à jour les propriétés de l'événement
          event.setExtendedProp('game', response.data);
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
            `/tourneys/${this.tourneyId}/games/${eventId}`,
            data
          );

          // Mettre à jour localement le match
          const index = this.games.findIndex(
            (g) => g.id.toString() === eventId.toString()
          );
          if (index !== -1) {
            this.games[index] = response.data;
          }

          // Mettre à jour les propriétés de l'événement
          event.setExtendedProp('game', response.data);
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
          const response = await apiService.put(
            `/tourneys/${this.tourneyId}/games/${this.eventToEdit.id}`,
            data
          );

          // Mettre à jour localement le match
          const index = this.games.findIndex(
            (g) => g.id.toString() === this.eventToEdit.id.toString()
          );
          if (index !== -1) {
            this.games[index] = response.data;
          }

          // Mettre à jour les propriétés de l'événement
          const event = this.eventToEdit;
          event.setExtendedProp('game', response.data);

          this.showEditModal = false;
        } catch (error) {
          console.error(
            'Erreur lors de la sauvegarde des modifications :',
            error
          );
        }
      },
      async deleteEvent(event) {
        if (!this.isEditable) return;
        try {
          await apiService.delete(
            `/tourneys/${this.tourneyId}/games/${event.id}`
          );
          event.remove();
          // Supprimer le match de la liste locale
          this.games = this.games.filter(
            (g) => g.id.toString() !== event.id.toString()
          );
        } catch (error) {
          console.error('Erreur lors de la suppression du match :', error);
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
      openScheduleConfigModal() {
        this.showScheduleConfigModal = true;
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
      openGeneratePlanningModal() {
        this.showGeneratePlanningConfirmation = true;
      },
      closeGeneratePlanningConfirmation() {
        this.showGeneratePlanningConfirmation = false;
      },
      confirmClearPlanning() {
        this.showClearPlanningConfirmation = true;
      },
      closeClearPlanningConfirmation() {
        this.showClearPlanningConfirmation = false;
      },
      async handlePlanningGenerated() {
        await this.fetchPlanningDetails();
        this.closeGeneratePlanningConfirmation();
        this.validatePlanning();
      },
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
          this.initializeExternalEvents();
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
      closeWarningsModal() {
        this.showWarningsModal = false;
        this.warnings = [];
      },
      subtractOneHour(timeStr) {
        let [hours] = timeStr.split(':').map(Number);

        if (hours < 0) hours = 0;
        return `${hours.toString().padStart(2, '0')}:00:00`;
      },
      addOneHour(timeStr) {
        let [hours, minutes, seconds] = timeStr.split(':').map(Number);
        if (minutes > 0 || seconds > 0) {
          hours += 1;
        }
        if (hours >= 24) hours = 23;
        minutes = 0;
        seconds = 0;
        return `${hours.toString().padStart(2, '0')}:00:00`;
      },
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
      checkScreenSize() {
        this.isSmallScreen = window.innerWidth < 768;
        this.terrainsPerPage = this.isSmallScreen ? 2 : 10;
      },
      adjustTerrainsPerPage() {
        const screenWidth = window.innerWidth;

        if (screenWidth >= 1200) {
          this.terrainsPerPage = 10;
        } else if (screenWidth >= 1000) {
          this.terrainsPerPage = 8;
        } else if (screenWidth >= 800) {
          this.terrainsPerPage = 7;
        } else if (screenWidth >= 600) {
          this.terrainsPerPage = 5;
        } else {
          this.terrainsPerPage = 3;
        }
      },
    },
    async mounted() {
      this.adjustTerrainsPerPage();
      window.addEventListener('resize', this.adjustTerrainsPerPage);
      await this.fetchPlanningDetails();
      this.initializeExternalEvents();
    },
  };
</script>

<style scoped>
  .team-item {
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

  select {
    background-color: #f9f9f9;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.5rem;
  }
  @import '@/assets/fullcalendar.css';
</style>
