<!-- src/views/user/tourneys/TourneyPlanning.vue -->
<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <SubMenuComponent :tourneyId="tourneyId" />

    <!-- Titre principal -->
    <h1 v-if="!isAdmin" class="text-2xl font-bold my-4 px-4">
      {{ tourney.name }}
      <span v-if="userRoleInTourney === 'player'">
        - {{ userTeam?.teamName }} - {{ userPool?.name }}
      </span>
      <span v-if="userRoleInTourney === 'assistant'">
        - Arbitrage des matchs
      </span>
      <span v-if="userRoleInTourney === 'guest'">
        (Vous êtes invité - accès en lecture seule)
      </span>
    </h1>

    <!-- Filtres et options d'affichage -->
    <div class="flex flex-wrap items-center gap-4 my-2 px-4">
      <!-- Filtre des Pools -->
      <v-select
        :options="poolOptions"
        v-model="selectedPoolId"
        placeholder="All Pools"
        :clearable="true"
        :searchable="true"
        label="name"
        :reduce="(pool) => pool.id"
        class="w-40 flex-shrink-0"
        style="min-width: 150px"
      />

      <!-- Filtre des Terrains -->
      <v-select
        :options="fieldOptions"
        v-model="selectedFieldId"
        placeholder="All Terrains"
        :clearable="true"
        :searchable="true"
        label="name"
        :reduce="(field) => field.id"
        class="w-40 flex-shrink-0"
        style="min-width: 150px"
      />

      <!-- Filtre des Game IDs -->
      <v-select
        :options="gameOptions"
        v-model="selectedGameId"
        placeholder="All Games"
        :clearable="true"
        :searchable="true"
        label="name"
        :reduce="(game) => game.id"
        class="w-40 flex-shrink-0"
        style="min-width: 150px"
      />

      <!-- Bascule des couleurs -->
      <label class="flex items-center cursor-pointer flex-shrink-0">
        <div class="relative">
          <input type="checkbox" v-model="useUnifiedColors" class="sr-only" />
          <div
            class="block w-14 h-8 rounded-full transition-colors duration-300"
            :class="{
              'bg-light-menuActive dark:bg-dark-menuActive': useUnifiedColors,
              'bg-light-pool-infoText dark:bg-dark-pool-infoText':
                !useUnifiedColors,
            }"
          ></div>
          <div
            class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300"
            :class="{ 'translate-x-full': useUnifiedColors }"
          ></div>
        </div>
        <span class="ml-2 hidden md:block text-gray-700 dark:text-gray-300">
          {{ useUnifiedColors ? 'Couleur par Poule' : 'Couleur par Sport' }}
        </span>
      </label>

      <!-- Bouton pour basculer entre l'affichage des matchs et des pools -->
      <ButtonComponent
        @click="toggleDisplayMode"
        variant="'secondary'"
        :fontAwesomeIcon="displayMode === 'games' ? 'th' : 'futbol'"
      >
        Show {{ displayMode === 'games' ? 'Pools' : 'Matchs' }}
      </ButtonComponent>
      <!-- Pagination et Bouton Show All Fields -->
      <div
        v-if="totalPages > 1"
        class="flex justify-end items-center gap-2 my-2 px-4"
      >
        <!-- Bouton Précédent -->
        <button
          v-if="currentPage > 1"
          @click="currentPage--"
          class="text-2xl px-2 py-1 rounded navigation-button"
        >
          &lt;
        </button>

        <!-- Sélecteur de Page -->
        <select
          v-model="currentPage"
          class="bg-light-form-background dark:bg-dark-form-background text-light-form-text dark:text-dark-form-text border border-light-form-border-default dark:border-dark-form-border-default rounded-md px-2 py-1"
        >
          <option v-for="page in totalPages" :key="page" :value="page">
            Page {{ page }} / {{ totalPages }}
          </option>
        </select>

        <!-- Bouton Suivant -->
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
          {{ showAllTerrains ? 'Reduce' : 'All Fields' }}
        </button>
      </div>
    </div>

    <!-- Affichage des prochains matchs de l'utilisateur (uniquement si player ou assistant) -->
    <CollapsibleBox
      v-if="
        userRoleInTourney !== 'admin' &&
        userRoleInTourney !== 'guest' &&
        userNextGames.length
      "
      title="Mes prochains matchs :"
    >
      <ul class="list-disc pl-5">
        <li v-for="game in userNextGames" :key="game.id">
          <span class="font-semibold">
            {{ formatDateTimeDisplay(game.startTime) }} :
          </span>
          Team: {{ game.teamANumber }} vs {{ game.teamBNumber }} sur le terrain
          {{ game.field.name }}
        </li>
      </ul>
    </CollapsibleBox>

    <!-- Calendrier avec les Terrains comme ressources -->
    <div v-if="tourney.dateTourney && paginatedFilteredFields.length">
      <FullCalendar
        ref="fullCalendar"
        :options="calendarOptions"
        :key="calendarKey"
      />
    </div>
  </div>
