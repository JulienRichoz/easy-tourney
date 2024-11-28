<!-- TourneyPlanningGames.vue -->
<template>
  <div class="p-6">
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
    >
      <!-- Titre -->
      <TitleComponent title="Gestion des Matchs du Tournoi" />

      <!-- Sélecteur pour le mode d'affichage -->
      <div class="flex items-center mb-4">
        <label for="displayMode" class="mr-2">Afficher par :</label>
        <select id="displayMode" v-model="displayMode" class="border p-2">
          <option value="default">Liste</option>
          <option value="team">Équipe</option>
          <option value="pool">Pool</option>
          <option value="poolSchedule">Créneau de Pool</option>
          <!-- Nouvelle option -->
        </select>
      </div>
      <!-- Boutons d'action -->
      <div class="flex flex-wrap items-center gap-4 sm:gap-8 mt-4 sm:mt-0">
        <ButtonComponent
          @click="generateGames"
          label="Générer les Matchs"
          variant="algo"
          :disabled="!isEditable"
          >Générer Match</ButtonComponent
        >
        <ButtonComponent
          @click="validateGames"
          label="Valider les Matchs"
          variant="primary"
          >Valider Match</ButtonComponent
        >
        <ButtonComponent
          @click="resetGames"
          label="Réinitialiser les Matchs"
          variant="danger"
          :disabled="!isEditable"
          >Reset Match</ButtonComponent
        >
        <ButtonComponent
          @click="downloadExcel"
          label="Télécharger Excel"
          variant="success"
        >
          Exporter Excel
        </ButtonComponent>
      </div>
    </div>

    <!-- Affichage des matchs -->
    <div v-if="displayMode === 'default'">
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white">
          <thead>
            <tr>
              <th class="px-4 py-2">#</th>
              <th class="px-4 py-2">Équipe A</th>
              <th class="px-4 py-2">Équipe B</th>
              <th class="px-4 py-2">Début</th>
              <th class="px-4 py-2">Fin</th>
              <th class="px-4 py-2">Terrain</th>
              <th class="px-4 py-2">Sport</th>
              <th class="px-4 py-2">Pool</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(game, index) in games"
              :key="game.id"
              :class="getRowClass(game)"
            >
              <td class="border px-4 py-2">{{ index + 1 }}</td>
              <td class="border px-4 py-2">
                {{ game.teamA?.teamName || 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ game.teamB?.teamName || 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ formatDateTime(game.startTime) }}
              </td>
              <td class="border px-4 py-2">
                {{ formatDateTime(game.endTime) }}
              </td>
              <td class="border px-4 py-2">
                {{ game.field ? game.field.name : 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ game.sport ? game.sport.name : 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ game.pool ? game.pool.name : 'N/A' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else-if="displayMode === 'team'">
      <!-- Affichage par équipe -->
      <div v-for="team in teams" :key="team.id" class="mb-6">
        <h2 class="text-xl font-bold mb-2">{{ team.name }}</h2>
        <table class="min-w-full bg-white">
          <!-- ... entête du tableau ... -->
          <tbody>
            <tr></tr>
            <tr
              v-for="(game, index) in team.games"
              :key="game.id"
              :class="getRowClass(game)"
            >
              <!-- ... colonnes du tableau ... -->
              <td class="border px-4 py-2">{{ index + 1 }}</td>
              <td class="border px-4 py-2">
                {{ game.teamA?.teamName || 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ game.teamB?.teamName || 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ formatDateTime(game.startTime) }}
              </td>
              <td class="border px-4 py-2">
                {{ formatDateTime(game.endTime) }}
              </td>
              <td class="border px-4 py-2">
                {{ game.field ? game.field.name : 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ game.sport ? game.sport.name : 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ game.pool ? game.pool.name : 'N/A' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="displayMode === 'pool'">
      <!-- Affichage par pool -->
      <div v-for="pool in pools" :key="pool.id" class="mb-6" index="0">
        <h2 class="text-xl font-bold mb-2">{{ pool.name }}</h2>
        <table class="min-w-full bg-white">
          <!-- ... entête du tableau ... -->
          <tbody>
            <tr></tr>
            <tr
              v-for="(game, index) in pool.games"
              :key="game.id"
              :class="getRowClass(game)"
            >
              <!-- ... colonnes du tableau ... -->
              <td class="border px-4 py-2">{{ index + 1 }}</td>
              <td class="border px-4 py-2">
                {{ game.teamA?.teamName || 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ game.teamB?.teamName || 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ formatDateTime(game.startTime) }}
              </td>
              <td class="border px-4 py-2">
                {{ formatDateTime(game.endTime) }}
              </td>
              <td class="border px-4 py-2">
                {{ game.field ? game.field.name : 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ game.sport ? game.sport.name : 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ game.pool ? game.pool.name : 'N/A' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else-if="displayMode === 'poolSchedule'">
      <!-- Affichage par créneau de pool -->
      <div
        v-for="poolSchedule in poolSchedules"
        :key="poolSchedule.id"
        class="mb-6"
      >
        <h2 class="text-xl font-bold mb-2">{{ poolSchedule.label }}</h2>
        <table class="min-w-full bg-white">
          <thead>
            <tr>
              <th class="px-4 py-2">#</th>
              <th class="px-4 py-2">Équipe A</th>
              <th class="px-4 py-2">Équipe B</th>
              <th class="px-4 py-2">Début</th>
              <th class="px-4 py-2">Fin</th>
              <th class="px-4 py-2">Terrain</th>
              <th class="px-4 py-2">Sport</th>
              <th class="px-4 py-2">Pool</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(game, index) in poolSchedule.games"
              :key="game.id"
              :class="getRowClass(game)"
            >
              <td class="border px-4 py-2">{{ index + 1 }}</td>
              <td class="border px-4 py-2">
                {{ game.teamA?.teamName || 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ game.teamB?.teamName || 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ formatDateTime(game.startTime) }}
              </td>
              <td class="border px-4 py-2">
                {{ formatDateTime(game.endTime) }}
              </td>
              <td class="border px-4 py-2">
                {{ game.field ? game.field.name : 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ game.sport ? game.sport.name : 'N/A' }}
              </td>
              <td class="border px-4 py-2">
                {{ game.pool ? game.pool.name : 'N/A' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import TitleComponent from '@/components/TitleComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import { toast } from 'vue3-toastify';
  import moment from 'moment';
  import { mapState } from 'vuex';

  export default {
    components: {
      TitleComponent,
      ButtonComponent,
    },
    data() {
      return {
        games: [],
        tourneyId: this.$route.params.tourneyId,
        displayMode: 'default', // 'default', 'team', 'pool', 'timeSlot'
        teams: [],
        pools: [],
        poolSchedules: [], // Nouvelle propriété pour les créneaux horaires
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
       * Determines if the planning is editable based on the current status.
       */
      isEditable() {
        return this.statuses.planningStatus !== 'completed';
      },
    },
    methods: {
      async fetchGames() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/planning/details`
          );
          this.games = response.data.games;
          // Préparer les données pour l'affichage par équipe
          this.prepareTeamsData();
          // Préparer les données pour l'affichage par pool
          this.preparePoolsData();
          // Préparer les données pour l'affichage par créneau horaire
          this.preparePoolSchedulesData();
        } catch (error) {
          console.error('Erreur lors de la récupération des matchs:', error);
          toast.error('Erreur lors de la récupération des matchs.');
        }
      },
      async downloadExcel() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/export-data/excel`,
            {
              responseType: 'blob', // Spécifiez que vous attendez un blob
            }
          );

          // Créer une URL temporaire pour le fichier
          const blob = response.data; // Axios renvoie le blob dans `data`
          const url = window.URL.createObjectURL(blob);

          // Créer un lien pour déclencher le téléchargement
          const a = document.createElement('a');
          a.href = url;
          a.download = `tournament_${this.tourneyId}.xlsx`; // Nom du fichier
          document.body.appendChild(a);
          a.click();

          // Nettoyer l'URL temporaire après le téléchargement
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Erreur lors du téléchargement Excel :', error);
          toast.error(
            error.message || "Une erreur s'est produite lors du téléchargement."
          );
        }
      },
      prepareTeamsData() {
        const teamsMap = {};

        this.games.forEach((game) => {
          [game.teamA, game.teamB].forEach((team) => {
            if (!teamsMap[team.id]) {
              teamsMap[team.id] = {
                id: team.id,
                name: team.teamName,
                games: [],
              };
            }
          });

          teamsMap[game.teamA.id].games.push(game);
          teamsMap[game.teamB.id].games.push(game);
        });

        this.teams = Object.values(teamsMap);
      },
      preparePoolsData() {
        const poolsMap = {};

        this.games.forEach((game) => {
          if (!game.pool) {
            return;
          }
          const pool = game.pool;
          if (!poolsMap[pool.id]) {
            poolsMap[pool.id] = {
              id: pool.id,
              name: pool.name,
              games: [],
            };
          }
          poolsMap[pool.id].games.push(game);
        });

        this.pools = Object.values(poolsMap);
      },
      preparePoolSchedulesData() {
        const poolSchedulesMap = {};
        this.games.forEach((game) => {
          const poolScheduleId = game.poolScheduleId;
          const poolSchedule = game.poolSchedule; // Assurez-vous que cette information est disponible

          if (!poolScheduleId || !poolSchedule) {
            console.warn(
              `Le jeu ID ${game.id} n'a pas de PoolSchedule assigné.`
            );
            return; // Ignorer ce jeu
          }

          if (!poolSchedulesMap[poolScheduleId]) {
            poolSchedulesMap[poolScheduleId] = {
              id: poolScheduleId,
              label: `Pool: ${game.pool.name}, Créneau: ${this.formatTimeRange(
                poolSchedule.startTime,
                poolSchedule.endTime
              )}`,
              games: [],
            };
          }

          poolSchedulesMap[poolScheduleId].games.push(game);
        });

        // Convertir en tableau et trier si nécessaire
        this.poolSchedules = Object.values(poolSchedulesMap);
      },
      // Nouvelle méthode pour formater une plage horaire
      formatTimeRange(startTime, endTime) {
        const start = moment(startTime, 'HH:mm:ss').format('HH:mm');
        const end = moment(endTime, 'HH:mm:ss').format('HH:mm');
        return `${start} - ${end}`;
      },
      formatDateTime(dateTime) {
        return moment(dateTime).format('DD/MM/YYYY HH:mm');
      },
      formatTime(dateTime) {
        return moment(dateTime).format('HH:mm');
      },
      getRowClass(game) {
        // Vérifier si game.pool existe
        if (!game.pool || !game.pool.name) {
          return '';
        }
        // Retourne une classe CSS en fonction de la pool
        const poolColors = {
          'Pool A': 'bg-blue-100',
          'Pool B': 'bg-green-100',
          'Pool C': 'bg-yellow-100',
          'Pool D': 'bg-red-100',
          'POOL E': 'bg-purple-100',
          'Pool F': 'bg-pink-100',
          'POOL G': 'bg-indigo-100',
          'Pool H': 'bg-gray-100',
          'Pool I': 'bg-blue-200',
          // Ajoutez d'autres pools si nécessaire
        };
        return poolColors[game.pool.name] || '';
      },
      async generateGames() {
        try {
          await apiService.post(
            `/tourneys/${this.tourneyId}/planning/games/generate`
          );
          toast.success('Matchs générés avec succès!');
          this.fetchGames();
        } catch (error) {
          console.error('Erreur lors de la génération des matchs:', error);
          toast.error('Erreur lors de la génération des matchs.');
        }
      },
      async validateGames() {
        try {
          await apiService.post(
            `/tourneys/${this.tourneyId}/planning/games/validate`
          );
          toast.success('Matchs validés avec succès!');
        } catch (error) {
          console.error('Erreur lors de la validation des matchs:', error);
          toast.error('Erreur lors de la validation des matchs.');
        }
      },
      async resetGames() {
        try {
          await apiService.delete(
            `/tourneys/${this.tourneyId}/planning/games/reset`
          );
          toast.success('Matchs réinitialisés avec succès!');
          this.fetchGames();
        } catch (error) {
          console.error(
            'Erreur lors de la réinitialisation des matchs:',
            error
          );
          toast.error('Erreur lors de la réinitialisation des matchs.');
        }
      },
    },
    mounted() {
      this.fetchGames();
    },
  };
</script>

<style scoped>
  /* Ajoutez des styles personnalisés si nécessaire */
</style>
