<!-- src/views/user/tourneys/TourneyGameDetails.vue -->
<template>
  <div v-if="socketError" class="alert alert-warning">
    {{ socketError }}
  </div>
  <div v-if="match" class="p-6">
    <div class="text-center mb-4">
      <span class="text-lg font-semibold">
        Statut du match : {{ getMatchStatusLabel(match.status) }}
      </span>
    </div>

    <!-- Affichage du match -->
    <div class="flex flex-col items-center">
      <div class="flex items-center justify-center mb-4">
        <!-- Équipe A -->
        <div class="flex flex-col items-center mr-4">
          <h2 class="text-xl font-bold">{{ match.teamA.teamName }}</h2>
          <ul class="mt-2">
            <li v-for="player in teamAPlayers" :key="player.id">
              {{ player.name }}
            </li>
          </ul>
        </div>

        <!-- Score et chronomètre -->
        <div class="flex flex-col items-center mx-8">
          <div class="flex items-center">
            <!-- Pour les assistants/admins : inputs modifiables -->
            <div v-if="isAuthorized">
              <input
                v-model.number="scoreTeamA"
                type="number"
                class="w-16 text-center text-4xl font-bold bg-transparent border-none"
                @input="updateScores"
              />
              <span class="text-4xl font-bold mx-2">-</span>
              <input
                v-model.number="scoreTeamB"
                type="number"
                class="w-16 text-center text-4xl font-bold bg-transparent border-none"
                @input="updateScores"
              />
            </div>
            <!-- Pour les joueurs : affichage en lecture seule -->
            <div v-else>
              <span class="text-4xl font-bold">{{ scoreTeamA }}</span>
              <span class="text-4xl font-bold mx-2">-</span>
              <span class="text-4xl font-bold">{{ scoreTeamB }}</span>
            </div>
          </div>
          <!-- Boutons de contrôle du timer -->
          <div class="mt-2" v-if="isAuthorized">
            <button
              v-if="!timerRunning"
              @click="startTimer"
              class="px-4 py-2 bg-green-500 text-white rounded"
            >
              Démarrer
            </button>
            <button
              v-else
              @click="stopTimer"
              class="px-4 py-2 bg-red-500 text-white rounded"
            >
              Arrêter
            </button>
            <div class="mt-2 text-lg font-semibold">{{ formattedTime }}</div>
          </div>
          <!-- Affichage du timer pour les joueurs -->
          <div class="mt-2 text-lg font-semibold" v-else>
            {{ formattedTime }}
          </div>
        </div>

        <!-- Équipe B -->
        <div class="flex flex-col items-center ml-4">
          <h2 class="text-xl font-bold">{{ match.teamB.teamName }}</h2>
          <ul class="mt-2">
            <li v-for="player in teamBPlayers" :key="player.id">
              {{ player.name }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Événements du match (pour les arbitres et admins) -->
      <div v-if="isAuthorized" class="flex flex-wrap justify-center mt-4 gap-4">
        <!-- Boutons d'événements -->
        <button
          @click="openEventModal('goal')"
          class="px-4 py-2 bg-green-500 text-white rounded"
        >
          But
        </button>
        <button
          @click="openEventModal('foul')"
          class="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Faute
        </button>
        <button
          @click="openEventModal('yellow_card')"
          class="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Carton Jaune
        </button>
        <button
          @click="openEventModal('red_card')"
          class="px-4 py-2 bg-red-700 text-white rounded"
        >
          Carton Rouge
        </button>
      </div>

      <!-- Timeline des événements -->
      <div
        class="relative max-w-4xl mx-auto mt-6 h-96 overflow-y-auto border border-gray-200 rounded-lg shadow"
      >
        <ul class="relative">
          <TimelineEvent
            v-for="event in sortedGameEvents"
            :key="event.id"
            :position="getEventPosition(event)"
            :icon="event.type"
          >
            <p class="font-semibold">{{ getEventDescription(event) }}</p>
            <p class="text-sm text-gray-500">
              {{ formatEventTime(event.createdAt) }}
            </p>
          </TimelineEvent>
        </ul>
      </div>
    </div>

    <!-- Modal pour ajouter un événement -->
    <div
      v-if="showEventModal"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h3 class="text-xl font-bold mb-4">Ajouter un événement</h3>
        <form @submit.prevent="submitEvent">
          <div class="mb-4">
            <label class="block mb-1">Équipe :</label>
            <select
              v-model="eventTeamId"
              class="w-full border rounded px-3 py-2"
            >
              <option :value="match.teamA.id">
                {{ match.teamA.teamName }}
              </option>
              <option :value="match.teamB.id">
                {{ match.teamB.teamName }}
              </option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block mb-1">Description :</label>
            <input
              v-model="eventDescription"
              type="text"
              class="w-full border rounded px-3 py-2"
            />
          </div>
          <div class="flex justify-end">
            <button
              type="button"
              @click="closeEventModal"
              class="px-4 py-2 mr-2 bg-gray-300 rounded"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import { getSocket } from '@/services/socketService';
  import TimelineEvent from '@/components/user/TimelineEvent.vue';

  export default {
    components: {
      TimelineEvent,
    },
    data() {
      return {
        match: null,
        scoreTeamA: 0,
        scoreTeamB: 0,
        timer: null,
        timerRunning: false,
        elapsedTime: 0,
        teamAPlayers: [],
        teamBPlayers: [],
        gameEvents: [],
        showEventModal: false,
        eventType: '',
        eventTeamId: null,
        eventDescription: '',
        socketError: null,
      };
    },
    computed: {
      isAdmin() {
        return this.$store.state.user.roleId === 1;
      },
      isAuthorized() {
        // Vérifier si l'utilisateur est assistant ou admin du tournoi
        const isAssistant = this.$store.getters['userTourney/isAssistant'];
        const isAdmin = this.$store.state.user.roleId === 1;
        return isAssistant || isAdmin;
      },
      sortedGameEvents() {
        // Trier les événements par ordre décroissant (plus récents en haut)
        return [...this.gameEvents].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      },
      formattedTime() {
        const minutes = Math.floor(this.elapsedTime / 60)
          .toString()
          .padStart(2, '0');
        const seconds = (this.elapsedTime % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
      },

      // Admin can always edit the match
      canEdit() {
        if (this.isAdmin) return true;
        return this.isAuthorized && this.match.status !== 'completed';
      },
    },
    methods: {
      async fetchMatchDetails() {
        try {
          const { tourneyId, gameId } = this.$route.params;
          const response = await apiService.get(
            `/tourneys/${tourneyId}/games/${gameId}`
          );
          this.match = response.data;
          this.scoreTeamA = this.match.scoreTeamA || 0;
          this.scoreTeamB = this.match.scoreTeamB || 0;

          // Récupérer les joueurs des équipes
          this.teamAPlayers = this.match.teamA.players || [];
          this.teamBPlayers = this.match.teamB.players || [];
          const socket = getSocket();
          if (!socket) {
            console.warn(
              "Socket non disponible. L'utilisateur est peut-être déconnecté."
            );
            return;
          }

          // Rejoindre la salle du match via Socket.IO
          socket.emit('joinGame', this.match.id);

          // Écouter les mises à jour du score
          socket.on('scoreUpdated', (data) => {
            this.scoreTeamA = data.scoreTeamA;
            this.scoreTeamB = data.scoreTeamB;
          });

          // Écouter les événements du match
          socket.on('gameEvent', (event) => {
            this.gameEvents.push(event);
          });

          // Récupérer les événements du match
          const eventsResponse = await apiService.get(
            `/tourneys/${tourneyId}/games/${gameId}/events`
          );
          this.gameEvents = eventsResponse.data;
          console.log('this.gameEvents', this.gameEvents);
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du match :',
            error
          );
        }
      },
      updateScores() {
        if (!this.isAuthorized) return;
        const { tourneyId } = this.$route.params;
        // Envoyer les nouvelles données de score via Socket.IO
        const socket = getSocket();
        socket.emit('updateScore', {
          tourneyId: parseInt(tourneyId),
          gameId: this.match.id,
          scoreTeamA: this.scoreTeamA,
          scoreTeamB: this.scoreTeamB,
        });
      },
      startTimer() {
        if (!this.isAuthorized) return;
        if (this.timer) return;
        this.timerRunning = true;
        this.timer = setInterval(() => {
          this.elapsedTime++;
        }, 1000);
      },
      stopTimer() {
        if (!this.isAuthorized) return;

        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
          this.timerRunning = false;
        }
      },
      getMatchStatusLabel(status) {
        switch (status) {
          case 'scheduled':
            return 'Prévu';
          case 'in_progress':
            return 'En cours';
          case 'completed':
            return 'Terminé';
          default:
            return 'Inconnu';
        }
      },

      openEventModal(eventType) {
        this.eventType = eventType;
        this.eventTeamId = this.match.teamA.id;
        this.eventDescription = '';
        this.showEventModal = true;
      },
      closeEventModal() {
        this.showEventModal = false;
      },
      setupSocket() {
        const socket = getSocket();
        if (!socket) {
          return;
        }
        socket.on('connect_error', () => {
          this.socketError =
            'Impossible de se connecter au serveur en temps réel.';
        });

        socket.on('disconnect', () => {
          this.socketError = 'Connexion au serveur en temps réel perdue.';
        });
      },
      submitEvent() {
        const { tourneyId } = this.$route.params;
        const event = {
          type: this.eventType,
          teamId: this.eventTeamId,
          description: this.eventDescription,
        };
        console.log('event', event);
        // Envoyer l'événement via Socket.IO
        const socket = getSocket();
        socket.emit('gameEvent', {
          tourneyId: parseInt(tourneyId),
          gameId: this.match.id,
          event,
        });
        this.closeEventModal();
      },
      // Mapping des types d'événements aux icônes FontAwesome
      getEventIcon(eventType) {
        switch (eventType) {
          case 'goal':
            return ['fas', 'futbol'];
          case 'foul':
            return ['fas', 'exclamation-circle'];
          case 'yellow_card':
            return ['fas', 'square'];
          case 'red_card':
            return ['fas', 'square-full'];
          default:
            return ['fas', 'question-circle'];
        }
      },
      getEventPosition(event) {
        if (event.team?.id === this.match.teamA.id) return 'left';
        if (event.team?.id === this.match.teamB.id) return 'right';
        return 'center';
      },
      getEventDescription(event) {
        switch (event.type) {
          case 'goal':
            return 'But marqué';
          case 'foul':
            return 'Faute commise';
          case 'yellow_card':
            return 'Carton Jaune';
          case 'red_card':
            return 'Carton Rouge';
          default:
            return 'Événement';
        }
      },
      formatEventTime(timestamp) {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      },
    },
    beforeUnmount() {
      // Quitter la salle du match lorsque le composant est détruit
      const socket = getSocket();
      if (socket) {
        socket.emit('leaveGame', this.match.id);
      }
    },
    async mounted() {
      await this.fetchMatchDetails();
      this.setupSocket();
    },
  };
</script>

<style scoped>
  /* Alignement des événements et ligne centrale */
  .timeline-box {
    position: relative;
    z-index: 10;
  }

  .timeline-box::before {
    content: '';
    position: absolute;
    height: 2px;
    background: #d1d5db; /* Tailwind's gray-300 */
    top: 50%;
    left: -30px;
    right: -30px;
    z-index: -1;
  }

  .timeline li::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    height: 100%;
    width: 2px;
    background: #cbd5e1; /* Tailwind's gray-400 */
    z-index: -1;
  }
</style>