</template>

<script>
  import { mapState, mapActions } from 'vuex';
  import FullCalendar from '@fullcalendar/vue3';
  import timeGridPlugin from '@fullcalendar/timegrid';
  import interactionPlugin from '@fullcalendar/interaction';
  import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
  import apiService from '@/services/apiService';
  import SubMenuComponent from '@/components/user/SubMenuComponent.vue';
  import vSelect from 'vue-select';
  import 'vue-select/dist/vue-select.css';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import CollapsibleBox from '@/components/user/CollapsibleBox.vue';
  import { extractTeamNumber } from '@/utils/format.js';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      FullCalendar,
      SubMenuComponent,
      vSelect,
      ButtonComponent,
      CollapsibleBox,
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
        userNextGames: [],
        scheduleConfig: {},
        selectedPoolId: null,
        selectedFieldId: null,
        selectedGameId: null, // Nouveau filtre pour gameID
        useUnifiedColors: true,
        colorMap: {},
        displayMode: 'games', // 'games' ou 'pools'
        currentPage: 1, // Page actuelle de pagination des terrains
        terrainsPerPage: 10, // Nombre de terrains visibles par page
        showAllTerrains: false, // Permet d'afficher tous les terrains
        assistantMessage: '',
        userTeam: null,
        userPool: null,
        calendarKey: 0, // Clé pour forcer le re-render de FullCalendar
      };
    },
    computed: {
      ...mapState('tourney', {
        statuses: (state) => state.statuses,
        tourneyType: (state) => state.tourneyType,
      }),

      /**
       * Détermine le rôle global de l'utilisateur (admin global ou non).
       * @returns {boolean} true si admin global, sinon false.
       */
      isAdmin() {
        return this.$store.state?.user && this.$store.state.user?.roleId === 1;
      },
      generateUniqueColor() {
        return (id) => {
          if (!id) return '#888888';
          if (this.colorMap[id]) {
            return this.colorMap[id];
          }
          const hue = (id * 137.508) % 360;
          const color = `hsl(${hue}, 70%, 60%)`;
          this.colorMap[id] = color;
          return color;
        };
      },

      /**
       * Retourne une liste contenant "All Pools" + pools du tournoi.
       * @returns {Array} Liste des pools avec option "All Pools".
       */
      poolOptions() {
        return [{ id: null, name: 'All Pools' }, ...this.pools];
      },

      /**
       * Retourne une liste contenant "All Terrains" + terrains du tournoi.
       * @returns {Array} Liste des terrains avec option "All Terrains".
       */
      fieldOptions() {
        return [{ id: null, name: 'All Terrains' }, ...this.fields];
      },

      /**
       * Retourne une liste contenant "All Games" + games du tournoi.
       * @returns {Array} Liste des games avec option "All Games".
       */
      gameOptions() {
        return [
          { id: null, name: 'All Games' },
          ...this.games.map((game) => ({
            id: game.id,
            name: `Game ${game.id} - ${game.teamA?.teamName} vs ${game.teamB?.teamName}`,
          })),
        ];
      },

      /**
       * Filtre les jeux en fonction des filtres sélectionnés.
       * @returns {Array} Liste filtrée des jeux.
       */
      filteredGames() {
        return this.games.filter((game) => {
          if (this.selectedPoolId && game.pool?.id !== this.selectedPoolId) {
            return false;
          }
          if (this.selectedFieldId && game.field?.id !== this.selectedFieldId) {
            return false;
          }
          if (this.selectedGameId && game.id !== this.selectedGameId) {
            return false;
          }
          return true;
        });
      },

      /**
       * Filtre les terrains à afficher en fonction des événements filtrés.
       * @returns {Array} Liste des terrains avec au moins un événement filtré.
       */
      filteredFields() {
        const fieldIdsWithEvents = new Set();

        // Ajoute les terrains des jeux filtrés
        this.filteredGames.forEach((game) => {
          if (game.field && game.field.id) {
            fieldIdsWithEvents.add(game.field.id);
          }
        });

        // Ajoute les terrains des poolSchedules filtrés
        this.pools.forEach((pool) => {
          if (this.selectedPoolId && pool.id !== this.selectedPoolId) {
            return;
          }
          pool.schedules.forEach((schedule) => {
            if (
              this.selectedFieldId &&
              schedule.fieldId !== this.selectedFieldId
            ) {
              return;
            }
            fieldIdsWithEvents.add(schedule.fieldId);
          });
        });

        return this.fields.filter((field) => fieldIdsWithEvents.has(field.id));
      },

      /**
       * Retourne la liste des terrains filtrés à afficher selon la pagination.
       * @returns {Array} Liste paginée de terrains filtrés.
       */
      paginatedFilteredFields() {
        const filteredFields = this.filteredFields;
        if (this.showAllTerrains) {
          return filteredFields;
        }
        const start = (this.currentPage - 1) * this.terrainsPerPage;
        const end = start + this.terrainsPerPage;
        return filteredFields.slice(start, end);
      },

      /**
       * Calcule le nombre total de pages pour l'affichage des terrains.
       * @returns {number} Nombre de pages.
       */
      totalPages() {
        if (this.showAllTerrains) {
          return 1; // Si tous les terrains sont affichés, une seule page
        }
        return Math.ceil(this.filteredFields.length / this.terrainsPerPage);
      },

      /**
       * Liste des terrains paginés après filtrage.
       * @returns {Array} Liste paginée de terrains filtrés.
       */
      paginatedFields() {
        return this.paginatedFilteredFields;
      },

      /**
       * Détermine le rôle de l'utilisateur dans ce tournoi.
       * Les rôles possibles sont :
       * - admin : si roleId === 1
       * - assistant : si l'utilisateur a le rôle assistant sur ce tournoi (via store)
       * - player : si l'utilisateur a une userTeam de type 'player'
       * - guest : sinon
       *
       * @returns {string} 'admin', 'assistant', 'player' ou 'guest'
       */
      userRoleInTourney() {
        const isAdmin = this.isAdmin;
        const isAssistant = this.$store.getters['userTourney/isAssistant'];
        // Si userTeam existe et de type player -> player
        // Sinon guest
        if (isAdmin) return 'admin';
        if (isAssistant) return 'assistant';
        if (this.userTeam && this.userTeam.type === 'player') return 'player';
        return 'guest';
      },

      /**
       * Options du calendrier FullCalendar en fonction du displayMode.
       * @returns {Object} Options pour FullCalendar.
       */
      calendarOptions() {
        if (!this.tourney.dateTourney) {
          console.error('La date du tournoi n’est pas disponible');
          return {};
        }

        const events = [];

        // Afficher les pauses (intro, déjeuner, conclusion)
        this.addBreakTimes(events);

        // Selon le mode d'affichage, on ajoute soit les matchs, soit les poolSchedules
        if (this.displayMode === 'games') {
          this.addGamesToEvents(events);
        } else {
          this.addPoolSchedulesToEvents(events);
        }

        // Ajouter les transitions entre les pools
        this.addPoolTransitions(events);

        return {
          plugins: [timeGridPlugin, interactionPlugin, resourceTimeGridPlugin],
          schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
          initialView: 'resourceTimeGridDay',
          timeZone: 'local',
          initialDate: this.tourney.dateTourney,
          editable: false,
          droppable: false,
          eventStartEditable: false,
          eventDurationEditable: false,
          selectable: false,
          height: 800,
          slotMinTime: this.adjustedSlotMinTime(),
          slotMaxTime: this.adjustedSlotMaxTime(),
          slotDuration: this.displayMode === 'games' ? '00:05:00' : '00:15:00',
          slotLabelInterval:
            this.displayMode === 'games' ? '00:15:00' : '01:00:00',
          allDaySlot: false,
          resources: this.paginatedFilteredFields.map((field) => ({
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
          eventClick: this.handleEventClick,
          eventContent: this.renderEventContent,
        };
      },
    },
    watch: {
      currentPage() {
        if (this.$refs.fullCalendar) {
          this.$refs.fullCalendar.getApi().refetchResources();
        }
      },
      selectedPoolId() {
        this.currentPage = 1; // Réinitialiser la pagination
        this.calendarKey += 1; // Forcer le re-render
      },
      selectedFieldId() {
        this.currentPage = 1;
        this.calendarKey += 1;
      },
      selectedGameId() {
        this.currentPage = 1;
        this.calendarKey += 1;
      },
      totalPages(newVal) {
        if (newVal === 1) {
          this.showAllTerrains = false;
          this.currentPage = 1;
        }
      },
    },
    methods: {
      ...mapActions('tourney', [
        'fetchTourneyStatuses',
        'setTournamentName',
        'clearTournamentName',
      ]),

      /**
       * Récupère les données de planning (terrains, pools, games, sports...)
       */
      async fetchPlanningDetails() {
        try {
          await this.fetchTourneyStatuses(this.tourneyId);

          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/planning/details`
          );

          const data = response.data;

          this.fields = data.fields || [];
          this.pools = data.pools || [];
          this.games = data.games || [];
          this.sports = data.sports || [];
          this.scheduleConfig = data.scheduleTourney || {};

          // Récupérer les détails du tournoi (pour la date)
          const tourneyResponse = await apiService.get(
            `/tourneys/${this.tourneyId}`
          );
          this.tourney = tourneyResponse.data;

          // Récupérer les équipes avec leur poolId
          const teamsResponse = await apiService.get(
            `/tourneys/${this.tourneyId}/teams`
          );
          this.teams = teamsResponse.data;

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
       * Met fin à tous les matchs (uniquement accessible par un admin)
       */
      async completeAllMatches() {
        try {
          const response = await apiService.put(
            `/tourneys/${this.tourneyId}/games/complete-all-games`
          );
          if (response.status === 200) {
            toast.success(response.data.message);
            // Rafraîchir les données du calendrier
            await this.fetchPlanningDetails();
            this.calendarKey += 1; // Forcer le re-render
          }
        } catch (error) {
          console.error('Erreur lors de la mise à jour des matchs :', error);
          toast.error('Erreur lors de la mise à jour des matchs.');
        }
      },

      /**
       * Récupère les prochains matchs de l'utilisateur.
       * Ne doit être appelé que si l'utilisateur est player ou assistant.
       */
      async fetchUserNextGames() {
        // Si l'utilisateur n'est pas player ou assistant, on ne fait pas cette requête
        if (
          this.userRoleInTourney === 'admin' ||
          this.userRoleInTourney === 'guest'
        ) {
          return;
        }
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/games/next`
          );

          if (Array.isArray(response.data)) {
            // L'utilisateur a des prochains matchs
            this.userNextGames = response.data.map((game) => {
              const teamA = this.teams.find((team) => team.id === game.teamAId);
              const teamB = this.teams.find((team) => team.id === game.teamBId);

              return {
                ...game,
                teamANumber: teamA?.teamName
                  ? extractTeamNumber(teamA.teamName, 'A')
                  : 'A',
                teamBNumber: teamB?.teamName
                  ? extractTeamNumber(teamB.teamName, 'B')
                  : 'B',
              };
            });
          } else if (response.data.message) {
            // Message pour assistant
            this.assistantMessage = response.data.message;
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des prochains matchs de l'utilisateur :",
            error
          );
          // Si 404, c'est peut-être normal si l'utilisateur n'a pas de matchs
        }
      },

      /**
       * Récupère l'équipe de l'utilisateur et la pool associée.
       * Ne doit être appelé que si l'utilisateur est player ou assistant.
       */
      async fetchUserTeamAndPool() {
        if (this.isAdmin) {
          // L'admin n'a pas d'équipe
          return;
        }

        try {
          const userId = this.$store.state.user.id;
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/users/${userId}`
          );

          // Vérifiez si la team et pool existent
          this.userTeam = response.data.team || null;
          this.userPool =
            this.userTeam && this.userTeam.pool ? this.userTeam.pool : null;
        } catch (error) {
          console.error(
            "Erreur lors de la récupération de l'équipe de l'utilisateur :",
            error
          );
        }
      },

      /**
       * Ajuste le nombre de terrains par page en fonction de la largeur de l'écran.
       */
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

      /**
       * Gère le clic sur un événement du calendrier (redirige vers la page du match).
       * @param {Object} info Informations sur l'événement cliqué.
       */
      handleEventClick(info) {
        const event = info.event;
        const game = event.extendedProps.game;
        if (game) {
          // Rediriger vers la page du match
          this.$router.push({
            name: 'UserTourneyGameDetails',
            params: {
              tourneyId: this.tourneyId,
              gameId: game.id,
            },
          });
        }
      },

      /**
       * Bascule entre l'affichage 'games' et 'pools'.
       */
      toggleDisplayMode() {
        this.displayMode = this.displayMode === 'games' ? 'pools' : 'games';
        // Rafraîchir le calendrier
        if (this.$refs.fullCalendar) {
          this.$refs.fullCalendar.getApi().refetchEvents();
        }
        // Mettre à jour la clé pour forcer le re-render
        this.calendarKey += 1;
      },

      /**
       * Ajoute les matchs en tant qu'événements dans le calendrier.
       * @param {Array} events Tableau d'événements
       */
      addGamesToEvents(events) {
        const now = new Date();
        this.filteredGames.forEach((game) => {
          if (!game.field) {
            console.warn(
              `Le match avec l'ID ${game.id} n'a pas de terrain assigné.`
            );
            return;
          }

          const gameStart = new Date(game.startTime);
          const gameEnd = new Date(game.endTime);
          const isCurrentGame = now >= gameStart && now <= gameEnd;

          const teamATeamName = game.teamA?.teamName || 'Équipe A';
          const teamBTeamName = game.teamB?.teamName || 'Équipe B';

          const teamANumber = teamATeamName
            ? extractTeamNumber(teamATeamName, 'A')
            : 'A';
          const teamBNumber = teamBTeamName
            ? extractTeamNumber(teamBTeamName, 'B')
            : 'B';

          events.push({
            id: game.id.toString(),
            resourceId: game.field.id.toString(),
            title: `${
              game.pool?.name || 'Team'
            }: ${teamANumber} vs ${teamBNumber}`,
            start: gameStart,
            end: gameEnd,
            backgroundColor: isCurrentGame
              ? '#FF0000' // Rouge pour le match en cours
              : this.useUnifiedColors
              ? this.generateUniqueColor(game.pool?.id)
              : game.sport?.color || '#3B82F6',
            textColor: '#FFFFFF',
            extendedProps: { game },
          });
        });
      },

      /**
       * Ajoute les poolSchedules en tant qu'événements dans le calendrier.
       * @param {Array} events Tableau d'événements
       */
      addPoolSchedulesToEvents(events) {
        this.pools.forEach((pool) => {
          if (this.selectedPoolId && pool.id !== this.selectedPoolId) {
            return;
          }
          pool.schedules.forEach((schedule) => {
            if (
              this.selectedFieldId &&
              schedule.fieldId !== this.selectedFieldId
            ) {
              return;
            }
            events.push({
              id: `pool-${pool.id}-schedule-${schedule.id}`,
              resourceId: schedule.fieldId.toString(),
              title: `${pool.name} - ${schedule.sport?.name}`,
              start: `${schedule.date}T${schedule.startTime}`,
              end: `${schedule.date}T${schedule.endTime}`,
              backgroundColor: this.useUnifiedColors
                ? this.generateUniqueColor(pool.id)
                : schedule.sport?.color || '#3B82F6',
              textColor: '#FFFFFF',
              extendedProps: { poolSchedule: schedule },
            });
          });
        });
      },

      /**
       * Ajuste l'heure de début du slot.
       * @returns {string} Heure minimale du slot.
       */
      adjustedSlotMinTime() {
        const startTime = this.scheduleConfig.startTime || '07:00:00';
        return this.roundDownTime(startTime);
      },

      /**
       * Ajuste l'heure de fin du slot.
       * @returns {string} Heure maximale du slot.
       */
      adjustedSlotMaxTime() {
        const endTime = this.scheduleConfig.endTime || '23:00:00';
        return this.roundUpTime(endTime);
      },

      /**
       * Arrondit le temps vers le bas (heures pleines).
       * @param {string} timeStr Une chaîne HH:MM:SS
       * @returns {string} Heure arrondie vers le bas.
       */
      roundDownTime(timeStr) {
        let [hours, minutes, seconds] = timeStr.split(':').map(Number);
        if (minutes > 0 || seconds > 0) {
          hours = Math.max(0, hours);
        }
        return `${hours.toString().padStart(2, '0')}:00:00`;
      },

      /**
       * Arrondit le temps vers le haut (heures pleines).
       * @param {string} timeStr Une chaîne HH:MM:SS
       * @returns {string} Heure arrondie vers le haut.
       */
      roundUpTime(timeStr) {
        let [hours, minutes, seconds] = timeStr.split(':').map(Number);
        if (minutes > 0 || seconds > 0) {
          hours += 1;
        }
        if (hours >= 24) hours = 23;
        return `${hours.toString().padStart(2, '0')}:00:00`;
      },

      /**
       * Formate la date/heure pour l'affichage.
       * @param {string|number} dateTime Timestamp/Date
       * @returns {string} Chaîne formatée JJ/MM/AAAA à HHhMM
       */
      formatDateTimeDisplay(dateTime) {
        const d = new Date(dateTime);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} à ${hours}h${minutes}`;
      },

      /**
       * Ajoute les événements de pauses (introduction, déjeuner, conclusion) au calendrier.
       * @param {Array} events Tableau d'événements
       */
      addBreakTimes(events) {
        const breaks = [
          {
            title: 'Introduction',
            startTime: this.scheduleConfig.introStart,
            endTime: this.scheduleConfig.introEnd,
          },
          {
            title: 'Déjeuner',
            startTime: this.scheduleConfig.lunchStart,
            endTime: this.scheduleConfig.lunchEnd,
          },
          {
            title: 'Conclusion',
            startTime: this.scheduleConfig.outroStart,
            endTime: this.scheduleConfig.outroEnd,
          },
        ];

        breaks.forEach((breakTime) => {
          if (breakTime.startTime && breakTime.endTime) {
            events.push({
              id: `break-${breakTime.title}`,
              resourceIds: this.paginatedFilteredFields.map((field) =>
                field.id.toString()
              ),
              title: breakTime.title,
              start: `${this.tourney.dateTourney}T${breakTime.startTime}`,
              end: `${this.tourney.dateTourney}T${breakTime.endTime}`,
              backgroundColor: '#965612', // Couleur or
              textColor: '#000000', // Texte noir
              display: 'background',
            });
          }
        });
      },

      /**
       * Ajoute les périodes de transition entre les pools au calendrier.
       * @param {Array} events Tableau d'événements
       */
      addPoolTransitions(events) {
        const transitionDuration = parseInt(
          this.scheduleConfig.transitionPoolTime
        );
        if (!transitionDuration || isNaN(transitionDuration)) {
          return; // Pas de durée de transition définie
        }

        this.pools.forEach((pool) => {
          if (this.selectedPoolId && pool.id !== this.selectedPoolId) {
            return;
          }
          pool.schedules.forEach((schedule) => {
            const transitionStartDateTime = new Date(
              `${schedule.date}T${schedule.endTime}`
            );
            const transitionEndDateTime = new Date(
              transitionStartDateTime.getTime() + transitionDuration * 60000
            );

            if (
              this.selectedFieldId &&
              schedule.fieldId !== this.selectedFieldId
            ) {
              return;
            }
            events.push({
              id: `transition-${pool.id}-${schedule.id}`,
              resourceId: schedule.fieldId.toString(),
              title: 'Transition',
              start: transitionStartDateTime,
              end: transitionEndDateTime,
              backgroundColor: '#808080', // Gris moyen
              display: 'background',
            });
          });
        });
      },

      /**
       * Rend le contenu des événements du calendrier (affichage custom).
       * @param {Object} arg Informations sur l'événement
       * @returns {Object} Des nœuds DOM pour l'affichage
       */
      renderEventContent(arg) {
        // Crée le conteneur principal
        const container = document.createElement('div');
        container.classList.add(
          'flex',
          'flex-col',
          'space-y-1',
          'cursor-pointer',
          'hover:invert'
        );

        // Conteneur d'en-tête (titre)
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

        // Ajoute l'en-tête
        container.appendChild(headerContainer);

        const startTime = arg.event.start
          ? this.formatDisplayTime(arg.event.start)
          : '';
        const endTime = arg.event.end
          ? this.formatDisplayTime(arg.event.end)
          : '';

        // Ajoute le timeRange si startTime et endTime existent et que ce n'est pas une transition
        if (startTime && endTime && arg.event.title !== 'Transition') {
          const timeRange = document.createElement('div');
          timeRange.innerText = `${startTime} - ${endTime}`;
          timeRange.classList.add('text-sm', 'text-white');
          container.appendChild(timeRange);
        }

        // Si c'est un "game", on affiche le sport et la pool
        const game = arg.event.extendedProps.game;
        if (game) {
          const sportPoolInfo = document.createElement('div');
          const poolName = game.pool ? game.pool.name : '';
          const sportName = game.sport ? game.sport.name : '';

          sportPoolInfo.innerText = `${poolName} - ${sportName}`;
          sportPoolInfo.classList.add('text-xs', 'text-white');

          // Ajout du sport/pool info
          container.appendChild(sportPoolInfo);
        }

        return { domNodes: [container] };
      },

      /**
       * Formate l'heure d'un événement en HH:MM.
       * @param {Date} date
       * @returns {string} Heure formatée
       */
      formatDisplayTime(date) {
        const d = new Date(date);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      },
    },
    async mounted() {
      this.adjustTerrainsPerPage();
      window.addEventListener('resize', this.adjustTerrainsPerPage);

      // Récupérer les données du planning
      await this.fetchPlanningDetails();
      await this.fetchUserTeamAndPool();
      await this.fetchUserNextGames(); // Idem, plus tard vous pouvez conditionner en fonction du role
    },
  };
</script>

<style scoped>
  @import '@/assets/fullcalendar.css';
</style>
