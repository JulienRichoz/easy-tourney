<!-- TourneyPlayerPlanning.vue -->
<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <SubMenuComponent :tourneyId="tourneyId" />

    <!-- Filtres et options d'affichage -->
    <div class="flex flex-wrap items-center gap-4 my-2 px-4">
      <!-- Filtre des Pools -->
      <v-select
        :options="poolOptions"
        v-model="selectedPoolId"
        placeholder="Toutes les Poules"
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
        placeholder="Tous les Terrains"
        :clearable="true"
        :searchable="true"
        label="name"
        :reduce="(field) => field.id"
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
      <!-- Bouton pour basculer entre l'affichage des matchs et des pools -->
      <ButtonComponent
        @click="toggleDisplayMode"
        :variant="'secondary'"
        :fontAwesomeIcon="displayMode === 'games' ? 'th' : 'futbol'"
      >
        Afficher {{ displayMode === 'games' ? 'les Pools' : 'les Matchs' }}
      </ButtonComponent>
    </div>
    <!-- Affichage des prochains matchs de l'utilisateur -->
    <div v-if="userNextGames.length" class="my-4 px-4">
      <h2 class="text-xl font-semibold mb-2">Mes prochains matchs :</h2>
      <ul class="list-disc pl-5">
        <li v-for="game in userNextGames" :key="game.id">
          <span class="font-semibold"
            >{{ formatDateTimeDisplay(game.startTime) }} :</span
          >
          {{ game.teamA.teamName }} vs {{ game.teamB.teamName }} sur le terrain
          {{ game.field.name }}
        </li>
      </ul>
    </div>

    <!-- Calendrier avec les Terrains comme ressources -->
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

  export default {
    components: {
      FullCalendar,
      SubMenuComponent,
      vSelect,
      ButtonComponent,
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
        useUnifiedColors: true,
        colorMap: {},
        displayMode: 'games', // 'games' ou 'pools'
      };
    },
    computed: {
      ...mapState('tourney', {
        statuses: (state) => state.statuses,
        tourneyType: (state) => state.tourneyType,
      }),
      poolOptions() {
        return [{ id: null, name: 'All Pools' }, ...this.pools];
      },
      fieldOptions() {
        return [{ id: null, name: 'All Terrains' }, ...this.fields];
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
      calendarOptions() {
        if (!this.tourney.dateTourney) {
          console.error('La date du tournoi n’est pas disponible');
          return {};
        }

        const events = [];

        // Afficher les pauses (intro, déjeuner, conclusion) en tant qu'événements de fond
        this.addBreakTimes(events);

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
          resources: this.filteredFields.map((field) => ({
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
      filteredFields() {
        if (this.selectedFieldId) {
          return this.fields.filter(
            (field) => field.id === this.selectedFieldId
          );
        }
        return this.fields;
      },
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

          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/planning/details`
          );

          const data = response.data;

          this.fields = data.fields || [];
          this.pools = data.pools || [];
          this.games = data.games || [];
          this.sports = data.sports || [];
          this.scheduleConfig = data.scheduleTourney || {};

          // Récupérer les détails du tournoi pour avoir la date
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
      async fetchUserNextGames() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/games/next`
          );
          this.userNextGames = response.data;
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des prochains matchs de l'utilisateur :",
            error
          );
        }
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

        const extendedProps = arg.event.extendedProps;
        if (extendedProps.game || extendedProps.poolSchedule) {
          const info = document.createElement('div');
          if (extendedProps.game) {
            const game = extendedProps.game;
            const poolName = game.pool ? game.pool.name : '';
            const sportName = game.sport ? game.sport.name : '';
            info.innerText = `${poolName} - ${sportName}`;
          } else if (extendedProps.poolSchedule) {
            const poolSchedule = extendedProps.poolSchedule;
            const poolName = poolSchedule.pool ? poolSchedule.pool.name : '';
            const sportName = poolSchedule.sport ? poolSchedule.sport.name : '';
            info.innerText = `${poolName} - ${sportName}`;
          }
          info.classList.add('text-xs', 'text-white');

          container.appendChild(headerContainer);
          container.appendChild(timeRange);
          container.appendChild(info);
        } else {
          container.appendChild(headerContainer);
          if (startTime && endTime) {
            container.appendChild(timeRange);
          }
        }

        return { domNodes: [container] };
      },
      formatDisplayTime(date) {
        const d = new Date(date);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      },
      handleEventClick(info) {
        const event = info.event;
        const game = event.extendedProps.game;
        if (game) {
          // Rediriger vers la page du match (à implémenter)
          this.$router.push({
            name: 'MatchDetail',
            params: {
              tourneyId: this.tourneyId,
              gameId: game.id,
            },
          });
        }
      },
      toggleDisplayMode() {
        this.displayMode = this.displayMode === 'games' ? 'pools' : 'games';
      },
      addGamesToEvents(events) {
        this.games.forEach((game) => {
          // Filtrer par poule sélectionnée
          if (this.selectedPoolId && game.pool?.id !== this.selectedPoolId) {
            return;
          }
          // Filtrer par terrain sélectionné
          if (this.selectedFieldId && game.field?.id !== this.selectedFieldId) {
            return;
          }
          if (!game.field) {
            console.warn(
              `Le match avec l'ID ${game.id} n'a pas de terrain assigné.`
            );
            return;
          }
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
      },
      addPoolSchedulesToEvents(events) {
        this.pools.forEach((pool) => {
          if (this.selectedPoolId && pool.id !== this.selectedPoolId) {
            return;
          }
          if (pool.schedules && pool.schedules.length > 0) {
            pool.schedules.forEach((schedule) => {
              // Filtrer par terrain sélectionné
              if (
                this.selectedFieldId &&
                schedule.fieldId !== this.selectedFieldId
              ) {
                return;
              }
              events.push({
                id: `pool-${pool.id}-schedule-${schedule.id}`,
                resourceId: schedule.fieldId.toString(),
                title: pool.name,
                start: `${schedule.date}T${schedule.startTime}`,
                end: `${schedule.date}T${schedule.endTime}`,
                backgroundColor: this.useUnifiedColors
                  ? this.generateUniqueColor(pool.id)
                  : schedule.sport?.color || '#3B82F6',
                textColor: '#FFFFFF',
                extendedProps: { poolSchedule: schedule },
              });
            });
          }
        });
      },
      adjustedSlotMinTime() {
        const startTime = this.scheduleConfig.startTime || '07:00:00';
        return this.roundDownTime(startTime);
      },
      adjustedSlotMaxTime() {
        const endTime = this.scheduleConfig.endTime || '23:00:00';
        return this.roundUpTime(endTime);
      },
      roundDownTime(timeStr) {
        let [hours, minutes, seconds] = timeStr.split(':').map(Number);
        if (minutes > 0 || seconds > 0) {
          // Arrondir à l'heure inférieure
          hours = Math.max(0, hours);
        }
        return `${hours.toString().padStart(2, '0')}:00:00`;
      },
      roundUpTime(timeStr) {
        let [hours, minutes, seconds] = timeStr.split(':').map(Number);
        if (minutes > 0 || seconds > 0) {
          hours += 1;
        }
        if (hours >= 24) hours = 23; // S'assurer que l'heure ne dépasse pas 23h
        return `${hours.toString().padStart(2, '0')}:00:00`;
      },
      formatDateTimeDisplay(dateTime) {
        const d = new Date(dateTime);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} à ${hours}h${minutes}`;
      },
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
              resourceIds: this.fields.map((field) => field.id.toString()),
              title: breakTime.title,
              start: `${this.tourney.dateTourney}T${breakTime.startTime}`,
              end: `${this.tourney.dateTourney}T${breakTime.endTime}`,
              backgroundColor: '#a5e1ff', // bleu clair
              display: 'background',
            });
          }
        });
      },
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
          if (pool.schedules && pool.schedules.length > 0) {
            pool.schedules.forEach((schedule) => {
              // Calculer les heures de début et de fin de la transition
              const transitionStartDateTime = new Date(
                `${schedule.date}T${schedule.endTime}`
              );
              const transitionEndDateTime = new Date(
                transitionStartDateTime.getTime() + transitionDuration * 60000
              );

              // Filtrer par terrain sélectionné
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
          }
        });
      },
    },
    async mounted() {
      await this.fetchPlanningDetails();
      await this.fetchUserNextGames();
    },
  };
</script>

<style scoped>
  @import '@/assets/fullcalendar.css';
</style>
