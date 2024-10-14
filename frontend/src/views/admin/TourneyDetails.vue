<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu
      :tourneyId="tourneyId"
      :tourneyName="tourney.name"
      @selectTab="selectTab"
    />

    <!-- Contenu principal -->
    <div class="tourney-details-container">
      <div class="tourney-details">
        <!-- Rappel des détails du tournoi -->
        <h2 class="tourney-title">{{ tourney.name }}</h2>
        <p class="tourney-info">
          <strong>Lieu:</strong> {{ tourney.location }}
        </p>
        <p class="tourney-info">
          <strong>Date:</strong> {{ formatDate(tourney.dateTourney) }}
        </p>
        <!-- <p class="tourney-info">
          <strong>Nombre de Terrains:</strong> {{ tourney.numberOfField }}
        </p>-->

        <h3 class="tourney-step-title">Étape actuelle:</h3>
        <p class="tourney-step">Assigner les terrains</p>

        <ol class="tourney-steps">
          <li :class="{ completed: currentStepNumber >= 1 }">
            1. Assigner les terrains
          </li>
          <li :class="{ completed: currentStepNumber >= 2 }">
            2. Gérer les groupes
          </li>
          <li :class="{ completed: currentStepNumber >= 3 }">
            3. Lancer les inscriptions
          </li>
          <li :class="{ completed: currentStepNumber >= 4 }">
            4. Inscriptions validées, gérer le planning
          </li>
        </ol>
      </div>

      <!-- Carte OpenStreetMap -->
      <div class="tourney-map">
        <l-map
          v-if="mapIsReady"
          ref="map"
          :zoom="12"
          :center="[
            tourney.locationLat || 46.8065,
            tourney.locationLng || 7.1619,
          ]"
          style="height: 100%; width: 100%"
        >
          <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            layer-type="base"
            name="OpenStreetMap"
          />
          <l-marker
            :lat-lng="[
              tourney.locationLat || 46.8065,
              tourney.locationLng || 7.1619,
            ]"
          >
            <l-popup>{{ tourney.location || 'Fribourg, Suisse' }}</l-popup>
          </l-marker>
        </l-map>
      </div>
    </div>
  </div>
</template>

<script>
  import 'leaflet/dist/leaflet.css';
  import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet';
  import TourneySubMenu from '@/components/TourneySubMenu.vue';
  import apiService from '@/services/apiService';

  export default {
    components: {
      LMap,
      LTileLayer,
      LMarker,
      LPopup,
      TourneySubMenu,
    },
    data() {
      return {
        tourneyId: this.$route.params.id,
        tourney: {}, // Détails du tournoi récupérés du serveur
        currentStepNumber: 1, // Pour gérer l'étape actuelle en nombre
        mapIsReady: false,
      };
    },
    async mounted() {
      await this.fetchTourneyDetails(); // Récupère les détails du tournoi depuis l'API
      this.mapIsReady = true; // Initialisation de la carte une fois les détails récupérés
    },
    methods: {
      async fetchTourneyDetails() {
        try {
          const response = await apiService.get(`/tourneys/${this.tourneyId}`);
          this.tourney = response.data;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du tournoi:',
            error
          );
        }
      },
      formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
      },
      selectTab(tab) {
        this.activeTab = tab;
      },
    },
  };
</script>

<style scoped>
  body {
    padding: 0;
    margin: 0;
  }

  html,
  body,
  #map {
    height: 100%;
    width: 100vw;
  }

  .tourney-details-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 2rem;
  }

  @media (min-width: 768px) {
    .tourney-details-container {
      flex-direction: row;
      align-items: stretch; /* S'assure que les enfants prennent la même hauteur */
    }
  }

  .tourney-details {
    flex: 1 1 auto;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    padding: 2rem;
  }

  .tourney-title {
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 1rem;
    color: #2f855a;
  }

  .tourney-info {
    font-size: 1rem;
    color: #4a5568;
    margin-bottom: 0.5rem;
  }

  .tourney-step-title {
    margin-top: 1.5rem;
    font-size: 1.4rem;
    font-weight: bold;
  }

  .tourney-steps {
    list-style: none;
    padding-left: 0;
    margin: 1rem 0;
  }

  .tourney-steps li {
    padding: 0.5rem 0;
    font-weight: 500;
    color: #4a5568;
  }

  .tourney-steps li.completed {
    color: #2f855a;
    text-decoration: line-through;
  }

  .tourney-map {
    flex: 1 1 auto;
    min-height: 300px; /* Assure une hauteur minimale */
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    .tourney-map {
      height: 50vh; /* Ajustement de la hauteur pour les mobiles */
      width: 100%;
    }
  }
</style>
