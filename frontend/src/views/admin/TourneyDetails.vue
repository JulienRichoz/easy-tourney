<!-- src/components/TourneyDetailsPage.vue -->
<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" @selectTab="selectTab" />

    <!-- Contenu principal -->
    <div class="grid grid-cols-1 gap-8 p-8 md:grid-cols-2 md:items-start">
      <!-- Détails du tournoi -->
      <div class="bg-light-card dark:bg-dark-card rounded-lg shadow-lg p-8">
        <h2
          class="text-3xl font-bold mb-4 text-light-subMenu-activeText dark:text-dark-subMenu-activeText"
        >
          {{ tourney.name }}
        </h2>
        <p class="text-base text-light-form-text dark:text-dark-form-text mb-2">
          <strong>Lieu:</strong> {{ tourney.location }}
        </p>
        <p class="text-base text-light-form-text dark:text-dark-form-text mb-2">
          <strong>Date:</strong> {{ formatDate(tourney.dateTourney) }}
        </p>

        <h3
          class="mt-6 text-2xl font-bold text-light-form-text dark:text-dark-form-text"
        >
          Étape actuelle:
        </h3>
        <p class="text-base text-light-form-text dark:text-dark-form-text">
          Assigner les terrains
        </p>

        <ol class="list-none pl-0 my-4">
          <li
            v-for="(step, index) in steps"
            :key="index"
            :class="{
              'py-2 font-medium text-light-form-text dark:text-dark-form-text':
                currentStepNumber < index + 1,
              'py-2 font-medium text-green-700 dark:text-green-400 line-through':
                currentStepNumber >= index + 1,
            }"
          >
            {{ step }}
          </li>
        </ol>
      </div>

      <!-- Carte OpenStreetMap -->
      <div
        class="rounded-lg overflow-hidden shadow-lg p-4 sm:h-[50vh] h-[300px]"
      >
        <l-map
          v-if="mapIsReady"
          ref="map"
          :zoom="12"
          :center="[
            tourney.locationLat || 46.8065,
            tourney.locationLng || 7.1619,
          ]"
          class="h-full w-full"
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
        tourneyId: this.$route.params.tourneyId,
        tourney: {}, // Détails du tournoi récupérés du serveur
        currentStepNumber: 1, // Pour gérer l'étape actuelle en nombre
        mapIsReady: false,
        steps: [
          'Assigner les terrains',
          'Gérer les groupes',
          'Lancer les inscriptions',
          'Inscriptions validées, gérer le planning',
        ],
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
          // Optionnel: Définir l'étape actuelle en fonction des données du tournoi
          this.currentStepNumber = this.tourney.currentStep || 1;
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
  /* Minimal CSS, presque tout est géré par Tailwind */

  .l-map {
    height: 100%;
    width: 100%;
  }

  .dark .leaflet-container {
    filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
  }
</style>
