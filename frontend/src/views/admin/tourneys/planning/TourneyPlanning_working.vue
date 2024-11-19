<template>
  <div>
    <!-- Sidebar Menu -->
    <SidebarMenuComponent
      :menuItems="menuItems"
      :options="sidebarOptions"
      @toggle="sidebarOpen = $event"
    />

    <div :class="{ 'pl-64': sidebarOpen }" class="transition-all duration-300">
      <!-- Contenu principal ici -->

      <!-- Sous-menu -->
      <TourneySubMenu :tourneyId="tourneyId" />

      <!-- Filtres et switch -->
      <div class="flex justify-between mb-4">
        <div class="flex space-x-4">
          <!-- Champ de sélection de date -->
          <div class="flex items-center space-x-2">
            <label for="datePicker" class="text-sm font-medium"> Date : </label>
            <input
              id="datePicker"
              type="date"
              class="border rounded px-2 py-1"
              :value="selectedDate"
              @change="changeDate($event)"
            />
          </div>
        </div>
        <div class="flex space-x-4">
          <!-- Bouton pour changer d'affichage -->
          <ButtonComponent
            fontAwesomeIcon="link"
            @click="toggleViewMode"
            variant="secondary"
          >
            Afficher {{ viewMode === 'games' ? 'Pools' : 'Games' }}
          </ButtonComponent>
          <ButtonComponent
            fontAwesomeIcon="plus"
            @click="openAddGameModal"
            variant="primary"
          >
            Ajouter Match
          </ButtonComponent>
        </div>
      </div>

      <!-- Tableau des matchs ou pools -->
      <div v-if="viewMode === 'games'" class="overflow-x-auto">
        <table
          class="w-full border-collapse border border-gray-200 dark:border-gray-700"
        >
          <thead>
            <tr>
              <th
                class="px-4 py-2 border bg-gray-100 dark:bg-gray-800 text-left"
              >
                Horaire
              </th>
              <th
                v-for="field in fields"
                :key="field.id"
                class="px-4 py-2 border bg-gray-100 dark:bg-gray-800 text-left"
              >
                {{ field.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <template
              v-for="(group, index) in groupTimeSlotsBySegment"
              :key="`segment-${index}`"
            >
              <tr class="bg-gray-200 dark:bg-gray-800">
                <td colspan="100" class="px-4 py-2 text-center font-bold">
                  {{ group.segment }}
                </td>
              </tr>
              <template
                v-for="timeSlot in group.timeSlots"
                :key="timeSlot.start"
              >
                <tr
                  v-if="group.segment === 'Match'"
                  class="hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <td class="px-4 py-2 border dark:border-gray-700">
                    {{ timeSlot.start }} - {{ timeSlot.end }}
                  </td>
                  <td
                    v-for="field in fields"
                    :key="`${timeSlot.start}-${field.id}`"
                    class="px-4 py-2 border dark:border-gray-700 relative"
                  >
                    <!-- Contenu pour l'affichage des jeux -->
                    <div
                      v-for="game in getGamesForFieldAndTime(
                        field.id,
                        timeSlot
                      )"
                      :key="game.id"
                      class="p-2 rounded-md"
                      :style="{ backgroundColor: game.sport.color }"
                      @click="openGameDetails(game)"
                    >
                      <p class="text-sm font-bold">{{ game.pool.name }}</p>
                      <p class="text-xs">{{ game.sport.name }}</p>
                      <p class="text-xs">
                        {{ game.startTime }} - {{ game.endTime }}
                      </p>
                    </div>
                  </td>
                </tr>
                <tr v-else>
                  <td colspan="100" class="px-4 py-2 text-center">
                    {{ timeSlot.start }} - {{ timeSlot.end }}
                  </td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Affichage des Pools -->
      <div v-else class="overflow-x-auto">
        <h1 class="text-2xl font-bold mb-4">Planning des Pools</h1>
        <div v-if="pools.length" class="space-y-4">
          <div
            v-for="pool in pools"
            :key="pool.id"
            class="bg-white shadow rounded-lg p-4"
          >
            <h2 class="text-lg font-semibold mb-2">{{ pool.name }}</h2>
            <div v-if="pool.schedules.length">
              <ul>
                <li
                  v-for="schedule in pool.schedules"
                  :key="schedule.id"
                  class="flex justify-between items-center"
                >
                  <span>{{ schedule.field.name }}</span>
                  <span>{{ schedule.startTime }} - {{ schedule.endTime }}</span>
                  <span>{{ schedule.date }}</span>
                  <span>{{ schedule.sport.name }}</span>
                </li>
              </ul>
            </div>
            <p v-else class="text-gray-500">Aucune planification assignée.</p>
          </div>
        </div>
        <p v-else class="text-gray-500">Aucune pool disponible.</p>
      </div>
    </div>

    <!-- Modal pour Ajouter un Match -->
    <ModalComponent v-if="showAddGameModal" @close="showAddGameModal = false">
      <template #title> Ajouter un Match </template>
      <template #content>
        <!-- Contenu du formulaire d'ajout de match -->
        <p>Ici, ajoutez un formulaire ou une logique pour ajouter un match.</p>
      </template>
    </ModalComponent>
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import ModalComponent from '@/components/ModalComponent.vue';
  import SidebarMenuComponent from '@/components/SidebarMenuComponent.vue';

  export default {
    components: {
      TourneySubMenu,
      ButtonComponent,
      ModalComponent,
      SidebarMenuComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId, // ID du tournoi courant
        fields: [], // Terrains
        games: [], // Matches
        pools: [], // Pools
        sports: [], // Initialisation des sports
        timeSlots: [], // Créneaux horaires
        selectedGame: null, // Match sélectionné pour détails
        viewMode: 'games', // Mode d'affichage : 'games' ou 'pools'
        menuItems: [
          {
            id: 1,
            label: 'Planning Général',
            route: `/tourneys/${this.tourneyId}/planning`,
          },
          {
            id: 2,
            label: 'Planning Par Terrain',
            route: `/tourneys/${this.tourneyId}/fields`,
          },
          {
            id: 3,
            label: 'Planning Par Pool',
            route: `/tourneys/${this.tourneyId}/pools`,
          },
        ],
        sidebarOptions: [
          {
            id: 1,
            label: 'Afficher Par Pool',
            action: () => this.toggleViewMode(),
          },
          {
            id: 2,
            label: 'Filtrer Par Date',
            action: () => this.filterByDate(),
          },
        ],
        selectedFilter: 'all',
        selectedDate: new Date().toISOString().split('T')[0], // Date actuelle
        showAddGameModal: false, // Contrôle de l'affichage du modal
      };
    },
    computed: {
      groupTimeSlotsBySegment() {
        return this.timeSlots.reduce((groups, slot) => {
          const group = groups.find((g) => g.segment === slot.segment);
          if (group) {
            group.timeSlots.push(slot);
          } else {
            groups.push({ segment: slot.segment, timeSlots: [slot] });
          }
          return groups;
        }, []);
      },
      gamesExistForFieldAndTime(fieldId, timeSlot) {
        return this.getGamesForFieldAndTime(fieldId, timeSlot).length > 0;
      },
    },

    methods: {
      async fetchData() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/planning/details`
          );

          this.fields = response.data.fields;
          this.sports = response.data.sports;

          // Filtrer les schedules des pools par la date sélectionnée
          this.pools = response.data.pools
            .map((pool) => ({
              ...pool,
              sport: this.getSportById(pool.sportId),
              schedules: pool.schedules.filter(
                (schedule) => schedule.date === this.selectedDate
              ),
            }))
            .filter((pool) => pool.schedules.length > 0); // Garder uniquement les pools avec des schedules pour la date sélectionnée

          // Extraire les jeux à partir des schedules filtrés
          this.games = this.pools.flatMap((pool) =>
            pool.schedules.map((schedule) => ({
              ...schedule,
              pool,
              teams: pool.teams,
              fieldId: schedule.field.id,
            }))
          );

          console.log('Loaded Pools:', this.pools); // Vérifier les pools filtrés
          console.log('Loaded Games:', this.games); // Vérifier les jeux filtrés

          this.generateTimeSlots(response.data.scheduleTourney);
        } catch (error) {
          console.error('Erreur lors de la récupération des données :', error);
        }
      },
      generateTimeSlots(schedule) {
        const startTime = new Date(`1970-01-01T${schedule.startTime}`);
        const endTime = new Date(`1970-01-01T${schedule.endTime}`);
        const poolDuration = schedule.poolDuration * 60000; // Convertir en millisecondes
        const transitionTime = schedule.transitionPoolTime * 60000; // Convertir en millisecondes

        const breaks = [
          {
            segment: 'Intro',
            start: new Date(`1970-01-01T${schedule.introStart}`),
            end: new Date(`1970-01-01T${schedule.introEnd}`),
          },
          {
            segment: 'Lunch',
            start: new Date(`1970-01-01T${schedule.lunchStart}`),
            end: new Date(`1970-01-01T${schedule.lunchEnd}`),
          },
          {
            segment: 'Outro',
            start: new Date(`1970-01-01T${schedule.outroStart}`),
            end: new Date(`1970-01-01T${schedule.outroEnd}`),
          },
        ];

        const slots = [];
        let currentTime = startTime;

        while (currentTime < endTime) {
          // Vérifier si currentTime est pendant une pause
          const overlappingBreak = breaks.find(
            (br) => currentTime >= br.start && currentTime < br.end
          );

          if (overlappingBreak) {
            // Ajouter le segment de pause
            slots.push({
              segment: overlappingBreak.segment,
              start: overlappingBreak.start.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              end: overlappingBreak.end.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            });
            // Avancer currentTime à la fin de la pause
            currentTime = new Date(overlappingBreak.end);
            continue;
          }

          // Générer le créneau de match
          const slotEnd = new Date(currentTime.getTime() + poolDuration);

          // Vérifier si le créneau dépasse une pause
          const overlappingBreakDuringSlot = breaks.find(
            (br) => slotEnd > br.start && slotEnd <= br.end
          );

          if (overlappingBreakDuringSlot) {
            // Ajuster le slotEnd au début de la pause
            slotEnd.setTime(overlappingBreakDuringSlot.start.getTime());
          }

          if (slotEnd > endTime) {
            break; // Arrêter si le créneau dépasse l'heure de fin
          }

          slots.push({
            segment: 'Match',
            start: currentTime.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            end: slotEnd.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          });

          // Avancer currentTime
          currentTime = new Date(slotEnd.getTime() + transitionTime);
        }

        console.log('Generated TimeSlots:', slots);
        this.timeSlots = slots;
      },
      timeStringToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      },

      getGamesForFieldAndTime(fieldId, timeSlot) {
        const timeSlotStartMinutes = this.timeStringToMinutes(timeSlot.start);
        const timeSlotEndMinutes = this.timeStringToMinutes(timeSlot.end);

        return this.games.filter((game) => {
          if (game.fieldId !== fieldId) return false;

          const gameStartMinutes = this.timeStringToMinutes(
            this.normalizeTime(game.startTime)
          );
          const gameEndMinutes = this.timeStringToMinutes(
            this.normalizeTime(game.endTime)
          );

          return (
            gameStartMinutes >= timeSlotStartMinutes &&
            gameEndMinutes <= timeSlotEndMinutes
          );
        });
      },

      getPoolsForFieldAndTime(fieldId, timeSlot) {
        const filteredPools = this.pools.filter((pool) =>
          pool.schedules.some((schedule) => {
            const scheduleStart = this.normalizeTime(schedule.startTime);
            const scheduleEnd = this.normalizeTime(schedule.endTime);
            const isMatch =
              schedule.field.id === fieldId &&
              scheduleStart === timeSlot.start &&
              scheduleEnd === timeSlot.end;
            if (isMatch) {
              console.log(`Pool matched:`, pool, schedule);
            }
            return isMatch;
          })
        );
        console.log(
          `Filtered pools for Field ID: ${fieldId}, Time Slot:`,
          timeSlot,
          filteredPools
        );
        return filteredPools;
      },
      normalizeTime(time) {
        if (typeof time === 'string') {
          return time.substring(0, 5); // 'HH:mm'
        } else if (time instanceof Date) {
          return time.toTimeString().substring(0, 5);
        }
        return '';
      },

      getSportById(sportId) {
        const sport = this.sports.find((sport) => sport.id === sportId);
        return sport || { name: 'Inconnu', color: '#ccc' };
      },
      toggleViewMode() {
        this.viewMode = this.viewMode === 'games' ? 'pools' : 'games';
        console.log(`Mode actuel : ${this.viewMode}`);
      },

      openGameDetails(game) {
        this.selectedGame = game;
      },
      closeGameDetails() {
        this.selectedGame = null;
      },
      openAddGameModal() {
        this.showAddGameModal = true;
      },
      applyFilter(filter) {
        this.selectedFilter = filter.value;
        // Vous pouvez ajouter une logique de filtrage ici si nécessaire
      },
      filterByDate() {
        alert('Ajoutez ici votre logique pour filtrer par date !');
      },
      async changeDate(event) {
        this.selectedDate = event.target.value;
        await this.fetchData();
      },
      deleteGame(gameId) {
        // Supprimer un match
        this.games = this.games.filter((game) => game.id !== gameId);
        this.closeGameDetails();
      },
    },
    async mounted() {
      await this.fetchData();
    },
  };
</script>

<style scoped>
  h1 {
    color: #4a4a4a;
  }
</style>
