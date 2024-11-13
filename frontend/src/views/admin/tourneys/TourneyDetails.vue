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

    <!-- Guide de configuration du tournoi -->
    <div
      class="bg-light-card dark:bg-dark-card rounded-lg shadow-lg p-8 mt-8 relative"
    >
      <h3
        class="text-2xl font-bold mb-4 text-light-subMenu-activeText dark:text-dark-subMenu-activeText"
      >
        Guide de configuration du tournoi
      </h3>

      <!-- Texte explicatif de base -->
      <div v-if="!showExample">
        <p class="text-base text-light-form-text dark:text-dark-form-text mb-4">
          Suivez ces étapes pour configurer votre tournoi efficacement :
        </p>

        <p class="text-base text-light-form-text dark:text-dark-form-text mb-4">
          Pour configurer efficacement votre tournoi, suivez ces étapes :
        </p>

        <h4
          class="font-semibold text-light-form-text dark:text-dark-form-text mt-4"
        >
          1. Informations à connaître en amont
        </h4>
        <p class="text-base text-light-form-text dark:text-dark-form-text mb-4">
          Avant de commencer, vous pouvez connaître vos terrains disponibles
          et/ou le nombre potentiels d'élèves :
        </p>
        <ul class="list-disc list-inside mb-4">
          <li>
            <strong>Si vous connaissez le nombre d'élèves :</strong> Utilisez ce
            nombre pour déterminer le nombre de terrains nécessaires, en
            fonction de la taille des équipes (par exemple, 3 à 6 joueurs par
            équipe). Un terrain accueille généralement 3-4 équipes pour un
            tournus fluide.
          </li>
          <li>
            <strong>Si vous connaissez le nombre de terrains :</strong> Utilisez
            le nombre de terrains pour estimer la capacité en équipes et la
            structure des pools. Avoir 5 petits terrains avec 4 équipes par
            terrain de 6 joueurs max permet d'accueillir environ 120 personnes
            (5 * 4 * 6).
          </li>
        </ul>

        <h4
          class="font-semibold text-light-form-text dark:text-dark-form-text mt-4"
        >
          2. Organiser les équipes et les terrains
        </h4>
        <p class="text-base text-light-form-text dark:text-dark-form-text mb-4">
          Basé sur le nombre de terrains et d'équipes, suivez ces suggestions :
        </p>
        <ul class="list-disc list-inside mb-4">
          <li>
            Divisez les grands terrains en deux petits terrains si nécessaire.
            Cela permet d’accueillir des équipes de 3 à 6 joueurs, avec deux
            équipes en match et éventuellement une ou deux équipes en repos.
          </li>
          <li>
            <strong>Exemple :</strong> Pour 5 petits terrains, vous pouvez
            organiser 4 équipes par terrain, ce qui donne 5 pools de 4 équipes,
            avec un total de 20 équipes.
          </li>
        </ul>

        <h4
          class="font-semibold text-light-form-text dark:text-dark-form-text mt-4"
        >
          3. Estimer le nombre de participants
        </h4>
        <p class="text-base text-light-form-text dark:text-dark-form-text mb-4">
          Selon la capacité de vos terrains, estimez le nombre maximum de
          joueurs que le tournoi peut accueillir :
        </p>
        <ul class="list-disc list-inside mb-4">
          <li>
            <strong>Nombre de joueurs total :</strong> Multipliez le nombre
            d'équipes par la taille de l'équipe. Par exemple, pour 20 équipes de
            3 à 6 joueurs, le tournoi peut accueillir entre 60 et 120 joueurs.
          </li>
        </ul>

        <h4
          class="font-semibold text-light-form-text dark:text-dark-form-text mt-4"
        >
          4. Ajuster selon les besoins
        </h4>
        <p class="text-base text-light-form-text dark:text-dark-form-text mb-4">
          Si vous avez besoin de plus de participants ou d’un nombre d'équipes
          différent, vous pouvez :
        </p>
        <ul class="list-disc list-inside mb-4">
          <li>Augmenter le nombre de joueurs par équipe.</li>
          <li>
            Augmenter le nombre de terrains (par exemple, diviser un grand
            terrain en deux).
          </li>
        </ul>

        <h4
          class="font-semibold text-light-form-text dark:text-dark-form-text mt-4"
        >
          5. Générer les pools et les matchs
        </h4>
        <p class="text-base text-light-form-text dark:text-dark-form-text mb-4">
          Une fois les équipes et terrains configurés, vous pouvez générer les
          pools. Chaque pool est associé à un terrain, et les équipes y jouent
          en round-robin, c’est-à-dire que toutes les équipes d’un pool se
          rencontrent au moins une fois.
        </p>

        <button
          @click="showExample = true"
          class="text-blue-500 mt-4 flex items-center space-x-2"
        >
          <span>Voir un exemple pratique</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path d="M9 18l6-6-6-6"></path>
          </svg>
        </button>
      </div>

      <!-- Exemple pratique de configuration -->
      <div v-else>
        <h4
          class="font-semibold text-light-form-text dark:text-dark-form-text mt-4"
        >
          Exemple Pratique :
        </h4>
        <p class="text-base text-light-form-text dark:text-dark-form-text mb-4">
          Imaginons que vous avez 6 terrains disponibles :
        </p>
        <ol
          class="list-decimal list-inside mb-4 space-y-2 text-light-form-text dark:text-dark-form-text"
        >
          <li>
            Allez dans l'onglet <strong>Terrains</strong> et créez vos 6
            terrains.
          </li>
          <li>
            Allez dans l'onglet <strong>Assignation</strong> et associez les
            sports aux terrains pour un planning de base.
          </li>
          <li>
            Dans l'onglet <strong>Inscriptions</strong> :
            <ul class="list-disc list-inside ml-6">
              <li>
                Configurez vos équipes via <strong>Config Équipe</strong>. Avec
                6 terrains, vous pouvez créer environ 24 équipes (4 par terrain,
                2 en repos).
              </li>
              <li>
                Définissez la taille des équipes entre 3 à 6 joueurs, soit un
                total max de 24 * 6 = 144 joueurs.
              </li>
              <li>
                Utilisez le groupe assistant pour gérer les inscriptions
                supplémentaires.
              </li>
              <li>
                Générez les équipes manuellement ou automatiquement avec
                <strong>Générer équipes</strong>.
              </li>
              <li>Activez les inscriptions et générez un lien d’invitation.</li>
            </ul>
          </li>
          <li>
            En mode <strong>Custom Round Robin</strong>, créez 6 pools (1 par
            terrain). Configurez chaque pool pour contenir entre 3 et 4 équipes
            pour un roulement fluide.
          </li>
          <li>
            Une fois les pools créés, passez à l’onglet
            <strong>Planning</strong> pour générer le planning des matchs.
          </li>
        </ol>

        <button
          @click="showExample = false"
          class="text-blue-500 mt-4 flex items-center space-x-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
          <span>Retourner au guide</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
  import 'leaflet/dist/leaflet.css';
  import { mapState, mapActions } from 'vuex';
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
        showExample: false, // Affichage de l'exemple pratique
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
      // Mapper les actions du module `tourney`
      ...mapActions('tourney', ['fetchTourneyStatuses', 'setTournamentName']),
      async fetchTourneyDetails() {
        try {
          this.fetchTourneyStatuses(this.tourneyId);
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
    computed: {
      ...mapState('tourney', {
        statuses: (state) => state.statuses,
      }),
    },
  };
</script>

<style scoped>
  .l-map {
    height: 100%;
    width: 100%;
  }

  .dark .leaflet-container {
    filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
  }
</style>
