<!-- views/admin/tourneys/TourneyDetails.vue -->
<!-- Page de détails d'un tournoi pour les administrateurs -->

<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" @selectTab="selectTab" />

    <!-- Avancement du Tournoi avec le stepper horizontal -->
    <div
      class="flex items-center gap-y-4 gap-x-2 sm:gap-y-6 sm:gap-x-4 max-w-screen-lg mx-auto px-4 font-sans mt-8 overflow-x-auto flex-nowrap"
    >
      <div v-for="(step, index) in statusSteps" :key="index" class="flex-1">
        <!-- Barre de progression -->
        <div
          :class="[
            'w-full',
            'rounded',
            'h-0.5 sm:h-1', // Hauteur réduite sur petits écrans
            progressBarClass(step.status),
          ]"
        ></div>
        <!-- Informations sur l'étape -->
        <div class="mt-1 sm:mt-2 mr-2 sm:mr-4 flex items-center">
          <!-- Icône de l'étape -->
          <component
            :is="stepIconComponent(step.status)"
            class="shrink-0 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6"
          />
          <div class="ml-1 sm:ml-2">
            <h6
              :class="[
                'text-sm sm:text-lg font-bold',
                stepTextClass(step.status),
              ]"
            >
              {{ step.label }}
            </h6>
            <p :class="['text-xs sm:text-base', stepTextClass(step.status)]">
              {{ stepStatusText(step.status, step.label) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenu principal avec deux colonnes -->
    <div class="grid grid-cols-1 gap-8 p-8 md:grid-cols-2 md:items-start">
      <!-- Détails du tournoi et Statistiques -->
      <div class="bg-light-card dark:bg-dark-card rounded-lg shadow-lg p-8">
        <div class="flex items-center justify-between mb-4">
          <h2
            class="text-3xl font-bold text-light-subMenu-activeText dark:text-dark-subMenu-activeText"
          >
            {{ tourney.name }}
          </h2>
          <StatusSelectorComponent
            :tourneyId="tourneyId"
            statusKey="status"
            :statusOptions="[
              { value: 'draft', label: 'Brouillon' },
              { value: 'ready', label: 'Prêt' },
              { value: 'active', label: 'En cours' },
              { value: 'completed', label: 'Terminé' },
            ]"
            :modelValue="tourney.status"
            @update:modelValue="(val) => (tourney.status = val)"
          />
        </div>
        <p class="text-base text-light-form-text dark:text-dark-form-text mb-2">
          <strong>Lieu :</strong> {{ tourney.location }}
        </p>
        <p class="text-base text-light-form-text dark:text-dark-form-text mb-2">
          <strong>Date :</strong> {{ formatDate(tourney.dateTourney) }}
        </p>

        <!-- Informations Supplémentaires sur deux colonnes -->
        <div class="mt-6">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p
                class="text-base text-light-form-text dark:text-dark-form-text"
              >
                <strong>Utilisateurs Inscrits :</strong> {{ counts.users }}
              </p>
              <p
                class="text-base text-light-form-text dark:text-dark-form-text"
              >
                <strong>Terrains :</strong> {{ counts.fields }}
              </p>
              <p
                class="text-base text-light-form-text dark:text-dark-form-text"
              >
                <strong>Sports :</strong> {{ counts.sports }}
              </p>
            </div>
            <div>
              <p
                class="text-base text-light-form-text dark:text-dark-form-text"
              >
                <strong>Équipes :</strong> {{ counts.teams }}
              </p>
              <p
                class="text-base text-light-form-text dark:text-dark-form-text"
              >
                <strong>Pools :</strong> {{ counts.pools }}
              </p>
            </div>
          </div>
        </div>

        <!-- Liste des Sports -->
        <div class="mt-6">
          <h3
            class="text-2xl font-semibold mb-2 text-light-form-text dark:text-dark-form-text"
          >
            Liste des Sports
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="sport in sports"
              :key="sport.id"
              class="flex items-center"
            >
              <span
                class="w-4 h-4 rounded-full mr-2"
                :style="{ backgroundColor: sport.color }"
              ></span>
              <span
                class="text-base text-light-form-text dark:text-dark-form-text"
                >{{ sport.name }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Carte OpenStreetMap -->
      <div class="rounded-lg shadow-lg p-4 sm:h-[50vh] h-[300px] mt-8 md:mt-0">
        <div
          v-if="!coordinatesAreValid"
          class="text-sm text-red-500 mt-2 text-center"
        >
          Les coordonnées ne sont pas valides, la carte affiche un lieu par
          défaut (FR) .
        </div>
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
        <!-- Bouton sous la carte -->
        <div class="mt-4 flex justify-end relative z-30">
          <!-- Bouton Télécharger Excel -->
          <ButtonComponent
            v-if="tourney.status !== 'draft'"
            @click="downloadExcel"
            variant="success"
            fontAwesomeIcon="file-excel"
            class="flex items-center space-x-1"
          >
            <span>Télécharger Planning</span>
          </ButtonComponent>
          <ButtonComponent
            :variant="'info'"
            fontAwesomeIcon="map-marker-alt"
            @click="openGoogleMaps"
          >
            Itinéraire
            <span class="hidden sm:inline"> Avec Google Maps</span>
          </ButtonComponent>
        </div>
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
      <p class="text-base text-light-form-text dark:text-dark-form-text mb-4">
        Une bonne pratique pour une configuration fluide : Si N terrains, créez
        N*4 Teams et N Pools afin d'avoir un bon tournus. Variez la taille des
        équipes pour accueillir plus de monde.
      </p>
      <!-- Texte explicatif de base -->
      <div v-if="!showExample">
        <p class="text-base text-light-form-text dark:text-dark-form-text mb-4">
          Pour configurer votre tournoi, suivez ces étapes clés :
        </p>
        <ol
          class="list-decimal list-inside mb-4 space-y-2 text-light-form-text dark:text-dark-form-text"
        >
          <li>
            <strong>Terrains</strong> : Ajoutez vos terrains dans l'onglet
            Terrains.
          </li>
          <li>
            <strong>Sports</strong> : Assignez les sports aux terrains dans
            l'onglet Assignation.
          </li>
          <li>
            <strong>Inscriptions</strong> : Configurez les équipes et ouvrez les
            inscriptions.
          </li>
          <li>
            <strong>Pools</strong> : Créez les pools et assignez les équipes.
          </li>
          <li><strong>Planning</strong> : Générez le planning des matchs.</li>
        </ol>

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
            <strong>Planning</strong> pour générer le planning des matchs, et
            utilisez les outils de générations pour créer un planning équilibré.
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

  // Importation des composants
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import StatusSelectorComponent from '@/components/StatusSelectorComponent.vue';
  import CompletedIcon from '@/components/icons/CompletedIcon.vue';
  import PendingIcon from '@/components/icons/PendingIcon.vue';
  import ActiveIcon from '@/components/icons/ActiveIcon.vue';
  import DraftIcon from '@/components/icons/DraftIcon.vue';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      LMap,
      LTileLayer,
      LMarker,
      LPopup,
      TourneySubMenu,
      CompletedIcon,
      PendingIcon,
      ActiveIcon,
      DraftIcon,
      ButtonComponent,
      StatusSelectorComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
        tourney: {}, // Détails du tournoi récupérés du serveur
        currentStepNumber: 1, // Pour gérer l'étape actuelle en nombre
        mapIsReady: false,
        showExample: false, // Affichage de l'exemple pratique
        statusSteps: [
          { label: 'Terrains', status: '' },
          { label: 'Sports', status: '' },
          { label: 'Inscriptions', status: '' },
          { label: 'Pools', status: '' },
          { label: 'Planning', status: '' },
        ],
        sports: [],
        counts: {
          users: 0,
          fields: 0,
          sports: 0,
          teams: 0,
          pools: 0,
        },
      };
    },
    async mounted() {
      await this.fetchTourneyDetails(); // Récupère les détails du tournoi depuis l'API
      this.mapIsReady = true; // Initialisation de la carte une fois les détails récupérés
    },
    methods: {
      // Mapper les actions du module `tourney`
      ...mapActions('tourney', ['fetchTourneyStatuses', 'setTournamentName']),

      /**
       * Récupère les détails du tournoi depuis l'API.
       * Le backend calcule les statistiques et les détails du tournoi.
       * @returns {Promise<void>}
       */
      async fetchTourneyDetails() {
        try {
          // Récupérer les statuts
          await this.fetchTourneyStatuses(this.tourneyId);

          // Récupérer les détails du tournoi
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/details`
          );
          this.tourney = response.data.tourney;
          this.counts = response.data.counts;
          this.sports = response.data.sports;

          // Mettre à jour les statuts des étapes
          this.updateStatusSteps();
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des détails du tournoi:',
            error
          );
          // Afficher un message d'erreur à l'utilisateur
        }
      },
      /**
       * Formate la date au format lisible.
       * @param {String} dateString - La date en format ISO.
       * @returns {String} - La date formatée.
       */
      formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
      },
      /**
       * Gère le changement d'onglet
       * @param {String} tab - L'onglet sélectionné.
       */
      selectTab(tab) {
        this.activeTab = tab;
      },
      /**
       * Met à jour les statuts des étapes du tournoi.
       */
      updateStatusSteps() {
        const {
          fieldAssignmentStatus,
          sportAssignmentStatus,
          registrationStatus,
          poolStatus,
          planningStatus,
        } = this.tourney;

        this.statusSteps = [
          { label: 'Terrains', status: fieldAssignmentStatus },
          { label: 'Sports', status: sportAssignmentStatus },
          { label: 'Inscriptions', status: registrationStatus },
          { label: 'Pools', status: poolStatus },
          { label: 'Planning', status: planningStatus },
        ];
      },
      /**
       * Détermine les classes CSS pour la barre de progression en fonction du statut de l'étape.
       * @param {String} status - Le statut de l'étape.
       * @returns {String} - Les classes CSS à appliquer.
       */
      progressBarClass(status) {
        switch (status) {
          case 'completed':
            return 'bg-light-details-completed dark:bg-dark-details-completed';
          case 'active':
            return 'bg-light-details-active dark:bg-dark-details-active';
          case 'draft':
            return 'bg-light-details-inProgress dark:bg-dark-details-inProgress';
          default:
            return 'bg-light-details-notStarted dark:bg-dark-details-notStarted';
        }
      },
      /**
       * Détermine les classes CSS pour le texte de l'étape.
       * @param {String} status - Le statut de l'étape.
       * @returns {String} - Les classes CSS à appliquer.
       */
      stepTextClass(status) {
        if (status === 'completed') {
          return 'text-light-details-completed dark:text-dark-details-completed';
        } else if (status === 'active') {
          return 'text-light-details-active dark:text-dark-details-active';
        } else if (status === 'draft') {
          return 'text-light-details-inProgress dark:text-dark-details-inProgress';
        } else {
          return 'text-light-details-notStarted dark:text-dark-details-notStarted';
        }
      },
      /**
       * Retourne le texte du statut de l'étape.
       * @param {String} status - Le statut de l'étape.
       * @returns {String} - Le texte à afficher.
       */
      stepStatusText(status, label) {
        if (status === 'completed') {
          return 'Complété';
        } else if (status === 'active') {
          return 'En cours';
        } else if (status === 'draft') {
          if (label === 'Inscriptions') {
            return 'Fermées';
          }
          return 'Brouillon';
        } else {
          return 'En attente';
        }
      },
      /**
       * Retourne le composant icône approprié en fonction du statut.
       * @param {String} status - Le statut de l'étape.
       * @returns {Component} - Le composant icône.
       */
      stepIconComponent(status) {
        if (status === 'completed') {
          return 'CompletedIcon';
        } else if (status === 'active') {
          return 'ActiveIcon';
        } else if (status === 'draft') {
          return 'DraftIcon';
        } else {
          return 'PendingIcon';
        }
      },
      openGoogleMaps() {
        const url = this.googleMapsLink;
        window.open(url, '_blank');
      },

      /**
       * Télécharge le planning du tournoi au format Excel.
       * Utilise l'API pour récupérer le fichier Excel et le télécharger.
       */
      async downloadExcel() {
        let toastId;
        try {
          // Afficher un toast indiquant que le téléchargement démarre
          toastId = toast.info('Téléchargement du fichier en cours...', {
            autoClose: false, // Empêche la fermeture automatique
          });
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/export-data/excel`,
            {
              responseType: 'blob', // Demander un blob pour le téléchargement de fichiers
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
          // Mettre à jour le toast pour indiquer que le téléchargement est terminé
          toast.update(toastId, {
            render: 'Téléchargement terminé avec succès !',
            type: 'success',
            autoClose: 2000, // Fermeture automatique après 2 secondes
          });
        } catch (error) {
          toast.update(toastId, {
            render:
              error.message ||
              "Une erreur s'est produite lors du téléchargement.",
            type: 'error',
            autoClose: 2000, // Fermeture automatique après 2 secondes
          });
          console.error('Erreur lors du téléchargement Excel :', error);
        }
      },
    },
    computed: {
      ...mapState('tourney', {
        statuses: (state) => state.statuses,
      }),

      /**
       * Latitude de la carte OpenStreetMap.
       * @returns {Number} - La latitude.
       * @default 46.8069
       * @see https://www.openstreetmap.org/#map=12/46.8069/7.1611
       */
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

      /**
       * Latitude de la carte OpenStreetMap.
       * @returns {Number} - La latitude.
       */
      mapLatitude() {
        return this.coordinatesAreValid ? this.tourney.latitude : 46.8065;
      },

      /**
       * Longitude de la carte OpenStreetMap.
       * @returns {Number} - La longitude.
       */
      mapLongitude() {
        return this.coordinatesAreValid ? this.tourney.longitude : 7.1619;
      },

      /**
       * Génère le lien Google Maps vers l'emplacement du tournoi.
       * @returns {String} - L'URL vers Google Maps.
       */
      googleMapsLink() {
        if (this.coordinatesAreValid) {
          const lat = this.tourney.latitude;
          const lng = this.tourney.longitude;
          return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        } else {
          // Lien vers Fribourg par défaut si les coordonnées ne sont pas valides
          return 'https://www.google.com/maps/dir/?api=1&destination=46.8065,7.1619';
        }
      },

      /**
       * Vérifie si toutes les étapes sont complétées.
       * @returns {Boolean} - Vrai si toutes les étapes sont complétées.
       */
      allStepsCompleted() {
        return this.statusSteps.every((step) => step.status === 'completed');
      },
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
