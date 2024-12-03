<!-- src/views/user/tourneys/TourneyGameDetails.vue -->
<template>
  <div v-if="socketError" class="alert alert-warning">
    {{ socketError }}
  </div>
  <div v-if="match" class="p-6">
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
              v-if="!timerRunning && !timerPaused"
              @click="startTimer"
              class="px-4 py-2 bg-green-500 text-white rounded"
            >
              Démarrer
            </button>
            <button
              v-else-if="timerRunning && !timerPaused"
              @click="pauseTimer"
              class="px-4 py-2 bg-yellow-500 text-white rounded"
            >
              Pause
            </button>
            <button
              v-else-if="timerPaused"
              @click="startTimer"
              class="px-4 py-2 bg-green-500 text-white rounded"
            >
              Reprendre
            </button>
            <!-- Bouton Reset -->
            <button
              @click="resetTimer"
              class="px-4 py-2 bg-red-500 text-white rounded ml-2"
            >
              Réinitialiser
            </button>
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
      <div
        v-if="isAuthorized && match.status === 'in_progress'"
        class="flex flex-wrap justify-center mt-4 gap-4"
      >
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
      <div class="relative w-full max-w-4xl mx-auto mt-8">
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
                    'bg-yellow-500': event.type === 'yellow_card',
                    'bg-red-500': event.type === 'red_card',
                    'bg-green-500': event.type === 'goal',
                    'bg-blue-500': event.type === 'foul',
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
                <p v-if="event.description" class="text-sm text-gray-700">
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

  export default {
    components: {
      ModalComponent,
      FormComponent,
      StatusSelectorComponent,
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
        matchStartTime: null,
        pausedAt: null, // Pour stocker l'heure à laquelle le timer a été mis en pause
        teamAPlayers: [],
        teamBPlayers: [],
        gameEvents: [],
        showEventModal: false,
        eventType: '',
        eventTeamId: null,
        eventDescription: '',
        socketError: null,
        eventFormData: {
          teamId: null,
          description: '',
        },
        gameStatusOptions: [
          { value: 'scheduled', label: 'Prévu' },
          { value: 'in_progress', label: 'En cours' },
          { value: 'completed', label: 'Terminé' },
        ],
      };
    },
    computed: {
      eventFormFields() {
        if (!this.match) return []; // Assurez-vous que match est chargé
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

          // Récupérer l'heure de début du match
          if (this.match.realStartTime) {
            this.matchStartTime = new Date(this.match.startTime);
            this.timerRunning = true;
            this.elapsedTime = Math.floor(
              (Date.now() - this.matchStartTime.getTime()) / 1000
            );
            if (!this.timer) {
              this.timer = setInterval(() => {
                this.elapsedTime++;
              }, 1000);
            }
          }

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

          // Écouter le démarrage du timer
          socket.on('startMatchTimer', (data) => {
            if (data.matchId === this.match.id) {
              this.matchStartTime = new Date(data.startTime);
              this.timerRunning = true;
              this.elapsedTime = Math.floor(
                (Date.now() - this.matchStartTime.getTime()) / 1000
              );
              if (!this.timer) {
                this.timer = setInterval(() => {
                  this.elapsedTime++;
                }, 1000);
              }
            }
          });

          // Écouter la suppression d'un événement
          socket.on('deleteGameEvent', (data) => {
            this.gameEvents = this.gameEvents.filter(
              (event) => event.id !== data.eventId
            );
          });

          // Récupérer les événements du match
          const eventsResponse = await apiService.get(
            `/tourneys/${tourneyId}/games/${gameId}/events`
          );
          this.gameEvents = eventsResponse.data;

          // Si le match a démarré et que realStartTime existe, initialiser le timer
          if (this.match.realStartTime) {
            this.matchStartTime = new Date(this.match.realStartTime);
            this.elapsedTime = Math.floor(
              (Date.now() - this.matchStartTime.getTime()) / 1000
            );
            this.timerRunning = true;
            if (!this.timer) {
              this.timer = setInterval(() => {
                this.elapsedTime++;
              }, 1000);
            }
          }
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du match :',
            error
          );
        }
      },
      getEventPositionClass(event) {
        if (event.teamId === this.match.teamA.id) {
          return 'mr-auto text-right pr-10';
        } else if (event.teamId === this.match.teamB.id) {
          return 'ml-auto text-left pl-10';
        } else {
          return 'mx-auto text-center';
        }
      },
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
      onMatchStatusChange(newStatus) {
        this.match.status = newStatus;
        this.updateMatchStatus();
      },
      startTimer() {
        if (!this.isAuthorized) return;

        const socket = getSocket();

        if (this.timerPaused) {
          // Reprendre le timer
          this.timerPaused = false;
          this.matchStartTime = new Date(
            this.matchStartTime.getTime() + (Date.now() - this.pausedAt)
          );
          // Envoyer l'événement de reprise du timer
          socket.emit('resumeMatchTimer', {
            matchId: this.match.id,
            startTime: this.matchStartTime,
          });
        } else {
          if (this.timerRunning) return; // Empêcher de démarrer le timer s'il tourne déjà
          // Démarrer le timer
          this.timerRunning = true;
          this.matchStartTime = new Date();
          this.elapsedTime = 0;
          // Envoyer l'heure de début réelle du match aux autres clients
          socket.emit('startMatchTimer', {
            matchId: this.match.id,
            startTime: this.matchStartTime,
          });
        }

        if (!this.timer) {
          this.timer = setInterval(() => {
            this.elapsedTime = Math.floor(
              (Date.now() - this.matchStartTime.getTime()) / 1000
            );
          }, 1000);
        }
      },

      pauseTimer() {
        if (!this.isAuthorized) return;
        if (!this.timerRunning || this.timerPaused) return;

        clearInterval(this.timer);
        this.timer = null;
        this.timerRunning = false; // Ajouter cette ligne
        this.timerPaused = true;
        this.pausedAt = Date.now(); // Enregistrer l'heure à laquelle le timer a été mis en pause

        // Envoyer l'événement de pause du timer aux autres clients
        const socket = getSocket();
        socket.emit('pauseMatchTimer', {
          matchId: this.match.id,
        });
      },

      resetTimer() {
        if (!this.isAuthorized) return;

        // Réinitialiser les états du timer
        this.timerRunning = false;
        this.timerPaused = false;
        this.elapsedTime = 0;
        this.matchStartTime = null;
        this.pausedAt = null;

        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }

        // Envoyer l'événement de réinitialisation du timer aux autres clients
        const socket = getSocket();
        socket.emit('resetMatchTimer', {
          matchId: this.match.id,
        });
      },

      stopTimer() {
        if (!this.isAuthorized) return;

        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
          this.timerRunning = false;
          this.timerPaused = false;
          this.pausedAt = null;
        }
      },
      formatElapsedTime(seconds) {
        const minutes = Math.floor(seconds / 60).toString();
        const secs = (seconds % 60).toString().padStart(2, '0');
        if (minutes === '0') {
          return `${secs}''`;
        }
        return `${minutes}'${secs}''`;
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
        this.eventFormData = {
          teamId: this.match.teamA.id, // Sélectionne par défaut l'équipe A
          description: '',
        };
        this.showEventModal = true;
      },
      closeEventModal() {
        this.eventFormData = {
          teamId: null,
          description: '',
        };
        this.showEventModal = false;
      },

      resetTimerLocal() {
        this.timerRunning = false;
        this.timerPaused = false;
        this.elapsedTime = 0;
        this.matchStartTime = null;
        this.pausedAt = null;

        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      },
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

      setupSocket() {
        const socket = getSocket();
        if (!socket) {
          return;
        }
        // Gérer le timer
        socket.on('pauseMatchTimer', (data) => {
          if (data.matchId === this.match.id) {
            if (this.timer) {
              clearInterval(this.timer);
              this.timer = null;
            }
            this.timerPaused = true;
            this.timerRunning = false; // Ajouter cette ligne
            this.pausedAt = Date.now();
          }
        });

        socket.on('resumeMatchTimer', (data) => {
          if (data.matchId === this.match.id) {
            this.timerPaused = false;
            this.timerRunning = true; // Ajouter cette ligne
            this.matchStartTime = new Date(data.startTime);
            this.elapsedTime = Math.floor(
              (Date.now() - this.matchStartTime.getTime()) / 1000
            );

            if (!this.timer) {
              this.timer = setInterval(() => {
                this.elapsedTime = Math.floor(
                  (Date.now() - this.matchStartTime.getTime()) / 1000
                );
              }, 1000);
            }
          }
        });

        socket.on('resetMatchTimer', (data) => {
          if (data.matchId === this.match.id) {
            this.resetTimerLocal();
          }
        });
        socket.on('matchStatusUpdated', (data) => {
          if (data.matchId === this.match.id) {
            this.match.status = data.status;
            // Si le statut est 'completed' ou 'scheduled', arrêter le timer
            if (data.status === 'completed' || data.status === 'scheduled') {
              this.stopTimer();
            }
          }
        });
      },
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

      /*submitEvent() {
        const { tourneyId } = this.$route.params;
        const event = {
          type: this.eventType,
          teamId: this.eventTeamId,
          description: this.eventDescription,
          matchTime: this.elapsedTime,
        };
        // Envoyer l'événement via Socket.IO
        const socket = getSocket();
        socket.emit('gameEvent', {
          tourneyId: parseInt(tourneyId),
          gameId: this.match.id,
          event,
        });
        // Ajouter l'événement localement
        this.closeEventModal();
      },*/
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
      getEventDescription(event) {
        let teamName = 'Inconnu';
        if (event.teamId === this.match.teamA.id) {
          teamName = this.match.teamA.teamName;
        } else if (event.teamId === this.match.teamB.id) {
          teamName = this.match.teamB.teamName;
        }
        switch (event.type) {
          case 'goal':
            return `${teamName} - But marqué`;
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
      formatEventTime(timestamp) {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      },
      formatTime(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
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
        socket.off('resumeMatchTimer');
        socket.off('resetMatchTimer');
        socket.off('deleteGameEvent');
        socket.off('matchStatusUpdated');
      }
      if (this.timer) {
        clearInterval(this.timer);
      }
    },
    async mounted() {
      await this.fetchMatchDetails();
      this.setupSocket();
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

  .mr-auto.text-right.pr-16::after {
    right: -20px;
    border-left-color: #edf2f7; /* Couleur du box */
  }

  .ml-auto.text-left.pl-16::after {
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
