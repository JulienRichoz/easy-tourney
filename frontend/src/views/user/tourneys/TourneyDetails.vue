<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <SubMenuComponent
      v-if="$route.name !== 'UserTourneyInfos'"
      :tourneyId="tourneyId"
      @selectTab="selectTab"
    />

    <!-- Contenu principal avec deux colonnes -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
      <!-- Détails du tournoi et Statistiques -->
      <div class="bg-light-card dark:bg-dark-card rounded-lg shadow-lg p-8">
        <!-- Nom du tournoi -->
        <div class="flex items-center justify-between mb-4">
          <h2
            class="text-3xl font-bold text-light-subMenu-activeText dark:text-dark-subMenu-activeText"
          >
            {{ tourney.name }}
          </h2>
        </div>

        <!-- Divisée en 2 colonnes pour les informations -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Colonne 1 : Informations principales -->
          <div>
            <p
              class="text-base text-light-form-text dark:text-dark-form-text mb-2"
            >
              <strong>Lieu :</strong> {{ tourney.location }}
            </p>
            <p
              class="text-base text-light-form-text dark:text-dark-form-text mb-2"
            >
              <strong>Date :</strong> {{ formatDate(tourney.dateTourney) }}
            </p>
            <div class="flex flex-wrap gap-4 mb-2">
              <p
                class="text-base text-light-form-text dark:text-dark-form-text"
              >
                <strong>Début :</strong> {{ formatTime(startTime) }}
              </p>
              <p
                class="text-base text-light-form-text dark:text-dark-form-text"
              >
                <strong>Fin :</strong> {{ formatTime(endTime) }}
              </p>
            </div>
            <p
              class="text-base text-light-form-text dark:text-dark-form-text mb-2"
            >
              <strong>Durée d'une partie :</strong> {{ gameDurationText }}
            </p>
          </div>

          <!-- Colonne 2 : Contacts et infos -->
          <div>
            <h3
              class="text-xl font-semibold text-light-form-text dark:text-dark-form-text mb-2"
            >
              Contacts et infos :
            </h3>
            <p
              v-if="tourney.emergencyDetails"
              class="text-base text-light-form-text dark:text-dark-form-text"
              v-html="formatEmergencyDetails(tourney.emergencyDetails)"
            ></p>
            <p
              v-else
              class="text-base text-light-form-text dark:text-dark-form-text italic"
            >
              Aucune information d'urgence disponible.
            </p>
          </div>
        </div>

        <!-- Informations spécifiques au rôle -->
        <div class="mt-6">
          <h3
            class="text-2xl font-semibold mb-2 text-light-form-text dark:text-dark-form-text"
          >
            Mon Rôle
          </h3>
          <template v-if="userTeam.role === 'assistant'">
            <p
              class="text-base text-light-form-text dark:text-dark-form-text mb-2"
            >
              Vous êtes un <strong>Assistant</strong>. Votre mission consiste à
              aider à l'organisation des matchs.
            </p>
            <div class="mt-2">
              <h4
                class="text-xl font-semibold text-light-form-text dark:text-dark-form-text"
              >
                Membres de l'équipe d'assistants :
              </h4>
              <div class="mt-2 max-h-40 overflow-y-auto grid grid-cols-2 gap-4">
                <div
                  v-for="assistant in userTeam.players"
                  :key="assistant.id"
                  class="text-base text-light-form-text dark:text-dark-form-text"
                >
                  {{ assistant.name }}
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="userTeam.role === 'player'">
            <p
              class="text-base text-light-form-text dark:text-dark-form-text mb-2"
            >
              <strong>Nom de l'équipe :</strong> {{ userTeam.teamName }}
            </p>
            <p
              class="text-base text-light-form-text dark:text-dark-form-text mb-2"
            >
              <strong>Nb. Matchs :</strong> {{ userTeam.remainingMatches }}
            </p>
            <div class="mt-2">
              <h4
                class="text-xl font-semibold text-light-form-text dark:text-dark-form-text"
              >
                Membres :
              </h4>
              <div class="mt-2 max-h-40 overflow-y-auto grid grid-cols-2 gap-4">
                <div
                  v-for="player in userTeam.players"
                  :key="player.id"
                  class="text-base text-light-form-text dark:text-dark-form-text"
                >
                  {{ player.name }}
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <p
              class="text-base text-light-form-text dark:text-dark-form-text mb-2"
            >
              Vous n'êtes pas dans une équipe.
            </p>
          </template>
        </div>
      </div>

      <!-- Carte OpenStreetMap -->
      <div
        class="bg-light-card dark:bg-dark-card rounded-lg shadow-lg p-4 sm:h-[50vh] h-[300px] mt-8 md:mt-0 relative"
      >
        <div
          v-if="!coordinatesAreValid"
          class="text-sm text-red-500 mt-2 text-center z-20"
        >
          Les coordonnées ne sont pas valides, la carte affiche un lieu par
          défaut (FR).
        </div>
        <div class="absolute inset-0">
          <l-map
            v-if="mapIsReady"
            ref="map"
            :zoom="12"
            :center="[mapLatitude, mapLongitude]"
            class="h-full w-full"
          >
            <l-tile-layer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              layer-type="base"
              name="OpenStreetMap"
            />
            <l-marker :lat-lng="[mapLatitude, mapLongitude]">
              <l-popup>{{ tourney.location || 'Fribourg, Suisse' }}</l-popup>
            </l-marker>
          </l-map>
          <!-- Bouton itinéraire -->
          <div class="mt-4 flex justify-end relative z-30">
            <ButtonComponent
              :variant="'primary'"
              fontAwesomeIcon="map-marker-alt"
              @click="openGoogleMaps"
            >
              Itinéraire
              <span class="hidden sm:inline"> Avec Google Maps</span>
            </ButtonComponent>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des Sports -->
    <div class="bg-light-card dark:bg-dark-card rounded-lg shadow-lg p-8 mt-8">
      <h3
        class="text-2xl font-semibold mb-2 text-light-form-text dark:text-dark-form-text"
      >
        Sports Joués
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-for="sport in sports" :key="sport.id" class="flex flex-col">
          <div class="flex items-center">
            <span
              class="w-4 h-4 rounded-full mr-2"
              :style="{ backgroundColor: sport.color }"
            ></span>
            <span
              class="text-base font-semibold text-light-form-text dark:text-dark-form-text"
              >{{ sport.name }}</span
            >
          </div>
          <p
            v-if="sport.rules"
            class="text-sm text-light-form-text dark:text-dark-form-text mt-1"
          >
            <strong>Règles: </strong>
            <span v-if="isValidURL(sport.rules)">
              <a
                :href="sport.rules"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-500 underline"
              >
                {{ sport.rules }}
              </a>
            </span>
            <span v-else>
              {{ sport.rules }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import 'leaflet/dist/leaflet.css';
  import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet';
  import apiService from '@/services/apiService';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import SubMenuComponent from '@/components/user/SubMenuComponent.vue';

  export default {
    components: {
      LMap,
      LTileLayer,
      LMarker,
      LPopup,
      SubMenuComponent,
      ButtonComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
        tourney: {},
        sports: [],
        userTeam: {
          teamName: '',
          players: [],
          remainingMatches: 0,
          role: '',
        },
        gameDuration: null,
        startTime: null,
        endTime: null,
        mapIsReady: false,
      };
    },
    computed: {
      coordinatesAreValid() {
        const lat = this.tourney.latitude;
        const lng = this.tourney.longitude;
        return (
          lat !== null &&
          lng !== null &&
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
        );
      },
      mapLatitude() {
        return this.coordinatesAreValid ? this.tourney.latitude : 46.8065;
      },
      mapLongitude() {
        return this.coordinatesAreValid ? this.tourney.longitude : 7.1619;
      },
      googleMapsLink() {
        if (this.coordinatesAreValid) {
          const lat = this.tourney.latitude;
          const lng = this.tourney.longitude;
          return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        } else {
          return 'https://www.google.com/maps/dir/?api=1&destination=46.8065,7.1619';
        }
      },
      gameDurationText() {
        if (this.gameDuration === null || this.gameDuration === undefined) {
          return 'N/A';
        }
        return `${this.gameDuration} minutes`;
      },
    },
    async mounted() {
      await this.fetchTourneyDetails();
      this.mapIsReady = true;
    },
    methods: {
      selectTab(tab) {
        this.activeTab = tab;
      },
      async fetchTourneyDetails() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/details/user-view`
          );
          const data = response.data;
          this.tourney = data.tourney;
          this.sports = data.sports;
          this.userTeam = {
            ...data.userTeam,
            role: data.userTeam.role, // Définir le rôle en guest si non défini (pas d'équipe)
          };
          this.gameDuration = data.gameDuration;
          this.startTime = data.startTime;
          this.endTime = data.endTime;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du tournoi (vue utilisateur) :',
            error
          );
        }
      },
      formatEmergencyDetails(details) {
        return details.replace(/\n/g, '<br>');
      },
      isValidURL(string) {
        try {
          new URL(string);
          return true;
        } catch (_) {
          return false;
        }
      },
      formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
      },
      formatTime(timeString) {
        if (!timeString) return 'N/A'; // Si aucune heure n'est fournie
        const [hours, minutes] = timeString.split(':'); // Séparer l'heure et les minutes
        return `${parseInt(hours, 10)}h${minutes}`; // Retourner le format souhaité
      },
      openGoogleMaps() {
        window.open(this.googleMapsLink, '_blank');
      },
    },
  };
</script>
