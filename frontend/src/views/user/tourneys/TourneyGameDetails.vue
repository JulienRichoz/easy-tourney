<!-- src/views/user/tourneys/TourneyGameDetails.vue -->
<template>
  <div v-if="socketError" class="alert alert-warning">
    {{ socketError }}
  </div>
  <div v-if="match" class="p-6 relative">
    <!-- Affichage de l'assistant et des spectateurs -->
    <div class="absolute top-0 left-0 p-4 bg-opacity-75 rounded-lg shadow-md">
      <p class="text-lg font-semibold">
        <font-awesome-icon icon="gavel" class="mr-2" />Arbitre:
        {{ assistantName }}
      </p>
      <p class="text-lg font-semibold">
        <font-awesome-icon icon="eye" class="mr-2" />Spectateurs:
        {{ spectatorCount }}
      </p>
      <ButtonComponent
        variant="secondary"
        fontAwesomeIcon="arrow-left"
        @click="goBack"
      >
        <span class="hidden sm:inline">Retour</span>
      </ButtonComponent>
    </div>
    <div class="flex items-center justify-center mb-4 relative">
      <div class="text-center">
        <h2 class="text-2xl font-bold">
          {{ match.field.name }} | {{ match.sport.name }}
        </h2>
        <p class="text-lg">
          Heure : {{ formatTime(match.startTime) }} -
          {{ formatTime(match.endTime) }}
        </p>
      </div>
      <!-- Sélecteur de statut du match -->
      <div v-if="isAuthorized" class="absolute right-0">
        <StatusSelectorComponent
          :tourneyId="tourneyId"
          statusKey="matchStatus"
          :statusOptions="gameStatusOptions"
          v-model="match.status"
          label="Statut du match :"
          :hideWhenNotStarted="false"
          :onStatusChange="onMatchStatusChange"
        />
      </div>
      <!-- Afficher le statut pour les players -->
      <div v-else class="absolute right-0">
        <p class="text-lg font-semibold">
          {{ getMatchStatusLabel(match.status) }}
        </p>
      </div>
    </div>

    <!-- Affichage du match -->
    <div class="flex flex-col items-center">
      <div class="flex items-center justify-center mb-4">
        <!-- Équipe A -->
        <div class="flex flex-col items-center mr-4">
          <h2 class="text-xl font-bold flex items-center">
            {{ match.teamA.teamName }}
            <font-awesome-icon
              v-if="teamAResult === 'winner'"
              icon="trophy"
              class="text-green-500 ml-2"
            />
            <font-awesome-icon
              v-if="teamAResult === 'loser'"
              icon="trophy"
              class="text-red-500 ml-2"
            />
          </h2>
          <div class="player-list max-h-40 overflow-y-auto mt-2">
            <ul>
              <li v-for="player in teamAPlayers" :key="player.id">
                <font-awesome-icon icon="user" class="mr-2" />
                {{ player.name }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Score et chronomètre -->
        <div class="flex flex-col items-center mx-8">
          <div class="flex items-center">
            <!-- Pour les assistants/admins : inputs modifiables -->
            <div v-if="isAuthorized && match.status === 'in_progress'">
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
          <!-- Centrer le timer pour tous les utilisateurs -->
          <div class="mt-2 text-lg font-semibold text-center">
            {{ formattedTime }}
          </div>
          <!-- Boutons de contrôle du timer -->
          <div
            class="mt-2"
            v-if="isAuthorized && match.status === 'in_progress'"
          >
            <button
              v-if="!timerRunning && !isPaused"
              @click="startTimer"
              class="px-4 py-2 bg-green-500 text-white rounded"
            >
              Démarrer
            </button>
            <button
              v-else-if="timerRunning && !isPaused"
              @click="pauseTimer"
              class="px-4 py-2 bg-yellow-500 text-white rounded"
            >
              Pause
            </button>
            <button
              v-else-if="isPaused"
              @click="startTimer"
              class="px-4 py-2 bg-green-500 text-white rounded"
            >
              Reprendre
            </button>
            <!-- Bouton Reset -->
            <button
              @click="openResetConfirmation"
              class="px-4 py-2 bg-red-500 text-white rounded ml-2"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        <!-- Équipe B -->
        <div class="flex flex-col items-center ml-4">
          <h2 class="text-xl font-bold flex items-center">
            {{ match.teamB.teamName }}
            <font-awesome-icon
              v-if="teamBResult === 'winner'"
              icon="trophy"
              class="text-green-500 ml-2"
            />
            <font-awesome-icon
              v-if="teamBResult === 'loser'"
              icon="trophy"
              class="text-red-500 ml-2"
            />
          </h2>
          <div class="player-list max-h-40 overflow-y-auto mt-2">
            <ul>
              <li v-for="player in teamBPlayers" :key="player.id">
                <font-awesome-icon icon="user" class="mr-2" />

                {{ player.name }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Indication de Match Nul -->
      <div v-if="isDraw" class="mt-4 text-lg font-semibold text-gray-700">
        Match Nul
      </div>

      <!-- Événements du match (pour les arbitres et admins) -->
      <div
        v-if="isAuthorized && match.status === 'in_progress'"
        class="flex flex-wrap justify-center mt-4 gap-4"
      >
        <!-- Boutons d'événements -->
        <ButtonComponent
          @click="openEventModal('goal')"
          variant="primary"
          fontAwesomeIcon="futbol"
        >
          Score
        </ButtonComponent>
        <ButtonComponent
          @click="openEventModal('foul')"
          variant="info"
          fontAwesomeIcon="exclamation-circle"
        >
          Faute
        </ButtonComponent>
        <ButtonComponent
          @click="openEventModal('yellow_card')"
          variant="warning"
          fontAwesomeIcon="square"
        >
          Carton Jaune
        </ButtonComponent>
        <ButtonComponent
          @click="openEventModal('red_card')"
          variant="danger"
          fontAwesomeIcon="flag"
        >
          Carton Rouge
        </ButtonComponent>
      </div>

      <!-- Timeline des événements -->
      <div class="relative w-full max-w-2xl mx-auto mt-8">
        <div class="max-h-96 overflow-y-auto">
          <ul class="timeline w-full mx-auto relative">
            <li
              v-for="event in sortedGameEvents"
              :key="event.id"
              class="relative mb-6 flex items-center"
            >
              <!-- Icône pour chaque événement -->
              <div
                class="absolute left-1/2 transform -translate-x-1/2"
                style="top: 0"
              >
                <div
                  :class="{
                    'bg-yellow-500 dark:bg-yellow-600':
                      event.type === 'yellow_card',
                    'bg-red-500 dark:bg-yellow-700': event.type === 'red_card',
                    'bg-green-600 dark:bg-green-700': event.type === 'goal',
                    'bg-blue-500 dark:bg-blue-600': event.type === 'foul',
                  }"
                  class="rounded-full w-10 h-10 flex items-center justify-center text-white text-lg shadow-md"
                >
                  <font-awesome-icon :icon="getEventIcon(event.type)" />
                </div>
              </div>

              <!-- Box contenant les détails de l'événement -->
              <div
                :class="getEventPositionClass(event)"
                class="timeline-box bg-gray-100 dark:bg-gray-800 p-2 rounded-lg shadow-md w-64"
              >
                <p class="font-semibold">{{ getEventDescription(event) }}</p>
                <p
                  v-if="event.description"
                  class="text-sm text-gray-700 dark:text-gray-400"
                >
                  {{ event.description }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ formatEventTime(event.createdAt) }}
                  <span v-if="event.matchTime !== undefined">
                    - {{ formatElapsedTime(event.matchTime) }}
                  </span>
                </p>
                <!-- Bouton de suppression -->
                <button
                  v-if="isAuthorized && match.status === 'in_progress'"
                  @click="deleteEvent(event.id)"
                  class="mt-2 text-red-500 hover:text-red-700"
                >
                  <font-awesome-icon icon="trash" />
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <!-- Confirmation de réinitialisation -->
      <DeleteConfirmationModal
        :isVisible="showResetConfirmation"
        title="Confirmer la Réinitialisation"
        message="Êtes-vous sûr de vouloir réinitialiser les scores et les événements de ce match ? Cette action est irréversible."
        @form-cancel="closeResetConfirmation"
        @confirm="handleResetConfirm"
      />
    </div>

    <!-- Modal pour ajouter un événement -->
    <ModalComponent
      :isVisible="showEventModal"
      :title="getEventTitle(eventType)"
      @close="closeEventModal"
    >
      <template #content>
        <FormComponent
          v-model="eventFormData"
          :fields="eventFormFields"
          @form-submit="submitEvent"
          @form-cancel="closeEventModal"
          :isEditable="true"
        />
      </template>
    </ModalComponent>
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import { getSocket } from '@/services/socketService';
  import ModalComponent from '@/components/ModalComponent.vue';
  import FormComponent from '@/components/FormComponent.vue';
  import StatusSelectorComponent from '@/components/StatusSelectorComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      ModalComponent,
      FormComponent,
      StatusSelectorComponent,
      ButtonComponent,
      DeleteConfirmationModal,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
        match: null,
        scoreTeamA: 0,
        scoreTeamB: 0,
        timer: null,
        timerRunning: false,
        elapsedTime: 0,
        totalPausedTime: 0,
        pausedAt: null,
        isPaused: false,
        teamAPlayers: [],
        teamBPlayers: [],
        gameEvents: [],
        showEventModal: false,
        eventType: '',
        eventFormData: {
          teamId: null,
          description: '',
        },
        socketError: null,
        gameStatusOptions: [
          { value: 'scheduled', label: 'Prévu' },
          { value: 'in_progress', label: 'En cours' },
          { value: 'completed', label: 'Terminé' },
        ],
        spectatorCount: 0,
        assistantName: '',
        showResetConfirmation: false,
      };
    },
    computed: {
      eventFormFields() {
        if (!this.match) return [];
        return [
          {
            name: 'teamId',
            label: 'Équipe',
            type: 'select',
            options: [
              {
                value: this.match.teamA.id,
                label: this.match.teamA.teamName,
              },
              {
                value: this.match.teamB.id,
                label: this.match.teamB.teamName,
              },
            ],
            required: true,
          },
          {
            name: 'description',
            label: 'Description',
            type: 'text',
            required: false,
          },
        ];
      },
      isAdmin() {
        return this.$store.state.user.roleId === 1;
      },
      isAuthorized() {
        const isAssistant = this.$store.getters['userTourney/isAssistant'];
        const isAdmin = this.$store.state.user?.roleId === 1;
        return isAssistant || isAdmin;
      },
      sortedGameEvents() {
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
      teamAResult() {
        if (this.match.status !== 'completed') return null;
        if (this.scoreTeamA > this.scoreTeamB) return 'winner';
        if (this.scoreTeamA < this.scoreTeamB) return 'loser';
        return 'draw';
      },
      teamBResult() {
        if (this.match.status !== 'completed') return null;
        if (this.scoreTeamB > this.scoreTeamA) return 'winner';
        if (this.scoreTeamB < this.scoreTeamA) return 'loser';
        return 'draw';
      },
      isDraw() {
        return (
          this.match.status === 'completed' &&
          this.scoreTeamA === this.scoreTeamB
        );
      },
    },
    methods: {
      /**
       * Récupère les détails du match depuis l'API et initialise le timer et les sockets.
       * @returns {Promise<void>}
       */
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

          // Définir le nom de l'assistant
          this.assistantName = this.match.assistant
            ? this.match.assistant.name
            : 'N/A';

          // Initialiser le timer
          if (this.match.realStartTime) {
            this.timerRunning = !this.match.isPaused && !this.match.realEndTime;
            this.totalPausedTime =
              parseInt(this.match.totalPausedTime, 10) || 0;
            this.pausedAt = this.match.pausedAt
              ? new Date(this.match.pausedAt)
              : null;
            this.isPaused = this.match.isPaused;

            this.calculateElapsedTime();

            if (this.timerRunning && !this.timer) {
              this.timer = setInterval(() => {
                this.calculateElapsedTime();
              }, 1000);
            }
          }

          // Récupérer les événements du match
          await this.fetchGameEvents();

          // Configurer les sockets
          this.setupSocket();
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du match :',
            error
          );
        }
      },

      /**
       * Récupère les événements du match depuis l'API.
       * @returns {Promise<void>}
       */
      async fetchGameEvents() {
        try {
          const { tourneyId, gameId } = this.$route.params;
          const eventsResponse = await apiService.get(
            `/tourneys/${tourneyId}/games/${gameId}/events`
          );
          this.gameEvents = eventsResponse.data;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des événements du match :',
            error
          );
        }
      },

      /**
       * Calcule le temps écoulé du match en tenant compte des pauses.
       */
      calculateElapsedTime() {
        if (!this.match.realStartTime) {
          this.elapsedTime = 0;
          return;
        }

        let currentTime = new Date();
        if (this.isPaused && this.pausedAt) {
          currentTime = this.pausedAt;
        } else if (this.match.realEndTime) {
          currentTime = new Date(this.match.realEndTime);
        }

        const realStart = new Date(this.match.realStartTime);
        const totalPaused = parseInt(this.totalPausedTime, 10) || 0;

        const elapsedMilliseconds = currentTime - realStart - totalPaused;

        if (isNaN(elapsedMilliseconds)) {
          this.elapsedTime = 0;
          console.error(
            'Calcul du temps écoulé a échoué : elapsedMilliseconds est NaN'
          );
        } else {
          this.elapsedTime = Math.floor(elapsedMilliseconds / 1000);
        }
      },

      /**
       * Démarre ou reprend le timer du match.
       */
      startTimer() {
        if (!this.isAuthorized) return;

        const socket = getSocket();

        if (!this.match.realStartTime) {
          // Démarrage initial du match
          socket.emit('startMatchTimer', {
            matchId: this.match.id,
          });
        } else if (this.isPaused) {
          // Reprise après une pause
          socket.emit('startMatchTimer', {
            matchId: this.match.id,
          });
        }
      },

      /**
       * Met en pause le timer du match.
       */
      pauseTimer() {
        if (!this.isAuthorized) return;
        if (!this.timerRunning) return;

        const socket = getSocket();
        socket.emit('pauseMatchTimer', {
          matchId: this.match.id,
        });
      },

      /**
       * Réinitialise le timer du match.
       */
      resetTimer() {
        if (!this.isAuthorized) return;

        const socket = getSocket();
        socket.emit('resetMatchTimer', {
          matchId: this.match.id,
        });
      },

      /**
       * Arrête le timer du match (par exemple, lorsque le match est terminé).
       */
      stopTimer() {
        if (!this.timer) return;

        const socket = getSocket();
        socket.emit('stopMatchTimer', {
          matchId: this.match.id,
        });
      },

      /**
       * Met à jour le statut du match et arrête le timer si nécessaire.
       */
      updateMatchStatus() {
        const socket = getSocket();
        socket.emit('updateMatchStatus', {
          matchId: this.match.id,
          status: this.match.status,
        });

        // Si le statut est 'completed' ou 'scheduled', arrêter le timer
        if (
          this.match.status === 'completed' ||
          this.match.status === 'scheduled'
        ) {
          this.stopTimer();
        }
      },

      // Go back to planning
      goBack() {
        this.$router.push(`/tourneys/${this.tourneyId}/planning`);
      },

      /**
       * Configure les écouteurs Socket.IO pour les mises à jour en temps réel.
       */
      setupSocket() {
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

        // Écouter le démarrage ou la reprise du timer
        socket.on('startMatchTimer', (data) => {
          if (data.matchId === this.match.id) {
            if (!this.match.realStartTime) {
              this.match.realStartTime = new Date(data.realStartTime);
            }
            this.totalPausedTime = parseInt(data.totalPausedTime, 10) || 0;
            this.pausedAt = data.pausedAt ? new Date(data.pausedAt) : null;
            this.isPaused = data.isPaused;
            this.timerRunning = true;

            // Mettre à jour le nom de l'assistant
            this.assistantName = data.assistant ? data.assistant : 'N/A';
            if (!this.timer) {
              this.timer = setInterval(() => {
                this.calculateElapsedTime();
              }, 1000);
            }
          }
        });

        // Écouter la mise en pause du timer
        socket.on('pauseMatchTimer', (data) => {
          if (data.matchId === this.match.id) {
            clearInterval(this.timer);
            this.timer = null;
            this.pausedAt = data.pausedAt ? new Date(data.pausedAt) : null;
            this.isPaused = data.isPaused;
            this.timerRunning = false;
            this.calculateElapsedTime();

            // Mettre à jour le nom de l'assistant
            this.assistantName = data.assistant ? data.assistant : 'N/A';
          }
        });

        // Écouter l'arrêt du timer
        socket.on('stopMatchTimer', (data) => {
          if (data.matchId === this.match.id) {
            clearInterval(this.timer);
            this.timer = null;
            this.match.realEndTime = new Date(data.realEndTime);
            this.isPaused = data.isPaused;
            this.timerRunning = false;
            this.calculateElapsedTime();

            // Mettre à jour le nom de l'assistant
            this.assistantName = data.assistant ? data.assistant : 'N/A';
          }
        });

        // Écouter la réinitialisation du timer
        socket.on('resetMatchTimer', (data) => {
          if (data.matchId === this.match.id) {
            this.timerRunning = false;
            this.elapsedTime = 0;
            this.match.realStartTime = null;
            this.match.realEndTime = null;
            this.totalPausedTime = 0;
            this.pausedAt = null;
            this.isPaused = false;
            this.assistantName = data.assistant ? data.assistant : 'N/A';

            if (this.timer) {
              clearInterval(this.timer);
              this.timer = null;
            }
          }
        });

        // Écouter les mises à jour du statut du match
        socket.on('matchStatusUpdated', (data) => {
          if (data.matchId === this.match.id) {
            this.match.status = data.status;
            if (data.status === 'completed' || data.status === 'scheduled') {
              this.stopTimer();
            }
          }
        });

        // Écouter la suppression d'un événement
        socket.on('deleteGameEvent', (data) => {
          this.gameEvents = this.gameEvents.filter(
            (event) => event.id !== data.eventId
          );
        });

        // Écouter le spectatorCount
        socket.on('spectatorCount', (data) => {
          this.spectatorCount = data.count;
        });

        // Ecouter la suppression de tous les events du match
        socket.on('deleteAllGameEvents', (data) => {
          if (data.gameId === this.match.id) {
            this.gameEvents = [];
            this.scoreTeamA = 0;
            this.scoreTeamB = 0;
          }
        });
      },

      /**
       * Soumet un nouvel événement de match.
       */
      submitEvent() {
        const { tourneyId } = this.$route.params;
        const event = {
          type: this.eventType,
          teamId: this.eventFormData.teamId,
          description: this.eventFormData.description,
          matchTime: this.elapsedTime,
        };
        // Envoyer l'événement via Socket.IO
        const socket = getSocket();
        socket.emit('gameEvent', {
          tourneyId: parseInt(tourneyId),
          gameId: this.match.id,
          event,
        });
        // Fermer la modal
        this.closeEventModal();
      },

      /**
       * Obtient le titre pour la modal d'événement en fonction du type d'événement.
       * @param {string} eventType - Le type d'événement.
       * @returns {string} - Le titre de la modal.
       */
      getEventTitle(eventType) {
        switch (eventType) {
          case 'goal':
            return 'Ajouter un But';
          case 'foul':
            return 'Ajouter une Faute';
          case 'yellow_card':
            return 'Ajouter un Carton Jaune';
          case 'red_card':
            return 'Ajouter un Carton Rouge';
          default:
            return 'Ajouter un Événement';
        }
      },
      /**
       * Ouvre la modal pour ajouter un nouvel événement.
       * @param {string} eventType - Le type d'événement à ajouter.
       */
      openEventModal(eventType) {
        this.eventType = eventType;
        this.eventFormData = {
          teamId: this.match.teamA.id,
          description: '',
        };
        this.showEventModal = true;
      },

      /**
       * Ferme la modal d'ajout d'événement.
       */
      closeEventModal() {
        this.eventFormData = {
          teamId: null,
          description: '',
        };
        this.showEventModal = false;
      },

      /**
       * Met à jour les scores et notifie les autres clients.
       */
      updateScores() {
        if (!this.isAuthorized) return;
        const { tourneyId } = this.$route.params;
        const socket = getSocket();
        socket.emit('updateScore', {
          tourneyId: parseInt(tourneyId),
          gameId: this.match.id,
          scoreTeamA: this.scoreTeamA,
          scoreTeamB: this.scoreTeamB,
        });
      },

      /**
       * Supprime un événement de match.
       * @param {number} eventId - L'ID de l'événement à supprimer.
       */
      async deleteEvent(eventId) {
        try {
          const { tourneyId, gameId } = this.$route.params;
          // Envoyer la requête pour supprimer l'événement
          await apiService.delete(
            `/tourneys/${tourneyId}/games/${gameId}/events/${eventId}`
          );
          // Supprimer l'événement localement
          this.gameEvents = this.gameEvents.filter(
            (event) => event.id !== eventId
          );
          // Informer les autres clients via Socket.IO
          const socket = getSocket();
          socket.emit('deleteGameEvent', {
            tourneyId: parseInt(tourneyId),
            gameId: this.match.id,
            eventId,
          });
        } catch (error) {
          console.error(
            "Erreur lors de la suppression de l'événement :",
            error
          );
        }
      },

      /**
       * Obtient la classe CSS pour positionner l'événement dans la timeline.
       * @param {Object} event - L'objet événement.
       * @returns {string} - La classe CSS.
       */
      getEventPositionClass(event) {
        if (event.teamId === this.match.teamA.id) {
          return 'mr-auto text-right pr-10';
        } else if (event.teamId === this.match.teamB.id) {
          return 'ml-auto text-left pl-10';
        } else {
          return 'mx-auto text-center';
        }
      },

      /**
       * Obtient l'icône de l'événement en fonction de son type.
       * @param {string} eventType - Le type d'événement.
       * @returns {Array} - L'icône FontAwesome.
       */
      getEventIcon(eventType) {
        switch (eventType) {
          case 'goal':
            return ['fas', 'futbol'];
          case 'foul':
            return ['fas', 'exclamation-circle'];
          case 'yellow_card':
            return ['fas', 'square'];
          case 'red_card':
            return ['fas', 'flag'];
          default:
            return ['fas', 'question-circle'];
        }
      },

      /**
       * Obtient la description de l'événement pour l'affichage.
       * @param {Object} event - L'objet événement.
       * @returns {string} - La description de l'événement.
       */
      getEventDescription(event) {
        let teamName = 'Inconnu';
        if (event.teamId === this.match.teamA.id) {
          teamName = this.match.teamA.teamName;
        } else if (event.teamId === this.match.teamB.id) {
          teamName = this.match.teamB.teamName;
        }
        switch (event.type) {
          case 'goal':
            return `${teamName} - Score marqué`;
          case 'foul':
            return `${teamName} - Faute commise`;
          case 'yellow_card':
            return `${teamName} - Carton Jaune`;
          case 'red_card':
            return `${teamName} - Carton Rouge`;
          default:
            return `${teamName} - Événement`;
        }
      },

      /**
       * Formate un timestamp en HH:MM:SS.
       * @param {string|number} timestamp - Le timestamp à formater.
       * @returns {string} - L'heure formatée.
       */
      formatEventTime(timestamp) {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      },

      /**
       * Formate le temps du match en HH:MM.
       * @param {string|number} timestamp - Le timestamp à formater.
       * @returns {string} - L'heure formatée.
       */
      formatTime(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      },

      /**
       * Formate le temps écoulé en MM:SS.
       * @param {number} seconds - Le temps écoulé en secondes.
       * @returns {string} - Le temps écoulé formaté.
       */
      formatElapsedTime(seconds) {
        const minutes = Math.floor(seconds / 60).toString();
        const secs = (seconds % 60).toString().padStart(2, '0');
        if (minutes === '0') {
          return `${secs}''`;
        }
        return `${minutes}'${secs}''`;
      },

      /**
       * Obtient le libellé du statut du match.
       * @param {string} status - Le code du statut.
       * @returns {string} - Le libellé du statut.
       */
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

      /**
       * Gère le changement de statut du match.
       * @param {string} newStatus - Le nouveau statut.
       */
      onMatchStatusChange(newStatus) {
        this.match.status = newStatus;
        this.updateMatchStatus();
      },
      /**
       * Ouvre la modale de confirmation de réinitialisation.
       */
      openResetConfirmation() {
        this.showResetConfirmation = true;
      },

      /**
       * Ferme la modale de confirmation de réinitialisation.
       */
      closeResetConfirmation() {
        this.showResetConfirmation = false;
      },

      /**
       * Gère la confirmation de la réinitialisation.
       * Réinitialise les scores et les événements du match.
       */
      handleResetConfirm() {
        this.showResetConfirmation = false;
        this.resetMatch();
      },

      /**
       * Réinitialise les scores et les événements du match.
       */
      async resetMatch() {
        if (!this.isAuthorized) return;

        const socket = getSocket();

        try {
          // Réinitialiser les scores via Socket.IO
          socket.emit('resetMatchTimer', {
            matchId: this.match.id,
          });

          // Supprimer tous les événements du match via API
          await this.deleteAllEvents();
        } catch (error) {
          console.error('Erreur lors de la réinitialisation du match :', error);
          toast.error('Erreur lors de la réinitialisation du match.');
        }
      },

      /**
       * Supprime tous les événements du match via l'API.
       */
      async deleteAllEvents() {
        try {
          const { tourneyId, gameId } = this.$route.params;

          // Récupérer tous les événements du match
          const eventsResponse = await apiService.get(
            `/tourneys/${tourneyId}/games/${gameId}/events`
          );
          const events = eventsResponse.data;

          // Supprimer chaque événement
          const deletePromises = events.map((event) =>
            apiService.delete(
              `/tourneys/${tourneyId}/games/${gameId}/events/${event.id}`
            )
          );

          await Promise.all(deletePromises);

          // Informer les autres clients via Socket.IO
          const socket = getSocket();
          socket.emit('deleteAllGameEvents', {
            tourneyId: parseInt(tourneyId),
            gameId: this.match.id,
          });

          // Mettre à jour localement
          this.gameEvents = [];

          toast.success('Le match a été réinitialisé avec succès !');
        } catch (error) {
          console.error('Erreur lors de la réinitialisation du match :', error);
          toast.error('Erreur lors de la réinitialisation du match.');
        }
      },
    },
    beforeUnmount() {
      const socket = getSocket();
      if (socket) {
        socket.emit('leaveGame', this.match.id);
        socket.off('scoreUpdated');
        socket.off('gameEvent');
        socket.off('startMatchTimer');
        socket.off('pauseMatchTimer');
        socket.off('resetMatchTimer');
        socket.off('stopMatchTimer');
        socket.off('deleteGameEvent');
        socket.off('matchStatusUpdated');
        socket.off('deleteAllGameEvents');
      }
      if (this.timer) {
        clearInterval(this.timer);
      }
    },
    async mounted() {
      await this.fetchMatchDetails();
    },
  };
</script>

<style scoped>
  .timeline {
    position: relative;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .timeline::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    background-color: #6c6c6c;
    transform: translateX(-50%);
  }

  .mr-auto.text-right.pr-10::after {
    right: -20px;
    border-left-color: #edf2f7; /* Couleur du box */
  }

  .ml-auto.text-left.pl-10::after {
    left: -20px;
    border-right-color: #edf2f7; /* Couleur du box */
  }

  .mx-auto.text-center::after {
    left: -10px;
    border-left-color: transparent;
    border-right-color: transparent;
  }

  li {
    display: flex;
    justify-content: center;
  }
</style>
