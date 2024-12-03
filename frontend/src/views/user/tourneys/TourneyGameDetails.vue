<!-- src/views/user/tourneys/TourneyGameDetails.vue -->
<template>
  <div v-if="socketError" class="alert alert-warning">
    {{ socketError }}
  </div>
  <div v-if="match" class="p-6">
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
          <div class="mt-2">
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
          class="px-4 py-2 bg-blue-500 text-white rounded"
        >
          But
        </button>
        <button
          @click="openEventModal('foul')"
          class="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Faute
        </button>
        <button
          @click="openEventModal('yellow_card')"
          class="px-4 py-2 bg-yellow-700 text-white rounded"
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
      <div class="mt-6 w-full max-w-2xl">
        <h3 class="text-lg font-bold mb-2">Événements du match</h3>
        <ul>
          <li
            v-for="event in gameEvents"
            :key="event.id"
            class="border-b py-2 flex items-center"
          >
            <div class="flex-shrink-0 mr-4">
              <img
                :src="getEventIcon(event.type)"
                alt="Event Icon"
                class="w-8 h-8"
              />
            </div>
            <div>
              <p>
                <strong>{{ event.team.teamName }}</strong> -
                {{ getEventDescription(event) }}
              </p>
              <p class="text-sm text-gray-600">
                {{ formatEventTime(event.createdAt) }}
              </p>
            </div>
          </li>
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

  export default {
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
      isAuthorized() {
        // Vérifier si l'utilisateur est assistant ou admin du tournoi
        const userTourneys = this.$store.state.userTourney.userTourneys || [];
        const tourneyId = parseInt(this.$route.params.tourneyId);
        const userTourney = userTourneys.find(
          (ut) => ut.tourneyId === tourneyId
        );
        return userTourney && ['assistant', 'admin'].includes(userTourney.role);
      },
      formattedTime() {
        const minutes = Math.floor(this.elapsedTime / 60)
          .toString()
          .padStart(2, '0');
        const seconds = (this.elapsedTime % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
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

          // Récupérer les joueurs des équipes (si vous avez cette information)
          // Sinon, vous pouvez les laisser vides ou afficher un message
          this.teamAPlayers = []; // À implémenter selon vos données
          this.teamBPlayers = []; // À implémenter selon vos données
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du match :',
            error
          );
        }
      },
      updateScores() {
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
        if (this.timer) return;
        this.timerRunning = true;
        this.timer = setInterval(() => {
          this.elapsedTime++;
        }, 1000);
      },
      stopTimer() {
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
          this.timerRunning = false;
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
        // Envoyer l'événement via Socket.IO
        const socket = getSocket();
        socket.emit('gameEvent', {
          tourneyId: parseInt(tourneyId),
          gameId: this.match.id,
          event,
        });
        this.closeEventModal();
      },
      getEventIcon(eventType) {
        switch (eventType) {
          case 'goal':
            return '/icons/goal.png'; // Mettez le chemin vers vos icônes
          case 'foul':
            return '/icons/foul.png';
          case 'yellow_card':
            return '/icons/yellow_card.png';
          case 'red_card':
            return '/icons/red_card.png';
          default:
            return '/icons/default.png';
        }
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
  /* Ajoutez vos styles ici */
</style>
